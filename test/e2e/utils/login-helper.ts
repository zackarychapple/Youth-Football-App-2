import { TestContext, navigateTo, typeIntoField, clickElement, waitForElement, elementExists, waitForText, captureScreenshot } from '../setup.js';
import { TestUser } from '../fixtures/users.js';

/**
 * Login Helper Utilities
 * Provides reusable functions for authentication testing
 */

export interface LoginOptions {
  expectSuccess?: boolean;
  captureErrors?: boolean;
  waitForRedirect?: boolean;
  rememberMe?: boolean;
}

/**
 * Perform login with given credentials
 */
export async function login(
  context: TestContext,
  user: TestUser,
  options: LoginOptions = {}
): Promise<boolean> {
  const {
    expectSuccess = true,
    captureErrors = true,
    waitForRedirect = true,
    rememberMe = false
  } = options;

  console.log(`\n🔐 Attempting login for: ${user.email}`);
  
  try {
    // Navigate to sign-in page
    await navigateTo(context, '/auth/sign-in');
    
    // Wait for form to load
    await waitForElement(context, 'input[type="email"]', { timeout: 5000 });
    
    // Fill in email
    await typeIntoField(context, 'input[type="email"]', user.email, { clear: true });
    
    // Fill in password
    await typeIntoField(context, 'input[type="password"]', user.password, { clear: true });
    
    // Check remember me if requested
    if (rememberMe) {
      const rememberCheckbox = await elementExists(context, 'input[type="checkbox"]#rememberMe');
      if (rememberCheckbox) {
        await clickElement(context, 'input[type="checkbox"]#rememberMe');
      }
    }
    
    // Take screenshot before submit
    await captureScreenshot(context, 'login-form-filled');
    
    // Clear previous errors from log
    const errorCountBefore = context.logs.errors.length;
    
    // Submit form
    await clickElement(context, 'button[type="submit"]');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (expectSuccess) {
      // Check for successful redirect to dashboard
      if (waitForRedirect) {
        try {
          await context.page.waitForNavigation({ 
            waitUntil: 'networkidle2',
            timeout: 10000 
          });
        } catch (navError) {
          console.log('⚠️  Navigation timeout - checking current URL');
        }
      }
      
      const currentUrl = context.page.url();
      const isDashboard = currentUrl.includes('/dashboard');
      
      if (isDashboard) {
        console.log('✅ Login successful - redirected to dashboard');
        await captureScreenshot(context, 'login-success');
        return true;
      } else {
        console.log(`❌ Login failed - still on: ${currentUrl}`);
        
        // Check for error messages
        const errorMessage = await getErrorMessage(context);
        if (errorMessage) {
          console.log(`   Error message: ${errorMessage}`);
        }
        
        // Check for new console errors
        const newErrors = context.logs.errors.slice(errorCountBefore);
        if (newErrors.length > 0) {
          console.log('   Console errors detected:');
          newErrors.forEach(err => console.log(`     - ${err.message}`));
        }
        
        if (captureErrors) {
          await captureScreenshot(context, 'login-failed');
        }
        
        return false;
      }
    } else {
      // We expect failure
      const errorMessage = await getErrorMessage(context);
      if (errorMessage) {
        console.log(`✅ Expected login failure - Error: ${errorMessage}`);
        return false;
      } else {
        console.log('⚠️  Expected error message but none found');
        return false;
      }
    }
  } catch (error) {
    console.error(`❌ Login process error: ${error}`);
    if (captureErrors) {
      await captureScreenshot(context, 'login-error');
    }
    throw error;
  }
}

/**
 * Perform logout
 */
export async function logout(context: TestContext): Promise<void> {
  console.log('🚪 Logging out...');
  
  try {
    // Look for logout button/menu
    const logoutSelector = 'button:has-text("Sign Out"), a:has-text("Sign Out"), button:has-text("Logout"), a:has-text("Logout")';
    
    if (await elementExists(context, logoutSelector)) {
      await clickElement(context, logoutSelector);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Confirm we're back at login
      const currentUrl = context.page.url();
      if (currentUrl.includes('/auth/sign-in') || currentUrl.includes('/signin')) {
        console.log('✅ Logout successful');
      } else {
        console.log(`⚠️  Logout completed but unexpected URL: ${currentUrl}`);
      }
    } else {
      console.log('⚠️  Logout button not found - navigating directly to sign-in');
      await navigateTo(context, '/auth/sign-in');
    }
  } catch (error) {
    console.error(`❌ Logout error: ${error}`);
    throw error;
  }
}

/**
 * Check if user is currently logged in
 */
export async function isLoggedIn(context: TestContext): Promise<boolean> {
  const currentUrl = context.page.url();
  
  // Check URL patterns
  if (currentUrl.includes('/dashboard') || currentUrl.includes('/game') || currentUrl.includes('/team')) {
    return true;
  }
  
  if (currentUrl.includes('/auth/') || currentUrl.includes('/signin') || currentUrl.includes('/login')) {
    return false;
  }
  
  // Check for auth elements
  const hasLogoutButton = await elementExists(context, 'button:has-text("Sign Out"), a:has-text("Sign Out")');
  const hasLoginForm = await elementExists(context, 'input[type="email"], input[type="password"]');
  
  return hasLogoutButton && !hasLoginForm;
}

/**
 * Get error message from login form
 */
export async function getErrorMessage(context: TestContext): Promise<string | null> {
  try {
    // Common error message selectors
    const errorSelectors = [
      '[role="alert"]',
      '.text-destructive',
      '.error-message',
      '.alert-error',
      'div:has-text("error")',
      'div:has-text("invalid")',
      'div:has-text("incorrect")'
    ];
    
    for (const selector of errorSelectors) {
      if (await elementExists(context, selector)) {
        const element = await context.page.$(selector);
        if (element) {
          const text = await element.evaluate(el => el.textContent);
          if (text && text.trim().length > 0) {
            return text.trim();
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting error message: ${error}`);
    return null;
  }
}

/**
 * Test password reset flow
 */
export async function testPasswordReset(
  context: TestContext,
  email: string
): Promise<boolean> {
  console.log(`\n🔑 Testing password reset for: ${email}`);
  
  try {
    // Navigate to forgot password page
    await navigateTo(context, '/auth/forgot-password');
    
    // Fill in email
    await typeIntoField(context, 'input[type="email"]', email);
    
    // Submit form
    await clickElement(context, 'button[type="submit"]');
    
    // Wait for success message
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for success message
    const successSelectors = [
      'div:has-text("email sent")',
      'div:has-text("check your email")',
      'div:has-text("reset link")',
      '[role="alert"]:has-text("success")'
    ];
    
    for (const selector of successSelectors) {
      if (await elementExists(context, selector)) {
        console.log('✅ Password reset email sent successfully');
        return true;
      }
    }
    
    // Check for error
    const errorMessage = await getErrorMessage(context);
    if (errorMessage) {
      console.log(`❌ Password reset failed: ${errorMessage}`);
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Password reset error: ${error}`);
    return false;
  }
}

/**
 * Test signup flow with team creation
 */
export async function testSignupWithTeam(
  context: TestContext,
  user: TestUser & { teamName?: string }
): Promise<boolean> {
  console.log(`\n📝 Testing signup for: ${user.email}`);
  
  try {
    // Navigate to signup page
    await navigateTo(context, '/auth/sign-up');
    
    // Fill in user details
    await typeIntoField(context, 'input[type="email"]', user.email);
    await typeIntoField(context, 'input[type="password"]', user.password);
    
    // Fill in name if fields exist
    if (await elementExists(context, 'input[name="firstName"]')) {
      await typeIntoField(context, 'input[name="firstName"]', user.firstName || 'Test');
    }
    
    if (await elementExists(context, 'input[name="lastName"]')) {
      await typeIntoField(context, 'input[name="lastName"]', user.lastName || 'User');
    }
    
    // Fill in team name if field exists
    if (user.teamName && await elementExists(context, 'input[name="teamName"]')) {
      await typeIntoField(context, 'input[name="teamName"]', user.teamName);
    }
    
    // Submit form
    await clickElement(context, 'button[type="submit"]');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for success (redirect to dashboard or team setup)
    const currentUrl = context.page.url();
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/team') || currentUrl.includes('/onboarding')) {
      console.log('✅ Signup successful');
      return true;
    }
    
    // Check for errors
    const errorMessage = await getErrorMessage(context);
    if (errorMessage) {
      console.log(`❌ Signup failed: ${errorMessage}`);
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Signup error: ${error}`);
    return false;
  }
}

/**
 * Check authentication state via API
 */
export async function checkAuthState(context: TestContext): Promise<{
  isAuthenticated: boolean;
  user?: any;
  session?: any;
}> {
  try {
    // Execute JavaScript in browser context to check Supabase session
    const authState = await context.page.evaluate(() => {
      // Try to access Supabase from window or localStorage
      const localStorage = window.localStorage;
      const sessionKey = Object.keys(localStorage).find(key => 
        key.includes('supabase') && key.includes('auth')
      );
      
      if (sessionKey) {
        try {
          const sessionData = JSON.parse(localStorage.getItem(sessionKey) || '{}');
          return {
            isAuthenticated: !!sessionData.access_token,
            user: sessionData.user,
            session: sessionData
          };
        } catch {
          return { isAuthenticated: false };
        }
      }
      
      return { isAuthenticated: false };
    });
    
    return authState;
  } catch (error) {
    console.error(`Error checking auth state: ${error}`);
    return { isAuthenticated: false };
  }
}

/**
 * Wait for successful authentication
 */
export async function waitForAuth(
  context: TestContext,
  timeout: number = 10000
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const authState = await checkAuthState(context);
    if (authState.isAuthenticated) {
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return false;
}

export default {
  login,
  logout,
  isLoggedIn,
  getErrorMessage,
  testPasswordReset,
  testSignupWithTeam,
  checkAuthState,
  waitForAuth
};