-- 005_offline_sync.sql
-- Offline sync queue and conflict resolution

-- Sync queue for offline operations
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id VARCHAR(255) NOT NULL, -- Unique client identifier for idempotency
    operation_id VARCHAR(255) NOT NULL, -- Client-generated operation ID
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    operation_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
    table_name VARCHAR(50) NOT NULL,
    record_id UUID, -- ID of the record being operated on
    payload JSONB NOT NULL, -- The actual data
    client_timestamp TIMESTAMPTZ NOT NULL, -- When client performed the operation
    server_timestamp TIMESTAMPTZ DEFAULT NOW(), -- When server received it
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'conflict'
    error_message TEXT,
    conflict_resolution JSONB, -- How conflicts were resolved
    retry_count INTEGER DEFAULT 0,
    
    -- Constraints for idempotency
    UNIQUE(client_id, operation_id),
    
    -- Indexes
    INDEX idx_sync_queue_status ON sync_queue(status) WHERE status IN ('pending', 'processing'),
    INDEX idx_sync_queue_team ON sync_queue(team_id),
    INDEX idx_sync_queue_client ON sync_queue(client_id),
    INDEX idx_sync_queue_timestamp ON sync_queue(client_timestamp DESC)
);

-- Sync status tracking per client
CREATE TABLE sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id VARCHAR(255) UNIQUE NOT NULL,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    last_sync_at TIMESTAMPTZ,
    last_successful_sync TIMESTAMPTZ,
    pending_operations INTEGER DEFAULT 0,
    failed_operations INTEGER DEFAULT 0,
    sync_version INTEGER DEFAULT 0, -- Increments with each successful sync
    device_info JSONB, -- Store device/browser info for debugging
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_sync_status_client ON sync_status(client_id),
    INDEX idx_sync_status_team ON sync_status(team_id)
);

-- Function to process sync queue item (idempotent)
CREATE OR REPLACE FUNCTION process_sync_operation(
    p_client_id VARCHAR,
    p_operation_id VARCHAR,
    p_team_id UUID,
    p_user_id UUID,
    p_operation_type VARCHAR,
    p_table_name VARCHAR,
    p_record_id UUID,
    p_payload JSONB,
    p_client_timestamp TIMESTAMPTZ
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
    v_sync_id UUID;
    v_existing_id UUID;
BEGIN
    -- Check for existing operation (idempotency)
    SELECT id INTO v_existing_id
    FROM sync_queue
    WHERE client_id = p_client_id AND operation_id = p_operation_id;
    
    IF v_existing_id IS NOT NULL THEN
        -- Operation already processed, return existing result
        SELECT json_build_object(
            'success', status = 'completed',
            'operation_id', operation_id,
            'record_id', record_id,
            'status', status,
            'message', 'Operation already processed'
        ) INTO v_result
        FROM sync_queue
        WHERE id = v_existing_id;
        
        RETURN v_result;
    END IF;
    
    -- Insert into sync queue
    INSERT INTO sync_queue (
        client_id, operation_id, team_id, user_id, 
        operation_type, table_name, record_id, payload, 
        client_timestamp, status
    ) VALUES (
        p_client_id, p_operation_id, p_team_id, p_user_id,
        p_operation_type, p_table_name, p_record_id, p_payload,
        p_client_timestamp, 'processing'
    ) RETURNING id INTO v_sync_id;
    
    -- Process based on operation type and table
    BEGIN
        CASE p_table_name
            WHEN 'plays' THEN
                v_result := process_play_sync(p_operation_type, p_record_id, p_payload, p_team_id);
            WHEN 'games' THEN
                v_result := process_game_sync(p_operation_type, p_record_id, p_payload, p_team_id);
            WHEN 'players' THEN
                v_result := process_player_sync(p_operation_type, p_record_id, p_payload, p_team_id);
            ELSE
                RAISE EXCEPTION 'Unsupported table for sync: %', p_table_name;
        END CASE;
        
        -- Mark as completed
        UPDATE sync_queue
        SET status = 'completed'
        WHERE id = v_sync_id;
        
    EXCEPTION WHEN OTHERS THEN
        -- Mark as failed
        UPDATE sync_queue
        SET 
            status = 'failed',
            error_message = SQLERRM,
            retry_count = retry_count + 1
        WHERE id = v_sync_id;
        
        v_result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'operation_id', p_operation_id
        );
    END;
    
    -- Update sync status
    INSERT INTO sync_status (client_id, team_id, last_sync_at)
    VALUES (p_client_id, p_team_id, NOW())
    ON CONFLICT (client_id) 
    DO UPDATE SET 
        last_sync_at = NOW(),
        updated_at = NOW();
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to sync plays (handles conflicts)
CREATE OR REPLACE FUNCTION process_play_sync(
    p_operation_type VARCHAR,
    p_record_id UUID,
    p_payload JSONB,
    p_team_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_play_id UUID;
    v_existing_play RECORD;
BEGIN
    CASE p_operation_type
        WHEN 'create' THEN
            -- Check for duplicate play number
            SELECT * INTO v_existing_play
            FROM plays
            WHERE game_id = (p_payload->>'game_id')::uuid
                AND play_number = (p_payload->>'play_number')::integer;
            
            IF v_existing_play.id IS NOT NULL THEN
                -- Conflict: play number already exists
                -- Resolve by incrementing play numbers
                UPDATE plays
                SET play_number = play_number + 1
                WHERE game_id = (p_payload->>'game_id')::uuid
                    AND play_number >= (p_payload->>'play_number')::integer
                ORDER BY play_number DESC;
            END IF;
            
            -- Insert the play
            INSERT INTO plays (
                id,
                game_id,
                team_id,
                play_number,
                quarter,
                play_type,
                result,
                quarterback_id,
                receiver_id,
                play_data,
                notes
            ) VALUES (
                COALESCE(p_record_id, uuid_generate_v4()),
                (p_payload->>'game_id')::uuid,
                p_team_id,
                (p_payload->>'play_number')::integer,
                (p_payload->>'quarter')::integer,
                (p_payload->>'play_type')::play_type,
                (p_payload->>'result')::play_result,
                (p_payload->>'quarterback_id')::uuid,
                (p_payload->>'receiver_id')::uuid,
                COALESCE(p_payload->'play_data', '{}'::jsonb),
                p_payload->>'notes'
            ) RETURNING id INTO v_play_id;
            
            RETURN json_build_object(
                'success', true,
                'record_id', v_play_id,
                'action', 'created'
            );
            
        WHEN 'update' THEN
            UPDATE plays
            SET 
                play_type = COALESCE((p_payload->>'play_type')::play_type, play_type),
                result = COALESCE((p_payload->>'result')::play_result, result),
                quarterback_id = COALESCE((p_payload->>'quarterback_id')::uuid, quarterback_id),
                receiver_id = COALESCE((p_payload->>'receiver_id')::uuid, receiver_id),
                play_data = COALESCE(p_payload->'play_data', play_data),
                notes = COALESCE(p_payload->>'notes', notes),
                updated_at = NOW()
            WHERE id = p_record_id
            RETURNING id INTO v_play_id;
            
            RETURN json_build_object(
                'success', true,
                'record_id', v_play_id,
                'action', 'updated'
            );
            
        WHEN 'delete' THEN
            DELETE FROM plays WHERE id = p_record_id;
            
            RETURN json_build_object(
                'success', true,
                'record_id', p_record_id,
                'action', 'deleted'
            );
            
        ELSE
            RAISE EXCEPTION 'Invalid operation type: %', p_operation_type;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to sync games
CREATE OR REPLACE FUNCTION process_game_sync(
    p_operation_type VARCHAR,
    p_record_id UUID,
    p_payload JSONB,
    p_team_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_game_id UUID;
BEGIN
    CASE p_operation_type
        WHEN 'create' THEN
            INSERT INTO games (
                id,
                team_id,
                opponent_name,
                game_date,
                game_time,
                field_size,
                location,
                status,
                notes
            ) VALUES (
                COALESCE(p_record_id, uuid_generate_v4()),
                p_team_id,
                p_payload->>'opponent_name',
                (p_payload->>'game_date')::date,
                (p_payload->>'game_time')::time,
                COALESCE((p_payload->>'field_size')::field_size, '80'),
                p_payload->>'location',
                COALESCE((p_payload->>'status')::game_status, 'scheduled'),
                p_payload->>'notes'
            ) RETURNING id INTO v_game_id;
            
            RETURN json_build_object(
                'success', true,
                'record_id', v_game_id,
                'action', 'created'
            );
            
        WHEN 'update' THEN
            UPDATE games
            SET 
                opponent_name = COALESCE(p_payload->>'opponent_name', opponent_name),
                game_date = COALESCE((p_payload->>'game_date')::date, game_date),
                game_time = COALESCE((p_payload->>'game_time')::time, game_time),
                field_size = COALESCE((p_payload->>'field_size')::field_size, field_size),
                location = COALESCE(p_payload->>'location', location),
                status = COALESCE((p_payload->>'status')::game_status, status),
                final_score_us = COALESCE((p_payload->>'final_score_us')::integer, final_score_us),
                final_score_them = COALESCE((p_payload->>'final_score_them')::integer, final_score_them),
                notes = COALESCE(p_payload->>'notes', notes),
                updated_at = NOW()
            WHERE id = p_record_id
            RETURNING id INTO v_game_id;
            
            RETURN json_build_object(
                'success', true,
                'record_id', v_game_id,
                'action', 'updated'
            );
            
        ELSE
            RAISE EXCEPTION 'Invalid operation type for games: %', p_operation_type;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to sync players
CREATE OR REPLACE FUNCTION process_player_sync(
    p_operation_type VARCHAR,
    p_record_id UUID,
    p_payload JSONB,
    p_team_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_player_id UUID;
    v_existing_jersey INTEGER;
BEGIN
    CASE p_operation_type
        WHEN 'create' THEN
            -- Check for jersey number conflict
            SELECT jersey_number INTO v_existing_jersey
            FROM players
            WHERE team_id = p_team_id
                AND jersey_number = (p_payload->>'jersey_number')::integer
                AND archived_at IS NULL;
            
            IF v_existing_jersey IS NOT NULL THEN
                RAISE EXCEPTION 'Jersey number % already in use', v_existing_jersey;
            END IF;
            
            INSERT INTO players (
                id,
                team_id,
                name,
                jersey_number,
                is_striped,
                position,
                notes
            ) VALUES (
                COALESCE(p_record_id, uuid_generate_v4()),
                p_team_id,
                p_payload->>'name',
                (p_payload->>'jersey_number')::integer,
                COALESCE((p_payload->>'is_striped')::boolean, false),
                p_payload->>'position',
                p_payload->>'notes'
            ) RETURNING id INTO v_player_id;
            
            RETURN json_build_object(
                'success', true,
                'record_id', v_player_id,
                'action', 'created'
            );
            
        WHEN 'update' THEN
            UPDATE players
            SET 
                name = COALESCE(p_payload->>'name', name),
                jersey_number = COALESCE((p_payload->>'jersey_number')::integer, jersey_number),
                is_striped = COALESCE((p_payload->>'is_striped')::boolean, is_striped),
                position = COALESCE(p_payload->>'position', position),
                notes = COALESCE(p_payload->>'notes', notes),
                updated_at = NOW()
            WHERE id = p_record_id
            RETURNING id INTO v_player_id;
            
            RETURN json_build_object(
                'success', true,
                'record_id', v_player_id,
                'action', 'updated'
            );
            
        WHEN 'delete' THEN
            -- Soft delete
            UPDATE players
            SET archived_at = NOW()
            WHERE id = p_record_id
            RETURNING id INTO v_player_id;
            
            RETURN json_build_object(
                'success', true,
                'record_id', v_player_id,
                'action', 'archived'
            );
            
        ELSE
            RAISE EXCEPTION 'Invalid operation type for players: %', p_operation_type;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to batch sync operations
CREATE OR REPLACE FUNCTION batch_sync_operations(
    p_client_id VARCHAR,
    p_operations JSONB
)
RETURNS JSON AS $$
DECLARE
    v_results JSON[];
    v_operation JSONB;
    v_result JSON;
BEGIN
    -- Process each operation
    FOR v_operation IN SELECT * FROM jsonb_array_elements(p_operations)
    LOOP
        v_result := process_sync_operation(
            p_client_id,
            v_operation->>'operation_id',
            (v_operation->>'team_id')::uuid,
            (v_operation->>'user_id')::uuid,
            v_operation->>'operation_type',
            v_operation->>'table_name',
            (v_operation->>'record_id')::uuid,
            v_operation->'payload',
            (v_operation->>'client_timestamp')::timestamptz
        );
        
        v_results := array_append(v_results, v_result);
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'results', array_to_json(v_results),
        'processed_count', array_length(v_results, 1)
    );
END;
$$ LANGUAGE plpgsql;

-- Cleanup function for old sync records
CREATE OR REPLACE FUNCTION cleanup_sync_queue(p_days_to_keep INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM sync_queue
    WHERE status IN ('completed', 'failed')
        AND server_timestamp < NOW() - (p_days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;