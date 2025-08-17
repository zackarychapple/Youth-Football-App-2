-- 002_auth_functions.sql
-- Authentication and authorization helper functions
-- No RLS - using function-based access control

-- Function to join a team with invite code
CREATE OR REPLACE FUNCTION join_team_with_code(
    p_invite_code VARCHAR,
    p_user_id UUID,
    p_email VARCHAR,
    p_name VARCHAR
)
RETURNS UUID AS $$
DECLARE
    v_team_id UUID;
BEGIN
    -- Find team by invite code
    SELECT id INTO v_team_id
    FROM teams
    WHERE UPPER(invite_code) = UPPER(p_invite_code);
    
    IF v_team_id IS NULL THEN
        RAISE EXCEPTION 'Invalid invite code';
    END IF;
    
    -- Insert or update coach record
    INSERT INTO coaches (team_id, user_id, email, name, is_head_coach)
    VALUES (v_team_id, p_user_id, p_email, p_name, false)
    ON CONFLICT (team_id, user_id) 
    DO UPDATE SET 
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = NOW();
    
    RETURN v_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new team (makes creator head coach)
CREATE OR REPLACE FUNCTION create_team_with_coach(
    p_team_name VARCHAR,
    p_user_id UUID,
    p_email VARCHAR,
    p_coach_name VARCHAR
)
RETURNS JSON AS $$
DECLARE
    v_team_id UUID;
    v_invite_code VARCHAR;
BEGIN
    -- Create team
    INSERT INTO teams (name)
    VALUES (p_team_name)
    RETURNING id, invite_code INTO v_team_id, v_invite_code;
    
    -- Add creator as head coach
    INSERT INTO coaches (team_id, user_id, email, name, is_head_coach)
    VALUES (v_team_id, p_user_id, p_email, p_coach_name, true);
    
    -- Return team info
    RETURN json_build_object(
        'team_id', v_team_id,
        'invite_code', v_invite_code,
        'team_name', p_team_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's teams
CREATE OR REPLACE FUNCTION get_user_teams(p_user_id UUID)
RETURNS TABLE (
    team_id UUID,
    team_name VARCHAR,
    invite_code VARCHAR,
    is_head_coach BOOLEAN,
    joined_at TIMESTAMPTZ,
    player_count BIGINT,
    active_game_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as team_id,
        t.name as team_name,
        t.invite_code,
        c.is_head_coach,
        c.created_at as joined_at,
        (SELECT COUNT(*) FROM players p WHERE p.team_id = t.id AND p.archived_at IS NULL) as player_count,
        (SELECT COUNT(*) FROM games g WHERE g.team_id = t.id AND g.status IN ('scheduled', 'active')) as active_game_count
    FROM teams t
    INNER JOIN coaches c ON c.team_id = t.id
    WHERE c.user_id = p_user_id
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is coach of team
CREATE OR REPLACE FUNCTION is_team_coach(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM coaches 
        WHERE user_id = p_user_id AND team_id = p_team_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to regenerate invite code (head coach only)
CREATE OR REPLACE FUNCTION regenerate_invite_code(p_user_id UUID, p_team_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_new_code VARCHAR;
    v_is_head_coach BOOLEAN;
BEGIN
    -- Check if user is head coach
    SELECT is_head_coach INTO v_is_head_coach
    FROM coaches
    WHERE user_id = p_user_id AND team_id = p_team_id;
    
    IF v_is_head_coach IS NULL OR NOT v_is_head_coach THEN
        RAISE EXCEPTION 'Only head coach can regenerate invite code';
    END IF;
    
    -- Generate new code
    v_new_code := upper(substr(md5(random()::text), 1, 8));
    
    -- Update team
    UPDATE teams 
    SET invite_code = v_new_code, updated_at = NOW()
    WHERE id = p_team_id;
    
    RETURN v_new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;