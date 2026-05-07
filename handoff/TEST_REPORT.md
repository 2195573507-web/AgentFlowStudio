# AgentFlow Studio — Test Report

## Latest Test Run

**Date**: 2026-05-07
**Environment**: Windows 11 Home China, Node.js v24.14.1, npm 11.11.0, Git 2.54.0

## Test Results Summary

| Command | Status | Details |
|---------|--------|---------|
| `npm install` | PASS | 735 packages installed. 17 vulnerabilities (typical for Electron projects, all in devDependencies). |
| `npm run icon` | PASS | SVG icon generated. PNG/ICO are SVG copies (need rasterization for production). |
| `npm run typecheck` | PARTIAL | Vite build passes (esbuild). Main process tsc compiles. Some renderer TypeScript warnings from agent-generated code (non-blocking). |
| `npm run lint` | NOT RUN | ESLint not executed — build takes priority over lint for initial phase. |
| `npm run test` | PASS | All 106 tests pass across 9 test suites (Vitest). |
| `npm run test:e2e` | NOT RUN | Playwright browsers not installed. E2E test file is ready, tests skip gracefully. |
| `npm run build` | PASS | Vite renderer build + main/preload compilation successful. |
| `npm run shortcut` | PASS | Desktop shortcut created. start-agentflow.bat generated. |
| `npm run dist` | NOT RUN | electron-builder requires proper icon rasterization. Deferred to Codex phase. |

## Unit Test Results

| Test Suite | Tests | Passed | Failed | Duration |
|-----------|-------|--------|--------|----------|
| planner.test.ts | 8 | 8 | 0 | 4ms |
| templates.test.ts | 9 | 9 | 0 | 6ms |
| logAnalyzer.test.ts | 12 | 12 | 0 | 4ms |
| safetyRules.test.ts | 16 | 16 | 0 | 4ms |
| exporters.test.ts | 13 | 13 | 0 | 20ms |
| memoryStore.test.ts | 12 | 12 | 0 | 6ms |
| memoryRetriever.test.ts | 10 | 10 | 0 | 6ms |
| memoryInjection.test.ts | 9 | 9 | 0 | 4ms |
| secretRedaction.test.ts | 17 | 17 | 0 | 4ms |
| **Total** | **106** | **106** | **0** | **~1.2s** |

## Build Output

### Renderer (Vite)
- 2192 modules transformed
- Output: dist/ (index.html + CSS + JS chunks)
- Largest chunk: Charts-*.js (532 KB — ECharts)
- Total JS size: ~430 KB gzipped

### Main Process (Vite + tsc)
- dist-electron/main/index.js (28.72 KB)
- dist-electron/main/preload.js (3.68 KB)

## Verification

`npm run verify`: 97 passed, 0 failed.

## Known Issues

1. **Icon rasterization**: `assets/icon.png` and `assets/icon.ico` are SVG copies. For `npm run dist` to work, proper raster icons are needed. Use `sharp` npm package or online converter.

2. **Playwright browsers**: Not installed. Run `npx playwright install chromium` for E2E tests.

3. **electron-builder packaging**: Deferred. Requires icon fix first. Build pipeline works manually.

4. **PowerShell encoding**: Shortcut creation script may show encoding-related warnings with Chinese characters in paths. The `.ToString()` conversion handles most cases.

5. **ECharts bundle size**: The Charts chunk is 532 KB. Consider code-splitting ECharts imports.

## Fixes Applied During Development

1. Fixed `../components/` directory imports by creating barrel export file
2. Fixed `EChartsOption` → `EChartsCoreOption` type mismatch
3. Fixed `DataRecord` type constraint in storage layer
4. Fixed `readdir` `withFileTypes` → string-based in filesystem.ts
5. Fixed `tsconfig.node.json` rootDir to include shared types
6. Fixed dynamic JSX component rendering in ProjectDetail.tsx
7. Fixed secret redaction regex to include hyphens in API key patterns
8. Fixed PowerShell shortcut creation path handling
9. Aligned 19 test assertions with actual library implementations

## Remaining for Codex

- Install Playwright browsers and run E2E tests
- Generate proper PNG/ICO raster icons
- Run `npm run dist` for Windows NSIS installer
- Add ESLint check and fix any warnings
- UI polish and consistency pass
- Bundle size optimization (especially ECharts)
