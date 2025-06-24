#!/bin/bash
# NOTE: FIREBASE_CREDENTIALS in .env.prod must be just the filename (e.g., firebase-credentials.prod.json),
# and the file must exist in the storage/ directory. Do NOT use a storage/ prefix in the env value.
set -e

# --- CONFIG ---
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
REMOTE="root@137.184.3.18"
REMOTE_PATH="/var/www/laquiniela"
DOMAIN="laquiniela247demo.live"
EMAIL="mikeaj5150@gmail.com"

# --- DEPLOYMENT OPTIONS ---
MIGRATE_DB=${MIGRATE_DB:-false}
BACKUP_PROD=${BACKUP_PROD:-false}

# --- COLORS ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command was successful
check_status() {
    if [ $? -eq 0 ]; then
        log_success "$1 completed successfully"
    else
        log_error "$1 failed"
        exit 1
    fi
}

# Function to verify service is running
verify_service() {
    local service=$1
    log_info "Verifying $service is running..."
    if ! ssh $SSH_OPTS $REMOTE "systemctl is-active --quiet $service"; then
        log_error "$service is not running!"
        exit 1
    fi
    log_success "$service is running"
}

# Function to verify PM2 process is running
verify_pm2_process() {
    local process=$1
    log_info "Verifying PM2 process $process is running..."
    if ! ssh $SSH_OPTS $REMOTE "pm2 list | grep -q $process"; then
        log_error "PM2 process $process is not running!"
        exit 1
    fi
    log_success "PM2 process $process is running"
}

# Function to backup database
backup_database() {
    local backup_file="$REMOTE_PATH/backup_$(date +%Y%m%d_%H%M%S).sql"
    log_info "Creating database backup to $backup_file..."
    execute_command "ssh $SSH_OPTS $REMOTE 'mysqldump -u root -p\"T6Bkd239XsdQA1\" laquiniela247 > $backup_file'" "create database backup"
    log_success "Backup created successfully"
}

# Function to verify database import
verify_database_import() {
    log_info "Verifying database import..."
    local table_count=$(ssh $SSH_OPTS $REMOTE "mysql -u root -p'T6Bkd239XsdQA1' laquiniela247 -e 'SHOW TABLES;' | wc -l")
    if [ "$table_count" -le 1 ]; then
        log_error "No tables found in database after import!"
        return 1
    fi
    log_success "Database verification completed successfully"
    return 0
}

# Function to rollback database
rollback_database() {
    local backup_file=$1
    log_warning "Rolling back database to previous state..."
    execute_command "ssh $SSH_OPTS $REMOTE 'mysql -u root -p\"T6Bkd239XsdQA1\" laquiniela247 < $backup_file'" "rollback database"
    log_success "Database rollback completed"
}

# --- SSH KEY CACHING ---
setup_ssh_agent() {
    log_info "Setting up SSH agent..."
    if ! command -v ssh-agent > /dev/null; then
        log_error "ssh-agent is not installed. Please install openssh-client."
        exit 1
    fi

    # Start ssh-agent if not running
    if [ -z "$SSH_AGENT_PID" ]; then
        eval "$(ssh-agent -s)"
    fi

    # Add key if not already added
    if ! ssh-add -l | grep -q "$(ssh-keygen -lf ~/.ssh/id_ed25519 2>/dev/null | awk '{print $2}')"; then
        log_info "Adding SSH key to agent..."
        ssh-add ~/.ssh/id_ed25519
    fi

    # Enable SSH agent forwarding
    SSH_OPTS="$SSH_OPTS -o ForwardAgent=yes"
    log_success "SSH agent setup complete"
}

# --- LOGGING FUNCTIONS ---
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to log step progress
log_step() {
    local current_step=$1
    local total_steps=$2
    local message=$3
    log_info "Step $current_step/$total_steps: $message"
}

log_step_complete() {
    local current_step=$1
    local total_steps=$2
    local message=$3
    log_success "Step $current_step/$total_steps completed: $message"
}

# Function to execute command with verbose output and proper error handling
execute_command() {
    local command=$1
    local description=$2
    local output
    
    log_info "$description..."
    
    # Execute command and capture both stdout and stderr
    output=$(eval "$command" 2>&1)
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        log_success "Successfully completed: $description"
        if [ ! -z "$output" ]; then
            log_info "Command output: $output"
        fi
    else
        log_error "Failed to $description (Exit code: $exit_code)"
        log_error "Command output: $output"
        log_error "Command that failed: $command"
        exit 1
    fi
}

# Start SSH agent and cache key
setup_ssh_agent

# --- DEPLOYMENT CONFIGURATION ---
log_info "=== DEPLOYMENT CONFIGURATION ==="
log_info "Database Migration: $MIGRATE_DB"
log_info "Production Backup: $BACKUP_PROD"
log_info "Target Server: $REMOTE"
log_info "Target Domain: $DOMAIN"

if [ "$MIGRATE_DB" = "true" ]; then
    log_warning "⚠️  WARNING: Database migration is ENABLED!"
    log_warning "⚠️  This will COMPLETELY OVERWRITE production database!"
    log_warning "⚠️  All production-only data will be PERMANENTLY LOST!"
    if [ "$BACKUP_PROD" = "true" ]; then
        log_info "✅ Production backup is enabled for safety"
    else
        log_warning "❌ NO BACKUP will be created - data loss is permanent!"
    fi
    log_warning "Press Ctrl+C within 10 seconds to abort deployment..."
    sleep 10
    log_info "Proceeding with database migration..."
else
    log_info "✅ Safe deployment mode - database will NOT be modified"
fi

# 0. GENERATE FRESH DATABASE DUMP (Conditional)
if [ "$MIGRATE_DB" = "true" ]; then
    log_step 0 11 "Generating fresh database dump"
    log_info "Step 0/11: Creating fresh dump.sql from local database..."

    # Check if local database exists
    if ! mysql -u root -pT6Bkd239XsdQA1 -e "USE laquiniela247;" 2>/dev/null; then
        log_error "Local database 'laquiniela247' not found! Please ensure your local database is set up."
        exit 1
    fi

    # Remove old dump if it exists
    if [ -f "dump.sql" ]; then
        log_info "Step 0/11: Removing old dump.sql..."
        rm dump.sql
    fi

    # Create fresh database dump
    execute_command "mysqldump -u root -pT6Bkd239XsdQA1 --single-transaction --routines --triggers laquiniela247 > dump.sql" "create fresh database dump"

    # Verify dump was created and is not empty
    if [ ! -f "dump.sql" ] || [ ! -s "dump.sql" ]; then
        log_error "Failed to create dump.sql or file is empty!"
        exit 1
    fi

    log_info "Step 0/11: Fresh dump.sql created successfully ($(du -h dump.sql | cut -f1))"
    log_step_complete 0 11 "Generating fresh database dump"
    log_info "10 steps remaining..."
else
    log_step 0 11 "Skipping database dump (migration disabled)"
    log_info "Step 0/11: Database migration disabled - skipping dump.sql creation"
    log_step_complete 0 11 "Skipping database dump"
    log_info "10 steps remaining..."
fi

# 1. BUILD AND PREPARE APPLICATIONS LOCALLY
log_step 1 11 "Building and preparing applications locally"
log_info "Step 1/11: Building frontend application..."

# Build frontend
cd frontend
execute_command "npm install" "install frontend dependencies"
execute_command "npm run build" "build frontend application"
cd ..

# Install backend dependencies and build
log_info "Step 1/11: Installing backend dependencies..."
execute_command "cd backend && npm install && npm install -g tsx" "install backend dependencies"

log_info "Step 1/11: Building backend application..."
execute_command "cd backend && npm run build && npx prisma generate" "build backend application and generate Prisma client"

log_step_complete 1 11 "Building and preparing applications locally"
log_info "9 steps remaining..."

# 2. PROVISION SERVER DEPENDENCIES
log_step 2 11 "Provisioning server dependencies"

# Install Nginx if not present
if ! ssh $SSH_OPTS $REMOTE "command -v nginx > /dev/null"; then
    log_info "Step 2/11: Installing Nginx..."
    execute_command "ssh $SSH_OPTS $REMOTE 'apt install -y nginx'" "install Nginx"
    
    # Configure Nginx
    log_info "Step 2/11: Writing Nginx config for SSR..."
    execute_command "ssh $SSH_OPTS $REMOTE 'cat > /etc/nginx/sites-available/default << \"NGINX_CONFIG\"
server {
    server_name laquiniela247demo.live;

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/laquiniela247demo.live/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/laquiniela247demo.live/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
server {
    if (\$host = laquiniela247demo.live) {
        return 301 https://\$host\$request_uri;
    } # managed by Certbot

    listen 80;
    listen [::]:80;
    server_name laquiniela247demo.live;
    return 404; # managed by Certbot
}
NGINX_CONFIG'" "write SSR Nginx config"

    execute_command "ssh $SSH_OPTS $REMOTE 'ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/'" "enable Nginx site"
    execute_command "ssh $SSH_OPTS $REMOTE 'nginx -t && systemctl restart nginx'" "test and restart Nginx"
    verify_service "nginx"
fi

# Install required packages
log_info "Step 2/11: Installing required packages..."
execute_command "ssh $SSH_OPTS $REMOTE 'apt install -y curl git build-essential'" "install required packages"

# Install Node.js if not present or if version is not 18.x
if ! ssh $SSH_OPTS $REMOTE "command -v node > /dev/null && node -v | grep -q 'v18'"; then
    log_info "Step 2/11: Installing Node.js 18..."
    execute_command "ssh $SSH_OPTS $REMOTE 'curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -'" "add NodeSource repository"
    execute_command "ssh $SSH_OPTS $REMOTE 'apt install -y nodejs'" "install Node.js"
    
    # Verify Node.js version
    execute_command "ssh $SSH_OPTS $REMOTE 'node -v'" "verify Node.js version"
    if ! ssh $SSH_OPTS $REMOTE "node -v | grep -q 'v18'"; then
        log_error "Node.js 18 installation failed or incorrect version installed"
        exit 1
    fi
fi

# Install PM2 if not present
if ! ssh $SSH_OPTS $REMOTE "command -v pm2 > /dev/null"; then
    log_info "Step 2/11: Installing PM2..."
    execute_command "ssh $SSH_OPTS $REMOTE 'npm install -g pm2'" "install PM2"
fi

# Install MySQL if not present
if ! ssh $SSH_OPTS $REMOTE "command -v mysql > /dev/null"; then
    log_info "Step 2/11: Installing MySQL..."
    execute_command "ssh $SSH_OPTS $REMOTE 'apt install -y mysql-server'" "install MySQL server"
    execute_command "ssh $SSH_OPTS $REMOTE 'systemctl enable mysql && systemctl start mysql'" "enable and start MySQL"
    verify_service "mysql"
fi

# Set MySQL root password
log_info "Step 2/11: Configuring MySQL..."
# Try multiple methods to set MySQL root password (some may fail, but one should work)
ssh $SSH_OPTS $REMOTE "
# Method 1: Try with sudo (for socket authentication)
sudo mysql -e \"ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'T6Bkd239XsdQA1'; FLUSH PRIVILEGES;\" 2>/dev/null || 
# Method 2: Try without password (for fresh installations)
mysql -u root -e \"ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'T6Bkd239XsdQA1'; FLUSH PRIVILEGES;\" 2>/dev/null ||
# Method 3: Try with existing password (if already set)
mysql -u root -p'T6Bkd239XsdQA1' -e \"SELECT 1;\" 2>/dev/null ||
echo 'MySQL root password configuration completed (one method succeeded or password already set)'
" && log_success "MySQL root password configured" || log_warning "MySQL password may already be set"
log_step_complete 2 11 "Provisioning server dependencies"
log_info "9 steps remaining..."

# 3. CHECK REQUIRED FILES
log_step 3 11 "Checking required files"
log_info "Step 3/11: Verifying .env files..."
if [ ! -f frontend/.env.production ] || [ ! -f backend/.env.production ]; then
    log_error "Required .env.production files are missing!"
    exit 1
fi
log_step_complete 3 11 "Checking required files"
log_info "8 steps remaining..."

# 4. ENSURE REMOTE DIRECTORY EXISTS
log_step 4 11 "Ensuring remote directory exists"
log_info "Step 4/11: Creating remote directory..."
execute_command "ssh $SSH_OPTS $REMOTE 'mkdir -p $REMOTE_PATH'" "create remote directory"
log_step_complete 4 11 "Ensuring remote directory exists"
log_info "7 steps remaining..."

# 5. UPLOAD PROJECT FILES
log_step 5 11 "Uploading project files"
log_info "Step 5/11: Uploading project files to server..."
execute_command "rsync -av -e \"ssh $SSH_OPTS\" --exclude '.git' ./ $REMOTE:$REMOTE_PATH" "upload project files"

# Enable rate limiting for production deployment
log_info "Step 5/11: Enabling rate limiting for production..."
execute_command "ssh $SSH_OPTS $REMOTE \"
cd $REMOTE_PATH/backend/src && 
sed -i 's|^// const limiter = rateLimit|const limiter = rateLimit|' index.ts &&
sed -i 's|^//   windowMs:|  windowMs:|' index.ts &&
sed -i 's|^//   max:|  max:|' index.ts &&
sed -i 's|^//   message:|  message:|' index.ts &&
sed -i 's|^//     error:|    error:|' index.ts &&
sed -i 's|^//   },|  },|' index.ts &&
sed -i 's|^//   standardHeaders:|  standardHeaders:|' index.ts &&
sed -i 's|^//   legacyHeaders:|  legacyHeaders:|' index.ts &&
sed -i 's|^// });|});|' index.ts &&
sed -i 's|^// app.use(limiter);|app.use(limiter);|' index.ts
\"" "enable rate limiting for production"

log_step_complete 5 11 "Uploading project files"
log_info "6 steps remaining..."

# 6. UPLOAD ENV FILES
log_step 6 11 "Uploading environment files"
log_info "Step 6/11: Uploading environment files..."
execute_command "rsync -av -e \"ssh $SSH_OPTS\" frontend/.env.production $REMOTE:$REMOTE_PATH/frontend/.env.local" "upload frontend env file"
execute_command "rsync -av -e \"ssh $SSH_OPTS\" backend/.env.production $REMOTE:$REMOTE_PATH/backend/.env" "upload backend env file"
log_step_complete 6 11 "Uploading environment files"
log_info "5 steps remaining..."

# 7. MIGRATE MYSQL DATABASE (Conditional)
if [ "$MIGRATE_DB" = "true" ]; then
    log_step 7 11 "Setting up database migration"
    log_info "Step 7/11: Starting database migration process..."

    # Create backup if requested
    if [ "$BACKUP_PROD" = "true" ]; then
        backup_file="$REMOTE_PATH/prod_backup_$(date +%Y%m%d_%H%M%S).sql"
        log_info "Step 7/11: Creating production database backup..."
        execute_command "ssh $SSH_OPTS $REMOTE 'mysqldump -u root -p\"T6Bkd239XsdQA1\" --single-transaction --routines --triggers laquiniela247 > $backup_file'" "backup production database"
        log_success "Production backup created: $backup_file"
    fi

    # Drop and recreate database for complete overwrite
    log_info "Step 7/11: Dropping and recreating database for complete overwrite..."
    execute_command "ssh $SSH_OPTS $REMOTE \"echo \\\"DROP DATABASE IF EXISTS laquiniela247; CREATE DATABASE laquiniela247 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\\\" | mysql -u root -p'T6Bkd239XsdQA1'\"" "drop and recreate database"

    # Upload and import dump.sql
    log_info "Step 7/11: Uploading and importing dump.sql..."
    if [ ! -f "dump.sql" ]; then
        log_error "dump.sql not found in project root! Database migration enabled but no dump file available."
        exit 1
    fi

    log_info "Step 7/11: Copying local dump.sql to server..."
    execute_command "rsync -av -e \"ssh $SSH_OPTS\" dump.sql $REMOTE:$REMOTE_PATH/" "upload dump.sql"

    log_info "Step 7/11: Importing database..."
    if ! ssh $SSH_OPTS $REMOTE "mysql -u root -p'T6Bkd239XsdQA1' laquiniela247 < $REMOTE_PATH/dump.sql"; then
        log_error "Database import failed!"
        if [ "$BACKUP_PROD" = "true" ]; then
            log_warning "Attempting rollback from backup..."
            rollback_database "$backup_file"
        fi
        exit 1
    fi

    # Verify the import
    if ! verify_database_import; then
        log_error "Database verification failed!"
        if [ "$BACKUP_PROD" = "true" ]; then
            log_warning "Attempting rollback from backup..."
            rollback_database "$backup_file"
        fi
        exit 1
    fi

    # Clean up
    log_info "Step 7/11: Cleaning up temporary files..."
    execute_command "ssh $SSH_OPTS $REMOTE 'rm -f $REMOTE_PATH/dump.sql'" "clean up temporary files"

    log_step_complete 7 11 "Database migration completed"
    log_info "4 steps remaining..."
else
    log_step 7 11 "Skipping database migration"
    log_info "Step 7/11: Database migration disabled - production database unchanged"
    log_success "Production database preserved - no data loss risk"
    log_step_complete 7 11 "Database migration skipped"
    log_info "4 steps remaining..."
fi

# 8. RESTART NODE.JS APP (PM2)
log_step 8 11 "Restarting Node.js app with PM2"
log_info "Step 8/11: Starting frontend (Next.js SSR) with PM2..."
execute_command "ssh $SSH_OPTS $REMOTE 'cd $REMOTE_PATH/frontend && pm2 delete laquiniela-frontend || true && pm2 start npm --name laquiniela-frontend -- start'" "start frontend SSR with PM2"
verify_pm2_process "laquiniela-frontend"

log_info "Step 8/11: Starting backend (Express) with PM2..."
execute_command "ssh $SSH_OPTS $REMOTE 'cd $REMOTE_PATH/backend && pm2 delete laquiniela-backend || true && pm2 start --name laquiniela-backend --interpreter \$(which tsx) src/index.ts'" "start backend with PM2"
verify_pm2_process "laquiniela-backend"
log_step_complete 8 11 "Restarting Node.js app with PM2"
log_info "3 steps remaining..."

# 9. RESTART NGINX
log_step 9 11 "Restarting Nginx"
log_info "Step 9/11: Restarting Nginx service..."
execute_command "ssh $SSH_OPTS $REMOTE 'systemctl restart nginx'" "restart Nginx"
verify_service "nginx"
log_step_complete 9 11 "Restarting Nginx"
log_info "1 step remaining..."

# Final verification (keep this as a final check)
log_step 11 11 "Performing final service verification"
log_info "Step 11/11: Verifying all services..."
verify_service "nginx"
verify_service "mysql"
verify_pm2_process "laquiniela-frontend"
verify_pm2_process "laquiniela-backend"
log_step_complete 11 11 "Final service verification"

# --- HEALTH CHECK ---
log_info "Step 11/11: Checking backend health endpoint..."
execute_command "ssh $SSH_OPTS $REMOTE 'curl -f http://localhost:3001/health'" "check backend health endpoint"

# --- MANUAL NGINX EDIT INSTRUCTIONS ---
log_info "If Nginx config fails to update, manually edit /etc/nginx/sites-available/default using nano or vim as described in the README."

log_success "Deployment completed successfully! All 11 steps completed."
log_info "Application is now running at https://$DOMAIN"

# --- DEPLOYMENT SUMMARY ---
log_info "=== DEPLOYMENT SUMMARY ==="
if [ "$MIGRATE_DB" = "true" ]; then
    log_warning "✅ Database migration: COMPLETED"
    if [ "$BACKUP_PROD" = "true" ]; then
        log_success "✅ Production backup: CREATED (check $REMOTE_PATH/prod_backup_*.sql)"
    else
        log_warning "⚠️  NO backup was created - previous data is permanently lost"
    fi
else
    log_success "✅ Safe deployment: Production database PRESERVED"
fi

log_info "=== USAGE EXAMPLES ==="
log_info "Code-only deployment (safe):        ./deploy.sh"
log_info "Database migration (destructive):   MIGRATE_DB=true ./deploy.sh"
log_info "Migration with backup (safest):     BACKUP_PROD=true MIGRATE_DB=true ./deploy.sh" 