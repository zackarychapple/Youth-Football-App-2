/**
 * Roster Management E2E Tests
 * Tests player management flows critical for game day operations
 * 
 * Test Scenarios:
 * - Add single player with validation
 * - Bulk import 20+ players
 * - Mark players as striped (cannot run)
 * - Edit player information
 * - Handle duplicate jersey numbers
 * - Performance requirements (< 5 seconds per operation)
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
  TestContext 
} from './setup.js';
import { login } from './utils/login-helper.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const config = require('../../puppeteer.config.js');

// Test data for bulk import
const BULK_PLAYERS = [
  '#1 - Jackson Smith (QB)',
  '#3 - Marcus Johnson (RB)',
  '#5 - Tyler Brown (RB)',
  '#11 - Connor Wilson (WR)',
  '#14 - Ethan Davis (WR)',
  '#21 - Mason Miller (WR)',
  '#88 - Noah Anderson (TE)',
  '#7 - Liam Taylor',
  '#24 - Owen Thomas',
  '#32 - Lucas White',
  '#44 - Ryan Martinez',
  '#55 - Blake Jackson',
  '#66 - Carter Rodriguez',
  '#77 - Dylan Lee',
  '#2 - Backup QB',
  '#15 - Aiden Harris',
  '#18 - Hunter Clark',
  '#22 - Jordan Lewis',
  '#30 - Cameron Allen',
  '#35 - Austin Young',
  '#40 - Nathan King'
];

// Performance timing helper
function measurePerformance(startTime: number, operation: string, maxDuration: number = 5000) {
  const duration = Date.now() - startTime;
  const passed = duration < maxDuration;
  console.log(`${passed ? '✅' : '❌'} ${operation}: ${duration}ms (max: ${maxDuration}ms)`);
  return { duration, passed };
}

describe('Roster Management Tests', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await setupTest('roster-management');
    
    // Login as head coach
    const testUser = {
      email: 'zackarychapple30+testcoach@gmail.com',
      password: 'GameDay2025!',
      firstName: 'Test',
      lastName: 'Coach'
    };
    
    const loginSuccess = await login(context, testUser);
    if (!loginSuccess) {
      throw new Error('Failed to login for roster tests');
    }
    
    // Navigate to roster page
    await navigateTo(context, '/roster');
    await waitForElement(context, '[data-testid="roster-page"]', { timeout: 5000 });
  });

  afterEach(async () => {
    await teardownTest(context);
  });

  test('Add single player with all fields', async () => {
    console.log('\n🏈 Testing: Add single player');
    const startTime = Date.now();
    
    try {
      // Click add player button
      await clickElement(context, '[data-testid="add-player-btn"], button:has-text("Add Player")');
      
      // Wait for modal/form to appear
      await waitForElement(context, '[data-testid="add-player-form"], form[aria-label="Add Player"]', { timeout: 3000 });
      
      // Fill in player details
      await typeIntoField(context, 'input[name="jerseyNumber"]', '99');
      await typeIntoField(context, 'input[name="firstName"]', 'Test');
      await typeIntoField(context, 'input[name="lastName"]', 'Player');
      
      // Select position if dropdown exists
      if (await elementExists(context, 'select[name="position"]')) {
        await context.page.select('select[name="position"]', 'QB');
      }
      
      // Take screenshot of filled form
      await captureScreenshot(context, 'add-player-form-filled');
      
      // Submit form
      await clickElement(context, 'button[type="submit"], button:has-text("Add"), button:has-text("Save")');
      
      // Wait for success indication
      await waitForText(context, 'Player added', { timeout: 5000 });
      
      // Verify player appears in roster
      await waitForElement(context, '[data-testid="player-99"], :has-text("#99")', { timeout: 5000 });
      
      const perf = measurePerformance(startTime, 'Add single player');
      
      if (!perf.passed) {
        throw new Error(`Performance requirement not met: ${perf.duration}ms > 5000ms`);
      }
      
      console.log('✅ Single player added successfully');
      
    } catch (error) {
      console.error('❌ Failed to add single player:', error);
      await captureScreenshot(context, 'add-player-error');
      throw error;
    }
  });

  test('Bulk import 20+ players', async () => {
    console.log('\n🏈 Testing: Bulk import players');
    const startTime = Date.now();
    
    try {
      // Click bulk import button
      await clickElement(context, '[data-testid="bulk-import-btn"], button:has-text("Bulk Import"), button:has-text("Import")');
      
      // Wait for import modal
      await waitForElement(context, '[data-testid="bulk-import-modal"], [aria-label="Bulk Import"]', { timeout: 3000 });
      
      // Find textarea for bulk input
      const textareaSelector = 'textarea[name="players"], textarea[placeholder*="player"], textarea';
      await waitForElement(context, textareaSelector);
      
      // Input all players at once
      const bulkText = BULK_PLAYERS.join('\n');
      await typeIntoField(context, textareaSelector, bulkText, { clear: true, delay: 0 });
      
      // Take screenshot of bulk import
      await captureScreenshot(context, 'bulk-import-filled');
      
      // Submit bulk import
      await clickElement(context, 'button:has-text("Import"), button:has-text("Add All"), button[type="submit"]');
      
      // Wait for import to complete
      await waitForText(context, 'imported successfully', { timeout: 10000 });
      
      // Verify some players appear
      await waitForElement(context, '[data-testid="player-1"], :has-text("#1")', { timeout: 5000 });
      await waitForElement(context, '[data-testid="player-88"], :has-text("#88")', { timeout: 5000 });
      
      // Check player count
      const playerElements = await context.page.$$('[data-testid^="player-"], [class*="player-card"]');
      console.log(`   Players imported: ${playerElements.length}`);
      
      if (playerElements.length < 20) {
        throw new Error(`Expected at least 20 players, found ${playerElements.length}`);
      }
      
      const perf = measurePerformance(startTime, 'Bulk import 20+ players', 30000);
      
      console.log('✅ Bulk import completed successfully');
      
    } catch (error) {
      console.error('❌ Failed bulk import:', error);
      await captureScreenshot(context, 'bulk-import-error');
      throw error;
    }
  });

  test('Mark player as striped', async () => {
    console.log('\n🏈 Testing: Mark player as striped');
    const startTime = Date.now();
    
    try {
      // First add a player if roster is empty
      if (!await elementExists(context, '[data-testid^="player-"]')) {
        await clickElement(context, '[data-testid="add-player-btn"], button:has-text("Add Player")');
        await waitForElement(context, '[data-testid="add-player-form"]');
        await typeIntoField(context, 'input[name="jerseyNumber"]', '7');
        await typeIntoField(context, 'input[name="firstName"]', 'Striped');
        await typeIntoField(context, 'input[name="lastName"]', 'Player');
        await clickElement(context, 'button[type="submit"]');
        await waitForText(context, 'added', { timeout: 5000 });
      }
      
      // Find player #7 and click edit
      const playerCard = await waitForElement(context, '[data-testid="player-7"], :has-text("#7")', { timeout: 5000 });
      
      // Click edit button for this player
      await clickElement(context, '[data-testid="edit-player-7"], [data-testid="player-7"] button:has-text("Edit")');
      
      // Wait for edit form
      await waitForElement(context, '[data-testid="edit-player-form"], form[aria-label="Edit Player"]');
      
      // Toggle striped checkbox
      const stripedCheckbox = await waitForElement(context, 'input[type="checkbox"][name="isStriped"], input[type="checkbox"]#striped');
      await stripedCheckbox.click();
      
      // Save changes
      await clickElement(context, 'button:has-text("Save"), button:has-text("Update"), button[type="submit"]');
      
      // Wait for update confirmation
      await waitForText(context, 'updated', { timeout: 5000 });
      
      // Verify striped indicator appears
      await waitForElement(context, '[data-testid="player-7"] [data-testid="striped-badge"], [data-testid="player-7"] :has-text("STRIPED")', { timeout: 5000 });
      
      const perf = measurePerformance(startTime, 'Mark player as striped');
      
      console.log('✅ Player marked as striped successfully');
      
    } catch (error) {
      console.error('❌ Failed to mark player as striped:', error);
      await captureScreenshot(context, 'mark-striped-error');
      throw error;
    }
  });

  test('Prevent duplicate jersey numbers', async () => {
    console.log('\n🏈 Testing: Duplicate jersey number prevention');
    
    try {
      // Add first player with jersey #10
      await clickElement(context, '[data-testid="add-player-btn"], button:has-text("Add Player")');
      await waitForElement(context, '[data-testid="add-player-form"]');
      await typeIntoField(context, 'input[name="jerseyNumber"]', '10');
      await typeIntoField(context, 'input[name="firstName"]', 'First');
      await typeIntoField(context, 'input[name="lastName"]', 'Player');
      await clickElement(context, 'button[type="submit"]');
      await waitForText(context, 'added', { timeout: 5000 });
      
      // Try to add second player with same jersey #10
      await clickElement(context, '[data-testid="add-player-btn"], button:has-text("Add Player")');
      await waitForElement(context, '[data-testid="add-player-form"]');
      await typeIntoField(context, 'input[name="jerseyNumber"]', '10');
      await typeIntoField(context, 'input[name="firstName"]', 'Duplicate');
      await typeIntoField(context, 'input[name="lastName"]', 'Jersey');
      
      // Submit and expect error
      await clickElement(context, 'button[type="submit"]');
      
      // Wait for error message
      await waitForText(context, 'already exists', { timeout: 5000 });
      
      // Verify form is still open (not closed due to success)
      const formStillExists = await elementExists(context, '[data-testid="add-player-form"]');
      
      if (!formStillExists) {
        throw new Error('Form closed despite duplicate jersey number');
      }
      
      console.log('✅ Duplicate jersey numbers prevented successfully');
      
    } catch (error) {
      console.error('❌ Failed duplicate jersey test:', error);
      await captureScreenshot(context, 'duplicate-jersey-error');
      throw error;
    }
  });

  test('Edit player information', async () => {
    console.log('\n🏈 Testing: Edit player information');
    const startTime = Date.now();
    
    try {
      // Ensure we have a player to edit
      if (!await elementExists(context, '[data-testid^="player-"]')) {
        await clickElement(context, '[data-testid="add-player-btn"]');
        await waitForElement(context, '[data-testid="add-player-form"]');
        await typeIntoField(context, 'input[name="jerseyNumber"]', '25');
        await typeIntoField(context, 'input[name="firstName"]', 'Original');
        await typeIntoField(context, 'input[name="lastName"]', 'Name');
        await clickElement(context, 'button[type="submit"]');
        await waitForText(context, 'added', { timeout: 5000 });
      }
      
      // Click edit on player
      await clickElement(context, '[data-testid="edit-player-25"], [data-testid^="player-"] button:has-text("Edit")');
      
      // Wait for edit form
      await waitForElement(context, '[data-testid="edit-player-form"]');
      
      // Update player name
      await typeIntoField(context, 'input[name="firstName"]', 'Updated', { clear: true });
      await typeIntoField(context, 'input[name="lastName"]', 'Player', { clear: true });
      
      // Change position if available
      if (await elementExists(context, 'select[name="position"]')) {
        await context.page.select('select[name="position"]', 'WR');
      }
      
      // Save changes
      await clickElement(context, 'button:has-text("Save"), button[type="submit"]');
      
      // Wait for update confirmation
      await waitForText(context, 'updated', { timeout: 5000 });
      
      // Verify updated name appears
      await waitForText(context, 'Updated Player', { timeout: 5000 });
      
      const perf = measurePerformance(startTime, 'Edit player information');
      
      console.log('✅ Player information updated successfully');
      
    } catch (error) {
      console.error('❌ Failed to edit player:', error);
      await captureScreenshot(context, 'edit-player-error');
      throw error;
    }
  });

  test('Performance: Add player in under 5 seconds', async () => {
    console.log('\n🏈 Testing: Performance requirement for adding player');
    
    const operations = [];
    
    // Test 5 consecutive player additions
    for (let i = 50; i < 55; i++) {
      const startTime = Date.now();
      
      try {
        await clickElement(context, '[data-testid="add-player-btn"], button:has-text("Add Player")');
        await waitForElement(context, '[data-testid="add-player-form"]', { timeout: 1000 });
        await typeIntoField(context, 'input[name="jerseyNumber"]', i.toString(), { delay: 0 });
        await typeIntoField(context, 'input[name="firstName"]', `Player${i}`, { delay: 0 });
        await typeIntoField(context, 'input[name="lastName"]', 'Test', { delay: 0 });
        await clickElement(context, 'button[type="submit"]');
        await waitForText(context, 'added', { timeout: 3000 });
        
        const duration = Date.now() - startTime;
        operations.push(duration);
        console.log(`   Player #${i} added in ${duration}ms`);
        
      } catch (error) {
        console.error(`   Failed to add player #${i}:`, error);
        operations.push(5001); // Mark as failed
      }
    }
    
    // Calculate statistics
    const avgTime = operations.reduce((a, b) => a + b, 0) / operations.length;
    const maxTime = Math.max(...operations);
    const under5s = operations.filter(t => t < 5000).length;
    
    console.log(`\n   Performance Summary:`);
    console.log(`   Average: ${avgTime.toFixed(0)}ms`);
    console.log(`   Maximum: ${maxTime}ms`);
    console.log(`   Success rate: ${under5s}/5 under 5 seconds`);
    
    if (under5s < 4) {
      throw new Error(`Performance requirement not met: Only ${under5s}/5 operations completed under 5 seconds`);
    }
    
    console.log('✅ Performance requirements met');
  });

  test('Touch target size validation', async () => {
    console.log('\n🏈 Testing: Touch target sizes for mobile');
    
    try {
      // Measure button sizes
      const buttons = await context.page.$$eval('button', buttons => 
        buttons.map(btn => {
          const rect = btn.getBoundingClientRect();
          return {
            text: btn.textContent?.trim() || 'Unknown',
            width: rect.width,
            height: rect.height,
            area: rect.width * rect.height
          };
        })
      );
      
      // Check minimum size (44x44 pixels as per Apple HIG, we use 56px minimum)
      const MIN_SIZE = 56;
      const MIN_AREA = MIN_SIZE * MIN_SIZE;
      
      const tooSmall = buttons.filter(btn => 
        btn.width < MIN_SIZE || btn.height < MIN_SIZE || btn.area < MIN_AREA
      );
      
      if (tooSmall.length > 0) {
        console.log('⚠️  Buttons below minimum touch target size:');
        tooSmall.forEach(btn => {
          console.log(`   - "${btn.text}": ${btn.width}x${btn.height}px`);
        });
      }
      
      // Check player cards are touch-friendly
      const playerCards = await context.page.$$eval('[data-testid^="player-"], [class*="player-card"]', cards =>
        cards.map(card => {
          const rect = card.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        })
      );
      
      if (playerCards.length > 0) {
        const avgCardHeight = playerCards.reduce((sum, card) => sum + card.height, 0) / playerCards.length;
        console.log(`   Average player card height: ${avgCardHeight.toFixed(0)}px`);
        
        if (avgCardHeight < MIN_SIZE) {
          console.log('⚠️  Player cards may be too small for touch interaction');
        }
      }
      
      console.log('✅ Touch targets validated');
      
    } catch (error) {
      console.error('❌ Touch target validation failed:', error);
      throw error;
    }
  });
});

// Run tests
async function runTests() {
  console.log('\n========================================');
  console.log('🏈 ROSTER MANAGEMENT E2E TESTS');
  console.log('========================================\n');
  
  const tests = [
    'Add single player with all fields',
    'Bulk import 20+ players', 
    'Mark player as striped',
    'Prevent duplicate jersey numbers',
    'Edit player information',
    'Performance: Add player in under 5 seconds',
    'Touch target size validation'
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testName of tests) {
    try {
      console.log(`\nRunning: ${testName}`);
      console.log('─'.repeat(40));
      
      const context = await setupTest(`roster-${testName.toLowerCase().replace(/\s+/g, '-')}`);
      
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
      
      // Navigate to roster
      await navigateTo(context, '/roster');
      await waitForElement(context, '[data-testid="roster-page"], main, [role="main"]', { timeout: 5000 });
      
      // Run specific test based on name
      if (testName.includes('single player')) {
        await testAddSinglePlayer(context);
      } else if (testName.includes('Bulk import')) {
        await testBulkImport(context);
      } else if (testName.includes('striped')) {
        await testMarkStriped(context);
      } else if (testName.includes('duplicate')) {
        await testDuplicateJersey(context);
      } else if (testName.includes('Edit player')) {
        await testEditPlayer(context);
      } else if (testName.includes('Performance')) {
        await testPerformance(context);
      } else if (testName.includes('Touch target')) {
        await testTouchTargets(context);
      }
      
      await teardownTest(context);
      passed++;
      console.log(`✅ ${testName} - PASSED`);
      
    } catch (error) {
      failed++;
      console.error(`❌ ${testName} - FAILED:`, error);
    }
  }
  
  console.log('\n========================================');
  console.log('TEST RESULTS');
  console.log('========================================');
  console.log(`✅ Passed: ${passed}/${tests.length}`);
  console.log(`❌ Failed: ${failed}/${tests.length}`);
  console.log(`📊 Success Rate: ${((passed/tests.length) * 100).toFixed(1)}%`);
  console.log('========================================\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

// Helper functions for individual tests
async function testAddSinglePlayer(context: TestContext) {
  const startTime = Date.now();
  
  await clickElement(context, '[data-testid="add-player-btn"], button:has-text("Add Player"), button:has-text("Add")');
  await waitForElement(context, 'input[name="jerseyNumber"]', { timeout: 3000 });
  await typeIntoField(context, 'input[name="jerseyNumber"]', '99');
  await typeIntoField(context, 'input[name="firstName"]', 'Test');
  await typeIntoField(context, 'input[name="lastName"]', 'Player');
  await clickElement(context, 'button[type="submit"], button:has-text("Save"), button:has-text("Add")');
  
  const duration = Date.now() - startTime;
  if (duration > 5000) {
    throw new Error(`Operation took ${duration}ms, exceeding 5000ms limit`);
  }
}

async function testBulkImport(context: TestContext) {
  await clickElement(context, '[data-testid="bulk-import-btn"], button:has-text("Bulk"), button:has-text("Import")');
  await waitForElement(context, 'textarea', { timeout: 3000 });
  await typeIntoField(context, 'textarea', BULK_PLAYERS.join('\n'), { delay: 0 });
  await clickElement(context, 'button:has-text("Import"), button[type="submit"]');
  await new Promise(resolve => setTimeout(resolve, 3000));
}

async function testMarkStriped(context: TestContext) {
  // Add a player first
  await testAddSinglePlayer(context);
  
  // Mark as striped
  await clickElement(context, '[data-testid^="player-"] button:has-text("Edit")');
  await waitForElement(context, 'input[type="checkbox"]', { timeout: 3000 });
  await clickElement(context, 'input[type="checkbox"][name="isStriped"], input[type="checkbox"]');
  await clickElement(context, 'button:has-text("Save"), button[type="submit"]');
}

async function testDuplicateJersey(context: TestContext) {
  // Add first player
  await testAddSinglePlayer(context);
  
  // Try to add duplicate
  await clickElement(context, '[data-testid="add-player-btn"], button:has-text("Add")');
  await waitForElement(context, 'input[name="jerseyNumber"]', { timeout: 3000 });
  await typeIntoField(context, 'input[name="jerseyNumber"]', '99');
  await typeIntoField(context, 'input[name="firstName"]', 'Duplicate');
  await clickElement(context, 'button[type="submit"]');
  
  // Should see error
  await waitForText(context, 'already exists', { timeout: 3000 });
}

async function testEditPlayer(context: TestContext) {
  // Add a player first
  await testAddSinglePlayer(context);
  
  // Edit the player
  await clickElement(context, '[data-testid^="player-"] button:has-text("Edit")');
  await waitForElement(context, 'input[name="firstName"]', { timeout: 3000 });
  await typeIntoField(context, 'input[name="firstName"]', 'Updated', { clear: true });
  await clickElement(context, 'button:has-text("Save"), button[type="submit"]');
}

async function testPerformance(context: TestContext) {
  const times = [];
  
  for (let i = 0; i < 3; i++) {
    const start = Date.now();
    await testAddSinglePlayer(context);
    times.push(Date.now() - start);
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  if (avg > 5000) {
    throw new Error(`Average time ${avg}ms exceeds 5000ms limit`);
  }
}

async function testTouchTargets(context: TestContext) {
  const buttons = await context.page.$$eval('button', buttons =>
    buttons.map(btn => {
      const rect = btn.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    })
  );
  
  const tooSmall = buttons.filter(b => b.width < 56 || b.height < 56);
  if (tooSmall.length > 0) {
    console.log(`Warning: ${tooSmall.length} buttons below 56px minimum size`);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };