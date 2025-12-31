@echo off
REM Setup automatic database backup using Windows Task Scheduler

set SCRIPT_PATH=%~dp0backup-database.bat
set TASK_NAME=PostgreSQL_Inventaire_Backup

echo Setting up automatic backup task...
echo Script location: %SCRIPT_PATH%

REM Delete existing task if it exists
schtasks /query /tn "%TASK_NAME%" >nul 2>&1
if %errorlevel% equ 0 (
    echo Deleting existing task...
    schtasks /delete /tn "%TASK_NAME%" /f
)

REM Create new task - runs daily at 12:00
echo Creating backup task (runs daily at 12:00)...
schtasks /create /tn "%TASK_NAME%" /tr "%SCRIPT_PATH%" /sc daily /st 12:00 /ru SYSTEM

if %errorlevel% equ 0 (
    echo.
    echo ✅ Automatic backup configured successfully!
    echo    - Task name: %TASK_NAME%
    echo    - Frequency: Daily at 12:00
    echo    - Backup location: backups\database\
    echo    - Retention: 7 days
    echo.
    echo To view the task: schtasks /query /tn "%TASK_NAME%" /v
    echo To run manually: schtasks /run /tn "%TASK_NAME%"
) else (
    echo.
    echo ❌ Failed to create scheduled task
    echo    You may need to run this script as Administrator
)

pause
