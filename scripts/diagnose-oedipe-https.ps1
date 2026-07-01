<#
.SYNOPSIS
    Diagnostic + reparation de l'acces HTTPS au serveur OEDIPE (Inventaire SI).

.DESCRIPTION
    A executer EN ADMINISTRATEUR sur le serveur OEDIPE (192.168.1.225).

    Contexte de la panne :
      - https://www.tillyinventaire.ti (= 192.168.1.225) : handshake TLS echoue (EOF immediat)
      - HTTP:80 repond 301, port 443 TCP ouvert, mais rien ne repond derriere en TLS
      - Cause probable : le portproxy netsh 443 pointe vers une IP WSL2 perimee
        (l'IP WSL change a chaque redemarrage) et/ou le conteneur nginx est arrete.

    Par defaut le script ne fait QUE du diagnostic (lecture seule).
    Ajouter -Repair pour appliquer la reparation (reconfig portproxy + restart nginx).

.EXAMPLE
    # Diagnostic seul
    powershell -ExecutionPolicy Bypass -File .\diagnose-oedipe-https.ps1

.EXAMPLE
    # Diagnostic puis reparation
    powershell -ExecutionPolicy Bypass -File .\diagnose-oedipe-https.ps1 -Repair
#>

[CmdletBinding()]
param(
    [switch]$Repair,
    [string]$Distro = '',                       # vide = distro WSL par defaut
    [string]$NginxContainer = 'inventaire_nginx',
    [int[]]$Ports = @(80, 443),
    [string[]]$LanIps = @('192.168.1.225')   # IP(s) LAN d'OEDIPE uniquement
)

$ErrorActionPreference = 'Continue'

function Write-Section($t) { Write-Host "`n========== $t ==========" -ForegroundColor Cyan }
function Write-Ok($t)      { Write-Host "  [OK]   $t" -ForegroundColor Green }
function Write-Warn2($t)   { Write-Host "  [WARN] $t" -ForegroundColor Yellow }
function Write-Err2($t)    { Write-Host "  [FAIL] $t" -ForegroundColor Red }
function Write-Info($t)    { Write-Host "  $t" -ForegroundColor Gray }

# Prefixe pour appeler la bonne distro WSL
$wslArgs = @()
if ($Distro) { $wslArgs = @('-d', $Distro) }

# --- Test de handshake TLS compatible Windows PowerShell 5.1 et PowerShell 7 ---
function Test-TlsHandshake {
    param([string]$TargetHost, [int]$Port = 443, [string]$Sni)
    if (-not $Sni) { $Sni = $TargetHost }
    $client = New-Object System.Net.Sockets.TcpClient
    $ssl = $null
    try {
        $iar = $client.BeginConnect($TargetHost, $Port, $null, $null)
        if (-not $iar.AsyncWaitHandle.WaitOne(5000)) { throw "Timeout TCP" }
        $client.EndConnect($iar)
        $cb = [System.Net.Security.RemoteCertificateValidationCallback] { param($a, $b, $c, $d) $true }
        $ssl = New-Object System.Net.Security.SslStream($client.GetStream(), $false, $cb)
        $ssl.AuthenticateAsClient($Sni)
        $subj = ''
        if ($ssl.RemoteCertificate) { $subj = $ssl.RemoteCertificate.Subject }
        return [pscustomobject]@{ Ok = $true; Protocol = $ssl.SslProtocol; Subject = $subj; Error = '' }
    }
    catch {
        $msg = $_.Exception.Message
        if ($_.Exception.InnerException) { $msg = $_.Exception.InnerException.Message }
        return [pscustomobject]@{ Ok = $false; Protocol = ''; Subject = ''; Error = $msg }
    }
    finally {
        if ($ssl) { $ssl.Dispose() }
        $client.Close()
    }
}

# ============================================================
# 0. Pre-requis
# ============================================================
Write-Section "0. Pre-requis"
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($isAdmin) { Write-Ok "Session administrateur" }
else {
    Write-Err2 "PAS administrateur : netsh portproxy ne pourra pas etre modifie. Relancer en admin."
    if ($Repair) { Write-Err2 "Reparation impossible sans droits admin. Arret."; exit 1 }
}
Write-Info "Machine : $env:COMPUTERNAME    (attendu : OEDIPE)"

# ============================================================
# 1. Service WSL keep-alive
# ============================================================
Write-Section "1. Service WSLKeepAlive"
$svc = Get-Service -Name 'WSLKeepAlive' -ErrorAction SilentlyContinue
if ($svc) {
    if ($svc.Status -eq 'Running') { Write-Ok "WSLKeepAlive : Running" }
    else { Write-Warn2 "WSLKeepAlive : $($svc.Status) (devrait etre Running)" }
}
else { Write-Warn2 "Service WSLKeepAlive introuvable (nom different ?)" }

# ============================================================
# 2. Etat WSL + IP WSL courante
# ============================================================
Write-Section "2. WSL2 et IP interne"
& wsl -l -v 2>&1 | ForEach-Object { Write-Info $_ }

$wslIp = (& wsl @wslArgs hostname -I 2>$null)
if ($wslIp) { $wslIp = ($wslIp.Trim() -split '\s+')[0] }
if (-not $wslIp) {
    Write-Err2 "Impossible d'obtenir l'IP WSL (WSL arrete ?). Tentative de demarrage..."
    & wsl @wslArgs -- echo "wsl-up" 2>&1 | Out-Null
    $wslIp = (& wsl @wslArgs hostname -I 2>$null)
    if ($wslIp) { $wslIp = ($wslIp.Trim() -split '\s+')[0] }
}
if ($wslIp) { Write-Ok "IP WSL courante : $wslIp" }
else { Write-Err2 "IP WSL toujours indisponible. Verifier 'wsl -l -v' et le service." }

# ============================================================
# 3. Portproxy actuel + coherence avec l'IP WSL
# ============================================================
Write-Section "3. netsh portproxy"
$pp = netsh interface portproxy show all 2>&1
$pp | ForEach-Object { Write-Info $_ }
$ppText = ($pp | Out-String)
$portproxyStale = $false
if ($wslIp) {
    if ($ppText -match [regex]::Escape($wslIp)) {
        Write-Ok "Le portproxy reference bien l'IP WSL courante ($wslIp)"
    }
    else {
        Write-Err2 "Le portproxy NE reference PAS l'IP WSL courante ($wslIp) => regles PERIMEES."
        $portproxyStale = $true
    }
}

# ============================================================
# 4. Conteneurs Docker (nginx / web / api)
# ============================================================
Write-Section "4. Conteneurs Docker"
$dockerPs = & wsl @wslArgs -- bash -lc "docker ps --format '{{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || sudo docker ps --format '{{.Names}}\t{{.Status}}' 2>/dev/null" 2>&1
if ($LASTEXITCODE -eq 0 -and $dockerPs) {
    $dockerPs | ForEach-Object { Write-Info $_ }
    if ($dockerPs -match $NginxContainer) { Write-Ok "$NginxContainer present" }
    else { Write-Warn2 "$NginxContainer absent de la liste 'docker ps' (arrete ?)" }
}
else {
    Write-Warn2 "docker ps inaccessible sans sudo. A verifier manuellement dans WSL :"
    Write-Info "  sudo docker ps"
    Write-Info "  sudo docker logs $NginxContainer --tail 50"
}

# ============================================================
# 5. Tests reseau locaux
# ============================================================
Write-Section "5. Tests reseau (depuis OEDIPE)"
if ($wslIp) {
    foreach ($p in $Ports) {
        $r = Test-NetConnection -ComputerName $wslIp -Port $p -WarningAction SilentlyContinue
        if ($r.TcpTestSucceeded) { Write-Ok "WSL $wslIp : port $p ouvert" }
        else { Write-Err2 "WSL $wslIp : port $p FERME (nginx down dans WSL ?)" }
    }
    $h = Test-TlsHandshake -TargetHost $wslIp -Port 443 -Sni 'www.tillyinventaire.ti'
    if ($h.Ok) { Write-Ok "Handshake TLS direct vers WSL OK ($($h.Protocol)) cert=$($h.Subject)" }
    else { Write-Err2 "Handshake TLS direct vers WSL ECHEC : $($h.Error)" }
}
foreach ($ip in $LanIps) {
    $h = Test-TlsHandshake -TargetHost $ip -Port 443 -Sni 'www.tillyinventaire.ti'
    if ($h.Ok) { Write-Ok "HTTPS $ip : OK ($($h.Protocol))" }
    else { Write-Err2 "HTTPS $ip : ECHEC : $($h.Error)" }
}

# ============================================================
# 6. REPARATION (uniquement avec -Repair)
# ============================================================
if ($Repair) {
    Write-Section "6. REPARATION"
    if (-not $wslIp) { Write-Err2 "Pas d'IP WSL : impossible de reconfigurer le portproxy. Arret."; exit 1 }

    Write-Info "6a. Reconfiguration du portproxy vers $wslIp (listenaddress=0.0.0.0)"
    foreach ($p in $Ports) {
        foreach ($la in (@('0.0.0.0') + $LanIps)) {
            netsh interface portproxy delete v4tov4 listenport=$p listenaddress=$la 2>$null | Out-Null
        }
        netsh interface portproxy add v4tov4 listenport=$p listenaddress=0.0.0.0 connectport=$p connectaddress=$wslIp
        if ($LASTEXITCODE -eq 0) { Write-Ok "portproxy 0.0.0.0:$p -> ${wslIp}:$p" }
        else { Write-Err2 "Echec ajout portproxy port $p" }
    }

    Write-Info "6b. Regles pare-feu entrantes (idempotent)"
    foreach ($p in $Ports) {
        $ruleName = "Inventaire SI - TCP $p"
        if (-not (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {
            New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow `
                -Protocol TCP -LocalPort $p -Profile Any | Out-Null
            Write-Ok "Regle pare-feu creee : $ruleName"
        }
        else { Write-Ok "Regle pare-feu deja presente : $ruleName" }
    }

    Write-Info "6c. Redemarrage du conteneur nginx (sudo peut demander un mot de passe)"
    & wsl @wslArgs -- bash -lc "sudo docker restart $NginxContainer" 2>&1 | ForEach-Object { Write-Info $_ }

    Write-Info "6d. Re-test HTTPS apres reparation"
    Start-Sleep -Seconds 3
    foreach ($ip in $LanIps) {
        $h = Test-TlsHandshake -TargetHost $ip -Port 443 -Sni 'www.tillyinventaire.ti'
        if ($h.Ok) { Write-Ok "HTTPS $ip : OK ($($h.Protocol))" }
        else { Write-Err2 "HTTPS $ip : TOUJOURS EN ECHEC : $($h.Error)" }
    }

    Write-Section "Etat portproxy final"
    netsh interface portproxy show all 2>&1 | ForEach-Object { Write-Info $_ }
}
else {
    Write-Section "Diagnostic termine"
    if ($portproxyStale) {
        Write-Warn2 "Portproxy perime detecte. Relancer avec -Repair pour corriger :"
        Write-Info "  powershell -ExecutionPolicy Bypass -File .\diagnose-oedipe-https.ps1 -Repair"
    }
    else {
        Write-Info "Si le HTTPS echoue malgre un portproxy a jour, le souci vient de nginx dans WSL :"
        Write-Info "  wsl: sudo docker logs $NginxContainer --tail 50 ; sudo docker restart $NginxContainer"
    }
}
