@echo off
REM Script pour restaurer la base de données de production dans Docker
REM Usage: restore-to-docker.bat [fichier.dump]

echo ============================================
echo Restauration base de donnees vers Docker
echo ============================================
echo.

REM Vérifier si Docker est lancé
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Docker n'est pas lance ou inaccessible
    echo Veuillez demarrer Docker Desktop et reessayer
    pause
    exit /b 1
)

REM Trouver le fichier de backup le plus récent ou utiliser celui spécifié
if "%~1"=="" (
    echo Recherche du backup le plus recent...
    for /f "delims=" %%i in ('dir /b /o-d "..\..\backups\database\*.dump" 2^>nul ^| findstr /r ".*"') do (
        set BACKUP_FILE=..\..\backups\database\%%i
        goto :found
    )
    echo [ERREUR] Aucun fichier de backup trouve dans backups/database/
    pause
    exit /b 1
) else (
    set BACKUP_FILE=%~1
)

:found
echo Fichier de backup : %BACKUP_FILE%
echo.

REM Vérifier que le fichier existe
if not exist "%BACKUP_FILE%" (
    echo [ERREUR] Le fichier %BACKUP_FILE% n'existe pas
    pause
    exit /b 1
)

REM Demander confirmation
echo ATTENTION : Cette operation va :
echo   1. Arreter les conteneurs Docker
echo   2. Supprimer la base de donnees existante dans Docker
echo   3. Restaurer la base de production
echo.
set /p CONFIRM="Continuer ? (O/N) : "
if /i not "%CONFIRM%"=="O" (
    echo Operation annulee
    pause
    exit /b 0
)

echo.
echo [1/5] Arret des conteneurs...
docker-compose down

echo.
echo [2/5] Demarrage uniquement de la base de donnees...
docker-compose up -d db

echo.
echo [3/5] Attente du demarrage de PostgreSQL (15 secondes)...
timeout /t 15 /nobreak >nul

echo.
echo [4/5] Suppression de la base existante et recreation...
docker exec inventaire_si-db-1 psql -U inventaire postgres -c "DROP DATABASE IF EXISTS inventaire;"
docker exec inventaire_si-db-1 psql -U inventaire postgres -c "CREATE DATABASE inventaire OWNER inventaire;"

echo.
echo [5/5] Restauration du backup...
REM Copier le backup dans le conteneur
docker cp "%BACKUP_FILE%" inventaire_si-db-1:/tmp/restore.dump

REM Restaurer le backup
docker exec inventaire_si-db-1 pg_restore -U inventaire -d inventaire -v /tmp/restore.dump

REM Nettoyer
docker exec inventaire_si-db-1 rm /tmp/restore.dump

echo.
echo ============================================
echo Restauration terminee avec succes !
echo ============================================
echo.
echo Pour demarrer tous les services :
echo   docker-compose up -d
echo.
pause
