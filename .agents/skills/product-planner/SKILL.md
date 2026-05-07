---
name: product-planner
description: Generate PRD, architecture, task breakdown, test plans, and acceptance criteria from project ideas. Use when starting a new project or feature.
---

## Trigger

- User provides a project idea or feature description
- User asks for PRD, architecture design, or task breakdown
- User says "plan this project" or "design the architecture"

## Steps

1. Extract project idea, platform, tech stack, and UI style from user input
2. Generate a concise project summary (2-3 sentences)
3. Write a PRD section covering: problem statement, target users, core features, success metrics
4. Design the technical architecture: frontend, backend, database, deployment
5. Generate a realistic directory structure
6. Break down into 5-10 specific tasks with role, title, description, input, output, acceptance criteria, and priority
7. Write a test plan covering unit, integration, and E2E tests
8. Define acceptance criteria for the overall project
9. Generate ready-to-use prompts for Claude Code, Codex, and Cursor
10. Inject shared memory context if available

## Checklist

- [ ] Project idea is clearly captured
- [ ] PRD covers problem, users, features, metrics
- [ ] Architecture matches platform and tech stack
- [ ] Directory structure is realistic and complete
- [ ] Tasks are specific and actionable
- [ ] Each task has clear acceptance criteria
- [ ] Test plan covers all critical paths
- [ ] Dev prompts include necessary context

## Completion Criteria

- All sections are non-empty and coherent
- Generated prompts are ready to copy-paste into AI coding tools
- Shared memory context is injected when available
