# Supabase Setup Guide

## Quick Setup for Testing

To get the app working with test users, you need to disable email confirmation in Supabase.

### 1. Disable Email Confirmation

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/yepriyrcjmlmhrwpgqka
2. Navigate to **Authentication** → **Providers** → **Email**
3. Toggle OFF "Confirm email"
4. Click "Save"

### 2. Test Users

Create these test users by running:
```bash
pnpm tsx scripts/seed-test-users-simple.ts
```

**Head Coach:**
- Email: `zackarychapple30+testcoach@gmail.com`
- Password: `GameDay2025!`

**Assistant Coach:**
- Email: `zackarychapple30+testassistant@gmail.com`
- Password: `GameDay2025!`

These Gmail addresses with + aliases will receive emails and work without confirmation issues.

### 3. Manual Email Confirmation (Alternative)

If you prefer to keep email confirmation enabled:

1. Go to **Authentication** → **Users**
2. Find the test users
3. Click on each user
4. Click "Confirm Email"

### 4. Running Tests

Once email confirmation is handled, run the tests:

```bash
# Run all E2E tests
pnpm test:e2e

# Run with visible browser (for debugging)
pnpm test:e2e:debug

# Run auth tests only
pnpm test:e2e:auth
```

### 5. Database Migrations Needed

The following database functions need to be created for full functionality:

```sql
-- Create team with coach RPC function
CREATE OR REPLACE FUNCTION create_team_with_coach(
  p_name TEXT,
  p_user_id UUID,
  p_coach_email TEXT,
  p_coach_name TEXT
)
RETURNS TABLE(id UUID, name TEXT, invite_code TEXT) AS $$
BEGIN
  -- Implementation from database-migrations.md
END;
$$ LANGUAGE plpgsql;
```

See `/PRD/database-migrations.md` for full migration scripts.

## Troubleshooting

### Login Error: "Email not confirmed"
- Solution: Disable email confirmation or manually confirm users in Supabase dashboard

### Login Error: "Invalid login credentials"  
- Solution: Ensure test users exist (run `pnpm tsx scripts/seed-test-users-simple.ts`)

### Team Creation Error: "Function not found"
- Solution: Run database migrations from `/supabase/migrations/`

## Next Steps

1. Disable email confirmation in Supabase dashboard
2. Run the E2E tests to verify authentication works
3. Create teams and players for testing
4. Run full game simulation tests