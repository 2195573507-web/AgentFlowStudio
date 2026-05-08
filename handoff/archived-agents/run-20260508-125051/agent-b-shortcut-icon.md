# Agent B - Shortcut Icon Engineer

## Objective
Create branded Windows icons and a desktop shortcut that starts the current deliverable launch path.

## Allowed Scope
- assets/**
- scripts/create-icon.js
- scripts/create-shortcut*.ps1
- start-agentflow*.bat

## Required Commands
- npm.cmd run icon
- powershell -ExecutionPolicy Bypass -File scripts/create-shortcut.ps1 -DryRun
- npm.cmd run shortcut

## Acceptance
- assets/icon.ico exists, is non-empty, and has a valid ICO header.
- AgentFlow Studio.lnk exists on the current user's Desktop.
- TargetPath exists.
- WorkingDirectory is D:\AgentFlowStudio.
- IconLocation points to D:\AgentFlowStudio\assets\icon.ico.

## Output Format
检查:
修复:
验证结果:
changed files:
