# Changelog

All notable changes to this project will be documented in this file.

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

## [Unreleased]
- Ongoing improvements and minor bug fixes. 