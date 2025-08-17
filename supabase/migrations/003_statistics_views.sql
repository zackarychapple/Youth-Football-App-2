-- 003_statistics_views.sql
-- Materialized views and functions for MPR and statistics calculations

-- Function to calculate player statistics for a game
CREATE OR REPLACE FUNCTION get_game_player_stats(p_game_id UUID)
RETURNS TABLE (
    player_id UUID,
    player_name VARCHAR,
    jersey_number INTEGER,
    is_striped BOOLEAN,
    completions INTEGER,
    attempts INTEGER,
    completion_percentage NUMERIC,
    touchdowns INTEGER,
    interceptions INTEGER,
    receptions INTEGER,
    targets INTEGER,
    receiving_touchdowns INTEGER,
    drops INTEGER,
    total_plays INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH player_stats AS (
        -- Quarterback stats
        SELECT 
            p.quarterback_id as player_id,
            'qb' as stat_type,
            COUNT(*) FILTER (WHERE p.result = 'completion' OR p.result = 'touchdown') as completions,
            COUNT(*) as attempts,
            COUNT(*) FILTER (WHERE p.result = 'touchdown') as touchdowns,
            COUNT(*) FILTER (WHERE p.result = 'interception') as interceptions,
            0 as receptions,
            0 as targets,
            0 as receiving_touchdowns,
            0 as drops
        FROM plays p
        WHERE p.game_id = p_game_id
            AND p.quarterback_id IS NOT NULL
        GROUP BY p.quarterback_id
        
        UNION ALL
        
        -- Receiver stats
        SELECT 
            p.receiver_id as player_id,
            'wr' as stat_type,
            0 as completions,
            0 as attempts,
            0 as touchdowns,
            0 as interceptions,
            COUNT(*) FILTER (WHERE p.result IN ('completion', 'touchdown')) as receptions,
            COUNT(*) as targets,
            COUNT(*) FILTER (WHERE p.result = 'touchdown') as receiving_touchdowns,
            COUNT(*) FILTER (WHERE p.play_data->>'dropped' = 'true') as drops
        FROM plays p
        WHERE p.game_id = p_game_id
            AND p.receiver_id IS NOT NULL
        GROUP BY p.receiver_id
    ),
    aggregated_stats AS (
        SELECT 
            player_id,
            SUM(completions) as completions,
            SUM(attempts) as attempts,
            SUM(touchdowns) as touchdowns,
            SUM(interceptions) as interceptions,
            SUM(receptions) as receptions,
            SUM(targets) as targets,
            SUM(receiving_touchdowns) as receiving_touchdowns,
            SUM(drops) as drops,
            SUM(attempts) + SUM(targets) as total_plays
        FROM player_stats
        GROUP BY player_id
    )
    SELECT 
        pl.id as player_id,
        pl.name as player_name,
        pl.jersey_number,
        pl.is_striped,
        COALESCE(s.completions, 0) as completions,
        COALESCE(s.attempts, 0) as attempts,
        CASE 
            WHEN COALESCE(s.attempts, 0) > 0 
            THEN ROUND((s.completions::numeric / s.attempts::numeric) * 100, 1)
            ELSE 0
        END as completion_percentage,
        COALESCE(s.touchdowns, 0) as touchdowns,
        COALESCE(s.interceptions, 0) as interceptions,
        COALESCE(s.receptions, 0) as receptions,
        COALESCE(s.targets, 0) as targets,
        COALESCE(s.receiving_touchdowns, 0) as receiving_touchdowns,
        COALESCE(s.drops, 0) as drops,
        COALESCE(s.total_plays, 0) as total_plays
    FROM players pl
    LEFT JOIN aggregated_stats s ON s.player_id = pl.id
    WHERE pl.team_id = (SELECT team_id FROM games WHERE id = p_game_id)
        AND pl.archived_at IS NULL
    ORDER BY pl.jersey_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate MPR for a game
CREATE OR REPLACE FUNCTION calculate_game_mpr(p_game_id UUID)
RETURNS TABLE (
    eligible_players INTEGER,
    total_offensive_plays INTEGER,
    mpr_percentage NUMERIC,
    meets_minimum BOOLEAN,
    details JSON
) AS $$
DECLARE
    v_total_plays INTEGER;
    v_eligible_count INTEGER;
    v_team_id UUID;
BEGIN
    -- Get team_id and total offensive plays
    SELECT team_id, COUNT(*) INTO v_team_id, v_total_plays
    FROM plays
    WHERE game_id = p_game_id
    GROUP BY team_id;
    
    -- Count eligible players (8+ plays)
    SELECT COUNT(*) INTO v_eligible_count
    FROM (
        SELECT 
            COALESCE(quarterback_id, receiver_id) as player_id,
            COUNT(*) as play_count
        FROM plays
        WHERE game_id = p_game_id
        GROUP BY COALESCE(quarterback_id, receiver_id)
        HAVING COUNT(*) >= 8
    ) eligible;
    
    RETURN QUERY
    SELECT 
        v_eligible_count as eligible_players,
        v_total_plays as total_offensive_plays,
        CASE 
            WHEN v_total_plays > 0 
            THEN ROUND((v_eligible_count::numeric / 
                (SELECT COUNT(*) FROM players WHERE team_id = v_team_id AND archived_at IS NULL)::numeric) * 100, 1)
            ELSE 0
        END as mpr_percentage,
        v_eligible_count >= 8 as meets_minimum,
        json_build_object(
            'game_id', p_game_id,
            'team_id', v_team_id,
            'eligible_count', v_eligible_count,
            'total_plays', v_total_plays,
            'timestamp', NOW()
        ) as details;
END;
$$ LANGUAGE plpgsql;

-- Function to get season statistics for a team
CREATE OR REPLACE FUNCTION get_team_season_stats(p_team_id UUID, p_season_start DATE DEFAULT NULL)
RETURNS TABLE (
    games_played INTEGER,
    games_won INTEGER,
    games_lost INTEGER,
    total_touchdowns INTEGER,
    total_interceptions INTEGER,
    avg_mpr NUMERIC,
    top_passer JSON,
    top_receiver JSON
) AS $$
BEGIN
    RETURN QUERY
    WITH game_stats AS (
        SELECT 
            g.id,
            g.final_score_us > g.final_score_them as won,
            COUNT(DISTINCT p.id) as plays,
            COUNT(*) FILTER (WHERE p.result = 'touchdown') as touchdowns,
            COUNT(*) FILTER (WHERE p.result = 'interception') as interceptions
        FROM games g
        LEFT JOIN plays p ON p.game_id = g.id
        WHERE g.team_id = p_team_id
            AND g.status = 'completed'
            AND (p_season_start IS NULL OR g.game_date >= p_season_start)
        GROUP BY g.id, g.final_score_us, g.final_score_them
    ),
    passer_stats AS (
        SELECT 
            pl.id,
            pl.name,
            pl.jersey_number,
            COUNT(*) FILTER (WHERE p.result IN ('completion', 'touchdown')) as completions,
            COUNT(*) as attempts,
            COUNT(*) FILTER (WHERE p.result = 'touchdown') as touchdowns
        FROM plays p
        JOIN games g ON g.id = p.game_id
        JOIN players pl ON pl.id = p.quarterback_id
        WHERE g.team_id = p_team_id
            AND g.status = 'completed'
            AND (p_season_start IS NULL OR g.game_date >= p_season_start)
        GROUP BY pl.id, pl.name, pl.jersey_number
        ORDER BY touchdowns DESC, completions DESC
        LIMIT 1
    ),
    receiver_stats AS (
        SELECT 
            pl.id,
            pl.name,
            pl.jersey_number,
            COUNT(*) FILTER (WHERE p.result IN ('completion', 'touchdown')) as receptions,
            COUNT(*) as targets,
            COUNT(*) FILTER (WHERE p.result = 'touchdown') as touchdowns
        FROM plays p
        JOIN games g ON g.id = p.game_id
        JOIN players pl ON pl.id = p.receiver_id
        WHERE g.team_id = p_team_id
            AND g.status = 'completed'
            AND (p_season_start IS NULL OR g.game_date >= p_season_start)
        GROUP BY pl.id, pl.name, pl.jersey_number
        ORDER BY touchdowns DESC, receptions DESC
        LIMIT 1
    )
    SELECT 
        COUNT(*)::INTEGER as games_played,
        COUNT(*) FILTER (WHERE won)::INTEGER as games_won,
        COUNT(*) FILTER (WHERE NOT won)::INTEGER as games_lost,
        SUM(touchdowns)::INTEGER as total_touchdowns,
        SUM(interceptions)::INTEGER as total_interceptions,
        ROUND(AVG(
            (SELECT COUNT(*) FROM (
                SELECT player_id FROM (
                    SELECT quarterback_id as player_id FROM plays WHERE game_id = gs.id
                    UNION ALL
                    SELECT receiver_id as player_id FROM plays WHERE game_id = gs.id
                ) p
                GROUP BY player_id
                HAVING COUNT(*) >= 8
            ) eligible)::numeric
        ), 1) as avg_mpr,
        (SELECT row_to_json(ps.*) FROM passer_stats ps LIMIT 1) as top_passer,
        (SELECT row_to_json(rs.*) FROM receiver_stats rs LIMIT 1) as top_receiver
    FROM game_stats gs;
END;
$$ LANGUAGE plpgsql;

-- Create index for faster statistics queries
CREATE INDEX IF NOT EXISTS idx_plays_stats ON plays(game_id, quarterback_id, receiver_id, result);