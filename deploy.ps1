$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

Write-Host "[1] Getting token..."
$token = (az account get-access-token --resource https://management.azure.com --query accessToken -o tsv 2>&1).Trim()
if ($token.Length -lt 100) { Write-Host "Token error: $token"; exit 1 }
Write-Host "[1] Token OK (length $($token.Length))"

$sub  = "79050d1c-3a01-49c4-82eb-09a27f264ea6"
$rg   = "RG_DharmaJaya"
$app  = "appdj"
$base = "https://management.azure.com/subscriptions/$sub/resourceGroups/$rg/providers/Microsoft.Web/sites/$app"
$h    = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

# Step 1: Change runtime to Node.js 20
Write-Host "[2] Setting Node.js runtime..."
$cfgUri  = "$base/config/web?api-version=2022-03-01"
$cfgBody = '{"properties":{"linuxFxVersion":"NODE|20-lts","appCommandLine":"node server.js","alwaysOn":false}}'
try {
    $r = Invoke-RestMethod -Method PATCH -Uri $cfgUri -Headers $h -Body $cfgBody -SkipCertificateCheck -TimeoutSec 60
    Write-Host "[2] Runtime set: $($r.properties.linuxFxVersion)"
} catch {
    Write-Host "[2] Config error: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
}

# Step 2: Create ZIP for deployment (exclude node_modules and .git)
Write-Host "[3] Creating deployment ZIP..."
$zipPath = "$env:TEMP\bpbumd-deploy.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath }
$source  = "C:\Users\EN418SJ\bpbumd-control-tower"
$tmpDir  = "$env:TEMP\bpbumd-stage"
if (Test-Path $tmpDir) { Remove-Item $tmpDir -Recurse -Force }
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null
$items = Get-ChildItem $source -Recurse | Where-Object {
    $_.FullName -notmatch '\\node_modules\\' -and
    $_.FullName -notmatch '\\\.git\\' -and
    $_.Name -ne 'deploy.ps1' -and
    $_.Name -ne '.dockerignore' -and
    $_.Name -ne 'Dockerfile'
}
foreach ($item in $items) {
    $dest = $item.FullName.Replace($source, $tmpDir)
    if ($item.PSIsContainer) {
        New-Item -ItemType Directory -Path $dest -Force | Out-Null
    } else {
        $destDir = Split-Path $dest -Parent
        if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
        Copy-Item $item.FullName -Destination $dest
    }
}
Compress-Archive -Path "$tmpDir\*" -DestinationPath $zipPath -Force
Write-Host "[3] ZIP created at $zipPath ($(([Math]::Round((Get-Item $zipPath).Length/1024)))KB)"

# Step 3: Deploy via Kudu ZIP deploy API
Write-Host "[4] Deploying ZIP via Kudu..."
$kuduUri = "https://appdj-dmcccphnf6btd2ae.scm.indonesiacentral-01.azurewebsites.net/api/zipdeploy?isAsync=false"
$hZip = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/zip" }
try {
    $zipBytes = [System.IO.File]::ReadAllBytes($zipPath)
    $resp = Invoke-RestMethod -Method POST -Uri $kuduUri -Headers $hZip -Body $zipBytes -SkipCertificateCheck -TimeoutSec 300
    Write-Host "[4] Deploy succeeded! Response: $resp"
} catch {
    Write-Host "[4] Kudu error: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
    # Fallback: try onedeploy with type=zip
    Write-Host "[4b] Trying onedeploy fallback..."
    $deployUri2 = "$base/extensions/onedeploy?api-version=2022-03-01&type=zip&async=false"
    try {
        $zipBytes = [System.IO.File]::ReadAllBytes($zipPath)
        $resp2 = Invoke-RestMethod -Method PUT -Uri $deployUri2 -Headers $hZip -Body $zipBytes -SkipCertificateCheck -TimeoutSec 300
        Write-Host "[4b] Deploy succeeded via onedeploy"
    } catch {
        Write-Host "[4b] Onedeploy error: $($_.Exception.Message)"
        if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
    }
}

Write-Host "[DONE]"
