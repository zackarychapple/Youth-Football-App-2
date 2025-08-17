# Test Requirements Document - Football Tracker

## Executive Summary

This document defines the test requirements for the Football Tracker app, focusing on game-day reliability and ensuring coaches can manage their teams effectively during the critical 20-25 second windows between plays. Every test scenario is designed around real-world coaching conditions: outdoor environments, time pressure, and the need for absolute reliability when it matters most.

---

## 1. Test User Credentials

### Standard Test Accounts

#### Head Coach Account
```
Email: coach.test@footballtracker.app
Password: GameDay2025!
Team: Cobb Eagles (Test Team)
Role: Head Coach
```

#### Assistant Coach Account
```
Email: assistant.test@footballtracker.app
Password: Assistant2025!
Team: Cobb Eagles (Test Team)
Role: Assistant Coach
```

#### Parent View Access (No Account Required)
```
Team Share Code: EAGLES25
Passcode: 1234
Access: Read-only game statistics
```

#### Secondary Test Team (For Multi-Team Testing)
```
Email: coach2.test@footballtracker.app
Password: Falcons2025!
Team: Cobb Falcons (Test Team 2)
Role: Head Coach
```

### Test Team Configurations

#### Team 1: Cobb Eagles (Standard 80-yard field)
- 22 players (typical roster size)
- 2 striped players (#7, #15)
- 1 injured player (#22)
- Field size: 80 yards
- MPR: 8 plays minimum

#### Team 2: Cobb Falcons (Small 40-yard field)
- 15 players (minimum roster)
- 1 striped player (#3)
- Field size: 40 yards
- MPR: 8 plays minimum

---

## 2. Critical User Flows to Test

### Priority 0 - Must Work Every Time (Game Breakers)

#### Authentication Flow
1. **Sign In**
   - Load time: < 2 seconds
   - Works with autofill
   - Clear error messages for wrong credentials
   - Remembers user preference (Remember Me)
   - Redirects to dashboard on success

2. **Sign Up with Team Creation**
   - Complete flow in < 30 seconds
   - Creates team immediately
   - No email verification blocking game access
   - Auto-assigns head coach role

3. **Password Reset**
   - Sends reset email within 10 seconds
   - Reset link works on mobile browsers
   - Can reset during a game without losing data

#### Team Management Flow
1. **Create Team**
   - Team name + invite code generation
   - Immediate access after creation
   - Share code visible and copyable

2. **Add Players**
   - Bulk add option (paste from roster list)
   - Single player add < 5 seconds
   - Jersey number validation (0-99)
   - Mark as striped (cannot run ball)
   - No duplicate jersey numbers

3. **Invite Coaches**
   - Generate invite code
   - Assistant can join with code
   - Proper role assignment
   - Single data entry point (no conflicts)

### Priority 0 - Game Day Operations

#### Pre-Game Setup
1. **Create Game**
   - Select opponent (or quick add new)
   - Set field size (40/80/100)
   - Date/time/location
   - < 10 seconds to create

2. **Select Active Roster**
   - Toggle players in/out
   - Mark injured/unavailable
   - See jersey numbers clearly
   - < 15 seconds to set lineup

#### Live Game Tracking
1. **Track Play - Pass**
   - Select QB (1 tap)
   - Select receiver (1 tap)
   - Mark result (TD/Complete/Incomplete/INT)
   - Total time: < 5 seconds
   - Works with wet screen

2. **Track Play - Run**
   - Select runner (1 tap)
   - Mark striped violation if needed
   - Record result
   - Total time: < 3 seconds

3. **Track Penalties**
   - Quick penalty flag button
   - Marks play as "doesn't count for MPR"
   - Parent-visible penalty indicator
   - Can edit after the fact

4. **MPR Dashboard View**
   - Color-coded play counts
   - Red: 0-3 plays (critical)
   - Yellow: 4-6 plays (needs attention)
   - Green: 7+ plays (safe)
   - Updates instantly after each play

### Priority 1 - Important Features

#### Lineup Management
1. **Preset Lineups**
   - Create offensive/defensive lineups
   - One-tap lineup swap
   - Visual indicator of who's on field
   - < 2 seconds to swap entire unit

2. **Substitution Tracking**
   - See who's been out longest
   - Track consecutive plays
   - Fatigue warnings (5+ plays in a row)

#### Post-Game Operations
1. **Game Completion**
   - Enter final score
   - Review play count summary
   - Generate MPR report
   - Share with parents

2. **Edit Game Data**
   - Correct play assignments
   - Add missed plays
   - Fix penalty markings
   - Audit trail maintained

#### Statistics & Reporting
1. **Player Statistics**
   - Pass completions/attempts
   - Receiving yards
   - Touchdowns
   - Play count by quarter

2. **Season Overview**
   - Games played
   - MPR compliance rate
   - Team statistics
   - Player development tracking

---

## 3. Acceptance Criteria

### Performance Requirements

#### Mobile Performance (Primary Platform - iPhone)
- App load: < 3 seconds on 4G
- Screen transitions: < 500ms
- Play recording: < 1 second save time
- Offline mode: Instant response
- Sync when online: < 5 seconds for game data

#### Interaction Requirements
- Minimum touch target: 44x44 pixels (Apple HIG)
- All buttons work with gloves
- High contrast in sunlight (WCAG AAA)
- One-handed operation for all game functions
- No typing required during game

#### Data Integrity
- No data loss on app crash
- Offline changes preserved
- Conflict resolution favors most recent
- Auto-save every action
- Background sync when connected

### Mobile Responsiveness

#### iPhone Testing Matrix
- iPhone 12/13/14/15 (standard)
- iPhone Pro Max (large)
- iPhone SE (small)
- iOS Safari (required)
- Chrome iOS (optional)

#### Critical Responsive Elements
- Play tracker buttons: Full width on mobile
- Player grid: 3 columns max on phone
- MPR dashboard: Single column with large text
- Score display: Always visible
- Quarter/time: Sticky header

### Offline Functionality

#### Required Offline Features
- Complete game tracking
- All play recording
- Roster management
- View previous games
- Statistics calculation

#### Sync Behavior
- Queue all changes locally
- Sync when connection returns
- Conflict resolution (last write wins)
- Visual indicator of sync status
- No data loss on sync failure

---

## 4. Test Data Requirements

### Sample Players

#### Offensive Starters
```
#1  - Jackson Smith (QB)
#3  - Marcus Johnson (RB) [STRIPED]
#5  - Tyler Brown (RB)
#11 - Connor Wilson (WR)
#14 - Ethan Davis (WR)
#21 - Mason Miller (WR)
#88 - Noah Anderson (TE)
```

#### Defensive Starters
```
#7  - Liam Taylor [STRIPED]
#24 - Owen Thomas
#32 - Lucas White
#44 - Ryan Martinez
#55 - Blake Jackson
#66 - Carter Rodriguez
#77 - Dylan Lee
```

#### Bench Players
```
#2  - Backup QB
#15 - Aiden Harris [STRIPED]
#18 - Hunter Clark
#22 - Jordan Lewis [INJURED]
#30 - Cameron Allen
#35 - Austin Young
#40 - Nathan King
```

### Sample Game Scenarios

#### Scenario 1: "The Blowout"
- Winning 35-0 at halftime
- Need to get all bench players to 8 plays
- Test MPR priority sorting
- Validate mass substitution

#### Scenario 2: "The Nail-Biter"
- Tied game, 4th quarter
- Starters need to play
- Still must hit MPR minimums
- Test quick substitution patterns

#### Scenario 3: "The Penalty Fest"
- Multiple penalties per quarter
- Test penalty play tracking
- Validate parent view shows penalty plays
- Ensure MPR counts are accurate

#### Scenario 4: "The Injury Game"
- Player injured in Q2
- Mark as unavailable mid-game
- Adjust MPR requirements
- Document injury timing

---

## 5. Priority Test Cases

### P0 - Critical Path (Must Pass Before Launch)

#### Authentication Suite
- [ ] Sign up with email/password
- [ ] Sign in with valid credentials
- [ ] Sign in with invalid credentials shows error
- [ ] Password reset flow completes
- [ ] Session persists on refresh
- [ ] Sign out clears all data

#### Team Creation Suite
- [ ] Create team with name
- [ ] Receive unique invite code
- [ ] Add 20+ players to roster
- [ ] No duplicate jersey numbers allowed
- [ ] Mark players as striped
- [ ] Edit player information

#### Game Tracking Suite
- [ ] Create game in < 10 seconds
- [ ] Record pass play in < 5 seconds
- [ ] Record run play in < 3 seconds
- [ ] Track penalties separately
- [ ] MPR counts update in real-time
- [ ] Color coding shows play status
- [ ] Works completely offline
- [ ] Syncs when connection returns

### P1 - Core Features (Must Work Well)

#### Advanced Game Management
- [ ] Create preset lineups
- [ ] Swap lineups with one tap
- [ ] Track plays by quarter
- [ ] Edit plays after recording
- [ ] Complete game and enter score
- [ ] Generate MPR compliance report

#### Multi-User Features
- [ ] Assistant coach can join team
- [ ] Single point of data entry
- [ ] Parent can view with share code
- [ ] Read-only access for parents
- [ ] Real-time updates for all viewers

#### Statistics & Reporting
- [ ] Calculate passing stats
- [ ] Track touchdowns
- [ ] Season-long statistics
- [ ] Player development trends
- [ ] Export game data

### P2 - Nice to Have (Post-Launch)

#### Enhanced Features
- [ ] Voice-activated play entry
- [ ] Play diagram drawing
- [ ] Video clip attachment
- [ ] Advanced statistics
- [ ] League integration
- [ ] Tournament brackets

---

## 6. Testing Environment Setup

### Browser Testing Requirements
- Safari iOS 15+ (PRIMARY)
- Chrome iOS (Secondary)
- Safari Desktop (Admin functions)
- Chrome Desktop (Admin functions)

### Network Conditions
- Full 4G/5G connectivity
- Degraded 3G connection
- Intermittent connection (in/out)
- Complete offline mode
- Airplane mode testing

### Environmental Testing
- Bright sunlight (contrast)
- Rain/wet conditions (touch response)
- Cold weather with gloves
- Crowded stadium (slow network)
- Rural field (no connectivity)

---

## 7. Test Execution Checklist

### Pre-Game Day Testing (Thursday)
1. Verify roster is complete
2. Test lineup creation
3. Confirm offline mode works
4. Check parent share codes
5. Review MPR calculations

### Game Day Testing (Saturday Morning)
1. Quick authentication check
2. Create game for today
3. Test play entry speed
4. Verify offline capability
5. Check sync when online

### Post-Game Testing (Saturday Evening)
1. Review game statistics
2. Verify MPR compliance
3. Test data editing
4. Check parent view accuracy
5. Confirm data persistence

---

## 8. Success Metrics

### Reliability Metrics
- 99.9% uptime during games (Saturday 8am-6pm)
- Zero data loss in offline mode
- < 1% play recording failures
- 100% MPR calculation accuracy

### Performance Metrics
- Play entry: 95% < 5 seconds
- App load: 95% < 3 seconds
- Screen transitions: 95% < 500ms
- Offline response: 100% < 100ms

### User Success Metrics
- Coach can track full game without training
- Zero MPR violations due to app issues
- Parents can access stats within 1 minute
- Assistant coaches productive in first game

---

## 9. Known Issues & Workarounds

### Current Issues
1. **Login Console Errors**
   - Impact: Authentication may fail
   - Workaround: Clear browser cache, retry
   - Fix Priority: P0

2. **Slow Initial Load**
   - Impact: 5+ second load time
   - Workaround: Wait for full load
   - Fix Priority: P1

### Testing Blockers
- Need Supabase test environment setup
- Test data seeds required
- Mobile device testing farm access
- Performance monitoring tools needed

---

## Test Sign-Off Criteria

Before launch, the following must be verified:

### Head Coach Approval
- [ ] Can manage full game in under 5 seconds per play
- [ ] MPR tracking is accurate and visible
- [ ] Works in rain/sun/cold conditions
- [ ] No data loss during game

### League Administrator Approval
- [ ] MPR reports are accurate
- [ ] Parent access works without accounts
- [ ] Data exports for league records
- [ ] Multi-team support confirmed

### Technical Approval
- [ ] All P0 tests passing
- [ ] 80% of P1 tests passing
- [ ] Performance metrics met
- [ ] Security review complete
- [ ] Offline mode fully functional

---

## Appendix: Quick Test Scripts

### 5-Minute Smoke Test
1. Sign in as coach.test@footballtracker.app
2. Create new game vs "Test Opponent"
3. Record 5 plays (mix of pass/run)
4. Check MPR dashboard updates
5. Toggle offline mode
6. Record 3 more plays
7. Go back online
8. Verify sync completes
9. Sign out

### Full Game Simulation (30 minutes)
1. Sign in and create game
2. Run 50-60 plays across 4 quarters
3. Include 5-6 penalties
4. Substitute players frequently
5. Mark one player injured in Q3
6. Complete game with final score
7. Review MPR compliance
8. Check parent view access
9. Export statistics

### Stress Test (Multiple Users)
1. Head coach signs in on iPhone
2. Assistant coach joins on iPad
3. Parent accesses via share code
4. All three view same game
5. Coach records plays rapidly
6. Verify all views update
7. Test with 10+ parent connections
8. Monitor performance degradation

---

*Document Version: 1.0*
*Last Updated: August 2025*
*Next Review: After first live game test*