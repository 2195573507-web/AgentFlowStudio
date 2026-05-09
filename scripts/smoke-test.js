import { existsSync, readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

let pass = 0
let fail = 0

function readText(path) {
  return readFileSync(resolve(root, path), 'utf8')
}

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  PASS  ${name}`)
    pass++
  } else {
    console.log(`  FAIL  ${name}${detail ? ` (${detail})` : ''}`)
    fail++
  }
}

function fileExists(path) {
  return existsSync(resolve(root, path))
}

console.log('\nAgentFlow Studio - Smoke Test\n')
console.log('='.repeat(50))

console.log('\n[Package Scripts]')
const pkg = JSON.parse(readText('package.json'))
const requiredScripts = ['typecheck', 'test', 'build', 'verify', 'smoke', 'test:e2e']
for (const script of requiredScripts) {
  check(`script/${script}`, Boolean(pkg.scripts?.[script]))
}
check('script/test uses vite config', pkg.scripts?.test === 'vitest run --config vite.config.ts')
check('script/verify runs smoke', pkg.scripts?.verify?.includes('npm run smoke'))

console.log('\n[Test Surface]')
const unitTests = [
  'planner',
  'templates',
  'logAnalyzer',
  'safetyRules',
  'exporters',
  'memoryStore',
  'memoryRetriever',
  'memoryInjection',
  'secretRedaction',
]
for (const testName of unitTests) {
  check(`unit/${testName}`, fileExists(`tests/unit/${testName}.test.ts`))
}
check('e2e/app.spec', fileExists('tests/e2e/app.spec.ts'))

const viteConfig = readText('vite.config.ts')
check('vitest includes unit tests', viteConfig.includes("include: ['tests/unit/**/*.test.ts']"))
check('vitest uses node environment', viteConfig.includes("environment: 'node'"))

console.log('\n[Core Application Files]')
const coreFiles = [
  'package.json',
  'src/main/index.ts',
  'src/main/preload.ts',
  'src/renderer/main.tsx',
  'src/renderer/App.tsx',
  'src/renderer/routes/Dashboard.tsx',
  'src/renderer/routes/Projects.tsx',
  'src/renderer/routes/ProjectDetail.tsx',
  'src/renderer/routes/PromptLab.tsx',
  'src/renderer/routes/LogAnalyzer.tsx',
  'src/renderer/routes/SafetyBox.tsx',
  'src/renderer/routes/SharedMemoryHub.tsx',
  'src/renderer/routes/Settings.tsx',
  'src/renderer/components/ErrorBoundary.tsx',
  'src/renderer/lib/i18n.ts',
  'src/renderer/lib/theme.ts',
  'src/renderer/lib/memoryInjection.ts',
  'src/renderer/lib/secretRedaction.ts',
]
for (const file of coreFiles) {
  check(file, fileExists(file))
}

console.log('\n[Launch Assets]')
check('assets/icon.ico', fileExists('assets/icon.ico'))
check('assets/icon.ico non-empty', fileExists('assets/icon.ico') && readFileSync(resolve(root, 'assets/icon.ico')).length > 128)
check('start-agentflow.bat', fileExists('start-agentflow.bat'))
check('start-agentflow-web.bat', fileExists('start-agentflow-web.bat'))
check('start-agentflow-static.bat', fileExists('start-agentflow-static.bat'))
check('scripts/create-shortcut.ps1', fileExists('scripts/create-shortcut.ps1'))
check('scripts/static-server.js', fileExists('scripts/static-server.js'))
check('scripts/launch-static-test.js', fileExists('scripts/launch-static-test.js'))
check('static-app/index.html', fileExists('static-app/index.html'))
check('static-app/app.js', fileExists('static-app/app.js'))
check('static-app/styles.css', fileExists('static-app/styles.css'))
check('static-app/assets/icon.svg', fileExists('static-app/assets/icon.svg'))
const staticIndex = readText('static-app/index.html')
const staticApp = readText('static-app/app.js')
const staticText = `${staticIndex}\n${staticApp}`
const staticLauncher = readText('start-agentflow-static.bat')
const staticServer = readText('scripts/static-server.js')
const staticLaunchTest = readText('scripts/launch-static-test.js')
check('static launcher uses per-run launcher log', staticLauncher.includes('launcher-static-%LAUNCH_ID%.log'))
check('static launcher uses per-run server log', staticLauncher.includes('static-server-%LAUNCH_ID%.log'))
check('static launcher does not redirect server output to launcher log', !staticLauncher.includes('static-server.js" >> "%LAUNCHER_LOG%"'))
check('static server accepts custom log path', staticServer.includes('AGENTFLOW_STATIC_LOG_PATH'))
check('static launch test uses isolated log path', staticLaunchTest.includes('static-server-test-') && staticLaunchTest.includes('AGENTFLOW_STATIC_LOG_PATH'))
for (const keyword of ['仪表盘', '项目管理', '项目详情', '提示词实验室', '日志分析', '安全检查', '共享记忆中心', '技能管理', 'Git 时间线', '设置', '界面偏好', '浅色', '深色', '跟随系统']) {
  check(`static-app localized/${keyword}`, staticText.includes(keyword))
}
for (const keyword of ['Dashboard', 'Projects', 'Project Detail', 'Prompt Lab', 'Log Analyzer', 'SafetyBox', 'Shared Memory Hub', 'Skills', 'Git Timeline', 'Settings', 'Interface Preferences', 'Light', 'Dark', 'System']) {
  check(`static-app english/${keyword}`, staticText.includes(keyword))
}
check('static translations object exists', staticApp.includes('const translations'))
check('static translations zh exists', staticApp.includes('zh:'))
check('static translations en exists', staticApp.includes('en:'))
check('static t(key) exists', staticApp.includes('function t('))
check('static agentflow.language key exists', staticApp.includes('agentflow.language'))
check('static agentflow.theme key exists', staticApp.includes('agentflow.theme'))
const staticCss = readText('static-app/styles.css')
check('static data-theme exists', staticApp.includes('dataset.theme') || staticCss.includes('data-theme'))
check('static [data-theme="dark"] exists', staticCss.includes('[data-theme="dark"]'))
check('static [data-theme="light"] exists', staticCss.includes('[data-theme="light"]'))
check('static prefers-color-scheme exists', staticCss.includes('prefers-color-scheme'))
check('static shared memory injection marker exists', staticApp.includes('[Shared Memory Context]') && staticApp.includes('[/Shared Memory Context]'))
check('static inject shared memory label exists', staticApp.includes('Inject Shared Memory') && staticApp.includes('注入共享记忆'))
check('static secret redaction rules exist', ['sk-', 'Bearer', 'api[_-]?key', 'password', 'secret', 'access[_-]?token', 'refresh[_-]?token', 'authorization', 'token'].every((part) => staticApp.includes(part)))
check('static route error fallback exists', staticApp.includes('Static render error') && staticApp.includes('当前页面加载失败') && staticApp.includes('This page failed to load'))

console.log('\n[Handoff]')
check('handoff/CODEX_HANDOFF.md', fileExists('handoff/CODEX_HANDOFF.md'))
check('handoff/TEST_REPORT.md', fileExists('handoff/TEST_REPORT.md'))

console.log('\n[Electron Security]')
const main = readText('src/main/index.ts')
const preload = readText('src/main/preload.ts')
check('contextIsolation enabled', main.includes('contextIsolation: true'))
check('nodeIntegration disabled', main.includes('nodeIntegration: false'))
check('preload uses contextBridge', preload.includes('contextBridge.exposeInMainWorld'))
check('preload uses ipcRenderer.invoke', preload.includes('ipcRenderer.invoke'))
check('no exec exposure in preload', !/child_process|exec\(|spawn\(/.test(preload))

console.log('\n[Shared Memory Safety]')
const secretRedaction = readText('src/renderer/lib/secretRedaction.ts')
const memoryInjection = readText('src/renderer/lib/memoryInjection.ts')
const sharedRedaction = readText('src/shared/secretRedaction.ts')
check('secret redaction module exists', secretRedaction.includes('redactSecrets'))
check('secret detection module exists', secretRedaction.includes('containsSecret'))
check('recursive redaction module exists', sharedRedaction.includes('sanitizeValue') && sharedRedaction.includes('WeakMap'))
check('secret redaction covers authorization/token', sharedRedaction.includes('authorization') && sharedRedaction.includes('token'))
check('memory context marker exists', memoryInjection.includes('[Shared Memory Context]'))
check('memory context canonical sections exist', ['项目背景', '已做决策', '当前进度', '已知问题', '用户偏好', 'API Provider 注意事项'].every((keyword) => memoryInjection.includes(keyword)))
const appTsx = readText('src/renderer/App.tsx')
check('route ErrorBoundary wrapper exists', appTsx.includes('ErrorBoundary') && appTsx.includes('routeElement'))

console.log('\n' + '='.repeat(50))
console.log(`\nResults: ${pass} passed, ${fail} failed, ${pass + fail} total\n`)

if (fail > 0) {
  process.exit(1)
}

console.log('Smoke test passed.')
