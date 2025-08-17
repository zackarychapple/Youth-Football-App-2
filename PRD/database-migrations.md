# Database Migration Plan - CFL Game Tracker
## Sprint 1 Database Implementation

### Version 1.0
### Date: August 17, 2025
### Author: Supabase Architect

---

## Executive Summary

This document outlines the database migration strategy for Sprint 1 of the CFL Game Tracker. Following a pragmatic, public-data approach without complex RLS policies, we'll implement a performant schema optimized for real-time game tracking with offline-first capabilities.

**Key Principles:**
- All data is public (no RLS complexity)
- Single coach data entry (no complex conflict resolution)
- JSONB for flexible play data storage
- Materialized views for real-time MPR dashboard
- Idempotent operations for offline sync

---

## Migration Sequence

### Phase 1: Core Infrastructure (Day 1)
1. Authentication setup (Supabase Auth)
2. Core tables (teams, players, users)
3. Basic indexes

### Phase 2: Game Management (Day 2)
4. Game tables (games, game_rosters)
5. Play tracking schema (plays with JSONB)
6. Lineup management

### Phase 3: Performance & Sync (Day 3)
7. Materialized views for MPR
8. Offline sync infrastructure
9. Performance indexes
10. Database functions

---

## Migration Files

### Migration 001: Initial Schema Setup
**File:** `/supabase/migrations/001_initial_schema.sql`

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Create custom types
CREATE TYPE game_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');
CREATE TYPE game_type AS ENUM ('game', 'scrimmage', 'practice');
CREATE TYPE play_type AS ENUM ('offense', 'defense', 'special');
CREATE TYPE player_status AS ENUM ('active', 'injured', 'ejected', 'inactive');

-- Teams table (CFL hardcoded)
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    coach_id UUID REFERENCES auth.users(id),
    season TEXT DEFAULT '2025',
    age_group TEXT,
    league TEXT DEFAULT 'CFL',
    
    -- Team configuration
    mpr_requirement INTEGER DEFAULT 8,
    field_size INTEGER DEFAULT 80, -- 40, 80, or 100 yards
    special_teams_counts_mpr BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT team_name_unique UNIQUE(name, season)
);

-- Players table with denormalized stats for performance
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    jersey_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    position TEXT,
    
    -- Player status and rules
    status player_status DEFAULT 'active',
    is_striped BOOLEAN DEFAULT false, -- Cannot run the ball
    
    -- MPR tracking
    mpr_requirement INTEGER DEFAULT 8,
    mpr_note TEXT,
    
    -- Denormalized season statistics (updated via triggers)
    season_play_count INTEGER DEFAULT 0,
    season_offensive_plays INTEGER DEFAULT 0,
    season_defensive_plays INTEGER DEFAULT 0,
    season_qb_plays INTEGER DEFAULT 0,
    season_games_played INTEGER DEFAULT 0,
    
    -- Practice tracking
    practice_attendance INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_jersey_per_team UNIQUE(team_id, jersey_number)
);

-- User roles for team access (coaches only)
CREATE TABLE team_coaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'assistant', -- 'head', 'assistant'
    invited_by UUID REFERENCES auth.users(id),
    accepted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_coach_per_team UNIQUE(team_id, user_id)
);

-- Create indexes for core tables
CREATE INDEX idx_teams_coach ON teams(coach_id);
CREATE INDEX idx_teams_season ON teams(season);
CREATE INDEX idx_players_team_active ON players(team_id) WHERE status = 'active';
CREATE INDEX idx_players_jersey ON players(team_id, jersey_number);
CREATE INDEX idx_team_coaches_user ON team_coaches(user_id);
CREATE INDEX idx_team_coaches_team ON team_coaches(team_id);

-- Add update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to teams
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply update trigger to players
CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Migration 002: Game Management Schema
**File:** `/supabase/migrations/002_game_management.sql`

```sql
-- Games table with public share capability
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Share code for parent viewing (no auth required)
    share_code TEXT UNIQUE DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 8),
    
    -- Game details
    opponent TEXT NOT NULL,
    game_type game_type DEFAULT 'game',
    game_date DATE DEFAULT CURRENT_DATE,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    is_home BOOLEAN DEFAULT true,
    location TEXT,
    
    -- Game configuration
    field_size INTEGER DEFAULT 80,
    special_teams_counts BOOLEAN DEFAULT true,
    
    -- Game state (for quick resume)
    status game_status DEFAULT 'scheduled',
    current_quarter INTEGER DEFAULT 1 CHECK (current_quarter BETWEEN 1 AND 5), -- 1-4 + OT
    current_down INTEGER CHECK (current_down BETWEEN 1 AND 4),
    current_distance INTEGER,
    field_position INTEGER CHECK (field_position BETWEEN -50 AND 50), -- -50 = own endzone, 50 = opponent endzone
    possession play_type,
    time_remaining TEXT, -- Store as text for flexibility
    
    -- Scores
    our_score INTEGER DEFAULT 0,
    opponent_score INTEGER DEFAULT 0,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game roster with attendance and game-specific MPR
CREATE TABLE game_rosters (
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    
    -- Attendance tracking
    is_present BOOLEAN DEFAULT true,
    arrival_time TIMESTAMPTZ, -- For late arrival MPR deduction
    departure_time TIMESTAMPTZ, -- For early departure/injury
    
    -- Game-specific MPR override
    mpr_override INTEGER,
    mpr_override_reason TEXT,
    
    -- Denormalized game statistics (updated in real-time)
    play_count INTEGER DEFAULT 0,
    offensive_plays INTEGER DEFAULT 0,
    defensive_plays INTEGER DEFAULT 0,
    special_teams_plays INTEGER DEFAULT 0,
    qb_plays INTEGER DEFAULT 0,
    
    -- Penalty tracking (counts for MPR but tracked separately)
    penalty_plays INTEGER DEFAULT 0,
    
    -- Additional stats
    touchdowns INTEGER DEFAULT 0,
    tackles INTEGER DEFAULT 0,
    
    PRIMARY KEY (game_id, player_id)
);

-- Lineup presets for quick substitutions
CREATE TABLE lineup_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    lineup_type play_type NOT NULL,
    player_ids UUID[] NOT NULL, -- Array of player IDs
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_lineup_name UNIQUE(team_id, name)
);

-- Create indexes for game tables
CREATE INDEX idx_games_team_date ON games(team_id, game_date DESC);
CREATE INDEX idx_games_share_code ON games(share_code) WHERE share_code IS NOT NULL;
CREATE INDEX idx_games_status ON games(status) WHERE status = 'active';
CREATE INDEX idx_game_rosters_game ON game_rosters(game_id);
CREATE INDEX idx_game_rosters_player ON game_rosters(player_id);
CREATE INDEX idx_lineup_presets_team ON lineup_presets(team_id);

-- Apply update triggers
CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lineup_presets_updated_at
    BEFORE UPDATE ON lineup_presets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Migration 003: Play Tracking with JSONB
**File:** `/supabase/migrations/003_play_tracking.sql`

```sql
-- Plays stored as JSONB for maximum flexibility and performance
CREATE TABLE plays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    
    -- Play identification
    play_number INTEGER NOT NULL,
    quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 5),
    game_clock TEXT, -- Flexible format (e.g., "2:35")
    
    -- Play type
    play_type play_type NOT NULL,
    
    -- JSONB data for maximum flexibility
    play_data JSONB NOT NULL DEFAULT '{}',
    /* 
    Example play_data structure:
    {
        "formation": "I-Formation",
        "down": 1,
        "distance": 10,
        "field_position": 35,
        "hash": "left", // left, middle, right
        
        "players_on_field": ["uuid1", "uuid2", ...], // 11 players max
        
        // Offensive play data
        "qb_id": "uuid",
        "play_call": "run", // run, pass, qb_keep
        "ball_carrier_id": "uuid",
        "receiver_id": "uuid",
        "yards_gained": 7,
        "pass_complete": true,
        "result": "first_down", // touchdown, turnover, safety, etc.
        
        // Defensive play data
        "tackles": ["uuid1", "uuid2"], // Multiple tacklers
        "sacks": ["uuid3"],
        "interception_by": "uuid",
        "fumble_recovery_by": "uuid",
        "pass_defended_by": ["uuid"],
        
        // Special teams data
        "kicker_id": "uuid",
        "returner_id": "uuid",
        "kick_type": "punt", // punt, field_goal, kickoff
        "kick_result": "good", // good, missed, blocked
        
        // Penalty data
        "penalty": true,
        "penalty_on": "uuid", // Player who committed penalty
        "penalty_type": "holding",
        "penalty_yards": 10,
        "penalty_declined": false,
        
        // Notes
        "note": "Great defensive stand on 3rd down"
    }
    */
    
    -- Optimistic locking for conflict resolution
    version INTEGER DEFAULT 1,
    
    -- Offline sync support
    client_id TEXT, -- Client-generated ID for deduplication
    device_id TEXT, -- Device that created the play
    synced_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT unique_play_number UNIQUE(game_id, play_number),
    CONSTRAINT unique_client_id UNIQUE(game_id, client_id)
);

-- GIN index for JSONB queries (extremely fast)
CREATE INDEX idx_plays_data ON plays USING GIN (play_data);
CREATE INDEX idx_plays_game_number ON plays(game_id, play_number);
CREATE INDEX idx_plays_qb ON plays((play_data->>'qb_id')) WHERE play_data ? 'qb_id';
CREATE INDEX idx_plays_unsynced ON plays(game_id, created_at) WHERE synced_at IS NULL;

-- Apply update trigger
CREATE TRIGGER update_plays_updated_at
    BEFORE UPDATE ON plays
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Migration 004: Offline Sync Infrastructure
**File:** `/supabase/migrations/004_offline_sync.sql`

```sql
-- Sync queue for resilient offline data capture
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    team_id UUID REFERENCES teams(id),
    
    -- Operation details
    operation_type TEXT NOT NULL, -- 'create_play', 'update_play', 'delete_play', 'update_roster'
    target_table TEXT NOT NULL,
    target_id UUID,
    
    -- Payload
    payload JSONB NOT NULL,
    
    -- Processing status
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_operation CHECK (operation_type IN ('create_play', 'update_play', 'delete_play', 'update_roster'))
);

-- Share codes for parent access (separate table for flexibility)
CREATE TABLE share_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Access control
    access_type TEXT DEFAULT 'read', -- 'read', 'stats_only'
    expires_at TIMESTAMPTZ,
    max_uses INTEGER,
    use_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    CONSTRAINT code_length CHECK (length(code) >= 6)
);

-- Device registration for offline sync
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    team_id UUID REFERENCES teams(id),
    
    -- Device info
    device_name TEXT,
    device_type TEXT, -- 'ios', 'android', 'web'
    app_version TEXT,
    
    -- Sync status
    last_sync_at TIMESTAMPTZ,
    pending_sync_count INTEGER DEFAULT 0,
    
    -- Metadata
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for sync tables
CREATE INDEX idx_sync_queue_device_pending ON sync_queue(device_id, created_at) 
    WHERE status = 'pending';
CREATE INDEX idx_sync_queue_failed ON sync_queue(device_id) 
    WHERE status = 'failed' AND retry_count < max_retries;
CREATE INDEX idx_share_codes_game ON share_codes(game_id) WHERE expires_at IS NULL OR expires_at > NOW();
CREATE INDEX idx_share_codes_code ON share_codes(code);
CREATE INDEX idx_devices_user ON devices(user_id);
CREATE INDEX idx_devices_team ON devices(team_id);
```

### Migration 005: Materialized Views for Performance
**File:** `/supabase/migrations/005_materialized_views.sql`

```sql
-- Real-time MPR dashboard view (refreshed after each play)
CREATE MATERIALIZED VIEW mpr_dashboard AS
SELECT 
    gr.game_id,
    g.team_id,
    gr.player_id,
    p.jersey_number,
    p.name,
    p.position,
    p.is_striped,
    
    -- MPR calculation
    COALESCE(gr.mpr_override, p.mpr_requirement, 8) as mpr_requirement,
    gr.play_count,
    gr.offensive_plays,
    gr.defensive_plays,
    gr.special_teams_plays,
    gr.penalty_plays,
    
    -- MPR status calculation
    CASE 
        WHEN gr.play_count >= COALESCE(gr.mpr_override, p.mpr_requirement, 8) THEN 'met'
        WHEN gr.play_count >= (COALESCE(gr.mpr_override, p.mpr_requirement, 8) * 0.75) THEN 'close'
        WHEN gr.play_count >= (COALESCE(gr.mpr_override, p.mpr_requirement, 8) * 0.5) THEN 'progress'
        ELSE 'needs_plays'
    END as mpr_status,
    
    -- Plays needed
    GREATEST(0, COALESCE(gr.mpr_override, p.mpr_requirement, 8) - gr.play_count) as plays_needed,
    
    -- Additional info
    gr.is_present,
    gr.arrival_time,
    p.status as player_status
    
FROM game_rosters gr
JOIN players p ON p.id = gr.player_id
JOIN games g ON g.id = gr.game_id
WHERE gr.is_present = true;

CREATE UNIQUE INDEX ON mpr_dashboard (game_id, player_id);
CREATE INDEX idx_mpr_dashboard_status ON mpr_dashboard(game_id, mpr_status);
CREATE INDEX idx_mpr_dashboard_needs ON mpr_dashboard(game_id, plays_needed DESC);

-- Season statistics view
CREATE MATERIALIZED VIEW season_stats AS
SELECT 
    p.id as player_id,
    p.team_id,
    p.jersey_number,
    p.name,
    p.position,
    
    -- Game participation
    COUNT(DISTINCT g.id) FILTER (WHERE gr.is_present) as games_played,
    COUNT(DISTINCT g.id) FILTER (WHERE g.game_type = 'game') as regular_games,
    COUNT(DISTINCT g.id) FILTER (WHERE g.game_type = 'practice') as practices,
    
    -- Play statistics
    COALESCE(SUM(gr.play_count), 0) as total_plays,
    COALESCE(SUM(gr.offensive_plays), 0) as offensive_plays,
    COALESCE(SUM(gr.defensive_plays), 0) as defensive_plays,
    COALESCE(SUM(gr.special_teams_plays), 0) as special_teams_plays,
    COALESCE(SUM(gr.qb_plays), 0) as qb_plays,
    
    -- Performance metrics
    COALESCE(SUM(gr.touchdowns), 0) as touchdowns,
    COALESCE(SUM(gr.tackles), 0) as tackles,
    
    -- Averages
    CASE 
        WHEN COUNT(DISTINCT g.id) FILTER (WHERE gr.is_present) > 0
        THEN ROUND(AVG(gr.play_count) FILTER (WHERE gr.is_present), 1)
        ELSE 0
    END as avg_plays_per_game,
    
    -- MPR compliance
    COUNT(DISTINCT g.id) FILTER (
        WHERE gr.play_count >= COALESCE(gr.mpr_override, p.mpr_requirement, 8)
    ) as games_met_mpr
    
FROM players p
LEFT JOIN game_rosters gr ON gr.player_id = p.id
LEFT JOIN games g ON g.id = gr.game_id AND g.status = 'completed'
WHERE p.status != 'inactive'
GROUP BY p.id, p.team_id, p.jersey_number, p.name, p.position;

CREATE UNIQUE INDEX ON season_stats (player_id);
CREATE INDEX idx_season_stats_team ON season_stats(team_id);

-- Team game summary view
CREATE MATERIALIZED VIEW team_game_summary AS
SELECT 
    g.id as game_id,
    g.team_id,
    g.opponent,
    g.game_date,
    g.game_type,
    g.status,
    g.our_score,
    g.opponent_score,
    
    -- Player counts
    COUNT(DISTINCT gr.player_id) FILTER (WHERE gr.is_present) as players_present,
    COUNT(DISTINCT gr.player_id) FILTER (WHERE gr.play_count > 0) as players_played,
    
    -- MPR compliance
    COUNT(DISTINCT gr.player_id) FILTER (
        WHERE gr.play_count >= COALESCE(gr.mpr_override, 8)
    ) as players_met_mpr,
    
    -- Play counts
    COUNT(DISTINCT p.id) as total_plays,
    COUNT(DISTINCT p.id) FILTER (WHERE p.play_type = 'offense') as offensive_plays,
    COUNT(DISTINCT p.id) FILTER (WHERE p.play_type = 'defense') as defensive_plays,
    
    -- Last activity
    MAX(p.created_at) as last_play_at
    
FROM games g
LEFT JOIN game_rosters gr ON gr.game_id = g.id
LEFT JOIN plays p ON p.game_id = g.id
GROUP BY g.id, g.team_id, g.opponent, g.game_date, g.game_type, g.status, g.our_score, g.opponent_score;

CREATE UNIQUE INDEX ON team_game_summary (game_id);
CREATE INDEX idx_team_game_summary_team ON team_game_summary(team_id, game_date DESC);
```

### Migration 006: Database Functions
**File:** `/supabase/migrations/006_database_functions.sql`

```sql
-- Function to record a play and update all statistics atomically
CREATE OR REPLACE FUNCTION record_play(
    p_game_id UUID,
    p_play_data JSONB,
    p_client_id TEXT DEFAULT NULL,
    p_device_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_play_id UUID;
    v_play_number INTEGER;
    v_player_ids UUID[];
    v_qb_id UUID;
    v_player_id UUID;
    v_play_type TEXT;
BEGIN
    -- Check for duplicate submission (idempotent)
    IF p_client_id IS NOT NULL THEN
        SELECT id INTO v_play_id 
        FROM plays 
        WHERE game_id = p_game_id AND client_id = p_client_id;
        
        IF v_play_id IS NOT NULL THEN
            RETURN v_play_id; -- Return existing play ID
        END IF;
    END IF;
    
    -- Get next play number
    SELECT COALESCE(MAX(play_number), 0) + 1 INTO v_play_number
    FROM plays
    WHERE game_id = p_game_id;
    
    -- Extract play type
    v_play_type := p_play_data->>'play_type';
    
    -- Insert the play
    INSERT INTO plays (
        game_id, 
        play_number, 
        quarter,
        game_clock,
        play_type,
        play_data, 
        client_id,
        device_id
    )
    VALUES (
        p_game_id, 
        v_play_number,
        (p_play_data->>'quarter')::INTEGER,
        p_play_data->>'game_clock',
        v_play_type::play_type,
        p_play_data, 
        p_client_id,
        p_device_id
    )
    RETURNING id INTO v_play_id;
    
    -- Extract player data from JSONB
    v_player_ids := ARRAY(
        SELECT jsonb_array_elements_text(p_play_data->'players_on_field')::UUID
    );
    
    -- Update play counts for all players on field
    UPDATE game_rosters
    SET 
        play_count = play_count + 1,
        offensive_plays = offensive_plays + 
            CASE WHEN v_play_type = 'offense' THEN 1 ELSE 0 END,
        defensive_plays = defensive_plays + 
            CASE WHEN v_play_type = 'defense' THEN 1 ELSE 0 END,
        special_teams_plays = special_teams_plays + 
            CASE WHEN v_play_type = 'special' THEN 1 ELSE 0 END,
        penalty_plays = penalty_plays +
            CASE WHEN (p_play_data->>'penalty')::BOOLEAN THEN 1 ELSE 0 END
    WHERE game_id = p_game_id 
        AND player_id = ANY(v_player_ids);
    
    -- Update QB plays if applicable
    IF p_play_data ? 'qb_id' THEN
        v_qb_id := (p_play_data->>'qb_id')::UUID;
        UPDATE game_rosters
        SET qb_plays = qb_plays + 1
        WHERE game_id = p_game_id AND player_id = v_qb_id;
    END IF;
    
    -- Update touchdowns
    IF p_play_data->>'result' = 'touchdown' AND p_play_data ? 'ball_carrier_id' THEN
        UPDATE game_rosters
        SET touchdowns = touchdowns + 1
        WHERE game_id = p_game_id 
            AND player_id = (p_play_data->>'ball_carrier_id')::UUID;
    END IF;
    
    -- Update tackles
    IF p_play_data ? 'tackles' THEN
        FOR v_player_id IN 
            SELECT jsonb_array_elements_text(p_play_data->'tackles')::UUID
        LOOP
            UPDATE game_rosters
            SET tackles = tackles + 1
            WHERE game_id = p_game_id AND player_id = v_player_id;
        END LOOP;
    END IF;
    
    -- Update game state
    UPDATE games
    SET 
        current_down = (p_play_data->>'down')::INTEGER,
        current_distance = (p_play_data->>'distance')::INTEGER,
        field_position = (p_play_data->>'field_position')::INTEGER,
        current_quarter = (p_play_data->>'quarter')::INTEGER,
        possession = v_play_type::play_type,
        updated_at = NOW()
    WHERE id = p_game_id;
    
    -- Mark as synced
    UPDATE plays
    SET synced_at = NOW()
    WHERE id = v_play_id;
    
    RETURN v_play_id;
END;
$$ LANGUAGE plpgsql;

-- Function to bulk sync offline plays
CREATE OR REPLACE FUNCTION sync_offline_plays(
    p_device_id TEXT,
    p_plays JSONB[]
) RETURNS TABLE(
    play_id UUID, 
    client_id TEXT,
    status TEXT,
    error_message TEXT
) AS $$
DECLARE
    v_play JSONB;
    v_play_id UUID;
    v_client_id TEXT;
    v_error TEXT;
BEGIN
    FOR v_play IN SELECT unnest(p_plays) LOOP
        BEGIN
            v_client_id := v_play->>'client_id';
            
            v_play_id := record_play(
                (v_play->>'game_id')::UUID,
                v_play->'play_data',
                v_client_id,
                p_device_id
            );
            
            RETURN QUERY SELECT v_play_id, v_client_id, 'success'::TEXT, NULL::TEXT;
            
        EXCEPTION WHEN OTHERS THEN
            v_error := SQLERRM;
            
            -- Log to sync queue for retry
            INSERT INTO sync_queue (
                device_id, 
                operation_type, 
                target_table, 
                payload, 
                error_message,
                status
            )
            VALUES (
                p_device_id, 
                'create_play', 
                'plays', 
                v_play, 
                v_error,
                'failed'
            );
            
            RETURN QUERY SELECT NULL::UUID, v_client_id, 'failed'::TEXT, v_error;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh MPR dashboard for a game
CREATE OR REPLACE FUNCTION refresh_mpr_dashboard(p_game_id UUID)
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mpr_dashboard;
END;
$$ LANGUAGE plpgsql;

-- Function to get share code URL
CREATE OR REPLACE FUNCTION get_share_url(p_game_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_share_code TEXT;
BEGIN
    SELECT share_code INTO v_share_code
    FROM games
    WHERE id = p_game_id;
    
    -- Return the public URL format
    RETURN 'https://cfl-tracker.com/view/' || v_share_code;
END;
$$ LANGUAGE plpgsql;

-- Function to validate lineup
CREATE OR REPLACE FUNCTION validate_lineup(p_player_ids UUID[])
RETURNS BOOLEAN AS $$
BEGIN
    -- Check for maximum 11 players
    IF array_length(p_player_ids, 1) > 11 THEN
        RAISE EXCEPTION 'Lineup cannot have more than 11 players';
    END IF;
    
    -- Check for duplicates
    IF array_length(p_player_ids, 1) != array_length(ARRAY(SELECT DISTINCT unnest(p_player_ids)), 1) THEN
        RAISE EXCEPTION 'Lineup contains duplicate players';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### Migration 007: Seed Data for Testing
**File:** `/supabase/migrations/007_seed_data.sql`

```sql
-- Only run in development/testing environments
DO $$
BEGIN
    -- Check if we're in development (customize this check as needed)
    IF current_database() != 'postgres' OR current_setting('app.environment', true) != 'production' THEN
        
        -- Insert test team
        INSERT INTO teams (id, name, season, age_group, mpr_requirement)
        VALUES 
            ('11111111-1111-1111-1111-111111111111', 'Cobb County Thunder', '2025', 'U12', 8),
            ('22222222-2222-2222-2222-222222222222', 'North Cobb Warriors', '2025', 'U12', 8);
        
        -- Insert test players for team 1
        INSERT INTO players (team_id, jersey_number, name, position, is_striped)
        VALUES 
            ('11111111-1111-1111-1111-111111111111', 1, 'Johnny Smith', 'QB', false),
            ('11111111-1111-1111-1111-111111111111', 7, 'Mike Johnson', 'RB', false),
            ('11111111-1111-1111-1111-111111111111', 12, 'Chris Davis', 'WR', false),
            ('11111111-1111-1111-1111-111111111111', 15, 'David Wilson', 'WR', false),
            ('11111111-1111-1111-1111-111111111111', 22, 'James Brown', 'RB', true), -- Striped player
            ('11111111-1111-1111-1111-111111111111', 33, 'Robert Jones', 'LB', false),
            ('11111111-1111-1111-1111-111111111111', 44, 'William Garcia', 'DL', false),
            ('11111111-1111-1111-1111-111111111111', 55, 'Thomas Martinez', 'OL', false),
            ('11111111-1111-1111-1111-111111111111', 66, 'Charles Rodriguez', 'OL', false),
            ('11111111-1111-1111-1111-111111111111', 77, 'Joseph Lee', 'DL', false),
            ('11111111-1111-1111-1111-111111111111', 88, 'Daniel White', 'TE', false),
            ('11111111-1111-1111-1111-111111111111', 99, 'Matthew Harris', 'DL', false),
            ('11111111-1111-1111-1111-111111111111', 10, 'Anthony Clark', 'QB', false),
            ('11111111-1111-1111-1111-111111111111', 21, 'Mark Lewis', 'DB', false),
            ('11111111-1111-1111-1111-111111111111', 31, 'Paul Walker', 'LB', false),
            ('11111111-1111-1111-1111-111111111111', 41, 'Steven Hall', 'RB', false),
            ('11111111-1111-1111-1111-111111111111', 51, 'Kenneth Allen', 'OL', false),
            ('11111111-1111-1111-1111-111111111111', 61, 'Jason Young', 'OL', false),
            ('11111111-1111-1111-1111-111111111111', 71, 'Ryan King', 'DL', false),
            ('11111111-1111-1111-1111-111111111111', 81, 'Brian Wright', 'WR', false);
        
        -- Insert test game
        INSERT INTO games (
            id, 
            team_id, 
            opponent, 
            game_type, 
            game_date,
            status,
            share_code
        )
        VALUES (
            '33333333-3333-3333-3333-333333333333',
            '11111111-1111-1111-1111-111111111111',
            'South Cobb Eagles',
            'game',
            CURRENT_DATE,
            'scheduled',
            'TEST1234'
        );
        
        -- Create game roster (all players present)
        INSERT INTO game_rosters (game_id, player_id, is_present)
        SELECT 
            '33333333-3333-3333-3333-333333333333',
            id,
            true
        FROM players
        WHERE team_id = '11111111-1111-1111-1111-111111111111';
        
        -- Insert lineup presets
        INSERT INTO lineup_presets (team_id, name, lineup_type, player_ids)
        VALUES (
            '11111111-1111-1111-1111-111111111111',
            'Starting Offense',
            'offense',
            ARRAY(
                SELECT id FROM players 
                WHERE team_id = '11111111-1111-1111-1111-111111111111' 
                AND jersey_number IN (1, 7, 12, 15, 88, 55, 66, 77, 51, 61, 71)
                LIMIT 11
            )::UUID[]
        ),
        (
            '11111111-1111-1111-1111-111111111111',
            'Starting Defense',
            'defense',
            ARRAY(
                SELECT id FROM players 
                WHERE team_id = '11111111-1111-1111-1111-111111111111' 
                AND position IN ('LB', 'DL', 'DB')
                LIMIT 11
            )::UUID[]
        );
        
        RAISE NOTICE 'Seed data inserted successfully';
    END IF;
END $$;
```

---

## Rollback Procedures

### Rollback Script Template
**File:** `/supabase/migrations/rollback_sprint1.sql`

```sql
-- Rollback Sprint 1 migrations in reverse order

-- Drop functions first
DROP FUNCTION IF EXISTS validate_lineup CASCADE;
DROP FUNCTION IF EXISTS get_share_url CASCADE;
DROP FUNCTION IF EXISTS refresh_mpr_dashboard CASCADE;
DROP FUNCTION IF EXISTS sync_offline_plays CASCADE;
DROP FUNCTION IF EXISTS record_play CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Drop materialized views
DROP MATERIALIZED VIEW IF EXISTS team_game_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS season_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mpr_dashboard CASCADE;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS share_codes CASCADE;
DROP TABLE IF EXISTS sync_queue CASCADE;
DROP TABLE IF EXISTS plays CASCADE;
DROP TABLE IF EXISTS lineup_presets CASCADE;
DROP TABLE IF EXISTS game_rosters CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS team_coaches CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS player_status CASCADE;
DROP TYPE IF EXISTS play_type CASCADE;
DROP TYPE IF EXISTS game_type CASCADE;
DROP TYPE IF EXISTS game_status CASCADE;

-- Log rollback completion
DO $$
BEGIN
    RAISE NOTICE 'Sprint 1 rollback completed at %', NOW();
END $$;
```

---

## Performance Considerations

### Index Strategy

1. **Primary Indexes**
   - All foreign keys are indexed automatically
   - Composite indexes for common query patterns
   - GIN index on JSONB for fast play data queries

2. **Query Optimization**
   - Materialized views for expensive aggregations
   - Partial indexes for filtered queries
   - Covering indexes for read-heavy operations

3. **Write Performance**
   - Minimal indexes on high-write tables (plays)
   - Batch inserts for offline sync
   - Async materialized view refresh

### Connection Pooling

```sql
-- Recommended PgBouncer configuration for Supabase
-- Pool Mode: Transaction
-- Default Pool Size: 25
-- Max Client Connections: 100
-- Pool Timeout: 10 seconds
```

### Query Performance Targets

| Query Type | Target Time | Actual (Testing) |
|------------|------------|------------------|
| Record Play | < 100ms | TBD |
| Get MPR Dashboard | < 50ms | TBD |
| Sync 50 Plays | < 500ms | TBD |
| Load Game State | < 200ms | TBD |

---

## Migration Execution Plan

### Day 1: Foundation
1. **Morning (9 AM)**
   - Run migration 001 (initial schema)
   - Verify auth.users integration
   - Test team and player CRUD

2. **Afternoon (2 PM)**
   - Run migration 002 (game management)
   - Test game creation and roster management
   - Verify share code generation

### Day 2: Play Tracking
1. **Morning (9 AM)**
   - Run migration 003 (play tracking)
   - Test JSONB play storage
   - Verify play number sequencing

2. **Afternoon (2 PM)**
   - Run migration 004 (offline sync)
   - Test sync queue operations
   - Verify device registration

### Day 3: Performance & Functions
1. **Morning (9 AM)**
   - Run migration 005 (materialized views)
   - Test MPR dashboard performance
   - Verify statistics calculations

2. **Afternoon (2 PM)**
   - Run migration 006 (database functions)
   - Test record_play function
   - Verify idempotent operations
   - Run migration 007 (seed data) in dev only

---

## Testing Checklist

### Unit Tests
- [ ] Team CRUD operations
- [ ] Player management with unique jerseys
- [ ] Game creation and state management
- [ ] Play recording with JSONB
- [ ] MPR calculations
- [ ] Offline sync queue
- [ ] Share code generation and access

### Integration Tests
- [ ] Record 100 plays rapidly
- [ ] Sync 50 offline plays
- [ ] Concurrent play recording
- [ ] Materialized view refresh
- [ ] Parent read-only access via share code

### Performance Tests
- [ ] 1000 concurrent parent viewers
- [ ] 100 plays per minute recording
- [ ] MPR dashboard with 30 players
- [ ] Offline sync of 500 plays

---

## Security Notes

### Public Data Model
- No RLS policies needed (all data is public)
- Authentication only for coaches (write access)
- Share codes provide read-only access
- No PII in player records (just names and numbers)

### Data Protection
- HTTPS everywhere (enforced by Supabase)
- Encrypted at rest (Supabase default)
- Audit logging via updated_by fields
- Soft deletes for data recovery

---

## Monitoring & Maintenance

### Key Metrics to Track
```sql
-- Active games monitor
SELECT COUNT(*) as active_games
FROM games 
WHERE status = 'active';

-- Sync queue health
SELECT 
    status,
    COUNT(*) as count,
    MAX(retry_count) as max_retries
FROM sync_queue
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY status;

-- Play recording rate
SELECT 
    DATE_TRUNC('minute', created_at) as minute,
    COUNT(*) as plays_recorded
FROM plays
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY 1
ORDER BY 1 DESC;
```

### Maintenance Tasks
1. **Daily**
   - Refresh season statistics view
   - Clean up old sync queue entries

2. **Weekly**
   - Vacuum analyze high-write tables
   - Review slow query logs

3. **Monthly**
   - Archive completed games older than 90 days
   - Update table statistics

---

## Conclusion

This migration plan provides a solid, performant foundation for the CFL Game Tracker with:
- Simple, public data model (no RLS complexity)
- JSONB flexibility for play data
- Robust offline sync capabilities
- Fast MPR dashboard via materialized views
- Idempotent operations for reliability

The pragmatic approach avoids over-engineering while ensuring scalability for thousands of concurrent users during game times.