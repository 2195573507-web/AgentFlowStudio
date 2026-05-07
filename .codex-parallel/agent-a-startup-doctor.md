# Agent A - Startup Doctor

## Objective
Make at least one AgentFlow Studio launch path open reliably, preferring Electron, then Web, then Static.

## Allowed Scope
- package.json
- vite.config.ts
- tsconfig*.json
- src/main/**
- src/renderer/main.tsx
- src/renderer/App.tsx
- start-agentflow*.bat

## Required Commands
- npm.cmd run typecheck
- npm.cmd run dev
- npm.cmd run dev:web
- npm.cmd run build
- node scripts/static-server.js dist 4173

## Acceptance
- Electron dev opens, or Web dev opens, or Static serves dist with HTTP 200.
- If Electron/Web fail because of environment EPERM, document and switch to Static.

## Output Format
检查:
修复:
验证结果:
changed files:
current launch command:
