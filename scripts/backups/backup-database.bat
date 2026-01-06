@echo off
REM Script de backup manuel de la base de données PostgreSQL
REM Usage: backup-database.bat [nom_optionnel]

setlocal enabledelayedexpansion

REM Configuration
set DB_CONTAINER=inventaire_si-db-1
set DB_NAME=inventaire
set DB_USER=inventaire
set BACKUP_DIR=backups\database
set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

REM Nom du backup personnalisé ou par défaut
if "%~1"=="" (
    set BACKUP_NAME=inventaire_%TIMESTAMP%
) else (
    set BACKUP_NAME=%~1_%TIMESTAMP%
)

set BACKUP_FILE=%BACKUP_DIR%\%BACKUP_NAME%.dump

echo ========================================
echo   BACKUP BASE DE DONNEES INVENTAIRE SI
echo ========================================
echo.
echo Container: %DB_CONTAINER%
echo Base de donnees: %DB_NAME%
echo Fichier de backup: %BACKUP_FILE%
echo.

REM Vérifier que le conteneur est en cours d'exécution
docker ps | findstr %DB_CONTAINER% >nul
if errorlevel 1 (
    echo ERREUR: Le conteneur %DB_CONTAINER% n'est pas en cours d'execution.
    echo Veuillez demarrer Docker Compose avec: docker-compose up -d
    exit /b 1
)

REM Créer le répertoire de backup s'il n'existe pas
if not exist "%BACKUP_DIR%" (
    echo Creation du repertoire de backup: %BACKUP_DIR%
    mkdir "%BACKUP_DIR%"
)

REM Effectuer le backup
echo Demarrage du backup...
docker exec %DB_CONTAINER% pg_dump -U %DB_USER% -Fc -Z9 %DB_NAME% > %BACKUP_FILE%

REM Vérifier que le backup a réussi
if errorlevel 1 (
    echo.
    echo ERREUR: Le backup a echoue!
    exit /b 1
)

REM Vérifier que le fichier existe et a une taille > 0
if not exist "%BACKUP_FILE%" (
    echo.
    echo ERREUR: Le fichier de backup n'a pas ete cree!
    exit /b 1
)

REM Obtenir la taille du fichier
for %%A in ("%BACKUP_FILE%") do set FILESIZE=%%~zA
if %FILESIZE% LSS 1000 (
    echo.
    echo AVERTISSEMENT: Le fichier de backup est tres petit (%FILESIZE% octets^)
    echo Cela peut indiquer un probleme.
)

echo.
echo ========================================
echo   BACKUP TERMINE AVEC SUCCES
echo ========================================
echo Fichier: %BACKUP_FILE%
echo Taille: %FILESIZE% octets
echo.

REM Lister les 10 derniers backups
echo Derniers backups disponibles:
dir /B /O-D "%BACKUP_DIR%\*.dump" | findstr /N "^" | findstr "^[1-9]:" | findstr /V "^[1-9][0-9]:"
if errorlevel 1 (
    dir /B /O-D "%BACKUP_DIR%\*.dump"
)
echo.

REM Suggestion de nettoyage si trop de backups
for /f %%A in ('dir /B "%BACKUP_DIR%\*.dump" ^| find /C /V ""') do set BACKUP_COUNT=%%A
if %BACKUP_COUNT% GTR 30 (
    echo INFORMATION: Vous avez %BACKUP_COUNT% fichiers de backup.
    echo Pensez a nettoyer les anciens backups pour economiser de l'espace.
    echo.
)

exit /b 0
