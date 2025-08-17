import { setupTest, teardownTest, navigateTo, captureScreenshot, waitForElement, typeIntoField, clickElement, elementExists } from './setup.js';
import { testUsers, generateTestData } from './fixtures/users.js';
import { login, logout, isLoggedIn, getErrorMessage, testPasswordReset, checkAuthState } from './utils/login-helper.js';

/**
 * Authentication E2E Tests
 * Priority 0 - Critical Path Tests
 */

// Test configuration
const TEST_TIMEOUT = 30000;

/**
 * Test 1: Valid Login with Head Coach Account
 * This test will help identify console errors during login
 */
async function testValidLogin() {
  console.log('\n========================================');
  console.log('TEST: Valid Login with Head Coach Account');
  console.log('========================================\n');
  
  const context = await setupTest('valid-login');
  
  try {
    // Attempt login with valid credentials
    const success = await login(context, testUsers.headCoach, {
      expectSuccess: true,
      captureErrors: true,
      waitForRedirect: true,
      rememberMe: true
    });
    
    if (success) {
      console.log('✅ TEST PASSED: User successfully logged in');
      
      // Verify we're on the dashboard
      const currentUrl = context.page.url();
      console.log(`   Current URL: ${currentUrl}`);
      
      // Check auth state
      const authState = await checkAuthState(context);
      console.log(`   Auth State: ${JSON.stringify(authState, null, 2)}`);
      
      // Check for team information
      if (await elementExists(context, '[data-testid="team-name"]')) {
        const teamName = await context.page.$eval('[data-testid="team-name"]', el => el.textContent);
        console.log(`   Team: ${teamName}`);
      }
    } else {
      console.log('❌ TEST FAILED: Login was not successful');
      
      // Get detailed error information
      const errorMsg = await getErrorMessage(context);
      if (errorMsg) {
        console.log(`   Error message: ${errorMsg}`);
      }
      
      // Print console errors
      if (context.logs.errors.length > 0) {
        console.log('\n   Console Errors Detected:');
        context.logs.errors.forEach((error, i) => {
          console.log(`   ${i + 1}. [${error.source}] ${error.message}`);
        });
      }
      
      // Print failed network requests
      const failedRequests = context.logs.network.filter(req => req.status && req.status >= 400);
      if (failedRequests.length > 0) {
        console.log('\n   Failed Network Requests:');
        failedRequests.forEach((req, i) => {
          console.log(`   ${i + 1}. ${req.method} ${req.url} - Status: ${req.status}`);
        });
      }
    }
    
    return success;
  } catch (error) {
    console.error(`❌ TEST ERROR: ${error}`);
    await captureScreenshot(context, 'test-error');
    return false;
  } finally {
    await teardownTest(context);
  }
}

/**
 * Test 2: Invalid Login Credentials
 */
async function testInvalidLogin() {
  console.log('\n========================================');
  console.log('TEST: Invalid Login Credentials');
  console.log('========================================\n');
  
  const context = await setupTest('invalid-login');
  
  try {
    // Attempt login with invalid credentials
    const success = await login(context, testUsers.invalidUser, {
      expectSuccess: false,
      captureErrors: true
    });
    
    if (!success) {
      console.log('✅ TEST PASSED: Invalid login was correctly rejected');
      
      // Verify error message is displayed
      const errorMsg = await getErrorMessage(context);
      if (errorMsg) {
        console.log(`   Error message shown: ${errorMsg}`);
      } else {
        console.log('⚠️  Warning: No error message displayed to user');
      }
    } else {
      console.log('❌ TEST FAILED: Invalid credentials were accepted');
    }
    
    return !success; // Test passes if login fails
  } catch (error) {
    console.error(`❌ TEST ERROR: ${error}`);
    return false;
  } finally {
    await teardownTest(context);
  }
}

/**
 * Test 3: Password Reset Flow
 */
async function testPasswordResetFlow() {
  console.log('\n========================================');
  console.log('TEST: Password Reset Flow');
  console.log('========================================\n');
  
  const context = await setupTest('password-reset');
  
  try {
    const success = await testPasswordReset(context, testUsers.headCoach.email);
    
    if (success) {
      console.log('✅ TEST PASSED: Password reset email sent successfully');
    } else {
      console.log('❌ TEST FAILED: Password reset flow failed');
      
      // Check for console errors
      if (context.logs.errors.length > 0) {
        console.log('\n   Console Errors:');
        context.logs.errors.forEach((error, i) => {
          console.log(`   ${i + 1}. ${error.message}`);
        });
      }
    }
    
    return success;
  } catch (error) {
    console.error(`❌ TEST ERROR: ${error}`);
    return false;
  } finally {
    await teardownTest(context);
  }
}

/**
 * Test 4: Sign Out Flow
 */
async function testSignOutFlow() {
  console.log('\n========================================');
  console.log('TEST: Sign Out Flow');
  console.log('========================================\n');
  
  const context = await setupTest('sign-out');
  
  try {
    // First login
    console.log('Step 1: Login with valid credentials');
    const loginSuccess = await login(context, testUsers.headCoach);
    
    if (!loginSuccess) {
      console.log('❌ TEST FAILED: Could not login to test logout');
      return false;
    }
    
    // Wait a moment for session to establish
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Then logout
    console.log('Step 2: Perform logout');
    await logout(context);
    
    // Verify we're logged out
    const loggedIn = await isLoggedIn(context);
    
    if (!loggedIn) {
      console.log('✅ TEST PASSED: User successfully logged out');
      
      // Verify we're back at login page
      const currentUrl = context.page.url();
      if (currentUrl.includes('/auth/sign-in') || currentUrl.includes('/signin')) {
        console.log('   Redirected to login page correctly');
      }
    } else {
      console.log('❌ TEST FAILED: User still appears to be logged in');
    }
    
    return !loggedIn;
  } catch (error) {
    console.error(`❌ TEST ERROR: ${error}`);
    return false;
  } finally {
    await teardownTest(context);
  }
}

/**
 * Test 5: Remember Me Functionality
 */
async function testRememberMe() {
  console.log('\n========================================');
  console.log('TEST: Remember Me Functionality');
  console.log('========================================\n');
  
  const context = await setupTest('remember-me');
  
  try {
    // Login with remember me checked
    console.log('Step 1: Login with Remember Me checked');
    const loginSuccess = await login(context, testUsers.headCoach, {
      rememberMe: true
    });
    
    if (!loginSuccess) {
      console.log('❌ TEST FAILED: Initial login failed');
      return false;
    }
    
    // Get cookies/localStorage
    const storageData = await context.page.evaluate(() => {
      return {
        localStorage: { ...window.localStorage },
        sessionStorage: { ...window.sessionStorage }
      };
    });
    
    console.log('Step 2: Check for persistent session data');
    const hasPersistedAuth = Object.keys(storageData.localStorage).some(key => 
      key.includes('supabase') || key.includes('auth')
    );
    
    if (hasPersistedAuth) {
      console.log('✅ TEST PASSED: Auth data persisted in localStorage');
    } else {
      console.log('⚠️  Warning: No persistent auth data found');
    }
    
    return loginSuccess && hasPersistedAuth;
  } catch (error) {
    console.error(`❌ TEST ERROR: ${error}`);
    return false;
  } finally {
    await teardownTest(context);
  }
}

/**
 * Test 6: Session Persistence on Refresh
 */
async function testSessionPersistence() {
  console.log('\n========================================');
  console.log('TEST: Session Persistence on Refresh');
  console.log('========================================\n');
  
  const context = await setupTest('session-persistence');
  
  try {
    // Login first
    console.log('Step 1: Login with valid credentials');
    const loginSuccess = await login(context, testUsers.headCoach);
    
    if (!loginSuccess) {
      console.log('❌ TEST FAILED: Initial login failed');
      return false;
    }
    
    // Wait for session to establish
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Refresh the page
    console.log('Step 2: Refresh the page');
    await context.page.reload({ waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if still logged in
    console.log('Step 3: Check if still logged in');
    const stillLoggedIn = await isLoggedIn(context);
    const authState = await checkAuthState(context);
    
    if (stillLoggedIn && authState.isAuthenticated) {
      console.log('✅ TEST PASSED: Session persisted after refresh');
      console.log(`   User: ${authState.user?.email}`);
    } else {
      console.log('❌ TEST FAILED: Session lost after refresh');
      const currentUrl = context.page.url();
      console.log(`   Current URL: ${currentUrl}`);
    }
    
    return stillLoggedIn;
  } catch (error) {
    console.error(`❌ TEST ERROR: ${error}`);
    return false;
  } finally {
    await teardownTest(context);
  }
}

/**
 * Main test runner
 */
async function runAuthTests() {
  console.log('\n🏁 Starting Authentication E2E Tests\n');
  console.log('Target URL: http://localhost:3000');
  console.log('Test Suite: Authentication\n');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: 0,
    tests: [] as { name: string; result: boolean; duration: number }[]
  };
  
  // Define test suite
  const tests = [
    { name: 'Valid Login', fn: testValidLogin },
    { name: 'Invalid Login', fn: testInvalidLogin },
    { name: 'Password Reset', fn: testPasswordResetFlow },
    { name: 'Sign Out', fn: testSignOutFlow },
    { name: 'Remember Me', fn: testRememberMe },
    { name: 'Session Persistence', fn: testSessionPersistence }
  ];
  
  // Run each test
  for (const test of tests) {
    const startTime = Date.now();
    
    try {
      const passed = await test.fn();
      const duration = Date.now() - startTime;
      
      results.tests.push({ name: test.name, result: passed, duration });
      
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.error(`\n❌ Test "${test.name}" threw an error: ${error}`);
      results.errors++;
      results.tests.push({ 
        name: test.name, 
        result: false, 
        duration: Date.now() - startTime 
      });
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print summary
  console.log('\n========================================');
  console.log('TEST SUITE SUMMARY');
  console.log('========================================\n');
  console.log(`Total Tests: ${tests.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`💥 Errors: ${results.errors}`);
  console.log('\nDetailed Results:');
  
  results.tests.forEach((test, i) => {
    const icon = test.result ? '✅' : '❌';
    console.log(`${i + 1}. ${icon} ${test.name} (${test.duration}ms)`);
  });
  
  const allPassed = results.failed === 0 && results.errors === 0;
  
  if (allPassed) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the logs above.');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runAuthTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  });
}

export { runAuthTests };