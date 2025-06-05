# Week Not Found Error in Game Creation

## Issue Description
When attempting to create a new game through the admin panel, the system returns a "Week not found" error (404) despite the week existing in the database.

## Current Behavior
1. Admin attempts to create a game
2. Backend validates the request
3. Week lookup fails with "Week not found" error
4. Game creation is aborted

## Technical Investigation

### Database State
- Weeks exist in the database for season 2025 (weeks 95-99)
- Latest week (99) is in "open" status
- All weeks have proper start_date, end_date, and betting_deadline values

### Code Analysis

#### Current Implementation
1. **Week Lookup in Game Creation**
```typescript
const week = await prisma.week.findUnique({
  where: { 
    weekNumber_season: { 
      weekNumber: validatedData.weekNumber, 
      season: validatedData.season 
    } 
  }
});
```

2. **Schema Definition**
```typescript
const createGameSchema = z.object({
  weekNumber: z.number().int().positive(),
  season: z.string().min(1),
  homeTeamId: z.number().int().positive(),
  awayTeamId: z.number().int().positive(),
  matchDate: z.string().datetime()
});
```

### Attempted Solutions
1. ✅ Added `season` to the game creation schema
2. ✅ Updated week lookup to use compound key (`weekNumber`, `season`)
3. ✅ Verified week existence in database
4. ✅ Removed `season` from game creation data (not part of Game model)

### Not Yet Attempted
1. ❌ Debug logging of the exact values being used in the lookup
2. ❌ Verification of the compound key constraint in Prisma schema
3. ❌ Check for race conditions between week creation and game creation
4. ❌ Verify frontend is sending the correct season value

## Expert Assessment

### Potential Root Causes
1. **Schema Mismatch**: The compound key constraint might not be properly defined in the Prisma schema
2. **Data Validation**: The season value might not match exactly (case sensitivity, whitespace, etc.)
3. **Race Condition**: Week creation might not be fully committed when game creation is attempted
4. **Frontend Issue**: The season value might not be correctly passed from the frontend

### Recommended Next Steps
1. Add debug logging to capture exact values:
```typescript
console.log('Week lookup params:', {
  weekNumber: validatedData.weekNumber,
  season: validatedData.season
});
```

2. Verify Prisma schema compound key:
```prisma
model Week {
  weekNumber Int
  season     String
  @@unique([weekNumber, season])
}
```

3. Add transaction to ensure week exists:
```typescript
const result = await prisma.$transaction(async (tx) => {
  const week = await tx.week.findUnique({
    where: { 
      weekNumber_season: { 
        weekNumber: validatedData.weekNumber, 
        season: validatedData.season 
      } 
    }
  });
  if (!week) throw createError('Week not found', 404);
  
  return tx.game.create({
    data: {
      weekNumber: validatedData.weekNumber,
      homeTeamId: validatedData.homeTeamId,
      awayTeamId: validatedData.awayTeamId,
      matchDate: new Date(validatedData.matchDate)
    }
  });
});
```

4. Verify frontend payload:
```typescript
// In frontend code
console.log('Creating game with data:', {
  weekNumber,
  season,
  homeTeamId,
  awayTeamId,
  matchDate
});
```

## Impact
- **Severity**: High
- **Scope**: Game creation functionality
- **Users Affected**: Administrators
- **Business Impact**: Unable to create new games, affecting the core functionality of the application

## Dependencies
- Prisma ORM
- Express.js backend
- Next.js frontend
- MySQL database

## Related Components
- Admin panel
- Game creation workflow
- Week management system

## Timeline
- Issue first observed: [Date]
- Last attempted fix: [Date]
- Current status: Under investigation

## Notes
- The issue appears to be related to the compound key lookup rather than data existence
- The week exists in the database but is not being found during the lookup
- The error occurs consistently, suggesting a systematic issue rather than a race condition 