-- 007_player_functions.sql
-- Player management functions - Built for speed on game day
-- No complex permissions, just fast roster operations

-- Function to bulk create players
-- Perfect for initial roster setup or importing from spreadsheet
CREATE OR REPLACE FUNCTION bulk_create_players(
    p_team_id UUID,
    p_players JSONB
)
RETURNS JSON AS $$
DECLARE
    v_player JSONB;
    v_created_count INTEGER := 0;
    v_errors JSONB := '[]'::jsonb;
    v_created_ids UUID[] := '{}';
    v_player_id UUID;
BEGIN
    -- Validate team exists
    IF NOT EXISTS (SELECT 1 FROM teams WHERE id = p_team_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Team not found'
        );
    END IF;
    
    -- Process each player
    FOR v_player IN SELECT * FROM jsonb_array_elements(p_players)
    LOOP
        BEGIN
            -- Check for duplicate jersey number
            IF EXISTS (
                SELECT 1 FROM players 
                WHERE team_id = p_team_id 
                    AND jersey_number = (v_player->>'jersey_number')::integer
                    AND archived_at IS NULL
            ) THEN
                v_errors := v_errors || jsonb_build_object(
                    'player', v_player->>'name',
                    'jersey', v_player->>'jersey_number',
                    'error', 'Jersey number already taken'
                );
                CONTINUE;
            END IF;
            
            -- Insert player
            INSERT INTO players (
                team_id,
                name,
                jersey_number,
                is_striped,
                position,
                notes
            ) VALUES (
                p_team_id,
                v_player->>'name',
                (v_player->>'jersey_number')::integer,
                COALESCE((v_player->>'is_striped')::boolean, false),
                v_player->>'position',
                v_player->>'notes'
            ) RETURNING id INTO v_player_id;
            
            v_created_ids := array_append(v_created_ids, v_player_id);
            v_created_count := v_created_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors || jsonb_build_object(
                'player', v_player->>'name',
                'error', SQLERRM
            );
        END;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'created_count', v_created_count,
        'created_ids', v_created_ids,
        'errors', v_errors,
        'total_requested', jsonb_array_length(p_players)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get team roster with position groups
-- Optimized for game day roster display
CREATE OR REPLACE FUNCTION get_team_roster(
    p_team_id UUID,
    p_include_archived BOOLEAN DEFAULT false
)
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'success', true,
        'team_id', p_team_id,
        'players', COALESCE(
            (
                SELECT json_agg(
                    json_build_object(
                        'id', p.id,
                        'name', p.name,
                        'jersey_number', p.jersey_number,
                        'is_striped', p.is_striped,
                        'position', p.position,
                        'notes', p.notes,
                        'stats', json_build_object(
                            'games_played', (
                                SELECT COUNT(*)::int
                                FROM game_participation gp
                                WHERE gp.player_id = p.id AND gp.is_present = true
                            ),
                            'completions', (
                                SELECT COUNT(*)::int
                                FROM plays pl
                                WHERE pl.receiver_id = p.id 
                                    AND pl.result = 'completion'
                            ),
                            'touchdowns', (
                                SELECT COUNT(*)::int
                                FROM plays pl
                                WHERE pl.receiver_id = p.id 
                                    AND pl.result = 'touchdown'
                            ),
                            'qb_completions', (
                                SELECT COUNT(*)::int
                                FROM plays pl
                                WHERE pl.quarterback_id = p.id 
                                    AND pl.result IN ('completion', 'touchdown')
                            ),
                            'qb_attempts', (
                                SELECT COUNT(*)::int
                                FROM plays pl
                                WHERE pl.quarterback_id = p.id
                            )
                        )
                    ) ORDER BY p.jersey_number
                )
                FROM players p
                WHERE p.team_id = p_team_id
                    AND (p_include_archived OR p.archived_at IS NULL)
            ),
            '[]'::json
        ),
        'position_groups', (
            SELECT json_object_agg(
                COALESCE(position, 'Unassigned'),
                players
            )
            FROM (
                SELECT 
                    COALESCE(position, 'Unassigned') as position,
                    json_agg(
                        json_build_object(
                            'id', id,
                            'name', name,
                            'jersey_number', jersey_number,
                            'is_striped', is_striped
                        ) ORDER BY jersey_number
                    ) as players
                FROM players
                WHERE team_id = p_team_id
                    AND (p_include_archived OR archived_at IS NULL)
                GROUP BY position
            ) grouped
        ),
        'total_count', (
            SELECT COUNT(*)::int
            FROM players
            WHERE team_id = p_team_id
                AND (p_include_archived OR archived_at IS NULL)
        ),
        'striped_count', (
            SELECT COUNT(*)::int
            FROM players
            WHERE team_id = p_team_id
                AND is_striped = true
                AND (p_include_archived OR archived_at IS NULL)
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update player position
-- Quick position changes during practice
CREATE OR REPLACE FUNCTION update_player_position(
    p_player_id UUID,
    p_position VARCHAR,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_player RECORD;
BEGIN
    UPDATE players
    SET 
        position = p_position,
        notes = COALESCE(p_notes, notes),
        updated_at = NOW()
    WHERE id = p_player_id
    RETURNING * INTO v_player;
    
    IF v_player.id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Player not found'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'player', json_build_object(
            'id', v_player.id,
            'name', v_player.name,
            'jersey_number', v_player.jersey_number,
            'position', v_player.position
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to toggle player stripe status
-- For quick MPR tracking
CREATE OR REPLACE FUNCTION toggle_player_stripe(p_player_id UUID)
RETURNS JSON AS $$
DECLARE
    v_new_status BOOLEAN;
    v_player_name VARCHAR;
BEGIN
    UPDATE players
    SET 
        is_striped = NOT is_striped,
        updated_at = NOW()
    WHERE id = p_player_id
    RETURNING is_striped, name INTO v_new_status, v_player_name;
    
    IF v_new_status IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Player not found'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'player_id', p_player_id,
        'player_name', v_player_name,
        'is_striped', v_new_status
    );
END;
$$ LANGUAGE plpgsql;

-- Function to archive/unarchive player
-- Soft delete for roster management
CREATE OR REPLACE FUNCTION archive_player(
    p_player_id UUID,
    p_archive BOOLEAN DEFAULT true
)
RETURNS JSON AS $$
DECLARE
    v_player RECORD;
BEGIN
    UPDATE players
    SET 
        archived_at = CASE 
            WHEN p_archive THEN NOW() 
            ELSE NULL 
        END,
        updated_at = NOW()
    WHERE id = p_player_id
    RETURNING * INTO v_player;
    
    IF v_player.id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Player not found'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'player', json_build_object(
            'id', v_player.id,
            'name', v_player.name,
            'archived', p_archive
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check jersey availability
-- Quick check before adding/editing players
CREATE OR REPLACE FUNCTION check_jersey_available(
    p_team_id UUID,
    p_jersey_number INTEGER,
    p_exclude_player_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 
        FROM players 
        WHERE team_id = p_team_id 
            AND jersey_number = p_jersey_number
            AND archived_at IS NULL
            AND (p_exclude_player_id IS NULL OR id != p_exclude_player_id)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get player stats
-- Detailed stats for player cards
CREATE OR REPLACE FUNCTION get_player_stats(p_player_id UUID)
RETURNS JSON AS $$
DECLARE
    v_stats JSON;
BEGIN
    WITH player_data AS (
        SELECT 
            p.id,
            p.name,
            p.jersey_number,
            p.position,
            p.is_striped,
            p.team_id
        FROM players p
        WHERE p.id = p_player_id
    ),
    receiving_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE result = 'completion') as completions,
            COUNT(*) FILTER (WHERE result = 'touchdown') as touchdowns,
            COUNT(*) FILTER (WHERE result = 'interception') as interceptions,
            COUNT(*) FILTER (WHERE result = 'incomplete') as incompletions,
            COUNT(*) as targets,
            SUM((play_data->>'yards')::int) FILTER (WHERE result IN ('completion', 'touchdown')) as total_yards
        FROM plays
        WHERE receiver_id = p_player_id
    ),
    qb_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE result IN ('completion', 'touchdown')) as completions,
            COUNT(*) FILTER (WHERE result = 'touchdown') as td_passes,
            COUNT(*) FILTER (WHERE result = 'interception') as interceptions,
            COUNT(*) as attempts,
            SUM((play_data->>'yards')::int) FILTER (WHERE result IN ('completion', 'touchdown')) as passing_yards
        FROM plays
        WHERE quarterback_id = p_player_id
    ),
    game_stats AS (
        SELECT 
            COUNT(*) as games_played,
            SUM(plays_participated) as total_plays
        FROM game_participation
        WHERE player_id = p_player_id AND is_present = true
    )
    SELECT json_build_object(
        'player', row_to_json(player_data),
        'receiving', row_to_json(receiving_stats),
        'quarterback', row_to_json(qb_stats),
        'games', row_to_json(game_stats),
        'last_game', (
            SELECT json_build_object(
                'game_id', g.id,
                'opponent', g.opponent_name,
                'date', g.game_date,
                'plays', gp.plays_participated
            )
            FROM game_participation gp
            JOIN games g ON g.id = gp.game_id
            WHERE gp.player_id = p_player_id
            ORDER BY g.game_date DESC
            LIMIT 1
        )
    ) INTO v_stats
    FROM player_data;
    
    RETURN COALESCE(v_stats, json_build_object('error', 'Player not found'));
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_position ON players(team_id, position) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_players_striped ON players(team_id, is_striped) WHERE archived_at IS NULL AND is_striped = true;