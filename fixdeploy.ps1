$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

$token = (az account get-access-token --resource https://management.azure.com --query accessToken -o tsv 2>&1).Trim()
$sub  = "79050d1c-3a01-49c4-82eb-09a27f264ea6"
$rg   = "RG_DharmaJaya"
$app  = "appdj"
$base = "https://management.azure.com/subscriptions/$sub/resourceGroups/$rg/providers/Microsoft.Web/sites/$app"
$h    = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

# Step 1: Enable Oryx build during deployment (runs npm install automatically)
Write-Host "[1] Enabling Oryx build (SCM_DO_BUILD_DURING_DEPLOYMENT)..."
$settingsUri  = "$base/config/appsettings?api-version=2022-03-01"
$settingsBody = '{"properties":{"PORT":"8080","NODE_ENV":"production","WEBSITE_NODE_DEFAULT_VERSION":"~20","SCM_DO_BUILD_DURING_DEPLOYMENT":"true"}}'
try {
    Invoke-RestMethod -Method PUT -Uri $settingsUri -Headers $h -Body $settingsBody -SkipCertificateCheck -TimeoutSec 30 | Out-Null
    Write-Host "[1] App settings updated OK"
} catch {
    Write-Host "[1] ERR: $($_.Exception.Message)"
}

# Step 2: Create ZIP without node_modules (Oryx will npm install)
Write-Host "[2] Creating deployment ZIP (source only, no node_modules)..."
$zipPath = "$env:TEMP\bpbumd-deploy.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath }
$source  = "C:\Users\EN418SJ\bpbumd-control-tower"
$tmpDir  = "$env:TEMP\bpbumd-stage"
if (Test-Path $tmpDir) { Remove-Item $tmpDir -Recurse -Force }
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null

$items = Get-ChildItem $source -Recurse | Where-Object {
    $_.FullName -notmatch '\\node_modules\\' -and
    $_.FullName -notmatch '\\\\.git\\' -and
    $_.Name -notin @('deploy.ps1','restart.ps1','diagnose.ps1','fixdeploy.ps1','.dockerignore','Dockerfile')
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
$sizeKB = [Math]::Round((Get-Item $zipPath).Length / 1024)
Write-Host "[2] ZIP created: $sizeKB KB"
Write-Host "[2] Contents:"
Get-ChildItem $tmpDir -Recurse | Where-Object { !$_.PSIsContainer } | ForEach-Object { Write-Host "    $($_.FullName.Replace($tmpDir,''))" }

# Step 3: Deploy via Kudu ZIP
Write-Host "[3] Deploying to Kudu..."
$kuduUri = "https://appdj-dmcccphnf6btd2ae.scm.indonesiacentral-01.azurewebsites.net/api/zipdeploy?isAsync=false"
$hZip = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/zip" }
try {
    $zipBytes = [System.IO.File]::ReadAllBytes($zipPath)
    $resp = Invoke-RestMethod -Method POST -Uri $kuduUri -Headers $hZip -Body $zipBytes -SkipCertificateCheck -TimeoutSec 300
    Write-Host "[3] Deploy succeeded!"
} catch {
    Write-Host "[3] Kudu error: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
}

# Step 4: Restart
Write-Host "[4] Restarting app..."
$restartUri = "$base/restart?api-version=2022-03-01"
try {
    Invoke-RestMethod -Method POST -Uri $restartUri -Headers $h -SkipCertificateCheck -TimeoutSec 30 | Out-Null
    Write-Host "[4] App restarted"
} catch {
    Write-Host "[4] ERR: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "========================================================="
Write-Host " URL: https://appdj-dmcccphnf6btd2ae.indonesiacentral-01.azurewebsites.net"
Write-Host " (allow ~60s for Oryx npm install to complete)"
Write-Host "========================================================="
