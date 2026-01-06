# PowerShell script to refresh the dashboard_stats materialized view
# This should be run every 5 minutes via Task Scheduler on Windows

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "[$timestamp] Refreshing dashboard_stats materialized view..." -ForegroundColor Blue

try {
    # Refresh the materialized view
    docker exec inventaire_si-db-1 psql -U inventaire inventaire -c "REFRESH MATERIALIZED VIEW dashboard_stats;"

    if ($LASTEXITCODE -eq 0) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "[$timestamp] Dashboard stats refreshed successfully ✓" -ForegroundColor Green
        exit 0
    } else {
        throw "Docker command failed with exit code $LASTEXITCODE"
    }
} catch {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] Failed to refresh dashboard stats: $_" -ForegroundColor Red
    exit 1
}
