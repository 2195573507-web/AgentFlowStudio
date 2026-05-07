# AgentFlow Studio - Create Desktop Shortcut
# Target priority: packaged exe > static fallback > web fallback > Electron dev bat.

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

    $exeCandidates = @(
        "release\win-unpacked\AgentFlow Studio.exe",
        "release\AgentFlow Studio.exe",
        "dist\win-unpacked\AgentFlow Studio.exe",
        "dist\AgentFlow Studio.exe",
        "out\AgentFlow Studio.exe"
    ) | ForEach-Object { Join-Path $Root $_ }

    $exePath = $exeCandidates | Where-Object { Test-Path $_ -PathType Leaf } | Select-Object -First 1

    if (-not $exePath) {
        $searchRoots = @("release", "dist", "out") |
            ForEach-Object { Join-Path $Root $_ } |
            Where-Object { Test-Path $_ -PathType Container }

        if ($searchRoots) {
            $exePath = Get-ChildItem -Path $searchRoots -Filter "*.exe" -Recurse -File -ErrorAction SilentlyContinue |
                Sort-Object @{ Expression = { if ($_.BaseName -eq "AgentFlow Studio") { 0 } else { 1 } } }, FullName |
                Select-Object -ExpandProperty FullName -First 1
        }
    }

    if ($exePath) {
        return [PSCustomObject]@{
            Kind = "PackagedExe"
            TargetPath = $exePath
            WorkingDirectory = Split-Path $exePath
            WindowStyle = 1
        }
    }

    $batCandidates = @(
        @{ Kind = "StaticBat"; Path = "start-agentflow-static.bat" },
        @{ Kind = "WebBat"; Path = "start-agentflow-web.bat" },
        @{ Kind = "ElectronBat"; Path = "start-agentflow-electron.bat" },
        @{ Kind = "ElectronBat"; Path = "start-agentflow.bat" }
    )

    foreach ($candidate in $batCandidates) {
        $candidatePath = Join-Path $Root $candidate.Path
        if (Test-Path $candidatePath -PathType Leaf) {
            return [PSCustomObject]@{
                Kind = $candidate.Kind
                TargetPath = $candidatePath
                WorkingDirectory = $Root
                WindowStyle = 7
            }
        }
    }

    throw "No launcher found. Expected packaged exe or start-agentflow*.bat in $Root."
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
$shortcut.IconLocation = $icoPath
$shortcut.Save()

Write-Host "Desktop shortcut created: $shortcutPath"
