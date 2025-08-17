# Day 3 Implementation Plan - Core Game Features
## CFL Game Tracker MVP - Sprint 1

**Date:** August 19, 2025  
**Sprint Day:** 3 of 10  
**Focus:** Player Management, Game Creation, MPR Foundation  
**Product Manager:** Youth Football Domain Expert

---

## Executive Summary

Day 2 exceeded expectations with both engineers completing authentication, database setup, and initial integration ahead of schedule. This positions us perfectly to tackle the core game features on Day 3. Our focus shifts to the heart of the application: managing players, creating games, and establishing the MPR tracking foundation.

**Critical Success Factor:** By end of Day 3, a coach should be able to create a team, add players, and start tracking a game.

---

## Day 3 Objectives

### Primary Goals (Must Complete)
1. ✅ Complete player roster management UI
2. ✅ Implement game creation flow
3. ✅ Deploy game/play database structures
4. ✅ Create MPR calculation foundation

### Secondary Goals (Should Complete)
1. ⏳ Basic play tracking interface
2. ⏳ Player participation tracking
3. ⏳ Quarter management logic
4. ⏳ Offline queue initialization

### Stretch Goals (Nice to Have)
1. ⏳ Real-time MPR dashboard view
2. ⏳ Substitution recommendations
3. ⏳ Play history display

---

## UI Engineer Tasks

### Morning Session (9 AM - 12 PM)
#### Complete Player Management (TASK-UI-003)

**File Locations:**
- `/src/routes/roster/index.tsx` - Main roster view
- `/src/routes/roster/add-player.tsx` - Add player form
- `/src/components/roster/PlayerCard.tsx` - Individual player display
- `/src/components/roster/BulkImport.tsx` - CSV/paste import
- `/src/stores/roster.store.ts` - Player state management

**Key Requirements:**
1. **Quick Add Interface**
   - Large touch targets (minimum 48px)
   - Auto-incrementing jersey numbers
   - Name-only minimum requirement
   - Save on blur for speed

2. **Bulk Import**
   - Accept CSV paste from Excel/Sheets
   - Parse format: "Name, Number, Position"
   - Show preview before import
   - Handle duplicates gracefully

3. **Player List**
   - Virtual scrolling for 20+ players
   - Swipe-to-edit gesture
   - Swipe-to-delete with confirmation
   - Sort by number or name
   - Search/filter capability

4. **Performance Targets:**
   - Add single player: < 2 seconds
   - Import 20 players: < 5 seconds
   - List render: < 100ms

### Afternoon Session (1 PM - 5 PM)
#### Game Creation Interface (NEW FEATURE)

**File Locations:**
- `/src/routes/games/new.tsx` - Game setup screen
- `/src/routes/games/active.tsx` - Active game tracking
- `/src/components/games/OpponentSelect.tsx` - Opponent selection
- `/src/components/games/LineupSelector.tsx` - Starting lineup
- `/src/stores/game.store.ts` - Game state management

**Key Requirements:**
1. **Pre-Game Setup**
   - Opponent name (quick entry or select)
   - Home/Away selection
   - Quarter length setting (8/10/12 minutes)
   - Starting lineup selection (optional)

2. **Quick Start Option**
   - One-tap game start
   - Use defaults (Home, 8-min quarters)
   - Add opponent later
   - Jump straight to tracking

3. **Roster Snapshot**
   - Copy current roster to game
   - Mark active/inactive players
   - Track jersey numbers for game

### Evening Session (If Time Permits)
#### Play Tracking UI Foundation

**File Locations:**
- `/src/routes/games/track.tsx` - Main tracking interface
- `/src/components/games/PlayerGrid.tsx` - Player selection grid
- `/src/components/games/PlayTypeSelector.tsx` - Play type buttons
- `/src/components/games/QuarterManager.tsx` - Quarter/time display

**Key Requirements:**
1. **Player Selection Grid**
   - 5x5 grid for up to 25 players
   - Show jersey numbers prominently
   - Multi-select for plays
   - Visual feedback for selection

2. **Play Type Buttons**
   - Large buttons: Run, Pass, Penalty
   - One-tap play recording
   - Undo last play option

---

## Supabase Architect Tasks

### Morning Session (9 AM - 12 PM)
#### Game Management Functions

**Database Operations:**
```sql
-- Game creation with roster snapshot
CREATE OR REPLACE FUNCTION create_game_with_roster(
  p_team_id UUID,
  p_opponent_name TEXT,
  p_home_away TEXT,
  p_quarter_minutes INT
) RETURNS UUID AS $$
DECLARE
  v_game_id UUID;
BEGIN
  -- Create game record
  INSERT INTO games (team_id, opponent_name, home_away, quarter_minutes, status)
  VALUES (p_team_id, p_opponent_name, p_home_away, p_quarter_minutes, 'pre_game')
  RETURNING id INTO v_game_id;
  
  -- Snapshot roster
  INSERT INTO game_players (game_id, player_id, jersey_number, status)
  SELECT v_game_id, id, jersey_number, 'active'
  FROM players
  WHERE team_id = p_team_id AND deleted_at IS NULL;
  
  RETURN v_game_id;
END;
$$ LANGUAGE plpgsql;
```

**Helper Functions in database.helpers.ts:**
```typescript
export const gameHelpers = {
  async createGame(teamId: string, config: GameConfig) {
    const { data, error } = await supabase.rpc('create_game_with_roster', {
      p_team_id: teamId,
      p_opponent_name: config.opponent,
      p_home_away: config.homeAway,
      p_quarter_minutes: config.quarterMinutes
    })
    if (error) throw error
    return data
  },
  
  async recordPlay(gameId: string, play: PlayData) {
    // Optimistic update for offline support
    const { data, error } = await supabase
      .from('plays')
      .insert({
        game_id: gameId,
        quarter: play.quarter,
        play_data: play,
        created_at: new Date().toISOString()
      })
    if (error) throw error
    return data
  }
}
```

### Afternoon Session (1 PM - 5 PM)
#### MPR Calculation Engine

**Create Materialized View:**
```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS mpr_dashboard AS
WITH play_counts AS (
  SELECT 
    gp.game_id,
    gp.player_id,
    p.name as player_name,
    gp.jersey_number,
    COUNT(DISTINCT plays.id) as total_plays,
    COUNT(DISTINCT plays.id) FILTER (WHERE plays.quarter = 1) as q1_plays,
    COUNT(DISTINCT plays.id) FILTER (WHERE plays.quarter = 2) as q2_plays,
    COUNT(DISTINCT plays.id) FILTER (WHERE plays.quarter = 3) as q3_plays,
    COUNT(DISTINCT plays.id) FILTER (WHERE plays.quarter = 4) as q4_plays
  FROM game_players gp
  JOIN players p ON p.id = gp.player_id
  LEFT JOIN plays ON plays.game_id = gp.game_id 
    AND plays.play_data->>'players' ? gp.player_id::text
  GROUP BY gp.game_id, gp.player_id, p.name, gp.jersey_number
)
SELECT 
  *,
  CASE 
    WHEN total_plays >= 8 THEN 'met'
    WHEN total_plays >= 6 THEN 'close'
    ELSE 'needs_plays'
  END as mpr_status,
  GREATEST(0, 8 - total_plays) as plays_needed
FROM play_counts;

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_mpr_dashboard(p_game_id UUID)
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mpr_dashboard;
END;
$$ LANGUAGE plpgsql;
```

**Real-time Calculation Helpers:**
```typescript
export const mprHelpers = {
  async getMPRStatus(gameId: string) {
    const { data, error } = await supabase
      .from('mpr_dashboard')
      .select('*')
      .eq('game_id', gameId)
      .order('plays_needed', { ascending: false })
    
    if (error) throw error
    return data
  },
  
  async getSubstitutionRecommendations(gameId: string, quarter: number) {
    const mprData = await this.getMPRStatus(gameId)
    
    // Sort by who needs plays most
    return mprData
      .filter(p => p.mpr_status !== 'met')
      .sort((a, b) => b.plays_needed - a.plays_needed)
      .slice(0, 11) // Top 11 for offense/defense
  }
}
```

### Evening Session (If Time Permits)
#### Begin Offline Queue Implementation

**Sync Queue Structure:**
```typescript
interface SyncQueue {
  id: string
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  entity: 'play' | 'game' | 'player'
  data: any
  gameId: string
  timestamp: number
  synced: boolean
  attempts: number
}

export const syncHelpers = {
  async queueOperation(op: Omit<SyncQueue, 'id' | 'timestamp' | 'synced' | 'attempts'>) {
    const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]')
    queue.push({
      ...op,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      synced: false,
      attempts: 0
    })
    localStorage.setItem('sync_queue', JSON.stringify(queue))
  },
  
  async processQueue() {
    const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]')
    const pending = queue.filter(item => !item.synced && item.attempts < 3)
    
    for (const item of pending) {
      try {
        await this.syncOperation(item)
        item.synced = true
      } catch (error) {
        item.attempts++
      }
    }
    
    localStorage.setItem('sync_queue', JSON.stringify(queue))
  }
}
```

---

## Integration Points

### 10:00 AM - Player Data Model Sync
**Participants:** UI Engineer, Supabase Architect  
**Topics:**
- Confirm player table structure
- Jersey number handling
- Bulk import format
- Error handling for duplicates

### 2:00 PM - Game Creation API
**Participants:** UI Engineer, Supabase Architect  
**Topics:**
- Game creation endpoint
- Roster snapshot process
- Game status management
- Quick start parameters

### 4:00 PM - End-to-End Testing
**Participants:** Both Engineers  
**Test Flow:**
1. Create new team
2. Add 20 players (bulk import)
3. Start new game
4. Verify roster snapshot
5. Record test play
6. Check MPR calculation

---

## Performance Requirements

### Critical Metrics
1. **Player Add:** < 2 seconds per player
2. **Bulk Import:** < 5 seconds for 20 players
3. **Game Start:** < 3 seconds total
4. **Play Record:** < 1 second per play
5. **MPR Update:** < 500ms after play

### Mobile Optimization
- Touch targets: minimum 48px
- Gesture support for all actions
- Works with gloves/wet screen
- Landscape support for game tracking
- Offline-first architecture

---

## Risk Mitigation

### Identified Risks
1. **Virtual Scrolling Performance**
   - Mitigation: Test with 30+ players early
   - Fallback: Pagination if needed

2. **Play Entry Speed**
   - Mitigation: Optimistic updates
   - Fallback: Batch play entry

3. **MPR Calculation Accuracy**
   - Mitigation: Extensive unit tests
   - Fallback: Manual override option

4. **Offline Data Loss**
   - Mitigation: LocalStorage + IndexedDB
   - Fallback: Export to clipboard

---

## Success Criteria

### End of Day 3 Checklist
- [ ] Coach can add players individually
- [ ] Coach can bulk import roster
- [ ] Coach can start a game
- [ ] Database tracks all game data
- [ ] MPR calculations are accurate
- [ ] Basic offline queue works
- [ ] No data loss on refresh
- [ ] All actions < 3 seconds

### Demo Script
1. Sign up as new coach
2. Create team "Day 3 Eagles"
3. Bulk import 22 players
4. Start game vs "Tigers"
5. Record 5 test plays
6. View MPR status
7. Demonstrate offline mode
8. Sync when back online

---

## Notes for Tomorrow (Day 4)

Based on Day 3 progress, Day 4 priorities will be:
1. Complete play tracking interface
2. Full offline sync implementation
3. Parent viewing portal basics
4. Performance optimization
5. Real device testing

---

*Remember: We're building for coaches in the rain, with muddy gloves, managing 22 eight-year-olds, with a 20-second play clock. Every decision must support that reality.*

**Next Update:** End of Day 3 Progress Report