# Agent E - Shared Memory Verifier

## Objective
Verify Shared Memory Hub and prompt memory injection.

## Allowed Scope
- src/renderer/lib/memory*.ts
- src/renderer/lib/secretRedaction.ts
- src/renderer/routes/SharedMemoryHub.tsx
- src/renderer/routes/PromptLab.tsx
- src/renderer/routes/Settings.tsx

## Required Checks
- Create/search/archive memory
- Generate cross-model recovery context
- Prompt Lab shared memory injection
- sk-, Bearer, password, secret redaction

## Acceptance
- Functionality is implemented or risks are documented with file references.

## Output Format
检查:
risks:
修复建议:
验证结果:
