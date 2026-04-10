#!/bin/sh
###########################################
# Auto-Deploy Script — Inventaire SI
#
# Polls the git remote for changes on the
# production branch. If changes detected,
# pulls and rebuilds Docker services.
#
# Designed to run inside a Docker container
# or as a cron job on the server.
###########################################

set -e

# Configuration
REPO_DIR="${DEPLOY_REPO_DIR:-/repo}"
BRANCH="${DEPLOY_BRANCH:-production}"
COMPOSE_FILE="${DEPLOY_COMPOSE_FILE:-docker-compose.prod.yml}"
LOG_PREFIX="[auto-deploy]"
DOCKER_SOCKET="${DOCKER_HOST:-/var/run/docker.sock}"

log_info()  { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ${LOG_PREFIX} [INFO]  $1"; }
log_error() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ${LOG_PREFIX} [ERROR] $1" >&2; }
log_ok()    { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ${LOG_PREFIX} [OK]    $1"; }

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

# Pull changes
log_info "Pulling changes..."
git pull origin "$BRANCH" 2>&1

# Rebuild and restart services
log_info "Rebuilding Docker services..."
docker compose -f "$COMPOSE_FILE" up -d --build 2>&1

# Wait for health checks
log_info "Waiting for services to be healthy..."
sleep 15

# Verify services
UNHEALTHY=$(docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null | grep -c '"unhealthy"' || true)
if [ "$UNHEALTHY" -gt 0 ]; then
    log_error "Some services are unhealthy after deploy!"
    docker compose -f "$COMPOSE_FILE" ps 2>&1
    exit 1
fi

log_ok "Deployment successful! Now at ${REMOTE_HASH:0:8}"
docker compose -f "$COMPOSE_FILE" ps 2>&1