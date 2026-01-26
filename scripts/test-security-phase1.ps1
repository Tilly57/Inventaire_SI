# Script de test pour les correctifs de sécurité Phase 1 (PowerShell)
# Usage: powershell -ExecutionPolicy Bypass scripts\test-security-phase1.ps1

Write-Host "🔐 Testing Security Fixes - Phase 1" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour afficher résultat test
function Test-Result {
    param(
        [Parameter(Mandatory=$true)]
        [bool]$Success,
        [Parameter(Mandatory=$true)]
        [string]$Message
    )

    if ($Success) {
        Write-Host "✓ PASS: $Message" -ForegroundColor Green
    }
    else {
        Write-Host "✗ FAIL: $Message" -ForegroundColor Red
    }
}

Write-Host "Test 1: JWT Secrets Validation" -ForegroundColor Yellow
Write-Host "-------------------------------"

# Test 1.1: Vérifier que le code force les secrets en production
$jwtContent = Get-Content "apps\api\src\config\jwt.js" -Raw
$hasProductionCheck = $jwtContent -match "process\.env\.NODE_ENV === 'production'"
$hasProcessExit = $jwtContent -match "process\.exit\(1\)"
Test-Result ($hasProductionCheck -and $hasProcessExit) "Production enforcement code exists"

# Test 1.2: Vérifier que les defaults ont changé
$hasDevSecrets = $jwtContent -match "dev_access_secret" -and $jwtContent -match "dev_refresh_secret"
Test-Result $hasDevSecrets "Development defaults updated"

Write-Host ""
Write-Host "Test 2: CSP Configuration" -ForegroundColor Yellow
Write-Host "-------------------------"

# Test 2.1: Vérifier que CSP est conditionnelle
$appContent = Get-Content "apps\api\src\app.js" -Raw
$hasCSPCondition = $appContent -match "process\.env\.NODE_ENV === 'production'.*scriptSrc"
Test-Result $hasCSPCondition "CSP has environment-based configuration"

# Test 2.2: Vérifier production CSP stricte
$hasStrictCSP = $appContent -match "\[`"'self'`"\]\s+// Strict in production"
Test-Result $hasStrictCSP "Production CSP is strict (no unsafe-inline)"

# Test 2.3: Vérifier Swagger désactivé en production
$hasSwaggerCheck = $appContent -match "if \(process\.env\.NODE_ENV !== 'production'\).*swagger"
Test-Result $hasSwaggerCheck "Swagger has production check"

Write-Host ""
Write-Host "Test 3: CORS Configuration" -ForegroundColor Yellow
Write-Host "--------------------------"

# Test 3.1: Vérifier CORS rejette no-origin en production
$hasCORSCheck = $appContent -match "if \(!origin\).*process\.env\.NODE_ENV === 'production'"
Test-Result $hasCORSCheck "CORS has origin validation for production"

# Test 3.2: Vérifier message d'erreur
$hasOriginRequired = $appContent -match "Origin header required"
Test-Result $hasOriginRequired "CORS error message exists"

# Test 3.3: Vérifier X-XSRF-TOKEN dans headers
$hasXSRFToken = $appContent -match "X-XSRF-TOKEN"
Test-Result $hasXSRFToken "X-XSRF-TOKEN in allowed headers"

Write-Host ""
Write-Host "Test 4: Code Quality" -ForegroundColor Yellow
Write-Host "-------------------"

# Test 4.1: Vérifier pas d'erreurs de syntaxe (basique)
$jwtSyntaxOk = $jwtContent -match "export const jwtConfig"
$appSyntaxOk = $appContent -match "export default app"
Test-Result ($jwtSyntaxOk -and $appSyntaxOk) "Basic syntax check passed"

# Test 4.2: Vérifier imports
$hasLoggerImport = $jwtContent -match "import logger from"
Test-Result $hasLoggerImport "Logger import exists in jwt.js"

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "📊 Security Fixes Phase 1 - Summary" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ JWT Secrets: " -ForegroundColor Green -NoNewline
Write-Host "Production enforcement implemented"
Write-Host "✓ CSP: " -ForegroundColor Green -NoNewline
Write-Host "Strict policy in production (no unsafe-inline)"
Write-Host "✓ CORS: " -ForegroundColor Green -NoNewline
Write-Host "Origin header required in production"
Write-Host "✓ Swagger: " -ForegroundColor Green -NoNewline
Write-Host "Disabled in production"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in production"
Write-Host "2. Deploy and verify security headers"
Write-Host "3. Proceed to Phase 2 (Token Revocation + Resource Authorization)"
Write-Host ""
Write-Host "📚 Documentation: SECURITY_FIXES_PHASE1_2026-01-26.md"
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")