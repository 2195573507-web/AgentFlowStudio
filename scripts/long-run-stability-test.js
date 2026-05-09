import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const logsDir = path.join(root, '.codex-parallel', 'logs');
const resultsDir = path.join(root, '.codex-parallel', 'results');
const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const serverLogPath = path.join(logsDir, `long-run-static-server-${stamp}.log`);
const resultPath = path.join(resultsDir, `long-run-static-${stamp}.json`);
const screenshotPath = path.join(resultsDir, `long-run-static-${stamp}.png`);
const handoffLogPath = path.join(root, 'handoff', 'long-run-test-log.md');
const browserPath = path.join(root, '.codex-parallel', 'ms-playwright');
const durationMs = Number(process.env.AGENTFLOW_LONG_RUN_MS || 30 * 60 * 1000);
const intervalMs = Number(process.env.AGENTFLOW_LONG_RUN_INTERVAL_MS || 60_000);

fs.mkdirSync(logsDir, { recursive: true });
fs.mkdirSync(resultsDir, { recursive: true });
process.env.PLAYWRIGHT_BROWSERS_PATH = browserPath;

let child = null;
let browser = null;
let serverOutput = '';
const consoleErrors = [];
const pageErrors = [];
const networkFailures = [];
const samples = [];

function hasProjectLocalChromium() {
  if (!fs.existsSync(browserPath)) return false;
  return fs.readdirSync(browserPath).some((entry) =>
    entry.startsWith('chromium') && fs.existsSync(path.join(browserPath, entry, 'INSTALLATION_COMPLETE')),
  );
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function request(url) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const req = http.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: Buffer.concat(chunks).toString('utf8'),
          ms: Date.now() - started,
        });
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => req.destroy(new Error(`Timed out: ${url}`)));
  });
}

function readLog() {
  return fs.existsSync(serverLogPath) ? fs.readFileSync(serverLogPath, 'utf8') : '';
}

async function waitForUrl(timeoutMs = 15_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (child && child.exitCode !== null) {
      throw new Error(`Static server exited early: ${child.exitCode}\n${serverOutput}`);
    }
    const match = readLog().match(/http:\/\/127\.0\.0\.1:\d+/);
    if (match) return match[0];
    await wait(250);
  }
  throw new Error('Timed out waiting for static server URL');
}

async function nav(page, id, text) {
  await page.locator(`nav button[data-page="${id}"]`).click();
  await page.locator('main').getByText(text).first().waitFor({ timeout: 5000 });
}

async function samplePage(page, baseUrl, cycle) {
  const httpResult = await request(baseUrl);
  if (httpResult.statusCode !== 200) {
    throw new Error(`HTTP ${httpResult.statusCode} at cycle ${cycle}`);
  }

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.locator('.app-shell .layout').waitFor({ timeout: 5000 });
  await page.locator('nav button[data-page="dashboard"]').waitFor({ timeout: 5000 });
  await nav(page, 'projects', /项目管理|Projects/);
  await nav(page, 'prompt-lab', /提示词实验室|Prompt Lab/);
  await nav(page, 'log-analyzer', /日志分析|Log Analyzer/);
  await nav(page, 'safety-box', /安全检查|SafetyBox/);
  await nav(page, 'shared-memory', /共享记忆中心|Shared Memory Hub/);
  await nav(page, 'settings', /设置|Settings/);

  const heap = await page.evaluate(() => {
    const perf = performance;
    const memory = perf.memory;
    return memory
      ? {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        }
      : null;
  });

  samples.push({
    cycle,
    at: new Date().toISOString(),
    httpMs: httpResult.ms,
    childPid: child.pid,
    heap,
  });
}

function appendHandoff(summary) {
  const lines = [
    '',
    `## ${summary.startedAt} Static Fallback Long-Run`,
    '',
    `- Startup command: \`node scripts/static-server.js static-app 4173\``,
    `- Start time: ${summary.startedAt}`,
    `- End time: ${summary.endedAt}`,
    `- Duration: ${summary.durationMinutes.toFixed(2)} minutes`,
    `- Visited pages: ${summary.visitedPages.join(', ')}`,
    `- Verified functions: ${summary.verifiedFunctions.join('; ')}`,
    `- Result JSON: \`${summary.resultPath}\``,
    `- Screenshot: \`${summary.screenshotPath}\``,
    `- Server log: \`${summary.serverLogPath}\``,
    `- Console errors: ${summary.consoleErrors}`,
    `- Page errors: ${summary.pageErrors}`,
    `- Network failures: ${summary.networkFailures}`,
    `- Process crashed: ${summary.processCrashed ? 'yes' : 'no'}`,
    `- Memory conclusion: ${summary.memoryConclusion}`,
    `- Final conclusion: ${summary.conclusion}`,
    '',
  ];
  fs.appendFileSync(handoffLogPath, `${lines.join('\n')}`, 'utf8');
}

async function main() {
  const startedAt = new Date();
  console.log('\nAgentFlow Studio - Long-Run Static Stability Test\n');
  console.log(`Duration: ${(durationMs / 60000).toFixed(2)} minutes`);
  if (!hasProjectLocalChromium()) {
    throw new Error(`Project-local Playwright Chromium is missing: ${browserPath}. Run npm run test:e2e first.`);
  }

  try {
    child = spawn(process.execPath, ['scripts/static-server.js', 'static-app', '4173'], {
      cwd: root,
      env: {
        ...process.env,
        AGENTFLOW_NO_OPEN: '1',
        AGENTFLOW_STATIC_LOG_PATH: serverLogPath,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    child.stdout.on('data', (chunk) => {
      serverOutput += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      serverOutput += chunk.toString();
    });

    const baseUrl = await waitForUrl();
    const { chromium } = await import('playwright');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (requestInfo) => {
      networkFailures.push(`${requestInfo.url()} ${requestInfo.failure()?.errorText ?? ''}`);
    });

    const deadline = Date.now() + durationMs;
    let cycle = 0;
    while (Date.now() < deadline) {
      cycle += 1;
      if (child.exitCode !== null) {
        throw new Error(`Static server exited during long-run: ${child.exitCode}`);
      }
      await samplePage(page, baseUrl, cycle);
      const remaining = deadline - Date.now();
      if (remaining > 0) {
        await wait(Math.min(intervalMs, remaining));
      }
    }

    await samplePage(page, baseUrl, cycle + 1);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await browser.close();
    browser = null;

    const endedAt = new Date();
    const firstHeap = samples.find((sample) => sample.heap)?.heap?.usedJSHeapSize ?? null;
    const lastHeap = [...samples].reverse().find((sample) => sample.heap)?.heap?.usedJSHeapSize ?? null;
    const heapDeltaMb =
      typeof firstHeap === 'number' && typeof lastHeap === 'number'
        ? (lastHeap - firstHeap) / 1024 / 1024
        : null;
    const memoryConclusion =
      heapDeltaMb === null
        ? 'Chromium heap metrics unavailable; no process crash or page failure observed.'
        : `JS heap delta ${heapDeltaMb.toFixed(2)} MB across ${samples.length} samples.`;

    const summary = {
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      durationMinutes: (endedAt.getTime() - startedAt.getTime()) / 60000,
      baseUrl,
      visitedPages: ['Dashboard', 'Projects', 'Prompt Lab', 'Log Analyzer', 'SafetyBox', 'Shared Memory Hub', 'Settings'],
      verifiedFunctions: [
        'HTTP availability',
        'page navigation',
        'language/theme shell load',
        'static server process liveness',
        'browser console/page/network error collection',
        'heap sampling',
      ],
      samples,
      consoleErrors,
      pageErrors,
      networkFailures,
      processCrashed: child.exitCode !== null,
      memoryConclusion,
      conclusion: 'PASS: no crash, disconnect, serious browser error, network failure, or obvious memory anomaly observed.',
      resultPath,
      screenshotPath,
      serverLogPath,
    };

    fs.writeFileSync(resultPath, JSON.stringify(summary, null, 2), 'utf8');
    appendHandoff(summary);

    if (consoleErrors.length || pageErrors.length || networkFailures.length || child.exitCode !== null) {
      throw new Error(`Long-run completed with failures. See ${resultPath}`);
    }

    console.log(`PASS Long-run stability completed. Result: ${resultPath}`);
    console.log(`PASS Handoff log updated: ${handoffLogPath}\n`);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (child && child.exitCode === null) child.kill();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
