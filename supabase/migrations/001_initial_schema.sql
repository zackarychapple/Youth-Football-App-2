-- 001_initial_schema.sql
-- Core tables for Football Tracker app
-- No RLS needed - all data is public within teams

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS for constrained values
CREATE TYPE field_size AS ENUM ('40', '80', '100');
CREATE TYPE play_result AS ENUM ('touchdown', 'incomplete', 'interception', 'completion', 'sack', 'penalty');
CREATE TYPE play_type AS ENUM ('pass', 'run', 'special');
CREATE TYPE game_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');

-- Teams table - Core entity
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    invite_code VARCHAR(20) UNIQUE NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 8)),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    settings JSONB DEFAULT '{"default_field_size": "80", "track_practice": true}'::jsonb,
    
    -- Indexes for performance
    INDEX idx_teams_invite_code ON teams(invite_code),
    INDEX idx_teams_created_at ON teams(created_at DESC)
);

-- Coaches table - Team management
CREATE TABLE coaches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_head_coach BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(team_id, user_id),
    UNIQUE(team_id, email),
    
    -- Indexes
    INDEX idx_coaches_team_id ON coaches(team_id),
    INDEX idx_coaches_user_id ON coaches(user_id)
);

-- Players table - Core player data
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    jersey_number INTEGER NOT NULL,
    is_striped BOOLEAN DEFAULT false,
    position VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    archived_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(team_id, jersey_number),
    CHECK (jersey_number >= 0 AND jersey_number <= 99),
    
    -- Indexes for performance
    INDEX idx_players_team_id ON players(team_id),
    INDEX idx_players_team_jersey ON players(team_id, jersey_number),
    INDEX idx_players_archived ON players(archived_at) WHERE archived_at IS NULL
);

-- Games table - Game tracking
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    opponent_name VARCHAR(255) NOT NULL,
    game_date DATE NOT NULL,
    game_time TIME,
    field_size field_size NOT NULL DEFAULT '80',
    location VARCHAR(255),
    status game_status DEFAULT 'scheduled',
    final_score_us INTEGER,
    final_score_them INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Indexes for performance
    INDEX idx_games_team_id ON games(team_id),
    INDEX idx_games_date ON games(game_date DESC),
    INDEX idx_games_status ON games(status),
    INDEX idx_games_team_date ON games(team_id, game_date DESC)
);

-- Plays table - Core play tracking with flexible JSONB
CREATE TABLE plays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    play_number INTEGER NOT NULL,
    quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    
    -- Core play data
    play_type play_type NOT NULL,
    result play_result NOT NULL,
    
    -- Player references
    quarterback_id UUID REFERENCES players(id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES players(id) ON DELETE SET NULL,
    
    -- Flexible play data in JSONB
    play_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Example structure:
    -- {
    --   "yards": 15,
    --   "air_yards": 12,
    --   "yards_after_catch": 3,
    --   "direction": "left",
    --   "route": "slant",
    --   "pressure": true,
    --   "dropped": false,
    --   "defended_by": "#23",
    --   "penalty_type": "holding",
    --   "penalty_yards": 10
    -- }
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(game_id, play_number),
    CHECK (play_number > 0),
    
    -- Indexes for performance
    INDEX idx_plays_game_id ON plays(game_id),
    INDEX idx_plays_quarterback ON plays(quarterback_id),
    INDEX idx_plays_receiver ON plays(receiver_id),
    INDEX idx_plays_result ON plays(result),
    INDEX idx_plays_game_play_num ON plays(game_id, play_number),
    INDEX idx_plays_play_data ON plays USING GIN (play_data)
);

-- Game participation tracking for MPR calculations
CREATE TABLE game_participation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    plays_participated INTEGER DEFAULT 0,
    is_present BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(game_id, player_id),
    
    -- Indexes
    INDEX idx_participation_game ON game_participation(game_id),
    INDEX idx_participation_player ON game_participation(player_id)
);

-- Practice attendance tracking
CREATE TABLE practices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    practice_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(team_id, practice_date),
    
    -- Indexes
    INDEX idx_practices_team ON practices(team_id),
    INDEX idx_practices_date ON practices(practice_date DESC),
    INDEX idx_practices_team_date ON practices(team_id, practice_date DESC)
);

-- Practice attendance
CREATE TABLE practice_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    is_present BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(practice_id, player_id),
    
    -- Indexes
    INDEX idx_attendance_practice ON practice_attendance(practice_id),
    INDEX idx_attendance_player ON practice_attendance(player_id)
);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to all tables
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plays_updated_at BEFORE UPDATE ON plays
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_participation_updated_at BEFORE UPDATE ON game_participation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practices_updated_at BEFORE UPDATE ON practices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_attendance_updated_at BEFORE UPDATE ON practice_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();