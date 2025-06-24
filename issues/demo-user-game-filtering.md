# Issue #13: Demo User Game Filtering - Missing Existing Bets Display

**Status**: ✅ Fixed  
**Priority**: High  
**Type**: Frontend Logic Bug  
**Reported By**: User Testing  
**Date**: January 24, 2025  
**Fixed**: January 24, 2025  

## Description
Demo users could only see games without existing bets in the betting interface, missing the section that should show their current bets for review. The intended behavior was to show **both** games with existing bets AND games available for new betting.

## Symptoms
- Production: Demo user sees only 1 game on Single Bets tab (games without bets)
- Production: Admin user sees 6 games correctly 
- Local dev: Both users see 3 games correctly
- Missing "Active Bets Placed" section entirely
- Users couldn't review their existing current week bets

## Root Cause Analysis

### Initial Investigation
1. **Backend API verified**: `/api/games/current-week` correctly returned all games with proper user bet data
2. **Database comparison**:
   - Local dev: User 12 has 3 single bets on games 54, 55, 56 (all visible)
   - Production: Demo user (ID 1) has 2 single bets on games 54, 55 only (only game 56 visible)

### Root Cause Found
**Frontend filtering logic bug** in `frontend/src/pages/bet.tsx` lines 767-768:

```typescript
// BROKEN CODE
const effectiveGamesWithBets = showCurrentWeekOnly ? [] : gamesWithBets;
const effectiveHasAnyBets = showCurrentWeekOnly ? false : hasAnyBets;
```

Since `showCurrentWeekOnly` was hardcoded to `true`, this meant:
- `effectiveGamesWithBets = []` (empty array)
- The "Games with Existing Bets" section was never rendered
- Only `gamesWithoutBets` section was shown

## Expected vs Actual Behavior

### Expected (Intended Design)
```
SINGLE BETS TAB:
├── Active Bets Placed (existing single bets for current week)
│   ├── Game 54: Demo user bet AWAY ✓
│   └── Game 55: Demo user bet AWAY ✓
└── Games Available to Bet (games without single bets)
    └── Game 56: Available for new single bet
```

### Actual (Broken)
```
SINGLE BETS TAB:
├── Active Bets Placed (HIDDEN - empty array)
└── Games Available to Bet 
    └── Game 56: Available for new single bet
```

## Technical Solution

### Code Fix
Changed lines 767-768 in `frontend/src/pages/bet.tsx`:

```typescript
// BEFORE (BROKEN)
const effectiveGamesWithBets = showCurrentWeekOnly ? [] : gamesWithBets;
const effectiveHasAnyBets = showCurrentWeekOnly ? false : hasAnyBets;

// AFTER (FIXED)
const effectiveGamesWithBets = gamesWithBets;
const effectiveHasAnyBets = hasAnyBets;
```

### Impact
- ✅ **Single Bets Tab**: Now shows existing single bets + available games
- ✅ **La Quiniela Tab**: Now shows existing parlay bets + available games  
- ✅ **Both environments**: Local dev and production now consistent
- ✅ **User experience**: Complete view of current week betting status

## Fix Applied
- ✅ Updated `frontend/src/pages/bet.tsx` 
- ✅ Applied to local development codebase
- ✅ Deployed to production at `https://laquiniela247demo.live`
- ✅ Verified fix works for both betting modes (single + parlay)

## Testing Results
**Production verification**:
- Demo user now sees existing bets section for games 54 & 55
- Demo user still sees available betting section for game 56
- Complete betting interface restored

## User Experience Impact
- Restored ability to review existing current week bets
- Eliminated confusion about "missing" placed bets
- Consistent behavior between single bets and La Quiniela tabs
- Proper current week focus maintained

## Files Modified
- `frontend/src/pages/bet.tsx` (lines 767-768)

## Related Issues
- Connects to overall current week betting focus design
- Fixes user experience gap in bet review functionality 