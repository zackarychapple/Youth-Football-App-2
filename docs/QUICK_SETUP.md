# Quick Setup Guide - Action Required

## 🚨 Email Confirmation Issue

The test users have been created but **email confirmation is blocking login**.

## ✅ Quick Fix (Recommended)

### Option 1: Disable Email Confirmation (Fastest)

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/yepriyrcjmlmhrwpgqka/auth/providers
   
2. **Disable Email Confirmation**
   - Click on "Email" provider
   - Toggle OFF "Confirm email" 
   - Click "Save"

3. **Test Login**
   ```bash
   pnpm test:e2e:auth
   ```

### Option 2: Manually Confirm Emails

1. **Go to Users Page**
   - URL: https://supabase.com/dashboard/project/yepriyrcjmlmhrwpgqka/auth/users
   
2. **Confirm Each User**
   - Find `zackarychapple30+testcoach@gmail.com` (ID: 297f43b3-b069-4acb-81d2-4e4c9b62030c)
   - Click on the user
   - Click "Confirm Email"
   - Repeat for `zackarychapple30+testassistant@gmail.com` (ID: 44a2c14b-0f8d-4f30-9e07-6cd12377a5d7)

## 📧 Test Users Created

| Role | Email | Password | User ID |
|------|-------|----------|---------|
| Head Coach | zackarychapple30+testcoach@gmail.com | GameDay2025! | 297f43b3-b069-4acb-81d2-4e4c9b62030c |
| Assistant Coach | zackarychapple30+testassistant@gmail.com | GameDay2025! | 44a2c14b-0f8d-4f30-9e07-6cd12377a5d7 |

## 🧪 Testing Commands

Once email confirmation is resolved:

```bash
# Run all auth tests
pnpm test:e2e:auth

# Debug mode (visible browser)
pnpm test:e2e:debug

# Check if login works manually
# Visit: http://localhost:3000/auth/sign-in
# Use: zackarychapple30+testcoach@gmail.com / GameDay2025!
```

## ✅ What's Working

- ✅ Test users created in Supabase
- ✅ Puppeteer testing framework configured
- ✅ E2E tests written and ready
- ✅ App running at http://localhost:3000
- ⏳ Waiting for email confirmation to be disabled/confirmed

## 🚀 Next Steps After Email Confirmation

1. Run E2E tests to verify login works
2. Create teams and players
3. Test game day workflows
4. Run MPR tracking tests

---

**Action Required:** Please disable email confirmation or manually confirm the test users in Supabase dashboard to proceed with testing.