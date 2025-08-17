#!/usr/bin/env tsx
/**
 * Comprehensive E2E Test Runner
 * Executes all E2E tests and generates a summary report
 * 
 * Usage:
 *   npm run test:e2e:all
 *   tsx test/e2e/run-all-tests.ts
 *   HEADLESS=false tsx test/e2e/run-all-tests.ts (debug mode)
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  total: number;
  duration: number;
  status: 'PASS' | 'FAIL';
  errors: string[];
}

interface TestSummary {
  totalSuites: number;
  passedSuites: number;
  failedSuites: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  timestamp: string;
  results: TestResult[];
}

class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = Date.now();
  
  async runTestSuite(name: string, file: string): Promise<TestResult> {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Running ${name} Tests`);
    console.log('='.repeat(50));
    
    const suiteStart = Date.now();
    const result: TestResult = {
      suite: name,
      passed: 0,
      failed: 0,
      total: 0,
      duration: 0,
      status: 'PASS',
      errors: []
    };
    
    return new Promise((resolve) => {
      const testProcess = spawn('tsx', [file], {
        cwd: path.join(__dirname, '../..'),
        env: { ...process.env },
        stdio: 'pipe'
      });
      
      let output = '';
      
      testProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
        
        // Parse test results from output
        const passMatch = text.match(/✅.*?(\d+)\/(\d+)/);
        const failMatch = text.match(/❌.*?(\d+)\/(\d+)/);
        
        if (passMatch) {
          result.passed = parseInt(passMatch[1]);
          result.total = parseInt(passMatch[2]);
        }
        if (failMatch) {
          result.failed = parseInt(failMatch[1]);
        }
      });
      
      testProcess.stderr.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stderr.write(text);
        result.errors.push(text);
      });
      
      testProcess.on('close', (code) => {
        result.duration = Date.now() - suiteStart;
        result.status = code === 0 ? 'PASS' : 'FAIL';
        
        // Parse final results from output if not already captured
        if (result.total === 0) {
          const totalMatch = output.match(/Passed:\s*(\d+)\/(\d+)/);
          if (totalMatch) {
            result.passed = parseInt(totalMatch[1]);
            result.total = parseInt(totalMatch[2]);
            result.failed = result.total - result.passed;
          }
        }
        
        resolve(result);
      });
    });
  }
  
  async runAllTests(): Promise<TestSummary> {
    const testSuites = [
      { name: 'Authentication', file: 'test/e2e/auth.test.ts' },
      { name: 'Roster Management', file: 'test/e2e/roster.test.ts' },
      { name: 'Game Tracking', file: 'test/e2e/game.test.ts' },
      { name: 'MPR Compliance', file: 'test/e2e/mpr.test.ts' }
    ];
    
    console.log('\n🏈 FOOTBALL TRACKER E2E TEST SUITE');
    console.log('=====================================');
    console.log(`Starting at: ${new Date().toLocaleString()}`);
    console.log(`Test Mode: ${process.env.HEADLESS === 'false' ? 'Debug (Browser Visible)' : 'Headless'}`);
    
    for (const suite of testSuites) {
      try {
        const result = await this.runTestSuite(suite.name, suite.file);
        this.results.push(result);
      } catch (error) {
        console.error(`Failed to run ${suite.name}:`, error);
        this.results.push({
          suite: suite.name,
          passed: 0,
          failed: 1,
          total: 1,
          duration: 0,
          status: 'FAIL',
          errors: [String(error)]
        });
      }
    }
    
    const summary = this.generateSummary();
    await this.saveReport(summary);
    this.printSummary(summary);
    
    return summary;
  }
  
  private generateSummary(): TestSummary {
    const summary: TestSummary = {
      totalSuites: this.results.length,
      passedSuites: this.results.filter(r => r.status === 'PASS').length,
      failedSuites: this.results.filter(r => r.status === 'FAIL').length,
      totalTests: this.results.reduce((sum, r) => sum + r.total, 0),
      passedTests: this.results.reduce((sum, r) => sum + r.passed, 0),
      failedTests: this.results.reduce((sum, r) => sum + r.failed, 0),
      totalDuration: Date.now() - this.startTime,
      timestamp: new Date().toISOString(),
      results: this.results
    };
    
    return summary;
  }
  
  private printSummary(summary: TestSummary) {
    console.log('\n' + '='.repeat(60));
    console.log('E2E TEST EXECUTION SUMMARY');
    console.log('='.repeat(60));
    
    // Print suite results
    console.log('\n📊 Test Suite Results:');
    console.log('─'.repeat(40));
    
    for (const result of summary.results) {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      const percentage = result.total > 0 
        ? ((result.passed / result.total) * 100).toFixed(1) 
        : '0.0';
      
      console.log(`${icon} ${result.suite.padEnd(20)} ${result.passed}/${result.total} (${percentage}%) - ${(result.duration / 1000).toFixed(1)}s`);
      
      if (result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.length}`);
      }
    }
    
    // Print overall statistics
    console.log('\n' + '─'.repeat(40));
    console.log('📈 Overall Statistics:');
    console.log('─'.repeat(40));
    
    const overallPercentage = summary.totalTests > 0
      ? ((summary.passedTests / summary.totalTests) * 100).toFixed(1)
      : '0.0';
    
    console.log(`Total Test Suites: ${summary.passedSuites}/${summary.totalSuites} passed`);
    console.log(`Total Tests: ${summary.passedTests}/${summary.totalTests} passed (${overallPercentage}%)`);
    console.log(`Total Duration: ${(summary.totalDuration / 1000).toFixed(1)} seconds`);
    
    // Performance metrics
    console.log('\n⚡ Performance Metrics:');
    console.log('─'.repeat(40));
    
    const avgTimePerTest = summary.totalTests > 0 
      ? (summary.totalDuration / summary.totalTests / 1000).toFixed(2)
      : '0.00';
    
    console.log(`Average time per test: ${avgTimePerTest}s`);
    console.log(`Fastest suite: ${this.getFastestSuite()}`);
    console.log(`Slowest suite: ${this.getSlowestSuite()}`);
    
    // Final verdict
    console.log('\n' + '='.repeat(60));
    
    if (summary.failedSuites === 0) {
      console.log('🏆 ALL TESTS PASSED! Ready for deployment.');
    } else if (summary.failedSuites <= 1 && overallPercentage >= '90') {
      console.log('✅ MOSTLY PASSING - Minor issues to address.');
    } else if (overallPercentage >= '70') {
      console.log('⚠️  NEEDS ATTENTION - Several tests failing.');
    } else {
      console.log('❌ CRITICAL FAILURES - Major issues detected.');
    }
    
    console.log('='.repeat(60));
    
    // Print test command tips
    console.log('\n💡 Quick Commands:');
    console.log('  Debug failed tests:   npm run test:e2e:debug');
    console.log('  Run specific suite:   npm run test:e2e:roster');
    console.log('  View screenshots:     open test-results/screenshots');
    console.log('  View full report:     open test-results/reports/summary.json');
  }
  
  private getFastestSuite(): string {
    if (this.results.length === 0) return 'N/A';
    const fastest = this.results.reduce((min, r) => 
      r.duration < min.duration ? r : min
    );
    return `${fastest.suite} (${(fastest.duration / 1000).toFixed(1)}s)`;
  }
  
  private getSlowestSuite(): string {
    if (this.results.length === 0) return 'N/A';
    const slowest = this.results.reduce((max, r) => 
      r.duration > max.duration ? r : max
    );
    return `${slowest.suite} (${(slowest.duration / 1000).toFixed(1)}s)`;
  }
  
  private async saveReport(summary: TestSummary) {
    const reportPath = path.join(__dirname, '../../test-results/reports');
    await fs.mkdir(reportPath, { recursive: true });
    
    // Save detailed JSON report
    const jsonPath = path.join(reportPath, 'summary.json');
    await fs.writeFile(jsonPath, JSON.stringify(summary, null, 2));
    
    // Save human-readable markdown report
    const mdPath = path.join(reportPath, 'summary.md');
    const markdown = this.generateMarkdownReport(summary);
    await fs.writeFile(mdPath, markdown);
    
    console.log(`\n📄 Reports saved to: ${reportPath}`);
  }
  
  private generateMarkdownReport(summary: TestSummary): string {
    const date = new Date(summary.timestamp).toLocaleString();
    const overallPercentage = summary.totalTests > 0
      ? ((summary.passedTests / summary.totalTests) * 100).toFixed(1)
      : '0.0';
    
    let md = `# Football Tracker E2E Test Report\n\n`;
    md += `**Date:** ${date}\n`;
    md += `**Duration:** ${(summary.totalDuration / 1000).toFixed(1)} seconds\n`;
    md += `**Overall Pass Rate:** ${overallPercentage}%\n\n`;
    
    md += `## Summary\n\n`;
    md += `- **Test Suites:** ${summary.passedSuites}/${summary.totalSuites} passed\n`;
    md += `- **Total Tests:** ${summary.passedTests}/${summary.totalTests} passed\n`;
    md += `- **Failed Tests:** ${summary.failedTests}\n\n`;
    
    md += `## Test Suite Results\n\n`;
    md += `| Suite | Status | Tests Passed | Duration |\n`;
    md += `|-------|--------|--------------|----------|\n`;
    
    for (const result of summary.results) {
      const status = result.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
      const tests = `${result.passed}/${result.total}`;
      const duration = `${(result.duration / 1000).toFixed(1)}s`;
      md += `| ${result.suite} | ${status} | ${tests} | ${duration} |\n`;
    }
    
    md += `\n## Critical Failures\n\n`;
    
    const failures = summary.results.filter(r => r.failed > 0);
    if (failures.length === 0) {
      md += `No failures detected! 🎉\n`;
    } else {
      for (const failure of failures) {
        md += `### ${failure.suite}\n`;
        md += `- Failed: ${failure.failed} tests\n`;
        if (failure.errors.length > 0) {
          md += `- Errors:\n`;
          failure.errors.forEach(err => {
            md += `  - ${err.substring(0, 100)}...\n`;
          });
        }
        md += `\n`;
      }
    }
    
    md += `## Recommendations\n\n`;
    
    if (summary.failedSuites === 0) {
      md += `✅ All tests passing - ready for production deployment.\n`;
    } else {
      md += `### Priority Fixes:\n\n`;
      
      if (failures.some(f => f.suite.includes('Auth'))) {
        md += `1. **Authentication Issues** - Critical for app access\n`;
      }
      if (failures.some(f => f.suite.includes('Game'))) {
        md += `2. **Game Tracking Issues** - Core functionality affected\n`;
      }
      if (failures.some(f => f.suite.includes('MPR'))) {
        md += `3. **MPR Compliance Issues** - League requirement at risk\n`;
      }
      if (failures.some(f => f.suite.includes('Roster'))) {
        md += `4. **Roster Management Issues** - Team setup problems\n`;
      }
    }
    
    return md;
  }
}

// Execute tests
async function main() {
  const runner = new TestRunner();
  
  try {
    const summary = await runner.runAllTests();
    
    // Exit with appropriate code
    process.exit(summary.failedSuites > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ Test runner failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { TestRunner, main };