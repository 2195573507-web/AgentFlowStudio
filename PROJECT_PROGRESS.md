# Project Progress

## 2026-05-10 Rebuild Pass

- Created dedicated branch `codex-rebuild-from-mainline`.
- Established `BUILD_JOURNEY.md`, planning files, and rebuild docs.
- Studied mainline patterns from Flowise, Dify, Langflow, n8n, Coze Studio, FastGPT, Open WebUI, OpenAI Agents SDK/Builder, and cc switch-like tools.
- Added first-class workflow types, templates, pure runtime, IPC, preload bridge, renderer API, and `/workflows` route.
- Added workflow runtime tests.
- Fixed security issues in memory context ACL and config import/export privileges.
- Replaced core navigation i18n mojibake with clean Chinese/English keys.

## Current Verification

- Baseline before edits: `npm.cmd test` PASS, `npm.cmd run build` PASS.
- After workflow implementation: `npm.cmd run typecheck` PASS.
- Final `npm.cmd run typecheck` PASS.
- Final `npm.cmd test` PASS: 24 files / 177 tests.
- Final `npm.cmd run build` PASS with non-fatal Vite chunk/dynamic-import warnings.
- Final `npm.cmd run lint` PASS: 0 errors / 25 warnings under threshold.
- Final `npm.cmd run test:e2e` PASS: 16/16.
- `npm.cmd run test:unit` and `npm.cmd run test:integration` are not defined in `package.json`.

## 2026-05-10 Login Recovery Follow-up

- Verified the desktop shortcut already opens `D:\AgentFlowStudio\start-agentflow.bat`.
- Verified the local default admin is active and unlocked in `C:\Users\至亲\AppData\Roaming\AgentFlow Studio\agentflow-data\users.json`.
- Default credentials are valid: `123@admin.com / 123456`.
- Fixed the preload session bridge so `api.auth.session(sessionId)` forwards `sessionId` to the main process.
- Fixed main-process session recovery so a renderer-held `sessionId` can be matched with the main-process secure active token.
- Updated login and forced password-change screens with Chinese-first guidance, default password hints, and concrete error recovery instructions.
- Verification after this follow-up:
  - `npm.cmd run typecheck`: PASS.
  - `npm.cmd test`: PASS, 24 files / 177 tests.
  - `npm.cmd run build`: PASS, non-fatal Vite chunk/dynamic-import warnings only.
  - `npm.cmd run test:e2e`: PASS, 16/16.
