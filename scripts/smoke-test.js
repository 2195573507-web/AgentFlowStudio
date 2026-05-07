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
check('dist/index.html', fileExists('dist/index.html'))

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
check('secret redaction module exists', secretRedaction.includes('redactSecrets'))
check('secret detection module exists', secretRedaction.includes('containsSecret'))
check('memory context marker exists', memoryInjection.includes('[Shared Memory Context]'))

console.log('\n' + '='.repeat(50))
console.log(`\nResults: ${pass} passed, ${fail} failed, ${pass + fail} total\n`)

if (fail > 0) {
  process.exit(1)
}

console.log('Smoke test passed.')
