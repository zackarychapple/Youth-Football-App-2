#!/usr/bin/env tsx
/**
 * Simple script to create test users via Supabase Auth
 * Run with: pnpm tsx scripts/seed-test-users-simple.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yepriyrcjmlmhrwpgqka.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllcHJpeXJjam1sbWhyd3BncWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODk5OTcsImV4cCI6MjA3MDk2NTk5N30.Fo2U0TWiROv-mru9PIrFSEfAk2rBpzp_vpTiahVVjvE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTestUsers() {
  console.log('🚀 Creating test users...\n');

  // Sign up head coach
  console.log('Creating head coach account...');
  const { data: headCoach, error: headCoachError } = await supabase.auth.signUp({
    email: 'zackarychapple30+testcoach@gmail.com',
    password: 'GameDay2025!',
    options: {
      data: {
        name: 'Coach Johnson',
        role: 'head_coach'
      }
    }
  });

  if (headCoachError) {
    console.error('❌ Error creating head coach:', headCoachError.message);
  } else if (headCoach.user) {
    console.log('✅ Head coach created:', headCoach.user.email);
    console.log('   ID:', headCoach.user.id);
    
    // Create team for head coach
    const { data: team, error: teamError } = await supabase
      .rpc('create_team_with_coach', {
        p_name: 'Riverside Ravens',
        p_user_id: headCoach.user.id,
        p_coach_email: 'zackarychapple30+testcoach@gmail.com',
        p_coach_name: 'Coach Johnson'
      });

    if (teamError) {
      console.error('❌ Error creating team:', teamError.message);
    } else {
      console.log('✅ Team created: Riverside Ravens');
      if (team?.[0]?.invite_code) {
        console.log('   Invite code:', team[0].invite_code);
      }
    }
  }

  // Sign up assistant coach
  console.log('\nCreating assistant coach account...');
  const { data: assistant, error: assistantError } = await supabase.auth.signUp({
    email: 'zackarychapple30+testassistant@gmail.com',
    password: 'GameDay2025!',
    options: {
      data: {
        name: 'Coach Davis',
        role: 'assistant_coach'
      }
    }
  });

  if (assistantError) {
    console.error('❌ Error creating assistant coach:', assistantError.message);
  } else if (assistant.user) {
    console.log('✅ Assistant coach created:', assistant.user.email);
    console.log('   ID:', assistant.user.id);
  }

  console.log('\n📋 Test Credentials Created:');
  console.log('================================');
  console.log('Head Coach:');
  console.log('  Email: zackarychapple30+testcoach@gmail.com');
  console.log('  Password: GameDay2025!');
  console.log('\nAssistant Coach:');
  console.log('  Email: zackarychapple30+testassistant@gmail.com');
  console.log('  Password: GameDay2025!');
  console.log('================================\n');
  console.log('⚠️  Note: You may need to confirm email addresses in Supabase dashboard');
  console.log('   or disable email confirmation in Authentication settings.\n');
}

createTestUsers().catch(console.error);