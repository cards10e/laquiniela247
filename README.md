# La Quiniela 247

A modern web application for managing and participating in sports predictions.

## Features

- User authentication with JWT
- Admin panel for managing games, teams, and users
- Real-time game updates
- Responsive design with dark mode support
- Multi-language support

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