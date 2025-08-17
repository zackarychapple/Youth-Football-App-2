// database.helpers.ts
// Helper functions for common database operations
// Pragmatic approach - no complex RLS, just clean API-level functions

import { createClient } from '@supabase/supabase-js'
import type { 
  Database, 
  Team, 
  Player, 
  Game, 
  Play, 
  GameStatus,
  PlayData,
  SyncOperation,
  GamePlayerStats 
} from '@/types/database.types'

// Initialize Supabase client
export const supabase = createClient<Database>(
  import.meta.env.PUBLIC_SUPABASE_URL!,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY!
)

// Generate a unique client ID for offline sync
export const getClientId = (): string => {
  const stored = localStorage.getItem('football_tracker_client_id')
  if (stored) return stored
  
  const newId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  localStorage.setItem('football_tracker_client_id', newId)
  return newId
}

// Team Management Helpers
export const teamHelpers = {
  // Create a new team with the user as head coach
  async createTeam(teamName: string, userId: string, email: string, coachName: string) {
    const { data, error } = await supabase.rpc('create_team_with_coach', {
      p_team_name: teamName,
      p_user_id: userId,
      p_email: email,
      p_coach_name: coachName
    })
    
    if (error) throw error
    return data
  },

  // Join a team with invite code
  async joinTeam(inviteCode: string, userId: string, email: string, name: string) {
    const { data, error } = await supabase.rpc('join_team_with_code', {
      p_invite_code: inviteCode,
      p_user_id: userId,
      p_email: email,
      p_name: name
    })
    
    if (error) throw error
    return data
  },

  // Get all teams for a user
  async getUserTeams(userId: string) {
    const { data, error } = await supabase.rpc('get_user_teams', {
      p_user_id: userId
    })
    
    if (error) throw error
    return data
  },

  // Get team details
  async getTeam(teamId: string) {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single()
    
    if (error) throw error
    return data
  },

  // Update team settings
  async updateTeamSettings(teamId: string, settings: Partial<Team['settings']>) {
    const { data, error } = await supabase
      .from('teams')
      .update({ settings })
      .eq('id', teamId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Player Management Helpers
export const playerHelpers = {
  // Get all players for a team
  async getTeamPlayers(teamId: string, includeArchived = false) {
    let query = supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .order('jersey_number', { ascending: true })
    
    if (!includeArchived) {
      query = query.is('archived_at', null)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data
  },

  // Create a new player
  async createPlayer(player: Omit<Player, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('players')
      .insert(player)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update player
  async updatePlayer(playerId: string, updates: Partial<Player>) {
    const { data, error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', playerId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Archive player (soft delete)
  async archivePlayer(playerId: string) {
    const { data, error } = await supabase
      .from('players')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', playerId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Batch create players
  async createPlayers(teamId: string, players: Array<{ name: string; jersey_number: number; is_striped?: boolean }>) {
    const playersToInsert = players.map(p => ({
      team_id: teamId,
      name: p.name,
      jersey_number: p.jersey_number,
      is_striped: p.is_striped || false
    }))
    
    const { data, error } = await supabase
      .from('players')
      .insert(playersToInsert)
      .select()
    
    if (error) throw error
    return data
  }
}

// Game Management Helpers
export const gameHelpers = {
  // Get games for a team
  async getTeamGames(teamId: string, status?: GameStatus) {
    let query = supabase
      .from('games')
      .select('*')
      .eq('team_id', teamId)
      .order('game_date', { ascending: false })
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data
  },

  // Get active game for team
  async getActiveGame(teamId: string) {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('team_id', teamId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
    return data
  },

  // Create a new game
  async createGame(game: Omit<Game, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('games')
      .insert(game)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Start a game
  async startGame(gameId: string) {
    const { data, error } = await supabase
      .from('games')
      .update({ 
        status: 'active' as GameStatus, 
        started_at: new Date().toISOString() 
      })
      .eq('id', gameId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Complete a game
  async completeGame(gameId: string, scoreUs: number, scoreThem: number) {
    const { data, error } = await supabase
      .from('games')
      .update({ 
        status: 'completed' as GameStatus,
        completed_at: new Date().toISOString(),
        final_score_us: scoreUs,
        final_score_them: scoreThem
      })
      .eq('id', gameId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get game with full details (includes plays and stats)
  async getGameDetails(gameId: string) {
    // Get game info
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single()
    
    if (gameError) throw gameError
    
    // Get plays
    const { data: plays, error: playsError } = await supabase
      .from('plays')
      .select(`
        *,
        quarterback:players!quarterback_id(id, name, jersey_number),
        receiver:players!receiver_id(id, name, jersey_number)
      `)
      .eq('game_id', gameId)
      .order('play_number', { ascending: false })
    
    if (playsError) throw playsError
    
    // Get stats
    const { data: stats, error: statsError } = await supabase.rpc('get_game_player_stats', {
      p_game_id: gameId
    })
    
    if (statsError) throw statsError
    
    // Get MPR
    const { data: mpr, error: mprError } = await supabase.rpc('calculate_game_mpr', {
      p_game_id: gameId
    })
    
    if (mprError) throw mprError
    
    return {
      game,
      plays,
      stats,
      mpr: mpr?.[0]
    }
  }
}

// Play Management Helpers
export const playHelpers = {
  // Add a play to a game
  async addPlay(play: Omit<Play, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('plays')
      .insert(play)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update a play
  async updatePlay(playId: string, updates: Partial<Play>) {
    const { data, error } = await supabase
      .from('plays')
      .update(updates)
      .eq('id', playId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete a play (and renumber subsequent plays)
  async deletePlay(gameId: string, playNumber: number) {
    // Delete the play
    const { error: deleteError } = await supabase
      .from('plays')
      .delete()
      .eq('game_id', gameId)
      .eq('play_number', playNumber)
    
    if (deleteError) throw deleteError
    
    // Renumber subsequent plays
    const { error: updateError } = await supabase.rpc('renumber_plays', {
      p_game_id: gameId,
      p_after_play_number: playNumber
    })
    
    if (updateError) throw updateError
    
    return true
  },

  // Get plays for a game
  async getGamePlays(gameId: string) {
    const { data, error } = await supabase
      .from('plays')
      .select(`
        *,
        quarterback:players!quarterback_id(id, name, jersey_number),
        receiver:players!receiver_id(id, name, jersey_number)
      `)
      .eq('game_id', gameId)
      .order('play_number', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get play count for a game
  async getPlayCount(gameId: string) {
    const { count, error } = await supabase
      .from('plays')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId)
    
    if (error) throw error
    return count || 0
  }
}

// Statistics Helpers
export const statsHelpers = {
  // Get player stats for a game
  async getGamePlayerStats(gameId: string): Promise<GamePlayerStats[]> {
    const { data, error } = await supabase.rpc('get_game_player_stats', {
      p_game_id: gameId
    })
    
    if (error) throw error
    return data || []
  },

  // Get MPR for a game
  async getGameMPR(gameId: string) {
    const { data, error } = await supabase.rpc('calculate_game_mpr', {
      p_game_id: gameId
    })
    
    if (error) throw error
    return data?.[0]
  },

  // Get season stats for a team
  async getSeasonStats(teamId: string, seasonStart?: string) {
    const { data, error } = await supabase.rpc('get_team_season_stats', {
      p_team_id: teamId,
      p_season_start: seasonStart
    })
    
    if (error) throw error
    return data?.[0]
  }
}

// Share Code Helpers (for parent viewing)
export const shareHelpers = {
  // Create a share code
  async createShareCode(teamId: string, userId: string, description?: string, expiresInDays?: number) {
    const { data, error } = await supabase.rpc('create_share_code', {
      p_team_id: teamId,
      p_user_id: userId,
      p_description: description,
      p_expires_in_days: expiresInDays
    })
    
    if (error) throw error
    return data
  },

  // Validate a share code
  async validateShareCode(code: string) {
    const { data, error } = await supabase.rpc('validate_share_code', {
      p_code: code
    })
    
    if (error) throw error
    return data
  },

  // Get public team data via share code
  async getPublicTeamData(code: string) {
    const { data, error } = await supabase.rpc('get_public_team_data', {
      p_code: code
    })
    
    if (error) throw error
    return data
  },

  // Get public game data via share code
  async getPublicGameData(code: string, gameId: string) {
    const { data, error } = await supabase.rpc('get_public_game_data', {
      p_code: code,
      p_game_id: gameId
    })
    
    if (error) throw error
    return data
  },

  // Manage share codes (for coaches)
  async manageShareCodes(teamId: string, userId: string) {
    const { data, error } = await supabase.rpc('manage_share_codes', {
      p_team_id: teamId,
      p_user_id: userId
    })
    
    if (error) throw error
    return data
  },

  // Revoke a share code
  async revokeShareCode(code: string, userId: string) {
    const { data, error } = await supabase.rpc('revoke_share_code', {
      p_code: code,
      p_user_id: userId
    })
    
    if (error) throw error
    return data
  }
}

// Offline Sync Helpers
export const syncHelpers = {
  // Process a single sync operation
  async processSyncOperation(operation: SyncOperation) {
    const { data, error } = await supabase.rpc('process_sync_operation', {
      p_client_id: operation.client_id,
      p_operation_id: operation.operation_id,
      p_team_id: operation.team_id,
      p_user_id: operation.user_id,
      p_operation_type: operation.operation_type,
      p_table_name: operation.table_name,
      p_record_id: operation.record_id,
      p_payload: operation.payload,
      p_client_timestamp: operation.client_timestamp
    })
    
    if (error) throw error
    return data
  },

  // Batch sync operations
  async batchSync(clientId: string, operations: SyncOperation[]) {
    const { data, error } = await supabase.rpc('batch_sync_operations', {
      p_client_id: clientId,
      p_operations: operations
    })
    
    if (error) throw error
    return data
  },

  // Get sync status for client
  async getSyncStatus(clientId: string) {
    const { data, error } = await supabase
      .from('sync_status')
      .select('*')
      .eq('client_id', clientId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }
}

// Real-time subscriptions
export const realtimeHelpers = {
  // Subscribe to game updates
  subscribeToGame(gameId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plays',
          filter: `game_id=eq.${gameId}`
        },
        callback
      )
      .subscribe()
  },

  // Subscribe to team updates
  subscribeToTeam(teamId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`team:${teamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `team_id=eq.${teamId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `team_id=eq.${teamId}`
        },
        callback
      )
      .subscribe()
  }
}

// Practice Management Helpers
export const practiceHelpers = {
  // Create a practice session
  async createPractice(teamId: string, date: string, notes?: string) {
    const { data, error } = await supabase
      .from('practices')
      .insert({
        team_id: teamId,
        practice_date: date,
        notes
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get practices for a team
  async getTeamPractices(teamId: string, limit = 10) {
    const { data, error } = await supabase
      .from('practices')
      .select('*')
      .eq('team_id', teamId)
      .order('practice_date', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  // Record attendance
  async recordAttendance(practiceId: string, attendance: Array<{ player_id: string; is_present: boolean }>) {
    const records = attendance.map(a => ({
      practice_id: practiceId,
      player_id: a.player_id,
      is_present: a.is_present
    }))
    
    const { data, error } = await supabase
      .from('practice_attendance')
      .upsert(records, { onConflict: 'practice_id,player_id' })
      .select()
    
    if (error) throw error
    return data
  },

  // Get attendance for a practice
  async getPracticeAttendance(practiceId: string) {
    const { data, error } = await supabase
      .from('practice_attendance')
      .select(`
        *,
        player:players(id, name, jersey_number)
      `)
      .eq('practice_id', practiceId)
      .order('player.jersey_number', { ascending: true })
    
    if (error) throw error
    return data
  }
}

// Export all helpers as a single object for convenience
export const db = {
  team: teamHelpers,
  player: playerHelpers,
  game: gameHelpers,
  play: playHelpers,
  stats: statsHelpers,
  share: shareHelpers,
  sync: syncHelpers,
  realtime: realtimeHelpers,
  practice: practiceHelpers,
  getClientId
}