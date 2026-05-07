---
name: memory-curator
description: Manage the Shared Memory Hub - curate project memories, ensure quality, redact secrets, and generate cross-model context prompts. Use when managing project context across AI tools.
---

## Trigger

- New project context needs to be saved
- Switching between AI models/tools
- Preparing handoff for another developer or AI
- Memory Hub needs cleanup or organization
- Generating cross-model context recovery prompts

## Steps

1. Evaluate if content should be saved as a shared memory
2. Classify memory type: user_preference, project_context, decision, issue_fix, api_provider, prompt_pattern, environment
3. Assign importance (1-5):
   - 5: Critical project decisions, core user preferences
   - 4: Important architectural decisions, key constraints
   - 3: Useful context, common issues and fixes
   - 2: Minor notes, temporary observations
   - 1: Ephemeral info that will be stale soon
4. Check for secrets before saving:
   - Redact: API keys (sk-...), Bearer tokens, passwords, secrets, access tokens
   - NEVER save raw API keys to memory
5. Set appropriate status:
   - active: confirmed, useful context
   - pending: auto-generated, needs human review
   - archived: outdated but kept for history
6. Tag with relevant project, provider, model for filtering
7. When generating cross-model context:
   - Select memories based on injection mode (minimal/balanced/full)
   - Format as [Shared Memory Context] block
   - Truncate to stay within token limits
   - Prioritize: project_context > decision > issue_fix > user_preference
8. Periodically review pending memories and archive stale ones

## What to Save

- Project goals and scope decisions
- Technology choices and rationale
- Bug fixes with root causes
- User preferences (UI style, naming conventions, etc.)
- API provider configuration patterns (NOT keys)
- Successful prompt patterns
- Environment setup notes

## What NOT to Save

- API keys, tokens, passwords (MUST redact)
- Temporary error messages (unless recurring pattern)
- Session-specific file paths
- Personal identifiable information
- Short-term debugging notes (unless it reveals a systemic issue)

## Checklist

- [ ] Content is appropriate for long-term memory
- [ ] Type classification is correct
- [ ] Importance level is reasonable
- [ ] Secrets are redacted
- [ ] Tags are meaningful
- [ ] No temporary/ephemeral data saved as active memory

## Completion Criteria

- All memories are properly classified and tagged
- No secrets in stored memories
- Pending memories are reviewed
- Cross-model context prompt is ready to use
- Memory Hub is organized and searchable
