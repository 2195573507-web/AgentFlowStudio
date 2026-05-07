import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const assetsDir = resolve(__dirname, '..', 'assets')

if (!existsSync(assetsDir)) {
  mkdirSync(assetsDir, { recursive: true })
}

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="glass" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.3);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgba(255,255,255,0.05);stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.2)"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <rect x="64" y="64" width="384" height="384" rx="64" fill="url(#glass)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
  <!-- Flow lines -->
  <circle cx="180" cy="200" r="28" fill="rgba(255,255,255,0.9)" filter="url(#shadow)"/>
  <circle cx="332" cy="200" r="28" fill="rgba(255,255,255,0.9)" filter="url(#shadow)"/>
  <circle cx="256" cy="310" r="28" fill="rgba(255,255,255,0.9)" filter="url(#shadow)"/>
  <!-- Connection lines -->
  <line x1="205" y1="215" x2="307" y2="215" stroke="rgba(255,255,255,0.5)" stroke-width="6" stroke-linecap="round"/>
  <line x1="245" y1="295" x2="195" y2="225" stroke="rgba(255,255,255,0.5)" stroke-width="6" stroke-linecap="round"/>
  <line x1="267" y1="295" x2="317" y2="225" stroke="rgba(255,255,255,0.5)" stroke-width="6" stroke-linecap="round"/>
  <!-- Letter A -->
  <text x="256" y="218" text-anchor="middle" font-family="system-ui,sans-serif" font-size="28" font-weight="700" fill="#3b82f6">A</text>
  <text x="256" y="326" text-anchor="middle" font-family="system-ui,sans-serif" font-size="28" font-weight="700" fill="#8b5cf6">F</text>
</svg>`

const svgPath = resolve(assetsDir, 'icon.svg')
writeFileSync(svgPath, svgContent, 'utf-8')
console.log('[icon] Created assets/icon.svg')

// Try to generate PNG using a simple approach
// In a real setup, sharp or canvas would be used
// For now, we ensure SVG exists (which electron-builder can use)
try {
  const pngPath = resolve(assetsDir, 'icon.png')
  // Copy SVG as a placeholder - electron-builder will need a proper PNG
  writeFileSync(pngPath, svgContent, 'utf-8')
  console.log('[icon] Created assets/icon.png (SVG copy - replace with proper PNG for production)')
} catch {
  console.log('[icon] Could not create PNG, SVG is available')
}

try {
  const icoPath = resolve(assetsDir, 'icon.ico')
  writeFileSync(icoPath, svgContent, 'utf-8')
  console.log('[icon] Created assets/icon.ico (SVG copy - replace with proper ICO for production)')
} catch {
  console.log('[icon] Could not create ICO, SVG is available')
}

console.log('[icon] Icon generation complete.')
console.log('[icon] NOTE: For production, replace icon.png (512x512) and icon.ico with proper raster images.')
