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

set -e

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

# ── Step 1: Pre-deploy database backup ──
log_info "Creating pre-deploy database backup..."
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/pre-deploy_$(date +%Y%m%d_%H%M%S).sql.gz"

if docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" 2>/dev/null | gzip > "$BACKUP_FILE"; then
    BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" 2>/dev/null | awk '{print $5}')
    log_ok "Database backup created: $BACKUP_FILE ($BACKUP_SIZE)"
else
    log_warn "Database backup failed (non-blocking). Continuing deployment..."
    rm -f "$BACKUP_FILE"
    BACKUP_FILE=""
fi

# Clean old pre-deploy backups (keep last 5)
ls -t "$BACKUP_DIR"/pre-deploy_*.sql.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true

# ── Step 2: Pull changes ──
log_info "Pulling changes..."
git pull origin "$BRANCH" 2>&1

# ── Step 3: Rebuild and restart services ──
log_info "Rebuilding Docker services..."
docker compose -f "$COMPOSE_FILE" up -d --build 2>&1

# ── Step 4: Health check with retries ──
log_info "Waiting for services to be healthy (max ${HEALTH_CHECK_RETRIES} checks, ${HEALTH_CHECK_INTERVAL}s interval)..."

ATTEMPT=0
ALL_HEALTHY=false

while [ "$ATTEMPT" -lt "$HEALTH_CHECK_RETRIES" ]; do
    ATTEMPT=$((ATTEMPT + 1))
    sleep "$HEALTH_CHECK_INTERVAL"

    # Check for unhealthy containers
    UNHEALTHY=$(docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null | grep -c '"unhealthy"' || true)
    STARTING=$(docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null | grep -c '"starting"' || true)

    if [ "$UNHEALTHY" -eq 0 ] && [ "$STARTING" -eq 0 ]; then
        ALL_HEALTHY=true
        break
    fi

    log_info "Health check $ATTEMPT/$HEALTH_CHECK_RETRIES: $UNHEALTHY unhealthy, $STARTING starting..."
done

if [ "$ALL_HEALTHY" = true ]; then
    log_ok "All services healthy! Deployment successful at ${REMOTE_HASH:0:8}"
    docker compose -f "$COMPOSE_FILE" ps 2>&1
    exit 0
fi

# ── Step 5: Rollback on failure ──
log_error "Services are NOT healthy after $HEALTH_CHECK_RETRIES checks!"
log_error "Current service status:"
docker compose -f "$COMPOSE_FILE" ps 2>&1

log_error "Unhealthy container logs:"
docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null | \
    grep '"unhealthy"' | \
    while IFS= read -r line; do
        SVC=$(echo "$line" | grep -o '"Service":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$SVC" ]; then
            log_error "--- $SVC logs (last 20 lines) ---"
            docker compose -f "$COMPOSE_FILE" logs --tail=20 "$SVC" 2>&1
        fi
    done

# Rollback git
log_warn "Rolling back to previous version (${LOCAL_HASH:0:8})..."
git reset --hard "$LOCAL_HASH" 2>&1

# Rebuild with previous version
log_warn "Rebuilding with previous version..."
docker compose -f "$COMPOSE_FILE" up -d --build 2>&1

# Verify rollback
sleep 15
UNHEALTHY_AFTER=$(docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null | grep -c '"unhealthy"' || true)
if [ "$UNHEALTHY_AFTER" -eq 0 ]; then
    log_ok "Rollback successful. Running on ${LOCAL_HASH:0:8}"
else
    log_error "CRITICAL: Rollback also failed! Manual intervention required."
    # Restore database if backup exists
    if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
        log_error "Pre-deploy backup available at: $BACKUP_FILE"
        log_error "To restore: gunzip -c $BACKUP_FILE | docker exec -i $DB_CONTAINER psql -U $DB_USER $DB_NAME"
    fi
fi

exit 1
