$ErrorActionPreference = "Stop"

$installDir = Join-Path $env:LOCALAPPDATA "MenfisPrintBridge"
$startupDir = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startupDir "Menfis Print Bridge.lnk"
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source

New-Item -ItemType Directory -Path $installDir -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "menfis-print-bridge.cjs") -Destination $installDir -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "print-raw.ps1") -Destination $installDir -Force

$bridgePath = Join-Path $installDir "menfis-print-bridge.cjs"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $nodePath
$shortcut.Arguments = '"' + $bridgePath + '"'
$shortcut.WorkingDirectory = $installDir
$shortcut.WindowStyle = 7
$shortcut.Description = "Ponte local de impressão RAW da Menfis"
$shortcut.Save()

$protocolKey = "HKCU:\Software\Classes\menfis-print-bridge"
$protocolCommandKey = Join-Path $protocolKey "shell\open\command"
New-Item -Path $protocolCommandKey -Force | Out-Null
Set-Item -Path $protocolKey -Value "URL:Menfis Print Bridge Protocol"
New-ItemProperty -Path $protocolKey -Name "URL Protocol" -Value "" -PropertyType String -Force | Out-Null
Set-Item -Path $protocolCommandKey -Value ('"' + $nodePath + '" "' + $bridgePath + '" "%1"')

$listener = Get-NetTCPConnection -LocalPort 17777 -State Listen -ErrorAction SilentlyContinue
if (-not $listener) {
  Start-Process -FilePath $nodePath -ArgumentList ('"' + $bridgePath + '"') -WorkingDirectory $installDir -WindowStyle Hidden
}

$deadline = [DateTime]::UtcNow.AddSeconds(10)
do {
  Start-Sleep -Milliseconds 250
  try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:17777/health" -TimeoutSec 2
    if ($health.ok) {
      Write-Output "MENFIS_PRINT_BRIDGE_READY printer=$($health.printer)"
      exit 0
    }
  } catch {
    # Aguarda a inicialização do processo local.
  }
} while ([DateTime]::UtcNow -lt $deadline)

throw "A ponte de impressão não iniciou na porta 17777"

