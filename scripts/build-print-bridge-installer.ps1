$ErrorActionPreference = "Stop"

$project = Join-Path $PSScriptRoot "..\tools\MenfisPrintBridge\MenfisPrintBridge.csproj"
$output = Join-Path $PSScriptRoot "..\dist\print-bridge"

dotnet publish $project `
  --configuration Release `
  --runtime win-x64 `
  --self-contained true `
  -p:PublishSingleFile=true `
  --output $output

$source = Join-Path $output "MenfisPrintBridgeSetup.exe"
$destination = Join-Path (Split-Path $output -Parent) "MenfisPrintBridgeSetup.exe"
Copy-Item -LiteralPath $source -Destination $destination -Force

$hash = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash
Write-Output "INSTALLER=$destination"
Write-Output "SHA256=$hash"
