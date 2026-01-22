@echo off
REM Setup automated database backups for Windows
REM This script creates a scheduled task to run backups daily

echo ========================================
echo  SETUP BACKUP AUTOMATION
echo  Inventaire SI - Database Backups
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    echo Please right-click and select "Run as Administrator"
    pause
    exit /b 1
)

REM Get the current directory (project root)
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..
set BACKUP_SCRIPT=%PROJECT_DIR%\scripts\backup-automation.js

echo Project Directory: %PROJECT_DIR%
echo Backup Script: %BACKUP_SCRIPT%
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if backup script exists
if not exist "%BACKUP_SCRIPT%" (
    echo ERROR: Backup script not found at %BACKUP_SCRIPT%
    pause
    exit /b 1
)

echo.
echo Configuration:
echo   Task Name: InventaireSI_BackupDaily
echo   Schedule: Daily at 2:00 AM
echo   Retention: 30 days
echo   Script: %BACKUP_SCRIPT%
echo.

set /p CONFIRM="Do you want to create the scheduled task? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo Cancelled by user
    exit /b 0
)

echo.
echo Creating scheduled task...

REM Delete existing task if it exists
schtasks /query /tn "InventaireSI_BackupDaily" >nul 2>&1
if %errorLevel% equ 0 (
    echo Removing existing task...
    schtasks /delete /tn "InventaireSI_BackupDaily" /f
)

REM Create the scheduled task
REM /SC DAILY = Run daily
REM /ST 02:00 = Start at 2:00 AM
REM /RU SYSTEM = Run as SYSTEM account (has Docker access)
REM /RL HIGHEST = Run with highest privileges
schtasks /create ^
    /tn "InventaireSI_BackupDaily" ^
    /tr "node \"%BACKUP_SCRIPT%\"" ^
    /sc daily ^
    /st 02:00 ^
    /ru SYSTEM ^
    /rl HIGHEST ^
    /f

if %errorLevel% equ 0 (
    echo.
    echo ========================================
    echo  SETUP COMPLETED SUCCESSFULLY
    echo ========================================
    echo.
    echo Scheduled task "InventaireSI_BackupDaily" has been created.
    echo.
    echo Task Details:
    echo   - Runs daily at 2:00 AM
    echo   - Keeps backups for 30 days
    echo   - Logs saved to: backups\logs\
    echo.
    echo To modify the schedule:
    echo   1. Open Task Scheduler (taskschd.msc)
    echo   2. Find "InventaireSI_BackupDaily"
    echo   3. Right-click and select "Properties"
    echo.
    echo To run the backup manually now:
    echo   schtasks /run /tn "InventaireSI_BackupDaily"
    echo.
    echo Or run the script directly:
    echo   node "%BACKUP_SCRIPT%"
    echo.
) else (
    echo.
    echo ========================================
    echo  SETUP FAILED
    echo ========================================
    echo.
    echo Failed to create scheduled task.
    echo Error code: %errorLevel%
    echo.
)

pause
