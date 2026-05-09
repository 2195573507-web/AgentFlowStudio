import fs, { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { reserveFreePort } from './free-port.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const browserPath = path.join(root, '.codex-parallel', 'ms-playwright');
const cli = path.join(root, 'node_modules', 'playwright', 'cli.js');

function hasProjectLocalChromium() {
  if (!existsSync(browserPath)) return false;
  return existsSync(path.join(browserPath, '.links')) ||
    fs.readdirSync(browserPath).some((entry) =>
      entry.startsWith('chromium') && existsSync(path.join(browserPath, entry, 'INSTALLATION_COMPLETE')),
    );
}

function run(args, extraEnv = {}) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      ...extraEnv,
      PLAYWRIGHT_BROWSERS_PATH: browserPath,
    },
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Playwright command failed with exit code ${result.status ?? 1}.`);
  }
}

await mkdir(browserPath, { recursive: true });

if (!existsSync(cli)) {
  console.error('Playwright CLI is missing. Run npm install first.');
  process.exit(1);
}

if (!hasProjectLocalChromium()) {
  run(['install', 'chromium']);
}

const reservation = process.env.AGENTFLOW_E2E_PORT
  ? { port: Number(process.env.AGENTFLOW_E2E_PORT), release: async () => {} }
  : await reserveFreePort(5173, 5199);

try {
  const e2ePort = String(reservation.port);
  const e2eBaseUrl = process.env.AGENTFLOW_E2E_BASE_URL || `http://127.0.0.1:${e2ePort}`;

  run(['test', '--config', 'playwright.config.ts'], {
    AGENTFLOW_E2E_PORT: e2ePort,
    AGENTFLOW_E2E_BASE_URL: e2eBaseUrl,
    AGENTFLOW_E2E_REUSE_SERVER: process.env.AGENTFLOW_E2E_REUSE_SERVER || '0',
  });
} finally {
  await reservation.release();
}
