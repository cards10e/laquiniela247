# La Quiniela 247 - Online Betting Platform for Liga MX

La Quiniela 247 is a modern, secure, and user-friendly online betting platform specifically designed for Liga MX matches in Mexico. Built with Next.js 14, Express.js, and MySQL, it offers a complete betting experience with real-time updates and mobile-first design.

## 🌟 Features

### For Users
- **Betting System**
  - Place bets on Liga MX matches
  - Single bets and parlays
  - Real-time odds and results
  - Historical performance tracking
  - Weekly betting deadlines

- **User Experience**
  - User-friendly dashboard
  - Personal statistics and history
  - Performance analytics
  - Dark mode support
  - Mobile-first responsive design
  - Progressive Web App (PWA)

- **Security & Authentication**
  - Secure user registration
  - Email verification
  - Password reset functionality
  - JWT authentication
  - HTTPS encryption
  - CSRF protection

### For Administrators
- **Admin Dashboard**
  - User management
  - Game scheduling
  - Week management
  - Analytics and reporting
  - Real-time monitoring

- **Content Management**
  - Match scheduling
  - Result updates
  - Team management
  - Week configuration
  - Betting deadlines

## 🛠 Technical Stack

- **Frontend**
  - Next.js 14
  - React 18
  - TypeScript
  - Tailwind CSS
  - Server-Side Rendering (SSR)
  - Static Site Generation (SSG)

- **Backend**
  - Express.js
  - TypeScript
  - Prisma ORM
  - MySQL Database
  - JWT Authentication
  - Zod Validation

- **Infrastructure**
  - Nginx Web Server
  - PM2 Process Manager
  - SSL/TLS Encryption
  - Automated Deployment
  - Database Migrations

## 🌐 Internationalization

- Full Spanish and English support
- Localized content and UI
- Region-specific betting rules
- Currency handling

## 🔒 Security Features

- HTTPS encryption
- CSRF protection
- Input validation
- Rate limiting
- Secure password handling
- JWT token management
- SQL injection prevention
- XSS protection

## 📱 Mobile Experience

- Responsive design
- Touch-optimized interface
- Offline capabilities
- Push notifications
- Fast loading times
- Native-like experience

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8+
- Nginx
- PM2

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../backend
   npm install
   ```
3. Set up environment variables
4. Run database migrations
5. Start the development servers

### Deployment
Use the provided `deploy.sh` script for automated deployment:
```bash
./deploy.sh
```

## 📊 Database

The platform uses MySQL with Prisma ORM for data management. Key features include:
- Automated migrations
- Data seeding
- Backup and restore
- Performance optimization
- Data integrity checks

## 🔄 Development Workflow

1. Feature development
2. Code review
3. Testing
4. Staging deployment
5. Production deployment

## 📝 License

Proprietary - All rights reserved

## 🤝 Support

For support, please contact the development team or refer to the documentation.

---

© 2024 La Quiniela 247. All rights reserved.