# Issue #8: Betting Window Control - Incorrect Open Week Count

**Status**: ✅ Fixed  
**Priority**: Critical  
**Type**: Logic Bug  
**Reported By**: User Testing  
**Date**: January 16, 2025  
**Fixed**: January 16, 2025  

## Description
Betting window control was displaying "4 weeks open" when there were only 2 weeks actually open for betting

## Impact
Misleading information for administrators managing betting windows, could lead to incorrect decisions about opening/closing betting periods

## Location
Admin panel - Betting Window Control section

## Root Cause
Frontend filtering logic only checked `week.status === 'open'` but ignored `week.bettingDeadline`. Weeks with expired betting deadlines were still counted as "open"

## Technical Details
- Frontend only checked: `week.status === 'open'`
- Missing check: `new Date(week.bettingDeadline) > now`
- Displayed weeks with "open" status but expired deadlines

## Solution
- Updated both betting window control sections (main and mobile) to check both week status AND betting deadline
- Added proper datetime comparison: `week.status === 'open' && new Date(week.bettingDeadline) > now`
- Now frontend filtering matches backend logic in `/api/weeks/current` endpoint
- Ensures displayed count reflects weeks actually accepting bets, not just weeks with "open" status

## Files Modified
- `frontend/src/pages/admin.tsx` (lines 741-747 and 998-1004)

## Testing
✅ Verified on both desktop and mobile admin interfaces

## Verification
✅ Betting window control now displays accurate count of weeks accepting bets 