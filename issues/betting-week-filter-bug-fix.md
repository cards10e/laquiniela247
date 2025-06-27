# Betting Week Filter Bug Fix

**Date**: 2025-01-27  
**Issue**: Incorrect game visibility logic for betting interface  
**Priority**: 🚨 HIGH - User Experience Impact  
**Status**: ✅ FIXED  

---

## 🎯 **Correct Business Logic Implemented**

### **Game Visibility Rules**
1. ✅ **Current games (deadline not passed)**: Show betting options (Local/Empate/Visitante)
2. ✅ **Games with placed bets**: Show for up to **1 week past deadline** (historical view only)
3. ✅ **Games with NO bets + deadline passed**: Hide completely (don't clutter interface)

### **User Experience Goals**
- **Active Betting**: Clear interface showing only games that can be bet on
- **Historical Context**: Users can see their placed bets for a reasonable period (1 week)
- **Clean Interface**: Games without user engagement are hidden after deadline

---

## 🐛 **Bug Description**

The betting interface had incorrect game filtering logic that was either:
- ❌ Showing betting options for games that should be historical-only
- ❌ Hiding current week games that should still accept bets
- ❌ Not properly handling the 1-week historical window for placed bets

---

## 🛠️ **Final Implementation**

### **Key Logic Components**
```typescript
const deadlineNotPassed = game.bettingDeadline && new Date(game.bettingDeadline) > now;
const hasExistingBet = game.userBet && game.userBet.prediction;

// Calculate 1-week historical window for showing placed bets
const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
const timeSinceDeadline = now.getTime() - deadline.getTime();
const withinHistoricalWindow = timeSinceDeadline <= oneWeekInMs;

if (deadlineNotPassed) {
  if (!hasExistingBet) {
    gamesAvailableForBetting.push(game); // Show betting options
  } else {
    gamesWithExistingBets.push(game); // Show historical view
  }
} else if (hasExistingBet && withinHistoricalWindow) {
  gamesWithExistingBets.push(game); // Show historical view (within 1 week)
}
// Else: Hide completely (no bets + deadline passed OR beyond 1 week)
```

### **Decision Flow**
1. **Check Deadline**: Is betting deadline in the future?
   - ✅ **Yes**: Allow betting (unless user already bet)
   - ❌ **No**: Go to step 2

2. **Check User Bets**: Did user place bets on this game?
   - ✅ **Yes**: Go to step 3
   - ❌ **No**: Hide game completely

3. **Check Historical Window**: Is it within 1 week of deadline?
   - ✅ **Yes**: Show historical view only
   - ❌ **No**: Hide game completely

---

## 🧪 **Testing Scenarios**

### **✅ Scenario 1: Current Week Games (12:00 PM deadline not passed)**
- **Expected**: Show betting options (Local/Empate/Visitante)
- **Status**: ✅ Working correctly

### **✅ Scenario 2: User Has Placed Bets (deadline passed < 1 week ago)**
- **Expected**: Show historical view of placed bets (no betting options)
- **Status**: ✅ Working correctly

### **✅ Scenario 3: No Bets + Deadline Passed**
- **Expected**: Hide game completely
- **Status**: ✅ Working correctly

### **✅ Scenario 4: Placed Bets + 1+ Week Past Deadline**
- **Expected**: Hide game completely (historical window expired)
- **Status**: ✅ Working correctly

---

## 🔍 **Debug Console Output**

The implementation includes comprehensive logging for troubleshooting:
```javascript
console.log(`Game ${game.id} (Week ${game.weekId}): 
  deadline=${game.bettingDeadline}, 
  deadlineNotPassed=${deadlineNotPassed}, 
  hasExistingBet=${hasExistingBet}, 
  withinHistoricalWindow=${withinHistoricalWindow}`);

console.log(`Total games from backend: ${games.length}`);
console.log(`Games available for betting: ${gamesAvailableForBetting.length}`);
console.log(`Games with existing bets (within 1 week): ${gamesWithExistingBets.length}`);
console.log(`Games hidden (no bets + deadline passed): ${games.length - relevantGames.length}`);
```

---

## 🎯 **Expected Results**

### **For the Image Example (6/20/2025 12:00 PM)**
If current time is **before 12:00 PM on 6/20/2025**:
- ✅ Show betting options (Local/Empate/Visitante)

If current time is **after 12:00 PM on 6/20/2025**:
- ✅ **With placed bets**: Show historical view for up to 1 week
- ✅ **Without placed bets**: Hide completely

### **User Experience**
- 🎯 **Clear Betting Interface**: Only shows games that can actually be bet on
- 🎯 **Historical Context**: Users see their betting history for reasonable period
- 🎯 **Clean UI**: No clutter from irrelevant expired games

---

## 📋 **File Modified**
- `frontend/src/pages/bet.tsx` - Updated `getAllRelevantGames()` function

## ✅ **Testing Status**
- [x] TypeScript compilation passes
- [x] Business logic correctly implemented
- [x] Debug logging for verification
- [x] Production ready

---

**Status**: ✅ **PRODUCTION READY**  
**Business Logic**: ✅ **CORRECTLY IMPLEMENTED**  
**User Experience**: ✅ **OPTIMIZED FOR CLARITY** 