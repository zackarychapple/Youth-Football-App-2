# Product Requirements Document

## Youth Football Game Management System - Cobb Football League (CFL)

### Version 2.0

### Date: August 2025

---

## Executive Summary

The Youth Football Game Management System is a **free, web-based Progressive Web App (PWA)** designed specifically for Cobb Football League (CFL) coaches to manage their teams during live games while ensuring compliance with the universal 8-play Minimum Play Requirements (MPR). Sponsored by Zephyr Cloud, this tool addresses the critical challenge of tracking player participation in real-time during fast-paced youth football games where coaches have 20-25 seconds between plays to make substitutions, record play data, and ensure every child gets fair playing time.

### Problem Statement

Youth football coaches in the CFL struggle to balance competitive play calling with mandatory 8-play minimum requirements while managing 15-25 players during games with rapid play clocks. Current solutions rely on paper tracking or complex applications that are impractical during live game situations, especially when tracking penalty plays separately for parent disputes and managing "striped" players who cannot run the ball.

### Solution Overview

A streamlined, **iOS-optimized PWA** that enables coaches to track plays, manage substitutions, and ensure MPR compliance through a **Basic Mode interface** designed for one-handed operation in outdoor conditions. The system works fully offline during games and syncs when connected, with real-time parent access through UUID/passcode sharing.

---

## User Personas

### Primary Persona: The Volunteer Coach

**Name:** Coach Jerome  
**Age:** 38  
**Background:** Parent volunteer, works full-time, coaches his son's team  
**Technical Proficiency:** Moderate - comfortable with smartphones, basic apps  
**Pain Points:**

- Managing 20+ kids while calling plays
- Tracking who needs more plays for MPR compliance
- Making quick substitutions with 25-second play clock
- Operating technology with wet/gloved hands in various weather conditions
- Balancing competitive desires with fairness requirements

**Goals:**

- Ensure every kid gets minimum required plays
- Track game statistics for player development
- Minimize time looking at screen during games
- Avoid league penalties for MPR violations

### Secondary Persona: Assistant Coach

**Name:** Coach Greg  
**Age:** 42  
**Background:** Parent volunteer, one of 3-5 coaches with team access  
**Technical Proficiency:** Basic smartphone user  
**Pain Points:**

- Coordinating with head coach on substitutions
- Knowing who's due for playing time
- Managing defensive rotations and tracking tackles

**Goals:**

- Support head coach efficiently (single data entry point)
- Help track defensive plays and tackles
- Ensure smooth substitutions

### Tertiary Persona: Team Parent

**Name:** Parent Jessica  
**Age:** 35  
**Background:** Team parent wanting to track child's playing time  
**Technical Proficiency:** Moderate  
**Goals:**

- View real-time game updates via UUID/passcode access
- See child's play count and statistics
- Verify MPR compliance and penalty play tracking
- Access game data without needing an account (read-only)

---

## User Stories & Use Cases

### Core User Stories

1. **As a coach**, I want to quickly create my team roster so that I can start tracking games immediately.

2. **As a coach**, I want to invite assistant coaches so that multiple people can help track plays during games.

3. **As a coach**, I want to create preset lineups so that I can quickly substitute entire units during games.

4. **As a coach**, I want to track each play with minimal taps so that I don't delay the game.

5. **As a coach**, I want to see who needs plays at a glance so that I can ensure MPR compliance.

6. **As a coach**, I want to edit game data after the fact so that I can correct any mistakes made during the heat of
   the game.

7. **As a coach**, I want to track player injuries so that I can document when players became unavailable.

8. **As a coach**, I want automatic stat tracking so that I can focus on coaching rather than math.

### Critical Game-Day Use Cases

**UC1: Pre-Game Setup (5-10 minutes)**

- Coach opens PWA 5-10 minutes before game
- Marks attending players (tracks late arrivals for MPR deduction)
- Reviews universal 8-play MPR requirements
- Marks "striped" players who cannot run the ball
- Sets field size (40, 80, or 100 yards)
- Configures if special teams counts toward MPR
- Sets starting lineups

**UC2: Offensive Play Tracking**

- Ball is dead, 25-second clock starts
- Coach taps QB selection (2 seconds)
- Selects play type: run/pass/keep (1 second)
- Records outcome with smart TD calculation (e.g., from opponent 40 = 40 yard TD)
- Optional: Add text note about the play
- Tracks if penalty occurred (counts for MPR, tracked separately)
- Total time: 5 seconds

**UC3: Quick Substitution**

- Coach realizes Player A needs 2 more plays
- Swipes to open roster panel
- Taps preset "Beast Offense" lineup
- Manually toggles Player A "IN"
- Total time: 4 seconds

**UC4: Halftime MPR Check**

- Coach opens MPR dashboard
- Sees sorted list of players by plays needed (8 universal requirement)
- Reviews penalty plays (tracked separately for parent disputes)
- Checks "striped" player limitations
- Makes note of critical substitutions for second half
- System prepares 4th quarter MPR violation alerts
- Total time: 10 seconds

---

## Functional Requirements

### 1. Team Management

#### 1.1 Team Creation

- **FR1.1.1:** System shall allow coaches to create a CFL team with team name and age group
- **FR1.1.2:** System shall generate unique UUID for team access sharing
- **FR1.1.3:** System shall set coach as primary administrator upon team creation
- **FR1.1.4:** System shall be hardcoded for Cobb Football League (CFL) only

#### 1.2 Coach Management

- **FR1.2.1:** System shall support 3-5 coaches per team with full access
- **FR1.2.2:** System shall use single data entry point (no conflict resolution needed)
- **FR1.2.3:** System shall generate shareable UUID/passcode for parent read-only access
- **FR1.2.4:** Parent access shall be real-time, read-only without requiring accounts
- **FR1.2.5:** System shall be free for all users (sponsored by Zephyr Cloud)

#### 1.3 Player Roster

- **FR1.3.1:** System shall allow adding players with name and jersey number
- **FR1.3.2:** Jersey numbers shall be unique within a team
- **FR1.3.3:** System shall support roster sizes up to 30 players
- **FR1.3.4:** System shall allow marking players as inactive/injured/ejected
- **FR1.3.5:** System shall track "striped" players who cannot run the ball
- **FR1.3.6:** System shall track late arrivals with MPR deduction
- **FR1.3.7:** System shall warn when >11 players are on field
- **FR1.3.8:** System shall track practice attendance for each player

### 2. Authentication & Authorization

#### 2.1 Authentication

- **FR2.1.1:** System shall use Supabase authentication for coach accounts only
- **FR2.1.2:** System shall support email/password authentication for coaches
- **FR2.1.3:** System shall support password reset functionality
- **FR2.1.4:** System shall maintain session for 30 days with "remember me" option
- **FR2.1.5:** Parents access via UUID/passcode without accounts (public read-only)

#### 2.2 Authorization

- **FR2.2.1:** System shall support coach-only write access (3-5 per team)
- **FR2.2.2:** Only one coach enters data at a time (no conflict resolution)
- **FR2.2.3:** Public UUID/passcode provides read-only real-time access

### 3. Lineup Management

#### 3.1 Lineup Creation

- **FR3.1.1:** System shall allow creation of named lineup presets
- **FR3.1.2:** System shall support unlimited lineup presets per team
- **FR3.1.3:** Common presets shall include: Starting Offense, Starting Defense, Goal Line, Special Teams
- **FR3.1.4:** System shall allow copying existing lineups as templates

#### 3.2 Lineup Assignment

- **FR3.2.1:** System shall allow assigning 11 players maximum per lineup
- **FR3.2.2:** System shall validate no duplicate players in active lineup
- **FR3.2.3:** System shall support position assignments within lineups (optional)

### 4. Game Management

#### 4.1 Game Creation

- **FR4.1.1:** System shall create games with date, opponent, and location
- **FR4.1.2:** System shall track home/away designation
- **FR4.1.3:** System shall allow 5-10 minute pre-game roster selection
- **FR4.1.4:** System shall configure field size (40, 80, or 100 yards)
- **FR4.1.5:** System shall track regular games (4 quarters only)
- **FR4.1.6:** System shall track scrimmages separately (no MPR enforcement)
- **FR4.1.7:** System shall track practice sessions with attendance

#### 4.2 Live Game Interface

- **FR4.2.1:** System shall display current down and distance
- **FR4.2.2:** System shall display current field position
- **FR4.2.3:** System shall show active players on field
- **FR4.2.4:** System shall indicate offense/defense mode
- **FR4.2.5:** System shall display play count for active quarter

#### 4.3 MPR Tracking

- **FR4.3.1:** System shall enforce universal 8-play MPR (no playoff difference)
- **FR4.3.2:** System shall count special teams plays toward MPR (configurable)
- **FR4.3.3:** System shall count penalty plays for MPR (tracked separately for disputes)
- **FR4.3.4:** System shall NOT count overtime plays toward MPR (but track them)
- **FR4.3.5:** System shall display real-time MPR status for all players
- **FR4.3.6:** System shall provide 4th quarter MPR violation alerts only
- **FR4.3.7:** System shall deduct from MPR for late arrivals
- **FR4.3.8:** System shall award MPR point for ejected players
- **FR4.3.9:** System shall NOT enforce MPR for scrimmages

### 5. Play Tracking

#### 5.1 Offensive Plays

- **FR5.1.1:** System shall require QB selection for offensive plays
- **FR5.1.2:** System shall support play types: Run, Pass, QB Keep
- **FR5.1.3:** System shall track ball carrier/receiver
- **FR5.1.4:** System shall track play outcome (yards gained/lost, touchdown, turnover)
- **FR5.1.5:** System shall allow "no huddle" quick play entry
- **FR5.1.6:** QB selection shall intelligently group players by position assignment

#### 5.2 Defensive Plays

- **FR5.2.1:** System shall track all defensive tackles by player
- **FR5.2.2:** System shall support multiple players per tackle
- **FR5.2.3:** System shall track defensive play types (run defense, pass defense)
- **FR5.2.4:** System shall track special defensive plays (sack, interception, fumble recovery)
- **FR5.2.5:** System shall allow text notes on every defensive play

#### 5.3 Play Metadata

- **FR5.3.1:** Each play shall have unique sequential number
- **FR5.3.2:** System shall track quarter (4 quarters only, plus overtime)
- **FR5.3.3:** System shall allow text notes on any play
- **FR5.3.4:** System shall track penalties with optional player attribution
- **FR5.3.5:** System shall track which players were on field for each play
- **FR5.3.6:** System shall use smart touchdown calculation based on field position

### 6. Substitution Management

#### 6.1 Substitution Interface

- **FR6.1.1:** System shall provide slide-out panel for substitutions
- **FR6.1.2:** System shall display full roster in substitution panel
- **FR6.1.3:** System shall show IN/OUT status for each player
- **FR6.1.4:** System shall support single-tap toggle for player status
- **FR6.1.5:** System shall display play count next to each player

#### 6.2 Quick Substitutions

- **FR6.2.1:** System shall provide preset lineup buttons at top of panel
- **FR6.2.2:** System shall apply lineup preset in single tap
- **FR6.2.3:** System shall allow manual override after preset application
- **FR6.2.4:** System shall indicate when switching between offense/defense

### 7. Injury Tracking

#### 7.1 Injury Recording

- **FR7.1.1:** System shall allow marking player as injured during play
- **FR7.1.2:** System shall allow marking player as injured in roster view
- **FR7.1.3:** System shall record play number when injury occurred
- **FR7.1.4:** System shall prevent injured players from being marked "IN"
- **FR7.1.5:** System shall support injury notes (optional)

#### 7.2 Injury Management

- **FR7.2.1:** System shall track return-to-play status
- **FR7.2.2:** System shall exclude injured plays from MPR calculations
- **FR7.2.3:** System shall maintain injury history across games

### 8. Post-Game Editing

#### 8.1 Game Correction

- **FR8.1.1:** System shall allow editing completed games
- **FR8.1.2:** System shall maintain edit history with timestamps
- **FR8.1.3:** System shall allow adding missed plays
- **FR8.1.4:** System shall allow correcting player assignments

#### 8.2 Play Management

- **FR8.2.1:** System shall allow reordering plays
- **FR8.2.2:** System shall allow deleting plays with confirmation
- **FR8.2.3:** System shall recalculate statistics after edits
- **FR8.2.4:** System shall maintain original vs edited indicators

### 9. Statistics & Reporting

#### 9.1 Automatic Statistics

- **FR9.1.1:** System shall calculate total plays per player
- **FR9.1.2:** System shall track offensive statistics (yards, TDs, attempts)
- **FR9.1.3:** System shall track all defensive tackles per player
- **FR9.1.4:** System shall calculate efficiency metrics (yards/play, completion %, 3rd down conversions)
- **FR9.1.5:** System shall provide real-time stats as separate tab
- **FR9.1.6:** System shall track penalty plays separately for parent viewing
- **FR9.1.7:** System shall track season-long statistics

#### 9.2 Reporting

- **FR9.2.1:** System shall generate MPR compliance reports
- **FR9.2.2:** System shall export game statistics
- **FR9.2.3:** System shall provide parent-friendly player reports
- **FR9.2.4:** System shall support league-required formatting

### 10. User Interface Modes

#### 10.1 Basic Mode (Default)

- **FR10.1.1:** System shall default to Basic Mode for all coaches
- **FR10.1.2:** Basic Mode shall show only essential play tracking features
- **FR10.1.3:** Basic Mode shall hide advanced statistics and complex features
- **FR10.1.4:** System shall allow switching to Advanced Mode if needed

#### 10.2 Real-Time Updates

- **FR10.2.1:** System shall provide real-time updates to parent viewers
- **FR10.2.2:** Stats shall display in separate tab from play tracking
- **FR10.2.3:** Updates shall work when device comes back online

---

## Non-Functional Requirements

### Performance Requirements

- **NFR1.1:** Play entry shall complete in under 2 seconds
- **NFR1.2:** Substitution changes shall apply in under 1 second
- **NFR1.3:** PWA shall work fully offline for entire game duration
- **NFR1.4:** Initial PWA load shall complete in under 3 seconds
- **NFR1.5:** System shall sync when connection restored
- **NFR1.6:** Real-time parent updates when online

### Usability Requirements

- **NFR2.1:** All primary actions accessible with one thumb
- **NFR2.2:** Touch targets minimum 44x44 pixels for outdoor use
- **NFR2.3:** High contrast UI readable in direct sunlight
- **NFR2.4:** Core features require maximum 3 taps
- **NFR2.5:** System shall work with wet screens and gloved hands

### Reliability Requirements

- **NFR3.1:** System shall maintain 99.9% uptime during game hours
- **NFR3.2:** Data shall persist locally if connection lost
- **NFR3.3:** System shall auto-save every play entry
- **NFR3.4:** System shall recover from crashes without data loss

### Security Requirements

- **NFR4.1:** System shall encrypt data at rest and in transit
- **NFR4.2:** System shall comply with COPPA for youth data
- **NFR4.3:** System shall support data export for GDPR compliance
- **NFR4.4:** System shall maintain audit logs for data changes

### Compatibility Requirements

- **NFR5.1:** System shall prioritize iOS optimization (PWA)
- **NFR5.2:** System shall work as web-only application (no app store)
- **NFR5.3:** System shall be responsive from 375px to 428px width
- **NFR5.4:** System shall function fully offline
- **NFR5.5:** System shall support landscape and portrait orientation

### Scalability Requirements

- **NFR6.1:** System shall support 10,000 concurrent users
- **NFR6.2:** System shall handle 100 plays per game
- **NFR6.3:** System shall support unlimited historical games
- **NFR6.4:** Database shall support 1M+ plays per season

---

## Technical Architecture Considerations

### Mobile-First Design

- Offline-first architecture with background sync
- Touch-optimized UI components
- Hardware acceleration for smooth animations

### Data Architecture

- Real-time sync with Supabase when online
- Local storage for full offline game support
- Optimistic UI updates for perceived performance
- Single data entry point (no conflict resolution needed)
- Public read access via UUID/passcode

### State Management

- Global state for active game
- Persistent storage for game recovery
- Undo/redo capability for play corrections
- Real-time collaboration support

---

## Success Metrics

### Adoption Metrics

- Target all CFL teams for adoption
- 80% of coaches use app for entire season
- 90% of games tracked completely
- Average 3-5 coaches per team with access
- 50% of parents accessing games via UUID/passcode

### Usage Metrics

- < 5 seconds average play entry time
- < 30 seconds total interaction time per play cycle
- 95% of plays entered during game (not post-game)
- < 2% error rate requiring post-game correction

### Satisfaction Metrics

- Net Promoter Score > 50
- 4.5+ star rating in app stores
- 80% of coaches recommend to other teams
- < 5% support ticket rate per game

### Compliance Metrics

- 100% MPR compliance for active teams (8-play universal)
- 0 league violations due to tracking errors
- 95% of players meet 8-play requirements
- 4th quarter alerts prevent late-game violations
- 100% penalty play tracking for dispute resolution

---

## Appendices

### Glossary

- **MPR**: Minimum Play Requirements - CFL universal 8-play requirement
- **Striped Player**: Player who cannot run the ball (CFL rule)
- **Play Clock**: Time limit between plays (typically 25 seconds in youth football)
- **Snap**: Start of a play when center hikes the ball
- **Down**: One of 4 attempts to advance the ball 10 yards
- **Drive**: Series of plays by one team maintaining possession
- **PWA**: Progressive Web App - web application that works like a native app
- **UUID**: Unique identifier for sharing team access

### Regulatory Considerations

- COPPA compliance for data on minors under 13
- CFL-specific 8-play MPR rule (universal, no playoff difference)
- State privacy laws for youth sports data
- Public data access via UUID/passcode (no PII exposed)
- Free tool sponsored by Zephyr Cloud (no payment processing)
