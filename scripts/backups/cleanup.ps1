# Script PowerShell pour nettoyer les anciens backups
# Usage: .\cleanup.ps1 [-Days 30] [-DryRun]

param(
    [int]$Days = 30,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

# Configuration
$BACKUP_DIR = "backups\database"
$LOG_DIR = "backups\logs"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NETTOYAGE DES ANCIENS BACKUPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repertoire: $BACKUP_DIR"
Write-Host "Retention: $Days jours"
if ($DryRun) {
    Write-Host "Mode: SIMULATION (aucun fichier ne sera supprime)" -ForegroundColor Yellow
} else {
    Write-Host "Mode: SUPPRESSION REELLE" -ForegroundColor Red
}
Write-Host ""

# Calculer la date limite
$cutoffDate = (Get-Date).AddDays(-$Days)
Write-Host "Les fichiers modifies avant le $($cutoffDate.ToString('yyyy-MM-dd HH:mm:ss')) seront supprimes." -ForegroundColor Gray
Write-Host ""

# Trouver les backups à supprimer (sauf ceux créés manuellement)
$backupsToDelete = Get-ChildItem "$BACKUP_DIR\*.dump" |
    Where-Object {
        $_.LastWriteTime -lt $cutoffDate -and
        ($_.Name -like "inventaire_auto_*" -or $_.Name -like "pre_restore_*")
    }

if ($backupsToDelete.Count -eq 0) {
    Write-Host "Aucun backup a supprimer." -ForegroundColor Green
} else {
    Write-Host "Backups a supprimer ($($backupsToDelete.Count)):" -ForegroundColor Yellow
    Write-Host ""

    $totalSize = 0
    foreach ($file in $backupsToDelete) {
        $size = [math]::Round($file.Length/1KB, 2)
        $totalSize += $file.Length
        Write-Host "  - $($file.Name) ($size KB) - $($file.LastWriteTime)" -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host "Espace a liberer: $([math]::Round($totalSize/1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host ""

    if (-not $DryRun) {
        $confirm = Read-Host "Confirmer la suppression? (oui/non)"
        if ($confirm -eq "oui") {
            $deleted = 0
            foreach ($file in $backupsToDelete) {
                try {
                    Remove-Item $file.FullName -Force
                    $deleted++
                    Write-Host "Supprime: $($file.Name)" -ForegroundColor Green
                } catch {
                    Write-Host "Erreur lors de la suppression de $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
                }
            }
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "$deleted fichier(s) supprime(s) avec succes" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
        } else {
            Write-Host "Suppression annulee." -ForegroundColor Yellow
        }
    } else {
        Write-Host "(Mode simulation - aucun fichier n'a ete supprime)" -ForegroundColor Yellow
    }
}

# Nettoyer les anciens logs
Write-Host ""
Write-Host "Nettoyage des logs..." -ForegroundColor Cyan

if (Test-Path $LOG_DIR) {
    $logsToDelete = Get-ChildItem "$LOG_DIR\*.log" | Where-Object { $_.LastWriteTime -lt $cutoffDate }

    if ($logsToDelete.Count -eq 0) {
        Write-Host "Aucun log a supprimer." -ForegroundColor Green
    } else {
        Write-Host "Logs a supprimer: $($logsToDelete.Count)" -ForegroundColor Yellow

        if (-not $DryRun) {
            foreach ($log in $logsToDelete) {
                try {
                    Remove-Item $log.FullName -Force
                    Write-Host "Supprime: $($log.Name)" -ForegroundColor Green
                } catch {
                    Write-Host "Erreur lors de la suppression de $($log.Name): $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        } else {
            Write-Host "(Mode simulation - aucun log n'a ete supprime)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# Statistiques finales
Write-Host "Statistiques apres nettoyage:" -ForegroundColor Cyan
$remainingBackups = Get-ChildItem "$BACKUP_DIR\*.dump"
$totalBackupSize = ($remainingBackups | Measure-Object -Property Length -Sum).Sum

Write-Host "  Backups restants: $($remainingBackups.Count)" -ForegroundColor Gray
Write-Host "  Espace total: $([math]::Round($totalBackupSize/1MB, 2)) MB" -ForegroundColor Gray

if (Test-Path $LOG_DIR) {
    $remainingLogs = Get-ChildItem "$LOG_DIR\*.log"
    Write-Host "  Logs restants: $($remainingLogs.Count)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Nettoyage termine!" -ForegroundColor Green
