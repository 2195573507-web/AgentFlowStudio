# LocalAI Nexus - Create Web Fallback Desktop Shortcut

$ErrorActionPreference = "Stop"

$projectDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "LocalAI Nexus Web Fallback.lnk"
$batPath = Join-Path $projectDir "start-agentflow-web.bat"
$icoPath = Join-Path $projectDir "assets\localai-nexus.ico"

Write-Host "Project directory: $projectDir"
Write-Host "Desktop path: $desktopPath"

if (-not (Test-Path $batPath -PathType Leaf)) {
    throw "Web fallback launcher not found: $batPath"
}

$WScriptShell = New-Object -ComObject WScript.Shell
$shortcut = $WScriptShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $batPath
$shortcut.WorkingDirectory = $projectDir
$shortcut.Description = "LocalAI Nexus - Browser fallback launcher"
$shortcut.WindowStyle = 1

if (Test-Path $icoPath -PathType Leaf) {
    $shortcut.IconLocation = $icoPath
}

$shortcut.Save()

Write-Host "Desktop shortcut created: $shortcutPath"
Write-Host "Shortcut target: $batPath"
Write-Host "Use this if the Electron launcher is unstable."
