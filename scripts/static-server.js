import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectDir = path.resolve(__dirname, '..')
const logsDir = path.join(projectDir, 'logs')
const logPath = process.env.AGENTFLOW_STATIC_LOG_PATH
  ? path.resolve(process.env.AGENTFLOW_STATIC_LOG_PATH)
  : path.join(logsDir, 'static-server.log')
const host = process.env.HOST || '127.0.0.1'
const preferredPort = Number(process.argv[3] || process.env.PORT || 4173)
const portCandidates = [preferredPort, 4173, 4174, 4175, 4176, 4177]
  .filter((port, index, ports) => Number.isInteger(port) && port > 0 && ports.indexOf(port) === index)
const requestedRoot = process.argv[2]
const rootCandidates = [
  'static-app',
  'static-app/dist',
  requestedRoot,
  'dist',
  'dist-web',
  'public',
].filter((item, index, items) => Boolean(item) && items.indexOf(item) === index)

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

let activeServer = null
let activeRoot = null
let logFileAvailable = true

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`
  console.log(line)
  if (!logFileAvailable) {
    return
  }
  try {
    ensureDir(path.dirname(logPath))
    fs.appendFileSync(logPath, `${line}\n`, 'utf8')
  } catch (error) {
    logFileAvailable = false
    console.error(
      `[${new Date().toISOString()}] Static server log disabled: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
}

function initializeLogFile() {
  try {
    ensureDir(path.dirname(logPath))
    fs.writeFileSync(logPath, `[${new Date().toISOString()}] AgentFlow Studio static server log started\n`, 'utf8')
  } catch (error) {
    logFileAvailable = false
    console.error(
      `[${new Date().toISOString()}] Static server log disabled: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function writeFallbackApp(reason) {
  const staticDir = path.join(projectDir, 'static-app')
  ensureDir(staticDir)

  const indexPath = path.join(staticDir, 'index.html')
  const cssPath = path.join(staticDir, 'styles.css')
  const appPath = path.join(staticDir, 'app.js')

  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AgentFlow Studio - 静态可交付模式</title>
    <link rel="icon" href="/assets/icon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <div class="fallback-shell">
      <h1>AgentFlow Studio</h1>
      <p>静态可交付模式已启动。</p>
      <p>自动生成原因：${escapeHtml(reason)}</p>
      <nav>
        <a href="/">仪表盘</a>
        <a href="/projects">项目管理</a>
        <a href="/prompt-lab">提示词实验室</a>
        <a href="/log-analyzer">日志分析</a>
        <a href="/safety-box">安全检查</a>
        <a href="/shared-memory-hub">共享记忆中心</a>
        <a href="/settings">设置</a>
      </nav>
    </div>
    <script src="/app.js"></script>
  </body>
</html>
`, 'utf8')
  }

  if (!fs.existsSync(cssPath)) {
    fs.writeFileSync(cssPath, `body{margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f5f7fb;color:#162033}.fallback-shell{max-width:880px;margin:10vh auto;padding:32px}.fallback-shell a{display:inline-block;margin:8px 12px 8px 0;color:#2563eb}`, 'utf8')
  }

  if (!fs.existsSync(appPath)) {
    fs.writeFileSync(appPath, `console.log('AgentFlow Studio 静态可交付模式已启动')\n`, 'utf8')
  }

  return staticDir
}

function hasUsableIndex(dir) {
  try {
    return fs.statSync(dir).isDirectory() && fs.statSync(path.join(dir, 'index.html')).isFile()
  } catch {
    return false
  }
}

function selectStaticRoot() {
  for (const candidate of rootCandidates) {
    const resolved = path.resolve(projectDir, candidate)
    if (hasUsableIndex(resolved)) {
      return resolved
    }
    log(`静态目录不可用，继续尝试下一个：${resolved}`)
  }

  log('未找到可用静态目录，正在自动创建 static-app 降级页面。')
  return writeFallbackApp('未找到 static-app、dist、dist-web 或 public 中可用的 index.html')
}

function isInsideRoot(filePath) {
  const relative = path.relative(activeRoot, filePath)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function wantsHtml(req, pathname) {
  const accept = req.headers.accept || ''
  return req.method === 'GET' && (accept.includes('text/html') || !path.extname(pathname))
}

async function resolveRequestPath(req) {
  const requestUrl = req.url || '/'
  let pathname = '/'

  try {
    pathname = decodeURIComponent(new URL(requestUrl, `http://${host}`).pathname)
  } catch (error) {
    const err = new Error(`URL 无法解析：${requestUrl}`)
    err.statusCode = 400
    err.cause = error
    throw err
  }

  const normalized = path.normalize(pathname).replace(/^([/\\])+/, '')
  let filePath = path.join(activeRoot, normalized)

  if (!isInsideRoot(filePath)) {
    const err = new Error(`拒绝访问静态目录之外的路径：${pathname}`)
    err.statusCode = 403
    throw err
  }

  try {
    const stat = await fs.promises.stat(filePath)
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html')
    }
  } catch {
    if (path.extname(pathname) && !wantsHtml(req, pathname)) {
      const err = new Error(`静态资源不存在：${pathname}`)
      err.statusCode = 404
      throw err
    }
    filePath = path.join(activeRoot, 'index.html')
  }

  if (!isInsideRoot(filePath)) {
    const err = new Error(`拒绝访问静态目录之外的路径：${pathname}`)
    err.statusCode = 403
    throw err
  }

  try {
    const finalStat = await fs.promises.stat(filePath)
    if (!finalStat.isFile()) {
      throw new Error('不是文件')
    }
  } catch {
    const err = new Error(`静态文件不可用：${pathname}`)
    err.statusCode = 404
    throw err
  }

  return filePath
}

async function handleRequest(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, {
      'Content-Type': 'text/plain; charset=utf-8',
      Allow: 'GET, HEAD',
    })
    res.end('仅支持 GET 和 HEAD 请求')
    return
  }

  try {
    const filePath = await resolveRequestPath(req)
    const ext = path.extname(filePath).toLowerCase()
    const data = req.method === 'HEAD' ? null : await fs.promises.readFile(filePath)

    res.writeHead(200, {
      'Content-Type': contentTypes[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=3600',
    })

    if (data) {
      res.end(data)
    } else {
      res.end()
    }
  } catch (error) {
    const statusCode = error.statusCode || 500
    const message = statusCode === 500 ? '服务器读取静态文件失败' : error.message
    log(`[HTTP ${statusCode}] ${message}`)
    res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(message)
  }
}

function openBrowser(targetUrl) {
  if (process.env.AGENTFLOW_NO_OPEN === '1') {
    log('已跳过自动打开浏览器：AGENTFLOW_NO_OPEN=1')
    return
  }

  const command =
    process.platform === 'win32'
      ? { file: 'cmd', args: ['/c', 'start', '', targetUrl] }
      : process.platform === 'darwin'
        ? { file: 'open', args: [targetUrl] }
        : { file: 'xdg-open', args: [targetUrl] }

  try {
    log(`正在打开浏览器：${targetUrl}`)
    const child = spawn(command.file, command.args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    })
    child.on('error', (error) => log(`自动打开浏览器失败：${error.message}`))
    child.unref()
  } catch (error) {
    log(`自动打开浏览器失败：${error instanceof Error ? error.message : String(error)}`)
  }
}

function startServer(portIndex = 0) {
  if (portIndex >= portCandidates.length) {
    log(`端口 ${portCandidates.join(', ')} 都不可用，静态服务器无法启动。`)
    process.exitCode = 1
    return
  }

  const port = portCandidates[portIndex]
  const server = http.createServer((req, res) => {
    handleRequest(req, res).catch((error) => {
      log(`请求处理异常：${error instanceof Error ? error.stack || error.message : String(error)}`)
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      }
      res.end('服务器请求处理异常')
    })
  })

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      log(`端口 ${port} 被占用，尝试下一个端口。`)
      startServer(portIndex + 1)
      return
    }

    log(`静态服务器启动失败：${error.code || 'UNKNOWN'} ${error.message}`)
    process.exitCode = 1
  })

  server.listen(port, host, () => {
    activeServer = server
    const actualPort = server.address().port
    const url = `http://${host}:${actualPort}`
    log('静态服务器已启动。')
    log(`服务地址：${url}`)
    log(`静态目录：${activeRoot}`)
    log(`日志文件：${logPath}`)
    log('请保持此窗口打开；按 Ctrl+C 可以停止服务。')
    openBrowser(url)
  })
}

function shutdown(signal) {
  log(`收到 ${signal}，正在关闭静态服务器。`)
  if (!activeServer) {
    process.exit(0)
  }
  activeServer.close(() => {
    log('静态服务器已关闭。')
    process.exit(0)
  })
}

process.on('uncaughtException', (error) => {
  log(`未捕获异常：${error instanceof Error ? error.stack || error.message : String(error)}`)
  process.exitCode = 1
})

process.on('unhandledRejection', (reason) => {
  log(`未处理 Promise 拒绝：${reason instanceof Error ? reason.stack || reason.message : String(reason)}`)
  process.exitCode = 1
})

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

initializeLogFile()
log(`项目路径：${projectDir}`)
activeRoot = selectStaticRoot()
startServer()
