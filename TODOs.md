# La Quiniela 247 - TODOs & Technical Debt

This document tracks pending improvements, technical debt, and feature enhancements for the La Quiniela 247 platform.

## 🚨 High Priority

### 🚀 **Production Deployment with Bet Types Migration**
**Status**: ✅ Ready for Production  
**Priority**: Critical  
**Issue**: Deploy enhanced single bet system to Digital Ocean production environment

**Deployment Strategy**:
- ✅ **Enhanced Deploy Script**: Added bet types migration step (7.5) between database migration and service restart
- ✅ **Migration Script Ready**: Intelligent classification with production safety features
- ✅ **Zero Downtime**: Migration runs after code deployment but before service restart
- ✅ **Safety Features**: Dry-run verification, rollback capability, comprehensive logging

**Production Commands**:
```bash
# Code-only deployment (safe, preserves production data)
./deploy.sh

# Bet types migration only (adds single bet support to existing production data)  
MIGRATE_BET_TYPES=true ./deploy.sh

# Full deployment with database migration (destructive, for fresh deployments)
MIGRATE_DB=true MIGRATE_BET_TYPES=true BACKUP_PROD=true ./deploy.sh
```

**Recommended First Production Deployment**:
```bash
MIGRATE_BET_TYPES=true ./deploy.sh
```

### 🎯 **Bet Type Filtering Restoration** 
**Status**: ⏳ Pending (Post-Production)  
**Priority**: High  
**Issue**: Single/Parlay tabs currently show ALL bets (mixed view) instead of filtering by bet type

**Context**: 
- During single bet persistence debugging, we temporarily disabled bet type filtering in `backend/src/routes/games.ts`
- Lines 274-277 and 329-331 have the filtering logic commented out for testing
- The core functionality works perfectly, but UX could be improved with proper tab separation

**Current Behavior**:
- ✅ "Apuestas Simples" tab: Shows ALL bets (single + parlay)  
- ✅ "La Quiniela" tab: Shows ALL bets (single + parlay)

**Desired Behavior**:
- 🎯 "Apuestas Simples" tab: Shows ONLY single bets
- 🎯 "La Quiniela" tab: Shows ONLY parlay bets

**Technical Details**:
```typescript
// File: backend/src/routes/games.ts
// Lines to restore:

// Filter by betType if specified (for separating single vs parlay bets)
if (betType && (betType === 'single' || betType === 'parlay')) {
  // Convert to uppercase enum values that Prisma expects
  betFilter.betType = betType.toUpperCase();
}

// Apply same betType filter as above for consistency
if (betType && (betType === 'single' || betType === 'parlay')) {
  userBetFilter.betType = betType.toUpperCase();
}
```

**Testing Required**:
- [ ] Verify single bets still persist after re-enabling filtering
- [ ] Confirm parlay bets show correctly in La Quiniela tab
- [ ] Test login/logout persistence with filtering enabled
- [ ] Validate enum case handling (database: 'single'/'parlay' vs TypeScript: 'SINGLE'/'PARLAY')

**Estimated Time**: 30 minutes

---

## 🔧 Medium Priority

### 🧹 **Code Cleanup & Optimization**

#### **Remove Temporary Database Files**
**Status**: ⏳ Pending  
**Files to remove**:
- `backend/temp_query.sql` (temporary testing file)
- `backend/backup_before_bettype_migration_20250618_055846.sql` (move to separate backups folder)

#### **Migration Script Enhancement**
**Status**: ⚠️ Review Needed  
**File**: `backend/src/scripts/migrateBetTypes.ts`
- Add error recovery mechanisms
- Enhanced logging for production migrations
- Dry-run validation improvements

#### **Enum Consistency Validation**
**Status**: ⏳ Pending  
**Issue**: Ensure consistent handling of bet type enums across all API endpoints
- Database stores: `'single'`, `'parlay'` (lowercase)
- TypeScript expects: `'SINGLE'`, `'PARLAY'` (uppercase) 
- API receives: `'single'`, `'parlay'` (lowercase from frontend)

---

## 🎨 Low Priority / Future Enhancements

### **UI/UX Improvements**

#### **Enhanced Bet Summary**
- Real-time potential winnings calculator
- Better mobile responsive design for bet cards
- Animated state transitions for better user feedback

#### **Advanced Single Bet Features**
- Custom bet amounts per game (currently defaults to $50)
- Bet amount memory per user session
- Quick bet amount presets ($25, $50, $100, $200)

#### **Performance Optimizations**
- Implement React Query for better caching
- Optimize database queries with proper indexing
- Add client-side bet validation before API calls

### **Analytics & Reporting**
- User betting pattern analytics
- Popular games tracking
- Win/loss ratio reporting per bet type

---

## 📋 Completed ✅

### **Single Bet & Parlay System Implementation** *(2025-01-18)*
- ✅ Database migration with intelligent bet type classification
- ✅ Optimistic UI updates for instant user feedback  
- ✅ Persistent single bet data across login sessions
- ✅ Complete Spanish localization for betting interfaces
- ✅ Enhanced database schema with BetType enum support
- ✅ API endpoints with proper enum handling
- ✅ Migration script with dry-run and live modes

### **Spanish Translation Completion** *(2025-01-18)*
- ✅ All betting interface messages translated
- ✅ Success confirmations, progress indicators, summary labels
- ✅ Status messages and user feedback in Spanish

### **State Management Revolution** *(2025-01-18)*
- ✅ Replaced slow await-based updates with instant optimistic UI
- ✅ Eliminated race conditions and server round-trips
- ✅ Proper React state management for bet summary calculations

---

## 🔍 Investigation Needed

### **Currency Exchange Rate Optimization**
- Evaluate current exchange rate API usage patterns
- Consider implementing local cache with longer TTL
- Research alternative exchange rate providers for cost optimization

### **Database Performance**
- Analyze betting query performance with large datasets
- Consider implementing database indexing strategy
- Evaluate pagination for large bet history

---

## 📝 Notes

**Last Updated**: 2025-01-18  
**Version**: 2.0.25  
**Branch**: features-bug-fixes  

**Development Philosophy**: 
- Zero breaking changes approach
- Comprehensive testing before production
- Documentation-first development
- User experience prioritization 