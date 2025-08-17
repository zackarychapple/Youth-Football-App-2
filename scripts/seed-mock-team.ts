#!/usr/bin/env tsx
/**
 * Script to create Coach Zack's mock team from initial_team.json
 * Run with: pnpm tsx scripts/seed-mock-team.ts
 */

import { createClient } from '@supabase/supabase-js';
import teamData from '../PRD/initial_team.json';

const SUPABASE_URL = 'https://yepriyrcjmlmhrwpgqka.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllcHJpeXJjam1sbWhyd3BncWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODk5OTcsImV4cCI6MjA3MDk2NTk5N30.Fo2U0TWiROv-mru9PIrFSEfAk2rBpzp_vpTiahVVjvE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Coach Zack's credentials
const COACH_EMAIL = 'zackarychapple30+mock1@gmail.com';
const COACH_PASSWORD = 'GameDay2025!';
const COACH_NAME = 'Coach Zack';

async function createMockTeam() {
  console.log('🏈 Creating mock team for Coach Zack...\n');

  try {
    // Step 1: Create or sign in Coach Zack
    console.log('Creating Coach Zack account...');
    let userId: string | undefined;
    
    // First try to sign up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: COACH_EMAIL,
      password: COACH_PASSWORD,
      options: {
        data: {
          name: COACH_NAME,
          role: 'head_coach'
        }
      }
    });

    if (signUpError?.message?.includes('already registered')) {
      console.log('Coach Zack already exists, signing in...');
      // Sign in if already exists
      const { data: signInData, error: signInError } = await supabase.auth.signIn({
        email: COACH_EMAIL,
        password: COACH_PASSWORD
      });
      
      if (signInError) {
        console.error('❌ Error signing in:', signInError.message);
        return;
      }
      userId = signInData?.user?.id;
    } else if (signUpError) {
      console.error('❌ Error creating account:', signUpError.message);
      return;
    } else {
      userId = signUpData?.user?.id;
      console.log('✅ Coach Zack account created');
    }

    if (!userId) {
      console.error('❌ No user ID found');
      return;
    }

    // Step 2: Create the team
    console.log(`\nCreating team: ${teamData.team} (${teamData.grade} Grade)...`);
    
    const { data: teamResult, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: `${teamData.team} - ${teamData.grade}`,
        created_by: userId,
        invite_code: Math.random().toString(36).substring(2, 8).toUpperCase()
      })
      .select()
      .single();

    if (teamError) {
      // Check if team already exists
      const { data: existingTeam } = await supabase
        .from('teams')
        .select()
        .eq('created_by', userId)
        .single();
        
      if (existingTeam) {
        console.log('✅ Team already exists:', existingTeam.name);
        
        // Step 3: Add players to existing team
        console.log(`\nAdding ${teamData.players.length} players to team...`);
        
        // Check existing players
        const { data: existingPlayers } = await supabase
          .from('players')
          .select('jersey_number')
          .eq('team_id', existingTeam.id);
        
        const existingNumbers = new Set(existingPlayers?.map(p => p.jersey_number) || []);
        const newPlayers = teamData.players.filter(p => !existingNumbers.has(p.number));
        
        if (newPlayers.length > 0) {
          const playerData = newPlayers.map(player => ({
            team_id: existingTeam.id,
            name: player.name,
            jersey_number: player.number,
            position: guessPosition(player.number),
            is_striped: false
          }));

          const { data: players, error: playerError } = await supabase
            .from('players')
            .insert(playerData);

          if (playerError) {
            console.error('❌ Error adding players:', playerError.message);
          } else {
            console.log(`✅ Added ${newPlayers.length} new players to team`);
          }
        } else {
          console.log('✅ All players already exist');
        }
        
        // Add Coach Zack to team_coaches
        const { error: coachError } = await supabase
          .from('team_coaches')
          .upsert({
            team_id: existingTeam.id,
            user_id: userId,
            role: 'head_coach',
            name: COACH_NAME,
            email: COACH_EMAIL
          }, {
            onConflict: 'team_id,user_id'
          });
          
        if (!coachError) {
          console.log('✅ Coach Zack added to team');
        }
        
        printSummary(existingTeam);
        return;
      }
      
      console.error('❌ Error creating team:', teamError.message);
      return;
    }

    console.log('✅ Team created:', teamResult.name);
    console.log('📋 Invite code:', teamResult.invite_code);

    // Step 3: Add players to the team
    console.log(`\nAdding ${teamData.players.length} players to team...`);
    
    const playerData = teamData.players.map(player => ({
      team_id: teamResult.id,
      name: player.name,
      jersey_number: player.number,
      position: guessPosition(player.number),
      is_striped: false
    }));

    const { data: players, error: playerError } = await supabase
      .from('players')
      .insert(playerData);

    if (playerError) {
      console.error('❌ Error adding players:', playerError.message);
    } else {
      console.log(`✅ Added ${teamData.players.length} players to team`);
    }

    // Step 4: Add Coach Zack to team_coaches
    const { error: coachError } = await supabase
      .from('team_coaches')
      .insert({
        team_id: teamResult.id,
        user_id: userId,
        role: 'head_coach',
        name: COACH_NAME,
        email: COACH_EMAIL
      });

    if (coachError) {
      console.error('❌ Error adding coach to team:', coachError.message);
    } else {
      console.log('✅ Coach Zack added as head coach');
    }

    printSummary(teamResult);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

function guessPosition(jerseyNumber: number): string {
  // Common position assignments by jersey number
  if (jerseyNumber >= 1 && jerseyNumber <= 19) return 'QB/RB';
  if (jerseyNumber >= 20 && jerseyNumber <= 49) return 'RB/DB';
  if (jerseyNumber >= 50 && jerseyNumber <= 79) return 'OL/DL';
  if (jerseyNumber >= 80 && jerseyNumber <= 89) return 'WR/TE';
  if (jerseyNumber >= 90 && jerseyNumber <= 99) return 'DL';
  return 'FLEX';
}

function printSummary(team: any) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 MOCK TEAM CREATED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log('\n🏈 Team Details:');
  console.log(`   Name: ${team.name}`);
  console.log(`   Invite Code: ${team.invite_code}`);
  console.log(`   Players: ${teamData.players.length}`);
  
  console.log('\n👤 Login Credentials:');
  console.log(`   Email: ${COACH_EMAIL}`);
  console.log(`   Password: ${COACH_PASSWORD}`);
  
  console.log('\n📱 To Test:');
  console.log('   1. Go to http://localhost:3000');
  console.log('   2. Sign in with the credentials above');
  console.log('   3. You should see your team and roster ready to use!');
  
  console.log('\n👥 Roster:');
  teamData.players.forEach(p => {
    console.log(`   #${p.number.toString().padStart(2, ' ')} - ${p.name}`);
  });
  
  console.log('\n🎯 Ready for game day testing!');
  console.log('='.repeat(60));
}

// Run the script
createMockTeam().catch(console.error);