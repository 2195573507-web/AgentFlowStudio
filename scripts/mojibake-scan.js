import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const roots = ['src', 'tests', 'scripts', 'static-app', 'handoff', 'README.md', 'AGENTS.md', 'PROJECT_PROGRESS.md']
const ignoredDirs = new Set(['node_modules', '.git', '.codex-parallel', 'dist', 'dist-electron', 'release'])
const boxDrawingMojibake = String.fromCharCode(0x9239)
const smartQuoteMojibake = String.fromCharCode(0x9225, 0x3f)
const arrowMojibake = String.fromCharCode(0x920b, 0x3f)
const suspicious = [
  { label: 'replacement character', test: (text) => text.includes(String.fromCharCode(0xfffd)) },
  { label: 'latin-1 mojibake', test: (text) => /[\u00c2\u00c3]/.test(text) || text.includes(String.fromCharCode(0x00e2, 0x20ac)) },
  { label: 'box drawing mojibake', test: (text) => text.includes(boxDrawingMojibake) },
  { label: 'smart quote mojibake', test: (text) => text.includes(smartQuoteMojibake) || text.includes(arrowMojibake) },
  { label: 'common Chinese mojibake', test: (text) => text.includes(String.fromCharCode(0x95c8, 0x6b39)) || text.includes(String.fromCharCode(0x9396, 0x611f)) || text.includes(String.fromCharCode(0x6924, 0x572d)) },
]
const textExt = /\.(ts|tsx|js|mjs|cjs|json|md|html|css|ps1|bat)$/i
const allowlist = new Set([
  'README.md',
  'AGENTS.md',
  'PROJECT_PROGRESS.md',
])

function walk(path, files = []) {
  const stat = statSync(path)
  if (stat.isDirectory()) {
    if (ignoredDirs.has(path.split(/[\\/]/).at(-1))) return files
    for (const entry of readdirSync(path)) walk(join(path, entry), files)
  } else if (textExt.test(path)) {
    files.push(path)
  }
  return files
}

const files = roots.flatMap((entry) => walk(join(root, entry)).filter(Boolean))
const hits = []
for (const file of files) {
  const rel = relative(root, file).replace(/\\/g, '/')
  if (allowlist.has(rel)) continue
  const text = readFileSync(file, 'utf8')
  for (const pattern of suspicious) {
    if (pattern.test(text)) {
      hits.push(`${rel}: ${pattern.label}`)
      break
    }
  }
}

if (hits.length) {
  console.error(`Mojibake scan failed:\n${hits.join('\n')}`)
  process.exit(1)
}

console.log(`Mojibake scan passed (${files.length} files checked, ${allowlist.size} legacy docs allowlisted).`)
