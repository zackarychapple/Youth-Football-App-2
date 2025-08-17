# Implementation Plan
## Youth Football Game Management System

### Version 1.0
### Date: August 2025

---

## Executive Summary

This implementation plan outlines a phased approach to building the Youth Football Game Management System, prioritizing core game-day functionality in the MVP while planning for enhanced features in subsequent releases. The plan emphasizes rapid deployment for the upcoming football season with a focus on reliability and usability over feature completeness.

---

## Development Phases

### Phase 1: MVP (Weeks 1-6)
**Goal:** Basic game tracking with MPR compliance for upcoming season

**Core Features:**
- Basic authentication (email/password)
- Team creation and roster management
- Simple game tracking interface
- MPR dashboard
- Offline support with sync

**Success Criteria:**
- 10 beta teams using system
- < 10 second play entry workflow
- Zero data loss events
- MPR tracking accuracy 100%

### Phase 2: Enhanced Game Management (Weeks 7-10)
**Goal:** Streamline game-day operations

**Features:**
- Lineup presets
- Quick substitution panel
- Play numbering and editing
- Position-based player grouping
- Injury tracking

**Success Criteria:**
- 50% reduction in substitution time
- Post-game editing used by 80% of coaches
- Injury tracking adopted by 60% of teams

### Phase 3: Multi-User & Stats (Weeks 11-14)
**Goal:** Enable team collaboration and automated reporting

**Features:**
- Assistant coach invites
- Real-time collaboration
- Automatic statistics calculation
- Player and team reports
- Season-long tracking

**Success Criteria:**
- 2+ coaches per team average
- 90% of teams viewing stats
- Parent portal adoption > 50%

### Phase 4: Advanced Features (Weeks 15-18)
**Goal:** Differentiate from competition

**Features:**
- Advanced play analytics
- Video integration (optional)
- League integration APIs
- Custom MPR rules engine
- Tournament mode

**Success Criteria:**
- 200+ teams on platform
- 3+ league partnerships
- 4.5+ app store rating

---

## MVP Definition

### Critical Path Features (Must Have)

#### 1. Authentication
- Email/password login via Supabase
- Password reset
- Session management
- Role-based access (Coach/Admin)

#### 2. Team Setup
- Create team with name
- Add players (name, number)
- Set MPR requirement (default 8)
- Mark attendance pre-game

#### 3. Game Tracking Interface
```
+------------------+
|  Q1  | DOWN: 1   |
|  2:35| YARD: 35  |
+------------------+
|    [OFFENSE]     |
+------------------+
| Active Players:  |
| 12,7,22,15,8,... |
+------------------+
|   SELECT QB:     |
|  [7] [12] [15]   |
+------------------+
| PLAY TYPE:       |
| [RUN][PASS][KEEP]|
+------------------+
| [RECORD PLAY]    |
+------------------+
| MPR Status: 3/22 |
+------------------+
```

#### 4. MPR Dashboard
- Real-time play counts
- Visual indicators for below threshold
- Sort by plays needed
- Quick view during timeouts

#### 5. Basic Substitutions
- Toggle players IN/OUT
- Show current play count
- Persist across plays
- Clear visual state

#### 6. Data Persistence
- Local storage for offline
- Background sync when online
- Conflict resolution
- Auto-save on every action

### Nice-to-Have Features (Can Wait)

- Lineup presets
- Detailed play outcomes
- Defensive play tracking
- Statistical reports
- Multi-coach support
- Play editing/reordering

---

## Technical Stack Recommendations

### Frontend Framework
**Recommendation:** React 19 (Pure Client-Side SPA)

**Rationale:**
- Latest React features for client-side applications
- Excellent mobile performance with code splitting
- Built-in suspense boundaries for loading states
- Strong TypeScript support throughout
- Optimistic UI updates for instant feedback
- Pure client-side rendering for static deployment

### Routing Solution
**Recommendation:** TanStack Router (Client-Side)

**Rationale:**
- Type-safe client-side routing with TypeScript
- File-based routing with code generation
- Client-side data loading and prefetching
- Browser URL and search params management
- Route-level code splitting for SPA
- Nested layouts and error boundaries
- HTML5 History API for clean URLs

### UI Component System
**Recommendation:** Tailwind CSS v4 + shadcn/ui

**Rationale:**
- Tailwind v4 oxide engine for superior performance
- Enhanced responsive utilities and container queries
- shadcn/ui for production-ready, customizable components
- Consistent design system with built-in accessibility
- Copy-paste component model for full control
- Touch-optimized with proper mobile considerations

### State Management
**Recommendation:** Zustand for Client State

**Rationale:**
- Lightweight and performant (2.8kb gzipped)
- TypeScript-first with excellent DX
- Built-in persistence middleware for offline
- Devtools support for debugging
- Simple mental model for game state
- Optimistic updates support

### Data Fetching & Caching
**Recommendation:** TanStack Query

**Rationale:**
- Powerful caching with stale-while-revalidate
- Optimistic updates for instant feedback
- Background refetching and sync
- Offline mutation support with retry
- Parallel and dependent queries
- Built-in error and loading states

### Build Tooling
**Recommendation:** Rsbuild (Client-Side Bundle)

**Rationale:**
- Rust-based for exceptional build performance
- Optimized for static SPA deployment
- Out-of-box client-side optimization
- Built-in PWA plugin for offline support
- Superior tree-shaking and code splitting
- Hot Module Replacement with fast refresh
- Configured for pure client-side bundling

### Monorepo Management
**Recommendation:** pnpm Workspaces + nx

**Rationale:**
- pnpm for efficient dependency management
- Workspace protocol for internal packages
- nx for task orchestration and caching
- Affected commands for smart rebuilds
- Distributed task execution
- Dependency graph visualization

### Backend & Database
**Recommendation:** Supabase (PostgreSQL + Auth + Realtime)

**Rationale:**
- Integrated authentication with social providers
- Real-time subscriptions for multi-coach scenarios
- Row Level Security for data isolation
- Built-in REST and GraphQL APIs
- Excellent offline/online sync capabilities
- Edge Functions for server-side logic

### PWA & Offline Support (Pure Client-Side)
**Recommendation:** Workbox + IndexedDB

**Rationale:**
- Workbox for advanced service worker strategies
- IndexedDB for structured offline data storage
- Background sync API for deferred actions
- Cache-first strategies for app shell and static assets
- Network-first for Supabase API calls
- Complete offline functionality in the browser
- No server dependencies for core functionality

### Development Experience
**Recommendation:** TypeScript + Biome + Playwright

**Rationale:**
- TypeScript for end-to-end type safety
- Biome for fast linting and formatting
- Playwright for cross-browser e2e testing
- Component testing with Testing Library
- Visual regression testing for UI consistency
- Client-side performance monitoring with Web Vitals
- All development focused on client-side patterns

---

## Supabase Backend Architecture

### Philosophy & Approach
Given that all data is public and we have a single coach entry point, we can embrace simplicity over complexity. No Row Level Security (RLS) gymnastics needed - just clean, performant, pragmatic solutions.

### 1. Database Schema Design

#### Core Tables (Optimized for Game-Day Performance)

```sql
-- Single league for now (CFL hardcoded)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  coach_id UUID REFERENCES auth.users(id),
  season TEXT DEFAULT '2025',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players with denormalized stats for quick access
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  jersey_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  position TEXT,
  is_active BOOLEAN DEFAULT true,
  mpr_requirement INTEGER DEFAULT 8,
  mpr_note TEXT,
  -- Denormalized season stats (updated via triggers)
  season_play_count INTEGER DEFAULT 0,
  season_offensive_plays INTEGER DEFAULT 0,
  season_defensive_plays INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, jersey_number)
);

-- Games with public share capability
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  share_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  opponent TEXT,
  game_type TEXT CHECK (game_type IN ('game', 'practice', 'scrimmage')) DEFAULT 'game',
  game_date DATE DEFAULT CURRENT_DATE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_home BOOLEAN DEFAULT true,
  status TEXT CHECK (status IN ('scheduled', 'active', 'completed')) DEFAULT 'scheduled',
  -- Game state for quick resume
  current_quarter INTEGER DEFAULT 1,
  current_down INTEGER,
  current_distance INTEGER,
  field_position INTEGER,
  possession TEXT CHECK (possession IN ('offense', 'defense', 'special')),
  -- Final scores
  our_score INTEGER DEFAULT 0,
  opponent_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game roster with attendance and game-specific MPR
CREATE TABLE game_rosters (
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  is_present BOOLEAN DEFAULT true,
  mpr_override INTEGER, -- Game-specific MPR requirement
  mpr_override_reason TEXT,
  -- Denormalized game stats (updated in real-time)
  play_count INTEGER DEFAULT 0,
  offensive_plays INTEGER DEFAULT 0,
  defensive_plays INTEGER DEFAULT 0,
  qb_plays INTEGER DEFAULT 0,
  PRIMARY KEY (game_id, player_id)
);

-- Plays stored as JSONB for flexibility and performance
CREATE TABLE plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  play_number INTEGER NOT NULL,
  quarter INTEGER NOT NULL,
  game_clock TEXT, -- Store as text for flexibility (e.g., "2:35")
  play_type TEXT CHECK (play_type IN ('offense', 'defense', 'special')) NOT NULL,
  
  -- Play data as JSONB for maximum flexibility
  play_data JSONB NOT NULL DEFAULT '{}',
  /* Example play_data structure:
  {
    "formation": "I-Formation",
    "down": 1,
    "distance": 10,
    "field_position": 35,
    "players_on_field": ["uuid1", "uuid2", ...],
    "qb_id": "uuid",
    "play_call": "run", // or "pass", "qb_keep"
    "ball_carrier_id": "uuid",
    "yards_gained": 7,
    "result": "first_down", // "touchdown", "turnover", etc.
    "defensive_stats": {
      "tackles": ["uuid1", "uuid2"],
      "sacks": ["uuid3"]
    }
  }
  */
  
  -- Optimistic locking for conflict resolution
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Offline sync support
  client_id TEXT, -- Client-generated ID for deduplication
  synced_at TIMESTAMPTZ,
  
  UNIQUE(game_id, play_number)
);

-- Lineup presets for quick substitutions
CREATE TABLE lineup_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lineup_type TEXT CHECK (lineup_type IN ('offense', 'defense', 'special')) NOT NULL,
  player_ids UUID[] NOT NULL, -- Array of player IDs
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offline sync queue for resilient data capture
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  operation_type TEXT NOT NULL, -- 'create_play', 'update_play', 'delete_play'
  target_table TEXT NOT NULL,
  target_id UUID,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_players_team ON players(team_id) WHERE is_active = true;
CREATE INDEX idx_games_team_date ON games(team_id, game_date DESC);
CREATE INDEX idx_games_share_code ON games(share_code) WHERE share_code IS NOT NULL;
CREATE INDEX idx_plays_game ON plays(game_id, play_number);
CREATE INDEX idx_plays_created ON plays(created_at) WHERE synced_at IS NULL;
CREATE INDEX idx_sync_queue_unprocessed ON sync_queue(device_id, created_at) WHERE processed_at IS NULL;

-- GIN index for JSONB queries
CREATE INDEX idx_plays_data ON plays USING GIN (play_data);
```

#### Materialized Views for Statistics

```sql
-- Real-time MPR dashboard view
CREATE MATERIALIZED VIEW mpr_dashboard AS
SELECT 
  gr.game_id,
  gr.player_id,
  p.jersey_number,
  p.name,
  p.position,
  COALESCE(gr.mpr_override, p.mpr_requirement) as mpr_requirement,
  gr.play_count,
  gr.offensive_plays,
  gr.defensive_plays,
  gr.qb_plays,
  CASE 
    WHEN gr.play_count >= COALESCE(gr.mpr_override, p.mpr_requirement) THEN 'met'
    WHEN gr.play_count >= (COALESCE(gr.mpr_override, p.mpr_requirement) * 0.75) THEN 'close'
    ELSE 'needs_plays'
  END as mpr_status,
  GREATEST(0, COALESCE(gr.mpr_override, p.mpr_requirement) - gr.play_count) as plays_needed
FROM game_rosters gr
JOIN players p ON p.id = gr.player_id
WHERE gr.is_present = true;

CREATE UNIQUE INDEX ON mpr_dashboard (game_id, player_id);

-- Season statistics view
CREATE MATERIALIZED VIEW season_stats AS
SELECT 
  p.id as player_id,
  p.team_id,
  p.jersey_number,
  p.name,
  COUNT(DISTINCT g.id) as games_played,
  SUM(gr.play_count) as total_plays,
  SUM(gr.offensive_plays) as offensive_plays,
  SUM(gr.defensive_plays) as defensive_plays,
  SUM(gr.qb_plays) as qb_plays,
  AVG(gr.play_count)::INTEGER as avg_plays_per_game
FROM players p
LEFT JOIN game_rosters gr ON gr.player_id = p.id
LEFT JOIN games g ON g.id = gr.game_id
WHERE g.status = 'completed'
  AND gr.is_present = true
GROUP BY p.id, p.team_id, p.jersey_number, p.name;

CREATE UNIQUE INDEX ON season_stats (player_id);
```

#### Database Functions for Business Logic

```sql
-- Function to record a play and update all statistics atomically
CREATE OR REPLACE FUNCTION record_play(
  p_game_id UUID,
  p_play_data JSONB,
  p_client_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_play_id UUID;
  v_play_number INTEGER;
  v_player_ids UUID[];
  v_qb_id UUID;
BEGIN
  -- Check for duplicate submission
  IF p_client_id IS NOT NULL THEN
    SELECT id INTO v_play_id 
    FROM plays 
    WHERE game_id = p_game_id AND client_id = p_client_id;
    
    IF v_play_id IS NOT NULL THEN
      RETURN v_play_id; -- Idempotent response
    END IF;
  END IF;
  
  -- Get next play number
  SELECT COALESCE(MAX(play_number), 0) + 1 INTO v_play_number
  FROM plays
  WHERE game_id = p_game_id;
  
  -- Insert the play
  INSERT INTO plays (game_id, play_number, play_data, client_id)
  VALUES (p_game_id, v_play_number, p_play_data, p_client_id)
  RETURNING id INTO v_play_id;
  
  -- Extract player data from JSONB
  v_player_ids := ARRAY(
    SELECT jsonb_array_elements_text(p_play_data->'players_on_field')::UUID
  );
  v_qb_id := (p_play_data->>'qb_id')::UUID;
  
  -- Update game roster statistics
  UPDATE game_rosters
  SET 
    play_count = play_count + 1,
    offensive_plays = offensive_plays + 
      CASE WHEN p_play_data->>'play_type' = 'offense' THEN 1 ELSE 0 END,
    defensive_plays = defensive_plays + 
      CASE WHEN p_play_data->>'play_type' = 'defense' THEN 1 ELSE 0 END,
    qb_plays = qb_plays + 
      CASE WHEN player_id = v_qb_id THEN 1 ELSE 0 END
  WHERE game_id = p_game_id 
    AND player_id = ANY(v_player_ids);
  
  -- Update game state
  UPDATE games
  SET 
    current_down = (p_play_data->>'down')::INTEGER,
    current_distance = (p_play_data->>'distance')::INTEGER,
    field_position = (p_play_data->>'field_position')::INTEGER,
    updated_at = NOW()
  WHERE id = p_game_id;
  
  -- Refresh materialized view for real-time dashboard
  REFRESH MATERIALIZED VIEW CONCURRENTLY mpr_dashboard
  WHERE game_id = p_game_id;
  
  RETURN v_play_id;
END;
$$ LANGUAGE plpgsql;

-- Function to bulk sync offline plays
CREATE OR REPLACE FUNCTION sync_offline_plays(
  p_device_id TEXT,
  p_plays JSONB[]
) RETURNS TABLE(play_id UUID, status TEXT) AS $$
DECLARE
  v_play JSONB;
  v_play_id UUID;
  v_error TEXT;
BEGIN
  FOR v_play IN SELECT unnest(p_plays) LOOP
    BEGIN
      v_play_id := record_play(
        (v_play->>'game_id')::UUID,
        v_play->'play_data',
        v_play->>'client_id'
      );
      
      RETURN QUERY SELECT v_play_id, 'success'::TEXT;
    EXCEPTION WHEN OTHERS THEN
      v_error := SQLERRM;
      
      -- Log to sync queue for retry
      INSERT INTO sync_queue (device_id, operation_type, target_table, payload, error_message)
      VALUES (p_device_id, 'create_play', 'plays', v_play, v_error);
      
      RETURN QUERY SELECT NULL::UUID, v_error;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 2. Authentication Strategy (Simple & Effective)

```typescript
// Supabase auth configuration
const authConfig = {
  // Coach authentication - simple email/password
  providers: ['email'],
  
  // No complex permissions needed - public data
  enableRLS: false, // We're not using RLS
  
  // Session configuration for offline support
  persistSession: true,
  storageKey: 'cfl-tracker-auth',
  autoRefreshToken: true,
  
  // Long session for game-day convenience
  expiresIn: 604800, // 7 days
};

// Parent viewing with share code (no auth required)
export async function getGameByShareCode(shareCode: string) {
  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      team:teams(*),
      plays(*)
    `)
    .eq('share_code', shareCode)
    .single();
    
  return data; // No auth check needed - public data
}
```

### 3. Real-time Subscriptions (Parent Live Viewing)

```typescript
// Efficient real-time subscription for live game updates
export function subscribeToGame(gameId: string) {
  // Single channel for all game updates
  const channel = supabase
    .channel(`game:${gameId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'plays',
        filter: `game_id=eq.${gameId}`
      },
      (payload) => {
        // Update local state with new play
        queryClient.setQueryData(['game', gameId, 'plays'], (old) => 
          [...old, payload.new]
        );
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`
      },
      (payload) => {
        // Update game state (score, quarter, etc.)
        queryClient.setQueryData(['game', gameId], payload.new);
      }
    )
    .subscribe();
    
  return () => channel.unsubscribe();
}

// Bandwidth-optimized subscription with debouncing
export function subscribeToDashboard(gameId: string) {
  let updateBuffer = [];
  let updateTimer;
  
  const channel = supabase
    .channel(`dashboard:${gameId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public', 
        table: 'game_rosters',
        filter: `game_id=eq.${gameId}`
      },
      (payload) => {
        // Buffer updates to reduce re-renders
        updateBuffer.push(payload);
        
        clearTimeout(updateTimer);
        updateTimer = setTimeout(() => {
          // Batch update the dashboard
          queryClient.setQueryData(['mpr-dashboard', gameId], 
            applyBatchUpdates(updateBuffer)
          );
          updateBuffer = [];
        }, 500); // 500ms debounce
      }
    )
    .subscribe();
    
  return () => channel.unsubscribe();
}
```

### 4. Edge Functions (Server-side Logic)

```typescript
// Supabase Edge Functions handle all server-side logic
// The client SPA only calls these endpoints
// edge-functions/calculate-stats/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  const { gameId } = await req.json();
  
  // Simple, direct queries - no RLS complexity
  const { data: plays } = await supabase
    .from('plays')
    .select('play_data')
    .eq('game_id', gameId);
    
  // Calculate statistics
  const stats = {
    totalYards: plays.reduce((sum, p) => 
      sum + (p.play_data.yards_gained || 0), 0),
    passingYards: plays
      .filter(p => p.play_data.play_call === 'pass')
      .reduce((sum, p) => sum + (p.play_data.yards_gained || 0), 0),
    rushingYards: plays
      .filter(p => p.play_data.play_call === 'run')
      .reduce((sum, p) => sum + (p.play_data.yards_gained || 0), 0),
    touchdowns: plays.filter(p => p.play_data.result === 'touchdown').length,
  };
  
  // Store calculated stats
  await supabase
    .from('game_stats')
    .upsert({ game_id: gameId, ...stats });
    
  return new Response(JSON.stringify(stats), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// edge-functions/generate-report/index.ts
serve(async (req) => {
  const { gameId } = await req.json();
  
  // Direct queries for report generation
  const { data: game } = await supabase
    .from('games')
    .select(`
      *,
      team:teams(*),
      game_rosters(
        *,
        player:players(*)
      )
    `)
    .eq('id', gameId)
    .single();
    
  // Generate PDF report
  const report = generateGameReport(game);
  
  // Store in Supabase Storage
  const { data: file } = await supabase.storage
    .from('reports')
    .upload(`${gameId}/game-report.pdf`, report);
    
  return new Response(JSON.stringify({ url: file.publicUrl }));
});
```

### 5. Storage Configuration

```typescript
// Storage buckets configuration
const storageBuckets = {
  // Public bucket for reports (no auth needed)
  reports: {
    public: true,
    fileSizeLimit: '10MB',
    allowedMimeTypes: ['application/pdf'],
  },
  
  // Team assets (logos, etc.)
  teams: {
    public: true,
    fileSizeLimit: '2MB',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  
  // Backup bucket for data exports
  backups: {
    public: false, // Coach access only
    fileSizeLimit: '100MB',
    allowedMimeTypes: ['application/json', 'text/csv'],
  },
};

// Automatic backup strategy
export async function createGameBackup(gameId: string) {
  // Export all game data
  const { data } = await supabase
    .from('plays')
    .select('*')
    .eq('game_id', gameId);
    
  const backup = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    game_id: gameId,
    plays: data,
  };
  
  // Store backup
  await supabase.storage
    .from('backups')
    .upload(
      `${gameId}/backup-${Date.now()}.json`,
      JSON.stringify(backup)
    );
}
```

### 6. Offline Sync Strategy (Conflict-Free)

```typescript
// Offline queue management
class OfflineQueue {
  private queue: any[] = [];
  private processing = false;
  
  async addToQueue(operation: any) {
    // Store in IndexedDB for persistence
    await localforage.setItem(`queue-${Date.now()}`, operation);
    this.queue.push(operation);
    
    // Try to process if online
    if (navigator.onLine) {
      this.processQueue();
    }
  }
  
  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const batch = this.queue.splice(0, 50); // Process in batches
    
    try {
      // Single batch sync call
      const { data, error } = await supabase.rpc('sync_offline_plays', {
        p_device_id: getDeviceId(),
        p_plays: batch
      });
      
      if (error) throw error;
      
      // Clear processed items from IndexedDB
      await Promise.all(batch.map(item => 
        localforage.removeItem(item.localId)
      ));
      
    } catch (error) {
      // Return items to queue for retry
      this.queue.unshift(...batch);
      
      // Exponential backoff
      setTimeout(() => this.processQueue(), 
        Math.min(30000, 1000 * Math.pow(2, this.retryCount++))
      );
    } finally {
      this.processing = false;
      
      // Continue processing if more items
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }
}

// Optimistic UI updates
export function useOptimisticPlay() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (playData) => {
      // Generate client ID for deduplication
      const clientId = crypto.randomUUID();
      
      // Try online first
      if (navigator.onLine) {
        return supabase.rpc('record_play', {
          p_game_id: playData.gameId,
          p_play_data: playData,
          p_client_id: clientId
        });
      }
      
      // Queue for offline processing
      await offlineQueue.addToQueue({
        ...playData,
        client_id: clientId,
        localId: `queue-${Date.now()}`
      });
      
      return { id: clientId, queued: true };
    },
    
    onMutate: async (playData) => {
      // Optimistic update
      await queryClient.cancelQueries(['plays', playData.gameId]);
      
      const previous = queryClient.getQueryData(['plays', playData.gameId]);
      
      queryClient.setQueryData(['plays', playData.gameId], old => [
        ...old,
        { ...playData, id: 'temp-' + Date.now(), pending: true }
      ]);
      
      return { previous };
    },
    
    onError: (err, playData, context) => {
      // Rollback on error
      queryClient.setQueryData(['plays', playData.gameId], context.previous);
    },
    
    onSettled: () => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries(['plays']);
    }
  });
}
```

### 7. Performance Optimizations

```typescript
// Connection pooling configuration
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
      storageKey: 'cfl-tracker',
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10, // Rate limiting
      },
    },
    // Connection pooling via PgBouncer (configured in Supabase)
    // No client-side config needed
  }
);

// Query optimization patterns
export const gameQueries = {
  // Efficient single query with all needed data
  getGameComplete: (gameId: string) => ({
    queryKey: ['game', gameId, 'complete'],
    queryFn: async () => {
      const { data } = await supabase
        .from('games')
        .select(`
          *,
          team:teams!inner(*),
          game_rosters!inner(
            *,
            player:players!inner(*)
          ),
          plays(*)
        `)
        .eq('id', gameId)
        .single();
      
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  }),
  
  // Paginated plays for large games
  getPlays: (gameId: string, page = 0) => ({
    queryKey: ['plays', gameId, page],
    queryFn: async () => {
      const pageSize = 50;
      const { data } = await supabase
        .from('plays')
        .select('*')
        .eq('game_id', gameId)
        .order('play_number', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      return data;
    },
  }),
  
  // Lightweight dashboard query
  getMPRDashboard: (gameId: string) => ({
    queryKey: ['mpr-dashboard', gameId],
    queryFn: async () => {
      // Use materialized view for instant response
      const { data } = await supabase
        .from('mpr_dashboard')
        .select('*')
        .eq('game_id', gameId)
        .order('plays_needed', { ascending: false });
      
      return data;
    },
    refetchInterval: 5000, // Poll every 5 seconds during game
  }),
};

// Caching strategy
export const cacheConfig = {
  // Aggressive caching for static data
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 60, // 1 hour
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
};

// Rate limiting protection
const rateLimiter = {
  playSubmission: new Map(),
  
  canSubmit(userId: string): boolean {
    const now = Date.now();
    const lastSubmit = this.playSubmission.get(userId) || 0;
    
    if (now - lastSubmit < 1000) { // 1 second minimum between plays
      return false;
    }
    
    this.playSubmission.set(userId, now);
    return true;
  }
};
```

### 8. Monitoring & Observability

```sql
-- Database monitoring views
CREATE VIEW active_games_monitor AS
SELECT 
  g.id,
  g.team_id,
  g.status,
  g.created_at,
  COUNT(DISTINCT p.id) as play_count,
  MAX(p.created_at) as last_play_at,
  EXTRACT(EPOCH FROM (NOW() - MAX(p.created_at))) as seconds_since_last_play
FROM games g
LEFT JOIN plays p ON p.game_id = g.id
WHERE g.status = 'active'
GROUP BY g.id;

-- Performance monitoring
CREATE VIEW slow_queries_monitor AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100 -- Queries averaging over 100ms
ORDER BY mean_time DESC
LIMIT 20;
```

```typescript
// Client-side monitoring
export const monitoring = {
  trackPlayEntry: (duration: number) => {
    // Send to analytics
    if (duration > 2000) {
      console.warn('Slow play entry:', duration);
      // Report to Sentry or analytics service
    }
  },
  
  trackSyncSuccess: (itemCount: number, duration: number) => {
    console.log(`Synced ${itemCount} items in ${duration}ms`);
  },
  
  trackError: (error: any, context: any) => {
    console.error('App error:', error, context);
    // Send to error tracking service
  }
};
```

---

## Database Schema Considerations

### Core Tables Structure

```sql
-- Teams
teams (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_by UUID REFERENCES users,
  created_at TIMESTAMP,
  season VARCHAR(20)
)

-- Players
players (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams,
  name VARCHAR(100) NOT NULL,
  jersey_number INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  mpr_requirement INTEGER DEFAULT 8,
  mpr_note TEXT,
  position VARCHAR(20),
  UNIQUE(team_id, jersey_number)
)

-- Games
games (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams,
  opponent VARCHAR(100),
  game_date TIMESTAMP,
  is_home BOOLEAN,
  status VARCHAR(20), -- 'pending', 'active', 'completed'
  created_by UUID REFERENCES users
)

-- Game Rosters (Attendance)
game_rosters (
  game_id UUID REFERENCES games,
  player_id UUID REFERENCES players,
  is_present BOOLEAN DEFAULT true,
  mpr_override INTEGER,
  mpr_override_reason TEXT,
  PRIMARY KEY(game_id, player_id)
)

-- Plays
plays (
  id UUID PRIMARY KEY,
  game_id UUID REFERENCES games,
  play_number INTEGER NOT NULL,
  quarter INTEGER,
  play_type VARCHAR(20), -- 'offense', 'defense', 'special'
  formation VARCHAR(50),
  down INTEGER,
  distance INTEGER,
  field_position INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Play Participants
play_participants (
  play_id UUID REFERENCES plays,
  player_id UUID REFERENCES players,
  is_on_field BOOLEAN DEFAULT true,
  role VARCHAR(20), -- 'qb', 'runner', 'receiver', 'tackle'
  PRIMARY KEY(play_id, player_id)
)

-- Offensive Plays
offensive_plays (
  play_id UUID PRIMARY KEY REFERENCES plays,
  qb_id UUID REFERENCES players,
  play_call VARCHAR(20), -- 'run', 'pass', 'qb_keep'
  ball_carrier_id UUID REFERENCES players,
  yards_gained INTEGER,
  is_touchdown BOOLEAN,
  is_turnover BOOLEAN
)

-- Defensive Plays  
defensive_plays (
  play_id UUID PRIMARY KEY REFERENCES plays,
  opponent_play_type VARCHAR(20),
  outcome VARCHAR(50)
)

-- Injuries
injuries (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES players,
  game_id UUID REFERENCES games,
  play_id UUID REFERENCES plays,
  injury_time TIMESTAMP,
  return_play_id UUID REFERENCES plays,
  notes TEXT
)

-- Lineups
lineups (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams,
  name VARCHAR(50) NOT NULL,
  lineup_type VARCHAR(20), -- 'offense', 'defense', 'special'
  is_default BOOLEAN DEFAULT false
)

-- Lineup Players
lineup_players (
  lineup_id UUID REFERENCES lineups,
  player_id UUID REFERENCES players,
  position VARCHAR(20),
  PRIMARY KEY(lineup_id, player_id)
)
```

### Key Indexes
```sql
-- Performance-critical indexes
CREATE INDEX idx_plays_game_number ON plays(game_id, play_number);
CREATE INDEX idx_participants_player ON play_participants(player_id, play_id);
CREATE INDEX idx_games_team_date ON games(team_id, game_date DESC);
CREATE INDEX idx_players_team_active ON players(team_id, is_active);
```

### Row Level Security Policies
```sql
-- Teams: Coaches can only see their teams
CREATE POLICY team_access ON teams
  FOR ALL USING (
    id IN (
      SELECT team_id FROM team_coaches 
      WHERE user_id = auth.uid()
    )
  );

-- Players: Inherit team access
CREATE POLICY player_access ON players
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM team_coaches 
      WHERE user_id = auth.uid()
    )
  );
```

---

## UI/UX Recommendations

### Component Architecture with shadcn/ui

#### Core Component Structure
```typescript
// Base component organization
/components
  /ui                    // shadcn/ui primitives
    /button
    /dialog
    /sheet              // For slide-out panels
    /tabs               // For stat navigation
    /badge              // For MPR status
    /toast              // For notifications
  /game                 // Game-specific components
    /PlayTracker
    /MPRDashboard
    /SubstitutionPanel
    /LineupPresets
  /shared               // Reusable composite components
    /PlayerCard
    /TouchTarget
    /SwipeableList
```

#### Component Patterns
1. **Compound Components**
   - PlayTracker with sub-components for QB selection, play type, and recording
   - Maintains internal state with Zustand store
   - Optimistic updates via TanStack Query mutations

2. **Touch-Optimized Components**
   ```typescript
   // Example TouchButton with Tailwind v4
   <Button 
     className="min-h-[60px] min-w-[60px] active:scale-95 
                transition-transform touch-manipulation
                data-[state=pressed]:bg-primary/90"
     variant="default"
     size="lg"
   />
   ```

3. **Accessible Form Controls**
   - Using shadcn/ui form components with react-hook-form
   - Built-in validation and error states
   - Proper ARIA attributes and keyboard navigation

### Responsive Design with Tailwind 4

#### Breakpoint Strategy
```css
/* Mobile-first with Tailwind v4 container queries */
@container (min-width: 640px) { /* Tablet */ }
@container (min-width: 1024px) { /* Desktop */ }

/* Responsive utilities */
.game-grid {
  @apply grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3;
}
```

#### Touch Gesture Handling
```typescript
// Using React's touch events with proper handling
const handleSwipe = useSwipeGesture({
  onSwipeLeft: () => openSubstitutionPanel(),
  onSwipeRight: () => confirmPlay(),
  threshold: 50,
  preventScrollOnSwipe: true
});
```

#### iOS-Optimized Patterns
1. **Safe Area Handling**
   ```css
   .bottom-bar {
     padding-bottom: env(safe-area-inset-bottom);
   }
   ```

2. **Momentum Scrolling**
   ```css
   .scrollable {
     -webkit-overflow-scrolling: touch;
     overscroll-behavior-y: contain;
   }
   ```

3. **iOS PWA Specific**
   - Status bar theming with meta tags
   - Standalone mode detection
   - Home screen icon optimization

### Offline-First UI Patterns

#### Loading States with Suspense (Client-Side)
```typescript
// Client-side suspense boundaries for async components
<Suspense fallback={<GameSkeleton />}>
  <ErrorBoundary fallback={<ErrorState />}>
    <GameTracker />
  </ErrorBoundary>
</Suspense>
```

#### Optimistic Updates
```typescript
// Using TanStack Query for optimistic UI
const mutation = useMutation({
  mutationFn: recordPlay,
  onMutate: async (newPlay) => {
    await queryClient.cancelQueries(['plays']);
    const previous = queryClient.getQueryData(['plays']);
    queryClient.setQueryData(['plays'], old => [...old, newPlay]);
    return { previous };
  },
  onError: (err, newPlay, context) => {
    queryClient.setQueryData(['plays'], context.previous);
    toast.error('Play recording failed. Will retry.');
  }
});
```

#### Sync Status Indicators
```typescript
// Real-time sync status component
const SyncIndicator = () => {
  const { isOnline, pendingSync } = useSyncStatus();
  
  return (
    <Badge variant={isOnline ? "success" : "warning"}>
      {pendingSync > 0 ? `${pendingSync} pending` : 'Synced'}
    </Badge>
  );
};
```

### Performance Optimization Patterns

#### Virtual Scrolling for Rosters
```typescript
// Using TanStack Virtual for large player lists
import { useVirtualizer } from '@tanstack/react-virtual';

const PlayerList = ({ players }) => {
  const virtualizer = useVirtualizer({
    count: players.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Player card height
    overscan: 5
  });
};
```

#### Code Splitting by Route (Client-Side)
```typescript
// TanStack Router with client-side lazy loading
// All routing happens in the browser
const routes = [
  {
    path: '/game/$gameId',
    component: lazy(() => import('./GameTracker')),
  },
  {
    path: '/stats',
    component: lazy(() => import('./Statistics')),
  }
];
// Routes are handled entirely client-side with HTML5 History API
```

#### Image Optimization
```typescript
// Responsive images with lazy loading
<img 
  src="/player-avatar.webp"
  srcSet="/player-avatar@2x.webp 2x"
  loading="lazy"
  decoding="async"
  className="rounded-full w-12 h-12"
/>
```

### Design System Implementation

#### Theme Configuration with Tailwind 4
```javascript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Semantic colors for game states
        'mpr-safe': 'var(--mpr-safe)',
        'mpr-warning': 'var(--mpr-warning)',
        'mpr-danger': 'var(--mpr-danger)',
        'field-active': 'var(--field-active)',
        'field-inactive': 'var(--field-inactive)',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'quick-pulse': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1)',
      }
    }
  }
};
```

#### Component Variants
```typescript
// Using class-variance-authority with shadcn/ui
const playerCardVariants = cva(
  "rounded-lg border p-4 transition-all touch-manipulation",
  {
    variants: {
      status: {
        active: "border-blue-500 bg-blue-50",
        inactive: "border-gray-300 bg-gray-50",
        injured: "border-purple-500 bg-purple-50 opacity-75",
      },
      mpr: {
        safe: "ring-2 ring-green-500",
        warning: "ring-2 ring-yellow-500",
        danger: "ring-2 ring-red-500",
      }
    }
  }
);
```

### Accessibility Implementation

#### ARIA Live Regions
```typescript
// Announcing game updates to screen readers
<div 
  role="status" 
  aria-live="polite" 
  aria-atomic="true"
  className="sr-only"
>
  Play recorded: {lastPlay.description}
</div>
```

#### Keyboard Navigation
```typescript
// Custom keyboard handling for game controls
useKeyboardShortcuts({
  'q': () => focusQBSelection(),
  'r': () => selectRunPlay(),
  'p': () => selectPassPlay(),
  'Enter': () => recordPlay(),
  'Escape': () => cancelPlay(),
});
```

#### Focus Management
```typescript
// Proper focus restoration after modal interactions
const SubstitutionDialog = () => {
  const previousFocus = useRef(document.activeElement);
  
  useEffect(() => {
    return () => {
      previousFocus.current?.focus();
    };
  }, []);
};
```

### Error Handling UI

#### Error Boundaries
```typescript
// Game-specific error boundary with recovery
class GameErrorBoundary extends ErrorBoundary {
  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Game tracking error</AlertTitle>
          <AlertDescription>
            {this.state.error?.message}
          </AlertDescription>
          <Button onClick={() => this.recover()}>
            Recover game state
          </Button>
        </Alert>
      );
    }
    return this.props.children;
  }
}
```

#### Retry Mechanisms
```typescript
// Automatic retry with exponential backoff
const { data, error, isLoading, refetch } = useQuery({
  queryKey: ['game', gameId],
  queryFn: fetchGame,
  retry: 3,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Real-time Updates

#### Optimistic UI with Conflict Resolution
```typescript
// Handle concurrent updates from multiple coaches
const useRealtimeSync = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const subscription = supabase
      .channel('game-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'plays' 
      }, (payload) => {
        // Merge remote changes with local optimistic updates
        queryClient.invalidateQueries(['plays']);
      })
      .subscribe();
      
    return () => subscription.unsubscribe();
  }, []);
};

---

## Testing Strategy

### Testing Phases

#### 1. Unit Testing (Continuous)
- Component isolation tests
- State management logic
- Calculation accuracy (MPR, stats)
- Offline sync logic
- Target: 80% code coverage

#### 2. Integration Testing (Weekly)
- API endpoint validation
- Database transaction integrity
- Authentication flows
- Real-time sync scenarios
- Target: All critical paths covered

#### 3. End-to-End Testing (Sprint-end)
- Complete game workflows
- Multi-user scenarios
- Offline/online transitions
- Device compatibility
- Target: 20 key user journeys

#### 4. Performance Testing
- Play entry response time < 2s
- 100 rapid play entries
- 30 player roster handling
- Offline storage limits
- Battery usage monitoring

#### 5. Field Testing (Beta)
- 10 teams for 2 weeks
- Real game conditions
- Weather/environment factors
- Coach feedback sessions
- Parent portal testing

### Testing Scenarios

#### Critical Game-Day Scenarios
1. **Rapid Play Entry**
   - Enter 10 plays in 2 minutes
   - Switch offense/defense 5 times
   - Make 20 substitutions
   - Verify MPR calculations

2. **Network Interruption**
   - Start game online
   - Lose connection mid-game
   - Continue tracking offline
   - Restore connection
   - Verify sync integrity

3. **Concurrent Coaches**
   - Two coaches enter plays simultaneously
   - Verify conflict resolution
   - Check real-time updates
   - Validate final statistics

4. **Error Recovery**
   - Force close during play entry
   - Reopen app
   - Verify data recovery
   - Continue game tracking

### Device Testing Matrix
- iPhone 12-15 (iOS 14+)
- iPhone SE (small screen)
- Samsung Galaxy S20+ (Android 10+)
- Google Pixel 5-7
- iPad Mini (tablet)
- Outdoor brightness conditions
- Wet screen conditions
- Gloved operation

---

## Deployment Considerations

### Infrastructure Architecture

#### Production Environment (Static SPA)
```
CloudFlare CDN
     ↓
Static Hosting (Vercel/Netlify/GitHub Pages)
- Served as static HTML/JS/CSS files
- No server-side rendering
- Client-side routing only
     ↓
Supabase Cloud (Backend Services)
- PostgreSQL Database
- Authentication Service  
- Realtime Subscriptions
- File Storage
- All backend logic via REST/GraphQL APIs
     ↓
Monitoring: Sentry + Web Analytics
```

#### Staging Environment
- Static files deployed to staging CDN
- Separate Supabase project for backend
- Client-side feature flags
- Beta user access via URL or flag

### Deployment Pipeline

1. **Development**
   - Feature branches
   - Local development with Rsbuild dev server
   - Hot reload development
   - Pure client-side environment

2. **Build Process**
   - Rsbuild production build
   - Static file generation (HTML/JS/CSS)
   - Asset optimization and code splitting
   - PWA manifest and service worker generation

3. **Testing**
   - Automated tests on PR
   - Static preview deployments
   - Manual QA checklist

4. **Production Deployment**
   - Deploy static files to CDN
   - Instant cache invalidation
   - No server restart needed
   - Rollback via CDN version control
   - Compatible with any static host (Vercel, Netlify, AWS S3, GitHub Pages)

### Release Strategy

#### MVP Launch (Week 6)
- Deploy static SPA to production CDN
- Soft launch to 10 beta teams
- Instant deployments for fixes (no server restarts)
- Direct coach support channel
- Feedback integration loop

#### Public Launch (Week 8)
- PWA available at public URL
- "Add to Home Screen" promotion
- App store submissions via PWA wrapper (if needed)
- Static documentation site
- Support ticket system

#### Season Management
- Pre-season: Major features
- In-season: Bug fixes only
- Post-season: Data migrations
- Off-season: Major upgrades

### Monitoring & Analytics

#### Application Monitoring (Client-Side)
- Sentry for client-side error tracking
- Google Analytics or Plausible for usage analytics
- Client-side performance metrics (Core Web Vitals)
- Custom game completion metrics sent to Supabase
- MPR compliance tracking in the browser

#### Key Metrics Dashboard
- Active games in progress
- Play entry success rate
- Average time per play
- Offline/online ratio
- Error rates by feature

#### Alerting Thresholds
- Play entry time > 5 seconds
- Error rate > 1%
- Database latency > 200ms
- Auth failures > 10/minute
- Sync failures > 5%

### Security Considerations

#### Data Protection
- TLS 1.3 for all connections
- Encryption at rest (AES-256)
- PII data minimization
- COPPA compliance measures
- Parental consent workflows

#### Access Control
- Row-level security in database
- JWT token validation
- Rate limiting on APIs
- Session timeout policies
- Audit logging for changes

#### Backup Strategy
- Automated daily backups
- Point-in-time recovery (7 days)
- Cross-region backup storage
- Quarterly restore testing
- Data export capabilities

---

## Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Poor network at fields | High | High | Robust offline mode, aggressive caching |
| Database overload during games | Medium | High | Read replicas, connection pooling |
| Sync conflicts between coaches | Medium | Medium | Operational transforms, clear conflict UI |
| Battery drain during games | Low | High | Optimize renders, reduce network calls |

### User Adoption Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Complex UI for stressed coaches | Medium | High | Extensive field testing, simplification |
| Resistance to change from paper | High | Medium | Gradual onboarding, paper backup option |
| Multi-coach coordination issues | Medium | Medium | Clear role definition, training videos |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| League rule variations | High | Medium | Configurable rules engine |
| Seasonal usage patterns | High | Low | Off-season engagement features |
| Competitor quick-copy | Medium | Medium | Rapid feature iteration |

---

## Timeline & Milestones

### Development Timeline

```
Week 1-2: Foundation
- Project setup
- Authentication implementation
- Database schema
- Basic UI components

Week 3-4: Core Features
- Team/roster management
- Game creation
- Play tracking interface
- MPR calculations

Week 5-6: MVP Completion
- Offline support
- Substitution management
- Testing and bug fixes
- Beta deployment

Week 7-8: Enhanced Features
- Lineup presets
- Quick substitutions
- Play editing
- Public launch prep

Week 9-10: Polish
- Performance optimization
- UI/UX refinements
- Documentation
- Coach training materials

Week 11-12: Multi-User
- Coach invitations
- Real-time sync
- Collaboration features
- Permission system

Week 13-14: Statistics
- Auto calculations
- Report generation
- Export capabilities
- Parent portal

Week 15-16: Advanced Features
- League integrations
- Advanced analytics
- Custom rules
- API development

Week 17-18: Scale & Optimize
- Performance tuning
- Infrastructure scaling
- Feature flags
- A/B testing setup
```

### Key Milestones

1. **Week 2:** Authentication and team setup complete
2. **Week 4:** Core game tracking functional
3. **Week 6:** MVP deployed to beta users
4. **Week 8:** Public launch ready
5. **Week 10:** Feature-complete for season
6. **Week 12:** Multi-coach support live
7. **Week 14:** Full statistics platform
8. **Week 18:** Platform ready for 1000+ teams

---

## Success Criteria

### MVP Success Metrics
- 10 teams complete at least 1 full game
- Zero data loss incidents
- Play entry time < 10 seconds average
- MPR tracking 100% accurate
- Coach satisfaction score > 7/10

### Season 1 Success Metrics  
- 100+ teams onboarded
- 1,000+ games tracked
- 80% season-long retention
- 4.0+ app rating
- < 5% support ticket rate

### Long-term Success Metrics
- 1,000+ teams by Year 2
- 3+ league partnerships
- 90% coach retention year-over-year
- Breakeven on operational costs
- Platform standard for youth football