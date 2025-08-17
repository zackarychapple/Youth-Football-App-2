-- 008_game_functions.sql
-- Game management functions - Optimized for real-time game tracking
-- Idempotent operations for offline sync support

-- Function to start a new game
-- Creates game and initializes participation records
CREATE OR REPLACE FUNCTION start_game(
    p_team_id UUID,
    p_opponent VARCHAR,
    p_field_size field_size DEFAULT '80',
    p_location VARCHAR DEFAULT NULL,
    p_home_away VARCHAR DEFAULT 'home'
)
RETURNS JSON AS $$
DECLARE
    v_game_id UUID;
    v_active_game_id UUID;
BEGIN
    -- Check for already active game
    SELECT id INTO v_active_game_id
    FROM games
    WHERE team_id = p_team_id AND status = 'active';
    
    IF v_active_game_id IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'A game is already active',
            'active_game_id', v_active_game_id
        );
    END IF;
    
    -- Create the game
    INSERT INTO games (
        team_id,
        opponent_name,
        game_date,
        game_time,
        field_size,
        location,
        status,
        started_at
    ) VALUES (
        p_team_id,
        p_opponent,
        CURRENT_DATE,
        CURRENT_TIME,
        p_field_size,
        COALESCE(p_location, p_home_away || ' field'),
        'active',
        NOW()
    ) RETURNING id INTO v_game_id;
    
    -- Initialize participation records for all active players
    INSERT INTO game_participation (game_id, player_id, is_present)
    SELECT 
        v_game_id,
        p.id,
        true
    FROM players p
    WHERE p.team_id = p_team_id 
        AND p.archived_at IS NULL;
    
    RETURN json_build_object(
        'success', true,
        'game', json_build_object(
            'id', v_game_id,
            'opponent', p_opponent,
            'field_size', p_field_size,
            'status', 'active',
            'started_at', NOW()
        ),
        'players_initialized', (
            SELECT COUNT(*)::int 
            FROM game_participation 
            WHERE game_id = v_game_id
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to record a play (idempotent with client_id)
-- Core function for game tracking
CREATE OR REPLACE FUNCTION record_play(
    p_game_id UUID,
    p_client_id VARCHAR, -- For idempotency
    p_play_number INTEGER,
    p_quarter INTEGER,
    p_play_type play_type,
    p_result play_result,
    p_quarterback_id UUID DEFAULT NULL,
    p_receiver_id UUID DEFAULT NULL,
    p_play_data JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON AS $$
DECLARE
    v_play_id UUID;
    v_existing_play_id UUID;
    v_team_id UUID;
BEGIN
    -- Get team_id from game
    SELECT team_id INTO v_team_id
    FROM games
    WHERE id = p_game_id;
    
    IF v_team_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Game not found'
        );
    END IF;
    
    -- Check for existing play with same client_id (idempotency)
    SELECT id INTO v_existing_play_id
    FROM plays
    WHERE game_id = p_game_id 
        AND play_data->>'client_id' = p_client_id;
    
    IF v_existing_play_id IS NOT NULL THEN
        -- Play already recorded, return existing
        RETURN json_build_object(
            'success', true,
            'play_id', v_existing_play_id,
            'idempotent', true,
            'message', 'Play already recorded'
        );
    END IF;
    
    -- Store client_id in play_data for idempotency
    p_play_data := p_play_data || jsonb_build_object('client_id', p_client_id);
    
    -- Insert the play
    INSERT INTO plays (
        game_id,
        team_id,
        play_number,
        quarter,
        play_type,
        result,
        quarterback_id,
        receiver_id,
        play_data
    ) VALUES (
        p_game_id,
        v_team_id,
        p_play_number,
        p_quarter,
        p_play_type,
        p_result,
        p_quarterback_id,
        p_receiver_id,
        p_play_data
    ) RETURNING id INTO v_play_id;
    
    -- Update participation counts
    IF p_quarterback_id IS NOT NULL THEN
        UPDATE game_participation
        SET plays_participated = plays_participated + 1
        WHERE game_id = p_game_id AND player_id = p_quarterback_id;
    END IF;
    
    IF p_receiver_id IS NOT NULL THEN
        UPDATE game_participation
        SET plays_participated = plays_participated + 1
        WHERE game_id = p_game_id AND player_id = p_receiver_id;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'play_id', v_play_id,
        'play_number', p_play_number,
        'idempotent', false
    );
END;
$$ LANGUAGE plpgsql;

-- Function to end a game
-- Finalizes score and marks complete
CREATE OR REPLACE FUNCTION end_game(
    p_game_id UUID,
    p_final_score_us INTEGER,
    p_final_score_them INTEGER,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_game RECORD;
BEGIN
    UPDATE games
    SET 
        status = 'completed',
        completed_at = NOW(),
        final_score_us = p_final_score_us,
        final_score_them = p_final_score_them,
        notes = COALESCE(p_notes, notes),
        updated_at = NOW()
    WHERE id = p_game_id
    RETURNING * INTO v_game;
    
    IF v_game.id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Game not found'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'game', json_build_object(
            'id', v_game.id,
            'opponent', v_game.opponent_name,
            'final_score_us', v_game.final_score_us,
            'final_score_them', v_game.final_score_them,
            'status', v_game.status,
            'completed_at', v_game.completed_at
        ),
        'stats', json_build_object(
            'total_plays', (
                SELECT COUNT(*)::int 
                FROM plays 
                WHERE game_id = p_game_id
            ),
            'touchdowns', (
                SELECT COUNT(*)::int 
                FROM plays 
                WHERE game_id = p_game_id AND result = 'touchdown'
            ),
            'completions', (
                SELECT COUNT(*)::int 
                FROM plays 
                WHERE game_id = p_game_id AND result = 'completion'
            )
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get active game with current stats
-- Real-time game dashboard data
CREATE OR REPLACE FUNCTION get_active_game(p_team_id UUID)
RETURNS JSON AS $$
DECLARE
    v_game RECORD;
    v_result JSON;
BEGIN
    -- Get active game
    SELECT * INTO v_game
    FROM games
    WHERE team_id = p_team_id AND status = 'active'
    ORDER BY started_at DESC
    LIMIT 1;
    
    IF v_game.id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No active game found'
        );
    END IF;
    
    -- Build comprehensive game data
    SELECT json_build_object(
        'success', true,
        'game', json_build_object(
            'id', v_game.id,
            'opponent', v_game.opponent_name,
            'field_size', v_game.field_size,
            'location', v_game.location,
            'started_at', v_game.started_at,
            'current_quarter', COALESCE(
                (SELECT MAX(quarter) FROM plays WHERE game_id = v_game.id),
                1
            )
        ),
        'stats', json_build_object(
            'total_plays', (
                SELECT COUNT(*)::int FROM plays WHERE game_id = v_game.id
            ),
            'completions', (
                SELECT COUNT(*)::int FROM plays 
                WHERE game_id = v_game.id AND result = 'completion'
            ),
            'touchdowns', (
                SELECT COUNT(*)::int FROM plays 
                WHERE game_id = v_game.id AND result = 'touchdown'
            ),
            'interceptions', (
                SELECT COUNT(*)::int FROM plays 
                WHERE game_id = v_game.id AND result = 'interception'
            ),
            'by_quarter', (
                SELECT json_object_agg(
                    quarter::text,
                    json_build_object(
                        'plays', play_count,
                        'touchdowns', td_count
                    )
                )
                FROM (
                    SELECT 
                        quarter,
                        COUNT(*) as play_count,
                        COUNT(*) FILTER (WHERE result = 'touchdown') as td_count
                    FROM plays
                    WHERE game_id = v_game.id
                    GROUP BY quarter
                ) q
            )
        ),
        'recent_plays', (
            SELECT json_agg(
                json_build_object(
                    'play_number', play_number,
                    'quarter', quarter,
                    'play_type', play_type,
                    'result', result,
                    'quarterback', (SELECT name FROM players WHERE id = quarterback_id),
                    'receiver', (SELECT name FROM players WHERE id = receiver_id),
                    'data', play_data
                ) ORDER BY play_number DESC
            )
            FROM (
                SELECT * FROM plays 
                WHERE game_id = v_game.id 
                ORDER BY play_number DESC 
                LIMIT 10
            ) recent
        ),
        'players_present', (
            SELECT json_agg(
                json_build_object(
                    'id', p.id,
                    'name', p.name,
                    'jersey_number', p.jersey_number,
                    'plays_participated', gp.plays_participated
                ) ORDER BY p.jersey_number
            )
            FROM game_participation gp
            JOIN players p ON p.id = gp.player_id
            WHERE gp.game_id = v_game.id AND gp.is_present = true
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to update player attendance for a game
-- Mark players present/absent
CREATE OR REPLACE FUNCTION update_game_attendance(
    p_game_id UUID,
    p_player_id UUID,
    p_is_present BOOLEAN
)
RETURNS JSON AS $$
BEGIN
    UPDATE game_participation
    SET 
        is_present = p_is_present,
        updated_at = NOW()
    WHERE game_id = p_game_id AND player_id = p_player_id;
    
    IF NOT FOUND THEN
        -- Create participation record if doesn't exist
        INSERT INTO game_participation (game_id, player_id, is_present)
        VALUES (p_game_id, p_player_id, p_is_present);
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'game_id', p_game_id,
        'player_id', p_player_id,
        'is_present', p_is_present
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get game history
-- List of past games with basic stats
CREATE OR REPLACE FUNCTION get_game_history(
    p_team_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'success', true,
        'games', (
            SELECT json_agg(
                json_build_object(
                    'id', g.id,
                    'opponent', g.opponent_name,
                    'date', g.game_date,
                    'status', g.status,
                    'final_score_us', g.final_score_us,
                    'final_score_them', g.final_score_them,
                    'field_size', g.field_size,
                    'total_plays', (
                        SELECT COUNT(*)::int 
                        FROM plays 
                        WHERE game_id = g.id
                    ),
                    'touchdowns', (
                        SELECT COUNT(*)::int 
                        FROM plays 
                        WHERE game_id = g.id AND result = 'touchdown'
                    ),
                    'result', CASE 
                        WHEN g.final_score_us > g.final_score_them THEN 'W'
                        WHEN g.final_score_us < g.final_score_them THEN 'L'
                        WHEN g.final_score_us IS NOT NULL THEN 'T'
                        ELSE NULL
                    END
                ) ORDER BY g.game_date DESC, g.created_at DESC
            )
            FROM games g
            WHERE g.team_id = p_team_id
            ORDER BY g.game_date DESC, g.created_at DESC
            LIMIT p_limit
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to delete/undo last play
-- For fixing mistakes during game
CREATE OR REPLACE FUNCTION undo_last_play(p_game_id UUID)
RETURNS JSON AS $$
DECLARE
    v_deleted_play RECORD;
BEGIN
    -- Delete the last play and return its details
    DELETE FROM plays
    WHERE game_id = p_game_id
        AND play_number = (
            SELECT MAX(play_number) 
            FROM plays 
            WHERE game_id = p_game_id
        )
    RETURNING * INTO v_deleted_play;
    
    IF v_deleted_play.id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No plays to undo'
        );
    END IF;
    
    -- Decrement participation counts
    IF v_deleted_play.quarterback_id IS NOT NULL THEN
        UPDATE game_participation
        SET plays_participated = GREATEST(0, plays_participated - 1)
        WHERE game_id = p_game_id AND player_id = v_deleted_play.quarterback_id;
    END IF;
    
    IF v_deleted_play.receiver_id IS NOT NULL THEN
        UPDATE game_participation
        SET plays_participated = GREATEST(0, plays_participated - 1)
        WHERE game_id = p_game_id AND player_id = v_deleted_play.receiver_id;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'deleted_play', json_build_object(
            'play_number', v_deleted_play.play_number,
            'play_type', v_deleted_play.play_type,
            'result', v_deleted_play.result
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Indexes for game performance
CREATE INDEX IF NOT EXISTS idx_plays_client_id ON plays USING btree ((play_data->>'client_id'));
CREATE INDEX IF NOT EXISTS idx_games_active ON games(team_id, status) WHERE status = 'active';