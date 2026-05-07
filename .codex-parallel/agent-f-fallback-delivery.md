# Agent F - Fallback Delivery Engineer

## Objective
Deliver a Web or Static launch path when Electron/Vite dev is blocked.

## Allowed Scope
- package.json
- vite.config.ts
- scripts/static-server.js
- scripts/create-shortcut-web.ps1
- start-agentflow-web.bat
- start-agentflow-static.bat

## Required Commands
- npm.cmd run dev:web
- npm.cmd run build:web
- node scripts/static-server.js dist 4173

## Acceptance
- Static or Web fallback serves the app.
- Desktop shortcut can target the fallback launcher.

## Output Format
检查:
修复:
验证结果:
changed files:
fallback command:
