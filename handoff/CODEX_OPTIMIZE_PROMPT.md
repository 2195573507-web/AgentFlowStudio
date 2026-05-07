# Codex Optimization Prompt — AgentFlow Studio

---

**INSTRUCTIONS FOR CODEX: Read this entire prompt before taking any action.**

---

## Your Task

You are taking over the AgentFlow Studio project from Claude Code. The project is fully functional but needs optimization, polish, and testing improvements. Your job is to refine and enhance — NOT rebuild.

## Pre-Work Checklist (READ FIRST)

Before writing ANY code:

1. Read `AGENTS.md` at the project root
2. Read ALL 8 files in the `handoff/` directory:
   - `CODEX_HANDOFF.md` — Project overview and conventions
   - `PROJECT_MEMORY.md` — Long-term project memory and decisions
   - `ARCHITECTURE.md` — Architecture and data flow documentation
   - `FILE_MAP.md` — Map of every file and its purpose
   - `TASK_STATUS.md` — What's done, what's not
   - `TEST_REPORT.md` — Test results and known issues
   - `CURRENT_CONTEXT_FOR_ANY_MODEL.md` — Quick context recovery
3. Read `README.md` and `package.json`
4. Explore the source code structure:
   - `src/main/` (8 files) — Electron main process
   - `src/renderer/routes/` (10 files) — Page components
   - `src/renderer/components/` (15 files) — UI components
   - `src/renderer/lib/` (12 files) — Logic modules
   - `tests/unit/` (9 files) — Unit tests
5. Run these commands and note the output:
   - `npm install`
   - `npm run test`
   - `npm run build`

## Core Rules — DO NOT BREAK THESE

### Security (NEVER change these)
- `contextIsolation: true` in Electron — NEVER set to false
- `nodeIntegration: false` — NEVER set to true
- All native operations MUST go through preload.ts → IPC → main process
- Never expose `child_process`, raw `fs`, or arbitrary command execution via IPC
- Secret redaction must ALWAYS run before saving or exporting memories
- API keys must NEVER be written to memory files

### Architecture (DO NOT change these)
- Do NOT change the storage strategy (JSON files) without implementing the StorageAdapter interface
- Do NOT remove the Shared Memory Hub
- Do NOT remove the handoff/ directory
- Do NOT change the UI framework (stay with React + Tailwind CSS)
- Do NOT add cloud dependencies (Firebase, Supabase, etc.) to core features
- Do NOT remove any pages or major features

### Code Quality
- Keep TypeScript strict mode enabled
- Keep all existing type definitions
- Follow the existing naming conventions (camelCase, PascalCase for components)
- Do NOT add unnecessary comments or docstrings

## What You SHOULD Do

### Priority 1: UI Polish & Consistency
The app has a Liquid Glass design. Polish it:

1. **Audit all 10 pages** for visual consistency:
   - Check spacing is consistent (use the same padding/margin patterns)
   - Verify dark mode works correctly on every page
   - Ensure transitions and animations are smooth
   - Check that all GlassCards use the same border-radius and shadow

2. **Improve empty states**: Every page should have a beautiful, informative empty state (not just blank space)

3. **Loading skeletons**: Add skeleton loaders on pages that fetch data (Dashboard, Projects, SharedMemoryHub)

4. **Responsive tweaks**: Ensure the UI works well at the minimum window size (1024x680)

5. **Micro-interactions**: Add subtle hover effects, button press feedback, transition polish

### Priority 2: Test Coverage
The unit tests are written but need expansion:

1. **Run all existing tests**: `npm run test` — fix any failures first
2. **Add edge case tests** to existing suites:
   - planner.test.ts: Test with empty idea, very long idea, special characters
   - templates.test.ts: Test all 13 templates with real variable values
   - logAnalyzer.test.ts: Test boundary cases (very long logs, mixed errors)
   - safetyRules.test.ts: Test edge cases (encoded commands, multiline scripts)
3. **Add integration tests**: Test that memoryStore + memoryRetriever + memoryInjection work together end-to-end
4. **Get E2E tests running**: Install Playwright browsers and verify the E2E tests pass

### Priority 3: Build & Packaging
1. **Fix icon generation**: The icon.png and icon.ico are SVG copies. Generate real raster icons:
   - Install `sharp` as devDependency
   - Update `scripts/create-icon.js` to generate proper 512x512 PNG
   - Convert PNG to ICO (use `png-to-ico` or similar)
2. **Test the full build pipeline**: `npm run build` must pass cleanly
3. **Test electron-builder**: `npm run dist` should produce a working NSIS installer
4. **Reduce bundle size**: Check what's being included unnecessarily

### Priority 4: Performance
1. **React optimization**: Add `React.memo` to heavy components (TaskBoard, Charts, MemoryHub)
2. **Virtual list**: If memory list gets long (>100 items), consider virtual scrolling
3. **Lazy loading**: Verify all page components are lazy-loaded (they should be in App.tsx)
4. **Chart optimization**: ECharts instances should be properly disposed on unmount (verify cleanup)

### Priority 5: Accessibility
1. Add `aria-label` to interactive elements
2. Ensure keyboard navigation works (Tab order, Enter/Space to activate)
3. Add focus visible styles
4. Ensure sufficient color contrast in both light and dark modes

## What to Do After Changes

After each significant change, run:

```bash
npm run typecheck    # Must pass
npm run test         # Must not regress
npm run build        # Must pass
```

After all changes:

```bash
npm run verify       # Check all files present
npm run shortcut     # Create desktop shortcut
npm run dist         # Package for distribution (if possible)
```

Update these files with your results:
- `handoff/TEST_REPORT.md` — update with actual test results
- `handoff/TASK_STATUS.md` — mark completed tasks
- Create `handoff/CODEX_OPTIMIZATION_REPORT.md` — summarize what you changed and why

## Specific Optimizations to Consider

### Dashboard
- Add loading skeletons for initial data fetch
- Ensure demo data is displayed when no real data exists
- Make the quick action buttons more visually prominent

### Project Detail
- Add a "Regenerate" button for each section
- Improve the task board visual hierarchy
- Add copy buttons to ALL generated prompts

### Prompt Lab
- Add a "Recently Used" templates section
- Show character/token count on generated prompts
- Add template search/filter

### Log Analyzer
- Add drag-and-drop for log files
- Show a diff view for before/after fixes
- Add batch analysis for multiple log files

### Safety Box
- Add a "Safe Command Library" of pre-vetted commands
- Show risk history statistics
- Add a quick-check mode for typing commands

### Shared Memory Hub
- Add bulk operations (select multiple, batch archive/delete)
- Show memory usage statistics
- Add memory linking (link related memories together)
- Improve the import preview (show what will be imported before confirming)

### Git Timeline
- Add branch switching
- Show diff stats (insertions/deletions)
- Add date range filtering

### Settings
- Add import/export of all settings
- Add a "Check for Updates" placeholder
- Improve provider configuration UX (test connection button)

### General
- Add keyboard shortcuts (Ctrl+N new project, Ctrl+P Prompt Lab, etc.)
- Add a notification system for background operations
- Improve error handling and user-facing error messages

## Expected Output from Codex

When you complete your optimization pass, create:

1. `handoff/CODEX_OPTIMIZATION_REPORT.md` containing:
   - What you changed and why
   - What you decided NOT to change and why
   - Performance improvements (with numbers if possible)
   - Test results (all suites, with pass/fail counts)
   - Build results
   - Known remaining issues
   - Recommendations for the next developer

2. Update `handoff/TEST_REPORT.md` with actual test output

3. Update `handoff/TASK_STATUS.md` to reflect current completion state

4. Update `CHANGELOG.md` with your changes

## Reminder

> This project is a LOCAL-FIRST desktop application. It must work without internet access. All core features are offline. The Shared Memory Hub is the core differentiator. Do not compromise it.

Good luck. The project is solid — make it shine.
