# Day 2 Quick Start Guide

## FOR SUPABASE ARCHITECT - START NOW

### Your Immediate Tasks (9:00 AM)
1. Connect to Supabase project:
   ```bash
   # Project URL: https://yepriyrcjmlmhrwpgqka.supabase.co
   # Check .env file for keys
   ```

2. Run migrations in this order:
   - 001_initial_schema.sql
   - 002_teams_and_rosters.sql
   - 003_games_and_plays.sql
   - 004_mppr_tracking.sql
   - 005_auth_and_permissions.sql
   - 006_indexes_and_performance.sql
   - 007_functions_and_triggers.sql

3. Generate TypeScript types:
   ```bash
   npx supabase gen types typescript --project-id yepriyrcjmlmhrwpgqka > src/types/supabase.ts
   ```

4. **CRITICAL HANDOFF at 10:30 AM:** Send types file to UI Engineer

### Your Afternoon Tasks (11:00 AM - 5:00 PM)
- Set up authentication helpers
- Create team/roster CRUD operations
- Implement share code generation
- Test everything with Postman

---

## FOR UI ENGINEER - START NOW

### Your Immediate Tasks (9:00 AM)
1. Create project structure:
   ```bash
   mkdir -p src/{components,hooks,stores,lib,types,styles}
   mkdir -p src/components/{game-tracker,roster,auth,shared}
   ```

2. Install dependencies:
   ```bash
   pnpm install @rsbuild/core @rsbuild/plugin-react @rsbuild/plugin-pwa
   pnpm install @tanstack/react-router@latest
   pnpm install tailwindcss@next @tailwindcss/vite@next
   pnpm install zustand @supabase/supabase-js
   ```

3. Configure Rsbuild (rsbuild.config.ts):
   ```typescript
   import { defineConfig } from '@rsbuild/core';
   import { pluginReact } from '@rsbuild/plugin-react';
   import { pluginPwa } from '@rsbuild/plugin-pwa';
   
   export default defineConfig({
     plugins: [pluginReact(), pluginPwa()],
     source: {
       define: {
         'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
         'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
       },
     },
   });
   ```

4. **WAIT FOR 10:30 AM:** Receive TypeScript types from Supabase Architect

### Your Afternoon Tasks (11:00 AM - 5:00 PM)
- Set up TanStack Router with auth guards
- Create authentication UI components
- Implement Zustand stores
- Test offline behavior

---

## Critical Information

### Supabase Connection
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yepriyrcjmlmhrwpgqka.supabase.co'
const supabaseAnonKey = // get from .env file

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Environment Variables
- Located in `.env` file at project root
- Use `import.meta.env` pattern (NOT process.env in browser code)
- Prefix with VITE_ for Rsbuild

### Coordination Points Today
- **10:30 AM** - TypeScript types handoff
- **12:00 PM** - Progress check
- **2:00 PM** - Auth integration confirmation  
- **4:00 PM** - End of day sync

---

## Success Metrics for Today
- [ ] Database migrations complete
- [ ] TypeScript types generated
- [ ] Rsbuild project running
- [ ] Authentication working end-to-end
- [ ] Can create user account
- [ ] Can sign in/out

---

## If You Get Blocked
1. Try for 15 minutes on your own
2. Check the PRD folder for specifications
3. Message the other engineer
4. Escalate to PM after 30 minutes

---

## Remember
- Build for coaches with gloved hands
- Every feature must work offline
- 20-second play clock is our benchmark
- Simplicity > Features

**START CODING NOW!**
