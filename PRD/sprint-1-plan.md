# CFL Game Tracker - Sprint 1 Plan
## MVP Development Roadmap (6-Week Timeline)

### Project Overview
**Product:** CFL Game Tracker PWA  
**Timeline:** 6 weeks (3 two-week sprints)  
**Team:** UI Engineer, Supabase Architect, Product Manager  
**Sponsor:** Zephyr Cloud (Free Tool)  

---

## Sprint Overview

### Sprint 1: Foundation (Weeks 1-2)
**Theme:** Authentication, Data Models, and Offline Infrastructure  
**Goal:** Establish core technical foundation with working auth and data persistence

### Sprint 2: Core Features (Weeks 3-4)  
**Theme:** Game Management and Play Tracking  
**Goal:** Complete game-day functionality with MPR tracking

### Sprint 3: Polish & Launch (Weeks 5-6)
**Theme:** User Experience, Testing, and Deployment  
**Goal:** Production-ready PWA with offline sync

---

## Sprint 1 Detailed Plan (Weeks 1-2)

### Week 1 Objectives
**Focus:** Infrastructure and Authentication

#### Day 1-2: Project Setup
- Initialize repository structure
- Configure build pipeline (Rsbuild)
- Set up Supabase project
- Configure environment variables
- Establish CI/CD skeleton

#### Day 3-5: Authentication & User Management
- Implement Supabase Auth with email/password
- Create user onboarding flow
- Build team creation interface
- Set up role-based access (Coach, Assistant, Parent)

### Week 2 Objectives
**Focus:** Data Models and Offline Foundation

#### Day 6-8: Core Data Implementation
- Design and implement database schema
- Create data access layers
- Set up TanStack Query with Supabase
- Implement basic CRUD operations

#### Day 9-10: Offline Infrastructure & Testing
- Configure offline-first architecture
- Implement local storage fallbacks
- Set up data sync mechanisms
- Integration testing

---

## Sprint 1 Deliverables

### Must Have (P0)
1. **Authentication System**
   - Email/password login
   - Password reset flow
   - Session management
   - Protected routes

2. **Team Management**
   - Create new team
   - Add players (quick entry)
   - Assign jersey numbers
   - Set team defaults (game length, quarter duration)

3. **Data Models**
   - Teams table with league settings
   - Players table with MPR tracking fields
   - Users table with role management
   - Games table structure

4. **Offline Infrastructure**
   - Local-first data strategy
   - Queue for offline actions
   - Sync status indicators
   - Conflict resolution strategy

### Should Have (P1)
1. **Basic UI Shell**
   - Navigation structure
   - Responsive layout
   - Loading states
   - Error boundaries

2. **Player Management**
   - Bulk player import (paste from spreadsheet)
   - Player availability toggle
   - Quick edit player details

### Nice to Have (P2)
1. **Team Settings**
   - Custom MPR rules
   - Quarter length configuration
   - Play clock settings

---

## Definition of Done

### For Each User Story:
- [ ] Functional code complete
- [ ] Works offline
- [ ] Mobile responsive (iPhone 12 Pro baseline)
- [ ] Accessible (WCAG 2.1 AA for critical paths)
- [ ] Error states handled
- [ ] Loading states implemented
- [ ] Unit tests written (critical paths)
- [ ] Code reviewed by other agent
- [ ] Tested on actual mobile device

### For Sprint 1:
- [ ] All P0 items complete
- [ ] 80% of P1 items complete
- [ ] Deployment pipeline functional
- [ ] Preview environment available
- [ ] Basic documentation complete

---

## Risk Mitigation

### Technical Risks
1. **Offline Sync Complexity**
   - Mitigation: Start with simple last-write-wins
   - Fallback: Queue actions for replay when online

2. **Mobile Performance**
   - Mitigation: Test on mid-range devices early
   - Fallback: Progressive enhancement approach

3. **Supabase Rate Limits**
   - Mitigation: Batch operations where possible
   - Fallback: Implement client-side throttling

### Process Risks
1. **Agent Coordination**
   - Mitigation: Daily sync points in documentation
   - Fallback: PM facilitates direct handoffs

2. **Scope Creep**
   - Mitigation: Strict P0/P1/P2 prioritization
   - Fallback: Push to post-MVP backlog

---

## Success Metrics

### Sprint 1 KPIs
- Authentication working end-to-end
- Can create team and add 20 players in < 2 minutes
- Offline mode captures all actions without data loss
- Page load time < 3 seconds on 4G
- Time to interactive < 5 seconds

### Quality Gates
- No P0 bugs
- Maximum 2 P1 bugs
- Test coverage > 60% for critical paths
- Lighthouse performance score > 80

---

## Communication Plan

### Daily Updates
- Each agent updates their task status in agent-tasks.md
- Blockers raised immediately via PR comments
- Progress tracked via git commits

### Sync Points
- End of Day 2: Setup complete checkpoint
- End of Day 5: Auth/Team checkpoint  
- End of Day 8: Data model review
- End of Day 10: Sprint 1 retrospective

### Handoff Protocol
1. Complete feature branch with tests
2. Update agent-tasks.md with completion status
3. Create PR with acceptance criteria checklist
4. Tag relevant agent for review
5. Merge after approval

---

## Next Sprint Preview

### Sprint 2 Focus Areas (Weeks 3-4)
- Game creation and management
- Real-time play tracking
- Substitution interface
- MPR calculations and warnings
- Play timer implementation
- Quick substitution patterns

### Sprint 3 Focus Areas (Weeks 5-6)
- Post-game reports
- Season statistics
- PWA installation flow
- Performance optimization
- User testing feedback incorporation
- Production deployment

---

## Sprint 1 Timeline

```
Week 1:
Mon-Tue: Setup & Configuration
Wed-Fri: Authentication & Teams

Week 2:
Mon-Wed: Data Models & Integration
Thu-Fri: Offline & Testing
```

**Sprint 1 Start:** Monday, Week 1  
**Sprint 1 End:** Friday, Week 2  
**Sprint 1 Review:** Friday, Week 2, 4 PM  
**Sprint 2 Planning:** Friday, Week 2, 5 PM