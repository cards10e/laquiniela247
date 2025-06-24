# Issue #11: Single Bets Not Persisting (Endless Betting Bug)

**Status**: ✅ Fixed  
**Priority**: Critical  
**Type**: Database Bug  
**Reported By**: User Testing  
**Date**: January 18, 2025  
**Fixed**: January 18, 2025  

## Description
Single bets appear to be placed successfully (200 OK response) but disappear after user logout/login. Users can place "endless" single bets on the same game without seeing previous bets.

## Symptoms
- Single bet API returns 200 OK status
- No single bets persist in database after placement
- Users can repeatedly place bets on same game
- Only parlay bets persist correctly
- Debug logs show bet creation attempts but no database records

## Root Cause
**Database unique constraint violation**
- Database had constraint: `UNIQUE KEY (user_id, game_id)` 
- This prevented placing both single AND parlay bets on the same game by the same user
- When user already had parlay bets, single bet attempts failed silently due to constraint violation
- API returned 200 OK but database transaction was rejected

## Technical Analysis
- User had existing parlay bets on games 44 & 46 (week 25)
- Attempting single bets on same games violated unique constraint `(user_id=1, game_id=44)`
- Prisma/MySQL silently rejected inserts but didn't throw visible errors
- Backend validation passed, API responded 200 OK, but no database record created

## Solution
**Database schema fix**
- **Dropped old constraint**: `ALTER TABLE bets DROP INDEX bets_user_id_game_id_key`
- **Added new constraint**: `ALTER TABLE bets ADD UNIQUE KEY bets_user_id_game_id_bet_type_key (user_id, game_id, bet_type)`
- **New constraint allows**: User can have BOTH single bet AND parlay bet on same game
- **Prevents**: Duplicate bets of same type on same game by same user

## Fix Applied
- ✅ Updated Prisma schema: `@@unique([userId, gameId, betType])`
- ✅ Applied direct database migration to production
- ✅ Verified constraint: `UNIQUE KEY bets_user_id_game_id_bet_type_key (user_id,game_id,bet_type)`

## Testing Status
Ready for testing - users should now be able to place single bets on games with existing parlay bets

## Impact
Restored core single betting functionality, eliminated user confusion about "endless betting"

## Files Modified
- Database schema/migrations
- Prisma schema definitions 