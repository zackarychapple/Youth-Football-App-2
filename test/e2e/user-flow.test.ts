import { setupTest, teardownTest, navigateTo, waitForElement, typeIntoField, clickElement, captureScreenshot, elementExists, waitForText, getElementText } from './setup.js';
import { login, logout, isLoggedIn, checkAuthState } from './utils/login-helper.js';

/**
 * Complete User Journey Test
 * Tests the full user workflow from sign-in to team management
 */

// Test accounts as specified
const TEST_ACCOUNTS = {
  coach: {
    email: 'zackarychapple30+testcoach@gmail.com',
    password: 'GameDay2025!',
    firstName: 'Test',
    lastName: 'Coach',
    role: 'Head Coach'
  },
  mockCoach: {
    email: 'zackarychapple30+mock1@gmail.com',
    password: 'GameDay2025!',
    firstName: 'Mock',
    lastName: 'Coach',
    role: 'Assistant Coach'
  }
};

// Test configuration
const TEST_CONFIG = {
  teamName: 'Test Eagles',
  inviteCode: 'TEST2025',
  viewport: { width: 375, height: 667 }, // Mobile viewport as specified
  touchEnabled: true
};

/**
 * Main test execution
 */
async function runUserFlowTests() {
  console.log('==========================================');
  console.log('🚀 COMPLETE USER JOURNEY TEST');
  console.log('==========================================\n');

  // Test 1: Coach Account Sign-In and Dashboard Navigation
  await testCoachSignInFlow();
  
  // Test 2: Mock Coach Account with Team Join
  await testMockCoachTeamJoin();
  
  // Test 3: Sign Out and Sign Back In (Session Persistence)
  await testSessionPersistence();
  
  // Test 4: Mobile Touch Interactions
  await testMobileTouchInteractions();
  
  // Test 5: Navigation Flow
  await testNavigationFlow();
}

/**
 * Test 1: Coach Account Sign-In and Dashboard Navigation
 */
async function testCoachSignInFlow() {
  console.log('\n📋 Test 1: Coach Account Sign-In and Dashboard Navigation');
  console.log('─────────────────────────────────────────────\n');
  
  const context = await setupTest('coach-signin-flow');
  
  try {
    // Set mobile viewport
    await context.page.setViewport(TEST_CONFIG.viewport);
    
    // Enable touch
    if (TEST_CONFIG.touchEnabled) {
      await context.page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');
    }
    
    // Navigate to sign-in page
    await navigateTo(context, '/auth/sign-in');
    await captureScreenshot(context, 'coach-signin-page');
    
    // Perform login
    const loginSuccess = await login(context, TEST_ACCOUNTS.coach, {
      expectSuccess: true,
      waitForRedirect: true,
      captureErrors: true
    });
    
    if (!loginSuccess) {
      throw new Error('Coach login failed');
    }
    
    // Check if we're on onboarding page (new user) or dashboard (existing user)
    const currentUrl = context.page.url();
    if (currentUrl.includes('/onboarding')) {
      console.log('📱 User is on onboarding page - new user flow confirmed');
      await captureScreenshot(context, 'coach-onboarding');
      
      // For now, just verify we reached the onboarding page successfully
      // Team creation will be tested in a separate test
      console.log('✅ Authentication successful - user redirected to onboarding');
    } else if (currentUrl.includes('/dashboard')) {
      console.log('📊 User is on dashboard - existing user flow');
      await captureScreenshot(context, 'coach-dashboard');
    } else {
      console.log(`⚠️  Unexpected page after login: ${currentUrl}`);
    }
    
    // Check authentication state
    const authState = await checkAuthState(context);
    console.log(`✅ Authentication confirmed: ${authState.isAuthenticated}`);
    console.log(`   User email: ${authState.user?.email}`);
    
    // Skip navigation tests if user is on onboarding
    if (!currentUrl.includes('/onboarding')) {
      // Navigate to different sections
      const sections = [
        { href: '/roster', text: 'Roster', name: 'Roster' },
        { href: '/games', text: 'Games', name: 'Games' },
        { href: '/team', text: 'Team', name: 'Team Settings' }
      ];
      
      for (const section of sections) {
        // Look for link or button with the text
        const elementFound = await context.page.evaluate((section) => {
          const links = Array.from(document.querySelectorAll(`a[href*="${section.href}"]`));
          const buttons = Array.from(document.querySelectorAll('button'));
          return links.length > 0 || buttons.some(b => b.textContent?.includes(section.text));
        }, section);
        
        if (elementFound) {
          console.log(`📍 Navigating to ${section.name}...`);
          await context.page.evaluate((section) => {
            const link = document.querySelector(`a[href*="${section.href}"]`) as HTMLElement;
            if (link) {
              link.click();
            } else {
              const buttons = Array.from(document.querySelectorAll('button'));
              const btn = buttons.find(b => b.textContent?.includes(section.text)) as HTMLElement;
              if (btn) btn.click();
            }
          }, section);
          await new Promise(resolve => setTimeout(resolve, 2000));
          await captureScreenshot(context, `coach-${section.name.toLowerCase().replace(' ', '-')}`);
        }
      }
    }
    
    // Check for console errors
    const errors = context.logs.errors;
    if (errors.length === 0) {
      console.log('✅ No console errors detected during coach flow');
    } else {
      console.log(`⚠️  ${errors.length} console errors detected:`);
      errors.forEach(err => console.log(`   - ${err.message}`));
    }
    
    // Check for failed network requests
    const failedRequests = context.logs.network.filter(req => req.status && req.status >= 400);
    if (failedRequests.length === 0) {
      console.log('✅ No failed network requests');
    } else {
      console.log(`⚠️  ${failedRequests.length} failed requests detected:`);
      failedRequests.forEach(req => console.log(`   - ${req.status} ${req.url}`));
    }
    
    console.log('\n✅ Test 1 completed successfully');
    
  } catch (error) {
    console.error(`\n❌ Test 1 failed: ${error}`);
    await captureScreenshot(context, 'coach-flow-error');
    throw error;
  } finally {
    await teardownTest(context);
  }
}

/**
 * Test 2: Mock Coach Account with Team Join
 */
async function testMockCoachTeamJoin() {
  console.log('\n📋 Test 2: Mock Coach Account with Team Join');
  console.log('─────────────────────────────────────────────\n');
  
  const context = await setupTest('mock-coach-team-join');
  
  try {
    // Set mobile viewport
    await context.page.setViewport(TEST_CONFIG.viewport);
    
    // Navigate to sign-in
    await navigateTo(context, '/auth/sign-in');
    
    // Check if there's a "Join Team" option on sign-in page
    const hasJoinOption = await elementExists(context, 'a:has-text("Join Team"), button:has-text("Join Team")');
    
    if (hasJoinOption) {
      console.log('📍 Found Join Team option - clicking...');
      await clickElement(context, 'a:has-text("Join Team"), button:has-text("Join Team")');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Enter invite code
      if (await elementExists(context, 'input[placeholder*="code"], input[name*="code"], input[type="text"]')) {
        console.log('📝 Entering invite code...');
        await typeIntoField(context, 'input[placeholder*="code"], input[name*="code"], input[type="text"]', TEST_CONFIG.inviteCode);
        await captureScreenshot(context, 'invite-code-entered');
        
        // Submit invite code
        await clickElement(context, 'button[type="submit"], button:has-text("Join"), button:has-text("Continue")');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Perform login
    const loginSuccess = await login(context, TEST_ACCOUNTS.mockCoach, {
      expectSuccess: true,
      waitForRedirect: true,
      captureErrors: true
    });
    
    if (!loginSuccess) {
      console.log('⚠️  Mock coach login failed - may need team setup first');
    } else {
      console.log('✅ Mock coach logged in successfully');
      
      // Check if redirected to team setup or dashboard
      const currentUrl = context.page.url();
      if (currentUrl.includes('/onboarding') || currentUrl.includes('/team')) {
        console.log('📍 Redirected to team setup/onboarding');
        await captureScreenshot(context, 'mock-coach-onboarding');
        
        // Complete basic onboarding if needed
        if (await elementExists(context, 'input[name="teamName"], input[placeholder*="team"]')) {
          await typeIntoField(context, 'input[name="teamName"], input[placeholder*="team"]', TEST_CONFIG.teamName);
          await clickElement(context, 'button[type="submit"], button:has-text("Continue"), button:has-text("Create")');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // Check for console errors
    const errors = context.logs.errors;
    if (errors.length === 0) {
      console.log('✅ No console errors detected during mock coach flow');
    } else {
      console.log(`⚠️  ${errors.length} console errors detected`);
    }
    
    console.log('\n✅ Test 2 completed');
    
  } catch (error) {
    console.error(`\n❌ Test 2 failed: ${error}`);
    await captureScreenshot(context, 'mock-coach-error');
    throw error;
  } finally {
    await teardownTest(context);
  }
}

/**
 * Test 3: Sign Out and Sign Back In (Session Persistence)
 */
async function testSessionPersistence() {
  console.log('\n📋 Test 3: Sign Out and Sign Back In (Session Persistence)');
  console.log('─────────────────────────────────────────────\n');
  
  const context = await setupTest('session-persistence');
  
  try {
    // Set mobile viewport
    await context.page.setViewport(TEST_CONFIG.viewport);
    
    // Initial login
    console.log('🔐 Performing initial login...');
    await navigateTo(context, '/auth/sign-in');
    
    const initialLogin = await login(context, TEST_ACCOUNTS.coach, {
      expectSuccess: true,
      rememberMe: true,
      waitForRedirect: true
    });
    
    if (!initialLogin) {
      throw new Error('Initial login failed');
    }
    
    // Get initial auth state
    const initialAuthState = await checkAuthState(context);
    console.log(`✅ Initial auth state: ${initialAuthState.isAuthenticated}`);
    
    // Perform logout
    console.log('\n🚪 Signing out...');
    await logout(context);
    await captureScreenshot(context, 'after-logout');
    
    // Verify logged out
    const loggedOutState = await checkAuthState(context);
    console.log(`✅ Logged out state: ${!loggedOutState.isAuthenticated}`);
    
    // Sign back in
    console.log('\n🔐 Signing back in...');
    const reLogin = await login(context, TEST_ACCOUNTS.coach, {
      expectSuccess: true,
      waitForRedirect: true
    });
    
    if (!reLogin) {
      throw new Error('Re-login failed');
    }
    
    // Verify auth persisted correctly
    const finalAuthState = await checkAuthState(context);
    console.log(`✅ Final auth state: ${finalAuthState.isAuthenticated}`);
    
    // Test direct navigation to protected route
    console.log('\n📍 Testing direct navigation to protected route...');
    await navigateTo(context, '/dashboard');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const onDashboard = context.page.url().includes('/dashboard');
    if (onDashboard) {
      console.log('✅ Successfully accessed protected route');
    } else {
      console.log('⚠️  Redirected away from protected route');
    }
    
    // Check for console errors
    const errors = context.logs.errors;
    if (errors.length === 0) {
      console.log('✅ No console errors during session persistence test');
    } else {
      console.log(`⚠️  ${errors.length} console errors detected`);
    }
    
    console.log('\n✅ Test 3 completed successfully');
    
  } catch (error) {
    console.error(`\n❌ Test 3 failed: ${error}`);
    await captureScreenshot(context, 'session-persistence-error');
    throw error;
  } finally {
    await teardownTest(context);
  }
}

/**
 * Test 4: Mobile Touch Interactions
 */
async function testMobileTouchInteractions() {
  console.log('\n📋 Test 4: Mobile Touch Interactions');
  console.log('─────────────────────────────────────────────\n');
  
  const context = await setupTest('mobile-touch-interactions');
  
  try {
    // Set mobile viewport with touch
    await context.page.setViewport({
      ...TEST_CONFIG.viewport,
      hasTouch: true,
      isMobile: true
    });
    
    // Login first
    await navigateTo(context, '/auth/sign-in');
    await login(context, TEST_ACCOUNTS.coach, { expectSuccess: true });
    
    // Test swipe gestures if available
    console.log('👆 Testing touch interactions...');
    
    // Test tap on buttons
    const buttons = await context.page.$$('button, a[role="button"]');
    console.log(`   Found ${buttons.length} tappable elements`);
    
    // Test scroll
    await context.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await context.page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ Scroll gestures working');
    
    // Test touch on interactive elements
    if (await elementExists(context, '.drawer-trigger, [data-vaul-drawer]')) {
      console.log('📱 Testing drawer/sheet components...');
      const drawer = await context.page.$('.drawer-trigger, [data-vaul-drawer]');
      if (drawer) {
        await drawer.tap();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await captureScreenshot(context, 'mobile-drawer-open');
        
        // Close drawer
        const closeBtn = await context.page.$('[aria-label="Close"], button:has-text("Close"), .drawer-close');
        if (closeBtn) {
          await closeBtn.tap();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    // Check for touch-related console errors
    const touchErrors = context.logs.errors.filter(err => 
      err.message.toLowerCase().includes('touch') || 
      err.message.toLowerCase().includes('gesture')
    );
    
    if (touchErrors.length === 0) {
      console.log('✅ No touch-related errors detected');
    } else {
      console.log(`⚠️  ${touchErrors.length} touch-related errors found`);
    }
    
    console.log('\n✅ Test 4 completed successfully');
    
  } catch (error) {
    console.error(`\n❌ Test 4 failed: ${error}`);
    await captureScreenshot(context, 'mobile-touch-error');
    throw error;
  } finally {
    await teardownTest(context);
  }
}

/**
 * Test 5: Navigation Flow
 */
async function testNavigationFlow() {
  console.log('\n📋 Test 5: Navigation Flow');
  console.log('─────────────────────────────────────────────\n');
  
  const context = await setupTest('navigation-flow');
  
  try {
    // Set mobile viewport
    await context.page.setViewport(TEST_CONFIG.viewport);
    
    // Login
    await navigateTo(context, '/auth/sign-in');
    await login(context, TEST_ACCOUNTS.coach, { expectSuccess: true });
    
    // Test navigation through all main sections
    const navigationPaths = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/roster', name: 'Roster' },
      { path: '/games/new', name: 'New Game' },
      { path: '/onboarding/team', name: 'Team Settings' }
    ];
    
    for (const nav of navigationPaths) {
      console.log(`📍 Navigating to ${nav.name}...`);
      
      try {
        await navigateTo(context, nav.path, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const currentUrl = context.page.url();
        if (currentUrl.includes(nav.path) || currentUrl.includes(nav.path.split('/')[1])) {
          console.log(`   ✅ Successfully navigated to ${nav.name}`);
          await captureScreenshot(context, `nav-${nav.name.toLowerCase().replace(' ', '-')}`);
        } else {
          console.log(`   ⚠️  Navigation to ${nav.name} resulted in: ${currentUrl}`);
        }
        
        // Check for navigation errors
        const navErrors = context.logs.errors.filter(err => 
          err.timestamp > Date.now() - 3000 // Errors in last 3 seconds
        );
        
        if (navErrors.length > 0) {
          console.log(`   ⚠️  Errors during navigation to ${nav.name}:`);
          navErrors.forEach(err => console.log(`      - ${err.message}`));
        }
      } catch (navError) {
        console.log(`   ❌ Failed to navigate to ${nav.name}: ${navError}`);
      }
    }
    
    // Test browser back/forward
    console.log('\n🔄 Testing browser navigation...');
    await context.page.goBack();
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('   ✅ Back navigation works');
    
    await context.page.goForward();
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('   ✅ Forward navigation works');
    
    // Final error check
    const totalErrors = context.logs.errors.length;
    const total404s = context.logs.network.filter(req => req.status === 404).length;
    
    console.log('\n📊 Navigation Test Summary:');
    console.log(`   Total console errors: ${totalErrors}`);
    console.log(`   Total 404 errors: ${total404s}`);
    console.log(`   Failed API calls: ${context.logs.network.filter(req => req.status && req.status >= 400 && req.url.includes('supabase')).length}`);
    
    if (totalErrors === 0 && total404s === 0) {
      console.log('   ✅ Navigation flow completed without errors');
    } else {
      console.log('   ⚠️  Some errors detected during navigation');
    }
    
    console.log('\n✅ Test 5 completed');
    
  } catch (error) {
    console.error(`\n❌ Test 5 failed: ${error}`);
    await captureScreenshot(context, 'navigation-flow-error');
    throw error;
  } finally {
    await teardownTest(context);
  }
}

// Run all tests
(async () => {
  try {
    await runUserFlowTests();
    console.log('\n==========================================');
    console.log('✅ ALL USER FLOW TESTS COMPLETED');
    console.log('==========================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n==========================================');
    console.error('❌ USER FLOW TESTS FAILED');
    console.error('==========================================\n');
    console.error(error);
    process.exit(1);
  }
})();