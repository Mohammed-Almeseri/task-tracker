$ErrorActionPreference = 'Stop'

Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)

$port = 3000
$url = "http://localhost:$port"

$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
    Write-Host "Task Tracker is already running on port $port (PID $($listener.OwningProcess))."
    Start-Process $url
    exit 0
}

Start-Process -WindowStyle Normal -FilePath "cmd.exe" -ArgumentList '/k', 'npm start'

for ($i = 0; $i -lt 60; $i++) {
    try {
        Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 1 | Out-Null
        Start-Process $url
        exit 0
    } catch {
        Start-Sleep -Milliseconds 500
    }
}

Write-Error "Task Tracker did not become ready on port $port."
exit 1