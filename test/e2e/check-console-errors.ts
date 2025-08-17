#!/usr/bin/env tsx
/**
 * Quick test to check if console errors are fixed
 */

import puppeteer, { Browser, Page } from 'puppeteer';

const APP_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'zackarychapple30+mock1@gmail.com',
  password: 'GameDay2025!'
};

async function checkConsoleErrors() {
  let browser: Browser | null = null;
  
  try {
    console.log('🧪 Checking for Console Errors\n');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Collect all console messages and errors
    const consoleMessages: string[] = [];
    const errors: string[] = [];
    const networkErrors: string[] = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      
      if (msg.type() === 'error') {
        // Filter out expected dev warnings
        if (!text.includes('React DevTools') && 
            !text.includes('[HMR]') &&
            !text.includes('Download error or resource isn\'t a valid image')) {
          errors.push(text);
        }
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(`Page Error: ${error.message}`);
    });
    
    page.on('response', (response) => {
      if (response.status() >= 400) {
        const url = response.url();
        // Ignore icon errors
        if (!url.includes('icon-192.png')) {
          networkErrors.push(`${response.status()} - ${url}`);
        }
      }
    });
    
    // Test 1: Home page
    console.log('📄 Testing Home Page...');
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Sign in page
    console.log('📄 Testing Sign In Page...');
    await page.goto(`${APP_URL}/auth/sign-in`, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Sign in process
    console.log('🔐 Testing Sign In Process...');
    await page.type('input[type="email"]', TEST_USER.email);
    await page.type('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    // Check results
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESULTS');
    console.log('='.repeat(50));
    
    if (errors.length === 0 && networkErrors.length === 0) {
      console.log('✅ No console errors detected!');
    } else {
      console.log('❌ Errors found:\n');
      
      if (errors.length > 0) {
        console.log('Console Errors:');
        errors.forEach(err => console.log(`  - ${err}`));
      }
      
      if (networkErrors.length > 0) {
        console.log('\nNetwork Errors:');
        networkErrors.forEach(err => console.log(`  - ${err}`));
      }
    }
    
    // Show all console messages for debugging
    console.log('\n📝 All Console Messages:');
    consoleMessages.forEach(msg => console.log(`  ${msg}`));
    
    // Check if mock functions are working
    const mockMessages = consoleMessages.filter(msg => 
      msg.includes('Mock mode') || 
      msg.includes('Using mock') ||
      msg.includes('Database function not found')
    );
    
    if (mockMessages.length > 0) {
      console.log('\n🎭 Mock Functions Active:');
      mockMessages.forEach(msg => console.log(`  ${msg}`));
    }
    
    return errors.length === 0 && networkErrors.length === 0;
    
  } catch (error) {
    console.error('Test error:', error);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
checkConsoleErrors().then(success => {
  if (success) {
    console.log('\n✅ Test Passed - No console errors!');
    process.exit(0);
  } else {
    console.log('\n❌ Test Failed - Console errors detected');
    process.exit(1);
  }
});