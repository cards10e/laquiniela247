# Issue #2: Statistics Option Crash

**Status**: ✅ Fixed  
**Priority**: High  
**Type**: Critical Bug  
**Reported By**: Jim Baskin  
**Date**: June 6, 2025  
**Fixed**: June 10, 2025  

## Description
Application crashes when accessing the statistics option (Performance Stats tab in profile page)

## Root Cause
TypeError in `formatPercentage` function when value is undefined - `value.toFixed()` called on undefined values

## Symptoms
- Profile page Performance Stats tab causes application crash
- JavaScript error: Cannot read property 'toFixed' of undefined
- User cannot view their performance statistics

## Solution
- Added null checks to `formatPercentage` and `formatCurrency` functions
- Updated `UserProfile` interface to allow null values for stats fields
- Added fallback values for totalBets, bestRankingPosition, and memberSince date
- Added date safety checks for member since dates

## Files Modified
- Profile page component (performance stats handling)
- Utility functions for number formatting
- User interface type definitions

## Impact
Performance Stats tab no longer crashes when clicked, providing reliable access to user statistics

## Verification
✅ Performance Stats tab no longer crashes when clicked

## Git Commit
7345094 - "Fix Performance Stats crash: Handle null/undefined values" 