# Agent Task Assignments - CFL Game Tracker MVP

## Sprint 1 Tasks (Weeks 1-2)

### UI Engineer Tasks

#### Week 1 Tasks

##### TASK-UI-001: Project Setup and Configuration
**Status:** ✅ COMPLETE  
**Priority:** P0  
**Duration:** 4 hours  
**Dependencies:** None  
**Completed:** 2025-08-18 (Day 2)  

**Description:**  
Initialize the frontend application with Rsbuild, configure TanStack Router, and set up the development environment.

**Acceptance Criteria:**
- [x] Rsbuild configuration complete with PWA plugin
- [x] TanStack Router configured with file-based routing
- [x] Tailwind 4 integrated and configured
- [x] Zustand store structure initialized
- [x] Development server running with HMR
- [x] Basic folder structure established:
  ```
  /src
    /components
    /routes
    /stores
    /hooks
    /lib
    /styles
  ```

**Deliverables:**
- Working development environment
- Initial commit with base configuration
- README with setup instructions

---

##### TASK-UI-002: Authentication UI Components
**Status:** ✅ COMPLETE  
**Priority:** P0  
**Duration:** 8 hours  
**Dependencies:** TASK-UI-001, TASK-SA-002
**Completed:** 2025-08-18 (Day 2)  

**Description:**  
Build the authentication flow UI including login, signup, and password reset screens optimized for mobile.

**Acceptance Criteria:**
- [x] Login screen with email/password fields
- [x] Signup screen with team creation option
- [x] Password reset flow implemented
- [x] Form validation with clear error messages
- [x] Loading states during auth operations
- [x] Auto-focus on first input field
- [x] Large touch targets (minimum 44x44px)
- [x] Works with iOS password autofill

**Deliverables:**
- `/routes/auth/login.tsx`
- `/routes/auth/signup.tsx`
- `/routes/auth/reset-password.tsx`
- Auth components in `/components/auth/`

---

##### TASK-UI-003: Team Setup Interface
**Status:** IN PROGRESS  
**Priority:** P0  
**Duration:** 12 hours  
**Dependencies:** TASK-UI-002  

**Description:**  
Create the team setup flow allowing coaches to quickly configure their team and add players.

**Acceptance Criteria:**
- [ ] Team creation form with minimal required fields
- [ ] Bulk player entry (paste from spreadsheet)
- [ ] Individual player quick-add interface
- [ ] Jersey number assignment (auto-increment)
- [ ] Player list with edit/delete capabilities
- [ ] Swipe actions for player management
- [ ] Save progress indicator
- [ ] Can add 20 players in under 2 minutes

**Deliverables:**
- `/routes/team/setup.tsx`
- `/routes/team/players.tsx`
- `/components/team/PlayerQuickAdd.tsx`
- `/components/team/BulkImport.tsx`

---

#### Week 2 Tasks

##### TASK-UI-004: Offline-First State Management
**Status:** Not Started  
**Priority:** P0  
**Duration:** 8 hours  
**Dependencies:** TASK-SA-004  

**Description:**  
Implement Zustand stores with persistence and offline queue management.

**Acceptance Criteria:**
- [ ] Zustand stores with persist middleware
- [ ] Offline action queue implementation
- [ ] Sync status indicators in UI
- [ ] Optimistic updates for all mutations
- [ ] Conflict resolution UI (last-write-wins)
- [ ] Network status detection
- [ ] Background sync when online

**Deliverables:**
- `/stores/authStore.ts`
- `/stores/teamStore.ts`
- `/stores/offlineStore.ts`
- `/hooks/useOfflineSync.ts`

---

##### TASK-UI-005: Core Layout and Navigation
**Status:** Not Started  
**Priority:** P0  
**Duration:** 6 hours  
**Dependencies:** TASK-UI-001  

**Description:**  
Build the app shell with navigation optimized for one-handed use during games.

**Acceptance Criteria:**
- [ ] Bottom tab navigation (thumb-reachable)
- [ ] Large tap targets (minimum 44x44px)
- [ ] Current section clearly indicated
- [ ] Gesture navigation support
- [ ] Safe area handling (iOS notch)
- [ ] Landscape orientation support
- [ ] Quick action button (FAB) for game start

**Deliverables:**
- `/components/layout/AppShell.tsx`
- `/components/layout/TabBar.tsx`
- `/components/layout/QuickActions.tsx`

---

##### TASK-UI-006: Data Integration Layer
**Status:** Not Started  
**Priority:** P0  
**Duration:** 8 hours  
**Dependencies:** TASK-SA-003, TASK-UI-004  

**Description:**  
Integrate TanStack Query with Supabase client for data fetching and mutations.

**Acceptance Criteria:**
- [ ] TanStack Query providers configured
- [ ] Custom hooks for all data operations
- [ ] Optimistic updates implemented
- [ ] Error retry logic configured
- [ ] Cache invalidation strategies
- [ ] Loading and error states
- [ ] Stale-while-revalidate patterns

**Deliverables:**
- `/lib/supabase-client.ts`
- `/hooks/useTeam.ts`
- `/hooks/usePlayers.ts`
- `/hooks/useAuth.ts`

---

### Supabase Architect Tasks

#### Week 1 Tasks

##### TASK-SA-001: Supabase Project Setup
**Status:** ✅ COMPLETE  
**Priority:** P0  
**Duration:** 2 hours  
**Dependencies:** None  
**Completed:** 2025-08-18 (Day 2)  

**Description:**  
Initialize Supabase project and configure authentication providers.

**Acceptance Criteria:**
- [x] Supabase project created
- [x] Email authentication enabled
- [x] Email templates customized for CFL branding
- [x] SMTP configured (if custom domain)
- [x] Rate limiting configured
- [x] Security rules established
- [x] Environment variables documented

**Deliverables:**
- Supabase project URL
- Anon and Service keys
- `.env.example` file
- Authentication configuration document

---

##### TASK-SA-002: Database Schema Design
**Status:** ✅ COMPLETE  
**Priority:** P0  
**Duration:** 6 hours  
**Dependencies:** TASK-SA-001  

**Description:**  
Design and implement the core database schema with RLS policies.

**Acceptance Criteria:**
- [ ] Teams table with league configurations
- [ ] Players table with MPR tracking fields
- [ ] Users table with role management
- [ ] Games table (basic structure)
- [ ] Plays table (basic structure)
- [ ] RLS policies for all tables
- [ ] Indexes for common queries
- [ ] Soft delete implementation
- [ ] **CRITICAL: Generate TypeScript types immediately after schema creation**
- [ ] **CRITICAL: Share types file with UI Engineer by 2 PM**

**Deliverables:**
- `/supabase/migrations/001_initial_schema.sql`
- `/supabase/migrations/002_rls_policies.sql`
- Database ERD diagram
- RLS test queries

---

##### TASK-SA-003: Authentication Functions
**Status:** ✅ COMPLETE  
**Priority:** P0  
**Duration:** 4 hours  
**Dependencies:** TASK-SA-002  

**Description:**  
Create Edge Functions for authentication and team management.

**Acceptance Criteria:**
- [ ] User signup with team creation
- [ ] Role assignment logic
- [ ] Team invitation system (future)
- [ ] Session management
- [ ] Password reset flow
- [ ] Account validation

**Deliverables:**
- `/supabase/functions/auth-signup/index.ts`
- `/supabase/functions/team-create/index.ts`
- Authentication flow documentation

---

#### Week 2 Tasks

##### TASK-SA-004: Offline Sync Architecture
**Status:** Not Started  
**Priority:** P0  
**Duration:** 10 hours  
**Dependencies:** TASK-SA-002  

**Description:**  
Implement offline-first data synchronization strategy.

**Acceptance Criteria:**
- [ ] Sync queue table structure
- [ ] Conflict resolution logic (last-write-wins)
- [ ] Batch sync operations
- [ ] Incremental sync for large datasets
- [ ] Sync status tracking
- [ ] Data versioning strategy
- [ ] Offline operation validation

**Deliverables:**
- `/supabase/migrations/003_sync_tables.sql`
- `/supabase/functions/sync-queue/index.ts`
- Sync architecture documentation
- Conflict resolution test cases

---

##### TASK-SA-005: Data Access Layer
**Status:** Not Started  
**Priority:** P0  
**Duration:** 6 hours  
**Dependencies:** TASK-SA-003  

**Description:**  
Create database functions and views for efficient data access.

**Acceptance Criteria:**
- [ ] Team roster view with player stats
- [ ] Game summary calculations
- [ ] MPR tracking functions
- [ ] Bulk operation procedures
- [ ] Data validation triggers
- [ ] Audit trail implementation

**Deliverables:**
- `/supabase/migrations/004_functions_views.sql`
- `/supabase/migrations/005_triggers.sql`
- Performance test results

---

##### TASK-SA-006: Real-time Subscriptions
**Status:** Not Started  
**Priority:** P1  
**Duration:** 4 hours  
**Dependencies:** TASK-SA-005  

**Description:**  
Configure real-time subscriptions for collaborative features.

**Acceptance Criteria:**
- [ ] Game state broadcasting
- [ ] Roster update notifications
- [ ] Presence system for active users
- [ ] Subscription authentication
- [ ] Channel security policies
- [ ] Rate limiting for broadcasts

**Deliverables:**
- Real-time configuration
- `/supabase/functions/broadcast-game/index.ts`
- Subscription test suite

---

## Task Status Legend
- **Not Started**: Task not begun
- **In Progress**: Active development
- **Blocked**: Waiting on dependency
- **In Review**: Code complete, pending review
- **Complete**: Merged to main

---

## Week 1 Daily Objectives

### Monday (Day 1) ✅ COMPLETE
**Planning & Documentation Day**
- Sprint Plan delivered
- Component Specifications delivered
- Database Migration Plan delivered
- API Specifications delivered

### Tuesday (Day 2) ✅ COMPLETE
**UI Engineer:**
- ✅ Complete TASK-UI-001 (Project Setup)
- ✅ Complete TASK-UI-002 (Auth UI)
- ✅ Dashboard and Layout implementation

**Supabase Architect:**
- ✅ Complete TASK-SA-001 (Supabase Setup)
- ✅ Complete TASK-SA-002 (Schema Design)
- ✅ Complete TASK-SA-003 (Auth Functions)
- ✅ Database helpers with offline patterns

### Wednesday (Day 3) - IN PROGRESS
**UI Engineer:**
- PRIORITY 1: Player Roster Management (9 AM - 1 PM)
  - Quick add interface with auto-increment jersey numbers
  - Bulk import from CSV/Excel paste
  - Swipe gestures for edit/delete
  - Mark players as "striped"
  - Target: 20 players in < 2 minutes
- PRIORITY 2: Game Creation Flow (1 PM - 4 PM)
  - One-tap quick start with defaults
  - Optional opponent/settings
  - Roster snapshot to game
- PRIORITY 3: Play Tracking UI Foundation (4 PM - 6 PM)
  - 5x5 player grid
  - Play type buttons
  - Quarter management

**Supabase Architect:**
- PRIORITY 1: Game Management Functions (9 AM - 12 PM)
  - create_game_with_roster RPC
  - Game state management
  - Roster snapshot process
- PRIORITY 2: MPR Calculation Engine (12 PM - 3 PM)
  - Real-time MPR calculations
  - Substitution recommendations
  - Materialized view for performance
- PRIORITY 3: Play Recording System (3 PM - 5 PM)
  - record_play with participants
  - Undo functionality
  - Play history retrieval

### Thursday (Day 4)
**UI Engineer:**
- Complete TASK-UI-003 (Team Setup)
- Begin TASK-UI-005 (Layout/Navigation)

**Supabase Architect:**
- Continue TASK-SA-004 (Offline Sync)
- Architecture review and documentation

### Friday (Day 5)
**UI Engineer:**
- Complete TASK-UI-005 (Layout/Navigation)
- Integration testing with Supabase

**Supabase Architect:**
- Complete TASK-SA-004 (Offline Sync)
- Begin TASK-SA-005 (Data Access Layer)

---

## Week 2 Daily Objectives

### Monday (Day 6)
**UI Engineer:**
- Begin TASK-UI-004 (Offline State Management)
- Zustand store implementation

**Supabase Architect:**
- Complete TASK-SA-005 (Data Access Layer)
- Begin TASK-SA-006 (Real-time)

### Tuesday (Day 7)
**UI Engineer:**
- Continue TASK-UI-004 (Offline State Management)
- Implement sync queue UI

**Supabase Architect:**
- Complete TASK-SA-006 (Real-time)
- Performance optimization

### Wednesday (Day 8)
**UI Engineer:**
- Complete TASK-UI-004 (Offline State Management)
- Begin TASK-UI-006 (Data Integration)

**Supabase Architect:**
- Integration support
- Bug fixes and optimization

### Thursday (Day 9)
**UI Engineer:**
- Complete TASK-UI-006 (Data Integration)
- End-to-end testing

**Supabase Architect:**
- Data migration testing
- Security audit

### Friday (Day 10)
**Both Agents:**
- Integration testing
- Bug fixes
- Sprint 1 demo preparation
- Documentation updates

---

## Handoff Points

### Critical Handoffs

1. **Day 2 Morning: Project Credentials** ✅ COMPLETE
   - SA provides Supabase URL and anon key by 10 AM
   - UI Engineer blocked until credentials received
   
2. **Day 2 Afternoon: Authentication API → UI** ✅ COMPLETE
   - SA provides auth endpoints
   - UI implements auth screens

3. **Day 3 Morning: Player Data Structure** (11 AM)
   - SA confirms player table fields
   - UI implements roster store
   - Agree on bulk import format

4. **Day 3 Afternoon: Game Creation API** (2 PM)
   - SA provides create_game_with_roster RPC
   - UI calls from game creation flow
   - Return game ID for tracking

5. **Day 3 Late: Play Recording Integration** (4 PM)
   - SA provides record_play function
   - UI sends player selections
   - MPR calculations trigger automatically

6. **Day 6: Offline Sync → State Management**
   - SA provides sync queue API
   - UI implements offline store

7. **Day 8: Real-time → UI Subscriptions**
   - SA provides subscription channels
   - UI implements live updates

---

## Dependencies Graph

```
TASK-SA-001 (Supabase Setup)
    ├── TASK-SA-002 (Schema)
    │   ├── TASK-SA-003 (Auth Functions)
    │   ├── TASK-SA-004 (Offline Sync)
    │   └── TASK-SA-005 (Data Access)
    │       └── TASK-SA-006 (Real-time)
    │
    └── TASK-UI-001 (Project Setup)
        ├── TASK-UI-002 (Auth UI)
        │   └── TASK-UI-003 (Team Setup)
        ├── TASK-UI-005 (Layout)
        └── TASK-UI-004 (Offline State)
            └── TASK-UI-006 (Data Integration)
```

---

## Communication Protocol

### Status Updates
Each agent should update their task status daily by 5 PM:
1. Edit this file with current status
2. Add any blockers or concerns
3. Commit with message: "Status Update: [Agent] - Day X"

### Blocker Resolution
1. Mark task as "Blocked" with reason
2. Tag other agent in PR comment
3. PM will facilitate if unresolved in 4 hours

### Code Review Process
1. Create feature branch: `feature/TASK-XX-brief-description`
2. Push completed work with tests
3. Create PR with acceptance criteria checklist
4. Tag relevant agent for review
5. Merge after approval (squash commits)

---

## Definition of Ready

Before starting any task:
- [ ] Dependencies are complete or mocked
- [ ] Acceptance criteria are clear
- [ ] Required designs/specs are available
- [ ] Test approach is defined
- [ ] Environment is configured

---

## Risk Register

### High Priority Risks

1. **Offline Sync Complexity**
   - Owner: Supabase Architect
   - Mitigation: Simple last-write-wins initially

2. **Mobile Performance**
   - Owner: UI Engineer  
   - Mitigation: Profile early and often

3. **Auth Flow Issues**
   - Owner: Both
   - Mitigation: Test on real devices Day 2

---

## Notes Section

### UI Engineer Notes - Day 3
**Roster Management Implementation Guide:**
- Use TanStack Router file-based routing for /roster/* pages
- Leverage existing button/form components from /components/ui/
- For bulk import: Accept these formats:
  - "Name, Number" (comma separated)
  - "Name\tNumber" (tab separated from Excel)
  - "Name" only (auto-assign numbers)
- Virtual scrolling: Use TanStack Virtual for 20+ players
- Swipe gestures: Use touch-action CSS and pointer events
- Store jersey numbers in Zustand, sync to DB on blur

**Game Creation Quick Start:**
```typescript
// One-tap defaults
const quickStartGame = {
  opponent: "TBD",
  homeAway: "home",
  quarterMinutes: 8,
  status: "active"
}
```

### Supabase Architect Notes - Day 3
**Game Functions Implementation:**
```sql
-- CRITICAL: Snapshot roster at game creation
-- This preserves player list even if roster changes later
INSERT INTO game_players (game_id, player_id, jersey_number, is_striped)
SELECT @game_id, id, jersey_number, is_striped
FROM players WHERE team_id = @team_id;
```

**MPR Calculation Notes:**
- CFL requires 8 plays minimum per game
- Track by quarter for substitution recommendations
- Use JSONB for play_data to store player arrays
- Index on game_id + quarter for performance

**Play Recording Structure:**
```typescript
interface PlayData {
  type: 'run' | 'pass' | 'penalty'
  players: string[] // array of player IDs
  quarter: number
  timestamp: number
  result?: 'complete' | 'incomplete' | 'touchdown'
}
```

### PM Notes - Day 3 Priorities
**Critical Success Factors:**
1. **Speed over features** - Coach should add full roster in 2 minutes
2. **One-tap game start** - Don't make coaches fill forms during pregame chaos
3. **Forgiveness** - Every action must be undoable (delete player, wrong play, etc.)
4. **Offline-first** - Assume network will fail at crucial moments

**User Story Reality Check:**
*"It's 8:45 AM, game starts at 9:00. Coach just arrived at field. Half the parents are asking questions. Three kids forgot their cleats. The other team is warming up. Coach needs to enter the roster NOW and start tracking plays in 15 minutes."*

This is why we need:
- Bulk import (paste from email/spreadsheet)
- One-tap game start
- No required fields except essentials
- Everything else can be "fixed later"