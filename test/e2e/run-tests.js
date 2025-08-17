#!/usr/bin/env node

/**
 * E2E Test Runner
 * Orchestrates Puppeteer test execution
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  test: null,
  debug: false,
  headless: true,
  slowMo: 0
};

args.forEach(arg => {
  if (arg === '--debug') {
    options.debug = true;
    options.headless = false;
    options.slowMo = 250;
  } else if (arg.startsWith('--test=')) {
    options.test = arg.split('=')[1];
  } else if (arg === '--headed') {
    options.headless = false;
  } else if (arg.startsWith('--slow-mo=')) {
    options.slowMo = parseInt(arg.split('=')[1]);
  }
});

// Set environment variables
process.env.HEADLESS = options.headless.toString();
process.env.SLOW_MO = options.slowMo.toString();
if (options.debug) {
  process.env.DEVTOOLS = 'true';
}

// Determine which test file to run
let testFile;
if (options.test) {
  testFile = path.join(__dirname, `${options.test}.test.ts`);
} else {
  testFile = path.join(__dirname, 'auth.test.ts'); // Default to auth tests
}

console.log('🧪 Football Tracker E2E Test Runner\n');
console.log(`Test File: ${path.basename(testFile)}`);
console.log(`Mode: ${options.headless ? 'Headless' : 'Headed'}`);
if (options.slowMo > 0) {
  console.log(`Slow Motion: ${options.slowMo}ms`);
}
if (options.debug) {
  console.log('Debug Mode: Enabled');
}
console.log('');

// Run the test file with Node.js
const testProcess = spawn('node', ['--loader', 'tsx', testFile], {
  stdio: 'inherit',
  env: { ...process.env }
});

testProcess.on('close', (code) => {
  process.exit(code);
});

testProcess.on('error', (error) => {
  console.error('Failed to run tests:', error);
  process.exit(1);
});