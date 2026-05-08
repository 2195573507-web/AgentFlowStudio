# Agent C - Build Test Engineer

## Objective
Stabilize verification without blocking on environmental esbuild/Vitest EPERM.

## Allowed Scope
- package.json
- tests/**
- scripts/smoke-test.js
- vitest.config.*
- playwright.config.*

## Required Commands
- npm.cmd install
- npm.cmd run typecheck
- npm.cmd run test
- npm.cmd run build
- npm.cmd run smoke
- npm.cmd run verify

## Acceptance
- typecheck passes.
- smoke passes.
- verify passes.
- Vitest/build EPERM is documented as an environment limitation if reproduced.

## Output Format
检查:
修复:
验证结果:
changed files:
