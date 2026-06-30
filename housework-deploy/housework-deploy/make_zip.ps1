Add-Type -Assembly System.IO.Compression.FileSystem
$src = "C:\housework-app"
$dst = "C:\housework-deploy.zip"
if (Test-Path $dst) { Remove-Item $dst }
$zip = [System.IO.Compression.ZipFile]::Open($dst, "Create")
$excDirs = @("node_modules", ".next", ".git", "bin")
$excNames = @("deploy.zip", "npm_err.txt", "npm_out.txt", "proc_stat.ps1", "check_status.ps1", "run_install.ps1", "run_npm.bat", "zip_deploy.ps1", "check_sizes.ps1", "kill_node.ps1", "node.zip")

# Files
Get-ChildItem $src -File | Where-Object { $excNames -notcontains $_.Name } | ForEach-Object {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $_.Name, "Optimal")
}

# Directories
Get-ChildItem $src -Directory | Where-Object { $excDirs -notcontains $_.Name } | ForEach-Object {
    Get-ChildItem $_.FullName -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($src.Length + 1)
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel, "Optimal")
    }
}
$zip.Dispose()
Get-Item $dst | Select-Object Length, Length/1MB
