@echo off
REM Script de backup automatique quotidien
REM Ce script est conçu pour être exécuté par le planificateur de tâches Windows

setlocal enabledelayedexpansion

REM Configuration
set DB_CONTAINER=inventaire_si-db-1
set DB_NAME=inventaire
set DB_USER=inventaire
set BACKUP_DIR=%~dp0..\..\backups\database
set LOG_DIR=%~dp0..\..\backups\logs
set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=%BACKUP_DIR%\inventaire_auto_%TIMESTAMP%.dump
set LOG_FILE=%LOG_DIR%\backup_%TIMESTAMP%.log
set RETENTION_DAYS=30

REM Créer les répertoires s'ils n'existent pas
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Rediriger la sortie vers le fichier log
call :main > "%LOG_FILE%" 2>&1
exit /b %ERRORLEVEL%

:main
echo ========================================
echo BACKUP AUTOMATIQUE - %date% %time%
echo ========================================
echo.

REM Vérifier que Docker est en cours d'exécution
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Docker n'est pas en cours d'execution.
    exit /b 1
)

REM Vérifier que le conteneur est en cours d'exécution
docker ps | findstr %DB_CONTAINER% >nul
if errorlevel 1 (
    echo ERREUR: Le conteneur %DB_CONTAINER% n'est pas en cours d'execution.
    exit /b 1
)

echo Demarrage du backup automatique...
echo Conteneur: %DB_CONTAINER%
echo Base de donnees: %DB_NAME%
echo Fichier: %BACKUP_FILE%
echo.

REM Effectuer le backup
docker exec %DB_CONTAINER% pg_dump -U %DB_USER% -Fc -Z9 %DB_NAME% > "%BACKUP_FILE%"

if errorlevel 1 (
    echo ERREUR: Le backup a echoue!
    exit /b 1
)

REM Vérifier la taille du fichier
for %%A in ("%BACKUP_FILE%") do set FILESIZE=%%~zA
echo Backup cree avec succes: %FILESIZE% octets
echo.

REM Nettoyer les anciens backups (plus de 30 jours)
echo Nettoyage des anciens backups (rétention: %RETENTION_DAYS% jours)...
forfiles /P "%BACKUP_DIR%" /M inventaire_auto_*.dump /D -%RETENTION_DAYS% /C "cmd /c del @path && echo Supprime: @file" 2>nul
if errorlevel 1 (
    echo Aucun ancien backup a supprimer.
) else (
    echo Anciens backups supprimes.
)
echo.

REM Nettoyer les anciens logs (plus de 30 jours)
forfiles /P "%LOG_DIR%" /M backup_*.log /D -%RETENTION_DAYS% /C "cmd /c del @path" 2>nul

REM Statistiques
for /f %%A in ('dir /B "%BACKUP_DIR%\*.dump" ^| find /C /V ""') do set TOTAL_BACKUPS=%%A
echo Total de backups disponibles: %TOTAL_BACKUPS%
echo.

echo ========================================
echo BACKUP AUTOMATIQUE TERMINE - %date% %time%
echo ========================================
exit /b 0
