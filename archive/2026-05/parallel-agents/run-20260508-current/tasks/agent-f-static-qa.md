# Agent F - Static QA

Expand smoke and launch-static coverage for this round.

Focus files:

- `scripts\smoke-test.js`
- `scripts\launch-static-test.js`
- `package.json`

Must check:

- Static files exist.
- Translations, `zh`, `en`, `agentflow.language`, `agentflow.theme`, `data-theme`, dark theme, and `prefers-color-scheme` exist.
- Shared memory injection, secret redaction, and error fallback markers exist.
- HTTP returns 200 and includes Chinese and English keywords.
- Shortcut target and icon are correct.

Must run:

- `npm.cmd run smoke`
- `npm.cmd run test:launch-static`
