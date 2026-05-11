# Lightweight UI Refactor Plan

## Goal
Refactor AgentFlow Studio toward a simple, clean, compact desktop-tool UI inspired by CCS / cc-switch style principles, without Liquid Glass, glassmorphism, heavy blur, excessive gradients, or complex animation.

## Constraints
- Work only inside `D:\AgentFlowStudio`.
- Preserve Electron, React, IPC, Auth, RBAC, Workflow, MCP, Git, and Storage behavior.
- Verify app, tests, desktop shortcut/launch entry, docs, commit, and push.

## Phases
| Phase | Status | Notes |
|---|---|---|
| 1. Audit repository and current UI | complete | Initial git state, structure, docs, visual issues, shortcut and tests reviewed. |
| 2. Study CCS / cc-switch UI patterns | complete | Extracted principles only: compact control surface, active context, clear config/status paths. |
| 3. Define design tokens | complete | Flat surface, border, text, accent, status, spacing, radius, and component tokens defined. |
| 4. Refactor layout/components/pages | complete | Main shell, shared primitives, key routes, static fallback, tests, and icon style migrated. |
| 5. Desktop launch and shortcut validation | in_progress | Build done; shortcut relink and COM inspection still pending after final validation. |
| 6. Test and visual regression pass | in_progress | Typecheck, lint, unit, build, and smoke passed; E2E/static/Electron checks pending. |
| 7. Documentation, git commit, push | in_progress | UI design system doc, progress, README, and test report being updated. |

## Decisions
- Default style direction: restrained desktop configuration tool, medium density, flat surfaces, fine borders, one main accent.
- No Liquid Glass as default UI language.

## Errors Encountered
| Error | Attempt | Resolution |
|---|---|---|
| `rg --files` failed with Access denied | Repository enumeration | Used PowerShell `Get-ChildItem` and `Select-String`. |
| `ui-ux-pro-max` Python search failed due missing `encodings` | Design-system script | Used skill guidance plus manual synthesis from audited app and public CC Switch sources. |
