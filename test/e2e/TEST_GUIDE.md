# Football Tracker E2E Testing Guide

## Overview

This guide covers the comprehensive E2E test suite for the Football Tracker application. These tests validate critical game-day operations, ensuring coaches can reliably track plays and manage their teams during actual games.

## Test Coverage

### 1. Authentication Tests (`auth.test.ts`)
- User login with valid/invalid credentials
- Session persistence
- Password reset flow
- Sign up with team creation
- Remember me functionality

### 2. Roster Management Tests (`roster.test.ts`)
- **Add single player** - Must complete in < 5 seconds
- **Bulk import 20+ players** - Tests roster upload functionality
- **Mark player as striped** - Players who cannot run the ball
- **Duplicate jersey prevention** - Ensures unique numbers
- **Edit player information** - Update names, positions
- **Touch target validation** - Minimum 56px for gloved hands

### 3. Game Tracking Tests (`game.test.ts`)
- **Create game** - Must complete in < 10 seconds
- **Track pass plays** - Must complete in < 5 seconds
- **Track run plays** - Must complete in < 3 seconds
- **Penalty tracking** - Plays marked with flags
- **Undo functionality** - Correct mistakes quickly
- **Offline mode** - Full functionality without internet
- **Quarter transitions** - Advance through game periods
- **Quick substitutions** - Swap players in < 2 seconds

### 4. MPR Compliance Tests (`mpr.test.ts`)
- **Color coding** - Red (0-3), Yellow (4-6), Green (7+)
- **Real-time updates** - Instant MPR count changes
- **Penalty exclusion** - Penalties don't count toward MPR
- **Striped violations** - Track illegal ball carries
- **Quarter tracking** - MPR across all quarters
- **Compliance reports** - End-of-game MPR summary
- **Parent view** - Read-only access to MPR data

## Running Tests

### Quick Commands

```bash
# Run all tests
npm run test:e2e:all

# Run specific test suites
npm run test:e2e:auth      # Authentication only
npm run test:e2e:roster    # Roster management only
npm run test:e2e:game      # Game tracking only
npm run test:e2e:mpr       # MPR compliance only

# Debug mode (shows browser)
npm run test:e2e:roster:debug
npm run test:e2e:game:debug
npm run test:e2e:mpr:debug

# Run with custom settings
HEADLESS=false npm run test:e2e:all     # Show browser
SLOW_MO=500 npm run test:e2e:game       # Slow down actions
BASE_URL=https://staging.app npm test    # Test staging
```

### Test Credentials

```javascript
// Primary test account
Email: zackarychapple30+testcoach@gmail.com
Password: GameDay2025!
Role: Head Coach

// Secondary test account
Email: coach.test@footballtracker.app
Password: GameDay2025!
Team: Cobb Eagles (Test Team)
```

## Performance Requirements

### Critical Metrics
- **App Load**: < 3 seconds on 4G
- **Play Entry**: < 5 seconds for pass plays
- **Run Plays**: < 3 seconds to record
- **Substitutions**: < 2 seconds to swap
- **Game Creation**: < 10 seconds total
- **Screen Transitions**: < 500ms

### Touch Targets
- Minimum button size: 56x56 pixels
- Designed for gloved hands
- High contrast for sunlight visibility
- One-handed operation required

## Test Output

### Console Output
Tests provide real-time feedback:
```
🏈 Testing: Track pass plays
   ✅ PASS play: 3421ms (max: 5000ms)
   ✅ PASS play: 2890ms (max: 5000ms)
   Average pass play time: 3155ms
✅ Pass plays tracked successfully
```

### Test Results Location
- **Screenshots**: `test-results/screenshots/`
- **Logs**: `test-results/logs/`
- **Reports**: `test-results/reports/`
- **Videos**: `test-results/videos/` (if enabled)

### Understanding Results

#### Success Indicators
- ✅ Green checkmarks = Test passed
- All performance metrics met
- No console errors detected
- Screenshots show expected UI

#### Failure Indicators
- ❌ Red X = Test failed
- Performance exceeded limits
- UI elements not found
- Console errors detected

## Common Issues & Solutions

### Issue: Tests fail with "element not found"
**Solution**: Check if the app is running and selectors match current HTML
```bash
# Start the app first
npm run dev

# Then run tests in another terminal
npm run test:e2e:all
```

### Issue: Login tests failing
**Solution**: Verify Supabase is configured and test users exist
```bash
# Seed test users
npm run seed:test-users

# Check Supabase connection
curl YOUR_SUPABASE_URL/auth/v1/health
```

### Issue: Slow test execution
**Solution**: Run in headless mode and check network conditions
```bash
# Headless mode is faster
HEADLESS=true npm run test:e2e:all

# Check for network issues
ping supabase.co
```

### Issue: Offline tests failing
**Solution**: Ensure service worker is registered
```bash
# Check service worker registration
grep -r "serviceWorker.register" src/
```

## Test Strategy

### Priority 0 (Must Pass)
1. Authentication flow
2. Game creation
3. Play tracking (pass/run)
4. MPR dashboard updates
5. Offline functionality

### Priority 1 (Should Pass)
1. Roster bulk import
2. Substitution tracking
3. Penalty handling
4. Quarter transitions
5. Parent view access

### Priority 2 (Nice to Have)
1. Advanced statistics
2. Season tracking
3. Report exports
4. Multi-team management

## Continuous Integration

### GitHub Actions Setup
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - run: npm run test:e2e:all
```

### Pre-Game Testing Checklist
Before each game day:
1. ✓ Run full test suite
2. ✓ Verify offline mode works
3. ✓ Test with actual roster
4. ✓ Check MPR calculations
5. ✓ Confirm parent share codes
6. ✓ Test on actual device

## Debugging Failed Tests

### Enable Debug Mode
```bash
# See what's happening in the browser
HEADLESS=false SLOW_MO=250 npm run test:e2e:game
```

### Check Screenshots
Failed tests automatically capture screenshots:
```bash
# View failure screenshots
open test-results/screenshots/
```

### Review Logs
Detailed logs for each test run:
```bash
# View test logs
cat test-results/logs/game-tracking-*.json | jq .
```

### Common Selectors
```javascript
// Authentication
'input[type="email"]'
'input[type="password"]'
'button[type="submit"]'

// Roster
'[data-testid="add-player-btn"]'
'[data-testid="player-99"]'
'[data-testid="bulk-import-btn"]'

// Game Tracking
'[data-testid="play-type-pass"]'
'[data-testid="play-type-run"]'
'[data-testid="player-5"]'
'[data-testid="play-result-complete"]'

// MPR
'[data-testid="mpr-dashboard"]'
'[data-testid="play-count"]'
'[data-testid="compliance-rate"]'
```

## Best Practices

### 1. Test Data Management
- Use consistent test data
- Clean up after tests
- Don't modify production data
- Use unique identifiers

### 2. Performance Testing
- Test on throttled networks
- Simulate mobile devices
- Measure critical paths
- Monitor memory usage

### 3. Accessibility Testing
- Verify touch target sizes
- Check color contrast
- Test with screen readers
- Validate keyboard navigation

### 4. Game Day Simulation
- Test full game scenarios
- Include penalties and timeouts
- Verify MPR calculations
- Test with 20+ players

## Support

For test-related issues:
1. Check this guide first
2. Review test output carefully
3. Check application logs
4. Verify test environment setup

Remember: These tests ensure coaches can rely on the app during actual games. Every test failure represents a potential game-day problem that could affect MPR compliance and team management.