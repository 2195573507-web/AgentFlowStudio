import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const requiredFiles = [
  'start-agentflow-static.bat',
  'scripts/static-server.js',
  'static-app/index.html',
  'static-app/app.js',
  'static-app/styles.css',
]
const requiredKeywords = [
  '仪表盘',
  '项目管理',
  '项目详情',
  '提示词实验室',
  '日志分析',
  '安全检查',
  '共享记忆中心',
  '设置',
]
const requiredEnglishKeywords = [
  'Dashboard',
  'Projects',
  'Project Detail',
  'Prompt Lab',
  'Log Analyzer',
  'SafetyBox',
  'Shared Memory Hub',
  'Settings',
  'Interface Preferences',
  'Light',
  'Dark',
  'System',
]
const serverLogPath = path.join(root, 'logs', `static-server-test-${Date.now()}.log`)

let child = null
let processOutput = ''

function pass(message) {
  console.log(`PASS ${message}`)
}

function fail(message) {
  console.error(`FAIL ${message}`)
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath))
}

function readLog() {
  return fs.existsSync(serverLogPath) ? fs.readFileSync(serverLogPath, 'utf8') : ''
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function request(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: Buffer.concat(chunks).toString('utf8'),
        })
      })
    })
    req.on('error', reject)
    req.setTimeout(2000, () => {
      req.destroy(new Error(`请求超时：${url}`))
    })
  })
}

async function waitForUrl(timeoutMs = 10000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    if (child && child.exitCode !== null) {
      throw new Error(`静态服务器提前退出，退出码：${child.exitCode}\n${processOutput}`)
    }
    const output = readLog()
    const markerMatch = output.match(/AGENTFLOW_STATIC_LAUNCH_URL=(http:\/\/127\.0\.0\.1:\d+\/\?token=[^\s]+)/)
    if (markerMatch) {
      return markerMatch[1]
    }
    await wait(250)
  }
  throw new Error('等待服务地址超时，未在 static-server.log 中看到服务地址。')
}

async function main() {
  console.log('\nAgentFlow Studio - Static Launch Test\n')

  for (const file of requiredFiles) {
    if (!fileExists(file)) {
      fail(`${file} 不存在`)
      process.exit(1)
    }
    pass(`${file} 存在`)
  }

  fs.mkdirSync(path.dirname(serverLogPath), { recursive: true })

  child = spawn(process.execPath, ['scripts/static-server.js', 'static-app', '4173'], {
    cwd: root,
    env: { ...process.env, AGENTFLOW_NO_OPEN: '1', AGENTFLOW_STATIC_LOG_PATH: serverLogPath },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })

  child.stdout.on('data', (chunk) => {
    processOutput += chunk.toString()
  })
  child.stderr.on('data', (chunk) => {
    processOutput += chunk.toString()
  })

  child.on('exit', (code, signal) => {
    processOutput += `\n[child-exit code=${code} signal=${signal}]\n`
  })

  const url = await waitForUrl()
  pass(`服务地址已出现：${url}`)

  const response = await request(url)
  if (response.statusCode !== 200) {
    fail(`HTTP 状态码不是 200：${response.statusCode}`)
    console.error(response.body.slice(0, 500))
    process.exit(1)
  }
  pass('首页 HTTP 200')

  if (!/<title>AgentFlow Studio/.test(response.body)) {
    fail('页面 title 未包含 AgentFlow Studio')
    process.exit(1)
  }
  pass('页面 title 包含 AgentFlow Studio')

  for (const keyword of requiredKeywords) {
    if (!response.body.includes(keyword)) {
      fail(`HTML 未包含中文关键词：${keyword}`)
      process.exit(1)
    }
    pass(`HTML 包含中文关键词：${keyword}`)
  }

  for (const keyword of requiredEnglishKeywords) {
    if (!response.body.includes(keyword)) {
      fail(`HTML 未包含英文关键词：${keyword}`)
      process.exit(1)
    }
    pass(`HTML 包含英文关键词：${keyword}`)
  }

  const appSource = fs.readFileSync(path.join(root, 'static-app', 'app.js'), 'utf8')
  const cssSource = fs.readFileSync(path.join(root, 'static-app', 'styles.css'), 'utf8')
  const serverSource = fs.readFileSync(path.join(root, 'scripts', 'static-server.js'), 'utf8')
  const staticSource = `${response.body}\n${appSource}\n${cssSource}\n${serverSource}`
  for (const marker of [
    'agentflow.language',
    'agentflow.theme',
    'const translations',
    '[Shared Memory Context]',
    '[/Shared Memory Context]',
    'Inject Shared Memory',
    '[REDACTED]',
    'Static render error',
    'agentflow_static_token',
    'AGENTFLOW_STATIC_LAUNCH_URL',
    '[data-theme="dark"]',
    'prefers-color-scheme',
  ]) {
    if (!staticSource.includes(marker)) {
      fail(`静态源码未包含关键标记：${marker}`)
      process.exit(1)
    }
    pass(`静态源码包含关键标记：${marker}`)
  }

  await wait(5000)
  if (child.exitCode !== null) {
    fail(`服务进程 5 秒内退出，退出码：${child.exitCode}`)
    console.error(processOutput)
    process.exit(1)
  }
  pass('服务进程保持运行超过 5 秒')

  const log = readLog()
  if (/未捕获异常|未处理 Promise 拒绝|启动失败/.test(log)) {
    fail('static-server.log 中出现启动错误')
    console.error(log)
    process.exit(1)
  }
  pass('static-server.log 未发现立即退出错误')

  console.log('\nPASS Static launch verification completed.\n')
}

main()
  .catch((error) => {
    fail(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
  .finally(() => {
    if (child && child.exitCode === null) {
      child.kill()
    }
  })
