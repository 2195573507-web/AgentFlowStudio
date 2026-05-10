# Agent A - Regression Guard

Protect the working Static fallback before any enhancement work.

Required commands:

- `npm.cmd run icon`
- `npm.cmd run smoke`
- `npm.cmd run typecheck`
- `npm.cmd run test:launch-static`
- `npm.cmd run shortcut`

Additional checks:

- Verify `start-agentflow-static.bat`, `scripts\static-server.js`, `static-app`, and `assets\icon.ico` exist.
- Verify Desktop `AgentFlow Studio.lnk` exists and COM properties target the static launcher, working directory, and icon.
- Verify HTTP returns 200 and includes AgentFlow Studio plus core Chinese navigation keywords.
- Verify language and theme buttons exist.

If any regression fails, fix the regression before enhancements.
