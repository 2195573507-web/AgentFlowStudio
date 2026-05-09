import fs, { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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

function run(args) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: browserPath,
    },
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
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

run(['test', '--config', 'playwright.config.ts']);
