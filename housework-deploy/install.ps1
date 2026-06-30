$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$env:Path += ";D:\PROGRA~1\node"
Set-Location "C:\Users\BoBo\.qclaw\workspace-agent-a6eb3e72\housework-app"
& npm install 2>&1
