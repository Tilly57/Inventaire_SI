@echo off
REM Restore latest database backup

REM Configuration
set DB_NAME=inventaire
set DB_USER=inventaire
set DB_HOST=localhost
set DB_PORT=5432
set PGPASSWORD=inventaire_pwd
set SCRIPT_DIR=%~dp0
set BACKUP_DIR=%SCRIPT_DIR%..\backups\database

REM Find latest backup
echo Recherche du dernier backup...
for /f "delims=" %%i in ('dir /b /o-d "%BACKUP_DIR%\inventaire_*.sql.gz" 2^>nul') do (
    set LATEST_BACKUP=%%i
    goto :found
)

:notfound
echo ERREUR: Aucun backup trouve dans %BACKUP_DIR%
pause
exit /b 1

:found
echo Backup trouve: %LATEST_BACKUP%
echo.

REM Decompress backup
echo Decompression du backup...
set BACKUP_FILE=%BACKUP_DIR%\%LATEST_BACKUP%
set SQL_FILE=%BACKUP_FILE:~0,-3%

if exist "C:\Program Files\7-Zip\7z.exe" (
    "C:\Program Files\7-Zip\7z.exe" x -y "%BACKUP_FILE%" -o"%BACKUP_DIR%"
) else (
    echo ERREUR: 7-Zip n'est pas installe
    pause
    exit /b 1
)

REM Restore database
echo.
echo ATTENTION: Cette operation va ECRASER toutes les donnees actuelles!
echo Backup a restaurer: %LATEST_BACKUP%
echo.
set /p CONFIRM="Tapez 'OUI' pour confirmer la restauration: "

if not "%CONFIRM%"=="OUI" (
    echo Restauration annulee.
    del "%SQL_FILE%"
    pause
    exit /b 0
)

echo.
echo Restauration en cours...
"C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% --clean --if-exists --no-owner --no-acl "%SQL_FILE%"

if %errorlevel% equ 0 (
    echo.
    echo ✓ Restauration completee avec succes!
    echo.

    REM Verify restoration
    echo Verification des donnees...
    "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 'Users' as table_name, COUNT(*) FROM \"User\" UNION ALL SELECT 'Employees', COUNT(*) FROM \"Employee\" UNION ALL SELECT 'Loans', COUNT(*) FROM \"Loan\" UNION ALL SELECT 'AssetModels', COUNT(*) FROM \"AssetModel\";"
) else (
    echo.
    echo ERREUR: La restauration a echoue
)

REM Cleanup
del "%SQL_FILE%"

echo.
pause
