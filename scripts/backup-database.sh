#!/bin/bash
# Automatic PostgreSQL database backup script
# Supports local storage + optional remote replication (rsync/scp)

set -eo pipefail

# Configuration
DB_NAME="${BACKUP_DB_NAME:-inventaire}"
DB_USER="${BACKUP_DB_USER:-inventaire}"
DB_HOST="${BACKUP_DB_HOST:-localhost}"
DB_PORT="${BACKUP_DB_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-./backups/database}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Remote backup replication (optional)
# Set BACKUP_REMOTE_DIR to enable, e.g.: user@nas:/backups/inventaire
BACKUP_REMOTE_DIR="${BACKUP_REMOTE_DIR:-}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Export password from environment variable
if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "Error: POSTGRES_PASSWORD environment variable not set"
    echo "  Usage: POSTGRES_PASSWORD=your_password ./scripts/backup-database.sh"
    exit 1
fi
export PGPASSWORD="$POSTGRES_PASSWORD"

# Perform backup
echo "[backup] Starting database backup..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F c -f "$BACKUP_FILE"

if [ $? -eq 0 ] && [ -s "$BACKUP_FILE" ]; then
    echo "[backup] Backup completed: $BACKUP_FILE"

    # Compress backup
    gzip "$BACKUP_FILE"
    COMPRESSED="${BACKUP_FILE}.gz"
    BACKUP_SIZE=$(ls -lh "$COMPRESSED" | awk '{print $5}')
    echo "[backup] Compressed: ${COMPRESSED} ($BACKUP_SIZE)"

    # Replicate to remote if configured
    if [ -n "$BACKUP_REMOTE_DIR" ]; then
        echo "[backup] Replicating to remote: $BACKUP_REMOTE_DIR"
        if rsync -az "$COMPRESSED" "$BACKUP_REMOTE_DIR/" 2>/dev/null; then
            echo "[backup] Remote replication successful"
        elif scp -q "$COMPRESSED" "$BACKUP_REMOTE_DIR/" 2>/dev/null; then
            echo "[backup] Remote replication successful (scp fallback)"
        else
            echo "[backup] WARNING: Remote replication failed — local backup preserved"
        fi
    fi

    # Delete old backups (older than RETENTION_DAYS)
    find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    echo "[backup] Old backups cleaned (retention: $RETENTION_DAYS days)"
else
    echo "[backup] FAILED — backup file empty or pg_dump error"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# List recent backups
echo ""
echo "[backup] Recent backups:"
ls -lh "$BACKUP_DIR"/${DB_NAME}_*.sql.gz 2>/dev/null | tail -5

unset PGPASSWORD
