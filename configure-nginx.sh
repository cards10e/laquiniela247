#!/bin/bash

# Nginx Configuration Script for La Quiniela 247
# This script configures Nginx with SSL support for the working setup
# Usage: ./configure-nginx.sh

set -e

# --- CONFIG ---
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
REMOTE="root@137.184.3.18"
DOMAIN="laquiniela247demo.live"
EMAIL="mikeaj5150@gmail.com"

# --- COLORS ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to execute command with proper error handling
execute_command() {
    local command=$1
    local description=$2
    local output
    
    log_info "$description..."
    
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
        exit 1
    fi
}

log_info "=== NGINX CONFIGURATION FOR LA QUINIELA 247 ==="
log_info "Target Server: $REMOTE"
log_info "Domain: $DOMAIN"
log_info "Email: $EMAIL"

# 1. INSTALL CERTBOT IF NOT PRESENT
log_info "Step 1/6: Installing Certbot for SSL certificates..."
execute_command "ssh $SSH_OPTS $REMOTE 'which certbot || (apt update && apt install -y certbot python3-certbot-nginx)'" "install Certbot"

# 2. CONFIGURE NGINX WITH WORKING CONFIG
log_info "Step 2/6: Writing Nginx configuration for SSR setup..."
execute_command "ssh $SSH_OPTS $REMOTE 'cat > /etc/nginx/sites-available/default << \"NGINX_CONFIG\"
server {
    server_name $DOMAIN;

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }

    listen 80;
    listen [::]:80;
}
NGINX_CONFIG'" "write nginx configuration"

# 3. ENABLE SITE AND TEST CONFIGURATION
log_info "Step 3/6: Enabling site and testing configuration..."
execute_command "ssh $SSH_OPTS $REMOTE 'ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/'" "enable nginx site"
execute_command "ssh $SSH_OPTS $REMOTE 'nginx -t'" "test nginx configuration"

# 4. RESTART NGINX
log_info "Step 4/6: Restarting Nginx..."
execute_command "ssh $SSH_OPTS $REMOTE 'systemctl restart nginx'" "restart nginx"
execute_command "ssh $SSH_OPTS $REMOTE 'systemctl enable nginx'" "enable nginx on boot"

# 5. SETUP SSL WITH CERTBOT
log_info "Step 5/6: Setting up SSL certificate with Certbot..."
log_warning "This will modify the nginx configuration to add SSL support"
execute_command "ssh $SSH_OPTS $REMOTE 'certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect'" "setup SSL certificate"

# 6. VERIFY FINAL CONFIGURATION
log_info "Step 6/6: Verifying final configuration..."
execute_command "ssh $SSH_OPTS $REMOTE 'nginx -t'" "verify final nginx config"
execute_command "ssh $SSH_OPTS $REMOTE 'systemctl reload nginx'" "reload nginx with SSL config"

# VERIFY SSL AND SERVICES
log_info "Verifying SSL certificate..."
execute_command "ssh $SSH_OPTS $REMOTE 'certbot certificates'" "check SSL certificates"

log_info "Testing HTTPS endpoint..."
execute_command "ssh $SSH_OPTS $REMOTE 'curl -I https://$DOMAIN'" "test HTTPS endpoint"

log_success "=== NGINX CONFIGURATION COMPLETED SUCCESSFULLY ==="
log_info "Your application is now available at:"
log_info "🌐 https://$DOMAIN"
log_info ""
log_info "SSL Configuration Details:"
log_info "✅ HTTP to HTTPS redirect: ENABLED"
log_info "✅ SSL Certificate: ACTIVE"
log_info "✅ Frontend (Next.js SSR): Port 3000 → https://$DOMAIN/"
log_info "✅ Backend (Express API): Port 3001 → https://$DOMAIN/api/"
log_info ""
log_info "To check nginx status:"
log_info "  ssh $REMOTE 'systemctl status nginx'"
log_info ""
log_info "To view nginx logs:"
log_info "  ssh $REMOTE 'tail -f /var/log/nginx/access.log'"
log_info "  ssh $REMOTE 'tail -f /var/log/nginx/error.log'"
log_info ""
log_info "To renew SSL certificate (auto-renewal is already configured):"
log_info "  ssh $REMOTE 'certbot renew --dry-run'" 