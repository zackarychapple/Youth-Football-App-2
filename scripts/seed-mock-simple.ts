#!/usr/bin/env tsx
/**
 * Simple script to create Coach Zack's account
 * Run with: pnpm tsx scripts/seed-mock-simple.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yepriyrcjmlmhrwpgqka.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllcHJpeXJjam1sbWhyd3BncWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODk5OTcsImV4cCI6MjA3MDk2NTk5N30.Fo2U0TWiROv-mru9PIrFSEfAk2rBpzp_vpTiahVVjvE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Coach Zack's credentials
const COACH_EMAIL = 'zackarychapple30+mock1@gmail.com';
const COACH_PASSWORD = 'GameDay2025!';

async function createCoachZack() {
  console.log('🏈 Creating Coach Zack account...\n');

  // Create account
  const { data, error } = await supabase.auth.signUp({
    email: COACH_EMAIL,
    password: COACH_PASSWORD,
    options: {
      data: {
        name: 'Coach Zack',
        role: 'head_coach'
      }
    }
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('✅ Coach Zack account already exists');
    } else {
      console.error('❌ Error creating account:', error.message);
      return;
    }
  } else {
    console.log('✅ Coach Zack account created');
    console.log('   ID:', data.user?.id);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 ACCOUNT READY!');
  console.log('='.repeat(60));
  console.log('\n👤 Login Credentials:');
  console.log(`   Email: ${COACH_EMAIL}`);
  console.log(`   Password: ${COACH_PASSWORD}`);
  console.log('\n📱 To Test:');
  console.log('   1. Go to http://localhost:3000');
  console.log('   2. Sign in with the credentials above');
  console.log('\n⚠️  Note: Email confirmation may be required.');
  console.log('   Check Supabase dashboard to confirm the email.');
  console.log('='.repeat(60));
}

createCoachZack().catch(console.error);