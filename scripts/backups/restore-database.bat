@echo off
REM Script de restauration de la base de données PostgreSQL
REM Usage: restore-database.bat [fichier_backup]

setlocal enabledelayedexpansion

REM Configuration
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=inventaire
set DB_USER=inventaire
set DB_PASSWORD=inventaire_pwd
set BACKUP_DIR=backups\database
set PGRESTORE="C:\Program Files\PostgreSQL\18\bin\pg_restore.exe"

echo ========================================
echo   RESTAURATION BASE DE DONNEES
echo ========================================
echo.

REM Si un fichier est spécifié en paramètre
if not "%~1"=="" (
    set BACKUP_FILE=%~1
    goto :restore
)

REM Sinon, lister les backups disponibles et demander à l'utilisateur
echo Backups disponibles:
echo.
set COUNT=0
for /f "delims=" %%F in ('dir /B /O-D "%BACKUP_DIR%\*.dump" 2^>nul') do (
    set /a COUNT+=1
    echo !COUNT!. %%F
    set BACKUP_!COUNT!=%%F
)

if %COUNT% EQU 0 (
    echo Aucun fichier de backup trouve dans %BACKUP_DIR%
    exit /b 1
)

echo.
set /p CHOICE="Choisissez le numero du backup a restaurer (1-%COUNT%) ou Q pour quitter: "

if /i "%CHOICE%"=="Q" (
    echo Restauration annulee.
    exit /b 0
)

REM Vérifier que le choix est un nombre valide
set BACKUP_FILE=!BACKUP_%CHOICE%!
if "!BACKUP_FILE!"=="" (
    echo Choix invalide.
    exit /b 1
)

set BACKUP_FILE=%BACKUP_DIR%\!BACKUP_FILE!

:restore
echo.
echo Fichier de backup: %BACKUP_FILE%
echo.

REM Vérifier que le fichier existe
if not exist "%BACKUP_FILE%" (
    echo ERREUR: Le fichier %BACKUP_FILE% n'existe pas.
    exit /b 1
)

REM Avertissement
echo ATTENTION: Cette operation va ECRASER toutes les donnees actuelles!
echo.
set /p CONFIRM="Etes-vous sur de vouloir continuer? (oui/non): "

if /i not "%CONFIRM%"=="oui" (
    echo Restauration annulee.
    exit /b 0
)

REM Créer un backup de sécurité avant la restauration
echo.
echo Creation d'un backup de securite avant restauration...
set SAFETY_BACKUP=backups\database\pre_restore_%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%.dump
set SAFETY_BACKUP=%SAFETY_BACKUP: =0%

docker exec inventaire_si-db-1 pg_dump -U %DB_USER% -Fc -Z9 %DB_NAME% > "%SAFETY_BACKUP%" 2>nul
if errorlevel 1 (
    echo AVERTISSEMENT: Impossible de creer un backup de securite.
    set /p CONTINUE="Continuer quand meme? (oui/non): "
    if /i not "!CONTINUE!"=="oui" (
        echo Restauration annulee.
        exit /b 1
    )
) else (
    echo Backup de securite cree: %SAFETY_BACKUP%
)

echo.
echo Demarrage de la restauration...
echo.

REM Restaurer le backup
set PGPASSWORD=%DB_PASSWORD%
%PGRESTORE% -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% --clean --if-exists --no-owner --no-privileges "%BACKUP_FILE%"

if errorlevel 1 (
    echo.
    echo ERREUR: La restauration a rencontre des problemes.
    echo Verifiez les messages ci-dessus pour plus de details.
    echo.
    echo Le backup de securite est disponible ici: %SAFETY_BACKUP%
    exit /b 1
)

echo.
echo ========================================
echo   RESTAURATION TERMINEE AVEC SUCCES
echo ========================================
echo.

REM Vérifier quelques statistiques
echo Verification de la base de donnees restauree:
echo.
docker exec inventaire_si-db-1 psql -U %DB_USER% -d %DB_NAME% -c "SELECT 'Utilisateurs: ' || COUNT(*) FROM \"User\";"
docker exec inventaire_si-db-1 psql -U %DB_USER% -d %DB_NAME% -c "SELECT 'Employes: ' || COUNT(*) FROM \"Employee\";"
docker exec inventaire_si-db-1 psql -U %DB_USER% -d %DB_NAME% -c "SELECT 'Asset Items: ' || COUNT(*) FROM \"AssetItem\";"
docker exec inventaire_si-db-1 psql -U %DB_USER% -d %DB_NAME% -c "SELECT 'Prets actifs: ' || COUNT(*) FROM \"Loan\" WHERE \"deletedAt\" IS NULL;"
echo.

exit /b 0
