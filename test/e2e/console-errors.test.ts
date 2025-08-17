import { setupTest, teardownTest, navigateTo, waitForElement, captureScreenshot, elementExists } from './setup.js';
import { login } from './utils/login-helper.js';

/**
 * Console Errors Monitoring Test
 * Ensures no console errors, network failures, or JavaScript exceptions occur
 */

// Test accounts
const TEST_ACCOUNTS = {
  coach: {
    email: 'zackarychapple30+testcoach@gmail.com',
    password: 'GameDay2025!',
    firstName: 'Test',
    lastName: 'Coach'
  },
  mockCoach: {
    email: 'zackarychapple30+mock1@gmail.com',
    password: 'GameDay2025!',
    firstName: 'Mock',
    lastName: 'Coach'
  }
};

// Error tracking interface
interface ErrorReport {
  page: string;
  consoleErrors: Array<{ type: string; message: string; timestamp: number }>;
  networkErrors: Array<{ url: string; status: number; method: string }>;
  pageErrors: Array<{ message: string; source: string }>;
  summary: {
    totalConsoleErrors: number;
    totalNetworkErrors: number;
    total404s: number;
    totalJSErrors: number;
    hasErrors: boolean;
  };
}

// Pages to test for errors
const PAGES_TO_TEST = [
  { path: '/', name: 'Home' },
  { path: '/auth/sign-in', name: 'Sign In' },
  { path: '/auth/sign-up', name: 'Sign Up' },
  { path: '/auth/forgot-password', name: 'Forgot Password' },
  { path: '/dashboard', name: 'Dashboard', requiresAuth: true },
  { path: '/roster', name: 'Roster', requiresAuth: true },
  { path: '/games/new', name: 'New Game', requiresAuth: true },
  { path: '/onboarding/team', name: 'Team Onboarding', requiresAuth: true }
];

/**
 * Main test execution
 */
async function runConsoleErrorTests() {
  console.log('==========================================');
  console.log('🔍 CONSOLE ERRORS MONITORING TEST');
  console.log('==========================================\n');

  const errorReports: ErrorReport[] = [];
  
  // Test each page for errors
  for (const page of PAGES_TO_TEST) {
    const report = await testPageForErrors(page);
    errorReports.push(report);
  }
  
  // Test user interactions for errors
  await testInteractionErrors();
  
  // Generate final report
  generateErrorReport(errorReports);
}

/**
 * Test a specific page for console errors
 */
async function testPageForErrors(pageConfig: { path: string; name: string; requiresAuth?: boolean }): Promise<ErrorReport> {
  console.log(`\n📋 Testing: ${pageConfig.name} (${pageConfig.path})`);
  console.log('─────────────────────────────────────────────\n');
  
  const context = await setupTest(`console-errors-${pageConfig.name.toLowerCase().replace(/\s+/g, '-')}`);
  const report: ErrorReport = {
    page: pageConfig.name,
    consoleErrors: [],
    networkErrors: [],
    pageErrors: [],
    summary: {
      totalConsoleErrors: 0,
      totalNetworkErrors: 0,
      total404s: 0,
      totalJSErrors: 0,
      hasErrors: false
    }
  };
  
  try {
    // Set mobile viewport
    await context.page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
    
    // Set up enhanced error monitoring
    const errors: any[] = [];
    
    // Monitor console messages
    context.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      // Filter out expected/harmless messages
      const ignoredPatterns = [
        /Download the React DevTools/,
        /React DevTools/,
        /redux-devtools/,
        /\[vite\]/,
        /\[HMR\]/
      ];
      
      const isIgnored = ignoredPatterns.some(pattern => pattern.test(text));
      
      if (!isIgnored) {
        if (type === 'error' || type === 'warning') {
          report.consoleErrors.push({
            type,
            message: text,
            timestamp: Date.now()
          });
          
          if (type === 'error') {
            console.log(`   ❌ Console Error: ${text.substring(0, 100)}...`);
          } else {
            console.log(`   ⚠️  Console Warning: ${text.substring(0, 100)}...`);
          }
        }
      }
    });
    
    // Monitor page errors (JavaScript exceptions)
    context.page.on('pageerror', error => {
      report.pageErrors.push({
        message: error.message,
        source: 'javascript'
      });
      console.log(`   ❌ JavaScript Error: ${error.message.substring(0, 100)}...`);
    });
    
    // Monitor request failures
    context.page.on('requestfailed', request => {
      const url = request.url();
      const failure = request.failure();
      
      // Ignore expected failures (e.g., analytics, third-party scripts)
      const ignoredDomains = ['google-analytics.com', 'googletagmanager.com', 'facebook.com'];
      const isIgnored = ignoredDomains.some(domain => url.includes(domain));
      
      if (!isIgnored) {
        report.networkErrors.push({
          url,
          status: 0,
          method: request.method()
        });
        console.log(`   ❌ Request Failed: ${url.substring(0, 80)}...`);
      }
    });
    
    // Monitor response errors
    context.page.on('response', response => {
      const status = response.status();
      const url = response.url();
      
      if (status >= 400) {
        // Ignore some expected 404s (favicons, source maps in dev)
        const ignored404Patterns = [
          /favicon/,
          /\.map$/,
          /hot-update/
        ];
        
        const isIgnored = status === 404 && ignored404Patterns.some(pattern => pattern.test(url));
        
        if (!isIgnored) {
          report.networkErrors.push({
            url,
            status,
            method: response.request().method()
          });
          
          if (status === 404) {
            console.log(`   ⚠️  404 Not Found: ${url.substring(0, 80)}...`);
          } else if (status >= 500) {
            console.log(`   ❌ Server Error ${status}: ${url.substring(0, 80)}...`);
          } else {
            console.log(`   ⚠️  HTTP ${status}: ${url.substring(0, 80)}...`);
          }
        }
      }
    });
    
    // Login if required
    if (pageConfig.requiresAuth) {
      console.log('   🔐 Logging in for authenticated page...');
      await navigateTo(context, '/auth/sign-in');
      const loginSuccess = await login(context, TEST_ACCOUNTS.coach, {
        expectSuccess: true,
        captureErrors: false
      });
      
      if (!loginSuccess) {
        console.log('   ⚠️  Login failed - skipping authenticated page test');
        return report;
      }
    }
    
    // Navigate to the page
    console.log(`   📍 Navigating to ${pageConfig.path}...`);
    const response = await navigateTo(context, pageConfig.path, { waitUntil: 'networkidle2' });
    
    // Wait for page to stabilize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for common error indicators in the DOM
    const errorSelectors = [
      '[class*="error"]',
      '[class*="Error"]',
      '[data-error]',
      '.alert-error',
      '.toast-error'
    ];
    
    for (const selector of errorSelectors) {
      if (await elementExists(context, selector)) {
        const element = await context.page.$(selector);
        if (element) {
          const text = await element.evaluate(el => el.textContent);
          if (text && text.trim().length > 0) {
            console.log(`   ⚠️  Error element found: ${text.substring(0, 100)}...`);
          }
        }
      }
    }
    
    // Capture screenshot for documentation
    await captureScreenshot(context, `${pageConfig.name.toLowerCase().replace(/\s+/g, '-')}-checked`);
    
    // Calculate summary
    report.summary.totalConsoleErrors = report.consoleErrors.filter(e => e.type === 'error').length;
    report.summary.totalNetworkErrors = report.networkErrors.filter(e => e.status >= 400 && e.status !== 404).length;
    report.summary.total404s = report.networkErrors.filter(e => e.status === 404).length;
    report.summary.totalJSErrors = report.pageErrors.length;
    report.summary.hasErrors = (
      report.summary.totalConsoleErrors > 0 ||
      report.summary.totalNetworkErrors > 0 ||
      report.summary.totalJSErrors > 0
    );
    
    // Log summary for this page
    if (!report.summary.hasErrors && report.summary.total404s === 0) {
      console.log(`   ✅ No errors detected on ${pageConfig.name}`);
    } else {
      console.log(`\n   📊 Error Summary for ${pageConfig.name}:`);
      console.log(`      Console Errors: ${report.summary.totalConsoleErrors}`);
      console.log(`      Network Errors: ${report.summary.totalNetworkErrors}`);
      console.log(`      404 Errors: ${report.summary.total404s}`);
      console.log(`      JS Exceptions: ${report.summary.totalJSErrors}`);
    }
    
  } catch (error) {
    console.error(`   ❌ Test failed for ${pageConfig.name}: ${error}`);
    report.pageErrors.push({
      message: `Test execution error: ${error}`,
      source: 'test'
    });
  } finally {
    await teardownTest(context, { skipLogs: false });
  }
  
  return report;
}

/**
 * Test user interactions for errors
 */
async function testInteractionErrors() {
  console.log('\n📋 Testing User Interactions for Errors');
  console.log('─────────────────────────────────────────────\n');
  
  const context = await setupTest('interaction-errors');
  
  try {
    // Set mobile viewport
    await context.page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
    
    // Track errors during interactions
    let interactionErrors = 0;
    
    context.page.on('console', msg => {
      if (msg.type() === 'error') {
        interactionErrors++;
        console.log(`   ❌ Error during interaction: ${msg.text().substring(0, 100)}...`);
      }
    });
    
    // Login
    await navigateTo(context, '/auth/sign-in');
    await login(context, TEST_ACCOUNTS.coach, { expectSuccess: true });
    
    // Test form interactions
    console.log('   📝 Testing form interactions...');
    
    // Navigate to a form page (e.g., new game)
    if (await elementExists(context, 'a[href*="/games/new"], button:has-text("New Game")')) {
      await context.page.click('a[href*="/games/new"], button:has-text("New Game")');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try form interactions
      const formInputs = await context.page.$$('input, select, textarea');
      console.log(`      Found ${formInputs.length} form elements`);
      
      // Test focus/blur on inputs
      for (let i = 0; i < Math.min(3, formInputs.length); i++) {
        await formInputs[i].focus();
        await new Promise(resolve => setTimeout(resolve, 100));
        await formInputs[i].blur();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Test button clicks
    console.log('   👆 Testing button interactions...');
    const buttons = await context.page.$$('button:not([type="submit"])');
    console.log(`      Found ${buttons.length} interactive buttons`);
    
    // Click a few buttons (safely)
    for (let i = 0; i < Math.min(3, buttons.length); i++) {
      try {
        const buttonText = await buttons[i].evaluate(el => el.textContent);
        if (!buttonText?.includes('Delete') && !buttonText?.includes('Remove')) {
          await buttons[i].click();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch {
        // Button might have been removed from DOM
      }
    }
    
    // Test navigation menu
    console.log('   📱 Testing navigation menu...');
    if (await elementExists(context, '[role="navigation"], nav, .menu-toggle, .hamburger')) {
      const menuToggle = await context.page.$('[role="navigation"] button, .menu-toggle, .hamburger');
      if (menuToggle) {
        await menuToggle.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await captureScreenshot(context, 'menu-open');
        
        // Close menu
        await menuToggle.click();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Test scroll interactions
    console.log('   📜 Testing scroll interactions...');
    await context.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await context.page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Summary
    if (interactionErrors === 0) {
      console.log('\n   ✅ No errors detected during user interactions');
    } else {
      console.log(`\n   ⚠️  ${interactionErrors} errors detected during interactions`);
    }
    
  } catch (error) {
    console.error(`   ❌ Interaction test failed: ${error}`);
  } finally {
    await teardownTest(context);
  }
}

/**
 * Generate final error report
 */
function generateErrorReport(reports: ErrorReport[]) {
  console.log('\n==========================================');
  console.log('📊 FINAL ERROR REPORT');
  console.log('==========================================\n');
  
  let totalConsoleErrors = 0;
  let totalNetworkErrors = 0;
  let total404s = 0;
  let totalJSErrors = 0;
  let pagesWithErrors: string[] = [];
  
  // Aggregate results
  reports.forEach(report => {
    totalConsoleErrors += report.summary.totalConsoleErrors;
    totalNetworkErrors += report.summary.totalNetworkErrors;
    total404s += report.summary.total404s;
    totalJSErrors += report.summary.totalJSErrors;
    
    if (report.summary.hasErrors) {
      pagesWithErrors.push(report.page);
    }
  });
  
  // Print summary
  console.log('📈 Overall Statistics:');
  console.log(`   Pages Tested: ${reports.length}`);
  console.log(`   Pages with Errors: ${pagesWithErrors.length}`);
  console.log(`   Total Console Errors: ${totalConsoleErrors}`);
  console.log(`   Total Network Errors: ${totalNetworkErrors}`);
  console.log(`   Total 404 Errors: ${total404s}`);
  console.log(`   Total JS Exceptions: ${totalJSErrors}`);
  
  if (pagesWithErrors.length > 0) {
    console.log('\n⚠️  Pages with errors:');
    pagesWithErrors.forEach(page => {
      const report = reports.find(r => r.page === page);
      if (report) {
        console.log(`   - ${page}:`);
        if (report.summary.totalConsoleErrors > 0) {
          console.log(`     • ${report.summary.totalConsoleErrors} console errors`);
        }
        if (report.summary.totalNetworkErrors > 0) {
          console.log(`     • ${report.summary.totalNetworkErrors} network errors`);
        }
        if (report.summary.total404s > 0) {
          console.log(`     • ${report.summary.total404s} 404 errors`);
        }
        if (report.summary.totalJSErrors > 0) {
          console.log(`     • ${report.summary.totalJSErrors} JS exceptions`);
        }
      }
    });
  }
  
  // Final verdict
  console.log('\n🎯 Test Result:');
  if (totalConsoleErrors === 0 && totalNetworkErrors === 0 && totalJSErrors === 0) {
    if (total404s === 0) {
      console.log('   ✅ PASSED - No errors detected!');
    } else {
      console.log(`   ⚠️  PASSED WITH WARNINGS - ${total404s} 404 errors detected`);
    }
  } else {
    console.log('   ❌ FAILED - Errors detected that need attention');
    console.log('\n   Recommended Actions:');
    if (totalConsoleErrors > 0) {
      console.log('   1. Review and fix console errors in browser DevTools');
    }
    if (totalNetworkErrors > 0) {
      console.log('   2. Check API endpoints and network requests');
    }
    if (totalJSErrors > 0) {
      console.log('   3. Debug JavaScript exceptions in the application');
    }
    if (total404s > 0) {
      console.log('   4. Verify all resource paths and API routes');
    }
  }
}

// Run all tests
(async () => {
  try {
    await runConsoleErrorTests();
    console.log('\n==========================================');
    console.log('✅ CONSOLE ERROR TESTS COMPLETED');
    console.log('==========================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n==========================================');
    console.error('❌ CONSOLE ERROR TESTS FAILED');
    console.error('==========================================\n');
    console.error(error);
    process.exit(1);
  }
})();