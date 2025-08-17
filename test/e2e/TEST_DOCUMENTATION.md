# E2E Test Documentation

## Overview

Comprehensive Puppeteer test suite for the Football Tracker application, focusing on user workflows, error monitoring, and mobile experience validation.

## Test Files

### 1. `user-flow.test.ts` - Complete User Journey Test
Tests the full user workflow from sign-in to team management.

**Coverage:**
- Coach account sign-in and dashboard navigation
- Mock coach account with team join functionality  
- Sign out and sign back in (session persistence)
- Mobile touch interactions
- Navigation flow through all sections
- Browser back/forward navigation
- API call success verification
- Network error detection

**Test Accounts:**
- Coach: `zackarychapple30+testcoach@gmail.com` / `GameDay2025!`
- Mock Coach: `zackarychapple30+mock1@gmail.com` / `GameDay2025!`

### 2. `console-errors.test.ts` - Console Errors Monitoring
Ensures no console errors, network failures, or JavaScript exceptions occur.

**Coverage:**
- All public pages (home, sign-in, sign-up, forgot password)
- All authenticated pages (dashboard, roster, games, team)
- JavaScript error detection
- Network failure monitoring (404s, 500s, failed requests)
- Console error and warning tracking
- Form interaction error checking
- Navigation menu interactions
- Scroll behavior validation

**Error Categories Tracked:**
- Console errors (filtered for relevance)
- Network errors (4xx, 5xx responses)
- JavaScript exceptions
- Failed resource loads

### 3. `onboarding.test.ts` - Team Creation and Onboarding
Tests the complete onboarding flow including team creation and joining.

**Coverage:**
- New user signup and team creation
- Join existing team with invite code
- Existing user team management
- Onboarding validation and error handling
- Mobile-specific onboarding experience
- Touch interactions and gestures
- Orientation change handling
- Viewport and responsive layout testing
- Minimum touch target validation (44px iOS standard)

**Test Scenarios:**
- Create new team with all settings
- Join team using invite code
- Update existing team settings
- Validation error handling
- Mobile keyboard interactions
- Touch scrolling and swiping

## Running Tests

### Individual Test Suites

```bash
# Run user flow tests
npm run test:e2e:user-flow

# Run console error monitoring
npm run test:e2e:console-errors

# Run onboarding tests
npm run test:e2e:onboarding

# Run all comprehensive tests
npm run test:e2e:comprehensive
```

### Debug Mode (Visual)

```bash
# Run with browser visible and slow motion
npm run test:e2e:user-flow:debug
npm run test:e2e:console-errors:debug
npm run test:e2e:onboarding:debug
```

### Run All Tests

```bash
# Run all E2E tests including legacy tests
npm run test:e2e:all
```

## Test Configuration

### Mobile Viewport Settings
- **Default**: 375x667 (iPhone SE/8 size)
- **Touch Enabled**: Yes
- **Device Scale Factor**: 2-3
- **User Agent**: iPhone iOS 14+

### Network Conditions Tested
- **4G**: 4 Mbps down, 3 Mbps up, 20ms latency
- **3G**: 1.6 Mbps down, 768 Kbps up, 100ms latency
- **Offline**: Complete network disconnection

### Error Detection Patterns

#### Console Errors (Monitored)
- `/error/i`
- `/exception/i`
- `/failed/i`
- `/unauthorized/i`
- `/forbidden/i`
- `/supabase/i`

#### Ignored Patterns
- React DevTools messages
- Redux DevTools messages
- Vite HMR messages
- Expected 404s (favicons, source maps)

## Test Output

### Screenshots
Located in `test-results/screenshots/`
- Captured at key points in user flow
- Error states automatically captured
- Mobile and desktop viewports

### Logs
Located in `test-results/logs/`
- JSON format with timestamps
- Console messages
- Network requests/responses
- Error summaries

### Reports
Located in `test-results/reports/`
- Test execution summaries
- Error aggregation reports
- Performance metrics

## Environment Variables

```bash
# Control test execution
HEADLESS=false         # Show browser window
SLOW_MO=250           # Slow down actions by 250ms
BASE_URL=http://localhost:3000  # Target URL
TEST_TIMEOUT=60000    # Test timeout in ms
SCREENSHOT_ON_ERROR=true  # Capture screenshots on error
VIDEO_ON_ERROR=false  # Record video on error
RETRY_TIMES=2         # Number of retries on failure
```

## Success Criteria

### User Flow Tests
✅ All user journeys complete successfully
✅ Authentication persists correctly
✅ Navigation works in all directions
✅ Touch interactions function properly
✅ No console errors during workflows

### Console Error Tests
✅ Zero JavaScript exceptions
✅ No unexpected console errors
✅ All API calls return valid responses
✅ No 404 errors for application resources
✅ No 500+ server errors

### Onboarding Tests
✅ Team creation completes successfully
✅ Invite codes work correctly
✅ Form validation shows appropriate errors
✅ Mobile interactions work smoothly
✅ All touch targets meet 44px minimum

## Troubleshooting

### Common Issues

1. **Login Failures**
   - Ensure test accounts exist in database
   - Check Supabase authentication is configured
   - Verify email confirmation is disabled for test accounts

2. **Navigation Timeouts**
   - Increase `TEST_TIMEOUT` environment variable
   - Check if dev server is running (`npm run dev`)
   - Verify network conditions

3. **Touch Interaction Failures**
   - Ensure mobile viewport is set
   - Check touch event handlers are implemented
   - Verify CSS touch-action properties

4. **Console Errors**
   - Review ignored patterns in `puppeteer.config.js`
   - Check for development-only warnings
   - Verify API endpoints are accessible

## Best Practices

1. **Always run dev server before tests**
   ```bash
   npm run dev  # In terminal 1
   npm run test:e2e:comprehensive  # In terminal 2
   ```

2. **Clear test data between runs**
   - Screenshots and logs accumulate
   - Clean `test-results/` directory periodically

3. **Use debug mode for development**
   - Helps identify element selectors
   - Shows actual user experience
   - Easier to debug failures

4. **Monitor test execution time**
   - Tests should complete in < 5 minutes
   - Long-running tests indicate issues
   - Consider parallelization for large suites

## CI/CD Integration

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: |
    npm ci
    npm run build
    npm run preview &
    sleep 5
    npm run test:e2e:comprehensive
  env:
    HEADLESS: true
    BASE_URL: http://localhost:4173
```

## Maintenance

### Adding New Tests
1. Create test file in `test/e2e/`
2. Import setup utilities from `./setup.js`
3. Follow existing test patterns
4. Add npm script to `package.json`
5. Update this documentation

### Updating Selectors
- Use data-testid attributes when possible
- Fallback to semantic selectors
- Avoid brittle CSS selectors
- Test selectors in debug mode first

### Performance Optimization
- Use `networkidle2` sparingly
- Implement smart waits over fixed delays
- Batch similar operations
- Reuse authentication sessions when possible