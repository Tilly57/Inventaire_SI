# WSL2 Port Forwarding Script
# Runs at Windows boot to forward ports 80/443 from Windows host to WSL2
# Must be run as Administrator

# Get WSL2 IP address
$wslIp = (wsl hostname -I).Trim().Split(" ")[0]

if (-not $wslIp) {
    Write-Error "Could not get WSL2 IP address. Is WSL running?"
    exit 1
}

Write-Host "WSL2 IP: $wslIp"

# Remove existing port proxy rules
netsh interface portproxy delete v4tov4 listenport=80 listenaddress=0.0.0.0 2>$null
netsh interface portproxy delete v4tov4 listenport=443 listenaddress=0.0.0.0 2>$null

# Add new port proxy rules
netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=80 connectaddress=$wslIp
netsh interface portproxy add v4tov4 listenport=443 listenaddress=0.0.0.0 connectport=443 connectaddress=$wslIp

# Verify
Write-Host "Port forwarding configured:"
netsh interface portproxy show all
