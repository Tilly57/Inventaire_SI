#!/bin/bash

# Script to refresh the dashboard_stats materialized view
# This should be run every 5 minutes via cron or scheduler

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} Refreshing dashboard_stats materialized view..."

# Refresh the materialized view
docker exec inventaire_si-db-1 psql -U inventaire inventaire -c "REFRESH MATERIALIZED VIEW dashboard_stats;" 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} Dashboard stats refreshed successfully ✓"
else
  echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} Failed to refresh dashboard stats ✗"
  exit 1
fi
