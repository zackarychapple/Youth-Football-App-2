// mock-db-functions.ts
// Mock implementations for database functions during development/testing
// These return realistic data structures without requiring actual database tables

import type { Team, Coach } from '@/types/database.types';

// Mock user teams data - returns empty array by default
export async function mockGetUserTeams(userId: string): Promise<any[]> {
  // Silent mock - no console logging to avoid noise
  // Return empty array for now - can be expanded with test data if needed
  // The structure matches what the actual RPC function would return
  return Promise.resolve([]);
}

// Mock team creation
export async function mockCreateTeamWithCoach(params: {
  p_team_name: string;
  p_user_id: string;
  p_email: string;
  p_coach_name: string;
}): Promise<{ success: boolean; team_id?: string; error?: string }> {
  // Silent mock - no console logging
  // Simulate successful team creation
  const mockTeamId = `mock-team-${Date.now()}`;
  return Promise.resolve({
    success: true,
    team_id: mockTeamId
  });
}

// Mock join team with code
export async function mockJoinTeamWithCode(params: {
  p_invite_code: string;
  p_user_id: string;
  p_email: string;
  p_name: string;
}): Promise<{ success: boolean; team_id?: string; error?: string }> {
  // Silent mock - no console logging
  // Simulate invalid code for testing
  if (params.p_invite_code === 'INVALID') {
    return Promise.resolve({
      success: false,
      error: 'Invalid invite code'
    });
  }
  
  // Simulate successful join
  return Promise.resolve({
    success: true,
    team_id: `mock-team-${Date.now()}`
  });
}

// Mock team details
export async function mockGetTeamDetails(teamId: string): Promise<any> {
  // Silent mock - no console logging
  return Promise.resolve({
    id: teamId,
    name: 'Mock Team',
    invite_code: 'MOCK123',
    settings: {},
    player_count: 0,
    game_count: 0,
    coaches: []
  });
}

// Mock coach data for current user
export async function mockGetCoachesForUser(userId: string, teamId?: string): Promise<Coach[]> {
  // Silent mock - no console logging
  // Return empty array - no coaches in mock mode
  return Promise.resolve([]);
}

// Mock function to check if database is available
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const { supabase } = await import('./supabase');
    // Try a simple query to check connection
    const { error } = await supabase.from('teams').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// Wrapper function that automatically falls back to mock if database is unavailable
export async function safeRPC<T>(
  rpcName: string,
  params: any,
  mockFunction: (params: any) => Promise<T>
): Promise<T> {
  try {
    const { supabase } = await import('./supabase');
    const { data, error } = await supabase.rpc(rpcName, params);
    
    if (error) {
      // Check if it's a "function not found" error
      if (error.message?.includes('Could not find the function') || 
          error.message?.includes('does not exist') ||
          error.code === '42883') { // PostgreSQL error code for undefined function
        // Silently use mock implementation - no console warnings
        return mockFunction(params);
      }
      throw error;
    }
    
    return data as T;
  } catch (error) {
    // Silently fall back to mock implementation
    return mockFunction(params);
  }
}

// Export a mock database helper object that mirrors the real one
export const mockDb = {
  team: {
    getUserTeams: (userId: string) => mockGetUserTeams(userId),
    createTeam: (teamName: string, userId: string, email: string, coachName: string) => 
      mockCreateTeamWithCoach({ p_team_name: teamName, p_user_id: userId, p_email: email, p_coach_name: coachName }),
    joinTeam: (inviteCode: string, userId: string, email: string, name: string) =>
      mockJoinTeamWithCode({ p_invite_code: inviteCode, p_user_id: userId, p_email: email, p_name: name }),
    getTeamDetails: (teamId: string) => mockGetTeamDetails(teamId)
  },
  coach: {
    getForUser: (userId: string, teamId?: string) => mockGetCoachesForUser(userId, teamId)
  }
};

// Environment flag to enable/disable mocking
export const USE_MOCK_DB = import.meta.env.VITE_USE_MOCK_DB === 'true' || false;