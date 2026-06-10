$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

$token = (az account get-access-token --resource https://management.azure.com --query accessToken -o tsv 2>&1).Trim()
$sub  = "79050d1c-3a01-49c4-82eb-09a27f264ea6"
$rg   = "RG_DharmaJaya"
$app  = "appdj"
$base = "https://management.azure.com/subscriptions/$sub/resourceGroups/$rg/providers/Microsoft.Web/sites/$app"
$kudu = "https://appdj-dmcccphnf6btd2ae.scm.indonesiacentral-01.azurewebsites.net"
$hJson = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

# Step 1: Check what's in wwwroot
Write-Host "[1] Checking /home/site/wwwroot contents..."
$cmdBody = '{"command":"ls -la /home/site/wwwroot/","dir":"/home/site/wwwroot"}'
try {
    $r = Invoke-RestMethod -Method POST -Uri "$kudu/api/command" -Headers $hJson -Body $cmdBody -SkipCertificateCheck -TimeoutSec 30
    Write-Host $r.Output
    if ($r.Error) { Write-Host "STDERR: $($r.Error)" }
} catch { Write-Host "ERR: $($_.Exception.Message)" }

# Step 2: Run npm install
Write-Host ""
Write-Host "[2] Running npm install in /home/site/wwwroot..."
$npmBody = '{"command":"npm install --omit=dev 2>&1","dir":"/home/site/wwwroot"}'
try {
    $r = Invoke-RestMethod -Method POST -Uri "$kudu/api/command" -Headers $hJson -Body $npmBody -SkipCertificateCheck -TimeoutSec 180
    Write-Host $r.Output
    if ($r.Error) { Write-Host "STDERR: $($r.Error)" }
    Write-Host "Exit Code: $($r.ExitCode)"
} catch { Write-Host "ERR: $($_.Exception.Message)" }

# Step 3: Verify node_modules
Write-Host ""
Write-Host "[3] Verifying express in node_modules..."
$verBody = '{"command":"ls /home/site/wwwroot/node_modules/express 2>&1","dir":"/home/site/wwwroot"}'
try {
    $r = Invoke-RestMethod -Method POST -Uri "$kudu/api/command" -Headers $hJson -Body $verBody -SkipCertificateCheck -TimeoutSec 30
    Write-Host $r.Output
} catch { Write-Host "ERR: $($_.Exception.Message)" }

# Step 4: Restart app
Write-Host ""
Write-Host "[4] Restarting app..."
$restartUri = "$base/restart?api-version=2022-03-01"
try {
    Invoke-RestMethod -Method POST -Uri $restartUri -Headers $hJson -SkipCertificateCheck -TimeoutSec 30 | Out-Null
    Write-Host "[4] Restarted OK"
} catch { Write-Host "ERR: $($_.Exception.Message)" }

Write-Host ""
Write-Host "========================================================="
Write-Host " URL: https://appdj-dmcccphnf6btd2ae.indonesiacentral-01.azurewebsites.net"
Write-Host "========================================================="
