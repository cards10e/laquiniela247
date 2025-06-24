#!/bin/bash

# Server Preparation Script - Run this before deploy.sh
# Usage: ./prep-server.sh

set -e

# Config
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
REMOTE="root@137.184.3.18"

echo "🔧 Preparing server for deployment..."

echo "📦 Waiting for apt locks to be released..."
ssh $SSH_OPTS $REMOTE "while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do echo 'Waiting for apt lock...'; sleep 5; done"

echo "📦 Updating package lists..."
ssh $SSH_OPTS $REMOTE "apt update"

echo "⬆️  Upgrading packages..."
ssh $SSH_OPTS $REMOTE "DEBIAN_FRONTEND=noninteractive apt upgrade -y"

echo "🧹 Cleaning up packages..."
ssh $SSH_OPTS $REMOTE "apt autoremove -y && apt autoclean"

echo "🔄 Checking if reboot is required..."
if ssh $SSH_OPTS $REMOTE "[ -f /var/run/reboot-required ]"; then
    echo "⚠️  Reboot required after kernel updates"
    echo "   Run: ssh $REMOTE 'reboot' and wait 30 seconds before deploying"
else
    echo "✅ No reboot required"
fi

echo "🛑 Stopping automatic updates during deployment..."
ssh $SSH_OPTS $REMOTE "systemctl stop unattended-upgrades || true"

echo "✅ Server preparation complete!"
echo "   You can now run: ./deploy.sh"
echo "   After deployment, re-enable auto-updates with:"
echo "   ssh $REMOTE 'systemctl start unattended-upgrades'" 