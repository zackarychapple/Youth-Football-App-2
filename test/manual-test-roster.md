# Manual Test Guide - Roster Management

## Test Account
- Email: zackarychapple30+testcoach@gmail.com
- Password: GameDay2025!

## Test Steps

### 1. Sign In and Navigate
1. Go to http://localhost:3000/auth/sign-in
2. Sign in with test credentials
3. Navigate to Roster from the sidebar or dashboard

### 2. Add Individual Player
1. Click "Add Player" button
2. Enter jersey number using number pad
3. Enter player name
4. Select position (optional)
5. Toggle "Striped" if needed
6. Save player

### 3. Bulk Import Players
1. Click "Bulk Import Roster"
2. Paste this sample data:
```
10 John Smith QB
22 Mike Johnson RB
33 David Williams WR
44 Tom Anderson OL
55 Chris Taylor TE
66 Matt Brown DL
77 Steve Davis LB
88 Kevin Wilson DB
99 James Miller S
```
3. Preview and import

### 4. Player Management
1. **Toggle Striped Status**: Tap on any player card to toggle striped status
2. **Edit Player**: Swipe right on a player card
3. **Delete Player**: Swipe left on a player card
4. **Search**: Use search bar to find players by name or number
5. **Filter**: Toggle "Show Striped" to filter players
6. **View Modes**: Switch between "By Position" and "All Players" tabs

### 5. Position Groups
1. In "By Position" view, expand/collapse position groups
2. Verify players are grouped correctly
3. Check striped count badges

## Expected Results
- ✅ Players are added successfully
- ✅ Bulk import parses and adds multiple players
- ✅ Swipe gestures work smoothly
- ✅ Striped players show yellow badge
- ✅ Search filters players in real-time
- ✅ Position groups organize players correctly
- ✅ All touch targets are at least 56px height
- ✅ Forms are optimized for mobile input

## Performance Targets
- Add single player: < 2 seconds
- Bulk import 20 players: < 2 minutes
- Swipe response: Immediate
- Search filtering: < 100ms