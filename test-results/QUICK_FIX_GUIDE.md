# Quick Fix Guide - Login Issues

## Immediate Fix (5 minutes)

### Option 1: Create Test Users in Supabase

1. Go to your Supabase dashboard: https://app.supabase.com
2. Navigate to Authentication > Users
3. Click "Add User" and create:
   ```
   Email: coach.test@footballtracker.app
   Password: GameDay2025!
   ```

### Option 2: Use Existing Credentials

1. Create a `.env` file in the project root:
   ```env
   PUBLIC_SUPABASE_URL=https://yepriyrcjmlmhrwpgqka.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=[get from Supabase dashboard]
   ```

2. Use SQL Editor in Supabase to create test user:
   ```sql
   -- Run in Supabase SQL Editor
   INSERT INTO auth.users (
     id,
     email,
     encrypted_password,
     email_confirmed_at,
     created_at,
     updated_at,
     raw_user_meta_data
   ) VALUES (
     gen_random_uuid(),
     'coach.test@footballtracker.app',
     crypt('GameDay2025!', gen_salt('bf')),
     now(),
     now(),
     now(),
     '{"name": "Test Coach"}'::jsonb
   );
   ```

## Testing the Fix

1. Restart the dev server:
   ```bash
   pnpm dev
   ```

2. Test manually:
   - Go to http://localhost:3000/auth/sign-in
   - Enter: coach.test@footballtracker.app / GameDay2025!
   - Should redirect to dashboard

3. Run E2E tests:
   ```bash
   pnpm test:e2e:auth
   ```

## Alternative: Use Mock Auth (No Backend Required)

1. Update `src/lib/supabase.ts` temporarily:
   ```typescript
   // Add at the top of the file for testing
   if (import.meta.env.DEV) {
     window.localStorage.setItem('mock-auth', 'true');
   }
   ```

2. Create mock responses in `src/stores/auth.store.ts`:
   ```typescript
   signIn: async (credentials) => {
     // Add mock mode for testing
     if (window.localStorage.getItem('mock-auth')) {
       if (credentials.email === 'coach.test@footballtracker.app' 
           && credentials.password === 'GameDay2025!') {
         set({
           user: { id: 'test-1', email: credentials.email },
           session: { access_token: 'mock-token' },
           isAuthenticated: true,
           isLoading: false
         });
         return;
       }
     }
     // ... existing code
   }
   ```

## Verify Fix is Working

Check for these success indicators:

✅ No more 400 errors in console  
✅ Successful redirect to /dashboard after login  
✅ User email displayed in dashboard  
✅ E2E tests show "TEST PASSED" for valid login  

## If Still Not Working

1. Check Supabase service status: https://status.supabase.com
2. Verify network connectivity
3. Clear browser cache and localStorage
4. Check for typos in credentials
5. Ensure Supabase project is not paused

## Contact for Help

- Supabase Discord: https://discord.supabase.com
- Project documentation: /PRD/test-requirements.md
- Test credentials: See section 1 of test requirements

---

**Remember**: These test credentials should NOT be used in production!