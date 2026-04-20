# WSL2 Startup Script — Inventaire SI
# Starts WSL, Docker, containers and configures port forwarding
# Runs at Windows boot via Scheduled Task (SYSTEM account)

$logFile = "C:\inventaire_SI\logs\wsl-startup.log"
New-Item -ItemType Directory -Path (Split-Path $logFile) -Force | Out-Null

function Log($msg) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $msg" | Tee-Object -FilePath $logFile -Append
}

Log "=== WSL Startup Script ==="

# 1. Start WSL
Log "Starting WSL..."
wsl -d Ubuntu-24.04 -- echo "WSL started"
Start-Sleep -Seconds 5

# 2. Start Docker daemon
Log "Starting Docker daemon..."
wsl -d Ubuntu-24.04 -- sudo service docker start
Start-Sleep -Seconds 10

# 3. Wait for Docker to be ready (max 60s)
$attempts = 0
$maxAttempts = 12
do {
    $result = wsl -d Ubuntu-24.04 -- docker info 2>&1
    if ($LASTEXITCODE -eq 0) { break }
    $attempts++
    Log "Waiting for Docker... ($attempts/$maxAttempts)"
    Start-Sleep -Seconds 5
} while ($attempts -lt $maxAttempts)

if ($attempts -ge $maxAttempts) {
    Log "ERROR: Docker failed to start"
    exit 1
}
Log "Docker is ready"

# 4. Start containers
Log "Starting containers..."
wsl -d Ubuntu-24.04 -- bash -c "cd /mnt/c/inventaire_SI && docker compose -f docker-compose.prod.yml -f docker-compose.deploy.yml up -d"
Start-Sleep -Seconds 15

# 5. Configure port forwarding
Log "Configuring port forwarding..."
$wslIp = (wsl -d Ubuntu-24.04 -- hostname -I).Trim().Split(" ")[0]

if (-not $wslIp) {
    Log "ERROR: Could not get WSL2 IP"
    exit 1
}
Log "WSL2 IP: $wslIp"

netsh interface portproxy delete v4tov4 listenport=80 listenaddress=0.0.0.0 2>$null
netsh interface portproxy delete v4tov4 listenport=443 listenaddress=0.0.0.0 2>$null
netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=80 connectaddress=$wslIp
netsh interface portproxy add v4tov4 listenport=443 listenaddress=0.0.0.0 connectport=443 connectaddress=$wslIp

Log "Port forwarding configured"

# 6. Verify
$containers = wsl -d Ubuntu-24.04 -- docker ps --format "{{.Names}}: {{.Status}}"
Log "Running containers:`n$containers"
Log "=== Startup complete ==="
