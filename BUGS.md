# La Quiniela 247 Bug Tracker

## Critical Bugs

### 1. Admin Panel - Users Screen Crash
- **Status**: Open
- **Priority**: High
- **Reported By**: Jim Baskin
- **Date**: June 6, 2025
- **Description**: The Users screen in the Admin Panel crashes when accessed. "Application error: a client-side exception has occurred (see the browser console for more information)."
- **Additional Notes**: Screenshots of crash errors requested

### 2. Statistics Option Crash
- **Status**: Open
- **Priority**: High
- **Reported By**: Jim Baskin
- **Date**: June 6, 2025
- **Description**: Application crashes when accessing the statistics option
- **Additional Notes**: Screenshot provided in email

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
- **Workaround**: Always ensure proper logout when switching users or ending testing

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
- **Status**: Fixed
- **Priority**: Medium
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**:
  - Logos not visible in light mode
  - Logo size too small for legibility
  - Logos getting lost with white background
  - moved to black header and white text

### 3. Betting Window Size
- **Status**: Open
- **Priority**: Medium
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**:
  - Betting window is too large
  - Should match square size of other elements

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
- **Status**: Open
- **Priority**: High
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**: 
  - Change default landing page to Juegos screen
  - Make Juegos the leftmost navigation option
  - Remove Quick Actions section from Dashboard
  - Remove Dashboard and My History for admin users
  - Keep Games and Profile sections for admin
  - Implement hamburger menu for mobile navigation
  - Ensure all navigation elements are touch-friendly

### 2. Currency Support
- **Status**: Open
- **Priority**: High
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**:
  - Add currency toggle between MXN (Mexican Pesos), USD (US Dollars), and Bitcoin
  - Display currency next to numbers instead of in middle
  - Implement fixed bet amount (200 pesos to win 2000) for weekly La Quiniela bets only
  - Ensure currency selector is mobile-friendly
  - Optimize number input for mobile devices
  - Implement proper Bitcoin decimal handling
  - Add Bitcoin wallet integration support
  - Implement dynamic currency display based on selected language

### 3. Betting Rules
- **Status**: Open
- **Priority**: High
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**:
  - Implement one bet per week limit for La Quiniela weekly bets
  - Keep single game bets functionality with variable amounts
  - Add update result option in game management
  - Ensure betting interface is optimized for mobile screens
  - Make bet placement process touch-friendly
  - Clearly distinguish between weekly La Quiniela bets and single game bets
  - Implement proper validation to prevent multiple weekly bets

### 4. Team Display Enhancement
- **Status**: Open
- **Priority**: Medium
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**:
  - Add team logos alongside team names
  - Consider dark background for logo visibility
  - Increase logo size for better visibility
  - Ensure logos scale properly on mobile devices
  - Optimize team display for smaller screens

### 5. Game Management
- **Status**: Open
- **Priority**: Medium
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**:
  - Group games by week
  - Show games within selected week range
  - Add update result functionality
  - Implement proper game scheduling
  - Optimize game list view for mobile devices
  - Ensure touch-friendly game selection

### 6. Logo Enhancement
- **Status**: Open
- **Priority**: High
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**:
  - Improve La Quiniela 247 logo visibility on login page
  - Increase logo size in hero section
  - Enhance logo display in header/navigation
  - Implement SVG color inversion for better contrast
  - Ensure logo is properly visible in both light and dark modes
  - Add dark background option for logo container if needed
  - Optimize logo display for mobile devices
  - Ensure proper scaling on different screen sizes

### 7. Accessibility and Localization
- **Status**: Open
- **Priority**: High
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**:
  - Implement localization files for Spanish and English
  - Ensure platform supports accessibility for blind users
  - Adhere to UX design standards for accessibility
  - Implement keyboard navigation support
  - Add screen reader compatibility
  - Ensure all interactive elements are keyboard accessible

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
*Last Updated: June 6, 2025* 