# Automated Database Backup System - Inventaire SI

Complete guide for automated database backups with monitoring, retention policies, and multi-platform support.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
  - [Windows](#windows-setup)
  - [Linux/Mac](#linuxmac-setup)
  - [Docker](#docker-setup)
- [Configuration](#configuration)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

The automated backup system provides:
- **Scheduled backups** - Daily backups at 2:00 AM (configurable)
- **Automatic retention** - Removes backups older than 30 days
- **Monitoring** - HTTP health endpoint to check backup status
- **Multi-platform** - Windows, Linux, Mac, and Docker support
- **Notifications** - Email alerts on backup failures (optional)

## Features

### Backup Features ✅

- **Automatic scheduling** via Task Scheduler (Windows), cron (Linux), or Docker
- **Compression** - PostgreSQL custom format with level 9 compression
- **Verification** - Checks backup size to detect failures
- **Retention policy** - Configurable cleanup of old backups
- **Logging** - Detailed logs for troubleshooting
- **Manual backups** - Support for named manual backups

### Monitoring Features ✅

- **Health endpoint** - `/health` returns 200 if healthy, 503 if unhealthy
- **Metrics endpoint** - `/metrics` provides Prometheus-compatible metrics
- **Status page** - `/status` shows detailed HTML dashboard
- **Alerts** - Detects old or missing backups
- **Integration** - Works with Prometheus, Grafana, UptimeRobot, etc.

## Quick Start

### Run Manual Backup

```bash
# Using Node.js script (recommended)
node scripts/backup-automation.js

# With custom name
node scripts/backup-automation.js --name="before_upgrade"

# Dry run (no changes)
node scripts/backup-automation.js --dry-run

# Cleanup only (no backup)
node scripts/backup-automation.js --cleanup-only
```

### View Backup Status

```bash
# Start monitor service
node scripts/backup-monitor.js

# Open in browser
http://localhost:8080/status
```

## Installation

### Windows Setup

**Prerequisites:**
- Node.js 18+ installed
- Docker Desktop running
- Administrator privileges

**Steps:**

1. **Open PowerShell as Administrator**

2. **Run setup script:**
   ```batch
   cd C:\path\to\inventaire_SI
   scripts\setup-backup-automation.bat
   ```

3. **Verify installation:**
   ```batch
   # Check scheduled task
   schtasks /query /tn "InventaireSI_BackupDaily"

   # Run task manually to test
   schtasks /run /tn "InventaireSI_BackupDaily"
   ```

4. **Check logs:**
   ```batch
   type backups\logs\backup_2026-01-22.log
   ```

**What it does:**
- Creates Windows Scheduled Task "InventaireSI_BackupDaily"
- Runs daily at 2:00 AM
- Executes as SYSTEM account (has Docker access)
- Logs to `backups\logs\`

**Customize schedule:**
1. Open Task Scheduler (`Win + R` → `taskschd.msc`)
2. Find "InventaireSI_BackupDaily"
3. Right-click → Properties → Triggers
4. Modify schedule as needed

### Linux/Mac Setup

**Prerequisites:**
- Node.js 18+ installed
- Docker running
- Cron daemon running

**Steps:**

1. **Make script executable:**
   ```bash
   chmod +x scripts/setup-backup-automation.sh
   ```

2. **Run setup:**
   ```bash
   cd /path/to/inventaire_SI
   ./scripts/setup-backup-automation.sh
   ```

3. **Verify installation:**
   ```bash
   # Check cron job
   crontab -l | grep backup-automation

   # Run backup manually to test
   node scripts/backup-automation.js
   ```

4. **Check logs:**
   ```bash
   tail -f backups/logs/cron.log
   ```

**What it does:**
- Adds cron job to current user's crontab
- Runs daily at 2:00 AM
- Logs to `backups/logs/cron.log`

**Customize schedule:**
```bash
# Edit crontab
crontab -e

# Change schedule (example: run at 3:30 AM)
# 0 2 * * *  → 30 3 * * *
```

### Docker Setup

**Prerequisites:**
- Docker and Docker Compose installed
- Access to `/var/run/docker.sock`

**Steps:**

1. **Start backup services:**
   ```bash
   # Start with backup automation
   docker-compose -f docker-compose.yml -f docker-compose.backup.yml up -d

   # Or update existing deployment
   docker-compose -f docker-compose.yml -f docker-compose.backup.yml up -d --no-deps backup backup-monitor
   ```

2. **Verify services:**
   ```bash
   # Check backup container
   docker ps | grep backup

   # Check logs
   docker logs inventaire_si-backup

   # Check monitor
   docker logs inventaire_si-backup-monitor
   ```

3. **Access monitoring:**
   ```
   http://localhost:8081/status
   ```

**What it does:**
- Runs `backup` container with cron daemon
- Runs `backup-monitor` container for health checks
- Shares backup volume with host
- Executes backups daily at 2:00 AM

**Customize:**

Edit `docker-compose.backup.yml` and set environment variables:

```yaml
environment:
  - BACKUP_RETENTION_DAYS=60  # Keep for 60 days
  - TZ=America/New_York        # Set timezone
  - BACKUP_NOTIFICATION_EMAIL=admin@example.com
```

Then restart:
```bash
docker-compose -f docker-compose.yml -f docker-compose.backup.yml up -d backup
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKUP_RETENTION_DAYS` | `30` | Days to keep backups before deletion |
| `BACKUP_NOTIFICATION_EMAIL` | ` ` | Email for failure notifications |
| `DB_CONTAINER` | `inventaire_si-db-1` | PostgreSQL container name |
| `DB_NAME` | `inventaire` | Database name |
| `DB_USER` | `inventaire` | Database user |
| `BACKUP_MAX_AGE_HOURS` | `26` | Max hours before backup considered stale |
| `BACKUP_MIN_SIZE_MB` | `0.1` | Minimum acceptable backup size in MB |
| `HEALTHCHECK_PORT` | `8080` | HTTP port for monitor service |

### Setting Environment Variables

**Windows (Task Scheduler):**
1. Open Task Scheduler
2. Find "InventaireSI_BackupDaily"
3. Actions tab → Edit action
4. Update command: `node "C:\...\backup-automation.js"`
5. Add environment variables in batch wrapper

**Linux/Mac (crontab):**
```bash
# Edit crontab
crontab -e

# Add environment variables before cron job
BACKUP_RETENTION_DAYS=60
0 2 * * * cd /path/to/project && node scripts/backup-automation.js
```

**Docker:**
Edit `docker-compose.backup.yml`:
```yaml
environment:
  - BACKUP_RETENTION_DAYS=60
```

## Monitoring

### Health Endpoint

Check if backups are healthy:

```bash
curl http://localhost:8080/health
```

**Response (Healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-22T10:30:00.000Z",
  "healthy": true,
  "error": null,
  "totalBackups": 15,
  "latestBackup": {
    "name": "inventaire_auto_20260122_020000.dump",
    "sizeMB": "2.45",
    "ageHours": "8.5",
    "timestamp": "2026-01-22T02:00:00.000Z"
  }
}
```

**Response (Unhealthy):**
```json
{
  "status": "unhealthy",
  "healthy": false,
  "error": "Latest backup is 30.2 hours old (max: 26)",
  "totalBackups": 10,
  "latestBackup": { ... }
}
```

Status code: `200` = healthy, `503` = unhealthy

### Metrics Endpoint

Prometheus-compatible metrics:

```bash
curl http://localhost:8080/metrics
```

**Response:**
```
# HELP backup_total Total number of backups
# TYPE backup_total gauge
backup_total 15

# HELP backup_healthy Backup health status (1=healthy, 0=unhealthy)
# TYPE backup_healthy gauge
backup_healthy 1

# HELP backup_latest_age_hours Age of latest backup in hours
# TYPE backup_latest_age_hours gauge
backup_latest_age_hours 8.5

# HELP backup_latest_size_mb Size of latest backup in MB
# TYPE backup_latest_size_mb gauge
backup_latest_size_mb 2.45
```

### Status Page

Web dashboard for humans:

```
http://localhost:8080/status
```

Shows:
- Health status (green/red)
- Latest backup details
- Recent backup history
- Configuration settings

### Integration with Prometheus

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'backup-monitor'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/metrics'
    scrape_interval: 1h
```

### Integration with UptimeRobot

1. Create new HTTP(S) monitor
2. URL: `http://your-server:8080/health`
3. Monitoring Interval: Every 60 minutes
4. Expected Status Code: 200
5. Alert if status code ≠ 200

### Integration with Grafana

Create alert rule:

```promql
backup_healthy == 0
```

Alert when backups are unhealthy.

## Troubleshooting

### "Docker is not running"

**Windows:**
1. Start Docker Desktop
2. Wait for Docker to fully start (whale icon in system tray)
3. Retry backup

**Linux:**
```bash
sudo systemctl start docker
```

### "Container is not running"

Start the database container:

```bash
docker-compose up -d db
```

Verify:
```bash
docker ps | grep inventaire_si-db
```

### "Backup file is too small"

**Possible causes:**
- Database is actually small (new installation)
- pg_dump failed silently
- Permissions issue

**Solutions:**
1. Check database size:
   ```bash
   docker exec inventaire_si-db-1 psql -U inventaire -c "\l+"
   ```

2. Test pg_dump manually:
   ```bash
   docker exec inventaire_si-db-1 pg_dump -U inventaire -Fc inventaire > test.dump
   ```

3. Check logs:
   ```bash
   cat backups/logs/backup_$(date +%Y-%m-%d).log
   ```

### "Permission denied" (Linux)

**Cron job:**
```bash
# Make script executable
chmod +x scripts/backup-automation.js

# Check cron permissions
sudo tail -f /var/log/syslog | grep CRON
```

**Docker socket:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Re-login for changes to take effect
```

### "No backups created"

**Check logs:**
```bash
# Windows
type backups\logs\backup_2026-01-22.log

# Linux/Mac
cat backups/logs/backup_$(date +%Y-%m-%d).log
```

**Verify task/cron is running:**

Windows:
```batch
schtasks /query /tn "InventaireSI_BackupDaily" /v
```

Linux/Mac:
```bash
crontab -l
```

**Run manually for debugging:**
```bash
node scripts/backup-automation.js
```

### Backup monitor shows unhealthy

**Check latest backup age:**
```bash
ls -lht backups/database/*.dump | head -5
```

**If no recent backups:**
- Check scheduled task/cron is enabled
- Check Docker is running
- Check logs for errors

**If backups exist but monitor unhealthy:**
- Verify `BACKUP_MAX_AGE_HOURS` setting (default: 26 hours)
- Increase if backups run less frequently than daily

## Best Practices

### 1. Test Backups Regularly

**Monthly test procedure:**
```bash
# 1. Create test backup
node scripts/backup-automation.js --name="test_restore"

# 2. Verify backup size
ls -lh backups/database/test_restore_*.dump

# 3. Test restore (DO NOT run on production!)
# Only test on development environment
```

⚠️ **NEVER test restore on production without a safety backup first!**

### 2. Monitor Backup Health

**Set up monitoring:**
- Use Prometheus + Grafana for metrics
- Use UptimeRobot for uptime monitoring
- Configure email alerts for failures

**Check weekly:**
```bash
# View health status
curl http://localhost:8080/health

# Check recent backups
ls -lht backups/database/*.dump | head -10
```

### 3. Store Backups Off-Site

**Copy backups to external storage:**

```bash
# To cloud storage (example: AWS S3)
aws s3 sync backups/database/ s3://my-bucket/inventaire-backups/

# To network drive
rsync -av backups/database/ /mnt/network-backup/inventaire/

# To external disk
cp backups/database/*.dump /media/external-disk/backups/
```

**Automate off-site backup:**

Add to cron (Linux) or Task Scheduler (Windows):
```bash
# Daily at 4 AM - copy to cloud
0 4 * * * aws s3 sync /path/to/backups/database/ s3://my-bucket/backups/
```

### 4. Retention Strategy

**Recommended retention policy:**
- **Daily backups:** Keep 30 days
- **Weekly backups:** Keep 12 weeks (create manually on Sundays)
- **Monthly backups:** Keep 12 months (create manually on 1st of month)
- **Pre-upgrade backups:** Keep indefinitely (use `--name` flag)

**Example manual backups:**
```bash
# Weekly backup (every Sunday)
node scripts/backup-automation.js --name="weekly_backup"

# Monthly backup (first of month)
node scripts/backup-automation.js --name="monthly_$(date +%Y%m)"

# Before upgrade
node scripts/backup-automation.js --name="pre_upgrade_v0.9.0"
```

### 5. Security

**Protect backup files:**
```bash
# Restrict permissions (Linux)
chmod 600 backups/database/*.dump
chown backup-user:backup-group backups/database/

# Encrypt backups (Linux)
gpg --encrypt --recipient admin@example.com backup.dump
```

**Secure monitor endpoint:**

In production, restrict access:
```yaml
# docker-compose.backup.yml
services:
  backup-monitor:
    ports:
      - "127.0.0.1:8080:8080"  # Only localhost access
```

Or use reverse proxy with authentication (nginx, Traefik).

### 6. Notifications

**Configure email notifications:**

Set environment variable:
```bash
export BACKUP_NOTIFICATION_EMAIL="admin@example.com"
```

**Integrate with Slack/Teams:**

Modify `backup-automation.js` to add webhook:
```javascript
// In sendNotification function
const webhookUrl = process.env.SLACK_WEBHOOK_URL;
if (webhookUrl) {
  await fetch(webhookUrl, {
    method: 'POST',
    body: JSON.stringify({ text: message })
  });
}
```

### 7. Logging

**Log retention:**
- Keep logs for 90 days
- Rotate logs monthly
- Review errors weekly

**Check logs regularly:**
```bash
# Windows
Get-Content backups\logs\backup_*.log | Select-String "ERROR"

# Linux
grep "ERROR" backups/logs/*.log
```

### 8. Disaster Recovery Plan

**Document recovery procedure:**

1. **Identify last good backup**
   ```bash
   ls -lht backups/database/*.dump
   ```

2. **Stop application**
   ```bash
   docker-compose down
   ```

3. **Restore database** (see `scripts/backups/README.md`)
   ```bash
   # PowerShell
   .\scripts\backups\restore.ps1
   ```

4. **Verify data**
   ```bash
   # Check record counts
   docker exec inventaire_si-db-1 psql -U inventaire -c "SELECT COUNT(*) FROM \"AssetItem\""
   ```

5. **Start application**
   ```bash
   docker-compose up -d
   ```

## Summary

The automated backup system provides:

✅ **Automated daily backups** at 2:00 AM
✅ **Retention management** (30 days default)
✅ **Health monitoring** with HTTP endpoints
✅ **Multi-platform support** (Windows/Linux/Docker)
✅ **Logging and alerts**
✅ **Manual backup support**

**Next steps:**
1. Set up automation for your platform
2. Configure monitoring
3. Test backup/restore procedure
4. Set up off-site backups
5. Document disaster recovery plan

---

For questions or issues, check:
- **Existing backup scripts:** `scripts/backups/README.md`
- **Quick reference:** `backups/README.md`
- **Logs:** `backups/logs/`
