@echo off
REM Script to run E2E tests locally
REM Starts backend, frontend, and runs Playwright tests

echo ========================================
echo  E2E TESTS - INVENTAIRE SI
echo ========================================
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Docker is not running
    echo Please start Docker Desktop first
    pause
    exit /b 1
)

REM Check if database is running
docker ps --filter "name=inventaire_si-db" --format "{{.Names}}" | findstr "inventaire_si-db" >nul
if %errorLevel% neq 0 (
    echo Starting database...
    docker-compose up -d db redis
    timeout /t 10
)

echo.
echo Starting API server...
cd apps\api
start /b npm run dev
cd ..\..

echo Waiting for API to be ready...
timeout /t 10

echo.
echo Starting frontend server...
cd apps\web
start /b npm run dev
cd ..\..

echo Waiting for frontend to be ready...
timeout /t 10

echo.
echo ========================================
echo  RUNNING E2E TESTS
echo ========================================
echo.

cd apps\web

REM Parse command line arguments
set TEST_FILE=%1

if "%TEST_FILE%"=="" (
    echo Running all E2E tests...
    call npm run test:e2e
) else if "%TEST_FILE%"=="smoke" (
    echo Running smoke tests only...
    call npm run test:e2e -- 00-smoke.spec.ts
) else if "%TEST_FILE%"=="critical" (
    echo Running critical tests only...
    call npm run test:e2e -- 00-smoke.spec.ts 11-critical-loan-workflow.spec.ts
) else (
    echo Running specific test: %TEST_FILE%
    call npm run test:e2e -- %TEST_FILE%
)

set TEST_EXIT_CODE=%errorLevel%

cd ..\..

echo.
echo ========================================
echo  CLEANUP
echo ========================================
echo.

REM Stop servers (kill Node processes)
taskkill /F /IM node.exe /T >nul 2>&1

echo.
if %TEST_EXIT_CODE% equ 0 (
    echo ========================================
    echo  TESTS PASSED
    echo ========================================
) else (
    echo ========================================
    echo  TESTS FAILED
    echo ========================================
)

echo.
echo Test report: apps\web\playwright-report\index.html
echo.

pause
exit /b %TEST_EXIT_CODE%
