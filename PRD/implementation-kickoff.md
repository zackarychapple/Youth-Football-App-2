# Implementation Kickoff - Day 2
## CFL Game Tracker MVP Development

**Date:** August 17, 2025  
**Sprint Day:** 2 of 10  
**Status:** READY TO CODE  
**Author:** Product Manager

---

## IMMEDIATE ACTION REQUIRED

### Supabase Credentials Available
```
Project URL: https://yepriyrcjmlmhrwpgqka.supabase.co
Anon Key: Available in .env file
Service Key: Available in .env file (for migrations only)
```

**CRITICAL:** These credentials are configured for a non-Next.js setup. Use vanilla JavaScript/TypeScript imports, NOT Next.js environment variable patterns.

---

## Day 2 Order of Operations

### Phase 1: Foundation (9:00 AM - 11:00 AM)

#### Supabase Architect - START IMMEDIATELY
**TASK-SA-001: Initialize Supabase Project**
1. Connect to existing Supabase project using credentials
2. Run database migrations in order:
   - 001_initial_schema.sql
   - 002_teams_and_rosters.sql
   - 003_games_and_plays.sql
   - 004_mppr_tracking.sql
   - 005_auth_and_permissions.sql
   - 006_indexes_and_performance.sql
   - 007_functions_and_triggers.sql
3. Verify all tables, views, and functions created successfully
4. Generate TypeScript types using Supabase CLI:
   ```bash
   npx supabase gen types typescript --project-id yepriyrcjmlmhrwpgqka > src/types/supabase.ts
   ```
5. **HANDOFF TO UI ENGINEER:** Share generated types file by 10:30 AM

#### UI Engineer - START IN PARALLEL
**TASK-UI-001: Project Setup**
1. Initialize Rsbuild project structure:
   ```
   /src
     /components
       /game-tracker
       /roster
       /auth
       /shared
     /hooks
     /stores
     /lib
     /types
     /styles
   ```
2. Install and configure:
   - Rsbuild with PWA plugin
   - TanStack Router v1
   - Tailwind CSS v4
   - Zustand for state management
   - @supabase/supabase-js (NOT @supabase/ssr)
3. Create base PWA configuration:
   - Service worker for offline support
   - App manifest with icons
   - Cache strategies for API calls
4. Set up environment variables (non-Next.js pattern):
   ```typescript
   // src/lib/config.ts
   export const config = {
     supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
     supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
   }
   ```

---

### Phase 2: Integration (11:00 AM - 2:00 PM)

#### Coordination Point #1 (11:00 AM)
- Supabase Architect delivers TypeScript types to UI Engineer
- UI Engineer integrates types into store definitions
- Both confirm Supabase client can connect

#### Supabase Architect
**TASK-SA-002: Authentication Setup**
1. Configure Supabase Auth:
   - Email/password authentication
   - Magic link support
   - Session management
2. Create auth helper functions:
   ```typescript
   // src/lib/supabase/auth.ts
   export const signUp(email, password)
   export const signIn(email, password)
   export const signOut()
   export const getCurrentUser()
   ```
3. Test auth flow with Postman/curl
4. Document auth endpoints for UI Engineer

#### UI Engineer
**TASK-UI-002: Core Layout & Routing**
1. Create app shell with TanStack Router:
   - Protected routes for authenticated users
   - Public routes for parent viewing
   - Route guards using Supabase auth
2. Implement base layout:
   - Bottom navigation (Games, Roster, Settings)
   - Header with team context
   - Offline indicator
3. Create Zustand stores structure:
   ```typescript
   // src/stores/auth.ts
   // src/stores/team.ts
   // src/stores/game.ts
   // src/stores/offline.ts
   ```

---

### Phase 3: First Features (2:00 PM - 5:00 PM)

#### Coordination Point #2 (2:00 PM)
- Confirm auth is working end-to-end
- UI Engineer can sign up/sign in
- TypeScript types are properly integrated

#### Supabase Architect
**TASK-SA-003: Team & Roster APIs**
1. Implement team CRUD operations:
   - createTeam()
   - updateTeam()
   - getTeam()
   - deleteTeam()
2. Implement roster management:
   - addPlayer()
   - updatePlayer()
   - removePlayer()
   - bulkImportPlayers()
3. Create Edge Function for share codes:
   ```sql
   -- Generate unique 6-character share code
   -- Validate share code and return team data
   ```
4. Set up real-time subscriptions for roster changes

#### UI Engineer
**TASK-UI-003: Authentication UI**
1. Create authentication screens:
   - Sign up with email/password
   - Sign in with email/password
   - Password reset flow
2. Implement form validation:
   - Email format validation
   - Password strength requirements
   - Error message display
3. Add loading states and error handling:
   - Button loading indicators
   - Network error recovery
   - Session persistence
4. Test offline behavior:
   - Queue auth attempts when offline
   - Show appropriate messaging

---

## Critical Handoff Points

### Handoff #1: TypeScript Types (10:30 AM)
- **From:** Supabase Architect
- **To:** UI Engineer
- **Deliverable:** Generated supabase.ts types file
- **Validation:** Types compile without errors

### Handoff #2: Auth Functions (1:00 PM)
- **From:** Supabase Architect
- **To:** UI Engineer
- **Deliverable:** Working auth helper functions
- **Validation:** Can create account and sign in

### Handoff #3: Team APIs (4:00 PM)
- **From:** Supabase Architect
- **To:** UI Engineer
- **Deliverable:** Team/roster CRUD operations
- **Validation:** Can create team with players

---

## Success Criteria for Day 2

### Must Complete
- [x] Supabase project connected with credentials
- [ ] All database migrations run successfully
- [ ] TypeScript types generated and integrated
- [ ] Rsbuild project structure created
- [ ] PWA configuration initialized
- [ ] Authentication working end-to-end
- [ ] Can create a user account
- [ ] Can sign in/out
- [ ] Basic routing with auth guards

### Nice to Have
- [ ] Team creation API working
- [ ] Roster management started
- [ ] Offline queue initialized
- [ ] Share code generation

---

## Potential Blockers & Mitigations

### 1. TypeScript Type Generation Issues
**Risk:** Supabase CLI might not generate types correctly  
**Mitigation:** Have backup plan to manually create critical types  
**Owner:** Supabase Architect

### 2. PWA Service Worker Conflicts
**Risk:** Service worker might interfere with hot reload during development  
**Mitigation:** Disable SW in development, test separately  
**Owner:** UI Engineer

### 3. CORS Issues with Supabase
**Risk:** Local development might face CORS restrictions  
**Mitigation:** Use Supabase URL directly, no proxy needed  
**Owner:** Both

### 4. Environment Variable Loading
**Risk:** Vite might not load env vars correctly  
**Mitigation:** Use import.meta.env pattern, not process.env  
**Owner:** UI Engineer

---

## Communication Protocol

### Check-in Schedule
- **10:30 AM:** TypeScript types handoff
- **12:00 PM:** Progress check and blocker review
- **2:00 PM:** Auth integration confirmation
- **4:00 PM:** End of day sync
- **5:00 PM:** Day 2 completion report

### Escalation Path
1. Try to solve independently for 15 minutes
2. Check documentation and existing code
3. Reach out to other engineer if blocked
4. Escalate to PM if blocked > 30 minutes

### Where to Find Things
- Supabase credentials: `.env` file in root
- Database migrations: `/PRD/database-migrations.md`
- API specifications: `/PRD/api-specs.md`
- Component specifications: `/PRD/component-specs.md`
- TypeScript types (once generated): `/src/types/supabase.ts`

---

## Day 3 Preview

Once Day 2 is complete, Day 3 will focus on:
1. Team creation and roster management UI
2. Game creation and state management
3. Play tracking data model
4. Offline queue implementation
5. Real device testing (acquire test devices)

---

## Important Reminders

### For UI Engineer
- Every touch target must be minimum 48px for gloved hands
- Test with browser dev tools in mobile mode
- Consider thumb reach zones for bottom navigation
- Implement loading states for every async operation
- Design for offline-first from the start

### For Supabase Architect
- Keep all data public (no RLS needed per architecture decision)
- Use JSONB for play storage for maximum flexibility
- Implement idempotent operations for offline sync
- Generate TypeScript types after EVERY schema change
- Document all Edge Functions thoroughly

### For Both
- We're building for coaches on muddy sidelines
- 20-second play clock is our performance benchmark
- Every feature must work offline
- Simplicity beats features every time
- Test with 25+ player rosters early

---

## Sprint Status Update

### Overall Sprint Health: 🟢 GREEN
- Day 1: ✅ All specifications delivered
- Day 2: 🚀 Ready to begin implementation
- Confidence Level: HIGH
- Blockers: NONE

### Lines of Code Target
- Day 2 Target: 800-1200 lines of actual code
- Focus: Quality setup over quantity
- Priority: Working authentication end-to-end

---

## Final Notes

Remember our core principle: **Every feature must be usable with wet, gloved hands while standing in the rain with a 20-second play clock ticking.**

If you're questioning whether to add complexity, don't. Coaches need reliability, not features.

The public-data architecture decision is our superpower - it eliminates weeks of RLS complexity. Use this advantage to move fast and focus on the user experience.

**LET'S BUILD SOMETHING COACHES WILL ACTUALLY USE!**

---

*Next sync: 10:30 AM for TypeScript types handoff*  
*End of day report due: 5:00 PM*

**Product Manager Contact:** Available for immediate escalation
**Status:** AWAITING IMPLEMENTATION START