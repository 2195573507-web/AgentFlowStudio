import { defineConfig, devices } from 'playwright/test'

const e2ePort = process.env.AGENTFLOW_E2E_PORT ?? '5173'
const e2eBaseUrl = process.env.AGENTFLOW_E2E_BASE_URL ?? `http://127.0.0.1:${e2ePort}`
const reuseExistingServer = process.env.AGENTFLOW_E2E_REUSE_SERVER === '1'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: '.codex-parallel/playwright-report', open: 'never' }],
  ],
  outputDir: '.codex-parallel/test-results/e2e',
  use: {
    baseURL: e2eBaseUrl,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `node ./node_modules/vite/bin/vite.js --mode web --host 127.0.0.1 --port ${e2ePort} --strictPort`,
    url: e2eBaseUrl,
    reuseExistingServer,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
