# API Specifications - CFL Game Tracker
## Sprint 1 API Implementation

### Version 1.0
### Date: August 17, 2025
### Author: Supabase Architect

---

## Executive Summary

This document defines the API specifications for Sprint 1 of the CFL Game Tracker, leveraging Supabase's auto-generated REST APIs, real-time subscriptions, and custom Edge Functions. Following our public-data philosophy, all APIs are simple and performant without complex authorization layers.

**Key Principles:**
- REST APIs auto-generated from database schema
- Real-time subscriptions for live updates
- Edge Functions for complex operations
- TypeScript types for frontend integration
- Idempotent operations for offline sync

---

## API Architecture

### Base Configuration

```typescript
// Environment Variables (required by UI Engineer - Day 1)
PUBLIC_SUPABASE_URL=https://yepriyrcjmlmhrwpgqka.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllcHJpeXJjam1sbWhyd3BncWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODk5OTcsImV4cCI6MjA3MDk2NTk5N30.Fo2U0TWiROv-mru9PIrFSEfAk2rBpzp_vpTiahVVjvE
SUPABASE_SERVICE_KEY=[SERVICE_KEY] // Server-side only

// API Endpoints
REST API: https://[PROJECT_ID].supabase.co/rest/v1
Auth API: https://[PROJECT_ID].supabase.co/auth/v1
Realtime: wss://[PROJECT_ID].supabase.co/realtime/v1
Storage: https://[PROJECT_ID].supabase.co/storage/v1
Edge Functions: https://[PROJECT_ID].supabase.co/functions/v1
```

---

## Authentication APIs

### 1. Sign Up
```typescript
// POST /auth/v1/signup
interface SignUpRequest {
  email: string;
  password: string;
  options?: {
    data?: {
      full_name?: string;
      team_name?: string;
    };
  };
}

interface SignUpResponse {
  user: User;
  session: Session;
}

// TypeScript Implementation
async function signUp(email: string, password: string, teamName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { team_name: teamName }
    }
  });
  return { data, error };
}
```

### 2. Sign In
```typescript
// POST /auth/v1/token?grant_type=password
interface SignInRequest {
  email: string;
  password: string;
}

interface SignInResponse {
  user: User;
  session: Session;
}

// TypeScript Implementation
async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}
```

### 3. Sign Out
```typescript
// POST /auth/v1/logout
// TypeScript Implementation
async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
```

### 4. Password Reset
```typescript
// POST /auth/v1/recover
interface PasswordResetRequest {
  email: string;
}

// TypeScript Implementation
async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://cfl-tracker.com/reset-password'
  });
  return { data, error };
}
```

### 5. Get Current User
```typescript
// GET /auth/v1/user
interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    team_name?: string;
  };
  created_at: string;
}

// TypeScript Implementation
async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}
```

---

## REST API Endpoints

### Teams

#### Create Team
```typescript
// POST /rest/v1/teams
interface CreateTeamRequest {
  name: string;
  season?: string;
  age_group?: string;
  mpr_requirement?: number;
  field_size?: number;
  special_teams_counts_mpr?: boolean;
}

interface Team {
  id: string;
  name: string;
  coach_id: string;
  season: string;
  age_group: string | null;
  league: string;
  mpr_requirement: number;
  field_size: number;
  special_teams_counts_mpr: boolean;
  created_at: string;
  updated_at: string;
}

// TypeScript Implementation
async function createTeam(team: CreateTeamRequest): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      ...team,
      coach_id: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}
```

#### Get Team
```typescript
// GET /rest/v1/teams?id=eq.{team_id}
async function getTeam(teamId: string): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single();
    
  if (error) throw error;
  return data;
}
```

#### Update Team
```typescript
// PATCH /rest/v1/teams?id=eq.{team_id}
async function updateTeam(teamId: string, updates: Partial<Team>): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', teamId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}
```

### Players

#### Add Player
```typescript
// POST /rest/v1/players
interface CreatePlayerRequest {
  team_id: string;
  jersey_number: number;
  name: string;
  position?: string;
  is_striped?: boolean;
  mpr_requirement?: number;
}

interface Player {
  id: string;
  team_id: string;
  jersey_number: number;
  name: string;
  position: string | null;
  status: 'active' | 'injured' | 'ejected' | 'inactive';
  is_striped: boolean;
  mpr_requirement: number;
  mpr_note: string | null;
  season_play_count: number;
  season_offensive_plays: number;
  season_defensive_plays: number;
  season_qb_plays: number;
  season_games_played: number;
  practice_attendance: number;
  created_at: string;
  updated_at: string;
}

// TypeScript Implementation
async function addPlayer(player: CreatePlayerRequest): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert(player)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}
```

#### Bulk Add Players
```typescript
// POST /rest/v1/players (array)
async function bulkAddPlayers(players: CreatePlayerRequest[]): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .insert(players)
    .select();
    
  if (error) throw error;
  return data;
}
```

#### Get Team Roster
```typescript
// GET /rest/v1/players?team_id=eq.{team_id}&status=eq.active
async function getTeamRoster(teamId: string, activeOnly = true): Promise<Player[]> {
  let query = supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .order('jersey_number');
    
  if (activeOnly) {
    query = query.eq('status', 'active');
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}
```

#### Update Player
```typescript
// PATCH /rest/v1/players?id=eq.{player_id}
async function updatePlayer(playerId: string, updates: Partial<Player>): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .update(updates)
    .eq('id', playerId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}
```

### Games

#### Create Game
```typescript
// POST /rest/v1/games
interface CreateGameRequest {
  team_id: string;
  opponent: string;
  game_type?: 'game' | 'scrimmage' | 'practice';
  game_date?: string;
  is_home?: boolean;
  location?: string;
  field_size?: number;
}

interface Game {
  id: string;
  team_id: string;
  share_code: string;
  opponent: string;
  game_type: 'game' | 'scrimmage' | 'practice';
  game_date: string;
  start_time: string | null;
  end_time: string | null;
  is_home: boolean;
  location: string | null;
  field_size: number;
  special_teams_counts: boolean;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  current_quarter: number;
  current_down: number | null;
  current_distance: number | null;
  field_position: number | null;
  possession: 'offense' | 'defense' | 'special' | null;
  time_remaining: string | null;
  our_score: number;
  opponent_score: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// TypeScript Implementation
async function createGame(game: CreateGameRequest): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .insert({
      ...game,
      created_by: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}
```

#### Start Game
```typescript
// PATCH /rest/v1/games?id=eq.{game_id}
async function startGame(gameId: string): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .update({
      status: 'active',
      start_time: new Date().toISOString()
    })
    .eq('id', gameId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}
```

#### Get Game by Share Code (Public)
```typescript
// GET /rest/v1/games?share_code=eq.{share_code}
async function getGameByShareCode(shareCode: string): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      team:teams(name, mpr_requirement),
      game_rosters(
        *,
        player:players(*)
      )
    `)
    .eq('share_code', shareCode)
    .single();
    
  if (error) throw error;
  return data;
}
```

### Game Rosters

#### Set Game Roster
```typescript
// POST /rest/v1/game_rosters (upsert)
interface GameRosterEntry {
  game_id: string;
  player_id: string;
  is_present?: boolean;
  mpr_override?: number;
  mpr_override_reason?: string;
}

async function setGameRoster(gameId: string, playerIds: string[]): Promise<GameRosterEntry[]> {
  const roster = playerIds.map(playerId => ({
    game_id: gameId,
    player_id: playerId,
    is_present: true
  }));
  
  const { data, error } = await supabase
    .from('game_rosters')
    .upsert(roster)
    .select();
    
  if (error) throw error;
  return data;
}
```

#### Mark Player Late
```typescript
// PATCH /rest/v1/game_rosters?game_id=eq.{game_id}&player_id=eq.{player_id}
async function markPlayerLate(gameId: string, playerId: string): Promise<void> {
  const { error } = await supabase
    .from('game_rosters')
    .update({
      arrival_time: new Date().toISOString(),
      mpr_override: 6, // Reduced MPR for late arrival
      mpr_override_reason: 'Late arrival'
    })
    .eq('game_id', gameId)
    .eq('player_id', playerId);
    
  if (error) throw error;
}
```

### Plays

#### Record Play (via RPC)
```typescript
// POST /rest/v1/rpc/record_play
interface PlayData {
  formation?: string;
  down?: number;
  distance?: number;
  field_position?: number;
  hash?: 'left' | 'middle' | 'right';
  players_on_field: string[];
  quarter: number;
  game_clock?: string;
  play_type: 'offense' | 'defense' | 'special';
  
  // Offensive data
  qb_id?: string;
  play_call?: 'run' | 'pass' | 'qb_keep';
  ball_carrier_id?: string;
  receiver_id?: string;
  yards_gained?: number;
  pass_complete?: boolean;
  result?: 'first_down' | 'touchdown' | 'turnover' | 'safety';
  
  // Defensive data
  tackles?: string[];
  sacks?: string[];
  interception_by?: string;
  fumble_recovery_by?: string;
  
  // Penalty data
  penalty?: boolean;
  penalty_on?: string;
  penalty_type?: string;
  penalty_yards?: number;
  
  note?: string;
}

async function recordPlay(
  gameId: string, 
  playData: PlayData,
  clientId?: string
): Promise<string> {
  const { data, error } = await supabase.rpc('record_play', {
    p_game_id: gameId,
    p_play_data: playData,
    p_client_id: clientId || crypto.randomUUID(),
    p_device_id: getDeviceId()
  });
  
  if (error) throw error;
  return data; // Returns play ID
}
```

#### Get Game Plays
```typescript
// GET /rest/v1/plays?game_id=eq.{game_id}&order=play_number.asc
interface Play {
  id: string;
  game_id: string;
  play_number: number;
  quarter: number;
  game_clock: string | null;
  play_type: 'offense' | 'defense' | 'special';
  play_data: PlayData;
  version: number;
  client_id: string | null;
  device_id: string | null;
  synced_at: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string | null;
}

async function getGamePlays(gameId: string, limit?: number): Promise<Play[]> {
  let query = supabase
    .from('plays')
    .select('*')
    .eq('game_id', gameId)
    .order('play_number', { ascending: true });
    
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}
```

### Lineup Presets

#### Create Lineup
```typescript
// POST /rest/v1/lineup_presets
interface CreateLineupRequest {
  team_id: string;
  name: string;
  lineup_type: 'offense' | 'defense' | 'special';
  player_ids: string[];
  is_default?: boolean;
}

interface LineupPreset {
  id: string;
  team_id: string;
  name: string;
  lineup_type: 'offense' | 'defense' | 'special';
  player_ids: string[];
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

async function createLineup(lineup: CreateLineupRequest): Promise<LineupPreset> {
  const { data, error } = await supabase
    .from('lineup_presets')
    .insert(lineup)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}
```

#### Get Team Lineups
```typescript
// GET /rest/v1/lineup_presets?team_id=eq.{team_id}&order=sort_order.asc
async function getTeamLineups(teamId: string): Promise<LineupPreset[]> {
  const { data, error } = await supabase
    .from('lineup_presets')
    .select('*')
    .eq('team_id', teamId)
    .order('sort_order');
    
  if (error) throw error;
  return data;
}
```

---

## Real-time Subscriptions

### Game Updates Channel
```typescript
// Subscribe to all game updates
function subscribeToGame(gameId: string, callbacks: {
  onPlayAdded?: (play: Play) => void;
  onGameUpdated?: (game: Game) => void;
  onRosterUpdated?: (roster: GameRosterEntry) => void;
}) {
  const channel = supabase
    .channel(`game:${gameId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'plays',
        filter: `game_id=eq.${gameId}`
      },
      (payload) => callbacks.onPlayAdded?.(payload.new as Play)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`
      },
      (payload) => callbacks.onGameUpdated?.(payload.new as Game)
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_rosters',
        filter: `game_id=eq.${gameId}`
      },
      (payload) => callbacks.onRosterUpdated?.(payload.new as GameRosterEntry)
    )
    .subscribe();
    
  return () => channel.unsubscribe();
}
```

### MPR Dashboard Channel
```typescript
// Subscribe to MPR dashboard updates
interface MPRDashboardEntry {
  game_id: string;
  team_id: string;
  player_id: string;
  jersey_number: number;
  name: string;
  position: string | null;
  is_striped: boolean;
  mpr_requirement: number;
  play_count: number;
  offensive_plays: number;
  defensive_plays: number;
  special_teams_plays: number;
  penalty_plays: number;
  mpr_status: 'met' | 'close' | 'progress' | 'needs_plays';
  plays_needed: number;
  is_present: boolean;
  arrival_time: string | null;
  player_status: 'active' | 'injured' | 'ejected' | 'inactive';
}

function subscribeToDashboard(
  gameId: string, 
  onUpdate: (dashboard: MPRDashboardEntry[]) => void
) {
  // Poll the materialized view every 5 seconds during game
  const interval = setInterval(async () => {
    const { data, error } = await supabase
      .from('mpr_dashboard')
      .select('*')
      .eq('game_id', gameId)
      .order('plays_needed', { ascending: false });
      
    if (!error && data) {
      onUpdate(data);
    }
  }, 5000);
  
  return () => clearInterval(interval);
}
```

### Presence Channel (Active Coaches)
```typescript
// Track which coaches are actively viewing/editing
function subscribeToPresence(gameId: string) {
  const channel = supabase.channel(`presence:${gameId}`);
  
  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      console.log('Active coaches:', state);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('Coach joined:', newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('Coach left:', leftPresences);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const user = (await supabase.auth.getUser()).data.user;
        await channel.track({
          user_id: user?.id,
          user_email: user?.email,
          online_at: new Date().toISOString()
        });
      }
    });
    
  return () => {
    channel.untrack();
    channel.unsubscribe();
  };
}
```

---

## Edge Functions

### 1. Sync Offline Plays
**Endpoint:** `/functions/v1/sync-offline-plays`

```typescript
// Edge Function: sync-offline-plays/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

interface SyncRequest {
  device_id: string;
  plays: Array<{
    game_id: string;
    play_data: PlayData;
    client_id: string;
  }>;
}

interface SyncResponse {
  results: Array<{
    play_id: string | null;
    client_id: string;
    status: 'success' | 'failed';
    error_message?: string;
  }>;
}

serve(async (req: Request) => {
  const { device_id, plays }: SyncRequest = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const { data, error } = await supabase.rpc('sync_offline_plays', {
    p_device_id: device_id,
    p_plays: plays
  });
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({ results: data }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// Client usage
async function syncOfflinePlays(plays: any[]): Promise<SyncResponse> {
  const response = await supabase.functions.invoke('sync-offline-plays', {
    body: {
      device_id: getDeviceId(),
      plays
    }
  });
  
  return response.data;
}
```

### 2. Calculate Game Statistics
**Endpoint:** `/functions/v1/calculate-stats`

```typescript
// Edge Function: calculate-stats/index.ts
interface StatsRequest {
  game_id: string;
}

interface GameStats {
  total_plays: number;
  offensive_plays: number;
  defensive_plays: number;
  total_yards: number;
  passing_yards: number;
  rushing_yards: number;
  touchdowns: number;
  turnovers: number;
  first_downs: number;
  third_down_conversions: number;
  third_down_attempts: number;
  penalties: number;
  penalty_yards: number;
  time_of_possession: string;
}

serve(async (req: Request) => {
  const { game_id }: StatsRequest = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // Get all plays for the game
  const { data: plays, error } = await supabase
    .from('plays')
    .select('play_data')
    .eq('game_id', game_id);
    
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Calculate statistics
  const stats: GameStats = {
    total_plays: plays.length,
    offensive_plays: plays.filter(p => p.play_data.play_type === 'offense').length,
    defensive_plays: plays.filter(p => p.play_data.play_type === 'defense').length,
    total_yards: plays.reduce((sum, p) => sum + (p.play_data.yards_gained || 0), 0),
    passing_yards: plays
      .filter(p => p.play_data.play_call === 'pass' && p.play_data.pass_complete)
      .reduce((sum, p) => sum + (p.play_data.yards_gained || 0), 0),
    rushing_yards: plays
      .filter(p => p.play_data.play_call === 'run')
      .reduce((sum, p) => sum + (p.play_data.yards_gained || 0), 0),
    touchdowns: plays.filter(p => p.play_data.result === 'touchdown').length,
    turnovers: plays.filter(p => p.play_data.result === 'turnover').length,
    first_downs: plays.filter(p => p.play_data.result === 'first_down').length,
    third_down_conversions: plays.filter(p => 
      p.play_data.down === 3 && p.play_data.result === 'first_down'
    ).length,
    third_down_attempts: plays.filter(p => p.play_data.down === 3).length,
    penalties: plays.filter(p => p.play_data.penalty).length,
    penalty_yards: plays.reduce((sum, p) => 
      sum + (p.play_data.penalty ? p.play_data.penalty_yards || 0 : 0), 0
    ),
    time_of_possession: calculatePossessionTime(plays)
  };
  
  return new Response(JSON.stringify(stats), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// Client usage
async function getGameStats(gameId: string): Promise<GameStats> {
  const response = await supabase.functions.invoke('calculate-stats', {
    body: { game_id: gameId }
  });
  
  return response.data;
}
```

### 3. Bulk Import Players
**Endpoint:** `/functions/v1/bulk-import-players`

```typescript
// Edge Function: bulk-import-players/index.ts
interface BulkImportRequest {
  team_id: string;
  csv_data: string; // CSV format: "jersey_number,name,position"
}

interface BulkImportResponse {
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

serve(async (req: Request) => {
  const { team_id, csv_data }: BulkImportRequest = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const lines = csv_data.split('\n').filter(line => line.trim());
  const players = [];
  const errors = [];
  
  for (let i = 0; i < lines.length; i++) {
    const [jersey, name, position] = lines[i].split(',').map(s => s.trim());
    
    if (!jersey || !name) {
      errors.push({ row: i + 1, error: 'Missing jersey number or name' });
      continue;
    }
    
    players.push({
      team_id,
      jersey_number: parseInt(jersey),
      name,
      position: position || null
    });
  }
  
  // Bulk insert players
  const { data, error } = await supabase
    .from('players')
    .insert(players)
    .select();
    
  const response: BulkImportResponse = {
    imported: data?.length || 0,
    failed: errors.length,
    errors
  };
  
  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// Client usage
async function bulkImportPlayers(teamId: string, csvData: string): Promise<BulkImportResponse> {
  const response = await supabase.functions.invoke('bulk-import-players', {
    body: {
      team_id: teamId,
      csv_data: csvData
    }
  });
  
  return response.data;
}
```

---

## TypeScript Type Definitions

### Complete Type Definitions for Frontend
```typescript
// types/database.ts

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: Team;
        Insert: Omit<Team, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Team, 'id'>>;
      };
      players: {
        Row: Player;
        Insert: Omit<Player, 'id' | 'created_at' | 'updated_at' | 'season_play_count' | 'season_offensive_plays' | 'season_defensive_plays' | 'season_qb_plays' | 'season_games_played'>;
        Update: Partial<Omit<Player, 'id'>>;
      };
      games: {
        Row: Game;
        Insert: Omit<Game, 'id' | 'share_code' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Game, 'id' | 'share_code'>>;
      };
      game_rosters: {
        Row: GameRosterEntry;
        Insert: GameRosterEntry;
        Update: Partial<GameRosterEntry>;
      };
      plays: {
        Row: Play;
        Insert: Omit<Play, 'id' | 'created_at' | 'updated_at' | 'version'>;
        Update: Partial<Omit<Play, 'id'>>;
      };
      lineup_presets: {
        Row: LineupPreset;
        Insert: Omit<LineupPreset, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LineupPreset, 'id'>>;
      };
      sync_queue: {
        Row: SyncQueueEntry;
        Insert: Omit<SyncQueueEntry, 'id' | 'created_at'>;
        Update: Partial<Omit<SyncQueueEntry, 'id'>>;
      };
    };
    Views: {
      mpr_dashboard: {
        Row: MPRDashboardEntry;
      };
      season_stats: {
        Row: SeasonStats;
      };
      team_game_summary: {
        Row: TeamGameSummary;
      };
    };
    Functions: {
      record_play: {
        Args: {
          p_game_id: string;
          p_play_data: PlayData;
          p_client_id?: string;
          p_device_id?: string;
        };
        Returns: string;
      };
      sync_offline_plays: {
        Args: {
          p_device_id: string;
          p_plays: any[];
        };
        Returns: Array<{
          play_id: string | null;
          client_id: string;
          status: string;
          error_message: string | null;
        }>;
      };
    };
  };
}

// Enums
export type GameStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
export type GameType = 'game' | 'scrimmage' | 'practice';
export type PlayType = 'offense' | 'defense' | 'special';
export type PlayerStatus = 'active' | 'injured' | 'ejected' | 'inactive';
export type MPRStatus = 'met' | 'close' | 'progress' | 'needs_plays';

// Additional types for UI state management
export interface GameState {
  game: Game;
  roster: GameRosterEntry[];
  plays: Play[];
  activePlayers: Set<string>;
  currentLineup: string[];
  mprDashboard: MPRDashboardEntry[];
}

export interface OfflineQueue {
  plays: Array<{
    gameId: string;
    playData: PlayData;
    clientId: string;
    timestamp: number;
  }>;
  syncing: boolean;
  lastSyncAt: number | null;
  errors: Array<{
    clientId: string;
    error: string;
    timestamp: number;
  }>;
}

// Helper types for UI components
export interface PlayerWithStats extends Player {
  gameStats?: {
    playCount: number;
    mprStatus: MPRStatus;
    playsNeeded: number;
  };
}

export interface GameWithDetails extends Game {
  team?: Team;
  roster?: GameRosterEntry[];
  plays?: Play[];
  stats?: GameStats;
}
```

---

## Error Handling Patterns

### Standard Error Response
```typescript
interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}

// Error handler utility
function handleSupabaseError(error: any): ErrorResponse {
  if (error.code === '23505') {
    return {
      error: {
        message: 'Duplicate entry. This record already exists.',
        code: 'DUPLICATE_ENTRY',
        details: error.details
      }
    };
  }
  
  if (error.code === '23503') {
    return {
      error: {
        message: 'Invalid reference. Related record not found.',
        code: 'INVALID_REFERENCE',
        details: error.details
      }
    };
  }
  
  if (error.code === 'PGRST116') {
    return {
      error: {
        message: 'Record not found.',
        code: 'NOT_FOUND'
      }
    };
  }
  
  return {
    error: {
      message: error.message || 'An unexpected error occurred.',
      code: 'UNKNOWN_ERROR'
    }
  };
}
```

### Retry Logic for Offline Sync
```typescript
class RetryableOperation {
  private maxRetries = 3;
  private baseDelay = 1000;
  
  async execute<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number) => void
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < this.maxRetries) {
          onRetry?.(attempt);
          const delay = this.baseDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
}

// Usage
const retry = new RetryableOperation();
const result = await retry.execute(
  () => recordPlay(gameId, playData),
  (attempt) => console.log(`Retry attempt ${attempt}`)
);
```

---

## API Rate Limits

### Supabase Default Limits
- **Authentication:** 30 requests per minute per IP
- **REST API:** 1000 requests per minute per project
- **Realtime:** 500 concurrent connections
- **Edge Functions:** 1000 invocations per minute

### Client-Side Rate Limiting
```typescript
class RateLimiter {
  private timestamps: number[] = [];
  private maxRequests: number;
  private windowMs: number;
  
  constructor(maxRequests = 60, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  canMakeRequest(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => t > now - this.windowMs);
    
    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }
    
    this.timestamps.push(now);
    return true;
  }
  
  msUntilNextRequest(): number {
    if (this.timestamps.length < this.maxRequests) {
      return 0;
    }
    
    const oldestTimestamp = this.timestamps[0];
    return Math.max(0, (oldestTimestamp + this.windowMs) - Date.now());
  }
}

// Usage
const apiLimiter = new RateLimiter(60, 60000); // 60 requests per minute

async function recordPlayWithRateLimit(gameId: string, playData: PlayData) {
  if (!apiLimiter.canMakeRequest()) {
    const waitMs = apiLimiter.msUntilNextRequest();
    await new Promise(resolve => setTimeout(resolve, waitMs));
  }
  
  return recordPlay(gameId, playData);
}
```

---

## Testing Endpoints

### Health Check
```typescript
// GET /rest/v1/
async function healthCheck(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('teams').select('count');
    return !error;
  } catch {
    return false;
  }
}
```

### Test Authentication
```typescript
async function testAuth(): Promise<boolean> {
  const { data: { user }, error } = await supabase.auth.getUser();
  return !!user && !error;
}
```

### Test Real-time Connection
```typescript
async function testRealtime(): Promise<boolean> {
  return new Promise((resolve) => {
    const channel = supabase.channel('test');
    
    const timeout = setTimeout(() => {
      channel.unsubscribe();
      resolve(false);
    }, 5000);
    
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timeout);
        channel.unsubscribe();
        resolve(true);
      }
    });
  });
}
```

---

## Performance Optimization

### Query Optimization Patterns
```typescript
// Batch operations for better performance
async function batchUpdatePlayerStats(updates: Array<{
  playerId: string;
  stats: Partial<Player>;
}>) {
  // Use Promise.all for parallel updates
  const promises = updates.map(({ playerId, stats }) =>
    supabase
      .from('players')
      .update(stats)
      .eq('id', playerId)
  );
  
  const results = await Promise.all(promises);
  return results;
}

// Use select to limit returned data
async function getGameBasicInfo(gameId: string) {
  const { data, error } = await supabase
    .from('games')
    .select('id, status, our_score, opponent_score, current_quarter')
    .eq('id', gameId)
    .single();
    
  return data;
}

// Use pagination for large datasets
async function getPlaysPaginated(gameId: string, page = 0, pageSize = 50) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  
  const { data, error } = await supabase
    .from('plays')
    .select('*')
    .eq('game_id', gameId)
    .order('play_number', { ascending: false })
    .range(from, to);
    
  return data;
}
```

---

## Security Headers

### Required Headers for API Calls
```typescript
// Supabase client configuration with security headers
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      storageKey: 'cfl-tracker-auth',
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-client-version': '1.0.0',
        'x-client-platform': 'web'
      }
    }
  }
);
```

---

## Deployment Checklist

### Environment Variables Required
```bash
# .env.local (UI Engineer needs these Day 1)
PUBLIC_SUPABASE_URL=https://yepriyrcjmlmhrwpgqka.supabase.co
PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
PUBLIC_APP_URL=https://cfl-tracker.com

# .env (server-side only)
SUPABASE_SERVICE_KEY=[SERVICE_KEY]
```

### API Testing Checklist
- [ ] Authentication flow (signup, signin, signout)
- [ ] Team CRUD operations
- [ ] Player management (add, update, bulk import)
- [ ] Game creation and state updates
- [ ] Play recording (online and offline)
- [ ] Real-time subscriptions
- [ ] MPR dashboard calculations
- [ ] Share code access (public)
- [ ] Offline sync queue
- [ ] Edge function invocations

---

## Conclusion

This API specification provides a complete, pragmatic interface for the CFL Game Tracker with:
- Simple REST APIs auto-generated from the database schema
- Real-time subscriptions for live updates
- Edge Functions for complex operations
- TypeScript types for type-safe frontend development
- Robust offline sync capabilities
- Public data access via share codes (no complex auth)

The APIs are designed for fast, reliable game-day operation with minimal complexity.
