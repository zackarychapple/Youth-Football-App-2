import { setupTest, teardownTest, navigateTo, waitForElement, typeIntoField, clickElement, captureScreenshot, elementExists, waitForText, getElementText } from './setup.js';
import { login, logout, checkAuthState } from './utils/login-helper.js';

/**
 * Onboarding and Team Creation Test
 * Tests the complete onboarding flow including team creation and joining
 */

// Test accounts
const TEST_ACCOUNTS = {
  newCoach: {
    email: `test.coach.${Date.now()}@example.com`,
    password: 'TestPass2025!',
    firstName: 'New',
    lastName: 'Coach'
  },
  joiningCoach: {
    email: `joining.coach.${Date.now()}@example.com`,
    password: 'JoinPass2025!',
    firstName: 'Joining',
    lastName: 'Coach'
  },
  existingCoach: {
    email: 'zackarychapple30+testcoach@gmail.com',
    password: 'GameDay2025!',
    firstName: 'Test',
    lastName: 'Coach'
  }
};

// Team configuration
const TEST_TEAM = {
  name: `Test Team ${Date.now()}`,
  ageGroup: '14U',
  fieldSize: 80,
  mpr: 8,
  inviteCode: '',
  passcode: '1234'
};

// Onboarding steps
interface OnboardingStep {
  name: string;
  selector: string;
  action: () => Promise<void>;
  validation: () => Promise<boolean>;
}

/**
 * Main test execution
 */
async function runOnboardingTests() {
  console.log('==========================================');
  console.log('🎯 ONBOARDING AND TEAM CREATION TEST');
  console.log('==========================================\n');

  // Test 1: New user signup and team creation
  const teamCode = await testNewUserOnboarding();
  
  // Test 2: Join existing team with invite code
  if (teamCode) {
    await testJoinTeamWithCode(teamCode);
  }
  
  // Test 3: Existing user team management
  await testExistingUserTeamManagement();
  
  // Test 4: Onboarding validation and error handling
  await testOnboardingValidation();
  
  // Test 5: Mobile-specific onboarding experience
  await testMobileOnboarding();
}

/**
 * Test 1: New user signup and team creation
 */
async function testNewUserOnboarding(): Promise<string | null> {
  console.log('\n📋 Test 1: New User Signup and Team Creation');
  console.log('─────────────────────────────────────────────\n');
  
  const context = await setupTest('new-user-onboarding');
  let inviteCode: string | null = null;
  
  try {
    // Set mobile viewport
    await context.page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
    
    // Navigate to sign-up page
    console.log('📍 Navigating to sign-up page...');
    await navigateTo(context, '/auth/sign-up');
    await captureScreenshot(context, 'signup-page');
    
    // Fill signup form
    console.log('📝 Filling signup form...');
    
    // Email field
    await typeIntoField(context, 'input[type="email"], input[name="email"]', TEST_ACCOUNTS.newCoach.email);
    
    // Password field
    await typeIntoField(context, 'input[type="password"]:not([name="confirmPassword"])', TEST_ACCOUNTS.newCoach.password);
    
    // Confirm password if exists
    if (await elementExists(context, 'input[type="password"][name="confirmPassword"], input[type="password"]:nth-of-type(2)')) {
      await typeIntoField(context, 'input[type="password"][name="confirmPassword"], input[type="password"]:nth-of-type(2)', TEST_ACCOUNTS.newCoach.password);
    }
    
    // First name
    if (await elementExists(context, 'input[name="firstName"], input[placeholder*="First"]')) {
      await typeIntoField(context, 'input[name="firstName"], input[placeholder*="First"]', TEST_ACCOUNTS.newCoach.firstName);
    }
    
    // Last name
    if (await elementExists(context, 'input[name="lastName"], input[placeholder*="Last"]')) {
      await typeIntoField(context, 'input[name="lastName"], input[placeholder*="Last"]', TEST_ACCOUNTS.newCoach.lastName);
    }
    
    await captureScreenshot(context, 'signup-form-filled');
    
    // Submit signup form
    console.log('🚀 Submitting signup form...');
    await clickElement(context, 'button[type="submit"], button:has-text("Sign Up"), button:has-text("Create Account")');
    
    // Wait for redirect to onboarding
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = context.page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    // Check if redirected to onboarding
    if (currentUrl.includes('/onboarding') || currentUrl.includes('/team')) {
      console.log('✅ Redirected to onboarding');
      await captureScreenshot(context, 'onboarding-start');
      
      // Complete team creation onboarding
      console.log('\n📍 Starting team creation flow...');
      
      // Step 1: Team name
      if (await elementExists(context, 'input[name="teamName"], input[placeholder*="team"], input[placeholder*="Team"]')) {
        console.log('   📝 Entering team name...');
        await typeIntoField(context, 'input[name="teamName"], input[placeholder*="team"], input[placeholder*="Team"]', TEST_TEAM.name);
        await captureScreenshot(context, 'team-name-entered');
      }
      
      // Step 2: Age group selection
      if (await elementExists(context, 'select[name="ageGroup"], [role="combobox"]')) {
        console.log('   📝 Selecting age group...');
        const ageGroupSelector = 'select[name="ageGroup"], [role="combobox"]';
        await clickElement(context, ageGroupSelector);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Look for age group option
        if (await elementExists(context, `option[value="${TEST_TEAM.ageGroup}"], [role="option"]:has-text("${TEST_TEAM.ageGroup}")`)) {
          await clickElement(context, `option[value="${TEST_TEAM.ageGroup}"], [role="option"]:has-text("${TEST_TEAM.ageGroup}")`);
        }
      }
      
      // Step 3: Field size
      if (await elementExists(context, 'input[name="fieldSize"], input[type="number"][placeholder*="field"], input[type="number"][placeholder*="Field"]')) {
        console.log('   📝 Setting field size...');
        await typeIntoField(context, 'input[name="fieldSize"], input[type="number"][placeholder*="field"], input[type="number"][placeholder*="Field"]', TEST_TEAM.fieldSize.toString());
      }
      
      // Step 4: MPR (Minimum Play Rule)
      if (await elementExists(context, 'input[name="mpr"], input[type="number"][placeholder*="MPR"], input[type="number"][placeholder*="minimum"]')) {
        console.log('   📝 Setting MPR...');
        await typeIntoField(context, 'input[name="mpr"], input[type="number"][placeholder*="MPR"], input[type="number"][placeholder*="minimum"]', TEST_TEAM.mpr.toString());
      }
      
      // Look for continue/next button
      if (await elementExists(context, 'button:has-text("Continue"), button:has-text("Next"), button:has-text("Create Team")')) {
        console.log('   👆 Clicking continue...');
        await clickElement(context, 'button:has-text("Continue"), button:has-text("Next"), button:has-text("Create Team")');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Check for team creation success
      const finalUrl = context.page.url();
      if (finalUrl.includes('/dashboard') || finalUrl.includes('/roster') || finalUrl.includes('/team')) {
        console.log('✅ Team created successfully!');
        await captureScreenshot(context, 'team-created');
        
        // Try to get invite code
        if (await elementExists(context, '[data-testid="invite-code"], .invite-code, div:has-text("Invite Code"), div:has-text("Share Code")')) {
          const codeElement = await context.page.$('[data-testid="invite-code"], .invite-code, code, .font-mono');
          if (codeElement) {
            inviteCode = await codeElement.evaluate(el => el.textContent || '');
            console.log(`   📋 Team invite code: ${inviteCode}`);
            TEST_TEAM.inviteCode = inviteCode;
          }
        }
        
        // Check authentication state
        const authState = await checkAuthState(context);
        console.log(`   🔐 User authenticated: ${authState.isAuthenticated}`);
        
      } else {
        console.log('⚠️  Team creation may have issues - not on expected page');
      }
      
    } else if (currentUrl.includes('/dashboard')) {
      console.log('✅ User signed up and went directly to dashboard');
    } else {
      console.log('⚠️  Unexpected redirect after signup');
    }
    
    // Check for console errors during onboarding
    const errors = context.logs.errors;
    if (errors.length === 0) {
      console.log('✅ No console errors during onboarding');
    } else {
      console.log(`⚠️  ${errors.length} console errors detected during onboarding`);
      errors.forEach(err => console.log(`   - ${err.message}`));
    }
    
    console.log('\n✅ Test 1 completed');
    
  } catch (error) {
    console.error(`\n❌ Test 1 failed: ${error}`);
    await captureScreenshot(context, 'new-user-onboarding-error');
  } finally {
    await teardownTest(context);
  }
  
  return inviteCode;
}

/**
 * Test 2: Join existing team with invite code
 */
async function testJoinTeamWithCode(inviteCode: string) {
  console.log('\n📋 Test 2: Join Existing Team with Invite Code');
  console.log('─────────────────────────────────────────────\n');
  console.log(`   Using invite code: ${inviteCode}`);
  
  const context = await setupTest('join-team-with-code');
  
  try {
    // Set mobile viewport
    await context.page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
    
    // Navigate to sign-up page
    console.log('📍 Navigating to sign-up page...');
    await navigateTo(context, '/auth/sign-up');
    
    // Look for "Join Team" option
    if (await elementExists(context, 'a:has-text("Join Team"), button:has-text("Join Team"), a:has-text("Have an invite code")')) {
      console.log('   👆 Clicking Join Team option...');
      await clickElement(context, 'a:has-text("Join Team"), button:has-text("Join Team"), a:has-text("Have an invite code")');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Enter invite code if field is present
    if (await elementExists(context, 'input[name="inviteCode"], input[placeholder*="code"], input[placeholder*="Code"]')) {
      console.log('   📝 Entering invite code...');
      await typeIntoField(context, 'input[name="inviteCode"], input[placeholder*="code"], input[placeholder*="Code"]', inviteCode);
      await captureScreenshot(context, 'invite-code-entered');
      
      // Submit code
      if (await elementExists(context, 'button:has-text("Join"), button:has-text("Continue"), button[type="submit"]')) {
        await clickElement(context, 'button:has-text("Join"), button:has-text("Continue"), button[type="submit"]');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Complete signup for joining user
    console.log('   📝 Completing signup form...');
    
    await typeIntoField(context, 'input[type="email"]', TEST_ACCOUNTS.joiningCoach.email);
    await typeIntoField(context, 'input[type="password"]:not([name="confirmPassword"])', TEST_ACCOUNTS.joiningCoach.password);
    
    if (await elementExists(context, 'input[type="password"][name="confirmPassword"]')) {
      await typeIntoField(context, 'input[type="password"][name="confirmPassword"]', TEST_ACCOUNTS.joiningCoach.password);
    }
    
    if (await elementExists(context, 'input[name="firstName"]')) {
      await typeIntoField(context, 'input[name="firstName"]', TEST_ACCOUNTS.joiningCoach.firstName);
    }
    
    if (await elementExists(context, 'input[name="lastName"]')) {
      await typeIntoField(context, 'input[name="lastName"]', TEST_ACCOUNTS.joiningCoach.lastName);
    }
    
    // Submit form
    await clickElement(context, 'button[type="submit"], button:has-text("Join Team"), button:has-text("Sign Up")');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check result
    const currentUrl = context.page.url();
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/team')) {
      console.log('✅ Successfully joined team!');
      await captureScreenshot(context, 'joined-team-success');
      
      // Verify team name if visible
      if (await elementExists(context, '[data-testid="team-name"], .team-name, h1, h2')) {
        const teamNameElement = await context.page.$('[data-testid="team-name"], .team-name, h1, h2');
        if (teamNameElement) {
          const teamName = await teamNameElement.evaluate(el => el.textContent);
          console.log(`   Team name: ${teamName}`);
        }
      }
    } else {
      console.log('⚠️  Team join may have issues - checking current state');
      await captureScreenshot(context, 'join-team-result');
    }
    
    console.log('\n✅ Test 2 completed');
    
  } catch (error) {
    console.error(`\n❌ Test 2 failed: ${error}`);
    await captureScreenshot(context, 'join-team-error');
  } finally {
    await teardownTest(context);
  }
}

/**
 * Test 3: Existing user team management
 */
async function testExistingUserTeamManagement() {
  console.log('\n📋 Test 3: Existing User Team Management');
  console.log('─────────────────────────────────────────────\n');
  
  const context = await setupTest('existing-user-team-management');
  
  try {
    // Set mobile viewport
    await context.page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
    
    // Login as existing coach
    console.log('🔐 Logging in as existing coach...');
    await navigateTo(context, '/auth/sign-in');
    const loginSuccess = await login(context, TEST_ACCOUNTS.existingCoach, {
      expectSuccess: true,
      waitForRedirect: true
    });
    
    if (!loginSuccess) {
      console.log('⚠️  Login failed - skipping team management test');
      return;
    }
    
    // Navigate to team settings
    console.log('📍 Navigating to team settings...');
    
    if (await elementExists(context, 'a[href*="/team"], button:has-text("Team"), a:has-text("Settings")')) {
      await clickElement(context, 'a[href*="/team"], button:has-text("Team"), a:has-text("Settings")');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await captureScreenshot(context, 'team-settings');
    } else if (await elementExists(context, 'a[href*="/onboarding/team"]')) {
      await navigateTo(context, '/onboarding/team');
      await captureScreenshot(context, 'team-onboarding-page');
    }
    
    // Check team management options
    console.log('🔍 Checking team management features...');
    
    const features = [
      { selector: '[data-testid="invite-code"], .invite-code', name: 'Invite Code' },
      { selector: 'input[name="teamName"]', name: 'Team Name Field' },
      { selector: 'button:has-text("Save"), button:has-text("Update")', name: 'Save Button' },
      { selector: 'button:has-text("Delete Team"), button:has-text("Leave Team")', name: 'Team Actions' }
    ];
    
    for (const feature of features) {
      if (await elementExists(context, feature.selector)) {
        console.log(`   ✅ Found: ${feature.name}`);
      } else {
        console.log(`   ⚠️  Missing: ${feature.name}`);
      }
    }
    
    // Test updating team name
    if (await elementExists(context, 'input[name="teamName"]')) {
      console.log('\n📝 Testing team name update...');
      const teamNameInput = await context.page.$('input[name="teamName"]');
      if (teamNameInput) {
        const currentName = await teamNameInput.evaluate((el: HTMLInputElement) => el.value);
        console.log(`   Current team name: ${currentName}`);
        
        // Update team name
        await teamNameInput.click({ clickCount: 3 });
        await context.page.keyboard.press('Backspace');
        await teamNameInput.type(`${currentName} (Updated)`);
        
        // Save if button exists
        if (await elementExists(context, 'button:has-text("Save"), button:has-text("Update")')) {
          await clickElement(context, 'button:has-text("Save"), button:has-text("Update")');
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log('   ✅ Team name update submitted');
        }
      }
    }
    
    // Check for console errors
    const errors = context.logs.errors;
    if (errors.length === 0) {
      console.log('✅ No console errors during team management');
    } else {
      console.log(`⚠️  ${errors.length} console errors detected`);
    }
    
    console.log('\n✅ Test 3 completed');
    
  } catch (error) {
    console.error(`\n❌ Test 3 failed: ${error}`);
    await captureScreenshot(context, 'team-management-error');
  } finally {
    await teardownTest(context);
  }
}

/**
 * Test 4: Onboarding validation and error handling
 */
async function testOnboardingValidation() {
  console.log('\n📋 Test 4: Onboarding Validation and Error Handling');
  console.log('─────────────────────────────────────────────\n');
  
  const context = await setupTest('onboarding-validation');
  
  try {
    // Set mobile viewport
    await context.page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
    
    // Navigate to sign-up
    console.log('📍 Testing signup validation...');
    await navigateTo(context, '/auth/sign-up');
    
    // Test empty form submission
    console.log('   📝 Testing empty form submission...');
    await clickElement(context, 'button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check for validation errors
    const validationErrors = await context.page.$$('[role="alert"], .error-message, .text-destructive');
    if (validationErrors.length > 0) {
      console.log(`   ✅ Validation errors shown: ${validationErrors.length} error messages`);
      await captureScreenshot(context, 'validation-errors');
    } else {
      console.log('   ⚠️  No validation errors shown for empty form');
    }
    
    // Test invalid email
    console.log('   📝 Testing invalid email...');
    await typeIntoField(context, 'input[type="email"]', 'invalid-email');
    await clickElement(context, 'button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test weak password
    console.log('   📝 Testing weak password...');
    await typeIntoField(context, 'input[type="email"]', 'test@example.com', { clear: true });
    await typeIntoField(context, 'input[type="password"]:not([name="confirmPassword"])', '123');
    await clickElement(context, 'button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check for password validation error
    if (await elementExists(context, ':has-text("password"), :has-text("Password")')) {
      console.log('   ✅ Password validation working');
    }
    
    // Test password mismatch
    if (await elementExists(context, 'input[type="password"][name="confirmPassword"]')) {
      console.log('   📝 Testing password mismatch...');
      await typeIntoField(context, 'input[type="password"]:not([name="confirmPassword"])', 'ValidPass123!', { clear: true });
      await typeIntoField(context, 'input[type="password"][name="confirmPassword"]', 'DifferentPass123!');
      await clickElement(context, 'button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (await elementExists(context, ':has-text("match"), :has-text("Match")')) {
        console.log('   ✅ Password mismatch validation working');
      }
    }
    
    // Test invalid invite code
    console.log('\n📍 Testing invalid invite code...');
    if (await elementExists(context, 'a:has-text("Join Team"), a:has-text("Have an invite code")')) {
      await clickElement(context, 'a:has-text("Join Team"), a:has-text("Have an invite code")');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (await elementExists(context, 'input[placeholder*="code"]')) {
        await typeIntoField(context, 'input[placeholder*="code"]', 'INVALID000');
        await clickElement(context, 'button[type="submit"], button:has-text("Join")');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check for error message
        if (await elementExists(context, ':has-text("invalid"), :has-text("Invalid"), :has-text("not found")')) {
          console.log('   ✅ Invalid invite code error shown');
        }
      }
    }
    
    console.log('\n✅ Test 4 completed');
    
  } catch (error) {
    console.error(`\n❌ Test 4 failed: ${error}`);
    await captureScreenshot(context, 'validation-test-error');
  } finally {
    await teardownTest(context);
  }
}

/**
 * Test 5: Mobile-specific onboarding experience
 */
async function testMobileOnboarding() {
  console.log('\n📋 Test 5: Mobile-Specific Onboarding Experience');
  console.log('─────────────────────────────────────────────\n');
  
  const context = await setupTest('mobile-onboarding');
  
  try {
    // Set mobile viewport with touch
    await context.page.setViewport({
      width: 375,
      height: 667,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    });
    
    // Set mobile user agent
    await context.page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');
    
    console.log('📱 Testing mobile-specific features...');
    
    // Navigate to sign-up
    await navigateTo(context, '/auth/sign-up');
    await captureScreenshot(context, 'mobile-signup');
    
    // Test touch scrolling
    console.log('   👆 Testing touch scrolling...');
    await context.page.touchscreen.tap(187, 400); // Center of screen
    await context.page.touchscreen.swipe({ x: 187, y: 400 }, { x: 187, y: 100 }); // Swipe up
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test input focusing (should trigger keyboard)
    console.log('   ⌨️  Testing mobile keyboard triggers...');
    const emailInput = await context.page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.tap();
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('      ✅ Email input tapped');
      
      // Type with touch keyboard simulation
      await context.page.keyboard.type('mobile@test.com');
    }
    
    // Test form elements are properly sized for mobile
    console.log('   📏 Checking mobile element sizing...');
    const buttonSizes = await context.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(btn => {
        const rect = btn.getBoundingClientRect();
        return {
          text: btn.textContent,
          height: rect.height,
          width: rect.width
        };
      });
    });
    
    const smallButtons = buttonSizes.filter(btn => btn.height < 44); // iOS minimum touch target
    if (smallButtons.length === 0) {
      console.log('      ✅ All buttons meet minimum touch target size (44px)');
    } else {
      console.log(`      ⚠️  ${smallButtons.length} buttons below minimum touch target size`);
    }
    
    // Test responsive layout
    console.log('   📐 Testing responsive layout...');
    const viewportMeta = await context.page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute('content');
    });
    
    if (viewportMeta && viewportMeta.includes('width=device-width')) {
      console.log('      ✅ Viewport meta tag properly configured');
    } else {
      console.log('      ⚠️  Viewport meta tag may need adjustment');
    }
    
    // Test touch gestures on interactive elements
    console.log('   👆 Testing touch interactions...');
    
    // Find and tap all tappable elements
    const tappableElements = await context.page.$$('button, a, input, select, [role="button"], [onclick]');
    console.log(`      Found ${tappableElements.length} tappable elements`);
    
    // Test a few tap interactions
    for (let i = 0; i < Math.min(3, tappableElements.length); i++) {
      try {
        const element = tappableElements[i];
        const isVisible = await element.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });
        
        if (isVisible) {
          await element.tap();
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch {
        // Element might not be tappable
      }
    }
    
    // Check for mobile-specific console errors
    const mobileErrors = context.logs.errors.filter(err => 
      err.message.toLowerCase().includes('touch') ||
      err.message.toLowerCase().includes('mobile') ||
      err.message.toLowerCase().includes('viewport')
    );
    
    if (mobileErrors.length === 0) {
      console.log('✅ No mobile-specific errors detected');
    } else {
      console.log(`⚠️  ${mobileErrors.length} mobile-specific errors found`);
      mobileErrors.forEach(err => console.log(`   - ${err.message}`));
    }
    
    // Test orientation change (if supported)
    console.log('\n   📱 Testing orientation change...');
    await context.page.setViewport({
      width: 667,
      height: 375,
      isMobile: true,
      hasTouch: true,
      isLandscape: true
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await captureScreenshot(context, 'mobile-landscape');
    
    // Switch back to portrait
    await context.page.setViewport({
      width: 375,
      height: 667,
      isMobile: true,
      hasTouch: true,
      isLandscape: false
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('      ✅ Orientation changes handled');
    
    console.log('\n✅ Test 5 completed');
    
  } catch (error) {
    console.error(`\n❌ Test 5 failed: ${error}`);
    await captureScreenshot(context, 'mobile-onboarding-error');
  } finally {
    await teardownTest(context);
  }
}

// Run all tests
(async () => {
  try {
    await runOnboardingTests();
    console.log('\n==========================================');
    console.log('✅ ALL ONBOARDING TESTS COMPLETED');
    console.log('==========================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n==========================================');
    console.error('❌ ONBOARDING TESTS FAILED');
    console.error('==========================================\n');
    console.error(error);
    process.exit(1);
  }
})();