@echo off
REM Automatic PostgreSQL database backup script for Windows

REM Configuration
set DB_NAME=inventaire
set DB_USER=inventaire
set DB_HOST=localhost
set DB_PORT=5432
set SCRIPT_DIR=%~dp0
set BACKUP_DIR=%SCRIPT_DIR%..\backups\database
set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=%BACKUP_DIR%\%DB_NAME%_%TIMESTAMP%.sql

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Set password
set PGPASSWORD=inventaire_pwd

REM Perform backup
echo Starting database backup...
"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -F c -f "%BACKUP_FILE%"

if %errorlevel% equ 0 (
    echo Backup completed successfully: %BACKUP_FILE%

    REM Compress backup using 7-Zip if available
    if exist "C:\Program Files\7-Zip\7z.exe" (
        "C:\Program Files\7-Zip\7z.exe" a -tgzip "%BACKUP_FILE%.gz" "%BACKUP_FILE%"
        del "%BACKUP_FILE%"
        echo Backup compressed: %BACKUP_FILE%.gz
    )

    REM Delete old backups (older than 7 days)
    forfiles /p "%BACKUP_DIR%" /m %DB_NAME%_*.sql* /d -7 /c "cmd /c del @path" 2>nul
    echo Old backups deleted (older than 7 days)
) else (
    echo Backup failed
    exit /b 1
)

REM List recent backups
echo.
echo Recent backups:
dir /o-d /b "%BACKUP_DIR%\%DB_NAME%_*" 2>nul | findstr /n "^" | findstr "^[1-5]:"

set PGPASSWORD=
