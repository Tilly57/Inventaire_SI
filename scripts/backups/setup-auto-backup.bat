@echo off
REM Script de configuration du backup automatique quotidien
REM Ce script doit être exécuté en tant qu'administrateur

echo ========================================
echo CONFIGURATION DU BACKUP AUTOMATIQUE
echo ========================================
echo.

REM Vérifier les privilèges administrateur
net session >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Ce script doit etre execute en tant qu'administrateur.
    echo.
    echo Cliquez droit sur le fichier et selectionnez "Executer en tant qu'administrateur"
    pause
    exit /b 1
)

set SCRIPT_PATH=%~dp0backup-auto-daily.bat
set TASK_NAME=InventaireSI_BackupDaily
set TASK_TIME=02:00

echo Configuration de la tache planifiee Windows:
echo.
echo Nom de la tache: %TASK_NAME%
echo Heure d'execution: %TASK_TIME% (tous les jours)
echo Script: %SCRIPT_PATH%
echo.

REM Supprimer la tâche si elle existe déjà
schtasks /query /tn "%TASK_NAME%" >nul 2>&1
if not errorlevel 1 (
    echo Une tache existante a ete trouvee. Suppression...
    schtasks /delete /tn "%TASK_NAME%" /f
    echo.
)

REM Créer la nouvelle tâche planifiée
echo Creation de la nouvelle tache planifiee...
schtasks /create /tn "%TASK_NAME%" /tr "\"%SCRIPT_PATH%\"" /sc daily /st %TASK_TIME% /ru SYSTEM /rl HIGHEST /f

if errorlevel 1 (
    echo.
    echo ERREUR: Impossible de creer la tache planifiee.
    pause
    exit /b 1
)

echo.
echo ========================================
echo CONFIGURATION REUSSIE
echo ========================================
echo.
echo La tache planifiee a ete creee avec succes.
echo.
echo Parametres:
echo - Nom: %TASK_NAME%
echo - Frequence: Tous les jours a %TASK_TIME%
echo - Retention: 30 jours
echo - Emplacement des backups: backups\database\
echo - Logs: backups\logs\
echo.
echo Pour modifier l'heure d'execution:
echo 1. Ouvrez le Planificateur de taches Windows
echo 2. Cherchez la tache: %TASK_NAME%
echo 3. Modifiez les parametres selon vos besoins
echo.
echo Pour executer un backup manuel:
echo Utilisez le script: scripts\backups\backup-database.bat
echo.
pause
