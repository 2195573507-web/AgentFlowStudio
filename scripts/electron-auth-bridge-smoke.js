import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const logsDir = path.join(root, '.codex-parallel', 'logs');
const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const electronLogPath = path.join(logsDir, `electron-auth-bridge-${stamp}.log`);
const userDataDir = path.join(root, '.codex-parallel', 'electron-auth-bridge-user-data');
const electronBin = path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe');
const electronMain = path.join(root, 'dist-electron', 'main', 'index.js');

fs.mkdirSync(logsDir, { recursive: true });
fs.mkdirSync(userDataDir, { recursive: true });
fs.writeFileSync(electronLogPath, '', 'utf8');

function append(chunk) {
  fs.appendFileSync(electronLogPath, chunk.toString(), 'utf8');
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('\nAgentFlow Studio - Electron Auth Bridge Smoke\n');

  for (const required of [
    electronBin,
    electronMain,
    path.join(root, 'dist', 'index.html'),
    path.join(root, 'dist-electron', 'main', 'preload.js'),
  ]) {
    if (!fs.existsSync(required)) {
      throw new Error(`Required build file not found: ${required}. Run npm.cmd run build first.`);
    }
  }

  const electron = spawn(electronBin, [electronMain], {
    cwd: root,
    env: {
      ...process.env,
      AGENTFLOW_LOAD_DIST: '1',
      AGENTFLOW_REQUIRE_AUTH_BRIDGE: '1',
      AGENTFLOW_SKIP_DEVTOOLS: '1',
      AGENTFLOW_STARTUP_SMOKE: '1',
      AGENTFLOW_USER_DATA_DIR: userDataDir,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    shell: false,
  });

  electron.stdout.on('data', append);
  electron.stderr.on('data', append);
  electron.on('exit', (code, signal) => append(`\n[exit code=${code} signal=${signal}]\n`));

  const started = Date.now();
  let sawReady = false;
  let sawFailure = false;
  while (Date.now() - started < 45_000) {
    const log = fs.readFileSync(electronLogPath, 'utf8');
    sawReady = log.includes('AGENTFLOW_ELECTRON_READY');
    sawFailure = log.includes('AGENTFLOW_ELECTRON_STARTUP_FAIL');
    if (sawReady || sawFailure) break;
    if (electron.exitCode !== null) break;
    await wait(250);
  }

  if (sawReady && electron.exitCode === null) {
    electron.kill();
    await wait(250);
  } else if (electron.exitCode === null) {
    electron.kill();
    throw new Error('Electron auth bridge smoke timed out.');
  }

  const log = fs.readFileSync(electronLogPath, 'utf8');
  if (!log.includes('AGENTFLOW_ELECTRON_READY')) {
    throw new Error(`Electron did not report ready. See ${electronLogPath}`);
  }
  if (!log.includes('url=file://')) {
    throw new Error(`Electron did not load the built file renderer. See ${electronLogPath}`);
  }
  if (!log.includes('authBridge=true')) {
    throw new Error(`Electron did not expose window.agentflow auth bridge. See ${electronLogPath}`);
  }

  console.log(`PASS Electron loaded built renderer with secure auth bridge. Log: ${electronLogPath}`);
  console.log(`PASS Project-local userData: ${userDataDir}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
