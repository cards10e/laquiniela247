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

### Production Deployment (Live Server)

1. **Ensure your server has:**
   - Node.js 18+
   - MySQL 8+
   - Nginx
   - PM2

2. **Run the deployment script:**
   ```bash
   ./deploy.sh
   ```

3. **Nginx Configuration:**
   - The script will attempt to write the correct config. If it fails (e.g., heredoc issues), manually edit `/etc/nginx/sites-available/default`:
     ```
     server {
         server_name laquiniela247demo.live;

         location /api/ {
             proxy_pass http://localhost:3001;
             proxy_http_version 1.1;
             proxy_set_header Upgrade $http_upgrade;
             proxy_set_header Connection "upgrade";
             proxy_set_header Host $host;
             proxy_cache_bypass $http_upgrade;
         }

         location / {
             proxy_pass http://localhost:3000;
             proxy_http_version 1.1;
             proxy_set_header Upgrade $http_upgrade;
             proxy_set_header Connection "upgrade";
             proxy_set_header Host $host;
             proxy_cache_bypass $http_upgrade;
         }

         listen [::]:443 ssl ipv6only=on; # managed by Certbot
         listen 443 ssl; # managed by Certbot
         ssl_certificate /etc/letsencrypt/live/laquiniela247demo.live/fullchain.pem; # managed by Certbot
         ssl_certificate_key /etc/letsencrypt/live/laquiniela247demo.live/privkey.pem; # managed by Certbot
         include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
         ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
     }
     server {
         if ($host = laquiniela247demo.live) {
             return 301 https://$host$request_uri;
         } # managed by Certbot

         listen 80;
         listen [::]:80;
         server_name laquiniela247demo.live;
         return 404; # managed by Certbot
     }
     ```
   - Test and reload Nginx:
     ```bash
     sudo nginx -t
     sudo systemctl reload nginx
     ```

4. **PM2 Process Management:**
   - Both frontend and backend must be running under PM2:
     ```bash
     pm2 start npm --name laquiniela-frontend -- start --cwd /var/www/laquiniela/frontend
     pm2 start --name laquiniela-backend --interpreter $(which tsx) /var/www/laquiniela/backend/src/index.ts
     ```

5. **Health Check:**
   - The backend health endpoint is `/health` (not `/api/health`).

6. **Troubleshooting:**
   - If you see "Route not found" at `/`, your Nginx config is likely still proxying everything to the backend.
   - Use `nano` or `vim` to edit Nginx config if heredoc/printf fails.

**Note:**
After changing environment variables (such as `.env.local`), always run:
```
pm2 restart laquiniela-frontend --update-env
```
This ensures the running process picks up the new environment variables.

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