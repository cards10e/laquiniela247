#!/bin/bash
# NOTE: FIREBASE_CREDENTIALS in .env.prod must be just the filename (e.g., firebase-credentials.prod.json),
# and the file must exist in the storage/ directory. Do NOT use a storage/ prefix in the env value.
set -e

# --- CONFIG ---
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
REMOTE="root@137.184.3.18"
REMOTE_PATH="/var/www/laquiniela"

# 1. PROVISION SERVER DEPENDENCIES
ssh $SSH_OPTS $REMOTE <<'ENDSSH'
apt update
if ! command -v nginx > /dev/null; then
  apt install -y nginx
  # Configure Nginx to proxy requests to Node.js
  cat > /etc/nginx/sites-available/default << 'NGINX_CONFIG'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_CONFIG
  ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/
  nginx -t && systemctl restart nginx
fi
apt install -y curl git build-essential
if ! command -v node > /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
  apt install -y nodejs
fi
if ! command -v pm2 > /dev/null; then
  npm install -g pm2
fi
ENDSSH

# 2. CHECK .env FILE
if [ ! -f frontend/.env.local ] || [ ! -f backend/.env ]; then
  echo "ERROR: Required .env files are missing!"; exit 1;
fi

# 3. BUILD NEXT.JS APP LOCALLY (optional)
echo "[3/10] Building Next.js app locally..."
cd frontend
npm install
npm run build
cd ..

# 4. ENSURE REMOTE DIRECTORY EXISTS
echo "[4/10] Ensuring remote directory exists..."
ssh $SSH_OPTS $REMOTE "mkdir -p $REMOTE_PATH"

# 5. UPLOAD PROJECT FILES
echo "[5/10] Uploading project files to server..."
rsync -av --exclude 'node_modules' --exclude '.git' --exclude '.next' ./ $REMOTE:$REMOTE_PATH

# 6. UPLOAD ENV FILE
echo "[6/10] Uploading .env files..."
rsync -av frontend/.env.local $REMOTE:$REMOTE_PATH/frontend/.env.local
rsync -av backend/.env $REMOTE:$REMOTE_PATH/backend/.env

# 7. INSTALL NPM DEPENDENCIES ON SERVER (if not building locally)
echo "[7/10] Installing npm dependencies on server..."
ssh $SSH_OPTS $REMOTE "cd $REMOTE_PATH/frontend && npm install --production"
ssh $SSH_OPTS $REMOTE "cd $REMOTE_PATH/backend && npm install --production"

# 8. MIGRATE MYSQL DATABASE
echo "[8/10] Migrating MySQL database..."
LOCAL_DB_NAME=$(grep DATABASE_URL backend/.env | sed -E 's/.*\/\/[^:]+:[^@]+@[^:]+:[0-9]+\/([^?]+).*/\1/')
if [ -z "$LOCAL_DB_NAME" ]; then
  echo "ERROR: Could not extract database name from DATABASE_URL in backend/.env"; exit 1;
fi
mysqldump -u root -p"T6Bkd239XsdQA1" "$LOCAL_DB_NAME" > dump.sql
rsync -av dump.sql $REMOTE:$REMOTE_PATH/
ssh $SSH_OPTS $REMOTE "cd $REMOTE_PATH && mysql -u root -p'T6Bkd239XsdQA1' < dump.sql && rm dump.sql"
rm dump.sql

# 9. RUN PRISMA MIGRATIONS
echo "[9/10] Running Prisma migrations..."
ssh $SSH_OPTS $REMOTE "cd $REMOTE_PATH/backend && npx prisma migrate deploy"

# 10. RESTART NODE.JS APP (PM2)
echo "[10/10] Restarting Node.js app with PM2..."
ssh $SSH_OPTS $REMOTE "cd $REMOTE_PATH/frontend && pm2 startOrReload ecosystem.config.js --env production || pm2 start npm --name laquiniela-frontend -- run start"
ssh $SSH_OPTS $REMOTE "cd $REMOTE_PATH/backend && pm2 startOrReload ecosystem.config.js --env production || pm2 start npm --name laquiniela-backend -- run start"

# 11. RESTART NGINX
echo "[11/11] Restarting Nginx..."
ssh $SSH_OPTS $REMOTE "systemctl restart nginx"

echo "[DONE] Deployment complete!"

# --- 11. FINAL: Run server-side clear_and_check.sh for cache/config validation ---
ssh $REMOTE 'bash /var/www/beanstalk/scripts/clear_and_check.sh'

# --- 12. FINAL: Set permissions and ownership (must be last) ---
echo "[FINAL] Setting permissions and ownership..."
ssh $REMOTE "cd $REMOTE_PATH && chown -R www-data:www-data storage bootstrap/cache && chmod -R 775 storage bootstrap/cache" 