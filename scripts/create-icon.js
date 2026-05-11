import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { deflateSync } from 'zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const assetsDir = resolve(__dirname, '..', 'assets')
const staticAssetsDir = resolve(__dirname, '..', 'static-app', 'assets')

const CANVAS_SIZE = 512
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]

if (!existsSync(assetsDir)) {
  mkdirSync(assetsDir, { recursive: true })
}

if (!existsSync(staticAssetsDir)) {
  mkdirSync(staticAssetsDir, { recursive: true })
}

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-labelledby="title desc">
  <title id="title">LocalAI Nexus icon</title>
  <desc id="desc">A minimal LocalAI Nexus mark with connected local workflow nodes.</desc>
  <rect width="512" height="512" rx="104" fill="#f6f7f9"/>
  <rect x="40" y="40" width="432" height="432" rx="82" fill="#256f8f"/>
  <rect x="104" y="108" width="304" height="296" rx="44" fill="#ffffff" opacity="0.96"/>
  <path d="M178 210h156M204 226l52 82 52-82" fill="none" stroke="#256f8f" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="178" cy="210" r="38" fill="#e4f1f6" stroke="#256f8f" stroke-width="14"/>
  <circle cx="334" cy="210" r="38" fill="#e4f1f6" stroke="#256f8f" stroke-width="14"/>
  <circle cx="256" cy="318" r="38" fill="#e4f1f6" stroke="#256f8f" stroke-width="14"/>
  <circle cx="178" cy="210" r="11" fill="#17202c"/>
  <circle cx="334" cy="210" r="11" fill="#17202c"/>
  <circle cx="256" cy="318" r="11" fill="#17202c"/>
</svg>`

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const lerp = (a, b, t) => a + (b - a) * t
const mix = (a, b, t) => [
  Math.round(lerp(a[0], b[0], t)),
  Math.round(lerp(a[1], b[1], t)),
  Math.round(lerp(a[2], b[2], t)),
  Math.round(lerp(a[3] ?? 255, b[3] ?? 255, t)),
]

const blendOver = (dst, src, opacity = 1) => {
  const alpha = ((src[3] ?? 255) / 255) * opacity
  const inverse = 1 - alpha
  return [
    Math.round(src[0] * alpha + dst[0] * inverse),
    Math.round(src[1] * alpha + dst[1] * inverse),
    Math.round(src[2] * alpha + dst[2] * inverse),
    255,
  ]
}

const roundedRectCoverage = (x, y, rectX, rectY, width, height, radius) => {
  const px = x - (rectX + width / 2)
  const py = y - (rectY + height / 2)
  const qx = Math.abs(px) - (width / 2 - radius)
  const qy = Math.abs(py) - (height / 2 - radius)
  const outsideX = Math.max(qx, 0)
  const outsideY = Math.max(qy, 0)
  const inside = Math.min(Math.max(qx, qy), 0)
  const distance = Math.hypot(outsideX, outsideY) + inside - radius
  return clamp(0.5 - distance, 0, 1)
}

const circleCoverage = (x, y, cx, cy, radius) => clamp(radius + 0.5 - Math.hypot(x - cx, y - cy), 0, 1)

const segmentCoverage = (x, y, x1, y1, x2, y2, width) => {
  const vx = x2 - x1
  const vy = y2 - y1
  const lenSq = vx * vx + vy * vy
  const t = lenSq === 0 ? 0 : clamp(((x - x1) * vx + (y - y1) * vy) / lenSq, 0, 1)
  const px = x1 + vx * t
  const py = y1 + vy * t
  return clamp(width / 2 + 0.5 - Math.hypot(x - px, y - py), 0, 1)
}

const drawSegment = (base, x, y, x1, y1, x2, y2, width, color, opacity = 1) => {
  const coverage = segmentCoverage(x, y, x1, y1, x2, y2, width)
  return coverage > 0 ? blendOver(base, color, coverage * opacity) : base
}

const drawCircle = (base, x, y, cx, cy, radius, color, opacity = 1) => {
  const coverage = circleCoverage(x, y, cx, cy, radius)
  return coverage > 0 ? blendOver(base, color, coverage * opacity) : base
}

const renderIcon = (size) => {
  const scale = size / CANVAS_SIZE
  const pixels = Buffer.alloc(size * size * 4)
  const bg1 = [37, 111, 143, 255]
  const bg2 = [37, 111, 143, 255]
  const bg3 = [29, 93, 120, 255]

  const outer = {
    x: 28 * scale,
    y: 28 * scale,
    width: 456 * scale,
    height: 456 * scale,
    radius: 94 * scale,
  }
  const innerPanel = {
    x: 84 * scale,
    y: 80 * scale,
    width: 344 * scale,
    height: 352 * scale,
    radius: 98 * scale,
  }
  const innerStroke = {
    x: 129 * scale,
    y: 125 * scale,
    width: 254 * scale,
    height: 262 * scale,
    radius: 54 * scale,
  }

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const x = px + 0.5
      const y = py + 0.5
      const index = (py * size + px) * 4
      let color = [15, 23, 42, 255]

      const outerCoverage = roundedRectCoverage(x, y, outer.x, outer.y, outer.width, outer.height, outer.radius)
      if (outerCoverage > 0) {
        const t = clamp((x + y - 56 * scale) / (912 * scale), 0, 1)
        const gradient = mix(bg1, bg3, t)
        color = blendOver(color, gradient, outerCoverage)
      }

      const panelCoverage = roundedRectCoverage(x, y, innerPanel.x, innerPanel.y, innerPanel.width, innerPanel.height, innerPanel.radius)
      if (panelCoverage > 0) {
        const panelOpacity = lerp(0.34, 0.08, clamp((y - innerPanel.y) / innerPanel.height, 0, 1))
        color = blendOver(color, [255, 255, 255, 255], panelCoverage * 0.96)
      }

      const panelBorder = clamp(
        roundedRectCoverage(x, y, innerPanel.x, innerPanel.y, innerPanel.width, innerPanel.height, innerPanel.radius) -
          roundedRectCoverage(
            x,
            y,
            innerPanel.x + 4 * scale,
            innerPanel.y + 4 * scale,
            innerPanel.width - 8 * scale,
            innerPanel.height - 8 * scale,
            Math.max(0, innerPanel.radius - 4 * scale),
          ),
        0,
        1,
      )
      if (panelBorder > 0) {
        color = blendOver(color, [228, 241, 246, 255], panelBorder * 1)
      }

      const innerBorder = clamp(
        roundedRectCoverage(x, y, innerStroke.x, innerStroke.y, innerStroke.width, innerStroke.height, innerStroke.radius) -
          roundedRectCoverage(
            x,
            y,
            innerStroke.x + 3 * scale,
            innerStroke.y + 3 * scale,
            innerStroke.width - 6 * scale,
            innerStroke.height - 6 * scale,
            Math.max(0, innerStroke.radius - 3 * scale),
          ),
        0,
        1,
      )
      if (innerBorder > 0) {
        color = blendOver(color, [255, 255, 255, 255], innerBorder * 0.24)
      }

      const shadowOpacity =
        circleCoverage(x, y, 178 * scale, 225 * scale, 44 * scale) +
        circleCoverage(x, y, 334 * scale, 225 * scale, 44 * scale) +
        circleCoverage(x, y, 256 * scale, 336 * scale, 44 * scale)
      if (shadowOpacity > 0) {
        color = blendOver(color, [16, 24, 40, 255], Math.min(shadowOpacity, 1) * 0.2)
      }

      color = drawSegment(color, x, y, 183 * scale, 209 * scale, 329 * scale, 209 * scale, 24 * scale, [37, 111, 143, 255])
      color = drawSegment(color, x, y, 199 * scale, 221 * scale, 256 * scale, 312 * scale, 24 * scale, [37, 111, 143, 255])
      color = drawSegment(color, x, y, 313 * scale, 221 * scale, 256 * scale, 312 * scale, 24 * scale, [37, 111, 143, 255])

      color = drawCircle(color, x, y, 178 * scale, 209 * scale, 42 * scale, [228, 241, 246, 255])
      color = drawCircle(color, x, y, 334 * scale, 209 * scale, 42 * scale, [228, 241, 246, 255])
      color = drawCircle(color, x, y, 256 * scale, 320 * scale, 42 * scale, [228, 241, 246, 255])

      color = drawCircle(color, x, y, 178 * scale, 209 * scale, 16 * scale, [23, 32, 44, 255])
      color = drawCircle(color, x, y, 334 * scale, 209 * scale, 16 * scale, [23, 32, 44, 255])
      color = drawCircle(color, x, y, 256 * scale, 320 * scale, 16 * scale, [23, 32, 44, 255])

      pixels[index] = color[0]
      pixels[index + 1] = color[1]
      pixels[index + 2] = color[2]
      pixels[index + 3] = color[3]
    }
  }

  return pixels
}

const crcTable = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  crcTable[i] = c >>> 0
}

const crc32 = (buffer) => {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

const pngChunk = (type, data) => {
  const typeBuffer = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  const crc = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)
  return Buffer.concat([length, typeBuffer, data, crc])
}

const encodePng = (width, height, rgba) => {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const scanlines = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1)
    scanlines[rowStart] = 0
    rgba.copy(scanlines, rowStart + 1, y * width * 4, (y + 1) * width * 4)
  }

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

const encodeIco = (images) => {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)

  const directory = Buffer.alloc(images.length * 16)
  let imageOffset = header.length + directory.length

  images.forEach(({ size, png }, index) => {
    const entry = index * 16
    directory[entry] = size >= 256 ? 0 : size
    directory[entry + 1] = size >= 256 ? 0 : size
    directory[entry + 2] = 0
    directory[entry + 3] = 0
    directory.writeUInt16LE(1, entry + 4)
    directory.writeUInt16LE(32, entry + 6)
    directory.writeUInt32LE(png.length, entry + 8)
    directory.writeUInt32LE(imageOffset, entry + 12)
    imageOffset += png.length
  })

  return Buffer.concat([header, directory, ...images.map(({ png }) => png)])
}

const writeAssets = () => {
  const svgPath = resolve(assetsDir, 'icon.svg')
  writeFileSync(svgPath, svgContent, 'utf-8')
  console.log('[icon] Created assets/icon.svg')
  writeFileSync(resolve(assetsDir, 'localai-nexus.svg'), svgContent, 'utf-8')
  console.log('[icon] Created assets/localai-nexus.svg')
  writeFileSync(resolve(staticAssetsDir, 'icon.svg'), svgContent, 'utf-8')
  console.log('[icon] Created static-app/assets/icon.svg')
  writeFileSync(resolve(staticAssetsDir, 'localai-nexus.svg'), svgContent, 'utf-8')
  console.log('[icon] Created static-app/assets/localai-nexus.svg')

  const png512 = encodePng(CANVAS_SIZE, CANVAS_SIZE, renderIcon(CANVAS_SIZE))
  writeFileSync(resolve(assetsDir, 'icon.png'), png512)
  console.log('[icon] Created assets/icon.png (512x512 PNG)')
  writeFileSync(resolve(assetsDir, 'localai-nexus.png'), png512)
  console.log('[icon] Created assets/localai-nexus.png (512x512 PNG)')

  const icoImages = ICO_SIZES.map((size) => ({
    size,
    png: size === CANVAS_SIZE ? png512 : encodePng(size, size, renderIcon(size)),
  }))
  const ico = encodeIco(icoImages)
  writeFileSync(resolve(assetsDir, 'icon.ico'), ico)
  console.log(`[icon] Created assets/icon.ico (${ICO_SIZES.join(', ')}px)`)
  writeFileSync(resolve(assetsDir, 'localai-nexus.ico'), ico)
  console.log(`[icon] Created assets/localai-nexus.ico (${ICO_SIZES.join(', ')}px)`)

  console.log('[icon] Icon generation complete.')
}

writeAssets()
