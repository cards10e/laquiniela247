# La Quiniela 247 - Standalone Website

## Overview

This is the standalone version of La Quiniela 247, migrated from WordPress to a modern web application stack. The application provides a complete betting platform for Liga MX football matches with user authentication, betting system, and comprehensive statistics tracking.

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks
- **Authentication**: JWT with secure cookies
- **Internationalization**: Spanish (default) and English

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **Security**: CORS, Helmet, Rate Limiting

### Database
- **Primary**: MySQL 8.0+
- **ORM**: Prisma
- **Caching**: Redis (optional)

## Project Structure

```
laquiniela247/
├── frontend/              # Next.js React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Next.js pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── context/       # React context providers
│   │   ├── utils/         # Utility functions
│   │   └── styles/        # Global styles and Tailwind config
│   ├── public/            # Static assets
│   └── package.json
├── backend/               # Express.js API server
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   ├── prisma/            # Database schema and migrations
│   └── package.json
├── database/              # Database setup and migrations
├── docs/                  # Documentation
├── docker-compose.yml     # Development environment
└── package.json           # Root package configuration
```

## Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Installation

1. **Install all dependencies:**
```bash
npm run install:all
```

2. **Setup environment variables:**
```bash
# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# Frontend environment  
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with API URL
```

3. **Setup database:**
```bash
npm run setup
```

4. **Start development servers:**
```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## Features

### User Features
- ✅ **Authentication**: Registration, login, password reset with email verification
- ✅ **Dashboard**: Personal statistics, performance tracking, and weekly summaries
- ✅ **Betting System**: Place predictions on Liga MX matches with real-time odds
- ✅ **History**: View past bets, results, and performance analytics
- ✅ **Profile Management**: Update account settings, preferences, and personal info
- ✅ **Internationalization**: Full Spanish and English language support
- ✅ **Dark Mode**: Toggle between light and dark themes
- ✅ **Responsive Design**: Mobile-first approach with hamburger navigation

### Admin Features
- ✅ **User Management**: View, edit, and manage user accounts
- ✅ **Game Management**: Create, update, and manage Liga MX matches
- ✅ **Week Management**: Setup betting weeks and deadlines
- ✅ **Analytics Dashboard**: Platform statistics and user performance
- ✅ **Transaction Management**: Handle payments and winnings
- ✅ **System Logs**: Monitor application activity and errors

### Technical Features
- ✅ **Progressive Web App**: Offline capabilities and app-like experience
- ✅ **Real-time Updates**: Live match updates and betting status
- ✅ **Security**: HTTPS, CSRF protection, input validation, SQL injection prevention
- ✅ **Performance**: Optimized loading, caching, and asset compression
- ✅ **SEO Optimized**: Server-side rendering with Next.js
- ✅ **Accessibility**: WCAG 2.1 AA compliance

## Database Schema

The application uses 7 main tables migrated from WordPress:

### Core Tables
- **`teams`** - Liga MX team information (18 teams)
- **`games`** - Match fixtures, results, and status
- **`weeks`** - Betting periods and deadlines
- **`bets`** - User predictions and results

### User Management
- **`user_profiles`** - Extended user information and statistics
- **`user_performance`** - Weekly performance tracking
- **`transactions`** - Payment and winnings history

## URL Structure

All existing URLs are preserved from the WordPress version:

```
/                    → Login page (entry point)
/register           → User registration
/dashboard          → User dashboard
/bet                → Betting interface
/profile            → User profile management
/history            → Betting history
/results            → Game results
/admin-panel        → Admin dashboard (admin only)
/payment            → Payment management
/live-betting       → Real-time betting
/password-reset     → Password recovery
/email-verification → Email verification
```

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
```

### Database Operations
```bash
# Reset database
npm run migrate:db

# Seed with demo data
npm run seed:db
```

## Demo Credentials

For testing purposes:
- **Email**: demo@laquiniela247.mx
- **Password**: demo123

## Migration Notes

This standalone version maintains 100% functional parity with the WordPress plugin version:

- ✅ All existing user data migrated
- ✅ Complete betting system preserved
- ✅ Admin functionality maintained
- ✅ URL structure unchanged
- ✅ UI/UX design preserved
- ✅ Mobile responsiveness improved
- ✅ Performance optimized

## Support

For technical support or questions:
- **Documentation**: See `/docs` directory
- **Issues**: Create GitHub issues for bugs
- **Development**: See `CONTRIBUTING.md`

## License

MIT License - see LICENSE file for details.

---

**Version**: 1.0.0  
**Migration Date**: January 2025  
**WordPress Plugin Version**: 1.0.1