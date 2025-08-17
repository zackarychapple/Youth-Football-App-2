-- 004_share_codes.sql
-- Share codes system for parent/spectator viewing (no auth required)

-- Share codes table for public read-only access
CREATE TABLE share_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    code VARCHAR(12) UNIQUE NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 12)),
    description VARCHAR(255),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    use_count INTEGER DEFAULT 0,
    
    -- Indexes
    INDEX idx_share_codes_code ON share_codes(code) WHERE is_active = true,
    INDEX idx_share_codes_team ON share_codes(team_id),
    INDEX idx_share_codes_expires ON share_codes(expires_at) WHERE expires_at IS NOT NULL
);

-- Function to create a share code
CREATE OR REPLACE FUNCTION create_share_code(
    p_team_id UUID,
    p_user_id UUID,
    p_description VARCHAR DEFAULT NULL,
    p_expires_in_days INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_code VARCHAR;
    v_expires_at TIMESTAMPTZ;
    v_share_id UUID;
BEGIN
    -- Verify user is coach of team
    IF NOT is_team_coach(p_user_id, p_team_id) THEN
        RAISE EXCEPTION 'User is not a coach of this team';
    END IF;
    
    -- Calculate expiration
    IF p_expires_in_days IS NOT NULL THEN
        v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;
    END IF;
    
    -- Generate unique code
    LOOP
        v_code := upper(substr(md5(random()::text), 1, 12));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM share_codes WHERE code = v_code);
    END LOOP;
    
    -- Insert share code
    INSERT INTO share_codes (team_id, code, description, expires_at, created_by)
    VALUES (p_team_id, v_code, p_description, v_expires_at, p_user_id)
    RETURNING id INTO v_share_id;
    
    RETURN json_build_object(
        'share_id', v_share_id,
        'code', v_code,
        'expires_at', v_expires_at,
        'share_url', 'https://app.footballtracker.com/view/' || v_code
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and use share code (public access)
CREATE OR REPLACE FUNCTION validate_share_code(p_code VARCHAR)
RETURNS JSON AS $$
DECLARE
    v_share_record RECORD;
    v_team_info RECORD;
BEGIN
    -- Get share code info
    SELECT * INTO v_share_record
    FROM share_codes
    WHERE UPPER(code) = UPPER(p_code)
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW());
    
    IF v_share_record.id IS NULL THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'Invalid or expired share code'
        );
    END IF;
    
    -- Update usage stats
    UPDATE share_codes
    SET 
        last_used_at = NOW(),
        use_count = use_count + 1
    WHERE id = v_share_record.id;
    
    -- Get team info
    SELECT 
        t.id,
        t.name,
        t.settings,
        (SELECT COUNT(*) FROM players WHERE team_id = t.id AND archived_at IS NULL) as player_count,
        (SELECT COUNT(*) FROM games WHERE team_id = t.id AND status = 'active') as active_games
    INTO v_team_info
    FROM teams t
    WHERE t.id = v_share_record.team_id;
    
    RETURN json_build_object(
        'valid', true,
        'team_id', v_share_record.team_id,
        'team_name', v_team_info.name,
        'player_count', v_team_info.player_count,
        'active_games', v_team_info.active_games,
        'permissions', json_build_object(
            'can_view_roster', true,
            'can_view_games', true,
            'can_view_stats', true,
            'can_edit', false
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get public team data via share code
CREATE OR REPLACE FUNCTION get_public_team_data(p_code VARCHAR)
RETURNS JSON AS $$
DECLARE
    v_team_id UUID;
    v_validation JSON;
BEGIN
    -- Validate code first
    v_validation := validate_share_code(p_code);
    
    IF NOT (v_validation->>'valid')::boolean THEN
        RETURN v_validation;
    END IF;
    
    v_team_id := (v_validation->>'team_id')::uuid;
    
    -- Return comprehensive team data
    RETURN json_build_object(
        'team', (
            SELECT row_to_json(t.*)
            FROM teams t
            WHERE t.id = v_team_id
        ),
        'players', (
            SELECT json_agg(row_to_json(p.*))
            FROM players p
            WHERE p.team_id = v_team_id 
                AND p.archived_at IS NULL
            ORDER BY p.jersey_number
        ),
        'current_game', (
            SELECT row_to_json(g.*)
            FROM games g
            WHERE g.team_id = v_team_id 
                AND g.status = 'active'
            ORDER BY g.started_at DESC
            LIMIT 1
        ),
        'upcoming_games', (
            SELECT json_agg(row_to_json(g.*))
            FROM games g
            WHERE g.team_id = v_team_id 
                AND g.status = 'scheduled'
                AND g.game_date >= CURRENT_DATE
            ORDER BY g.game_date, g.game_time
            LIMIT 5
        ),
        'recent_games', (
            SELECT json_agg(row_to_json(g.*))
            FROM games g
            WHERE g.team_id = v_team_id 
                AND g.status = 'completed'
            ORDER BY g.game_date DESC
            LIMIT 5
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get live game data via share code
CREATE OR REPLACE FUNCTION get_public_game_data(p_code VARCHAR, p_game_id UUID)
RETURNS JSON AS $$
DECLARE
    v_team_id UUID;
    v_validation JSON;
BEGIN
    -- Validate code
    v_validation := validate_share_code(p_code);
    
    IF NOT (v_validation->>'valid')::boolean THEN
        RETURN v_validation;
    END IF;
    
    v_team_id := (v_validation->>'team_id')::uuid;
    
    -- Verify game belongs to team
    IF NOT EXISTS (SELECT 1 FROM games WHERE id = p_game_id AND team_id = v_team_id) THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'Game not found or not accessible'
        );
    END IF;
    
    -- Return game data with plays
    RETURN json_build_object(
        'valid', true,
        'game', (
            SELECT row_to_json(g.*)
            FROM games g
            WHERE g.id = p_game_id
        ),
        'plays', (
            SELECT json_agg(
                json_build_object(
                    'play_number', p.play_number,
                    'quarter', p.quarter,
                    'play_type', p.play_type,
                    'result', p.result,
                    'quarterback', (SELECT name || ' #' || jersey_number FROM players WHERE id = p.quarterback_id),
                    'receiver', (SELECT name || ' #' || jersey_number FROM players WHERE id = p.receiver_id),
                    'play_data', p.play_data,
                    'created_at', p.created_at
                ) ORDER BY p.play_number DESC
            )
            FROM plays p
            WHERE p.game_id = p_game_id
        ),
        'stats', get_game_player_stats(p_game_id),
        'mpr', calculate_game_mpr(p_game_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to list and manage share codes (coach only)
CREATE OR REPLACE FUNCTION manage_share_codes(p_team_id UUID, p_user_id UUID)
RETURNS JSON AS $$
BEGIN
    -- Verify user is coach
    IF NOT is_team_coach(p_user_id, p_team_id) THEN
        RAISE EXCEPTION 'User is not a coach of this team';
    END IF;
    
    RETURN json_build_object(
        'active_codes', (
            SELECT json_agg(
                json_build_object(
                    'id', id,
                    'code', code,
                    'description', description,
                    'expires_at', expires_at,
                    'created_at', created_at,
                    'last_used_at', last_used_at,
                    'use_count', use_count,
                    'share_url', 'https://app.footballtracker.com/view/' || code
                )
            )
            FROM share_codes
            WHERE team_id = p_team_id 
                AND is_active = true
                AND (expires_at IS NULL OR expires_at > NOW())
            ORDER BY created_at DESC
        ),
        'expired_codes', (
            SELECT COUNT(*)
            FROM share_codes
            WHERE team_id = p_team_id 
                AND (is_active = false OR expires_at < NOW())
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke a share code
CREATE OR REPLACE FUNCTION revoke_share_code(p_code VARCHAR, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_team_id UUID;
BEGIN
    -- Get team_id from share code
    SELECT team_id INTO v_team_id
    FROM share_codes
    WHERE code = p_code;
    
    IF v_team_id IS NULL THEN
        RAISE EXCEPTION 'Share code not found';
    END IF;
    
    -- Verify user is coach
    IF NOT is_team_coach(p_user_id, v_team_id) THEN
        RAISE EXCEPTION 'User is not authorized to revoke this share code';
    END IF;
    
    -- Deactivate the code
    UPDATE share_codes
    SET is_active = false
    WHERE code = p_code;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;