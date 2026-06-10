$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

$token = (az account get-access-token --resource https://management.azure.com --query accessToken -o tsv 2>&1).Trim()
$sub  = "79050d1c-3a01-49c4-82eb-09a27f264ea6"
$rg   = "RG_DharmaJaya"
$app  = "appdj"
$base = "https://management.azure.com/subscriptions/$sub/resourceGroups/$rg/providers/Microsoft.Web/sites/$app"
$h    = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

Write-Host "[1] Setting app settings..."
$settingsUri  = "$base/config/appsettings?api-version=2022-03-01"
$settingsBody = '{"properties":{"PORT":"8080","NODE_ENV":"production","WEBSITE_NODE_DEFAULT_VERSION":"~20"}}'
try {
    Invoke-RestMethod -Method PUT -Uri $settingsUri -Headers $h -Body $settingsBody -SkipCertificateCheck -TimeoutSec 30 | Out-Null
    Write-Host "[1] App settings OK"
} catch {
    Write-Host "[1] ERR: $($_.Exception.Message)"
}

Write-Host "[2] Restarting app..."
$restartUri = "$base/restart?api-version=2022-03-01"
try {
    Invoke-RestMethod -Method POST -Uri $restartUri -Headers $h -SkipCertificateCheck -TimeoutSec 30 | Out-Null
    Write-Host "[2] Restart triggered"
} catch {
    Write-Host "[2] ERR: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "========================================================="
Write-Host " App URL: https://appdj-dmcccphnf6btd2ae.indonesiacentral-01.azurewebsites.net"
Write-Host "========================================================="
