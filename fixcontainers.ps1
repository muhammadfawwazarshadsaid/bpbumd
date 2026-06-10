$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

$token = (az account get-access-token --resource https://management.azure.com --query accessToken -o tsv 2>&1).Trim()
$sub  = "79050d1c-3a01-49c4-82eb-09a27f264ea6"
$rg   = "RG_DharmaJaya"
$app  = "appdj"
$base = "https://management.azure.com/subscriptions/$sub/resourceGroups/$rg/providers/Microsoft.Web/sites/$app"
$h    = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

# Step 1: List sitecontainers
Write-Host "[1] Listing sitecontainers..."
try {
    $sc = Invoke-RestMethod -Method GET -Uri "$base/sitecontainers?api-version=2023-12-01" -Headers $h -SkipCertificateCheck -TimeoutSec 30
    Write-Host "[1] Found $($sc.value.Count) sitecontainer(s):"
    foreach ($c in $sc.value) {
        Write-Host "    - Name: $($c.name)  Image: $($c.properties.image)  IsMain: $($c.properties.isMain)"
    }
} catch {
    Write-Host "[1] ERR: $($_.Exception.Message)"
}

# Step 2: Delete each sitecontainer
Write-Host ""
Write-Host "[2] Deleting all sitecontainers..."
try {
    $sc = Invoke-RestMethod -Method GET -Uri "$base/sitecontainers?api-version=2023-12-01" -Headers $h -SkipCertificateCheck -TimeoutSec 30
    foreach ($c in $sc.value) {
        Write-Host "    Deleting: $($c.name)..."
        try {
            Invoke-RestMethod -Method DELETE -Uri "$base/sitecontainers/$($c.name)?api-version=2023-12-01" -Headers $h -SkipCertificateCheck -TimeoutSec 30 | Out-Null
            Write-Host "    Deleted: $($c.name)"
        } catch {
            Write-Host "    ERR deleting $($c.name): $($_.Exception.Message)"
            if ($_.ErrorDetails.Message) { Write-Host "    $($_.ErrorDetails.Message)" }
        }
    }
} catch {
    Write-Host "[2] ERR listing: $($_.Exception.Message)"
}

# Step 3: Ensure port setting is correct
Write-Host ""
Write-Host "[3] Setting app settings..."
$settingsUri  = "$base/config/appsettings?api-version=2022-03-01"
$settingsBody = '{"properties":{"PORT":"8080","NODE_ENV":"production","WEBSITE_NODE_DEFAULT_VERSION":"~20","SCM_DO_BUILD_DURING_DEPLOYMENT":"false"}}'
try {
    Invoke-RestMethod -Method PUT -Uri $settingsUri -Headers $h -Body $settingsBody -SkipCertificateCheck -TimeoutSec 30 | Out-Null
    Write-Host "[3] App settings OK"
} catch {
    Write-Host "[3] ERR: $($_.Exception.Message)"
}

# Step 4: Restart
Write-Host ""
Write-Host "[4] Restarting app..."
try {
    Invoke-RestMethod -Method POST -Uri "$base/restart?api-version=2022-03-01" -Headers $h -SkipCertificateCheck -TimeoutSec 30 | Out-Null
    Write-Host "[4] Restarted"
} catch {
    Write-Host "[4] ERR: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "Waiting 30s for restart..."
Start-Sleep -Seconds 30

# Step 5: Test HTTP
Write-Host ""
Write-Host "[5] Probing app..."
$appUrl = "https://appdj-dmcccphnf6btd2ae.indonesiacentral-01.azurewebsites.net"
foreach ($path in @("/health", "/", "/login.html")) {
    try {
        $r = Invoke-WebRequest -Uri "$appUrl$path" -SkipCertificateCheck -TimeoutSec 20 -UseBasicParsing -MaximumRedirection 5
        Write-Host "$path -> HTTP $($r.StatusCode) ($($r.Content.Length) bytes)"
    } catch {
        $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { "ERR" }
        Write-Host "$path -> $code : $($_.Exception.Message.Split("`n")[0])"
    }
}

Write-Host ""
Write-Host "========================================================="
Write-Host " URL: $appUrl"
Write-Host "========================================================="
