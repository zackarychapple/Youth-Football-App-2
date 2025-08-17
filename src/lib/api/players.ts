// players.ts
// Player management API - Built for speed on game day
// Direct Supabase calls, no unnecessary abstractions

import { supabase } from '../supabase';

export interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  isStriped: boolean;
  position?: string;
  notes?: string;
  stats?: PlayerStats;
}

export interface PlayerStats {
  gamesPlayed: number;
  completions: number;
  touchdowns: number;
  qbCompletions: number;
  qbAttempts: number;
}

export interface BulkPlayerData {
  name: string;
  jersey_number: number;
  is_striped?: boolean;
  position?: string;
  notes?: string;
}

export interface TeamRoster {
  players: Player[];
  positionGroups: Record<string, Player[]>;
  totalCount: number;
  stripedCount: number;
}

export interface DetailedPlayerStats {
  player: {
    id: string;
    name: string;
    jerseyNumber: number;
    position?: string;
    isStriped: boolean;
  };
  receiving: {
    completions: number;
    touchdowns: number;
    interceptions: number;
    incompletions: number;
    targets: number;
    totalYards: number;
  };
  quarterback: {
    completions: number;
    tdPasses: number;
    interceptions: number;
    attempts: number;
    passingYards: number;
  };
  games: {
    gamesPlayed: number;
    totalPlays: number;
  };
  lastGame?: {
    gameId: string;
    opponent: string;
    date: string;
    plays: number;
  };
}

/**
 * Add multiple players at once
 * Perfect for initial roster setup or CSV import
 */
export async function bulkCreatePlayers(teamId: string, players: BulkPlayerData[]) {
  const { data, error } = await supabase.rpc('bulk_create_players', {
    p_team_id: teamId,
    p_players: players
  });

  if (error) {
    console.error('Error creating players:', error);
    throw error;
  }

  if (!data?.success && data?.errors?.length > 0) {
    // Partial success - return what worked and what didn't
    console.warn('Some players failed to create:', data.errors);
  }

  return {
    createdCount: data.created_count,
    createdIds: data.created_ids,
    errors: data.errors,
    totalRequested: data.total_requested
  };
}

/**
 * Get full team roster with stats
 * Optimized for game day roster display
 */
export async function getTeamRoster(
  teamId: string, 
  includeArchived: boolean = false
): Promise<TeamRoster> {
  const { data, error } = await supabase.rpc('get_team_roster', {
    p_team_id: teamId,
    p_include_archived: includeArchived
  });

  if (error) {
    console.error('Error fetching roster:', error);
    throw error;
  }

  if (!data?.success) {
    throw new Error('Failed to fetch roster');
  }

  // Transform snake_case to camelCase
  const players = data.players.map((p: any) => ({
    id: p.id,
    name: p.name,
    jerseyNumber: p.jersey_number,
    isStriped: p.is_striped,
    position: p.position,
    notes: p.notes,
    stats: p.stats ? {
      gamesPlayed: p.stats.games_played,
      completions: p.stats.completions,
      touchdowns: p.stats.touchdowns,
      qbCompletions: p.stats.qb_completions,
      qbAttempts: p.stats.qb_attempts
    } : undefined
  }));

  // Transform position groups
  const positionGroups: Record<string, Player[]> = {};
  if (data.position_groups) {
    Object.entries(data.position_groups).forEach(([position, groupPlayers]: [string, any]) => {
      positionGroups[position] = groupPlayers.map((p: any) => ({
        id: p.id,
        name: p.name,
        jerseyNumber: p.jersey_number,
        isStriped: p.is_striped,
        position
      }));
    });
  }

  return {
    players,
    positionGroups,
    totalCount: data.total_count,
    stripedCount: data.striped_count
  };
}

/**
 * Update a player's position
 * Quick changes during practice
 */
export async function updatePlayerPosition(
  playerId: string, 
  position: string,
  notes?: string
) {
  const { data, error } = await supabase.rpc('update_player_position', {
    p_player_id: playerId,
    p_position: position,
    p_notes: notes
  });

  if (error) {
    console.error('Error updating player position:', error);
    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Failed to update position');
  }

  return data.player;
}

/**
 * Toggle player stripe status
 * Quick MPR tracking during practice
 */
export async function togglePlayerStripe(playerId: string) {
  const { data, error } = await supabase.rpc('toggle_player_stripe', {
    p_player_id: playerId
  });

  if (error) {
    console.error('Error toggling stripe:', error);
    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Failed to toggle stripe');
  }

  return {
    playerId: data.player_id,
    playerName: data.player_name,
    isStriped: data.is_striped
  };
}

/**
 * Archive or unarchive a player
 * Soft delete for roster management
 */
export async function archivePlayer(playerId: string, archive: boolean = true) {
  const { data, error } = await supabase.rpc('archive_player', {
    p_player_id: playerId,
    p_archive: archive
  });

  if (error) {
    console.error('Error archiving player:', error);
    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Failed to archive player');
  }

  return data.player;
}

/**
 * Get detailed stats for a player
 * For player cards and reports
 */
export async function getPlayerStats(playerId: string): Promise<DetailedPlayerStats> {
  const { data, error } = await supabase.rpc('get_player_stats', {
    p_player_id: playerId
  });

  if (error) {
    console.error('Error fetching player stats:', error);
    throw error;
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  // Transform to camelCase
  return {
    player: {
      id: data.player.id,
      name: data.player.name,
      jerseyNumber: data.player.jersey_number,
      position: data.player.position,
      isStriped: data.player.is_striped
    },
    receiving: {
      completions: data.receiving.completions || 0,
      touchdowns: data.receiving.touchdowns || 0,
      interceptions: data.receiving.interceptions || 0,
      incompletions: data.receiving.incompletions || 0,
      targets: data.receiving.targets || 0,
      totalYards: data.receiving.total_yards || 0
    },
    quarterback: {
      completions: data.quarterback.completions || 0,
      tdPasses: data.quarterback.td_passes || 0,
      interceptions: data.quarterback.interceptions || 0,
      attempts: data.quarterback.attempts || 0,
      passingYards: data.quarterback.passing_yards || 0
    },
    games: {
      gamesPlayed: data.games.games_played || 0,
      totalPlays: data.games.total_plays || 0
    },
    lastGame: data.last_game ? {
      gameId: data.last_game.game_id,
      opponent: data.last_game.opponent,
      date: data.last_game.date,
      plays: data.last_game.plays
    } : undefined
  };
}

/**
 * Check if a jersey number is available
 * Quick validation before adding/editing
 */
export async function checkJerseyAvailable(
  teamId: string, 
  jerseyNumber: number,
  excludePlayerId?: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_jersey_available', {
    p_team_id: teamId,
    p_jersey_number: jerseyNumber,
    p_exclude_player_id: excludePlayerId
  });

  if (error) {
    console.error('Error checking jersey:', error);
    return false;
  }

  return data === true;
}

/**
 * Create a single player
 * For individual additions
 */
export async function createPlayer(teamId: string, playerData: {
  name: string;
  jerseyNumber: number;
  isStriped?: boolean;
  position?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('players')
    .insert({
      team_id: teamId,
      name: playerData.name,
      jersey_number: playerData.jerseyNumber,
      is_striped: playerData.isStriped || false,
      position: playerData.position,
      notes: playerData.notes
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique violation
      throw new Error('Jersey number already taken');
    }
    console.error('Error creating player:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    jerseyNumber: data.jersey_number,
    isStriped: data.is_striped,
    position: data.position,
    notes: data.notes
  };
}

/**
 * Update player details
 * For editing player information
 */
export async function updatePlayer(playerId: string, updates: {
  name?: string;
  jerseyNumber?: number;
  isStriped?: boolean;
  position?: string;
  notes?: string;
}) {
  const updateData: any = {};
  
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.jerseyNumber !== undefined) updateData.jersey_number = updates.jerseyNumber;
  if (updates.isStriped !== undefined) updateData.is_striped = updates.isStriped;
  if (updates.position !== undefined) updateData.position = updates.position;
  if (updates.notes !== undefined) updateData.notes = updates.notes;

  const { data, error } = await supabase
    .from('players')
    .update(updateData)
    .eq('id', playerId)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique violation
      throw new Error('Jersey number already taken');
    }
    console.error('Error updating player:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    jerseyNumber: data.jersey_number,
    isStriped: data.is_striped,
    position: data.position,
    notes: data.notes
  };
}

/**
 * Delete a player permanently
 * Use archive instead for soft delete
 */
export async function deletePlayer(playerId: string) {
  const { error } = await supabase
    .from('players')
    .delete()
    .eq('id', playerId);

  if (error) {
    console.error('Error deleting player:', error);
    throw error;
  }

  return { success: true };
}

/**
 * Get players by position
 * For position-specific views
 */
export async function getPlayersByPosition(teamId: string, position: string) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .eq('position', position)
    .is('archived_at', null)
    .order('jersey_number');

  if (error) {
    console.error('Error fetching players by position:', error);
    throw error;
  }

  return data.map(p => ({
    id: p.id,
    name: p.name,
    jerseyNumber: p.jersey_number,
    isStriped: p.is_striped,
    position: p.position,
    notes: p.notes
  }));
}