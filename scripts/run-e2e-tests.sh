#!/bin/bash
# Script to run E2E tests locally
# Starts backend, frontend, and runs Playwright tests

set -e

echo "========================================"
echo " E2E TESTS - INVENTAIRE SI"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "ERROR: Docker is not running"
    echo "Please start Docker first"
    exit 1
fi

# Check if database is running
if ! docker ps --filter "name=inventaire_si-db" --format "{{.Names}}" | grep -q "inventaire_si-db"; then
    echo "Starting database..."
    docker-compose up -d db redis
    sleep 10
fi

echo ""
echo "Starting API server..."
cd apps/api
npm run dev &
API_PID=$!
cd ../..

echo "Waiting for API to be ready..."
timeout 60 bash -c 'until curl -f http://localhost:3001/api/health/readiness 2>/dev/null; do sleep 2; done' || {
    echo "ERROR: API failed to start"
    kill $API_PID 2>/dev/null || true
    exit 1
}

echo ""
echo "Starting frontend server..."
cd apps/web
npm run dev &
WEB_PID=$!
cd ../..

echo "Waiting for frontend to be ready..."
timeout 60 bash -c 'until curl -f http://localhost:5175 2>/dev/null; do sleep 2; done' || {
    echo "ERROR: Frontend failed to start"
    kill $API_PID $WEB_PID 2>/dev/null || true
    exit 1
}

echo ""
echo "========================================"
echo " RUNNING E2E TESTS"
echo "========================================"
echo ""

cd apps/web

# Parse command line arguments
TEST_FILE="${1:-}"
TEST_EXIT_CODE=0

if [ -z "$TEST_FILE" ]; then
    echo "Running all E2E tests..."
    npm run test:e2e || TEST_EXIT_CODE=$?
elif [ "$TEST_FILE" = "smoke" ]; then
    echo "Running smoke tests only..."
    npm run test:e2e -- 00-smoke.spec.ts || TEST_EXIT_CODE=$?
elif [ "$TEST_FILE" = "critical" ]; then
    echo "Running critical tests only..."
    npm run test:e2e -- 00-smoke.spec.ts 11-critical-loan-workflow.spec.ts || TEST_EXIT_CODE=$?
else
    echo "Running specific test: $TEST_FILE"
    npm run test:e2e -- "$TEST_FILE" || TEST_EXIT_CODE=$?
fi

cd ../..

echo ""
echo "========================================"
echo " CLEANUP"
echo "========================================"
echo ""

# Stop servers
kill $API_PID $WEB_PID 2>/dev/null || true

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "========================================"
    echo " TESTS PASSED ✅"
    echo "========================================"
else
    echo "========================================"
    echo " TESTS FAILED ❌"
    echo "========================================"
fi

echo ""
echo "Test report: apps/web/playwright-report/index.html"
echo ""

exit $TEST_EXIT_CODE
