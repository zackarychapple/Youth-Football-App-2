// teams.ts
// Team management API - Simple, direct Supabase RPC calls
// No complex abstractions, just what coaches need

import { supabase } from '../supabase';

export interface CreateTeamParams {
  name: string;
  userId: string;
  coachEmail: string;
  coachName: string;
}

export interface JoinTeamParams {
  inviteCode: string;
  userId: string;
  name: string;
  email: string;
  role?: 'assistant' | 'viewer';
}

export interface TeamDetails {
  id: string;
  name: string;
  inviteCode: string;
  settings: any;
  playerCount: number;
  gameCount: number;
  coaches: Array<{
    id: string;
    name: string;
    email: string;
    isHeadCoach: boolean;
  }>;
}

export interface TeamWithStats {
  id: string;
  name: string;
  inviteCode: string;
  isHeadCoach: boolean;
  playerCount: number;
  activeGame?: {
    id: string;
    opponent: string;
    status: string;
  };
}

/**
 * Create a new team with the current user as head coach
 * Simple and direct - no complex permissions needed
 */
export async function createTeamWithCoach(params: CreateTeamParams) {
  const { safeRPC, mockCreateTeamWithCoach } = await import('../mock-db-functions');
  
  try {
    const data = await safeRPC(
      'create_team_with_coach',
      {
        p_name: params.name,
        p_user_id: params.userId,
        p_coach_email: params.coachEmail,
        p_coach_name: params.coachName
      },
      mockCreateTeamWithCoach
    );

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to create team');
    }

    return data;
  } catch (error) {
    console.error('[TEAMS API] Error creating team:', error);
    throw error;
  }
}

/**
 * Join an existing team using an invite code
 * Works for both coaches and parent viewers
 */
export async function joinTeamWithCode(params: JoinTeamParams) {
  const { safeRPC, mockJoinTeamWithCode } = await import('../mock-db-functions');
  
  try {
    const data = await safeRPC(
      'join_team_with_code',
      {
        p_invite_code: params.inviteCode,
        p_user_id: params.userId,
        p_name: params.name,
        p_email: params.email,
        p_role: params.role || 'assistant'
      },
      mockJoinTeamWithCode
    );

    if (!data?.success) {
      throw new Error(data?.error || 'Invalid invite code');
    }

    return data;
  } catch (error) {
    console.error('[TEAMS API] Error joining team:', error);
    throw error;
  }
}

/**
 * Get detailed team information including coaches and stats
 * Fast query for dashboard loading
 */
export async function getTeamDetails(teamId: string): Promise<TeamDetails> {
  const { safeRPC, mockGetTeamDetails } = await import('../mock-db-functions');
  
  try {
    const data = await safeRPC(
      'get_team_details',
      { p_team_id: teamId },
      mockGetTeamDetails
    );

    if (!data) {
      throw new Error('Team not found');
    }

    // Transform snake_case to camelCase for TypeScript
    return {
      id: data.id,
      name: data.name,
      inviteCode: data.invite_code || data.inviteCode || '',
      settings: data.settings || {},
      playerCount: data.player_count || data.playerCount || 0,
      gameCount: data.game_count || data.gameCount || 0,
      coaches: data.coaches?.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        isHeadCoach: c.is_head_coach || c.isHeadCoach || false
      })) || []
    };
  } catch (error) {
    console.error('[TEAMS API] Error fetching team details:', error);
    throw error;
  }
}

/**
 * Get all teams for the current user
 * Used for team switcher in the UI
 */
export async function getUserTeams(userId: string): Promise<TeamWithStats[]> {
  // Import mock functions for fallback
  const { safeRPC, mockGetUserTeams } = await import('../mock-db-functions');
  
  try {
    // Use safeRPC to automatically fallback to mock if function doesn't exist
    const data = await safeRPC(
      'get_user_teams',
      { p_user_id: userId },
      mockGetUserTeams
    );

    // Handle both real and mock response formats
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return [];
    }

    // If data has success property (real RPC response)
    if ((data as any)?.success && (data as any)?.teams) {
      return (data as any).teams.map((team: any) => ({
        id: team.id,
        name: team.name,
        inviteCode: team.invite_code,
        isHeadCoach: team.is_head_coach,
        playerCount: team.player_count,
        activeGame: team.active_game ? {
          id: team.active_game.id,
          opponent: team.active_game.opponent,
          status: team.active_game.status
        } : undefined
      }));
    }

    // Handle direct array response (mock or simplified real response)
    if (Array.isArray(data)) {
      return data.map((team: any) => ({
        id: team.team_id || team.id,
        name: team.team_name || team.name,
        inviteCode: team.invite_code || '',
        isHeadCoach: team.is_head_coach || false,
        playerCount: team.player_count || 0,
        activeGame: team.active_game ? {
          id: team.active_game.id,
          opponent: team.active_game.opponent,
          status: team.active_game.status
        } : undefined
      }));
    }

    return [];
  } catch (error) {
    console.error('[TEAMS API] Error fetching user teams:', error);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
}

/**
 * Update team settings
 * Simple key-value updates for team preferences
 */
export async function updateTeamSettings(teamId: string, settings: Record<string, any>) {
  const { data, error } = await supabase.rpc('update_team_settings', {
    p_team_id: teamId,
    p_settings: settings
  });

  if (error) {
    console.error('Error updating team settings:', error);
    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Failed to update settings');
  }

  return data;
}

/**
 * Regenerate team invite code
 * For security if the code is compromised
 */
export async function regenerateInviteCode(teamId: string): Promise<string> {
  const { data, error } = await supabase.rpc('regenerate_invite_code', {
    p_team_id: teamId
  });

  if (error) {
    console.error('Error regenerating invite code:', error);
    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Failed to regenerate code');
  }

  return data.invite_code;
}

/**
 * Get team by invite code (for join flow)
 * Check if code is valid before joining
 */
export async function getTeamByInviteCode(inviteCode: string) {
  const { data, error } = await supabase
    .from('teams')
    .select('id, name')
    .ilike('invite_code', inviteCode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Invalid invite code');
    }
    throw error;
  }

  return data;
}

/**
 * Delete a team (head coach only)
 * Cascades to all related data
 */
export async function deleteTeam(teamId: string) {
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId);

  if (error) {
    console.error('Error deleting team:', error);
    throw error;
  }

  return { success: true };
}

/**
 * Remove a coach from team
 * For team management
 */
export async function removeCoachFromTeam(teamId: string, coachId: string) {
  const { error } = await supabase
    .from('coaches')
    .delete()
    .eq('team_id', teamId)
    .eq('id', coachId);

  if (error) {
    console.error('Error removing coach:', error);
    throw error;
  }

  return { success: true };
}

/**
 * Transfer head coach role
 * For team ownership changes
 */
export async function transferHeadCoach(teamId: string, newHeadCoachId: string) {
  // First remove head coach status from all
  await supabase
    .from('coaches')
    .update({ is_head_coach: false })
    .eq('team_id', teamId);

  // Then set new head coach
  const { error } = await supabase
    .from('coaches')
    .update({ is_head_coach: true })
    .eq('team_id', teamId)
    .eq('id', newHeadCoachId);

  if (error) {
    console.error('Error transferring head coach:', error);
    throw error;
  }

  return { success: true };
}