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

# 1. BUILD AND PREPARE APPLICATIONS LOCALLY
log_step 1 10 "Building and preparing applications locally"
log_info "Step 1/10: Building frontend application..."

# Build frontend
cd frontend
execute_command "npm install" "install frontend dependencies"
execute_command "npm run build" "build frontend application"
cd ..

# Install backend dependencies and build
log_info "Step 1/10: Installing backend production dependencies..."
execute_command "cd backend && npm install --production && npm install -g tsx" "install backend production dependencies"

log_info "Step 1/10: Building backend application..."
execute_command "cd backend && npm run build && npx prisma generate" "build backend application and generate Prisma client"

log_step_complete 1 10 "Building and preparing applications locally"
log_info "9 steps remaining..."

# 2. PROVISION SERVER DEPENDENCIES
log_step 2 10 "Provisioning server dependencies"

# Install Nginx if not present
if ! ssh $SSH_OPTS $REMOTE "command -v nginx > /dev/null"; then
    log_info "Step 2/10: Installing Nginx..."
    execute_command "ssh $SSH_OPTS $REMOTE 'apt install -y nginx'" "install Nginx"
    
    # Configure Nginx
    log_info "Step 2/10: Writing Nginx config for SSR..."
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
log_info "Step 2/10: Installing required packages..."
execute_command "ssh $SSH_OPTS $REMOTE 'apt install -y curl git build-essential'" "install required packages"

# Install Node.js if not present or if version is not 18.x
if ! ssh $SSH_OPTS $REMOTE "command -v node > /dev/null && node -v | grep -q 'v18'"; then
    log_info "Step 2/10: Installing Node.js 18..."
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
    log_info "Step 2/10: Installing PM2..."
    execute_command "ssh $SSH_OPTS $REMOTE 'npm install -g pm2'" "install PM2"
fi

# Install MySQL if not present
if ! ssh $SSH_OPTS $REMOTE "command -v mysql > /dev/null"; then
    log_info "Step 2/10: Installing MySQL..."
    execute_command "ssh $SSH_OPTS $REMOTE 'apt install -y mysql-server'" "install MySQL server"
    execute_command "ssh $SSH_OPTS $REMOTE 'systemctl enable mysql && systemctl start mysql'" "enable and start MySQL"
    verify_service "mysql"
fi

# Set MySQL root password
log_info "Step 2/10: Configuring MySQL..."
execute_command "ssh $SSH_OPTS $REMOTE \"mysql -u root -e \\\"ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'T6Bkd239XsdQA1'; FLUSH PRIVILEGES;\\\"\"" "set MySQL root password"
log_step_complete 2 10 "Provisioning server dependencies"
log_info "8 steps remaining..."

# 3. CHECK REQUIRED FILES
log_step 3 10 "Checking required files"
log_info "Step 3/10: Verifying .env files..."
if [ ! -f frontend/.env.production ] || [ ! -f backend/.env.production ]; then
    log_error "Required .env.production files are missing!"
    exit 1
fi
log_step_complete 3 10 "Checking required files"
log_info "7 steps remaining..."

# 4. ENSURE REMOTE DIRECTORY EXISTS
log_step 4 10 "Ensuring remote directory exists"
log_info "Step 4/10: Creating remote directory..."
execute_command "ssh $SSH_OPTS $REMOTE 'mkdir -p $REMOTE_PATH'" "create remote directory"
log_step_complete 4 10 "Ensuring remote directory exists"
log_info "6 steps remaining..."

# 5. UPLOAD PROJECT FILES
log_step 5 10 "Uploading project files"
log_info "Step 5/10: Uploading project files to server..."
execute_command "rsync -av -e \"ssh $SSH_OPTS\" --exclude '.git' ./ $REMOTE:$REMOTE_PATH" "upload project files"
log_step_complete 5 10 "Uploading project files"
log_info "5 steps remaining..."

# 6. UPLOAD ENV FILES
log_step 6 10 "Uploading environment files"
log_info "Step 6/10: Uploading environment files..."
execute_command "rsync -av -e \"ssh $SSH_OPTS\" frontend/.env.production $REMOTE:$REMOTE_PATH/frontend/.env.local" "upload frontend env file"
execute_command "rsync -av -e \"ssh $SSH_OPTS\" backend/.env.production $REMOTE:$REMOTE_PATH/backend/.env" "upload backend env file"
log_step_complete 6 10 "Uploading environment files"
log_info "4 steps remaining..."

# 7. MIGRATE MYSQL DATABASE
log_step 7 10 "Setting up database"
log_info "Step 7/10: Starting database migration process..."

# Create database if it doesn't exist
log_info "Step 7/10: Creating database..."
execute_command "ssh $SSH_OPTS $REMOTE 'mysql -u root -p\"T6Bkd239XsdQA1\" -e \"CREATE DATABASE IF NOT EXISTS laquiniela247 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\"'" "create database"

# Backup existing database if it exists
backup_file="$REMOTE_PATH/backup_$(date +%Y%m%d_%H%M%S).sql"
backup_database

# Upload and import dump.sql
log_info "Step 7/10: Uploading and importing dump.sql..."
if [ ! -f "dump.sql" ]; then
    log_error "dump.sql not found in project root! Please create it before deploying."
    exit 1
fi

log_info "Step 7/10: Copying local dump.sql to server..."
execute_command "rsync -av -e \"ssh $SSH_OPTS\" dump.sql $REMOTE:$REMOTE_PATH/" "upload dump.sql"

log_info "Step 7/10: Importing database..."
if ! ssh $SSH_OPTS $REMOTE "mysql -u root -p'T6Bkd239XsdQA1' laquiniela247 < $REMOTE_PATH/dump.sql"; then
    log_error "Database import failed!"
    log_warning "Attempting rollback..."
    rollback_database "$backup_file"
    exit 1
fi

# Verify the import
if ! verify_database_import; then
    log_error "Database verification failed!"
    log_warning "Attempting rollback..."
    rollback_database "$backup_file"
    exit 1
fi

# Clean up
log_info "Step 7/10: Cleaning up temporary files..."
execute_command "ssh $SSH_OPTS $REMOTE 'rm -f $REMOTE_PATH/dump.sql'" "clean up temporary files"

log_step_complete 7 10 "Setting up database"
log_info "3 steps remaining..."

# 8. RESTART NODE.JS APP (PM2)
log_step 8 10 "Restarting Node.js app with PM2"
log_info "Step 8/10: Starting frontend (Next.js SSR) with PM2..."
execute_command "ssh $SSH_OPTS $REMOTE 'cd $REMOTE_PATH/frontend && pm2 delete laquiniela-frontend || true && pm2 start npm --name laquiniela-frontend -- start'" "start frontend SSR with PM2"
verify_pm2_process "laquiniela-frontend"

log_info "Step 8/10: Starting backend (Express) with PM2..."
execute_command "ssh $SSH_OPTS $REMOTE 'cd $REMOTE_PATH/backend && pm2 delete laquiniela-backend || true && pm2 start --name laquiniela-backend --interpreter \$(which tsx) src/index.ts'" "start backend with PM2"
verify_pm2_process "laquiniela-backend"
log_step_complete 8 10 "Restarting Node.js app with PM2"
log_info "2 steps remaining..."

# 9. RESTART NGINX
log_step 9 10 "Restarting Nginx"
log_info "Step 9/10: Restarting Nginx service..."
execute_command "ssh $SSH_OPTS $REMOTE 'systemctl restart nginx'" "restart Nginx"
verify_service "nginx"
log_step_complete 9 10 "Restarting Nginx"
log_info "1 step remaining..."

# Final verification (keep this as a final check)
log_step 10 10 "Performing final service verification"
log_info "Step 10/10: Verifying all services..."
verify_service "nginx"
verify_service "mysql"
verify_pm2_process "laquiniela-frontend"
verify_pm2_process "laquiniela-backend"
log_step_complete 10 10 "Final service verification"

# --- HEALTH CHECK ---
log_info "Step 10/10: Checking backend health endpoint..."
execute_command "ssh $SSH_OPTS $REMOTE 'curl -f http://localhost:3001/health'" "check backend health endpoint"

# --- MANUAL NGINX EDIT INSTRUCTIONS ---
log_info "If Nginx config fails to update, manually edit /etc/nginx/sites-available/default using nano or vim as described in the README."

log_success "Deployment completed successfully! All 10 steps completed."
log_info "Application is now running at https://$DOMAIN" 