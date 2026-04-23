#!/bin/sh
###########################################
# Auto-Deploy Script — Inventaire SI
#
# Polls the git remote for changes on the
# production branch. If changes detected:
#  1. Backs up database
#  2. Pulls changes
#  3. Rebuilds Docker services
#  4. Verifies health checks
#  5. Rolls back on failure
#
# Designed to run inside a Docker container.
###########################################

set -eo pipefail

# Configuration
REPO_DIR="${DEPLOY_REPO_DIR:-/repo}"
BRANCH="${DEPLOY_BRANCH:-production}"
COMPOSE_FILE="${DEPLOY_COMPOSE_FILE:-docker-compose.prod.yml}"
LOG_PREFIX="[auto-deploy]"
HEALTH_CHECK_RETRIES="${HEALTH_CHECK_RETRIES:-6}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-10}"
DB_CONTAINER="${DB_CONTAINER:-inventaire_postgres}"
DB_USER="${DB_USER:-inventaire_user}"
DB_NAME="${DB_NAME:-inventaire}"
BACKUP_DIR="${BACKUP_DIR:-/repo/backups/pre-deploy}"
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-inventaire_si}"
# Opt-in GPG signature verification for the incoming commit.
# Set DEPLOY_REQUIRE_GPG=1 in the deploy environment once commits are signed.
REQUIRE_GPG="${DEPLOY_REQUIRE_GPG:-0}"
# Mandatory encryption key for the pre-deploy DB backup (openssl AES-256-CBC).
# Generate: openssl rand -base64 32. Without it the deploy still runs but the
# backup step is skipped with a loud warning — no plaintext dump is written.
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
# HOST_REPO_DIR is the path on the Docker HOST filesystem
# Docker compose needs this so bind-mount volume paths resolve correctly
# (relative paths in compose files are resolved relative to project-directory)
HOST_REPO_DIR="${HOST_REPO_DIR:-$REPO_DIR}"
COMPOSE_CMD="docker compose -p $PROJECT_NAME --project-directory $HOST_REPO_DIR -f $HOST_REPO_DIR/$COMPOSE_FILE"

log_info()  { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ${LOG_PREFIX} [INFO]  $1"; }
log_error() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ${LOG_PREFIX} [ERROR] $1" >&2; }
log_ok()    { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ${LOG_PREFIX} [OK]    $1"; }
log_warn()  { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ${LOG_PREFIX} [WARN]  $1"; }

cd "$REPO_DIR" || { log_error "Cannot access repo at $REPO_DIR"; exit 1; }

# Ensure we're on the right branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    log_info "Switching to branch $BRANCH..."
    git checkout "$BRANCH" 2>&1
fi

# Fetch latest changes
log_info "Checking for updates on $BRANCH..."
git fetch origin "$BRANCH" 2>&1

# Compare local and remote
LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
    log_info "No changes detected (${LOCAL_HASH:0:8}). Skipping."
    exit 0
fi

log_info "Changes detected!"
log_info "  Local:  ${LOCAL_HASH:0:8}"
log_info "  Remote: ${REMOTE_HASH:0:8}"

# Show what changed
log_info "Changes:"
git log --oneline "${LOCAL_HASH}..${REMOTE_HASH}" 2>&1

# ── Step 1: Pre-deploy database backup (encrypted) ──
mkdir -p "$BACKUP_DIR"
BACKUP_FILE=""

if [ -z "$ENCRYPTION_KEY" ]; then
    log_warn "BACKUP_ENCRYPTION_KEY not set — skipping pre-deploy backup (no plaintext dump will be written)"
    log_warn "Rollback will NOT be able to restore the database. Export BACKUP_ENCRYPTION_KEY to enable safe rollback."
else
    log_info "Creating pre-deploy database backup (encrypted)..."
    CANDIDATE="$BACKUP_DIR/pre-deploy_$(date +%Y%m%d_%H%M%S).sql.gz.enc"
    if docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" 2>/dev/null \
        | gzip \
        | BACKUP_ENCRYPTION_KEY="$ENCRYPTION_KEY" openssl enc -aes-256-cbc -pbkdf2 -salt -pass env:BACKUP_ENCRYPTION_KEY \
        > "$CANDIDATE" && [ -s "$CANDIDATE" ]; then
        BACKUP_FILE="$CANDIDATE"
        BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" 2>/dev/null | awk '{print $5}')
        log_ok "Encrypted database backup created: $BACKUP_FILE ($BACKUP_SIZE)"
    else
        log_warn "DATABASE BACKUP FAILED — proceeding with caution"
        rm -f "$CANDIDATE"
    fi
fi

# Clean old pre-deploy backups (keep last 5 of each format, including any legacy plaintext gzip)
ls -t "$BACKUP_DIR"/pre-deploy_*.sql.gz.enc 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
ls -t "$BACKUP_DIR"/pre-deploy_*.sql.gz 2>/dev/null | grep -v '\.enc$' | tail -n +6 | xargs rm -f 2>/dev/null || true

# ── Step 2: Pull changes ──
log_info "Pulling changes..."
git pull origin "$BRANCH" 2>&1

# Optional: verify the pulled commit carries a trusted GPG signature before we
# rebuild anything. Requires the deploy container to have gpg + a trusted key.
if [ "$REQUIRE_GPG" = "1" ]; then
    log_info "Verifying GPG signature of $REMOTE_HASH..."
    if ! git verify-commit "$REMOTE_HASH" 2>&1; then
        log_error "GPG verification failed for $REMOTE_HASH — aborting deploy"
        log_warn "Rolling back to $LOCAL_HASH to leave the repo in a known state"
        git reset --hard "$LOCAL_HASH" 2>&1
        exit 1
    fi
    log_ok "GPG signature verified"
fi

# ── Step 3: Rebuild and restart services ──
log_info "Rebuilding Docker services..."
$COMPOSE_CMD up -d --build --force-recreate 2>&1

# ── Step 4: Health check with retries ──
log_info "Waiting for services to be healthy (max ${HEALTH_CHECK_RETRIES} checks, ${HEALTH_CHECK_INTERVAL}s interval)..."

ATTEMPT=0
ALL_HEALTHY=false

while [ "$ATTEMPT" -lt "$HEALTH_CHECK_RETRIES" ]; do
    ATTEMPT=$((ATTEMPT + 1))
    sleep "$HEALTH_CHECK_INTERVAL"

    # Check for unhealthy containers
    UNHEALTHY=$($COMPOSE_CMD ps --format json 2>/dev/null | grep -c '"unhealthy"' || true)
    STARTING=$($COMPOSE_CMD ps --format json 2>/dev/null | grep -c '"starting"' || true)

    if [ "$UNHEALTHY" -eq 0 ] && [ "$STARTING" -eq 0 ]; then
        ALL_HEALTHY=true
        break
    fi

    log_info "Health check $ATTEMPT/$HEALTH_CHECK_RETRIES: $UNHEALTHY unhealthy, $STARTING starting..."
done

if [ "$ALL_HEALTHY" = true ]; then
    log_ok "All services healthy! Deployment successful at ${REMOTE_HASH:0:8}"
    $COMPOSE_CMD ps 2>&1
    exit 0
fi

# ── Step 5: Rollback on failure ──
log_error "Services are NOT healthy after $HEALTH_CHECK_RETRIES checks!"
log_error "Current service status:"
$COMPOSE_CMD ps 2>&1

log_error "Unhealthy container logs:"
$COMPOSE_CMD ps --format json 2>/dev/null | \
    grep '"unhealthy"' | \
    while IFS= read -r line; do
        SVC=$(echo "$line" | grep -o '"Service":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$SVC" ]; then
            log_error "--- $SVC logs (last 20 lines) ---"
            $COMPOSE_CMD logs --tail=20 "$SVC" 2>&1
        fi
    done

# Rollback git
log_warn "Rolling back to previous version (${LOCAL_HASH:0:8})..."
git reset --hard "$LOCAL_HASH" 2>&1

# Rebuild with previous version
log_warn "Rebuilding with previous version..."
$COMPOSE_CMD up -d --build --force-recreate 2>&1

# Verify rollback
sleep 15
UNHEALTHY_AFTER=$($COMPOSE_CMD ps --format json 2>/dev/null | grep -c '"unhealthy"' || true)
if [ "$UNHEALTHY_AFTER" -eq 0 ]; then
    log_ok "Rollback successful. Running on ${LOCAL_HASH:0:8}"
    exit 1
fi

# Git rollback didn't recover the services. Attempt automatic DB restore from
# the encrypted pre-deploy backup — the new release may have applied schema
# changes that are now incompatible with the previous code.
log_error "CRITICAL: Git rollback did not restore health — attempting DB restore"

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
    log_error "No pre-deploy backup available. Manual intervention required."
    exit 1
fi

if [ -z "$ENCRYPTION_KEY" ]; then
    log_error "Backup exists but BACKUP_ENCRYPTION_KEY is no longer set — cannot decrypt."
    log_error "Pre-deploy backup: $BACKUP_FILE"
    log_error "To restore manually: BACKUP_ENCRYPTION_KEY=... openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_ENCRYPTION_KEY -in $BACKUP_FILE | gunzip | docker exec -i $DB_CONTAINER psql -U $DB_USER $DB_NAME"
    exit 1
fi

log_warn "Restoring database from $BACKUP_FILE..."
if BACKUP_ENCRYPTION_KEY="$ENCRYPTION_KEY" \
    openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_ENCRYPTION_KEY -in "$BACKUP_FILE" \
    | gunzip \
    | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" "$DB_NAME" 2>&1; then
    log_ok "Database restored from pre-deploy backup"
else
    log_error "DB RESTORE FAILED — manual intervention required"
    log_error "Pre-deploy backup: $BACKUP_FILE"
    exit 1
fi

# Restart services one more time now that the DB is back on the previous schema
log_warn "Restarting services after DB restore..."
$COMPOSE_CMD up -d --build --force-recreate 2>&1
sleep 15
UNHEALTHY_FINAL=$($COMPOSE_CMD ps --format json 2>/dev/null | grep -c '"unhealthy"' || true)
if [ "$UNHEALTHY_FINAL" -eq 0 ]; then
    log_ok "Full rollback (code + DB) successful. Running on ${LOCAL_HASH:0:8}"
else
    log_error "Services still unhealthy after DB restore — manual intervention required"
fi

exit 1
