# AgentFlow Studio - Create Desktop Shortcut
# Current delivery target: rebuilt Electron/Vite workflow studio launcher.

[CmdletBinding()]
param(
    [switch]$DryRun,
    [string]$ShortcutDirectory
)

$ErrorActionPreference = "Stop"

$projectDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$shortcutFileName = "AgentFlow Studio.lnk"
$shortcutDescription = "AgentFlow Studio - Local AI Project Orchestration Hub"
$icoPath = Join-Path $projectDir "assets\icon.ico"

function Test-AgentFlowIcon {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not (Test-Path $Path -PathType Leaf)) {
        throw "Icon file not found: $Path. Run 'npm.cmd run icon' first."
    }

    $iconBytes = [System.IO.File]::ReadAllBytes($Path)
    if ($iconBytes.Length -lt 128) {
        throw "Icon file is empty or too small: $Path"
    }

    $isIco = $iconBytes[0] -eq 0 -and $iconBytes[1] -eq 0 -and $iconBytes[2] -eq 1 -and $iconBytes[3] -eq 0
    if (-not $isIco) {
        throw "Icon file is not a valid Windows ICO: $Path. Run 'npm.cmd run icon' first."
    }

    return $iconBytes.Length
}

function Get-AgentFlowLauncher {
    param([Parameter(Mandatory = $true)][string]$Root)

    $desktopLauncher = Join-Path $Root "start-agentflow.bat"
    if (Test-Path $desktopLauncher -PathType Leaf) {
        return [PSCustomObject]@{
            Kind = "ElectronViteWorkflowStudio"
            TargetPath = $desktopLauncher
            WorkingDirectory = $Root
            WindowStyle = 1
        }
    }

    $electronLauncher = Join-Path $Root "start-agentflow-electron.bat"
    if (Test-Path $electronLauncher -PathType Leaf) {
        return [PSCustomObject]@{
            Kind = "ElectronViteWorkflowStudio"
            TargetPath = $electronLauncher
            WorkingDirectory = $Root
            WindowStyle = 1
        }
    }

    throw "Rebuilt desktop launcher not found. Expected start-agentflow.bat in $Root."
}

$iconSize = Test-AgentFlowIcon -Path $icoPath
$launcher = Get-AgentFlowLauncher -Root $projectDir

if ([string]::IsNullOrWhiteSpace($ShortcutDirectory)) {
    $ShortcutDirectory = [Environment]::GetFolderPath("Desktop")
}

$shortcutPath = Join-Path $ShortcutDirectory $shortcutFileName

Write-Host "Project directory: $projectDir"
Write-Host "Icon: $icoPath ($iconSize bytes)"
Write-Host "Selected target kind: $($launcher.Kind)"
Write-Host "Selected target: $($launcher.TargetPath)"

if ($DryRun) {
    Write-Host "Dry run enabled; desktop shortcut was not created."
    exit 0
}

if (-not (Test-Path $ShortcutDirectory -PathType Container)) {
    throw "Shortcut directory not found: $ShortcutDirectory"
}

$WScriptShell = New-Object -ComObject WScript.Shell
$shortcut = $WScriptShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $launcher.TargetPath
$shortcut.WorkingDirectory = $launcher.WorkingDirectory
$shortcut.Description = $shortcutDescription
$shortcut.WindowStyle = $launcher.WindowStyle
$shortcut.IconLocation = "$icoPath,0"
$shortcut.Save()

Write-Host "Desktop shortcut created: $shortcutPath"
Write-Host "Shortcut target: $($shortcut.TargetPath)"
Write-Host "Working directory: $($shortcut.WorkingDirectory)"
Write-Host "Icon location: $($shortcut.IconLocation)"
