#!/bin/bash
# Automatic PostgreSQL database backup script

# Configuration
DB_NAME="inventaire"
DB_USER="inventaire"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="./backups/database"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"
RETENTION_DAYS=7

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Export password (read from .env file)
export PGPASSWORD="inventaire_pwd"

# Perform backup
echo "🔄 Starting database backup..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F c -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully: $BACKUP_FILE"

    # Compress backup
    gzip "$BACKUP_FILE"
    echo "✅ Backup compressed: ${BACKUP_FILE}.gz"

    # Delete old backups (older than RETENTION_DAYS)
    find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo "🗑️  Old backups deleted (older than $RETENTION_DAYS days)"
else
    echo "❌ Backup failed"
    exit 1
fi

# List recent backups
echo ""
echo "📋 Recent backups:"
ls -lh "$BACKUP_DIR" | tail -5

unset PGPASSWORD
