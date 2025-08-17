# Day 3 Implementation Checklist
## Quick Reference for Engineers

---

## UI Engineer Checklist

### Morning (9 AM - 1 PM): Player Roster Management

#### Files to Create:
```
✅ /src/routes/roster/index.tsx
✅ /src/routes/roster/add-player.tsx  
✅ /src/routes/roster/bulk-import.tsx
✅ /src/components/roster/PlayerCard.tsx
✅ /src/components/roster/PlayerQuickAdd.tsx
✅ /src/components/roster/BulkImportModal.tsx
✅ /src/stores/roster.store.ts
```

#### Key Features:
- [ ] Quick add with auto-increment jersey (start at 1)
- [ ] Name field only required
- [ ] Mark as "striped" checkbox
- [ ] Bulk import accepting:
  - "Name, Number"
  - "Name\tNumber" (Excel paste)
  - "Name" (auto-assign number)
- [ ] Virtual scrolling for 20+ players
- [ ] Swipe-to-edit gesture
- [ ] Swipe-to-delete with undo
- [ ] Search/filter by name or number

#### Performance Targets:
- Single player add: < 2 seconds
- Bulk import 20 players: < 5 seconds
- List render: < 100ms

#### Code Snippets:
```typescript
// roster.store.ts
interface RosterStore {
  players: Player[]
  isLoading: boolean
  addPlayer: (player: Omit<Player, 'id'>) => Promise<void>
  bulkImport: (data: string) => Promise<void>
  updatePlayer: (id: string, updates: Partial<Player>) => Promise<void>
  deletePlayer: (id: string) => Promise<void>
  getNextJerseyNumber: () => number
}

// Bulk import parser
const parseBulkData = (data: string) => {
  const lines = data.trim().split('\n')
  return lines.map((line, index) => {
    const [name, number] = line.split(/[,\t]/)
    return {
      name: name.trim(),
      jersey_number: number ? parseInt(number) : index + 1
    }
  })
}
```

### Afternoon (1 PM - 4 PM): Game Creation

#### Files to Create:
```
✅ /src/routes/games/index.tsx
✅ /src/routes/games/new.tsx
✅ /src/routes/games/active.tsx
✅ /src/components/games/QuickStartButton.tsx
✅ /src/components/games/OpponentEntry.tsx
✅ /src/components/games/GameSettings.tsx
✅ /src/stores/game.store.ts
```

#### Key Features:
- [ ] One-tap "Quick Start" button (prominent)
- [ ] Quick start defaults:
  - Opponent: "TBD"
  - Home/Away: "Home"
  - Quarter Length: 8 minutes
- [ ] Optional opponent name entry
- [ ] Home/Away toggle
- [ ] Quarter length selector (8/10/12)
- [ ] Auto-snapshot roster on creation
- [ ] Navigate to active game after creation

#### Code Snippets:
```typescript
// Quick start implementation
const quickStartGame = async () => {
  const gameId = await db.game.createGame({
    team_id: currentTeam.id,
    opponent_name: "TBD",
    home_away: "home",
    quarter_minutes: 8,
    status: "active",
    game_date: new Date().toISOString()
  })
  navigate(`/games/${gameId}/track`)
}
```

### Late Afternoon (4 PM - 6 PM): Play Tracking UI

#### Files to Create:
```
✅ /src/routes/games/[gameId]/track.tsx
✅ /src/components/games/PlayerGrid.tsx
✅ /src/components/games/PlayButtons.tsx
✅ /src/components/games/QuarterDisplay.tsx
```

#### Key Features:
- [ ] 5x5 player grid (jersey numbers)
- [ ] Multi-select by tapping players
- [ ] Large play type buttons:
  - Run (green)
  - Pass (blue)
  - Penalty (yellow)
- [ ] Quarter/time display at top
- [ ] Undo last play button
- [ ] Selected players highlight

---

## Supabase Architect Checklist

### Morning (9 AM - 12 PM): Game Management Functions

#### Migration File:
```
✅ /supabase/migrations/006_game_functions.sql
```

#### Functions to Create:
- [ ] `create_game_with_roster(team_id, opponent, home_away, quarter_minutes)`
- [ ] `start_game(game_id)`
- [ ] `end_quarter(game_id, quarter_number)`
- [ ] `complete_game(game_id, score_us, score_them)`
- [ ] `get_active_game(team_id)`

#### Critical Implementation:
```sql
-- Roster snapshot on game creation
CREATE TABLE game_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id),
  player_id UUID REFERENCES players(id),
  jersey_number INTEGER NOT NULL,
  is_striped BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game with roster snapshot
CREATE OR REPLACE FUNCTION create_game_with_roster(
  p_team_id UUID,
  p_opponent_name TEXT,
  p_home_away TEXT,
  p_quarter_minutes INT
) RETURNS UUID AS $$
DECLARE
  v_game_id UUID;
BEGIN
  -- Create game
  INSERT INTO games (team_id, opponent_name, home_away, quarter_minutes, status, game_date)
  VALUES (p_team_id, p_opponent_name, p_home_away, p_quarter_minutes, 'pre_game', NOW())
  RETURNING id INTO v_game_id;
  
  -- Snapshot current roster
  INSERT INTO game_players (game_id, player_id, jersey_number, is_striped)
  SELECT v_game_id, id, jersey_number, is_striped
  FROM players
  WHERE team_id = p_team_id AND archived_at IS NULL;
  
  RETURN v_game_id;
END;
$$ LANGUAGE plpgsql;
```

### Afternoon (12 PM - 3 PM): MPR Calculations

#### Migration File:
```
✅ /supabase/migrations/007_mpr_calculations.sql
```

#### Functions to Create:
- [ ] `calculate_player_mpr(game_id, player_id)`
- [ ] `get_mpr_dashboard(game_id)`
- [ ] `get_substitution_recommendations(game_id, quarter)`

#### Materialized View:
```sql
CREATE MATERIALIZED VIEW mpr_status AS
WITH play_counts AS (
  SELECT 
    gp.game_id,
    gp.player_id,
    p.name,
    gp.jersey_number,
    COUNT(DISTINCT pl.id) as total_plays,
    COUNT(DISTINCT pl.id) FILTER (WHERE pl.quarter = 1) as q1_plays,
    COUNT(DISTINCT pl.id) FILTER (WHERE pl.quarter = 2) as q2_plays,
    COUNT(DISTINCT pl.id) FILTER (WHERE pl.quarter = 3) as q3_plays,
    COUNT(DISTINCT pl.id) FILTER (WHERE pl.quarter = 4) as q4_plays
  FROM game_players gp
  JOIN players p ON p.id = gp.player_id
  LEFT JOIN plays pl ON pl.game_id = gp.game_id 
    AND pl.play_data->'players' ? gp.player_id::text
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

-- Refresh trigger
CREATE OR REPLACE FUNCTION refresh_mpr_after_play()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mpr_status;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_mpr
AFTER INSERT OR UPDATE OR DELETE ON plays
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_mpr_after_play();
```

### Late Afternoon (3 PM - 5 PM): Play Recording

#### Migration File:
```
✅ /supabase/migrations/008_play_recording.sql
```

#### Functions to Create:
- [ ] `record_play(game_id, quarter, play_type, player_ids[])`
- [ ] `undo_last_play(game_id)`
- [ ] `get_play_history(game_id, limit)`

#### Play Structure:
```sql
-- Plays table already exists, ensure structure:
ALTER TABLE plays 
ADD COLUMN IF NOT EXISTS play_data JSONB;

-- Record play function
CREATE OR REPLACE FUNCTION record_play(
  p_game_id UUID,
  p_quarter INT,
  p_play_type TEXT,
  p_player_ids UUID[]
) RETURNS UUID AS $$
DECLARE
  v_play_id UUID;
  v_play_number INT;
BEGIN
  -- Get next play number
  SELECT COALESCE(MAX(play_number), 0) + 1
  INTO v_play_number
  FROM plays
  WHERE game_id = p_game_id;
  
  -- Insert play
  INSERT INTO plays (
    game_id,
    play_number,
    quarter,
    play_type,
    play_data
  ) VALUES (
    p_game_id,
    v_play_number,
    p_quarter,
    p_play_type,
    jsonb_build_object(
      'type', p_play_type,
      'players', p_player_ids,
      'timestamp', extract(epoch from now())
    )
  ) RETURNING id INTO v_play_id;
  
  RETURN v_play_id;
END;
$$ LANGUAGE plpgsql;
```

---

## Integration Points & Testing

### 11:00 AM - Player Data Sync
- [ ] Confirm player table structure
- [ ] Test bulk import formats
- [ ] Verify jersey number uniqueness

### 2:00 PM - Game Creation Test
- [ ] Create game returns ID
- [ ] Roster snapshot works
- [ ] Navigate to active game

### 4:00 PM - Play Recording Test
- [ ] Record play with multiple players
- [ ] MPR updates automatically
- [ ] Undo works correctly

### 5:00 PM - End-to-End Demo
1. [ ] Create team
2. [ ] Add 22 players (3 individual, 19 bulk)
3. [ ] Mark 5 as striped
4. [ ] Quick start game
5. [ ] Record 5 plays
6. [ ] View MPR status
7. [ ] Undo a play

---

## Common Issues & Solutions

### Issue: Bulk import fails
**Solution:** Check format parsing, handle edge cases (empty lines, extra spaces)

### Issue: Virtual scrolling performance
**Solution:** Use TanStack Virtual, limit initial render to 20 items

### Issue: Play recording slow
**Solution:** Optimistic updates, queue locally first

### Issue: MPR not updating
**Solution:** Check materialized view refresh, ensure JSONB query works

---

## Remember the User

**Scenario:** It's 8:45 AM on a muddy field. Coach has 15 minutes before game time.

- Gloves are wet
- Screen has water drops
- Parents asking questions
- Kids running around
- Other team warming up

**This is why we need:**
- 48px+ touch targets
- One-tap actions
- Bulk import
- Undo everything
- Offline-first

---

*Every decision should make the coach's life easier, not harder.*