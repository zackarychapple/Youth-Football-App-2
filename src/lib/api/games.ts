// games.ts
// Game management API - Real-time game tracking with offline support
// Idempotent operations for reliable sync

import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';

export type FieldSize = '40' | '80' | '100';
export type PlayType = 'pass' | 'run' | 'special';
export type PlayResult = 'touchdown' | 'incomplete' | 'interception' | 'completion' | 'sack' | 'penalty';
export type GameStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface StartGameParams {
  teamId: string;
  opponent: string;
  fieldSize?: FieldSize;
  location?: string;
  homeAway?: 'home' | 'away';
}

export interface GameInfo {
  id: string;
  opponent: string;
  fieldSize: FieldSize;
  status: GameStatus;
  startedAt: string;
  playersInitialized: number;
}

export interface PlayData {
  gameId: string;
  playNumber: number;
  quarter: number;
  playType: PlayType;
  result: PlayResult;
  quarterbackId?: string;
  receiverId?: string;
  yards?: number;
  airYards?: number;
  yardsAfterCatch?: number;
  direction?: string;
  route?: string;
  pressure?: boolean;
  dropped?: boolean;
  defendedBy?: string;
  penaltyType?: string;
  penaltyYards?: number;
  notes?: string;
}

export interface ActiveGameData {
  game: {
    id: string;
    opponent: string;
    fieldSize: FieldSize;
    location: string;
    startedAt: string;
    currentQuarter: number;
  };
  stats: {
    totalPlays: number;
    completions: number;
    touchdowns: number;
    interceptions: number;
    byQuarter: Record<string, {
      plays: number;
      touchdowns: number;
    }>;
  };
  recentPlays: Array<{
    playNumber: number;
    quarter: number;
    playType: PlayType;
    result: PlayResult;
    quarterback?: string;
    receiver?: string;
    data: any;
  }>;
  playersPresent: Array<{
    id: string;
    name: string;
    jerseyNumber: number;
    playsParticipated: number;
  }>;
}

export interface GameHistoryItem {
  id: string;
  opponent: string;
  date: string;
  status: GameStatus;
  finalScoreUs?: number;
  finalScoreThem?: number;
  fieldSize: FieldSize;
  totalPlays: number;
  touchdowns: number;
  result?: 'W' | 'L' | 'T';
}

/**
 * Start a new game
 * Creates game and initializes all player participation
 */
export async function startGame(params: StartGameParams): Promise<GameInfo> {
  const { data, error } = await supabase.rpc('start_game', {
    p_team_id: params.teamId,
    p_opponent: params.opponent,
    p_field_size: params.fieldSize || '80',
    p_location: params.location,
    p_home_away: params.homeAway || 'home'
  });

  if (error) {
    console.error('Error starting game:', error);
    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Failed to start game');
  }

  return {
    id: data.game.id,
    opponent: data.game.opponent,
    fieldSize: data.game.field_size,
    status: data.game.status,
    startedAt: data.game.started_at,
    playersInitialized: data.players_initialized
  };
}

/**
 * Record a play with idempotency support
 * Uses client-generated ID to prevent duplicates
 */
export async function recordPlay(play: PlayData) {
  // Generate client ID for idempotency
  const clientId = `${Date.now()}-${uuidv4()}`;
  
  // Prepare play data
  const playDataJson: any = {
    client_id: clientId
  };
  
  // Add optional fields to play_data
  if (play.yards !== undefined) playDataJson.yards = play.yards;
  if (play.airYards !== undefined) playDataJson.air_yards = play.airYards;
  if (play.yardsAfterCatch !== undefined) playDataJson.yards_after_catch = play.yardsAfterCatch;
  if (play.direction) playDataJson.direction = play.direction;
  if (play.route) playDataJson.route = play.route;
  if (play.pressure !== undefined) playDataJson.pressure = play.pressure;
  if (play.dropped !== undefined) playDataJson.dropped = play.dropped;
  if (play.defendedBy) playDataJson.defended_by = play.defendedBy;
  if (play.penaltyType) playDataJson.penalty_type = play.penaltyType;
  if (play.penaltyYards !== undefined) playDataJson.penalty_yards = play.penaltyYards;
  if (play.notes) playDataJson.notes = play.notes;

  const { data, error } = await supabase.rpc('record_play', {
    p_game_id: play.gameId,
    p_client_id: clientId,
    p_play_number: play.playNumber,
    p_quarter: play.quarter,
    p_play_type: play.playType,
    p_result: play.result,
    p_quarterback_id: play.quarterbackId,
    p_receiver_id: play.receiverId,
    p_play_data: playDataJson
  });

  if (error) {
    console.error('Error recording play:', error);
    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Failed to record play');
  }

  return {
    playId: data.play_id,
    playNumber: data.play_number,
    idempotent: data.idempotent,
    message: data.message
  };
}

/**
 * End a game and record final score
 */
export async function endGame(
  gameId: string, 
  finalScoreUs: number, 
  finalScoreThem: number,
  notes?: string
) {
  const { data, error } = await supabase.rpc('end_game', {
    p_game_id: gameId,
    p_final_score_us: finalScoreUs,
    p_final_score_them: finalScoreThem,
    p_notes: notes
  });

  if (error) {
    console.error('Error ending game:', error);
    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Failed to end game');
  }

  return {
    game: data.game,
    stats: data.stats
  };
}

/**
 * Get active game with real-time stats
 * For live game dashboard
 */
export async function getActiveGame(teamId: string): Promise<ActiveGameData | null> {
  const { data, error } = await supabase.rpc('get_active_game', {
    p_team_id: teamId
  });

  if (error) {
    console.error('Error fetching active game:', error);
    throw error;
  }

  if (!data?.success) {
    return null;
  }

  // Transform snake_case to camelCase
  return {
    game: {
      id: data.game.id,
      opponent: data.game.opponent,
      fieldSize: data.game.field_size,
      location: data.game.location,
      startedAt: data.game.started_at,
      currentQuarter: data.game.current_quarter
    },
    stats: {
      totalPlays: data.stats.total_plays,
      completions: data.stats.completions,
      touchdowns: data.stats.touchdowns,
      interceptions: data.stats.interceptions,
      byQuarter: data.stats.by_quarter || {}
    },
    recentPlays: data.recent_plays?.map((p: any) => ({
      playNumber: p.play_number,
      quarter: p.quarter,
      playType: p.play_type,
      result: p.result,
      quarterback: p.quarterback,
      receiver: p.receiver,
      data: p.data
    })) || [],
    playersPresent: data.players_present?.map((p: any) => ({
      id: p.id,
      name: p.name,
      jerseyNumber: p.jersey_number,
      playsParticipated: p.plays_participated
    })) || []
  };
}

/**
 * Update player attendance for a game
 * Mark players as present/absent
 */
export async function updateGameAttendance(
  gameId: string,
  playerId: string,
  isPresent: boolean
) {
  const { data, error } = await supabase.rpc('update_game_attendance', {
    p_game_id: gameId,
    p_player_id: playerId,
    p_is_present: isPresent
  });

  if (error) {
    console.error('Error updating attendance:', error);
    throw error;
  }

  if (!data?.success) {
    throw new Error('Failed to update attendance');
  }

  return data;
}

/**
 * Get game history for a team
 * List of past games with stats
 */
export async function getGameHistory(
  teamId: string, 
  limit: number = 10
): Promise<GameHistoryItem[]> {
  const { data, error } = await supabase.rpc('get_game_history', {
    p_team_id: teamId,
    p_limit: limit
  });

  if (error) {
    console.error('Error fetching game history:', error);
    throw error;
  }

  if (!data?.success) {
    return [];
  }

  return data.games?.map((g: any) => ({
    id: g.id,
    opponent: g.opponent,
    date: g.date,
    status: g.status,
    finalScoreUs: g.final_score_us,
    finalScoreThem: g.final_score_them,
    fieldSize: g.field_size,
    totalPlays: g.total_plays,
    touchdowns: g.touchdowns,
    result: g.result
  })) || [];
}

/**
 * Undo the last play in a game
 * For fixing mistakes during the game
 */
export async function undoLastPlay(gameId: string) {
  const { data, error } = await supabase.rpc('undo_last_play', {
    p_game_id: gameId
  });

  if (error) {
    console.error('Error undoing play:', error);
    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.error || 'No plays to undo');
  }

  return data.deleted_play;
}

/**
 * Create a scheduled game
 * For future game planning
 */
export async function scheduleGame(
  teamId: string,
  opponent: string,
  gameDate: string,
  gameTime?: string,
  fieldSize: FieldSize = '80',
  location?: string
) {
  const { data, error } = await supabase
    .from('games')
    .insert({
      team_id: teamId,
      opponent_name: opponent,
      game_date: gameDate,
      game_time: gameTime,
      field_size: fieldSize,
      location,
      status: 'scheduled' as GameStatus
    })
    .select()
    .single();

  if (error) {
    console.error('Error scheduling game:', error);
    throw error;
  }

  return {
    id: data.id,
    opponent: data.opponent_name,
    date: data.game_date,
    time: data.game_time,
    fieldSize: data.field_size,
    location: data.location,
    status: data.status
  };
}

/**
 * Cancel a scheduled game
 */
export async function cancelGame(gameId: string, reason?: string) {
  const { data, error } = await supabase
    .from('games')
    .update({
      status: 'cancelled' as GameStatus,
      notes: reason
    })
    .eq('id', gameId)
    .select()
    .single();

  if (error) {
    console.error('Error cancelling game:', error);
    throw error;
  }

  return {
    id: data.id,
    status: data.status,
    notes: data.notes
  };
}

/**
 * Get upcoming games for a team
 */
export async function getUpcomingGames(teamId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('team_id', teamId)
    .eq('status', 'scheduled')
    .gte('game_date', today)
    .order('game_date')
    .order('game_time');

  if (error) {
    console.error('Error fetching upcoming games:', error);
    throw error;
  }

  return data.map(g => ({
    id: g.id,
    opponent: g.opponent_name,
    date: g.game_date,
    time: g.game_time,
    fieldSize: g.field_size,
    location: g.location,
    status: g.status
  }));
}

/**
 * Update game details
 * For editing scheduled games
 */
export async function updateGame(gameId: string, updates: {
  opponent?: string;
  gameDate?: string;
  gameTime?: string;
  fieldSize?: FieldSize;
  location?: string;
  notes?: string;
}) {
  const updateData: any = {};
  
  if (updates.opponent) updateData.opponent_name = updates.opponent;
  if (updates.gameDate) updateData.game_date = updates.gameDate;
  if (updates.gameTime) updateData.game_time = updates.gameTime;
  if (updates.fieldSize) updateData.field_size = updates.fieldSize;
  if (updates.location) updateData.location = updates.location;
  if (updates.notes) updateData.notes = updates.notes;

  const { data, error } = await supabase
    .from('games')
    .update(updateData)
    .eq('id', gameId)
    .select()
    .single();

  if (error) {
    console.error('Error updating game:', error);
    throw error;
  }

  return {
    id: data.id,
    opponent: data.opponent_name,
    date: data.game_date,
    time: data.game_time,
    fieldSize: data.field_size,
    location: data.location,
    status: data.status
  };
}

/**
 * Get game details with all plays
 * For post-game review
 */
export async function getGameDetails(gameId: string) {
  // Get game info
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (gameError) {
    console.error('Error fetching game:', gameError);
    throw gameError;
  }

  // Get all plays
  const { data: plays, error: playsError } = await supabase
    .from('plays')
    .select(`
      *,
      quarterback:players!quarterback_id(name, jersey_number),
      receiver:players!receiver_id(name, jersey_number)
    `)
    .eq('game_id', gameId)
    .order('play_number');

  if (playsError) {
    console.error('Error fetching plays:', playsError);
    throw playsError;
  }

  return {
    game: {
      id: game.id,
      opponent: game.opponent_name,
      date: game.game_date,
      fieldSize: game.field_size,
      location: game.location,
      status: game.status,
      finalScoreUs: game.final_score_us,
      finalScoreThem: game.final_score_them
    },
    plays: plays.map(p => ({
      playNumber: p.play_number,
      quarter: p.quarter,
      playType: p.play_type,
      result: p.result,
      quarterback: p.quarterback,
      receiver: p.receiver,
      data: p.play_data
    }))
  };
}