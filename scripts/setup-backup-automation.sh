#!/bin/bash
# Setup automated database backups for Linux/Mac (cron)
# This script creates a cron job to run backups daily

set -e

echo "========================================"
echo " SETUP BACKUP AUTOMATION"
echo " Inventaire SI - Database Backups"
echo "========================================"
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_SCRIPT="$PROJECT_DIR/scripts/backup-automation.js"

echo "Project Directory: $PROJECT_DIR"
echo "Backup Script: $BACKUP_SCRIPT"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Node.js version:"
node --version
echo ""

# Check if backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "ERROR: Backup script not found at $BACKUP_SCRIPT"
    exit 1
fi

echo "Configuration:"
echo "  Schedule: Daily at 2:00 AM"
echo "  Retention: 30 days (configurable via BACKUP_RETENTION_DAYS)"
echo "  Script: $BACKUP_SCRIPT"
echo "  Cron user: $USER"
echo ""

read -p "Do you want to create the cron job? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled by user"
    exit 0
fi

echo ""
echo "Creating cron job..."

# Create cron job entry
CRON_JOB="0 2 * * * cd $PROJECT_DIR && /usr/bin/node $BACKUP_SCRIPT >> $PROJECT_DIR/backups/logs/cron.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "backup-automation.js"; then
    echo "Removing existing cron job..."
    crontab -l 2>/dev/null | grep -v "backup-automation.js" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo " SETUP COMPLETED SUCCESSFULLY"
    echo "========================================"
    echo ""
    echo "Cron job has been created successfully."
    echo ""
    echo "Job Details:"
    echo "  - Runs daily at 2:00 AM"
    echo "  - Keeps backups for 30 days"
    echo "  - Logs saved to: backups/logs/cron.log"
    echo ""
    echo "To view your cron jobs:"
    echo "  crontab -l"
    echo ""
    echo "To remove the cron job:"
    echo "  crontab -e"
    echo "  (then delete the line containing 'backup-automation.js')"
    echo ""
    echo "To run the backup manually now:"
    echo "  cd $PROJECT_DIR"
    echo "  node scripts/backup-automation.js"
    echo ""
    echo "To customize retention period:"
    echo "  Edit your crontab: crontab -e"
    echo "  Add: BACKUP_RETENTION_DAYS=60"
    echo "  Before the cron job line"
    echo ""
else
    echo ""
    echo "========================================"
    echo " SETUP FAILED"
    echo "========================================"
    echo ""
    echo "Failed to create cron job."
    echo ""
fi
