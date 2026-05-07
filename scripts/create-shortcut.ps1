# AgentFlow Studio - Create Desktop Shortcut
# This script creates a desktop shortcut for AgentFlow Studio

$ErrorActionPreference = "Stop"

$projectDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutName = "AgentFlow Studio"

Write-Host "Project directory: $projectDir"
Write-Host "Desktop path: $desktopPath"

# Check if release exe exists
$exePath = Join-Path $projectDir "release\win-unpacked\AgentFlow Studio.exe"
$icoPath = Join-Path $projectDir "assets\icon.ico"

if (Test-Path $exePath) {
    Write-Host "Found packaged exe at: $exePath"

    # Create shortcut to exe
    $shortcutPath = Join-Path $desktopPath "$shortcutName.lnk"
    $WScriptShell = New-Object -ComObject WScript.Shell
    $shortcut = $WScriptShell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $exePath.ToString()
    $shortcut.WorkingDirectory = (Split-Path $exePath).ToString()
    $shortcut.Description = "AgentFlow Studio - Local AI Project Orchestration Hub"

    if (Test-Path $icoPath) {
        $shortcut.IconLocation = $icoPath
    }

    $shortcut.Save()
    Write-Host "Desktop shortcut created: $shortcutPath"
}
else {
    Write-Host "No packaged exe found. Creating batch file launcher..."

    # Create start batch file
    $batPath = Join-Path $projectDir "start-agentflow.bat"
    $batContent = @"
@echo off
cd /d "$projectDir"
echo Starting AgentFlow Studio...
echo Project: $projectDir
echo.
npm run dev
pause
"@
    Set-Content -Path $batPath -Value $batContent -Encoding ASCII
    Write-Host "Created: $batPath"

    # Create shortcut to batch file
    $shortcutPath = Join-Path $desktopPath "$shortcutName.lnk"
    $WScriptShell = New-Object -ComObject WScript.Shell
    $shortcut = $WScriptShell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $batPath.ToString()
    $shortcut.WorkingDirectory = $projectDir.ToString()
    $shortcut.Description = "AgentFlow Studio - Local AI Project Orchestration Hub"
    $shortcut.WindowStyle = 7  # Minimized

    if (Test-Path $icoPath) {
        $shortcut.IconLocation = $icoPath
    }

    $shortcut.Save()
    Write-Host "Desktop shortcut created: $shortcutPath"
    Write-Host "Shortcut points to: $batPath"
}

Write-Host ""
Write-Host "Done! You can now launch AgentFlow Studio from your desktop."
