$sourcePath = Get-Location
$destinationPath = Join-Path $sourcePath "gw_backup_$(Get-Date -Format 'yyyyMMdd_HHmm').zip"
$exclude = @("node_modules", ".git", ".vscode", "dist", "build")

Get-ChildItem -Path $sourcePath -Exclude $exclude | Compress-Archive -DestinationPath $destinationPath -Update

Write-Host "Backup created at: $destinationPath"
