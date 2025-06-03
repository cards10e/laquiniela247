# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-01-XX
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

### Changed
- Improved UI/UX and mobile responsiveness compared to WordPress version.
- Optimized performance, SEO, and accessibility (WCAG 2.1 AA).
- Updated URL structure to match legacy WordPress plugin for seamless migration.

### Fixed
- Authentication API requests now use the correct `/api` prefix, resolving login issues for both admin and non-admin users.
- Admin navigation link now appears for all admin role variants (case-insensitive check).
- ProtectedRoute and admin checks are now case-insensitive, preventing access issues due to role casing.
- Minor bug fixes and improvements to error handling and user feedback.

### Migration Notes
- All user data, bets, and history migrated from WordPress.
- 100% functional parity with previous plugin version.

---

## [Unreleased]
- Ongoing improvements and minor bug fixes. 