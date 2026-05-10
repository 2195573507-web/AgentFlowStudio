# LocalAI Nexus Next Steps

## Current Truth

LocalAI Nexus is now the active product identity on branch `refactor-localai-nexus`. The implementation is not a full final product yet, but the app has a verified LocalAI Nexus desktop shell, icon, shortcut, dashboard, gateway diagnostics, usage summaries, health diagnostics, runtime profile generation, and prompt skill testing.

## Next-Round Priorities

1. **Live Provider Forwarding**
   - Add real upstream calls for OpenAI-compatible chat/responses.
   - Keep `/responses` and `/v1/responses` Base URL diagnostics.
   - Add stream handling after non-streaming forwarding is stable.

2. **Provider Hub / Token Center / Health Monitor UI**
   - Promote existing settings and diagnostics into first-class feature pages.
   - Add token pool, quota, cooldown, concurrency, and failure-class controls.
   - Show health by Provider/model with clear repair suggestions.

3. **Runtime Switcher**
   - Add one-click copy/export for `.env`, JSON, TOML, YAML.
   - Add Codex and Claude Code config diagnosis from actual local files when user opts in.

4. **Skill Hub / Agent Studio / Workflow Studio**
   - Expand beyond Prompt Skill to Tool/MCP/Workflow/Composite skills.
   - Connect Agent and Workflow runs to Provider/Gateway/Skill usage attribution.
   - Add run timeline and retry/pause/cancel controls.

5. **Security Center**
   - Add exportable security reports.
   - Expand provider risk scoring and prompt-injection checks.
   - Keep secrets out of renderer-visible long-term state.

## Remaining Risks

- Gateway is currently diagnostic/mock-style for completions; it records usage but does not forward to upstream providers yet.
- Health checks are local configuration diagnostics, not real provider network probes.
- Compatibility names remain for bridge/storage/launcher stability: `window.agentflow`, `agentflow-data`, `start-agentflow*.bat`.
- Historical handoff/archive files still mention AgentFlow Studio; active top-level docs explain the evolution.

## Useful Continue Commands

```bat
cd /d D:\AgentFlowStudio
git checkout refactor-localai-nexus
npm.cmd install
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd run verify
```

Gateway smoke after launching the desktop app:

```bat
powershell -NoProfile -Command "Invoke-RestMethod http://127.0.0.1:8317/health"
powershell -NoProfile -Command "Invoke-RestMethod http://127.0.0.1:8317/v1/models"
```

## Handoff Reading Order

1. `README.md`
2. `PROJECT_PROGRESS.md`
3. `handoff/TEST_REPORT.md`
4. `handoff/NEXT_STEPS.md`
5. `docs/PROJECT_WORKLOG.md`
6. `docs/PROJECT_STRUCTURE_AUDIT.md`
7. `docs/LOCALAI_NEXUS_REFACTOR_PLAN.md`
8. `docs/LOCALAI_NEXUS_ARCHITECTURE.md`

## Completion Discipline

Mark work as:

- `Completed`: implemented and verified.
- `In progress`: partial implementation exists.
- `Planned`: design exists but code/tests do not prove it yet.
