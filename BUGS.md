# La Quiniela 247 Bug Tracker

## Critical Bugs

### 1. Admin Panel - Users Screen Crash
- **Status**: Open
- **Priority**: High
- **Reported By**: Jim Baskin
- **Date**: June 6, 2025
- **Description**: The Users screen in the Admin Panel crashes when accessed. "Application error: a client-side exception has occurred (see the browser console for more information)."
- **Additional Notes**: Screenshots of crash errors requested
- **Investigation**: Comprehensive investigation conducted June 8, 2025. Issue appears to be related to data fetching error handling and mock data integration in admin.tsx. Proposed fixes available but not yet implemented.

### 2. Statistics Option Crash
- **Status**: Fixed
- **Priority**: High
- **Reported By**: Jim Baskin
- **Date**: June 6, 2025
- **Fixed**: June 10, 2025
- **Description**: Application crashes when accessing the statistics option (Performance Stats tab in profile page)
- **Root Cause**: TypeError in `formatPercentage` function when value is undefined - `value.toFixed()` called on undefined values
- **Solution**: 
  - Added null checks to `formatPercentage` and `formatCurrency` functions
  - Updated `UserProfile` interface to allow null values for stats fields
  - Added fallback values for totalBets, bestRankingPosition, and memberSince date
  - Added date safety checks for member since dates
- **Git Commit**: 7345094 - "Fix Performance Stats crash: Handle null/undefined values"
- **Verification**: ✅ Performance Stats tab no longer crashes when clicked

### 3. Logout Bug
- **Status**: Fixed
- **Priority**: High
- **Reported By**: Michael Jimenez
- **Date**: June 6, 2025
- **Fixed**: June 9, 2025
- **Description**: Potential logout issues when:
  - Switching between users
  - Ending testing sessions
- **Root Cause**: 
  - Backend logout endpoint wasn't clearing HTTP-only cookies
  - Frontend wasn't properly clearing all cookies with domain variations
  - Local/session storage wasn't being cleared
  - Inconsistent cookie handling between development and production
- **Solution**: 
  - Enhanced backend `/auth/logout` to properly clear server-side cookies
  - Improved frontend logout to clear cookies with all domain variations
  - Added comprehensive localStorage/sessionStorage cleanup
  - Added fallback error handling and forced cleanup
- **Testing Steps**:
  1. Login as demo user → logout → login again (should work)
  2. Login as admin user → logout → login as demo user (should work)
  3. Test "Logout from all devices" button in profile page
  4. Verify browser cookies are cleared after logout
  5. Test in both development and production environments
- **Verification**: 
  - ✅ Backend clears HTTP-only cookies with correct domain/path settings
  - ✅ Frontend clears all cookie variations (with/without domain)
  - ✅ localStorage and sessionStorage are properly cleared
  - ✅ User state is reset in AuthContext
  - ✅ Forced redirect to login page as fallback
- **Git Commit**: 0690e78 - "feat: fix logout bug, update demo nav order, and improve deployment"

### 4. Password Change Functionality
- **Status**: Fixed
- **Priority**: High  
- **Reported By**: Internal Testing
- **Date**: June 10, 2025
- **Fixed**: June 10, 2025
- **Description**: Password change functionality was completely broken for all users (demo, admin, regular users)
- **Root Cause**: HTTP method mismatch - frontend was sending PUT requests while backend only accepted POST requests for `/api/users/change-password`
- **Solution**: Updated frontend to use POST method matching backend implementation
- **Impact**: Restored critical account security functionality for all user types
- **Git Commit**: b1fdc15 - "Critical Fix: Restore password change functionality for all users"
- **Verification**: ✅ Admin and demo users can now successfully change passwords

### 5. Admin Game Management Functions Failure (Consolidated)
- **Status**: Testing Fix
- **Priority**: Critical
- **Reported By**: Live Testing
- **Date**: June 10, 2025
- **Description**: Core admin game management functionality is failing intermittently and completely broken in live environment
- **Symptoms**: 
  - "Error creating game" message appears intermittently
  - Cannot open games for betting
  - Cannot schedule new games consistently  
  - Game status management not functioning
  - Works sometimes, fails other times with inconsistent results
- **Behavior**:
  - Only occurs in live admin demo mode
  - Same operations succeed locally but fail unpredictably on live server
  - Intermittent nature suggests potential race condition, timeout, or server resource issue
- **Impact**: Complete loss of reliable game management capabilities for administrators
- **Environment**: Live server only (not reproducible in local development)
- **Investigation Findings**: Server log analysis completed (June 10, 2025)
  - **Memory Constraint**: Server had only 957MB total RAM with 78MB available
  - **MySQL Usage**: MySQL consuming 40.4% of RAM (396MB)
  - **Log Analysis**: POST requests to `/api/admin/games` are reaching server but no specific error logs for game creation
  - **Resource Issue**: Low memory availability likely causing intermittent database timeouts and connection failures
  - **Error Pattern**: "Invalid bet ID" errors appearing in logs, suggesting database connectivity issues
- **Root Cause Identified**: Server memory constraints causing intermittent database operation failures
- **Fix Applied**: Server RAM upgraded from 1GB to 2GB (June 10, 2025)
- **Testing Status**: In progress - verifying if memory upgrade resolves admin game management issues
- **Additional Notes**: Consolidated from bugs #5 and #7 - same root cause affecting all admin game management functions

### 6. Mobile View Overflow in Admin Games Management
- **Status**: Fixed
- **Priority**: High
- **Reported By**: Live Testing
- **Date**: June 10, 2025
- **Fixed**: June 13, 2025
- **Description**: Mobile views were overflowing off the page for all scheduled games in admin mode
- **Affected Areas**:
  - Games Management workflow
  - Games scheduling interface  
  - All scheduled games display on mobile devices
- **Impact**: Admin could not properly manage games on mobile devices, affecting mobile administration capabilities
- **Environment**: Mobile views in admin mode
- **Solution**: 
  - Applied responsive flex layout to admin game cards (flex-col sm:flex-row)
  - Implemented compact horizontal status layout with flex-wrap
  - Shortened date format from "6/13/2025, 12:00:00 PM PDT" to "6/13 12:00 PM"
  - Removed verbose text labels ("Inicio del Juego:") for mobile space efficiency
  - Reduced badge padding and spacing (px-2 py-0.5, gap-1) for tighter layout
  - Simplified delete button to icon-only (🗑️) for space conservation
  - Maintained all admin functionality while ensuring mobile responsive design
- **Technical Implementation**:
  - Modified both admin.tsx and bet.tsx admin game management views
  - Applied proven responsive design patterns from demo user interface
  - Layout stacks vertically on mobile (<640px) but remains horizontal on desktop
  - Status badges wrap efficiently without horizontal overflow
- **Git Commits**: 
  - 1ac2104 - "Fix Bug #6: Mobile overflow in admin games management"  
  - 19a2bf6 - "Fix Bug #6: Compact mobile status layout"

### 6. Betting Window Control - Incorrect Open Week Count
- **Status**: Fixed
- **Priority**: Critical
- **Reported By**: User Testing
- **Date**: January 16, 2025
- **Fixed**: January 16, 2025
- **Description**: Betting window control was displaying "4 weeks open" when there were only 2 weeks actually open for betting
- **Impact**: Misleading information for administrators managing betting windows, could lead to incorrect decisions about opening/closing betting periods
- **Location**: Admin panel - Betting Window Control section
- **Root Cause**: Frontend filtering logic only checked `week.status === 'open'` but ignored `week.bettingDeadline`. Weeks with expired betting deadlines were still counted as "open"
- **Solution**: 
  - Updated both betting window control sections (main and mobile) to check both week status AND betting deadline
  - Added proper datetime comparison: `week.status === 'open' && new Date(week.bettingDeadline) > now`
  - Now frontend filtering matches backend logic in `/api/weeks/current` endpoint
  - Ensures displayed count reflects weeks actually accepting bets, not just weeks with "open" status
- **Files Modified**:
  - `frontend/src/pages/admin.tsx` (lines 741-747 and 998-1004)
- **Testing**: ✅ Verified on both desktop and mobile admin interfaces
- **Verification**: ✅ Betting window control now displays accurate count of weeks accepting bets

### 7. Game Creation Failed Beyond Week 28
- **Status**: Open
- **Priority**: High
- **Reported By**: User Testing
- **Date**: January 16, 2025
- **Description**: Cannot add games for weeks beyond week 28, receiving "Error al crear el juego" message
- **Error Details**: 
  - Console error: "Failed to load resource: the server responded with a status of 409 ()"
  - HTTP 409 Conflict status suggests duplicate or constraint violation
  - Week number appears to hit some database or validation constraint at week 28
- **Impact**: Prevents scheduling games for the final weeks of the season (weeks 29+)
- **Location**: Admin panel - Create Game form
- **Investigation Needed**:
  - Check database constraints on week numbers in Game and Week models
  - Verify season/week validation logic in backend game creation endpoint
  - Review if week 28 represents end-of-season boundary in current system
  - Examine if duplicate week creation is causing the 409 conflict
  - Check if Week records need to be created before Game records for weeks 29+

## UI/UX Bugs

### 1. Light/Dark Mode Toggle
- **Status**: Will not fix
- **Priority**: Medium
- **Reported By**: Jim Baskin
- **Date**: June 6, 2025
- **Description**: 
  - Mode toggle shows three states instead of two
  - Initial state is light
  - First toggle keeps it white
  - Second toggle changes to dark
- **Expected Behavior**: Should only have two states (light/dark)

### 2. Team Logo Visibility
- **Status**: Partially Fixed
- **Priority**: Medium
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Partially Fixed**: Multiple updates through June 2025
- **Remaining Issues**: June 10, 2025
- **Description**:
  - Logos not visible in light mode
  - Logo size too small for legibility
  - Logos getting lost with white background
- **Solution**: Moved to black header and white text, improved logo visibility across interfaces
- **Progress Made**: 
  - ✅ Admin games management now displays team logos next to team names
  - ✅ Team selection dropdowns have logos for better UX
  - ✅ Most teams seeded with valid logo URLs for consistent display
- **Remaining Issues**:
  - ❌ Some team logos still not displaying correctly (not all teams affected)
  - ❌ Logo URL validation and fallback handling may need improvement
  - ❌ Inconsistent logo display across different interface sections

### 3. Betting Window Size
- **Status**: Fixed
- **Priority**: Medium
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Fixed**: June 10, 2025 (v2.0.2)
- **Description**: Betting window is too large
- **Solution**: 
  - Reduced bet input field sizes for better mobile layout
  - Optimized currency selector positioning
  - Improved touch-friendly button sizing and spacing
  - Enhanced responsive design with mobile-first approach
- **Git Commit**: c703c21 - "implement multi-currency support with mobile-optimized betting interface"

### 4. Game Time Selection UI
- **Status**: Open
- **Priority**: Low
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**:
  - Minutes selection shows all minutes instead of just 00, 15, 30, 45
  - Games not properly grouped by week

## Feature Requests

### 1. Navigation Structure
- **Status**: Partially Implemented
- **Priority**: High
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Progress**: 
  - ✅ Default landing page changed to Games screen for demo users
  - ✅ Games is now the primary navigation option
  - ✅ Navigation order updated for demo users
  - ✅ Improved mobile navigation elements
  - ❌ Hamburger menu for mobile not yet implemented
  - ❌ Admin navigation structure changes not fully implemented
- **Description**: 
  - Change default landing page to Juegos screen
  - Make Juegos the leftmost navigation option
  - Remove Quick Actions section from Dashboard
  - Remove Dashboard and My History for admin users
  - Keep Games and Profile sections for admin
  - Implement hamburger menu for mobile navigation
  - Ensure all navigation elements are touch-friendly

### 2. Currency Support
- **Status**: Implemented
- **Priority**: High
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Implemented**: June 10, 2025 (v2.0.2)
- **Description**: ✅ **COMPLETED**
  - ✅ Add currency toggle between MXN (Mexican Pesos), USD (US Dollars), and Bitcoin
  - ✅ Display currency next to numbers instead of in middle
  - ✅ Implement fixed bet amount (200 pesos to win 2000) for weekly La Quiniela bets only
  - ✅ Ensure currency selector is mobile-friendly
  - ✅ Optimize number input for mobile devices
  - ✅ Implement proper Bitcoin decimal handling (8 decimal places vs 2 for fiat)
  - ✅ Add Bitcoin wallet integration support
  - ✅ Implement dynamic currency display based on selected language
  - ✅ Persistent user preferences saved to localStorage
  - ✅ Consistent currency formatting across all interfaces
- **Technical Implementation**:
  - ✅ `CurrencyContext.tsx` - Global currency state management
  - ✅ `CurrencySelector.tsx` - Reusable, mobile-friendly currency dropdown component
  - ✅ Currency formatting utilities with symbol management (₿ for Bitcoin, $ for fiat)
  - ✅ Real-time currency conversion display across all betting interfaces
- **Git Commit**: c703c21 - "implement multi-currency support with mobile-optimized betting interface"

### 3. Betting Rules
- **Status**: Partially Implemented
- **Priority**: High
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Progress**:
  - ✅ Fixed bet amount implementation for La Quiniela weekly bets ($200 to win $2000)
  - ✅ Variable amounts for single game bets maintained
  - ✅ Betting interface optimized for mobile screens
  - ✅ Touch-friendly bet placement process
  - ✅ Clear distinction between weekly La Quiniela bets and single game bets
  - ❌ One bet per week limit enforcement not yet fully implemented
  - ❌ Update result option in game management not yet added
- **Description**:
  - Implement one bet per week limit for La Quiniela weekly bets
  - Keep single game bets functionality with variable amounts
  - Add update result option in game management
  - Ensure betting interface is optimized for mobile screens
  - Make bet placement process touch-friendly
  - Clearly distinguish between weekly La Quiniela bets and single game bets
  - Implement proper validation to prevent multiple weekly bets

### 4. Team Display Enhancement
- **Status**: Implemented
- **Priority**: Medium
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Implemented**: Multiple updates through June 2025
- **Description**: ✅ **COMPLETED**
  - ✅ Add team logos alongside team names
  - ✅ Consider dark background for logo visibility
  - ✅ Increase logo size for better visibility
  - ✅ Ensure logos scale properly on mobile devices
  - ✅ Optimize team display for smaller screens
- **Implementation Details**:
  - ✅ Admin Create Game form now uses dropdowns for Home and Away Team selection
  - ✅ Team selection dropdowns have fully localized placeholders
  - ✅ Admin games management displays team logos next to team names
  - ✅ All teams seeded with valid logo URLs

### 5. Game Management
- **Status**: Partially Implemented
- **Priority**: Medium
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Progress**:
  - ✅ Improved game scheduling and display
  - ✅ Enhanced game list view for mobile devices
  - ✅ Touch-friendly game selection
  - ✅ Admin panel game management improvements
  - ❌ Group games by week not fully implemented
  - ❌ Update result functionality not yet added
- **Description**:
  - Group games by week
  - Show games within selected week range
  - Add update result functionality
  - Implement proper game scheduling
  - Optimize game list view for mobile devices
  - Ensure touch-friendly game selection

### 6. Logo Enhancement
- **Status**: Improved
- **Priority**: High
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Progress**: Ongoing improvements through June 2025
- **Description**:
  - ✅ Improved header/navigation logo visibility
  - ✅ Enhanced logo display in both light and dark modes
  - ✅ Better contrast and visibility improvements
  - ❌ Login page logo improvements not yet completed
  - ❌ Hero section logo size increases not yet implemented
- **Implementation**: 
  - ✅ SVG color improvements for better contrast
  - ✅ Proper logo scaling on different screen sizes
  - ✅ Mobile device optimization

### 7. Accessibility and Localization
- **Status**: Significantly Improved
- **Priority**: High
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Progress**: Extensive localization work completed
- **Description**: 
  - ✅ **MAJOR PROGRESS**: Extensive localization files implemented for Spanish and English
  - ✅ Admin panel fully localized (admin.existing_games, admin.games, admin.* keys)
  - ✅ Betting interface fully localized
  - ✅ Navigation and dashboard elements localized
  - ✅ Currency support with proper language integration
  - ❌ Accessibility for blind users not yet fully implemented
  - ❌ Keyboard navigation support not yet complete
  - ❌ Screen reader compatibility needs work
- **Implementation**:
  - ✅ Comprehensive translation key system
  - ✅ Context-aware translations
  - ✅ Currency and numeric formatting localization

### 8. User Verification and Payouts (Phase 2)
- **Status**: Planned
- **Priority**: Medium
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**:
  - Develop user verification workflow
  - Implement payout system
  - Add profile verification for payouts
  - Create admin tools for user account management
  - Implement user deactivation functionality
  - Add verification status tracking

### 9. Endless Betting Mode (Demo Feature)
- **Status**: Removed
- **Priority**: N/A
- **Reported By**: Internal Analysis
- **Date**: June 10, 2025
- **Removed**: June 10, 2025 (v2.0.4)
- **Description**: ✅ **FEATURE REMOVED**
  - **Rationale**: Feature provided inconsistent UX between demo and real users, added technical debt
  - **Impact**: Demo users now experience authentic betting constraints and real API interactions
  - **Benefits**: Cleaner profile interface, eliminated conditional logic branches, reduced technical debt
- **Changes Made**:
  - ✅ Removed Demo Settings section from profile page
  - ✅ Eliminated endless betting toggle and related UI components
  - ✅ Removed simulated betting logic for demo users
  - ✅ Simplified DemoContext to only provide user identification
  - ✅ All users now have consistent betting experience and constraints
- **Git Commit**: 930185a - "Remove Endless Betting Mode: Simplify UX and codebase"

## Test Credentials
- **Demo User**: demo@laquiniela247.mx / demo123
- **Admin User**: admin@laquiniela247.mx / admin123

## Postmortem: Admin Panel & Authentication 401/404 Bug (June 2025)

### Symptoms
- Admin panel and dashboard pages failed to load protected data.
- All API requests to `/api/admin/*`, `/api/users/profile`, etc. returned 401 Unauthorized or 404 Not Found.
- `auth_token` cookie was present in browser but not used for authentication.
- Duplicate API calls observed (e.g., `/api/admin/users` and `/users`).
- Debug logs showed `auth_token cookie: undefined` and repeated login attempts.

### Investigation & Things Tried
- Verified frontend and backend ports, CORS, and environment variables.
- Checked Next.js rewrite config and ensured `NEXT_PUBLIC_API_URL` was set.
- Confirmed cookies were being set and sent by the browser.
- Audited all frontend API calls for correct axios instance and path usage.
- Checked backend CORS and cookie settings for local development.
- Confirmed backend was setting the cookie with correct options.
- Discovered backend auth middleware only checked the Authorization header, not cookies.

### Root Cause
- Backend authentication middleware only checked for JWT in the `Authorization` header, not in the `auth_token` cookie. When the frontend relied on the cookie for authentication, backend requests failed with 401.
- Some frontend API calls were not using the configured axios instance, causing inconsistent credential handling and duplicate requests.

### Final Fix
- Updated backend `authMiddleware` to check for JWT in both the `Authorization` header and `auth_token` cookie.
- Ensured `cookie-parser` middleware is enabled in the backend.
- Audited frontend to ensure all protected API calls use the configured axios instance with `baseURL: '/api'` and a leading slash in the path.
- Installed `cookie-parser` and its types in the backend.

### Status
- **Resolved** as of June 2025. Admin panel and protected routes now authenticate correctly using cookies or headers.

---
*Last Updated: June 10, 2025* 