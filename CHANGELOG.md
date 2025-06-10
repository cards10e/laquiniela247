# Changelog

All notable changes to this project will be documented in this file.

## [2.0.3] - 2025-06-10
### 🔒 Critical Security Fix
- **Password Change Functionality**: Fixed critical HTTP method mismatch preventing all users from changing passwords
  - **Bug**: Frontend was sending PUT requests while backend only accepted POST requests for `/api/users/change-password`
  - **Impact**: Change password functionality was completely broken for all users (demo, admin, regular users)
  - **Fix**: Corrected frontend to use POST method, restoring password change capability
  - **Scope**: Affects all authenticated users across all roles

### Fixed
- Password change functionality now works correctly for all user types
- HTTP method alignment between frontend (POST) and backend (POST) endpoints
- Proper error handling and user feedback for password change operations

## [2.0.2] - 2025-01-18
### 🌍 Multi-Currency Support Implementation
- **Currency Selector**: Added compact currency toggle supporting MXN (Mexican Pesos), USD (US Dollars), and Bitcoin (BTC)
- **Mobile-Optimized Layout**: Currency selector positioned to the left of bet amount inputs with optimized sizing for mobile UX
- **Consistent Currency Display**: All bet amounts, winnings, and summaries now use selected currency with proper formatting
- **Persistent User Preferences**: Currency selection saved to localStorage and persists across sessions
- **Internationalization**: Added translation keys for all currencies in English and Spanish
- **Bitcoin Support**: Proper decimal formatting (8 places) vs fiat currencies (2 places)

### Enhanced Betting Interface
- **Compact Design**: Reduced bet input field sizes per UX best practices for mobile optimization
- **Eliminated Redundant Elements**: Removed unnecessary input box for La Quiniela fixed amounts, replaced with clean text display
- **Improved Visual Hierarchy**: Moved "Select Your Predictions" heading above filter sections for better information architecture
- **Touch-Friendly Spacing**: Optimized gaps and button sizes for mobile touch interactions

### Added
- `CurrencyContext.tsx` - Global currency state management with localStorage persistence
- `CurrencySelector.tsx` - Reusable, mobile-friendly currency dropdown component
- Currency formatting utilities with symbol management (₿ for Bitcoin, $ for fiat)
- Real-time currency conversion display across all betting interfaces
- Responsive sizing variants (small/medium) for different UI contexts

### Changed
- Bet amount input fields reduced from `w-32` to `w-24/w-20/w-16` for better mobile layout
- Currency selector uses compact `w-14` width with smaller text for space efficiency
- Button sizing optimized with `text-sm px-3 py-1` for mobile touch targets
- History page currency displays now use dynamic formatting instead of hardcoded MXN
- All monetary displays consistently use selected currency across the application

### Fixed
- Mobile layout overflow issues with betting interface elements
- Inconsistent currency display between different app sections
- Removed confusing read-only input field for La Quiniela fixed amounts
- Improved responsive spacing with reduced gaps (`gap-2` to `gap-1`) for mobile screens

### Technical Improvements
- Added currency context provider to app root for global state management
- Implemented proper TypeScript types for currency handling
- Enhanced responsive design with mobile-first approach
- Optimized component reusability across Single Bets and La Quiniela tabs

## [2.0.1] - 2025-01-18
### 🔒 Security & UX Improvements
- **Enhanced Authentication Security**: Fixed authentication redirect behavior to prevent URL exposure of protected pages when logged out
- **Clean Login Experience**: Users are now redirected to clean `/login` URL without query parameters or remnants of protected pages
- **UI Streamlining**: Temporarily hidden Quick Actions section from dashboard for cleaner interface
- **Development Optimization**: Temporarily disabled rate limiting for smoother development experience

### Changed
- ProtectedRoute now performs clean redirects to `/login` without exposing protected URLs
- Login page simplified to remove redirect parameter logic
- Dashboard Quick Actions section commented out for streamlined interface
- Rate limiting temporarily disabled in development environment

### Fixed
- Security issue where protected page URLs were visible in address bar when logged out
- Information leakage about existing protected routes through redirect parameters
- Improved authentication flow with no session remnants visible to unauthenticated users

### Security
- ✅ No exposure of protected URLs in the address bar when logged out
- ✅ Clean login experience with no session remnants
- ✅ No information leakage about what pages exist in the application
- ✅ Simplified and more secure authentication flow

## [2.0.0] - 2025-06-09
### 🎯 Major Betting Interface Overhaul
- **Consistent Bet Summary Display**: Both Single Bets and La Quiniela tabs now show bet summaries for improved UX consistency
- **Fixed La Quiniela Amounts**: La Quiniela betting now uses fixed $200 bet / $2000 payout with read-only input field
- **Enhanced Single Bets Experience**: Added real-time bet summary with active bet tracking, dynamic totals, and 2.5x multiplier for transparent winnings calculation
- **Improved Tab Switching**: Seamless switching between betting modes with persistent summaries and real-time updates
- **Professional UX Design**: Implemented consistent card layouts, visual hierarchy, and clear value propositions across all betting modes

### Added
- Real-time bet summary calculations for Single Bets mode
- Fixed amount display and validation for La Quiniela mode
- Internationalization support for new betting interface elements (English/Spanish)
- Visual state indicators for read-only fields and completed predictions
- Responsive design optimizations for bet summary components

### Changed
- La Quiniela betting amount input is now read-only with fixed $200/$2000 amounts
- Single Bets now show comprehensive summary instead of empty sidebar
- Improved visual consistency between betting modes
- Enhanced user feedback with clear progress indicators and winnings calculations

### Fixed
- Missing bet summary display when switching to Single Bets tab
- Inconsistent betting amount handling between Single Bets and La Quiniela
- Improved accessibility with proper read-only field indicators

### 🚀 Deployment & Database Management
- **Automatic Database Dump Generation**: Deploy script now automatically creates fresh database dumps before deployment
- **Complete Database Overwrite**: Live server database is now completely overwritten with local data for consistency
- **MySQL Command Fixes**: Resolved shell escaping issues in deployment script MySQL commands
- **Enhanced Error Handling**: Improved deployment script reliability with better error detection and recovery

### Technical Improvements
- Added TypeScript support for enhanced betting interface components
- Optimized component rendering with minimal re-renders
- Improved state management for betting calculations
- Enhanced build process reliability

## [1.0.0] - 2024-03-08
### Added
- Initial standalone release migrated from WordPress plugin (v1.0.1).
- Next.js 14 frontend with React 18, TypeScript, Tailwind CSS, and full SSR/SSG support.
- Express.js backend with TypeScript, Prisma ORM, MySQL, JWT authentication, and Zod validation.
- Complete betting system for Liga MX matches: place bets, view results, and track performance.
- User authentication: registration, login, password reset, email verification.
- User dashboard: personal stats, performance, and history.
- Admin dashboard: manage users, games, weeks, and view analytics.
- Internationalization: Spanish and English support.
- Dark mode and responsive mobile-first design.
- Progressive Web App (PWA) features and real-time updates.
- Security: HTTPS, CSRF, input validation, rate limiting, and more.
- Database migration scripts and demo data seeding.
- Automated deployment script with SSH key caching and improved error handling.
- SSL certificate management with automatic verification and retry mechanism.
- Documented that after updating environment variables (e.g., .env.local), you should run `pm2 restart laquiniela-frontend --update-env` to ensure the new environment is loaded by the running process.

### Changed
- Improved UI/UX and mobile responsiveness compared to WordPress version.
- Optimized performance, SEO, and accessibility (WCAG 2.1 AA).
- Updated URL structure to match legacy WordPress plugin for seamless migration.
- Enhanced deployment process with better error handling and service verification.
- Improved database seeding and migration process.
- Updated documentation with comprehensive feature list and technical details.

### Fixed
- Authentication API requests now use the correct `/api` prefix, resolving login issues for both admin and non-admin users.
- Admin navigation link now appears for all admin role variants (case-insensitive check).
- ProtectedRoute and admin checks are now case-insensitive, preventing access issues due to role casing.
- Minor bug fixes and improvements to error handling and user feedback.
- SSL certificate installation and verification process.
- SSH key caching to reduce authentication prompts during deployment.

### Migration Notes
- All user data, bets, and history migrated from WordPress.
- 100% functional parity with previous plugin version.
- Improved deployment process with automated scripts and verification steps.

---

## [Unreleased]
### Added
- New `seedHistory.ts` script for robust, date-driven seeding of weeks, games, bets, and user performance for demo and admin users.
- `deleteWeek99.ts` script to safely remove legacy week 99 and all associated data.
- Demo reset flow: DB reset, teams/users seeding, demo data seeding for robust, repeatable demos.
- All teams now seeded with valid logo URLs for consistent frontend display.
- Admin Create Game form now uses dropdowns for Home and Away Team selection, fetching teams from the backend.
- Team selection dropdowns have fully localized placeholders (Spanish/English) using the new 'select_team' translation key.
- Admin games management now displays team logos next to team names.
- User Management table now shows 0 (localized) for total winnings if no winnings exist, instead of $NaN.
- Preparation for /games page to use only real data and show all scheduled games (mock data removal and API logic update planned).

### Changed
- **Seeding:** Removed legacy week 99 logic from all seeding scripts. All week/game/bet seeding is now handled by `seedHistory.ts`.
- **Backend:**
  - `/api/weeks/current` and `/api/games/current-week` endpoints now select the current week based on `status: 'OPEN'` and a future `bettingDeadline`, ordered by `startDate` and `weekNumber` (Prisma array syntax).
  - Fixed Prisma `orderBy` usage to use array syntax, resolving console errors.
- **Frontend:**
  - Dashboard and `/bet` page now reliably display seeded data for the correct week and users.

### Fixed
- Resolved issue where dashboard and `/bet` page showed no data due to backend returning legacy week 99.
- Fixed Prisma validation errors in backend logs by correcting `orderBy` usage.
- Cleaned up `seed.ts` to only create teams and users, preventing legacy week creation.
- Dashboard and /bet pages now display correct data for demo/admin users.
- Status field normalized in frontend to handle backend casing.
- All numeric profile fields are now numbers in backend API responses.
- Removed non-existent fields from backend profile response to fix TypeScript errors.
- Improved demo seeding and DB reset flow for reliable demo data.
- Added debug logging and diagnostics for API and frontend data flow issues.
- Frontend now robustly handles backend data types and missing fields.
- Single Bets UI: Demo user can always place single bets for all games; prediction selection and highlighting now work; Place Bet button enables as expected.
- No changes to parlay or other user workflows.
- Backend/frontend userBet logic improved for demo reliability and correct bet state display.
- Admin panel: Changed all frontend GET requests for weeks from `/api/admin/weeks` to `/api/weeks` to match backend routes. This fixes a bug where game creation would fail due to 404 errors when fetching weeks.
- Admin panel: Normalized game status translation for existing games, ensuring correct display of status labels (e.g., Programado, En Vivo, Completado).
- Admin panel: Improved merging and display of mock and real games in the 'Existing Games' section.
- Admin panel: Temporarily hid the 'Weeks' tab for a cleaner UI.

### Changed
- Updated axios configuration to use a single instance with proper interceptors
- Improved token refresh mechanism
- Enhanced error handling in authentication flow
- Updated CORS configuration to properly handle credentials and headers

### Added
- Added proper error boundaries for admin panel
- Added loading states and error messages for better user feedback
- Added debug logging for authentication flow

## [Unreleased] - Deployment & Live Server Fixes

### Changed
- Nginx config now proxies `/api` to backend (port 3001) and all other requests to frontend (Next.js SSR, port 3000).
- PM2 process management improved: always starts both frontend and backend, checks for process existence, and uses correct process names.
- Deployment script now ensures frontend is built and started in SSR mode.
- Added health check endpoint verification after deploy.
- Documentation updated to clarify SSR deployment and Nginx config.
- Added instructions for manual Nginx editing if heredoc fails.

---

## [Unreleased] - June 2025
### Fixed
- Resolved critical bug where admin panel and dashboard API requests returned 401/404 due to backend only checking Authorization header for JWT.
- Updated backend auth middleware to check for JWT in both Authorization header and auth_token cookie.
- Enabled cookie-parser middleware in backend.
- Audited frontend to ensure all protected API calls use the configured axios instance with baseURL: '/api'.
- Installed missing cookie-parser and types for backend build.

### Investigation
- Verified CORS, environment variables, Next.js rewrites, and cookie settings.
- Confirmed cookies were set and sent by browser but not used by backend.
- Identified duplicate/inconsistent API calls in frontend.
- Systematically tested and documented all steps before applying the fix.

### Changed
- Admin navigation for users with the admin role is now minimal: "Dashboard" and "My History" links are hidden, and "Admin Panel" is the default/leftmost view.
- Admin users are now redirected to /admin after login instead of /dashboard.
- Navigation and login redirect logic are now fully role-aware and minimal for admins, with no impact on non-admin workflows.

### Fixed
- Fixed issue where admin users were incorrectly redirected to /dashboard after login, even when navigation was updated.
- Ensured all changes are fully documented and committed to a feature branch (not merged to main).

### Changed
- Header navigation links, user info, logout, and toggle buttons now use consistent color classes: light grey in light mode, white in dark mode, for a modern and accessible look.
- Navigation links font weight standardized to medium (500) for visual consistency.
- Toggle buttons (language/theme) now accept a className prop and inherit color from the header, ensuring correct color regardless of rebuilds or merges.
- All header hover states now use the brand red for both nav links and toggles.
- Admin panel: 'Ingresos Totales' (Total Revenue) now displays in green and uses the correct currency and locale based on the selected language (MXN for Spanish, USD for English), with robust formatting and forced color using Tailwind's important modifier.

### Fixed
- Resolved issues where header/toggle colors would revert after rebuilds or merges.
- Fixed admin revenue formatting and color to always match the selected language and design spec.

---

## [Unreleased] - June 2025

### Fixed
- **Critical Logout Bug**: Resolved high-priority logout issues when switching between users or ending testing sessions
  - Enhanced backend `/auth/logout` endpoint to properly clear HTTP-only cookies with correct domain/path settings
  - Improved frontend logout to clear cookies with all domain variations (development vs production)
  - Added comprehensive localStorage/sessionStorage cleanup
  - Added fallback error handling and forced cleanup mechanisms
  - Fixed issues where partial logout states could occur during network failures

### Changed
- **Demo User Navigation**: For demo users only, reordered navigation to show "Juegos" (Games) first, followed by "Panel"
  - Navigation now displays: "Juegos | Panel | Mi Historial | Perfil" for demo users
  - Panel link shows as "Panel" instead of "Admin Panel" for demo users
  - Regular admin users maintain original navigation order
  - No impact on regular user navigation

### Deployment
- **Environment Files**: Updated deployment script (`deploy.sh`) to use production environment files
  - Now uses `frontend/.env.production` and `backend/.env.production` for live deployments
  - Local development environment files remain unchanged
  - Ensures proper separation of development and production configurations
- **Build Process**: Fixed deployment script TypeScript compilation issues
  - Changed backend dependency installation to include dev dependencies for TypeScript build
  - Resolves missing @types/* packages needed for compilation
  - Production server still only uses compiled JavaScript files

---

## [Unreleased]
- Ongoing improvements and minor bug fixes.
- Admin: Restrict minute selection for game creation to :00, :15, :30, :45 and use dropdowns for hour/minute.
- Admin: Group existing games by week in the games list.
- Admin: Show a localized message when no games are scheduled (translation key added to I18nContext.tsx).
- Translation: Fixed translation loading to use I18nContext.tsx, not JSON files. 