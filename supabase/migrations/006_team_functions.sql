-- 006_team_functions.sql
-- Team management functions - Simple, fast, no RLS complexity
-- Built for coaches who need this working NOW

-- Function to create a team with the head coach
-- Returns the team and coach records
CREATE OR REPLACE FUNCTION create_team_with_coach(
    p_name VARCHAR,
    p_user_id UUID,
    p_coach_email VARCHAR,
    p_coach_name VARCHAR
)
RETURNS JSON AS $$
DECLARE
    v_team_id UUID;
    v_coach_id UUID;
    v_invite_code VARCHAR;
BEGIN
    -- Generate a simple, memorable invite code
    v_invite_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    
    -- Create the team
    INSERT INTO teams (name, invite_code)
    VALUES (p_name, v_invite_code)
    RETURNING id INTO v_team_id;
    
    -- Add the head coach
    INSERT INTO coaches (team_id, user_id, email, name, is_head_coach)
    VALUES (v_team_id, p_user_id, p_coach_email, p_coach_name, true)
    RETURNING id INTO v_coach_id;
    
    -- Return the created records
    RETURN json_build_object(
        'success', true,
        'team', json_build_object(
            'id', v_team_id,
            'name', p_name,
            'invite_code', v_invite_code
        ),
        'coach', json_build_object(
            'id', v_coach_id,
            'team_id', v_team_id,
            'name', p_coach_name,
            'is_head_coach', true
        )
    );
EXCEPTION WHEN OTHERS THEN
    -- Handle errors gracefully
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Function to join a team using invite code
-- Handles both coaches and parent viewers
CREATE OR REPLACE FUNCTION join_team_with_code(
    p_invite_code VARCHAR,
    p_user_id UUID,
    p_name VARCHAR,
    p_email VARCHAR,
    p_role VARCHAR DEFAULT 'assistant' -- 'assistant' or 'viewer'
)
RETURNS JSON AS $$
DECLARE
    v_team_id UUID;
    v_team_name VARCHAR;
    v_coach_id UUID;
    v_existing_coach UUID;
BEGIN
    -- Find the team by invite code
    SELECT id, name INTO v_team_id, v_team_name
    FROM teams
    WHERE UPPER(invite_code) = UPPER(p_invite_code);
    
    IF v_team_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid invite code'
        );
    END IF;
    
    -- Check if already a member
    SELECT id INTO v_existing_coach
    FROM coaches
    WHERE team_id = v_team_id AND user_id = p_user_id;
    
    IF v_existing_coach IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Already a member of this team'
        );
    END IF;
    
    -- Add as coach (viewer role still goes in coaches table, just not head coach)
    INSERT INTO coaches (team_id, user_id, email, name, is_head_coach)
    VALUES (v_team_id, p_user_id, p_email, p_name, false)
    RETURNING id INTO v_coach_id;
    
    RETURN json_build_object(
        'success', true,
        'team', json_build_object(
            'id', v_team_id,
            'name', v_team_name
        ),
        'coach', json_build_object(
            'id', v_coach_id,
            'role', p_role
        )
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get team details with coaches
-- Fast query for dashboard loading
CREATE OR REPLACE FUNCTION get_team_details(p_team_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    WITH team_data AS (
        SELECT 
            t.id,
            t.name,
            t.invite_code,
            t.settings,
            t.created_at,
            (
                SELECT COUNT(*)::int 
                FROM players p 
                WHERE p.team_id = t.id AND p.archived_at IS NULL
            ) as player_count,
            (
                SELECT COUNT(*)::int 
                FROM games g 
                WHERE g.team_id = t.id
            ) as game_count,
            (
                SELECT json_agg(
                    json_build_object(
                        'id', c.id,
                        'name', c.name,
                        'email', c.email,
                        'is_head_coach', c.is_head_coach
                    ) ORDER BY c.is_head_coach DESC, c.name
                )
                FROM coaches c
                WHERE c.team_id = t.id
            ) as coaches
        FROM teams t
        WHERE t.id = p_team_id
    )
    SELECT row_to_json(team_data) INTO v_result FROM team_data;
    
    RETURN COALESCE(v_result, '{"success": false, "error": "Team not found"}'::json);
END;
$$ LANGUAGE plpgsql;

-- Function to get all teams for a user
-- Used for team switcher
CREATE OR REPLACE FUNCTION get_user_teams(p_user_id UUID)
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'success', true,
        'teams', COALESCE(
            (
                SELECT json_agg(
                    json_build_object(
                        'id', t.id,
                        'name', t.name,
                        'invite_code', t.invite_code,
                        'is_head_coach', c.is_head_coach,
                        'player_count', (
                            SELECT COUNT(*)::int 
                            FROM players p 
                            WHERE p.team_id = t.id AND p.archived_at IS NULL
                        ),
                        'active_game', (
                            SELECT json_build_object(
                                'id', g.id,
                                'opponent', g.opponent_name,
                                'status', g.status
                            )
                            FROM games g
                            WHERE g.team_id = t.id 
                                AND g.status = 'active'
                            ORDER BY g.started_at DESC
                            LIMIT 1
                        )
                    ) ORDER BY c.is_head_coach DESC, t.name
                )
                FROM coaches c
                JOIN teams t ON t.id = c.team_id
                WHERE c.user_id = p_user_id
            ),
            '[]'::json
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update team settings
-- Simple key-value updates
CREATE OR REPLACE FUNCTION update_team_settings(
    p_team_id UUID,
    p_settings JSONB
)
RETURNS JSON AS $$
BEGIN
    UPDATE teams
    SET 
        settings = settings || p_settings,
        updated_at = NOW()
    WHERE id = p_team_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Team not found'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'team_id', p_team_id,
        'settings', (SELECT settings FROM teams WHERE id = p_team_id)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to regenerate invite code
-- For security if code is compromised
CREATE OR REPLACE FUNCTION regenerate_invite_code(p_team_id UUID)
RETURNS JSON AS $$
DECLARE
    v_new_code VARCHAR;
BEGIN
    v_new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    
    UPDATE teams
    SET 
        invite_code = v_new_code,
        updated_at = NOW()
    WHERE id = p_team_id
    RETURNING invite_code INTO v_new_code;
    
    IF v_new_code IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Team not found'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'invite_code', v_new_code
    );
END;
$$ LANGUAGE plpgsql;

-- Index for faster team lookups by invite code
CREATE INDEX IF NOT EXISTS idx_teams_invite_code_upper ON teams(UPPER(invite_code));