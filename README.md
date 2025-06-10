# La Quiniela 247

A modern web application for managing and participating in sports predictions.

## 🚀 Version 2.0.3 - Critical Security Fix & Enhanced Stability

### 🔒 Password Change Functionality Fixed
- **Critical Bug Fix**: Resolved HTTP method mismatch that completely broke password change functionality
- **Universal Impact**: Fix applies to all user types (demo users, admin users, regular users)
- **Root Cause**: Frontend was sending PUT requests while backend only accepted POST requests
- **Security Restored**: All authenticated users can now successfully change their passwords

### Previous: Version 2.0.2 - Multi-Currency Support & Enhanced UX

### 🌍 Multi-Currency Support
- **Currency Toggle**: Choose between MXN (Mexican Pesos), USD (US Dollars), and Bitcoin (BTC)
- **Mobile-Optimized Design**: Compact currency selector positioned left of bet inputs for optimal mobile UX
- **Persistent Preferences**: Currency choice saved and remembered across sessions
- **Consistent Formatting**: All monetary displays use selected currency with proper decimal places
- **Bitcoin Integration**: Full support with 8-decimal precision and ₿ symbol

### 📱 Enhanced Mobile Experience
- **Optimized Input Sizing**: Reduced bet input fields for better mobile layout and touch interaction
- **Cleaner Interface**: Removed unnecessary input boxes, improved visual hierarchy
- **Touch-Friendly Controls**: Optimized button sizes and spacing for mobile devices

### Previous: Version 2.0.1 - Security & UX Improvements

### 🔒 Enhanced Security & Clean Authentication
- **Secure Authentication Flow**: Fixed redirect behavior to prevent exposure of protected URLs when logged out
- **Clean Login Experience**: Users now see clean `/login` URLs without query parameters or page remnants
- **Streamlined Dashboard**: Temporarily removed Quick Actions for cleaner interface
- **Development Optimization**: Enhanced development experience with temporary rate limiting adjustments

### Previous: Version 2.0.0 - Major Betting Interface Overhaul

### 🎯 Enhanced Betting Experience
- **Consistent Bet Summary**: Both Single Bets and La Quiniela tabs now feature comprehensive bet summaries
- **Fixed La Quiniela Pricing**: $200 bet / $2000 payout with read-only amounts for clarity
- **Real-time Single Bets Tracking**: Live calculations with 2.5x multiplier and active bet counter
- **Professional UX Design**: Seamless tab switching with consistent layouts and visual hierarchy

### 🛠️ Deployment & Database Management
- **Automatic Database Sync**: Deploy script generates fresh dumps and completely overwrites live database
- **Enhanced Reliability**: Improved MySQL commands and error handling in deployment process

## Core Features

- User authentication with JWT
- Advanced betting system with Single Bets and La Quiniela modes
- **Multi-currency support** (MXN, USD, Bitcoin) with persistent user preferences
- Admin panel for managing games, teams, and users
- Real-time game updates and bet tracking
- **Mobile-optimized responsive design** with dark mode support
- Multi-language support (English/Spanish)
- Professional bet summary interfaces with live calculations
- **Touch-friendly betting interface** optimized for mobile devices
- Admin navigation and login redirect are now role-aware and minimal for admins

## June 2025: Admin Navigation & Login Redirect Update

- Admin users now see a minimal navigation: only "Admin Panel" and "Profile" are shown; "Dashboard" and "My History" are hidden for admins.
- After login, admin users are redirected to the Admin Panel (/admin) instead of the Dashboard.
- Navigation and login logic are now fully role-aware and minimal for admins, with no impact on regular user workflows.
- All changes are documented and committed to a feature branch (not merged to main).

## June 2025: UI Consistency & Admin Revenue Currency Update

- Header navigation links, user info, logout, and toggle buttons now use consistent color classes: light grey in light mode, white in dark mode.
- Navigation links font weight is now medium (500) for a unified look.
- Toggle buttons (language/theme) accept a className prop and inherit color from the header for robust, rebuild-proof styling.
- All header hover states use the brand red for both nav links and toggles.
- Admin panel: 'Ingresos Totales' (Total Revenue) is now always green and uses the correct currency and locale based on the selected language (MXN for Spanish, USD for English), with robust formatting and forced color using Tailwind's important modifier.

## Development Setup

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- PostgreSQL 14.x or later

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/laquiniela247.git
cd laquiniela247
```

2. Install dependencies:
```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

3. Set up environment variables:
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME="La Quiniela 247"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Backend (.env)
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/laquiniela247
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000
```

4. Start the development servers:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Development Notes

- The frontend uses Next.js 14 with TypeScript
- The backend uses Express with TypeScript
- Authentication is handled using JWT tokens
- CORS is configured to allow local development
- API requests are handled through a centralized axios instance
- Error boundaries are implemented for better error handling
- Loading states and error messages are shown for better UX

### Common Issues

1. CORS Issues:
   - Ensure both frontend and backend are running
   - Check that the CORS_ORIGIN in backend .env matches your frontend URL
   - Verify that credentials are being sent with requests

2. Authentication Issues:
   - Check that JWT_SECRET is properly set in backend .env
   - Verify that cookies are being set correctly
   - Ensure token refresh mechanism is working

3. Database Issues:
   - Verify PostgreSQL is running
   - Check DATABASE_URL in backend .env
   - Run migrations if needed

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting: Admin Panel Authentication 401/404 Bug (June 2025)

### Symptoms
- Admin panel and dashboard failed to load protected data.
- All API requests to `/api/admin/*`, `/api/users/profile`, etc. returned 401 or 404.
- `auth_token` cookie present in browser but not used for authentication.
- Duplicate API calls (e.g., `/api/admin/users` and `/users`).

### Investigation
- Checked frontend/backend ports, CORS, and environment variables.
- Verified Next.js rewrite config and `NEXT_PUBLIC_API_URL`.
- Confirmed cookies were set and sent by browser.
- Audited frontend API calls for correct axios instance usage.
- Checked backend CORS and cookie settings.
- Discovered backend auth middleware only checked Authorization header.

### Root Cause
- Backend only checked for JWT in Authorization header, not in `auth_token` cookie. Frontend relied on cookie for authentication, causing 401s.

### Solution
- Updated backend auth middleware to check for JWT in both Authorization header and `auth_token` cookie.
- Enabled `cookie-parser` middleware in backend.
- Audited frontend to ensure all protected API calls use the configured axios instance with `baseURL: '/api'`.
- Installed `cookie-parser` and its types in backend.

**Status:** Resolved as of June 2025. Admin panel and protected routes now authenticate correctly using cookies or headers.

## Troubleshooting: Logout Issues (June 2025)

### Symptoms
- Users unable to properly logout and re-login with different accounts
- Session state persisting after logout attempts
- Incomplete cleanup when switching between demo and admin users

### Root Cause
- Backend logout endpoint wasn't clearing HTTP-only cookies
- Frontend cookie cleanup wasn't handling domain variations
- Local/session storage not being cleared during logout

### Solution
- Enhanced backend `/auth/logout` to properly clear cookies with correct domain/path settings
- Improved frontend logout to handle development vs production domains
- Added comprehensive storage cleanup (localStorage + sessionStorage)
- Implemented fallback mechanisms for robust logout completion

**Status:** Resolved as of June 2025. Logout now works reliably across all user types and environments.

## Notes on Translations
- All translation keys are managed in `frontend/src/context/I18nContext.tsx` in the `translations` object. The JSON files in `frontend/src/locales/` are not used.

## Recent Admin UI Improvements
- Game creation now restricts minute selection to :00, :15, :30, :45.
- Existing games are grouped by week.
- A localized message is shown when no games are scheduled.

## Recent Updates
- Team logos are now shown in the admin games management section.
- User Management table displays 0 (localized) for total winnings if none exist.
- The /games page will soon show all scheduled games using only real data (mock data will be removed).