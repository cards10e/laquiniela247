# Issue #14: Admin Game Creation - Zod Validation Error (Data Type Mismatch)

**Status**: 🧪 Testing Fix  
**Priority**: Critical  
**Type**: Validation Bug  
**Reported By**: Production Testing  
**Date**: June 19, 2025  

## Description
Game creation fails with Zod validation errors due to data type mismatches and missing required fields

## Error Details
```
"code": "invalid_type", "expected": "string", "received": "undefined", "path": ["season"], "message": "Required"
"code": "invalid_type", "expected": "number", "received": "string", "path": ["homeTeamId"], "message": "Expected number, received string"
"code": "invalid_type", "expected": "number", "received": "string", "path": ["awayTeamId"], "message": "Expected number, received string"
```

## Root Cause
- Generated frontend weeks missing `season` property 
- Team IDs being sent as strings instead of numbers
- Backend Zod schema expects: `season: string`, `homeTeamId: number`, `awayTeamId: number`

## Frontend Issues
- `allWeeks` constructed from two sources: generated weeks (missing season) + backend weeks
- Form sends team IDs as strings without `parseInt()` conversion
- Selected week object may not have `season` property if it's a generated week

## Fix Applied
- Added `season: '2025'` to generated weeks structure
- Added fallback `season` for backend weeks missing this property
- Convert team IDs to numbers using `parseInt()` before sending to backend

## Testing Status
In progress - deployed fix to production for validation

## Impact
Complete blocking of admin game creation functionality

## Files Modified
- Frontend admin game creation form
- Week generation logic
- Data type conversion handling

## Technical Details
- Backend expects strict Zod schema validation
- Frontend must match exact data types
- Generated weeks need complete data structure

## Next Steps
- Verify fix in production
- Test with various week configurations
- Monitor validation errors 