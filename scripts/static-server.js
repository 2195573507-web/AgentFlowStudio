import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectDir = path.resolve(__dirname, '..')
const rootArg = process.argv[2] || 'dist'
const portArg = Number(process.argv[3] || process.env.PORT || 4173)
const host = process.env.HOST || '127.0.0.1'
const rootDir = path.resolve(projectDir, rootArg)
const url = `http://${host}:${portArg}`

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
}

function resolveRequestPath(requestUrl) {
  const url = new URL(requestUrl || '/', `http://${host}:${portArg}`)
  const decodedPath = decodeURIComponent(url.pathname)
  const normalizedPath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '')
  let filePath = path.join(rootDir, normalizedPath)

  if (!filePath.startsWith(rootDir)) {
    return null
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html')
  }

  if (!fs.existsSync(filePath)) {
    filePath = path.join(rootDir, 'index.html')
  }

  return filePath.startsWith(rootDir) ? filePath : null
}

if (!fs.existsSync(rootDir)) {
  console.error(`Static root not found: ${rootDir}`)
  console.error('Run "npm run build:web" first, or use "npm run fallback:static".')
  process.exit(1)
}

const server = http.createServer((req, res) => {
  const filePath = resolveRequestPath(req.url)

  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Forbidden')
    return
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Not found')
      return
    }

    const ext = path.extname(filePath).toLowerCase()
    res.writeHead(200, {
      'Content-Type': contentTypes[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=31536000, immutable',
    })
    res.end(data)
  })
})

function openBrowser(targetUrl) {
  if (process.env.AGENTFLOW_NO_OPEN === '1') {
    return
  }

  const command =
    process.platform === 'win32'
      ? { file: 'cmd', args: ['/c', 'start', '', targetUrl] }
      : process.platform === 'darwin'
        ? { file: 'open', args: [targetUrl] }
        : { file: 'xdg-open', args: [targetUrl] }

  try {
    const child = spawn(command.file, command.args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    })
    child.unref()
  } catch (error) {
    console.warn(`Unable to open browser automatically: ${error instanceof Error ? error.message : String(error)}`)
  }
}

server.listen(portArg, host, () => {
  console.log(`AgentFlow Studio static fallback: ${url}`)
  console.log(`Serving: ${rootDir}`)
  openBrowser(url)
})
