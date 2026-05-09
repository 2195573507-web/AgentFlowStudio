import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reserveFreePort } from './free-port.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const logsDir = path.join(root, '.codex-parallel', 'logs');
const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const viteLogPath = path.join(logsDir, `electron-smoke-vite-${stamp}.log`);
const electronLogPath = path.join(logsDir, `electron-smoke-main-${stamp}.log`);
const userDataDir = path.join(root, '.codex-parallel', 'electron-user-data-smoke');
const electronBin = path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe');
const electronMain = path.join(root, 'dist-electron', 'main', 'index.js');
const viteCli = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');

fs.mkdirSync(logsDir, { recursive: true });
fs.mkdirSync(userDataDir, { recursive: true });

function append(file, chunk) {
  fs.appendFileSync(file, chunk.toString(), 'utf8');
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpOk(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      res.on('end', () => resolve(res.statusCode === 200));
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForDevServer(url, timeoutMs = 30_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await httpOk(url)) return;
    await wait(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function spawnLogged(command, args, logPath, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    shell: false,
  });
  child.stdout.on('data', (chunk) => append(logPath, chunk));
  child.stderr.on('data', (chunk) => append(logPath, chunk));
  child.on('exit', (code, signal) => append(logPath, `\n[exit code=${code} signal=${signal}]\n`));
  return child;
}

async function main() {
  console.log('\nAgentFlow Studio - Electron Startup Smoke\n');

  if (!fs.existsSync(electronBin)) {
    throw new Error(`Electron binary not found: ${electronBin}`);
  }
  if (!fs.existsSync(electronMain)) {
    throw new Error(`Electron main build not found: ${electronMain}. Run npm run build first.`);
  }
  if (!fs.existsSync(viteCli)) {
    throw new Error(`Vite CLI not found: ${viteCli}. Run npm install first.`);
  }

  fs.writeFileSync(viteLogPath, '', 'utf8');
  fs.writeFileSync(electronLogPath, '', 'utf8');

  const reservation = process.env.AGENTFLOW_ELECTRON_SMOKE_PORT
    ? { port: Number(process.env.AGENTFLOW_ELECTRON_SMOKE_PORT), release: async () => {} }
    : await reserveFreePort(5200, 5229);
  const devPort = String(reservation.port);
  const devServerUrl = `http://127.0.0.1:${devPort}`;

  const vite = spawnLogged(process.execPath, [viteCli, '--mode', 'web', '--host', '127.0.0.1', '--port', devPort, '--strictPort'], viteLogPath, {
    BROWSER: 'none',
  });

  try {
    await waitForDevServer(devServerUrl);

    const electron = spawnLogged(electronBin, [electronMain], electronLogPath, {
      VITE_DEV_SERVER_URL: devServerUrl,
      AGENTFLOW_STARTUP_SMOKE: '1',
      AGENTFLOW_SKIP_DEVTOOLS: '1',
      AGENTFLOW_USER_DATA_DIR: userDataDir,
    });

    const started = Date.now();
    while (Date.now() - started < 45_000) {
      if (electron.exitCode !== null) break;
      const log = fs.readFileSync(electronLogPath, 'utf8');
      if (log.includes('AGENTFLOW_ELECTRON_READY')) {
        await wait(1000);
        break;
      }
      if (log.includes('AGENTFLOW_ELECTRON_STARTUP_FAIL')) {
        break;
      }
      await wait(250);
    }

    if (electron.exitCode === null) {
      electron.kill();
      throw new Error('Electron startup smoke timed out before ready marker.');
    }

    const log = fs.readFileSync(electronLogPath, 'utf8');
    if (!log.includes('AGENTFLOW_ELECTRON_READY')) {
      throw new Error(`Electron did not report ready. See ${electronLogPath}`);
    }
    if (!log.includes(userDataDir)) {
      throw new Error(`Electron did not use project-local userData. See ${electronLogPath}`);
    }

    console.log(`PASS Electron ready marker captured. Log: ${electronLogPath}`);
    console.log(`PASS Dev server URL: ${devServerUrl}`);
    console.log(`PASS Project-local userData: ${userDataDir}`);
    console.log(`PASS Vite log: ${viteLogPath}\n`);
  } finally {
    if (vite.exitCode === null) {
      vite.kill();
    }
    await reservation.release();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
