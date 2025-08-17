// database.types.ts
// Generated TypeScript types from Supabase schema
// This file represents the database schema for type safety

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          name: string
          invite_code: string
          created_at: string
          updated_at: string
          settings: {
            default_field_size?: '40' | '80' | '100'
            track_practice?: boolean
          }
        }
        Insert: {
          id?: string
          name: string
          invite_code?: string
          created_at?: string
          updated_at?: string
          settings?: {
            default_field_size?: '40' | '80' | '100'
            track_practice?: boolean
          }
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          created_at?: string
          updated_at?: string
          settings?: {
            default_field_size?: '40' | '80' | '100'
            track_practice?: boolean
          }
        }
      }
      coaches: {
        Row: {
          id: string
          team_id: string
          user_id: string
          email: string
          name: string
          is_head_coach: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          email: string
          name: string
          is_head_coach?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          email?: string
          name?: string
          is_head_coach?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: string
          team_id: string
          name: string
          jersey_number: number
          is_striped: boolean
          position: string | null
          notes: string | null
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          team_id: string
          name: string
          jersey_number: number
          is_striped?: boolean
          position?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          name?: string
          jersey_number?: number
          is_striped?: boolean
          position?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
      }
      games: {
        Row: {
          id: string
          team_id: string
          opponent_name: string
          game_date: string
          game_time: string | null
          field_size: FieldSize
          location: string | null
          status: GameStatus
          final_score_us: number | null
          final_score_them: number | null
          notes: string | null
          created_at: string
          updated_at: string
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          team_id: string
          opponent_name: string
          game_date: string
          game_time?: string | null
          field_size?: FieldSize
          location?: string | null
          status?: GameStatus
          final_score_us?: number | null
          final_score_them?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          opponent_name?: string
          game_date?: string
          game_time?: string | null
          field_size?: FieldSize
          location?: string | null
          status?: GameStatus
          final_score_us?: number | null
          final_score_them?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
      }
      plays: {
        Row: {
          id: string
          game_id: string
          team_id: string
          play_number: number
          quarter: number
          play_type: PlayType
          result: PlayResult
          quarterback_id: string | null
          receiver_id: string | null
          play_data: PlayData
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          team_id: string
          play_number: number
          quarter: number
          play_type: PlayType
          result: PlayResult
          quarterback_id?: string | null
          receiver_id?: string | null
          play_data?: PlayData
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          team_id?: string
          play_number?: number
          quarter?: number
          play_type?: PlayType
          result?: PlayResult
          quarterback_id?: string | null
          receiver_id?: string | null
          play_data?: PlayData
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      game_participation: {
        Row: {
          id: string
          game_id: string
          player_id: string
          plays_participated: number
          is_present: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          plays_participated?: number
          is_present?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          player_id?: string
          plays_participated?: number
          is_present?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      practices: {
        Row: {
          id: string
          team_id: string
          practice_date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          practice_date: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          practice_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      practice_attendance: {
        Row: {
          id: string
          practice_id: string
          player_id: string
          is_present: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          practice_id: string
          player_id: string
          is_present?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          practice_id?: string
          player_id?: string
          is_present?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      share_codes: {
        Row: {
          id: string
          team_id: string
          code: string
          description: string | null
          expires_at: string | null
          is_active: boolean
          created_by: string
          created_at: string
          last_used_at: string | null
          use_count: number
        }
        Insert: {
          id?: string
          team_id: string
          code?: string
          description?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_by: string
          created_at?: string
          last_used_at?: string | null
          use_count?: number
        }
        Update: {
          id?: string
          team_id?: string
          code?: string
          description?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_by?: string
          created_at?: string
          last_used_at?: string | null
          use_count?: number
        }
      }
      sync_queue: {
        Row: {
          id: string
          client_id: string
          operation_id: string
          team_id: string
          user_id: string
          operation_type: string
          table_name: string
          record_id: string | null
          payload: Json
          client_timestamp: string
          server_timestamp: string
          status: string
          error_message: string | null
          conflict_resolution: Json | null
          retry_count: number
        }
        Insert: {
          id?: string
          client_id: string
          operation_id: string
          team_id: string
          user_id: string
          operation_type: string
          table_name: string
          record_id?: string | null
          payload: Json
          client_timestamp: string
          server_timestamp?: string
          status?: string
          error_message?: string | null
          conflict_resolution?: Json | null
          retry_count?: number
        }
        Update: {
          id?: string
          client_id?: string
          operation_id?: string
          team_id?: string
          user_id?: string
          operation_type?: string
          table_name?: string
          record_id?: string | null
          payload?: Json
          client_timestamp?: string
          server_timestamp?: string
          status?: string
          error_message?: string | null
          conflict_resolution?: Json | null
          retry_count?: number
        }
      }
      sync_status: {
        Row: {
          id: string
          client_id: string
          team_id: string
          last_sync_at: string | null
          last_successful_sync: string | null
          pending_operations: number
          failed_operations: number
          sync_version: number
          device_info: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          team_id: string
          last_sync_at?: string | null
          last_successful_sync?: string | null
          pending_operations?: number
          failed_operations?: number
          sync_version?: number
          device_info?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          team_id?: string
          last_sync_at?: string | null
          last_successful_sync?: string | null
          pending_operations?: number
          failed_operations?: number
          sync_version?: number
          device_info?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      join_team_with_code: {
        Args: {
          p_invite_code: string
          p_user_id: string
          p_email: string
          p_name: string
        }
        Returns: string
      }
      create_team_with_coach: {
        Args: {
          p_team_name: string
          p_user_id: string
          p_email: string
          p_coach_name: string
        }
        Returns: Json
      }
      get_user_teams: {
        Args: {
          p_user_id: string
        }
        Returns: Array<{
          team_id: string
          team_name: string
          invite_code: string
          is_head_coach: boolean
          joined_at: string
          player_count: number
          active_game_count: number
        }>
      }
      is_team_coach: {
        Args: {
          p_user_id: string
          p_team_id: string
        }
        Returns: boolean
      }
      regenerate_invite_code: {
        Args: {
          p_user_id: string
          p_team_id: string
        }
        Returns: string
      }
      get_game_player_stats: {
        Args: {
          p_game_id: string
        }
        Returns: Array<GamePlayerStats>
      }
      calculate_game_mpr: {
        Args: {
          p_game_id: string
        }
        Returns: Array<{
          eligible_players: number
          total_offensive_plays: number
          mpr_percentage: number
          meets_minimum: boolean
          details: Json
        }>
      }
      get_team_season_stats: {
        Args: {
          p_team_id: string
          p_season_start?: string
        }
        Returns: Array<{
          games_played: number
          games_won: number
          games_lost: number
          total_touchdowns: number
          total_interceptions: number
          avg_mpr: number
          top_passer: Json
          top_receiver: Json
        }>
      }
      create_share_code: {
        Args: {
          p_team_id: string
          p_user_id: string
          p_description?: string
          p_expires_in_days?: number
        }
        Returns: Json
      }
      validate_share_code: {
        Args: {
          p_code: string
        }
        Returns: Json
      }
      get_public_team_data: {
        Args: {
          p_code: string
        }
        Returns: Json
      }
      get_public_game_data: {
        Args: {
          p_code: string
          p_game_id: string
        }
        Returns: Json
      }
      manage_share_codes: {
        Args: {
          p_team_id: string
          p_user_id: string
        }
        Returns: Json
      }
      revoke_share_code: {
        Args: {
          p_code: string
          p_user_id: string
        }
        Returns: boolean
      }
      process_sync_operation: {
        Args: {
          p_client_id: string
          p_operation_id: string
          p_team_id: string
          p_user_id: string
          p_operation_type: string
          p_table_name: string
          p_record_id?: string
          p_payload: Json
          p_client_timestamp: string
        }
        Returns: Json
      }
      batch_sync_operations: {
        Args: {
          p_client_id: string
          p_operations: Json
        }
        Returns: Json
      }
      cleanup_sync_queue: {
        Args: {
          p_days_to_keep?: number
        }
        Returns: number
      }
    }
    Enums: {
      field_size: '40' | '80' | '100'
      play_result: 'touchdown' | 'incomplete' | 'interception' | 'completion' | 'sack' | 'penalty'
      play_type: 'pass' | 'run' | 'special'
      game_status: 'scheduled' | 'active' | 'completed' | 'cancelled'
    }
  }
}

// Type aliases for better developer experience
export type FieldSize = Database['public']['Enums']['field_size']
export type PlayResult = Database['public']['Enums']['play_result']
export type PlayType = Database['public']['Enums']['play_type']
export type GameStatus = Database['public']['Enums']['game_status']

// Table type aliases
export type Team = Database['public']['Tables']['teams']['Row']
export type Coach = Database['public']['Tables']['coaches']['Row']
export type Player = Database['public']['Tables']['players']['Row']
export type Game = Database['public']['Tables']['games']['Row']
export type Play = Database['public']['Tables']['plays']['Row']
export type GameParticipation = Database['public']['Tables']['game_participation']['Row']
export type Practice = Database['public']['Tables']['practices']['Row']
export type PracticeAttendance = Database['public']['Tables']['practice_attendance']['Row']
export type ShareCode = Database['public']['Tables']['share_codes']['Row']
export type SyncQueue = Database['public']['Tables']['sync_queue']['Row']
export type SyncStatus = Database['public']['Tables']['sync_status']['Row']

// Insert type aliases
export type TeamInsert = Database['public']['Tables']['teams']['Insert']
export type CoachInsert = Database['public']['Tables']['coaches']['Insert']
export type PlayerInsert = Database['public']['Tables']['players']['Insert']
export type GameInsert = Database['public']['Tables']['games']['Insert']
export type PlayInsert = Database['public']['Tables']['plays']['Insert']

// Update type aliases
export type TeamUpdate = Database['public']['Tables']['teams']['Update']
export type CoachUpdate = Database['public']['Tables']['coaches']['Update']
export type PlayerUpdate = Database['public']['Tables']['players']['Update']
export type GameUpdate = Database['public']['Tables']['games']['Update']
export type PlayUpdate = Database['public']['Tables']['plays']['Update']

// Play data structure
export interface PlayData {
  yards?: number
  air_yards?: number
  yards_after_catch?: number
  direction?: 'left' | 'right' | 'middle'
  route?: string
  pressure?: boolean
  dropped?: boolean
  defended_by?: string
  penalty_type?: string
  penalty_yards?: number
  [key: string]: any // Allow additional fields for flexibility
}

// Game player statistics type
export interface GamePlayerStats {
  player_id: string
  player_name: string
  jersey_number: number
  is_striped: boolean
  completions: number
  attempts: number
  completion_percentage: number
  touchdowns: number
  interceptions: number
  receptions: number
  targets: number
  receiving_touchdowns: number
  drops: number
  total_plays: number
}

// Offline sync operation
export interface SyncOperation {
  client_id: string
  operation_id: string
  team_id: string
  user_id: string
  operation_type: 'create' | 'update' | 'delete'
  table_name: string
  record_id?: string
  payload: Json
  client_timestamp: string
}

// Share code validation result
export interface ShareCodeValidation {
  valid: boolean
  team_id?: string
  team_name?: string
  player_count?: number
  active_games?: number
  permissions?: {
    can_view_roster: boolean
    can_view_games: boolean
    can_view_stats: boolean
    can_edit: boolean
  }
  error?: string
}