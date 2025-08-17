import puppeteer, { Browser, Page, ConsoleMessage, HTTPRequest, HTTPResponse } from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const require = createRequire(import.meta.url);
const config = require('../../puppeteer.config.js');

// Test context interface
export interface TestContext {
  browser: Browser;
  page: Page;
  logs: {
    console: Array<{ type: string; text: string; timestamp: number }>;
    network: Array<{ 
      url: string; 
      method: string; 
      status?: number; 
      type?: string;
      timestamp: number;
      error?: string;
    }>;
    errors: Array<{ message: string; source: string; timestamp: number }>;
  };
  testName: string;
  startTime: number;
}

// Global test state
let currentContext: TestContext | null = null;

/**
 * Initialize test environment
 */
export async function setupTest(testName: string): Promise<TestContext> {
  console.log(`\n🚀 Setting up test: ${testName}`);
  
  // Create test result directories
  await ensureDirectories();
  
  // Launch browser
  const browser = await puppeteer.launch(config.launch);
  const page = await browser.newPage();
  
  // Set up mobile viewport
  await page.setViewport(config.launch.defaultViewport);
  
  // Initialize context
  const context: TestContext = {
    browser,
    page,
    logs: {
      console: [],
      network: [],
      errors: []
    },
    testName,
    startTime: Date.now()
  };
  
  // Set up console message capture
  if (config.testEnvironment.consoleLogCapture) {
    page.on('console', (msg: ConsoleMessage) => {
      const type = msg.type();
      const text = msg.text();
      const timestamp = Date.now();
      
      context.logs.console.push({ type, text, timestamp });
      
      // Check for error patterns
      const isError = config.consolePatterns.errors.some((pattern: RegExp) => 
        pattern.test(text)
      );
      const isIgnored = config.consolePatterns.ignore.some((pattern: RegExp) => 
        pattern.test(text)
      );
      
      if (isError && !isIgnored) {
        console.error(`❌ Console Error: ${text}`);
        context.logs.errors.push({ 
          message: text, 
          source: 'console', 
          timestamp 
        });
      } else if (type === 'error' && !isIgnored) {
        console.error(`❌ Console Error: ${text}`);
        context.logs.errors.push({ 
          message: text, 
          source: 'console', 
          timestamp 
        });
      } else if (type === 'warning') {
        console.warn(`⚠️  Console Warning: ${text}`);
      }
    });
  }
  
  // Set up network request capture
  if (config.testEnvironment.networkLogCapture) {
    page.on('request', (request: HTTPRequest) => {
      const url = request.url();
      const method = request.method();
      const timestamp = Date.now();
      
      context.logs.network.push({ 
        url, 
        method, 
        type: request.resourceType(),
        timestamp 
      });
      
      // Log API requests
      if (config.networkPatterns.api.test(url)) {
        console.log(`📡 API Request: ${method} ${url}`);
      }
    });
    
    page.on('response', (response: HTTPResponse) => {
      const url = response.url();
      const status = response.status();
      
      // Find and update the request log
      const reqLog = context.logs.network.find(log => 
        log.url === url && !log.status
      );
      if (reqLog) {
        reqLog.status = status;
      }
      
      // Log API responses
      if (config.networkPatterns.api.test(url)) {
        const statusEmoji = status >= 400 ? '❌' : '✅';
        console.log(`${statusEmoji} API Response: ${status} ${url}`);
        
        if (status >= 400) {
          context.logs.errors.push({ 
            message: `HTTP ${status}: ${url}`, 
            source: 'network', 
            timestamp: Date.now() 
          });
        }
      }
    });
    
    page.on('requestfailed', (request: HTTPRequest) => {
      const url = request.url();
      const failure = request.failure();
      
      console.error(`❌ Request Failed: ${url} - ${failure?.errorText}`);
      context.logs.errors.push({ 
        message: `Request failed: ${url} - ${failure?.errorText}`, 
        source: 'network', 
        timestamp: Date.now() 
      });
    });
  }
  
  // Set up page error capture
  page.on('pageerror', (error: Error) => {
    console.error(`❌ Page Error: ${error.message}`);
    context.logs.errors.push({ 
      message: error.message, 
      source: 'page', 
      timestamp: Date.now() 
    });
  });
  
  currentContext = context;
  return context;
}

/**
 * Clean up test environment
 */
export async function teardownTest(context: TestContext, options?: { 
  skipScreenshot?: boolean; 
  skipLogs?: boolean;
}) {
  const duration = Date.now() - context.startTime;
  console.log(`\n⏱️  Test duration: ${duration}ms`);
  
  // Take screenshot if there were errors
  if (context.logs.errors.length > 0 && !options?.skipScreenshot) {
    await captureScreenshot(context, 'error');
  }
  
  // Save logs
  if (!options?.skipLogs) {
    await saveLogs(context);
  }
  
  // Print summary
  console.log(`\n📊 Test Summary for: ${context.testName}`);
  console.log(`   Console logs: ${context.logs.console.length}`);
  console.log(`   Network requests: ${context.logs.network.length}`);
  console.log(`   Errors: ${context.logs.errors.length}`);
  
  if (context.logs.errors.length > 0) {
    console.log('\n❌ Errors detected:');
    context.logs.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. [${error.source}] ${error.message}`);
    });
  }
  
  // Close browser
  await context.browser.close();
  currentContext = null;
}

/**
 * Navigate to a page with error handling
 */
export async function navigateTo(
  context: TestContext, 
  path: string,
  options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2' }
) {
  const url = path.startsWith('http') ? path : `${config.testEnvironment.baseUrl}${path}`;
  console.log(`📍 Navigating to: ${url}`);
  
  try {
    const response = await context.page.goto(url, {
      waitUntil: options?.waitUntil || 'networkidle2',
      timeout: config.testEnvironment.testTimeout
    });
    
    if (!response || !response.ok()) {
      throw new Error(`Failed to load page: ${response?.status()}`);
    }
    
    return response;
  } catch (error) {
    console.error(`❌ Navigation failed: ${error}`);
    await captureScreenshot(context, 'navigation-error');
    throw error;
  }
}

/**
 * Wait for element and return it
 */
export async function waitForElement(
  context: TestContext,
  selector: string,
  options?: { timeout?: number; visible?: boolean }
) {
  console.log(`⏳ Waiting for element: ${selector}`);
  
  try {
    const element = await context.page.waitForSelector(selector, {
      timeout: options?.timeout || 10000,
      visible: options?.visible !== false
    });
    
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    
    return element;
  } catch (error) {
    console.error(`❌ Element wait failed: ${error}`);
    await captureScreenshot(context, 'element-not-found');
    throw error;
  }
}

/**
 * Type text into an input field
 */
export async function typeIntoField(
  context: TestContext,
  selector: string,
  text: string,
  options?: { clear?: boolean; delay?: number }
) {
  console.log(`⌨️  Typing into ${selector}: ${text.substring(0, 20)}...`);
  
  const element = await waitForElement(context, selector);
  
  if (options?.clear !== false) {
    await element.click({ clickCount: 3 }); // Select all
    await context.page.keyboard.press('Backspace');
  }
  
  await element.type(text, { delay: options?.delay || 50 });
}

/**
 * Click an element
 */
export async function clickElement(
  context: TestContext,
  selector: string,
  options?: { waitForNavigation?: boolean }
) {
  console.log(`👆 Clicking: ${selector}`);
  
  const element = await waitForElement(context, selector);
  
  if (options?.waitForNavigation) {
    const [response] = await Promise.all([
      context.page.waitForNavigation({ waitUntil: 'networkidle2' }),
      element.click()
    ]);
    return response;
  }
  
  await element.click();
}

/**
 * Capture screenshot
 */
export async function captureScreenshot(
  context: TestContext,
  name: string
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${context.testName}-${name}-${timestamp}.png`;
  const filepath = path.join(__dirname, '../../test-results/screenshots', filename);
  
  try {
    await context.page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 Screenshot saved: ${filename}`);
  } catch (error) {
    console.error(`Failed to capture screenshot: ${error}`);
  }
}

/**
 * Save test logs
 */
async function saveLogs(context: TestContext) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${context.testName}-${timestamp}.json`;
  const filepath = path.join(__dirname, '../../test-results/logs', filename);
  
  const logData = {
    testName: context.testName,
    startTime: context.startTime,
    duration: Date.now() - context.startTime,
    logs: context.logs,
    summary: {
      totalConsole: context.logs.console.length,
      totalNetwork: context.logs.network.length,
      totalErrors: context.logs.errors.length,
      failedRequests: context.logs.network.filter(r => 
        r.status && r.status >= 400
      ).length
    }
  };
  
  try {
    await fs.writeFile(filepath, JSON.stringify(logData, null, 2));
    console.log(`💾 Logs saved: ${filename}`);
  } catch (error) {
    console.error(`Failed to save logs: ${error}`);
  }
}

/**
 * Ensure test directories exist
 */
async function ensureDirectories() {
  const dirs = [
    'test-results/screenshots',
    'test-results/videos',
    'test-results/logs',
    'test-results/reports'
  ];
  
  for (const dir of dirs) {
    const fullPath = path.join(__dirname, '../../', dir);
    await fs.mkdir(fullPath, { recursive: true });
  }
}

/**
 * Set network conditions
 */
export async function setNetworkCondition(
  context: TestContext,
  condition: '4G' | '3G' | 'offline'
) {
  const conditions = config.networkConditions[condition];
  console.log(`📶 Setting network condition: ${condition}`);
  
  // Create CDP session
  const client = await context.page.target().createCDPSession();
  
  // Set network conditions
  await client.send('Network.emulateNetworkConditions', {
    offline: conditions.offline,
    downloadThroughput: conditions.downloadThroughput,
    uploadThroughput: conditions.uploadThroughput,
    latency: conditions.latency
  });
}

/**
 * Check if element exists
 */
export async function elementExists(
  context: TestContext,
  selector: string
): Promise<boolean> {
  try {
    await context.page.waitForSelector(selector, { timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get element text
 */
export async function getElementText(
  context: TestContext,
  selector: string
): Promise<string> {
  const element = await waitForElement(context, selector);
  return await element.evaluate(el => el.textContent || '');
}

/**
 * Wait for text to appear
 */
export async function waitForText(
  context: TestContext,
  text: string,
  options?: { timeout?: number; selector?: string }
) {
  console.log(`⏳ Waiting for text: "${text}"`);
  
  const selector = options?.selector || 'body';
  const timeout = options?.timeout || 10000;
  
  await context.page.waitForFunction(
    (selector, text) => {
      const element = document.querySelector(selector);
      return element?.textContent?.includes(text);
    },
    { timeout },
    selector,
    text
  );
}

export default {
  setupTest,
  teardownTest,
  navigateTo,
  waitForElement,
  typeIntoField,
  clickElement,
  captureScreenshot,
  setNetworkCondition,
  elementExists,
  getElementText,
  waitForText
};