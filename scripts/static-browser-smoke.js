import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const logsDir = path.join(root, '.codex-parallel', 'logs')
const artifactsDir = path.join(root, '.codex-parallel', 'results')
const browserPath = path.join(root, '.codex-parallel', 'ms-playwright')
const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
const serverLogPath = path.join(logsDir, `static-browser-server-${stamp}.log`)
const resultPath = path.join(artifactsDir, `static-browser-smoke-${stamp}.json`)
const screenshotPath = path.join(artifactsDir, `static-browser-smoke-${stamp}.png`)

fs.mkdirSync(logsDir, { recursive: true })
fs.mkdirSync(artifactsDir, { recursive: true })
process.env.PLAYWRIGHT_BROWSERS_PATH = browserPath

let child = null
let browser = null
let processOutput = ''
const consoleEntries = []
const pageErrors = []
const networkFailures = []
const checks = []

function record(name, passed, details = '') {
  checks.push({ name, passed, details })
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}${details ? ` - ${details}` : ''}`)
}

function fail(message) {
  record(message, false)
  throw new Error(message)
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function request(url) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now()
    const req = http.get(url, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: Buffer.concat(chunks).toString('utf8'),
          ms: Date.now() - startedAt,
        })
      })
    })
    req.on('error', reject)
    req.setTimeout(5000, () => {
      req.destroy(new Error(`Request timed out: ${url}`))
    })
  })
}

function readLog() {
  return fs.existsSync(serverLogPath) ? fs.readFileSync(serverLogPath, 'utf8') : ''
}

async function waitForUrl(timeoutMs = 12000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    if (child && child.exitCode !== null) {
      throw new Error(`Static server exited early: ${child.exitCode}\n${processOutput}`)
    }
    const output = readLog()
    const markerMatch = output.match(/AGENTFLOW_STATIC_LAUNCH_URL=(http:\/\/127\.0\.0\.1:\d+\/\?token=[^\s]+)/)
    if (markerMatch) return markerMatch[1]
    await wait(250)
  }
  throw new Error('Timed out waiting for static server URL')
}

async function clickNav(page, pageId, expectedText) {
  await page.locator(`nav button[data-page="${pageId}"]`).click()
  await page.waitForTimeout(150)
  await page.locator('main').getByText(expectedText).first().waitFor({ timeout: 3000 })
  const activePage = await page.evaluate(() => JSON.parse(localStorage.getItem('agentflow.static.v1') || '{}').activePage)
  record(`navigate/${pageId}`, activePage === pageId, `activePage=${activePage}`)
}

async function main() {
  console.log('\nAgentFlow Studio - Static Browser Smoke\n')

  child = spawn(process.execPath, ['scripts/static-server.js', 'static-app', '4173'], {
    cwd: root,
    env: {
      ...process.env,
      AGENTFLOW_NO_OPEN: '1',
      AGENTFLOW_STATIC_LOG_PATH: serverLogPath,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })

  child.stdout.on('data', (chunk) => {
    processOutput += chunk.toString()
  })
  child.stderr.on('data', (chunk) => {
    processOutput += chunk.toString()
  })

  const baseUrl = await waitForUrl()
  record('static server URL', true, baseUrl.replace(/\?token=.*/, '?token=<redacted>'))

  const home = await request(baseUrl)
  record('HTTP 200', home.statusCode === 200, `${home.statusCode} in ${home.ms}ms`)
  if (home.statusCode !== 200) fail('Static homepage did not return HTTP 200')

  const { chromium } = await import('playwright')
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 760 },
    colorScheme: 'light',
  })
  const page = await context.newPage()

  page.on('console', (msg) => {
    consoleEntries.push({ type: msg.type(), text: msg.text() })
  })
  page.on('pageerror', (error) => {
    pageErrors.push(error.message)
  })
  page.on('requestfailed', (requestInfo) => {
    networkFailures.push({
      url: requestInfo.url(),
      error: requestInfo.failure()?.errorText || '',
    })
  })

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    localStorage.clear()
  })
  await page.reload({ waitUntil: 'networkidle' })

  await page.getByRole('heading', { name: '仪表盘' }).waitFor({ timeout: 5000 })
  record('dashboard loads in Chinese', true)
  record('document title', (await page.title()).includes('AgentFlow Studio'), await page.title())

  const panelBg = await page.locator('.panel').first().evaluate((el) => getComputedStyle(el).backdropFilter)
  record('Liquid Glass backdrop exists', panelBg.includes('blur'), panelBg)
  const panelShadow = await page.locator('.panel').first().evaluate((el) => getComputedStyle(el).boxShadow)
  record('Liquid Glass layered shadow exists', panelShadow !== 'none' && panelShadow.length > 10, panelShadow)
  await page.getByText('下一步').first().waitFor({ timeout: 3000 })
  record('dashboard next-step CTA exists', true)
  for (const label of ['Idea', 'Plan', 'Tasks', 'Prompt', 'Safety', 'Logs', 'Memory', 'Handoff']) {
    await page.getByText(label, { exact: true }).first().waitFor({ timeout: 3000 })
  }
  record('dashboard lifecycle rail exists', true)

  await page.locator('[data-action="toggle-language"]').click()
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ timeout: 3000 })
  const storedLanguage = await page.evaluate(() => localStorage.getItem('agentflow.language'))
  record('language persists as English', storedLanguage === 'en', `agentflow.language=${storedLanguage}`)

  await page.locator('[data-action="cycle-theme"]').click()
  const storedTheme = await page.evaluate(() => localStorage.getItem('agentflow.theme'))
  const datasetTheme = await page.evaluate(() => document.documentElement.dataset.theme)
  record('theme cycles and persists', storedTheme === 'light', `stored=${storedTheme}, resolved=${datasetTheme}`)

  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ timeout: 3000 })
  const languageAfterReload = await page.evaluate(() => localStorage.getItem('agentflow.language'))
  const themeAfterReload = await page.evaluate(() => localStorage.getItem('agentflow.theme'))
  record('preferences survive reload', languageAfterReload === 'en' && themeAfterReload === 'light', `${languageAfterReload}/${themeAfterReload}`)

  await clickNav(page, 'projects', 'Projects')
  await page.locator('input[name="name"]').fill('Browser Smoke Project')
  await page.locator('textarea[name="idea"]').fill('Verify beginner flow and stable static startup')
  await page.locator('form[data-form="project"] button[type="submit"]').click()
  await page.getByRole('heading', { name: 'Project Detail' }).waitFor({ timeout: 3000 })
  const createdProjectName = await page.evaluate(() => JSON.parse(localStorage.getItem('agentflow.static.v1') || '{}').projects?.[0]?.name)
  record('project create flow', createdProjectName === 'Browser Smoke Project', createdProjectName)
  await page.locator('input[name="runTool"]').fill('Codex Browser Smoke')
  await page.locator('select[name="runStatus"]').selectOption('success')
  await page.locator('input[name="runSummary"]').fill('Saved a local-only Agent execution record')
  await page.locator('textarea[name="runLog"]').fill('Static browser smoke validated the run panel.')
  await page.locator('form[data-form="agent-run"] button[type="submit"]').click()
  await page.getByRole('heading', { name: 'Codex Browser Smoke' }).waitFor({ timeout: 3000 })
  const runState = await page.evaluate(() => JSON.parse(localStorage.getItem('agentflow.static.v1') || '{}').projects?.[0]?.agentRuns?.[0])
  record('agent run record flow', runState?.tool === 'Codex Browser Smoke' && runState?.status === 'success', JSON.stringify(runState))

  await clickNav(page, 'prompt-lab', 'Prompt Lab')
  await page.locator('input[name="project"]').fill('Browser Smoke Project')
  await page.locator('textarea[name="task"]').fill('Generate a beginner checklist with sk-test-secret1234567890 inside')
  await page.locator('select[name="memoryMode"]').selectOption('balanced')
  await page.locator('form[data-form="prompt"] button[type="submit"]').click()
  await page.locator('.output').first().waitFor({ timeout: 3000 })
  const promptOutput = await page.locator('.output').first().innerText()
  record('prompt includes shared memory context', promptOutput.includes('[Shared Memory Context]'))
  record('prompt output redacts secrets', !promptOutput.includes('sk-test-secret1234567890') && promptOutput.includes('[REDACTED]'))

  await clickNav(page, 'log-analyzer', 'Log Analyzer')
  await page.locator('textarea[name="logText"]').fill('Error: Cannot find module vite')
  await page.locator('form[data-form="log"] button[type="submit"]').click()
  await page.locator('.output').first().waitFor({ timeout: 3000 })
  record('log analyzer produces output', (await page.locator('.output').first().innerText()).length > 20)

  await clickNav(page, 'safety-box', 'SafetyBox')
  await page.locator('textarea[name="command"]').fill('Remove-Item -Recurse C:\\Users')
  await page.locator('form[data-form="risk"] button[type="submit"]').click()
  await page.locator('.risk-pill').first().waitFor({ timeout: 3000 })
  record('safety check flags risky command', /High|Critical|高|严重/.test(await page.locator('.risk-pill').first().innerText()))

  await clickNav(page, 'shared-memory', 'Shared Memory Hub')
  await page.locator('input[name="title"]').fill('Browser secret memory')
  await page.locator('textarea[name="content"]').fill('api_key=browser-secret-value')
  await page.locator('form[data-form="memory"] button[type="submit"]').click()
  await page.getByRole('heading', { name: 'Browser secret memory' }).waitFor({ timeout: 3000 })
  const stateText = await page.evaluate(() => localStorage.getItem('agentflow.static.v1') || '')
  record('memory save redacts secrets in storage', !stateText.includes('browser-secret-value') && stateText.includes('[REDACTED]'))

  await clickNav(page, 'skills', 'Skills')
  await clickNav(page, 'git-timeline', 'Git Timeline')
  await clickNav(page, 'settings', 'Settings')
  await page.locator('input[name="apiKey"]').fill('sk-settings-secret1234567890')
  await page.locator('form[data-form="settings"] button[type="submit"]').click()
  await page.waitForTimeout(200)
  const settingsState = await page.evaluate(() => localStorage.getItem('agentflow.static.v1') || '')
  record('settings storage redacts api key', !settingsState.includes('sk-settings-secret1234567890') && settingsState.includes('[REDACTED]'))

  await page.setViewportSize({ width: 1024, height: 680 })
  await page.screenshot({ path: screenshotPath, fullPage: true })
  const overlaps = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth
    const viewportHeight = document.documentElement.clientHeight
    return Array.from(document.querySelectorAll('button, input, textarea, select, .panel, .item-card'))
      .map((el) => {
        const rect = el.getBoundingClientRect()
        return {
          tag: el.tagName,
          text: (el.textContent || el.getAttribute('name') || '').trim().slice(0, 60),
          bad:
            rect.width <= 0 ||
            rect.height <= 0 ||
            rect.left < -2 ||
            rect.right > viewportWidth + 2 ||
            rect.top > viewportHeight * 3,
        }
      })
      .filter((item) => item.bad)
  })
  record('1024x680 layout has no obvious element overflow', overlaps.length === 0, JSON.stringify(overlaps.slice(0, 5)))

  await page.setViewportSize({ width: 390, height: 844 })
  const mobilePages = [
    { pageId: 'dashboard', text: 'Dashboard' },
    { pageId: 'projects', text: 'Projects' },
    { pageId: 'settings', text: 'Settings' },
  ]
  for (const entry of mobilePages) {
    await page.locator(`nav button[data-page="${entry.pageId}"]`).click()
    await page.waitForTimeout(150)
    await page.locator('main').getByText(entry.text).first().waitFor({ timeout: 3000 })
    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      activePage: JSON.parse(localStorage.getItem('agentflow.static.v1') || '{}').activePage,
    }))
    record(
      `390x844/${entry.pageId} no horizontal overflow`,
      layout.scrollWidth <= layout.clientWidth + 2 && layout.activePage === entry.pageId,
      JSON.stringify(layout),
    )
  }

  await browser.close()

  const seriousConsole = consoleEntries.filter((entry) => ['error'].includes(entry.type))
  record('no browser console errors', seriousConsole.length === 0, JSON.stringify(seriousConsole.slice(0, 3)))
  record('no page errors', pageErrors.length === 0, JSON.stringify(pageErrors.slice(0, 3)))
  record('no network failures', networkFailures.length === 0, JSON.stringify(networkFailures.slice(0, 3)))

  const result = {
    startedAt: new Date().toISOString(),
    baseUrl,
    checks,
    consoleEntries,
    pageErrors,
    networkFailures,
    screenshotPath,
    serverLogPath,
  }
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf8')

  const failed = checks.filter((check) => !check.passed)
  if (failed.length > 0) {
    throw new Error(`${failed.length} static browser smoke checks failed. See ${resultPath}`)
  }

  console.log(`\nPASS Static browser smoke completed. Result: ${resultPath}`)
  console.log(`Screenshot: ${screenshotPath}\n`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : String(error))
    process.exitCode = 1
  })
  .finally(() => {
    if (browser) {
      browser.close().catch(() => {})
    }
    if (child && child.exitCode === null) {
      child.kill()
    }
  })
