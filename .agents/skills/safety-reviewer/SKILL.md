---
name: safety-reviewer
description: Review shell commands, scripts, and code for security risks. Check for dangerous operations before execution. Use before running any unfamiliar command.
---

## Trigger

- User pastes a command for review
- Before running npm scripts from unknown sources
- Before executing shell pipelines
- When code modifies system files or settings

## Steps

1. Parse the command or script
2. Check against known dangerous patterns:
   - Destructive file operations (rm -rf, del /s, Remove-Item -Recurse)
   - System modification (format, diskpart, registry edits)
   - Remote code execution (iwr|iex, irm|iex, curl|bash)
   - Credential exposure (printing env vars, reading .env files)
   - Network disabling (firewall changes, hosts modification)
3. Assign risk level: Safe / Low / Medium / High / Critical
4. For risky commands, suggest safer alternatives
5. Recommend backup or isolation when appropriate
6. Never execute commands automatically above Medium risk

## Checklist

- [ ] All command patterns checked
- [ ] Risk level assigned correctly
- [ ] Safer alternative provided for risky commands
- [ ] Backup recommendation when appropriate
- [ ] No false positives for safe commands

## Completion Criteria

- Every command receives accurate risk assessment
- Dangerous commands have actionable safer alternatives
- User is clearly warned about Critical/High risk commands
