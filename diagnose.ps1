$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

$token = (az account get-access-token --resource https://management.azure.com --query accessToken -o tsv 2>&1).Trim()
$sub  = "79050d1c-3a01-49c4-82eb-09a27f264ea6"
$rg   = "RG_DharmaJaya"
$app  = "appdj"
$base = "https://management.azure.com/subscriptions/$sub/resourceGroups/$rg/providers/Microsoft.Web/sites/$app"
$kudu = "https://appdj-dmcccphnf6btd2ae.scm.indonesiacentral-01.azurewebsites.net"
$h    = @{ "Authorization" = "Bearer $token" }

# Get recent deployment logs
Write-Host "=== RECENT DEPLOYMENTS ==="
try {
    $deps = Invoke-RestMethod -Method GET -Uri "$kudu/api/deployments?`$orderby=received_time desc&`$top=3" -Headers $h -SkipCertificateCheck -TimeoutSec 30
    foreach ($d in $deps) {
        Write-Host "Id: $($d.id) | Status: $($d.status) | Active: $($d.active) | Message: $($d.message)"
        Write-Host "  Log URL: $($d.log_url)"
    }
} catch { Write-Host "ERR: $($_.Exception.Message)" }

# Get the latest deployment detail log
Write-Host ""
Write-Host "=== LATEST DEPLOY LOG ==="
try {
    $deps = Invoke-RestMethod -Method GET -Uri "$kudu/api/deployments?`$orderby=received_time desc&`$top=1" -Headers $h -SkipCertificateCheck -TimeoutSec 30
    if ($deps -and $deps[0].log_url) {
        $log = Invoke-RestMethod -Method GET -Uri $deps[0].log_url -Headers $h -SkipCertificateCheck -TimeoutSec 30
        foreach ($entry in $log) {
            Write-Host "$($entry.log_time) [$($entry.level)] $($entry.message)"
        }
    }
} catch { Write-Host "ERR: $($_.Exception.Message)" }

# Get app logs (stdout/stderr)
Write-Host ""
Write-Host "=== APP LOGS (recent) ==="
try {
    $logUri = "$kudu/api/logs/docker"
    $logs = Invoke-RestMethod -Method GET -Uri $logUri -Headers $h -SkipCertificateCheck -TimeoutSec 30
    foreach ($f in $logs | Select-Object -Last 3) {
        Write-Host "File: $($f.name) ($($f.size) bytes)"
        $content = Invoke-RestMethod -Method GET -Uri $f.href -Headers $h -SkipCertificateCheck -TimeoutSec 30
        Write-Host ($content | Select-Object -Last 40 | Out-String)
    }
} catch { Write-Host "ERR docker logs: $($_.Exception.Message)" }

# Get current config
Write-Host ""
Write-Host "=== APP CONFIG ==="
try {
    $cfg = Invoke-RestMethod -Method GET -Uri "$base/config/web?api-version=2022-03-01" -Headers (@{ "Authorization" = "Bearer $token" }) -SkipCertificateCheck -TimeoutSec 30
    Write-Host "linuxFxVersion: $($cfg.properties.linuxFxVersion)"
    Write-Host "appCommandLine: $($cfg.properties.appCommandLine)"
    Write-Host "nodeVersion:    $($cfg.properties.nodeVersion)"
} catch { Write-Host "ERR config: $($_.Exception.Message)" }
