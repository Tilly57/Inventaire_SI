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
# Encryption is mandatory in production: plain dumps expose every row to any
# reader of the filesystem or of the off-site replica.
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"

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

if [ -z "$ENCRYPTION_KEY" ]; then
    echo "Error: BACKUP_ENCRYPTION_KEY environment variable not set"
    echo "  Backups must be encrypted. Generate a key: openssl rand -base64 32"
    echo "  Store it in a secrets manager and export it before running this script."
    exit 1
fi

# Perform backup (stream → gzip → openssl AES-256-CBC with PBKDF2)
ENCRYPTED_FILE="${BACKUP_FILE}.gz.enc"
echo "[backup] Starting database backup (encrypted)..."
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F c \
    | gzip \
    | BACKUP_ENCRYPTION_KEY="$ENCRYPTION_KEY" \
      openssl enc -aes-256-cbc -pbkdf2 -salt -pass env:BACKUP_ENCRYPTION_KEY \
    > "$ENCRYPTED_FILE" && [ -s "$ENCRYPTED_FILE" ]; then
    BACKUP_SIZE=$(ls -lh "$ENCRYPTED_FILE" | awk '{print $5}')
    echo "[backup] Encrypted backup created: $ENCRYPTED_FILE ($BACKUP_SIZE)"

    # Replicate to remote if configured
    if [ -n "$BACKUP_REMOTE_DIR" ]; then
        echo "[backup] Replicating to remote: $BACKUP_REMOTE_DIR"
        if rsync -az "$ENCRYPTED_FILE" "$BACKUP_REMOTE_DIR/" 2>/dev/null; then
            echo "[backup] Remote replication successful"
        elif scp -q "$ENCRYPTED_FILE" "$BACKUP_REMOTE_DIR/" 2>/dev/null; then
            echo "[backup] Remote replication successful (scp fallback)"
        else
            echo "[backup] WARNING: Remote replication failed — local backup preserved"
        fi
    fi

    # Delete old backups (older than RETENTION_DAYS)
    find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz.enc" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    # Clean up any legacy unencrypted artifacts from previous runs
    find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" ! -name "*.gz.enc" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    echo "[backup] Old backups cleaned (retention: $RETENTION_DAYS days)"
else
    echo "[backup] FAILED — backup empty or pg_dump/openssl error"
    rm -f "$ENCRYPTED_FILE"
    exit 1
fi

# List recent backups
echo ""
echo "[backup] Recent backups:"
ls -lh "$BACKUP_DIR"/${DB_NAME}_*.sql.gz.enc 2>/dev/null | tail -5

unset PGPASSWORD
unset ENCRYPTION_KEY
