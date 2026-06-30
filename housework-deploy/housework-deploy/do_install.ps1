$ErrorActionPreference = "Continue"
$nodeExe = "C:\housework-app\bin\node.exe"
# npx is just npm with different wrapper - use npm directly with the full path
$npmBin = "C:\housework-app\bin\node_modules\npm\bin\npm-cli.js"
$process = Start-Process -FilePath $nodeExe -ArgumentList $npmBin, "install", "--prefix", "C:\housework-app" -WorkingDirectory "C:\housework-app" -NoNewWindow -Wait -PassThru
Write-Host "Exit code: $($process.ExitCode)"
