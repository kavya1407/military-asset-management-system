# PowerShell script to package the project into a clean zip
$ErrorActionPreference = "Stop"

$root = $PSScriptRoot + "\.."
Set-Location $root

$zipTarget = "$root\military-asset-management-system.zip"
$stage = "$root\staging_zip"

if (Test-Path $zipTarget) { Remove-Item -Force $zipTarget }
if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }

New-Item -ItemType Directory -Force -Path $stage | Out-Null
New-Item -ItemType Directory -Force -Path "$stage\backend" | Out-Null
New-Item -ItemType Directory -Force -Path "$stage\frontend" | Out-Null
New-Item -ItemType Directory -Force -Path "$stage\scripts" | Out-Null

Write-Host "Copying backend files (excluding node_modules)..."
robocopy "$root\backend" "$stage\backend" /E /XD node_modules .git /XF *.log /NJH /NJS /NDL /NC /NS
if ($LASTEXITCODE -ge 8) { throw "Robocopy backend failed with code $LASTEXITCODE" }

Write-Host "Copying frontend files (excluding node_modules)..."
robocopy "$root\frontend" "$stage\frontend" /E /XD node_modules .git /XF *.log /NJH /NJS /NDL /NC /NS
if ($LASTEXITCODE -ge 8) { throw "Robocopy frontend failed with code $LASTEXITCODE" }

Write-Host "Copying scripts..."
robocopy "$root\scripts" "$stage\scripts" /E /XD node_modules /NJH /NJS /NDL /NC /NS
if ($LASTEXITCODE -ge 8) { throw "Robocopy scripts failed with code $LASTEXITCODE" }

Write-Host "Copying root files..."
Copy-Item "$root\database_dump.sql" -Destination "$stage\" -Force
Copy-Item "$root\PROJECT_DOCUMENTATION.md" -Destination "$stage\" -Force
Copy-Item "$root\Military_Asset_Management_System_Documentation.pdf" -Destination "$stage\" -Force
Copy-Item "$root\VIDEO_WALKTHROUGH_SCRIPT.md" -Destination "$stage\" -Force
Copy-Item "$root\DEPLOYMENT_GUIDE.md" -Destination "$stage\" -Force
Copy-Item "$root\README.md" -Destination "$stage\" -Force
Copy-Item "$root\package.json" -Destination "$stage\" -Force

Write-Host "Compressing to $zipTarget..."
Compress-Archive -Path "$stage\*" -DestinationPath $zipTarget -Force
Remove-Item -Recurse -Force $stage

$fileInfo = Get-Item $zipTarget
$mb = [math]::Round($fileInfo.Length / 1MB, 2)
Write-Host "SUCCESS: Archive created: $zipTarget ($mb MB)"
