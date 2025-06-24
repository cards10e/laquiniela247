#!/bin/bash

# Nginx Configuration Script for La Quiniela 247 (Cloudflare Edition)
# This script configures Nginx to work behind Cloudflare proxy
# Usage: ./configure-nginx-cloudflare.sh

set -e

# --- CONFIG ---
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
REMOTE="root@137.184.3.18"
DOMAIN="laquiniela247demo.live"

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

log_info "=== NGINX CONFIGURATION FOR LA QUINIELA 247 (CLOUDFLARE) ==="
log_info "Target Server: $REMOTE"
log_info "Domain: $DOMAIN"
log_warning "Configuring for Cloudflare proxy (no local SSL needed)"

# 1. CONFIGURE NGINX WITH CLOUDFLARE-OPTIMIZED CONFIG
log_info "Step 1/4: Writing Nginx configuration for Cloudflare setup..."
execute_command "ssh $SSH_OPTS $REMOTE 'cat > /etc/nginx/sites-available/default << \"NGINX_CONFIG\"
# Nginx config optimized for Cloudflare proxy
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Real IP configuration for Cloudflare
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 2400:cb00::/32;
    set_real_ip_from 2606:4700::/32;
    set_real_ip_from 2803:f800::/32;
    set_real_ip_from 2405:b500::/32;
    set_real_ip_from 2405:8100::/32;
    set_real_ip_from 2c0f:f248::/32;
    set_real_ip_from 2a06:98c0::/29;
    real_ip_header CF-Connecting-IP;

    # API routes (backend on port 3001)
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_set_header CF-Connecting-IP \\\$http_cf_connecting_ip;
        proxy_cache_bypass \\\$http_upgrade;
        
        # Security headers for API
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
    }

    # Frontend routes (Next.js SSR on port 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_set_header CF-Connecting-IP \\\$http_cf_connecting_ip;
        proxy_cache_bypass \\\$http_upgrade;
        
        # Security headers
        add_header X-Frame-Options SAMEORIGIN;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection \"1; mode=block\";
    }

    # Health check endpoint (bypass proxy for monitoring)
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }

    # Static assets caching
    location ~* \\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\\\$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \\\$host;
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
NGINX_CONFIG'" "write Cloudflare-optimized nginx configuration"

# 2. ENABLE SITE AND TEST CONFIGURATION
log_info "Step 2/4: Enabling site and testing configuration..."
execute_command "ssh $SSH_OPTS $REMOTE 'ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/'" "enable nginx site"
execute_command "ssh $SSH_OPTS $REMOTE 'nginx -t'" "test nginx configuration"

# 3. RESTART NGINX
log_info "Step 3/4: Restarting Nginx..."
execute_command "ssh $SSH_OPTS $REMOTE 'systemctl restart nginx'" "restart nginx"
execute_command "ssh $SSH_OPTS $REMOTE 'systemctl enable nginx'" "enable nginx on boot"

# 4. VERIFY CONFIGURATION AND TEST
log_info "Step 4/4: Verifying configuration and testing..."
execute_command "ssh $SSH_OPTS $REMOTE 'systemctl status nginx --no-pager'" "check nginx status"

# Test internal connectivity
log_info "Testing internal services..."
execute_command "ssh $SSH_OPTS $REMOTE 'curl -f http://localhost:3000 > /dev/null'" "test frontend on port 3000"
execute_command "ssh $SSH_OPTS $REMOTE 'curl -f http://localhost:3001/health'" "test backend health endpoint"

# Test through nginx
execute_command "ssh $SSH_OPTS $REMOTE 'curl -f http://localhost/health'" "test health through nginx"

log_success "=== NGINX CLOUDFLARE CONFIGURATION COMPLETED SUCCESSFULLY ==="
log_info ""
log_info "🌐 Your application is now available at: https://$DOMAIN"
log_info "   (SSL handled by Cloudflare)"
log_info ""
log_info "Configuration Details:"
log_info "✅ Cloudflare Real IP detection: ENABLED"
log_info "✅ Frontend (Next.js SSR): Port 3000 → https://$DOMAIN/"
log_info "✅ Backend (Express API): Port 3001 → https://$DOMAIN/api/"
log_info "✅ Health endpoint: https://$DOMAIN/health"
log_info "✅ Static asset caching: ENABLED"
log_info "✅ Gzip compression: ENABLED"
log_info "✅ Security headers: ENABLED"
log_info ""
log_warning "CLOUDFLARE CONFIGURATION REMINDERS:"
log_info "1. Set Cloudflare SSL mode to 'Flexible' or 'Full' (not 'Full Strict')"
log_info "2. Enable 'Always Use HTTPS' in Cloudflare"
log_info "3. Consider enabling Cloudflare caching rules for static assets"
log_info ""
log_info "To check nginx status:"
log_info "  ssh $REMOTE 'systemctl status nginx'"
log_info ""
log_info "To view nginx logs:"
log_info "  ssh $REMOTE 'tail -f /var/log/nginx/access.log'"
log_info "  ssh $REMOTE 'tail -f /var/log/nginx/error.log'" 