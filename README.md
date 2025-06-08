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