#!/bin/bash
# NOTE: FIREBASE_CREDENTIALS in .env.prod must be just the filename (e.g., firebase-credentials.prod.json),
# and the file must exist in the storage/ directory. Do NOT use a storage/ prefix in the env value.
set -e

# --- CONFIG ---
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
REMOTE="root@137.184.3.18"
REMOTE_PATH="/var/www/laquiniela"
DOMAIN="laquinela247demo.live"
EMAIL="mikeaj5150@gmail.com"

# --- COLORS ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check command status with detailed error reporting
check_status() {
    local exit_code=$?
    local error_message=$1
    local command_output=$2

    if [ $exit_code -ne 0 ]; then
        log_error "$error_message (Exit code: $exit_code)"
        if [ ! -z "$command_output" ]; then
            log_error "Command output: $command_output"
        fi
        exit 1
    fi
}

# Function to verify service status with detailed output
verify_service() {
    local service=$1
    local max_retries=${2:-3}  # Default to 3 retries
    local retry_count=0
    local wait_time=5  # Seconds to wait between retries

    log_info "Verifying $service service status..."
    
    while [ $retry_count -lt $max_retries ]; do
        if ssh $SSH_OPTS $REMOTE "systemctl is-active --quiet $service"; then
            log_success "$service is running"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $max_retries ]; then
            log_warning "$service is not running. Retrying in ${wait_time} seconds... (Attempt $retry_count of $max_retries)"
            sleep $wait_time
        fi
    done

    local status=$(ssh $SSH_OPTS $REMOTE "systemctl status $service")
    log_error "$service failed to start after $max_retries attempts!"
    log_error "Service status: $status"
    exit 1
}

# Function to verify PM2 process
verify_pm2_process() {
    local process_name=$1
    local max_retries=${2:-3}  # Default to 3 retries
    local retry_count=0
    local wait_time=5  # Seconds to wait between retries

    log_info "Verifying PM2 process: $process_name..."
    
    while [ $retry_count -lt $max_retries ]; do
        if ssh $SSH_OPTS $REMOTE "pm2 list | grep -q $process_name"; then
            local status=$(ssh $SSH_OPTS $REMOTE "pm2 show $process_name | grep 'status'")
            if echo "$status" | grep -q "online"; then
                log_success "PM2 process $process_name is running"
                return 0
            fi
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $max_retries ]; then
            log_warning "PM2 process $process_name is not running. Retrying in ${wait_time} seconds... (Attempt $retry_count of $max_retries)"
            sleep $wait_time
        fi
    done

    local status=$(ssh $SSH_OPTS $REMOTE "pm2 show $process_name")
    log_error "PM2 process $process_name failed to start after $max_retries attempts!"
    log_error "Process status: $status"
    exit 1
}

# Function to execute command with verbose output
execute_command() {
    local command=$1
    local description=$2
    local output

    log_info "$description..."
    output=$(eval "$command" 2>&1)
    local exit_code=$?

    if [ $exit_code -ne 0 ]; then
        log_error "Failed to $description"
        log_error "Command: $command"
        log_error "Output: $output"
        exit 1
    fi

    log_success "Successfully completed: $description"
    if [ ! -z "$output" ]; then
        echo "$output"
    fi
}

# Function to verify SSL certificate
verify_ssl_certificate() {
    local domain=$1
    local max_retries=${2:-3}
    local retry_count=0
    local wait_time=10

    log_info "Verifying SSL certificate for $domain..."
    
    while [ $retry_count -lt $max_retries ]; do
        if ssh $SSH_OPTS $REMOTE "test -f /etc/letsencrypt/live/$domain/fullchain.pem"; then
            local cert_info=$(ssh $SSH_OPTS $REMOTE "openssl x509 -in /etc/letsencrypt/live/$domain/fullchain.pem -text -noout")
            if echo "$cert_info" | grep -q "Subject: CN = $domain"; then
                log_success "SSL certificate for $domain is valid"
                return 0
            fi
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $max_retries ]; then
            log_warning "SSL certificate not found or invalid. Retrying in ${wait_time} seconds... (Attempt $retry_count of $max_retries)"
            sleep $wait_time
        fi
    done

    log_error "Failed to verify SSL certificate after $max_retries attempts"
    return 1
}

# Start SSH agent and cache key
setup_ssh_agent

# 1. BUILD AND PREPARE APPLICATIONS LOCALLY
log_info "Starting deployment process..."
log_info "Step 1/13: Building and preparing applications locally"

# Build frontend
log_info "Building frontend application..."
cd frontend
execute_command "npm install" "install frontend dependencies"
execute_command "npm run build" "build frontend application"
cd ..

# Install production dependencies for backend
log_info "Installing backend production dependencies..."
cd backend
execute_command "npm install --production" "install backend production dependencies"
cd ..

# 2. PROVISION SERVER DEPENDENCIES
log_info "Step 2/13: Provisioning server dependencies"
execute_command "ssh $SSH_OPTS $REMOTE 'apt update'" "update package lists"

# Install Nginx if not present
if ! ssh $SSH_OPTS $REMOTE "command -v nginx > /dev/null"; then
    log_info "Installing Nginx..."
    execute_command "ssh $SSH_OPTS $REMOTE 'apt install -y nginx'" "install Nginx"
    
    # Configure Nginx
    log_info "Configuring Nginx..."
    ssh $SSH_OPTS $REMOTE "cat > /etc/nginx/sites-available/default << 'NGINX_CONFIG'
server {
    listen 80;
    listen [::]:80;
    server_name laquinela247demo.live;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX_CONFIG"
    check_status "create Nginx configuration"

    execute_command "ssh $SSH_OPTS $REMOTE 'ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/'" "enable Nginx site"
    execute_command "ssh $SSH_OPTS $REMOTE 'nginx -t && systemctl restart nginx'" "test and restart Nginx"
    verify_service "nginx"
fi

# Install Certbot if not present
if ! ssh $SSH_OPTS $REMOTE "command -v certbot > /dev/null"; then
    log_info "Installing Certbot..."
    execute_command "ssh $SSH_OPTS $REMOTE 'apt install -y certbot python3-certbot-nginx'" "install Certbot"
fi

# Install required packages
log_info "Installing required packages..."
execute_command "ssh $SSH_OPTS $REMOTE 'apt install -y curl git build-essential'" "install required packages"

# Install Node.js if not present
if ! ssh $SSH_OPTS $REMOTE "command -v node > /dev/null"; then
    log_info "Installing Node.js..."
    execute_command "ssh $SSH_OPTS $REMOTE 'curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -'" "add NodeSource repository"
    execute_command "ssh $SSH_OPTS $REMOTE 'apt install -y nodejs'" "install Node.js"
fi

# Install PM2 if not present
if ! ssh $SSH_OPTS $REMOTE "command -v pm2 > /dev/null"; then
    log_info "Installing PM2..."
    execute_command "ssh $SSH_OPTS $REMOTE 'npm install -g pm2'" "install PM2"
fi

# Install MySQL if not present
if ! ssh $SSH_OPTS $REMOTE "command -v mysql > /dev/null"; then
    log_info "Installing MySQL..."
    execute_command "ssh $SSH_OPTS $REMOTE 'apt install -y mysql-server'" "install MySQL server"
    execute_command "ssh $SSH_OPTS $REMOTE 'systemctl enable mysql && systemctl start mysql'" "enable and start MySQL"
    verify_service "mysql"
fi

# Set MySQL root password
log_info "Configuring MySQL..."
execute_command "ssh $SSH_OPTS $REMOTE \"mysql -u root -e \\\"ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'T6Bkd239XsdQA1'; FLUSH PRIVILEGES;\\\"\"" "set MySQL root password"

# 3. SETUP SSL CERTIFICATE
log_info "Step 3/13: Setting up SSL certificate"
if ! ssh $SSH_OPTS $REMOTE "test -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem"; then
    log_info "Installing SSL certificate..."
    
    # Check if certbot is installed
    if ! ssh $SSH_OPTS $REMOTE "command -v certbot > /dev/null"; then
        log_error "Certbot is not installed. Please install it first."
        exit 1
    fi

    # Check if domain is accessible
    if ! ssh $SSH_OPTS $REMOTE "curl -s -o /dev/null -w '%{http_code}' http://$DOMAIN" | grep -q "200"; then
        log_error "Domain $DOMAIN is not accessible. Please ensure DNS is configured correctly."
        exit 1
    fi

    # Install certificate with retry mechanism
    local cert_retry_count=0
    local max_cert_retries=3
    local cert_wait_time=30

    while [ $cert_retry_count -lt $max_cert_retries ]; do
        if execute_command "ssh $SSH_OPTS $REMOTE 'certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL'" "install SSL certificate"; then
            if verify_ssl_certificate "$DOMAIN"; then
                break
            fi
        fi
        
        cert_retry_count=$((cert_retry_count + 1))
        if [ $cert_retry_count -lt $max_cert_retries ]; then
            log_warning "SSL certificate installation failed. Retrying in ${cert_wait_time} seconds... (Attempt $cert_retry_count of $max_cert_retries)"
            sleep $cert_wait_time
        else
            log_error "Failed to install SSL certificate after $max_cert_retries attempts"
            exit 1
        fi
    done

    # Verify Nginx configuration
    execute_command "ssh $SSH_OPTS $REMOTE 'nginx -t'" "verify Nginx configuration"
    verify_service "nginx"
else
    log_info "SSL certificate already exists, verifying..."
    if ! verify_ssl_certificate "$DOMAIN"; then
        log_error "Existing SSL certificate is invalid"
        exit 1
    fi
fi

# 4. CHECK REQUIRED FILES
log_info "Step 4/13: Checking required files"
if [ ! -f frontend/.env.local ] || [ ! -f backend/.env ]; then
    log_error "Required .env files are missing!"
    exit 1
fi

# Check Firebase credentials
FIREBASE_CREDENTIALS=$(grep FIREBASE_CREDENTIALS frontend/.env.local | cut -d'=' -f2)
if [ ! -f "storage/$FIREBASE_CREDENTIALS" ]; then
    log_error "Firebase credentials file not found in storage directory!"
    exit 1
fi

# 5. ENSURE REMOTE DIRECTORY EXISTS
log_info "Step 5/13: Ensuring remote directory exists"
execute_command "ssh $SSH_OPTS $REMOTE 'mkdir -p $REMOTE_PATH'" "create remote directory"

# 6. UPLOAD PROJECT FILES
log_info "Step 6/13: Uploading project files"
execute_command "rsync -av --exclude '.git' ./ $REMOTE:$REMOTE_PATH" "upload project files"

# 7. UPLOAD ENV FILES
log_info "Step 7/13: Uploading environment files"
execute_command "rsync -av frontend/.env.local $REMOTE:$REMOTE_PATH/frontend/.env.local" "upload frontend env file"
execute_command "rsync -av backend/.env $REMOTE:$REMOTE_PATH/backend/.env" "upload backend env file"

# 8. MIGRATE MYSQL DATABASE
log_info "Step 8/13: Setting up database"

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

# Main database migration process
log_info "Starting database migration process..."

# Create database if it doesn't exist
log_info "Ensuring database exists..."
execute_command "ssh $SSH_OPTS $REMOTE 'mysql -u root -p\"T6Bkd239XsdQA1\" -e \"CREATE DATABASE IF NOT EXISTS laquiniela247 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\"'" "create database"

# Backup existing database if it exists
backup_file="$REMOTE_PATH/backup_$(date +%Y%m%d_%H%M%S).sql"
backup_database

# Upload and import dump.sql
log_info "Step 9/13: Uploading and importing dump.sql"
if [ ! -f "dump.sql" ]; then
    log_error "dump.sql not found in project root! Please create it before deploying."
    exit 1
fi

log_info "Copying local dump.sql to server..."
execute_command "rsync -av dump.sql $REMOTE:$REMOTE_PATH/" "upload dump.sql"

log_info "Importing database..."
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
log_info "Cleaning up temporary files..."
execute_command "ssh $SSH_OPTS $REMOTE 'rm -f $REMOTE_PATH/dump.sql'" "clean up temporary files"

log_success "Database migration completed successfully!"

# 9. RUN PRISMA MIGRATIONS
log_info "Step 10/13: Running Prisma migrations"
execute_command "ssh $SSH_OPTS $REMOTE 'cd $REMOTE_PATH/backend && npx prisma migrate deploy'" "run Prisma migrations"

# 10. RESTART NODE.JS APP (PM2)
log_info "Step 11/13: Restarting Node.js app with PM2"
execute_command "ssh $SSH_OPTS $REMOTE 'pm2 delete laquiniela-frontend laquiniela-backend || true'" "clean up existing PM2 processes"

log_info "Starting frontend application..."
execute_command "ssh $SSH_OPTS $REMOTE 'cd $REMOTE_PATH/frontend && pm2 startOrReload ecosystem.config.js --env production || pm2 start npm --name laquiniela-frontend -- run start'" "start frontend application"
verify_pm2_process "laquiniela-frontend"

log_info "Starting backend application..."
execute_command "ssh $SSH_OPTS $REMOTE 'cd $REMOTE_PATH/backend && pm2 startOrReload ecosystem.config.js --env production || pm2 start npm --name laquiniela-backend -- run start'" "start backend application"
verify_pm2_process "laquiniela-backend"

# 11. RESTART NGINX
log_info "Step 12/13: Restarting Nginx"
execute_command "ssh $SSH_OPTS $REMOTE 'systemctl restart nginx'" "restart Nginx"
verify_service "nginx"

# Final verification (keep this as a final check)
log_info "Step 13/13: Performing final service verification"
verify_service "nginx"
verify_service "mysql"
verify_pm2_process "laquiniela-frontend"
verify_pm2_process "laquiniela-backend"

# Set permissions and ownership
log_info "Setting permissions and ownership..."
execute_command "ssh $SSH_OPTS $REMOTE 'cd $REMOTE_PATH && chown -R www-data:www-data storage bootstrap/cache && chmod -R 775 storage bootstrap/cache'" "set permissions"

log_success "Deployment completed successfully!"
log_info "Application is now running at https://$DOMAIN" 