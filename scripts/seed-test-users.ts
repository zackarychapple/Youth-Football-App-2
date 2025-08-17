#!/usr/bin/env tsx
/**
 * Script to create test users and data in Supabase
 * Run with: pnpm tsx scripts/seed-test-users.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/types/database.types';

// Use service role key for admin operations
const SUPABASE_URL = 'https://yepriyrcjmlmhrwpgqka.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable is required');
  console.log('Add it to your .env file or set it in your environment');
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface TestUser {
  email: string;
  password: string;
  name: string;
  role: 'head_coach' | 'assistant_coach';
  teamName?: string;
}

const TEST_USERS: TestUser[] = [
  {
    email: 'coach.test@footballtracker.app',
    password: 'GameDay2025!',
    name: 'Coach Johnson',
    role: 'head_coach',
    teamName: 'Riverside Ravens'
  },
  {
    email: 'assistant.test@footballtracker.app', 
    password: 'GameDay2025!',
    name: 'Coach Davis',
    role: 'assistant_coach'
  }
];

const TEST_PLAYERS = [
  { name: 'Tommy Anderson', jersey_number: 7, position: 'QB', is_striped: false },
  { name: 'Billy Martinez', jersey_number: 12, position: 'RB', is_striped: true },
  { name: 'Jake Thompson', jersey_number: 23, position: 'WR', is_striped: false },
  { name: 'Chris Wilson', jersey_number: 88, position: 'WR', is_striped: false },
  { name: 'Mike Johnson', jersey_number: 45, position: 'LB', is_striped: false },
  { name: 'David Brown', jersey_number: 54, position: 'LB', is_striped: false },
  { name: 'Alex Davis', jersey_number: 33, position: 'DB', is_striped: false },
  { name: 'Ryan Miller', jersey_number: 21, position: 'DB', is_striped: false },
  { name: 'Kevin Garcia', jersey_number: 10, position: 'QB', is_striped: false },
  { name: 'Josh Rodriguez', jersey_number: 44, position: 'RB', is_striped: false },
  { name: 'Tyler Lee', jersey_number: 82, position: 'WR', is_striped: false },
  { name: 'Brandon White', jersey_number: 11, position: 'WR', is_striped: false },
  { name: 'Justin Harris', jersey_number: 56, position: 'OL', is_striped: false },
  { name: 'Andrew Clark', jersey_number: 77, position: 'OL', is_striped: false },
  { name: 'Matthew Lewis', jersey_number: 66, position: 'OL', is_striped: false },
  { name: 'Daniel Walker', jersey_number: 52, position: 'DL', is_striped: false },
  { name: 'Nathan Hall', jersey_number: 99, position: 'DL', is_striped: false },
  { name: 'Eric Allen', jersey_number: 91, position: 'DL', is_striped: false },
  { name: 'Kyle Young', jersey_number: 24, position: 'DB', is_striped: false },
  { name: 'Sean King', jersey_number: 31, position: 'LB', is_striped: false },
  { name: 'Jason Scott', jersey_number: 42, position: 'LB', is_striped: false },
  { name: 'Steven Green', jersey_number: 15, position: 'K', is_striped: false }
];

async function createTestUser(user: TestUser) {
  console.log(`Creating user: ${user.email}`);
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      name: user.name
    }
  });

  if (authError) {
    if (authError.message.includes('already exists')) {
      console.log(`  ⚠️  User ${user.email} already exists, skipping...`);
      
      // Get existing user
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users?.find(u => u.email === user.email);
      return existingUser?.id;
    }
    console.error(`  ❌ Error creating user ${user.email}:`, authError);
    return null;
  }

  console.log(`  ✅ User created: ${authData.user?.id}`);
  return authData.user?.id;
}

async function createTeamAndPlayers(userId: string, teamName: string, coachName: string, email: string) {
  console.log(`\nCreating team: ${teamName}`);
  
  // Create team with RPC function
  const { data: teamData, error: teamError } = await supabase.rpc('create_team_with_coach', {
    p_name: teamName,
    p_user_id: userId,
    p_coach_email: email,
    p_coach_name: coachName
  });

  if (teamError) {
    console.error(`  ❌ Error creating team:`, teamError);
    return null;
  }

  const teamId = teamData?.[0]?.id;
  if (!teamId) {
    console.error(`  ❌ No team ID returned`);
    return null;
  }

  console.log(`  ✅ Team created: ${teamId}`);
  console.log(`  📝 Invite code: ${teamData[0].invite_code}`);

  // Add players to the team
  console.log(`\nAdding ${TEST_PLAYERS.length} players to team...`);
  
  const { data: players, error: playerError } = await supabase
    .from('players')
    .insert(
      TEST_PLAYERS.map(player => ({
        ...player,
        team_id: teamId
      }))
    )
    .select();

  if (playerError) {
    console.error(`  ❌ Error adding players:`, playerError);
    return teamId;
  }

  console.log(`  ✅ Added ${players?.length || 0} players to team`);
  return teamId;
}

async function main() {
  console.log('🚀 Starting test data seed...\n');
  
  let headCoachId: string | null = null;
  let teamId: string | null = null;

  // Create head coach and team
  const headCoach = TEST_USERS[0];
  headCoachId = await createTestUser(headCoach);
  
  if (headCoachId && headCoach.teamName) {
    teamId = await createTeamAndPlayers(
      headCoachId, 
      headCoach.teamName,
      headCoach.name,
      headCoach.email
    );
  }

  // Create assistant coach
  const assistantCoach = TEST_USERS[1];
  const assistantId = await createTestUser(assistantCoach);

  // Add assistant coach to team if both exist
  if (assistantId && teamId) {
    console.log(`\nAdding assistant coach to team...`);
    const { error } = await supabase
      .from('team_coaches')
      .insert({
        team_id: teamId,
        user_id: assistantId,
        role: 'assistant_coach',
        name: assistantCoach.name,
        email: assistantCoach.email
      });

    if (error) {
      console.error(`  ❌ Error adding assistant coach:`, error);
    } else {
      console.log(`  ✅ Assistant coach added to team`);
    }
  }

  console.log('\n✅ Test data seed complete!');
  console.log('\n📋 Test Credentials:');
  console.log('  Head Coach:');
  console.log('    Email: coach.test@footballtracker.app');
  console.log('    Password: GameDay2025!');
  console.log('  Assistant Coach:');  
  console.log('    Email: assistant.test@footballtracker.app');
  console.log('    Password: GameDay2025!');
  console.log('\n🏈 Ready for testing!');
}

main().catch(console.error);