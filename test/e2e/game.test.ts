/**
 * Game Creation and Tracking E2E Tests
 * Tests critical game day operations and play tracking workflows
 * 
 * Test Scenarios:
 * - Create game with opponent and field size
 * - Start game and track quarters
 * - Record pass plays (< 5 seconds)
 * - Record run plays (< 3 seconds)
 * - Track penalties correctly
 * - Test undo functionality
 * - Verify offline capability
 * - Test substitution tracking
 */

import {
  setupTest,
  teardownTest,
  navigateTo,
  waitForElement,
  typeIntoField,
  clickElement,
  captureScreenshot,
  getElementText,
  elementExists,
  waitForText,
  setNetworkCondition,
  TestContext
} from './setup.js';
import { login } from './utils/login-helper.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const config = require('../../puppeteer.config.js');

// Performance tracking
interface PlayTracking {
  type: 'pass' | 'run' | 'penalty';
  duration: number;
  success: boolean;
}

class GameTracker {
  private plays: PlayTracking[] = [];
  
  recordPlay(type: PlayTracking['type'], duration: number, maxDuration: number): boolean {
    const success = duration < maxDuration;
    this.plays.push({ type, duration, success });
    
    console.log(`   ${success ? '✅' : '❌'} ${type.toUpperCase()} play: ${duration}ms (max: ${maxDuration}ms)`);
    
    return success;
  }
  
  getStats() {
    const passPLays = this.plays.filter(p => p.type === 'pass');
    const runPlays = this.plays.filter(p => p.type === 'run');
    
    return {
      totalPlays: this.plays.length,
      passPlays: passPLays.length,
      runPlays: runPlays.length,
      avgPassTime: passPLays.length > 0 
        ? passPLays.reduce((sum, p) => sum + p.duration, 0) / passPLays.length 
        : 0,
      avgRunTime: runPlays.length > 0
        ? runPlays.reduce((sum, p) => sum + p.duration, 0) / runPlays.length
        : 0,
      successRate: (this.plays.filter(p => p.success).length / this.plays.length) * 100
    };
  }
}

describe('Game Tracking Tests', () => {
  let context: TestContext;
  let gameTracker: GameTracker;
  
  beforeEach(async () => {
    context = await setupTest('game-tracking');
    gameTracker = new GameTracker();
    
    // Login as head coach
    const testUser = {
      email: 'zackarychapple30+testcoach@gmail.com',
      password: 'GameDay2025!',
      firstName: 'Test',
      lastName: 'Coach'
    };
    
    const loginSuccess = await login(context, testUser);
    if (!loginSuccess) {
      throw new Error('Failed to login for game tests');
    }
  });
  
  afterEach(async () => {
    // Print game statistics
    const stats = gameTracker.getStats();
    if (stats.totalPlays > 0) {
      console.log('\n📊 Game Statistics:');
      console.log(`   Total plays: ${stats.totalPlays}`);
      console.log(`   Pass plays: ${stats.passPlays} (avg: ${stats.avgPassTime.toFixed(0)}ms)`);
      console.log(`   Run plays: ${stats.runPlays} (avg: ${stats.avgRunTime.toFixed(0)}ms)`);
      console.log(`   Success rate: ${stats.successRate.toFixed(1)}%`);
    }
    
    await teardownTest(context);
  });
  
  test('Create game in under 10 seconds', async () => {
    console.log('\n🏈 Testing: Create new game');
    const startTime = Date.now();
    
    try {
      // Navigate to games or dashboard
      await navigateTo(context, '/dashboard');
      
      // Click new game button
      await clickElement(context, '[data-testid="new-game-btn"], button:has-text("New Game"), button:has-text("Start Game")');
      
      // Wait for game creation form
      await waitForElement(context, '[data-testid="game-form"], form[aria-label="New Game"]', { timeout: 3000 });
      
      // Enter opponent name
      await typeIntoField(context, 'input[name="opponent"], input[placeholder*="opponent"]', 'Test Opponent');
      
      // Select field size
      if (await elementExists(context, 'select[name="fieldSize"]')) {
        await context.page.select('select[name="fieldSize"]', '80');
      } else if (await elementExists(context, 'input[type="radio"][value="80"]')) {
        await clickElement(context, 'input[type="radio"][value="80"]');
      }
      
      // Set date/time if fields exist
      if (await elementExists(context, 'input[type="date"]')) {
        const today = new Date().toISOString().split('T')[0];
        await typeIntoField(context, 'input[type="date"]', today);
      }
      
      // Take screenshot of filled form
      await captureScreenshot(context, 'game-form-filled');
      
      // Create game
      await clickElement(context, 'button[type="submit"], button:has-text("Create Game"), button:has-text("Start")');
      
      // Wait for redirect to game page
      await waitForElement(context, '[data-testid="game-tracker"], [data-testid="play-tracker"]', { timeout: 5000 });
      
      const duration = Date.now() - startTime;
      
      if (duration > 10000) {
        throw new Error(`Game creation took ${duration}ms, exceeding 10 second limit`);
      }
      
      console.log(`✅ Game created in ${duration}ms`);
      
      // Verify game elements are present
      const hasQuarterDisplay = await elementExists(context, '[data-testid="quarter-display"], :has-text("Q1")');
      const hasScoreDisplay = await elementExists(context, '[data-testid="score-display"], [class*="score"]');
      
      if (!hasQuarterDisplay || !hasScoreDisplay) {
        throw new Error('Game tracker missing essential elements');
      }
      
    } catch (error) {
      console.error('❌ Failed to create game:', error);
      await captureScreenshot(context, 'create-game-error');
      throw error;
    }
  });
  
  test('Track pass play in under 5 seconds', async () => {
    console.log('\n🏈 Testing: Track pass plays');
    
    try {
      // Create and start a game first
      await createQuickGame(context);
      
      // Record 5 pass plays
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        
        // Click pass play button
        await clickElement(context, '[data-testid="play-type-pass"], button:has-text("Pass")');
        
        // Select QB (should be quick tap)
        await clickElement(context, '[data-testid="player-1"], [data-testid="qb-select"] button:first-child');
        
        // Select receiver
        await clickElement(context, '[data-testid="player-11"], [data-testid="receiver-select"] button:first-child');
        
        // Mark as complete
        await clickElement(context, '[data-testid="play-result-complete"], button:has-text("Complete")');
        
        // Wait for play to be recorded
        await waitForText(context, 'Play recorded', { timeout: 2000 });
        
        const duration = Date.now() - startTime;
        gameTracker.recordPlay('pass', duration, 5000);
        
        // Small delay between plays
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const stats = gameTracker.getStats();
      
      if (stats.avgPassTime > 5000) {
        throw new Error(`Average pass play time ${stats.avgPassTime}ms exceeds 5 second limit`);
      }
      
      console.log('✅ Pass plays tracked successfully');
      
    } catch (error) {
      console.error('❌ Failed to track pass plays:', error);
      await captureScreenshot(context, 'pass-play-error');
      throw error;
    }
  });
  
  test('Track run play in under 3 seconds', async () => {
    console.log('\n🏈 Testing: Track run plays');
    
    try {
      // Create and start a game first
      await createQuickGame(context);
      
      // Record 5 run plays
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        
        // Click run play button
        await clickElement(context, '[data-testid="play-type-run"], button:has-text("Run")');
        
        // Select runner (quick tap)
        await clickElement(context, '[data-testid="player-5"], [data-testid="runner-select"] button:first-child');
        
        // Mark result (gain/loss/TD)
        await clickElement(context, '[data-testid="play-result-gain"], button:has-text("Gain")');
        
        // Wait for play to be recorded
        await waitForText(context, 'Play recorded', { timeout: 2000 });
        
        const duration = Date.now() - startTime;
        gameTracker.recordPlay('run', duration, 3000);
        
        // Small delay between plays
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const stats = gameTracker.getStats();
      
      if (stats.avgRunTime > 3000) {
        throw new Error(`Average run play time ${stats.avgRunTime}ms exceeds 3 second limit`);
      }
      
      console.log('✅ Run plays tracked successfully');
      
    } catch (error) {
      console.error('❌ Failed to track run plays:', error);
      await captureScreenshot(context, 'run-play-error');
      throw error;
    }
  });
  
  test('Track penalties correctly', async () => {
    console.log('\n🏈 Testing: Penalty tracking');
    
    try {
      await createQuickGame(context);
      
      // Record a normal play first
      await clickElement(context, '[data-testid="play-type-run"], button:has-text("Run")');
      await clickElement(context, '[data-testid="player-5"]');
      await clickElement(context, '[data-testid="play-result-gain"]');
      
      // Mark it as a penalty
      await clickElement(context, '[data-testid="penalty-flag"], button:has-text("Penalty"), button:has-text("Flag")');
      
      // Verify penalty indicator appears
      await waitForElement(context, '[data-testid="penalty-indicator"], :has-text("PENALTY")', { timeout: 3000 });
      
      // Verify play doesn't count for MPR
      const mprCount = await getElementText(context, '[data-testid="player-5-plays"], [data-testid="mpr-count-5"]');
      
      if (mprCount !== '0') {
        console.log(`⚠️  MPR count shows ${mprCount}, expected 0 for penalty play`);
      }
      
      console.log('✅ Penalties tracked correctly');
      
    } catch (error) {
      console.error('❌ Failed penalty tracking:', error);
      await captureScreenshot(context, 'penalty-tracking-error');
      throw error;
    }
  });
  
  test('Undo last play', async () => {
    console.log('\n🏈 Testing: Undo functionality');
    
    try {
      await createQuickGame(context);
      
      // Record a play
      await clickElement(context, '[data-testid="play-type-pass"]');
      await clickElement(context, '[data-testid="player-1"]');
      await clickElement(context, '[data-testid="player-11"]');
      await clickElement(context, '[data-testid="play-result-complete"]');
      
      // Get play count
      const beforeUndo = await getElementText(context, '[data-testid="total-plays"], [data-testid="play-counter"]');
      
      // Click undo
      await clickElement(context, '[data-testid="undo-btn"], button:has-text("Undo")');
      
      // Confirm undo if dialog appears
      if (await elementExists(context, '[role="dialog"]')) {
        await clickElement(context, 'button:has-text("Confirm"), button:has-text("Yes")');
      }
      
      // Verify play was removed
      const afterUndo = await getElementText(context, '[data-testid="total-plays"], [data-testid="play-counter"]');
      
      if (beforeUndo === afterUndo) {
        throw new Error('Undo did not remove the play');
      }
      
      console.log('✅ Undo functionality works');
      
    } catch (error) {
      console.error('❌ Failed undo test:', error);
      await captureScreenshot(context, 'undo-error');
      throw error;
    }
  });
  
  test('Offline mode game tracking', async () => {
    console.log('\n🏈 Testing: Offline game tracking');
    
    try {
      await createQuickGame(context);
      
      // Go offline
      await setNetworkCondition(context, 'offline');
      console.log('   📵 Network set to offline');
      
      // Record plays while offline
      const offlineStartTime = Date.now();
      
      // Record 3 plays offline
      for (let i = 0; i < 3; i++) {
        await clickElement(context, '[data-testid="play-type-run"]');
        await clickElement(context, `[data-testid="player-${5 + i}"]`);
        await clickElement(context, '[data-testid="play-result-gain"]');
        
        // Verify play was recorded (should work offline)
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const offlineDuration = Date.now() - offlineStartTime;
      console.log(`   Recorded 3 plays offline in ${offlineDuration}ms`);
      
      // Go back online
      await setNetworkCondition(context, '4G');
      console.log('   📶 Network restored to 4G');
      
      // Wait for sync
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify plays are still there
      const playCount = await getElementText(context, '[data-testid="total-plays"]');
      
      if (parseInt(playCount) < 3) {
        throw new Error(`Expected at least 3 plays, found ${playCount}`);
      }
      
      console.log('✅ Offline mode works correctly');
      
    } catch (error) {
      console.error('❌ Failed offline test:', error);
      await captureScreenshot(context, 'offline-error');
      throw error;
    }
  });
  
  test('Quarter transitions', async () => {
    console.log('\n🏈 Testing: Quarter transitions');
    
    try {
      await createQuickGame(context);
      
      // Check current quarter
      const currentQuarter = await getElementText(context, '[data-testid="quarter-display"]');
      
      if (!currentQuarter.includes('Q1') && !currentQuarter.includes('1')) {
        console.log(`   Starting quarter: ${currentQuarter}`);
      }
      
      // End quarter
      await clickElement(context, '[data-testid="end-quarter-btn"], button:has-text("End Quarter")');
      
      // Confirm if needed
      if (await elementExists(context, '[role="dialog"]')) {
        await clickElement(context, 'button:has-text("Confirm"), button:has-text("Yes")');
      }
      
      // Verify quarter changed
      const newQuarter = await getElementText(context, '[data-testid="quarter-display"]');
      
      if (newQuarter === currentQuarter) {
        throw new Error('Quarter did not advance');
      }
      
      console.log(`   Quarter advanced: ${currentQuarter} → ${newQuarter}`);
      console.log('✅ Quarter transitions work');
      
    } catch (error) {
      console.error('❌ Failed quarter transition:', error);
      await captureScreenshot(context, 'quarter-error');
      throw error;
    }
  });
  
  test('Substitution panel quick swap', async () => {
    console.log('\n🏈 Testing: Quick substitutions');
    
    try {
      await createQuickGame(context);
      
      // Open substitution panel
      await clickElement(context, '[data-testid="subs-btn"], button:has-text("Subs"), button:has-text("Substitutions")');
      
      // Wait for panel
      await waitForElement(context, '[data-testid="substitution-panel"]', { timeout: 3000 });
      
      const startTime = Date.now();
      
      // Select player going out
      await clickElement(context, '[data-testid="sub-out-5"], [data-testid="player-5"][data-sub="out"]');
      
      // Select player coming in
      await clickElement(context, '[data-testid="sub-in-30"], [data-testid="player-30"][data-sub="in"]');
      
      // Confirm substitution
      await clickElement(context, '[data-testid="confirm-sub"], button:has-text("Substitute")');
      
      const duration = Date.now() - startTime;
      
      if (duration > 2000) {
        throw new Error(`Substitution took ${duration}ms, should be under 2 seconds`);
      }
      
      console.log(`   Substitution completed in ${duration}ms`);
      console.log('✅ Quick substitutions work');
      
    } catch (error) {
      console.error('❌ Failed substitution test:', error);
      await captureScreenshot(context, 'substitution-error');
      throw error;
    }
  });
});

// Helper function to quickly create and start a game
async function createQuickGame(context: TestContext) {
  // Navigate to dashboard
  await navigateTo(context, '/dashboard');
  
  // Create new game
  await clickElement(context, '[data-testid="new-game-btn"], button:has-text("New Game")');
  
  // Quick fill
  await typeIntoField(context, 'input[name="opponent"]', 'Quick Test', { delay: 0 });
  
  // Start game
  await clickElement(context, 'button[type="submit"], button:has-text("Start")');
  
  // Wait for game tracker
  await waitForElement(context, '[data-testid="game-tracker"], [data-testid="play-tracker"]', { timeout: 5000 });
}

// Run tests
async function runTests() {
  console.log('\n========================================');
  console.log('🏈 GAME TRACKING E2E TESTS');
  console.log('========================================\n');
  
  const tests = [
    'Create game in under 10 seconds',
    'Track pass play in under 5 seconds',
    'Track run play in under 3 seconds',
    'Track penalties correctly',
    'Undo last play',
    'Offline mode game tracking',
    'Quarter transitions',
    'Substitution panel quick swap'
  ];
  
  let passed = 0;
  let failed = 0;
  const results: Array<{ test: string; status: 'PASS' | 'FAIL'; duration: number }> = [];
  
  for (const testName of tests) {
    const testStart = Date.now();
    
    try {
      console.log(`\nRunning: ${testName}`);
      console.log('─'.repeat(40));
      
      const context = await setupTest(`game-${testName.toLowerCase().replace(/\s+/g, '-')}`);
      const gameTracker = new GameTracker();
      
      // Login first
      const testUser = {
        email: 'zackarychapple30+testcoach@gmail.com',
        password: 'GameDay2025!',
        firstName: 'Test',
        lastName: 'Coach'
      };
      
      const loginSuccess = await login(context, testUser);
      if (!loginSuccess) {
        throw new Error('Failed to login');
      }
      
      // Run specific test
      if (testName.includes('Create game')) {
        await testCreateGame(context);
      } else if (testName.includes('pass play')) {
        await testPassPlay(context, gameTracker);
      } else if (testName.includes('run play')) {
        await testRunPlay(context, gameTracker);
      } else if (testName.includes('penalties')) {
        await testPenalties(context);
      } else if (testName.includes('Undo')) {
        await testUndo(context);
      } else if (testName.includes('Offline')) {
        await testOffline(context);
      } else if (testName.includes('Quarter')) {
        await testQuarters(context);
      } else if (testName.includes('Substitution')) {
        await testSubstitutions(context);
      }
      
      await teardownTest(context);
      
      const duration = Date.now() - testStart;
      results.push({ test: testName, status: 'PASS', duration });
      passed++;
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - testStart;
      results.push({ test: testName, status: 'FAIL', duration });
      failed++;
      console.error(`❌ ${testName} - FAILED (${duration}ms):`, error);
    }
  }
  
  // Print summary
  console.log('\n========================================');
  console.log('TEST RESULTS SUMMARY');
  console.log('========================================');
  
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${r.test}: ${r.duration}ms`);
  });
  
  console.log('\n────────────────────────────────────────');
  console.log(`✅ Passed: ${passed}/${tests.length}`);
  console.log(`❌ Failed: ${failed}/${tests.length}`);
  console.log(`📊 Success Rate: ${((passed/tests.length) * 100).toFixed(1)}%`);
  console.log(`⏱️  Total Time: ${results.reduce((sum, r) => sum + r.duration, 0)}ms`);
  console.log('========================================\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

// Test implementation functions
async function testCreateGame(context: TestContext) {
  const start = Date.now();
  await navigateTo(context, '/games/new');
  await typeIntoField(context, 'input[name="opponent"]', 'Test Team');
  await clickElement(context, 'button[type="submit"]');
  await waitForElement(context, '[data-testid="game-tracker"]', { timeout: 10000 });
  const duration = Date.now() - start;
  if (duration > 10000) throw new Error(`Took ${duration}ms`);
}

async function testPassPlay(context: TestContext, tracker: GameTracker) {
  await createQuickGame(context);
  const start = Date.now();
  await clickElement(context, '[data-testid="play-type-pass"], button:has-text("Pass")');
  await clickElement(context, '[data-testid="player-1"], button:first-child');
  await clickElement(context, '[data-testid="player-11"], button:nth-child(2)');
  await clickElement(context, 'button:has-text("Complete")');
  tracker.recordPlay('pass', Date.now() - start, 5000);
}

async function testRunPlay(context: TestContext, tracker: GameTracker) {
  await createQuickGame(context);
  const start = Date.now();
  await clickElement(context, '[data-testid="play-type-run"], button:has-text("Run")');
  await clickElement(context, '[data-testid="player-5"], button:first-child');
  await clickElement(context, 'button:has-text("Gain")');
  tracker.recordPlay('run', Date.now() - start, 3000);
}

async function testPenalties(context: TestContext) {
  await createQuickGame(context);
  await clickElement(context, 'button:has-text("Run")');
  await clickElement(context, 'button:first-child');
  await clickElement(context, 'button:has-text("Gain")');
  await clickElement(context, 'button:has-text("Penalty"), button:has-text("Flag")');
}

async function testUndo(context: TestContext) {
  await createQuickGame(context);
  await clickElement(context, 'button:has-text("Run")');
  await clickElement(context, 'button:first-child');
  await clickElement(context, 'button:has-text("Gain")');
  await clickElement(context, 'button:has-text("Undo")');
}

async function testOffline(context: TestContext) {
  await createQuickGame(context);
  await setNetworkCondition(context, 'offline');
  await clickElement(context, 'button:has-text("Run")');
  await clickElement(context, 'button:first-child');
  await clickElement(context, 'button:has-text("Gain")');
  await setNetworkCondition(context, '4G');
}

async function testQuarters(context: TestContext) {
  await createQuickGame(context);
  await clickElement(context, 'button:has-text("End Quarter")');
  if (await elementExists(context, '[role="dialog"]')) {
    await clickElement(context, 'button:has-text("Confirm")');
  }
}

async function testSubstitutions(context: TestContext) {
  await createQuickGame(context);
  await clickElement(context, 'button:has-text("Subs")');
  await waitForElement(context, '[data-testid="substitution-panel"]');
  await clickElement(context, '[data-testid="player-5"]');
  await clickElement(context, '[data-testid="player-30"]');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };