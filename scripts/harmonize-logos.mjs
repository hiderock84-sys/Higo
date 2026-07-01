#!/usr/bin/env node
/**
 * ロゴをサイトのダークUI向けに統一（単色ホワイト）。
 */
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const staticDir = path.join(root, 'public', 'static')

/** ヘッダー／フッターアクセント #9ee8f0 に近い統一ホワイト */
const SITE_WHITE = { r: 238, g: 248, b: 250 }

function applySiteWhite(data, info, out) {
  for (let i = 0; i < info.width * info.height; i++) {
    const o = i * 4
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    const a = data[o + 3]
    const max = Math.max(r, g, b)

    if (a < 8 || max < 42) {
      out[o + 3] = 0
      continue
    }

    const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255
    out[o] = SITE_WHITE.r
    out[o + 1] = SITE_WHITE.g
    out[o + 2] = SITE_WHITE.b
    out[o + 3] = Math.round(a * Math.min(1, 0.4 + lum * 0.6))
  }
}

async function rawFromSharp(image) {
  return image.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
}

async function saveWhiteLogo(pngBuffer, outputName, { trim = true } = {}) {
  const { data, info } = await rawFromSharp(sharp(pngBuffer))
  const out = Buffer.alloc(data.length)
  applySiteWhite(data, info, out)
  let pipeline = sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
  if (trim) {
    pipeline = pipeline.trim({ threshold: 12 })
  }
  await pipeline.png({ compressionLevel: 9 }).toFile(path.join(staticDir, outputName))
  console.log(`[logo] ${outputName}`)
}

async function processHigonoieHeader() {
  await saveWhiteLogo(
    await sharp(path.join(staticDir, 'higonoie-header-logo-complete-final-cutout.png')).png().toBuffer(),
    'higonoie-header-logo-site-toned.png'
  )
}

async function processHigonoieFull() {
  await saveWhiteLogo(
    await sharp(path.join(staticDir, 'higonoie-full-logo-transparent.png')).png().toBuffer(),
    'higonoie-full-logo-site-toned.png'
  )
}

async function processRapport() {
  await saveWhiteLogo(
    await sharp(path.join(staticDir, 'rapport-logo-light.png')).png().toBuffer(),
    'rapport-logo-site-toned.png'
  )
}

function isSoulageCreamBackground(r, g, b, a) {
  if (a < 40) return true
  const lum = r * 0.299 + g * 0.587 + b * 0.114
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return lum > 228 && max - min < 18
}

function eraseRegion(data, width, box) {
  for (let y = box.top; y < box.top + box.height; y++) {
    for (let x = box.left; x < box.left + box.width; x++) {
      const o = (y * width + x) * 4
      data[o + 3] = 0
    }
  }
}

function arcPoint(p0, p1, p2, t) {
  const mt = 1 - t
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  }
}

function arcTangentDeg(p0, p1, p2, t) {
  const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x)
  const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y)
  return (Math.atan2(dy, dx) * 180) / Math.PI + 90
}

/** らぽーる 341×439 から導出したスラジェ専用レイアウト規則 */
const SOULAGE_LAYOUT = {
  canvasW: 341,
  canvasH: 439,
  topArc: {
    p0: { x: 52, y: 98 },
    p1: { x: 170.5, y: 34 },
    p2: { x: 289, y: 98 },
    fontSize: 32,
    chars: 'スラジェ',
    ts: [0.22, 0.4, 0.58, 0.76],
  },
  emblem: {
    top: 95,
    height: 270,
    maxWidth: 300,
  },
  bottomLabel: {
    y: 405,
    fontSize: 34,
    text: 'Soulage',
  },
}

function createSoulageLayoutSvg({ canvasW, canvasH, topArc, bottomLabel }) {
  const white = `rgb(${SITE_WHITE.r},${SITE_WHITE.g},${SITE_WHITE.b})`
  const { p0, p1, p2, fontSize, chars, ts } = topArc
  const archTexts = [...chars]
    .map((ch, i) => {
      const { x, y } = arcPoint(p0, p1, p2, ts[i])
      const rot = arcTangentDeg(p0, p1, p2, ts[i])
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="sans-serif" font-size="${fontSize}" font-weight="700" fill="${white}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})">${ch}</text>`
    })
    .join('')

  const svg = `<svg width="${canvasW}" height="${canvasH}" xmlns="http://www.w3.org/2000/svg">
    ${archTexts}
    <text x="${(canvasW / 2).toFixed(1)}" y="${bottomLabel.y}" font-family="sans-serif" font-size="${bottomLabel.fontSize}" font-weight="700" fill="${white}" text-anchor="middle" dominant-baseline="middle">${bottomLabel.text}</text>
  </svg>`
  return Buffer.from(svg)
}

async function extractSoulageSourceFromPdf() {
  const pdfPath = path.join(staticDir, 'incoming', 'soulage-logo-official.pdf')
  const { execSync } = await import('node:child_process')
  const tmpPdfImg = path.join(staticDir, 'soulage-pdf-sheet.png')

  execSync(
    `python3 - <<'PY'\nimport fitz\n` +
      `doc=fitz.open(${JSON.stringify(pdfPath)})\n` +
      `img=doc[0].get_images(full=True)[0]\n` +
      `open(${JSON.stringify(tmpPdfImg)},'wb').write(doc.extract_image(img[0])['image'])\nPY`,
    { stdio: 'inherit' }
  )

  const meta = await sharp(tmpPdfImg).metadata()
  const third = Math.round(meta.width / 3)
  const left = third * 2 + 8
  const cropW = meta.width - left - 8
  return sharp(tmpPdfImg)
    .extract({ left, top: 0, width: cropW, height: meta.height })
    .png()
    .toBuffer()
}

async function extractSoulageEmblemOnly(sourceBuffer) {
  const { data, info } = await rawFromSharp(sharp(sourceBuffer))
  const cleaned = Buffer.alloc(data.length)

  for (let i = 0; i < info.width * info.height; i++) {
    const o = i * 4
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    const a = data[o + 3]

    if (isSoulageCreamBackground(r, g, b, a)) {
      cleaned[o + 3] = 0
      continue
    }

    const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255
    cleaned[o] = SITE_WHITE.r
    cleaned[o + 1] = SITE_WHITE.g
    cleaned[o + 2] = SITE_WHITE.b
    cleaned[o + 3] = Math.round(a * Math.min(1, 0.55 + lum * 0.45))
  }

  /** 文字領域のみ除去（家＋月桂冠のみ残す） */
  eraseRegion(cleaned, info.width, { left: 55, top: 135, width: 400, height: 82 })
  eraseRegion(cleaned, info.width, { left: 70, top: 448, width: 330, height: 95 })

  const trimmed = await sharp(cleaned, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 12 })
    .png()
    .toBuffer()
  const trimmedMeta = await sharp(trimmed).metadata()
  return sharp(trimmed)
    .extract({
      left: 0,
      top: 0,
      width: trimmedMeta.width,
      height: Math.round(trimmedMeta.height * 0.92),
    })
    .trim({ threshold: 12 })
    .png()
    .toBuffer()
}

async function processSoulage() {
  const source = await extractSoulageSourceFromPdf()
  const emblem = await extractSoulageEmblemOnly(source)
  const emblemMeta = await sharp(emblem).metadata()

  const { canvasW, canvasH, topArc, emblem: emblemBox, bottomLabel } = SOULAGE_LAYOUT
  const scale = Math.min(emblemBox.maxWidth / emblemMeta.width, emblemBox.height / emblemMeta.height)
  const emblemW = Math.round(emblemMeta.width * scale)
  const emblemH = Math.round(emblemMeta.height * scale)
  const emblemLeft = Math.round((canvasW - emblemW) / 2)
  const emblemTop = Math.round(emblemBox.top + (emblemBox.height - emblemH) / 2)

  const emblemScaled = await sharp(emblem).resize({ width: emblemW, height: emblemH }).png().toBuffer()
  const layoutSvg = createSoulageLayoutSvg({ canvasW, canvasH, topArc, bottomLabel })

  const composed = await sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: emblemScaled, left: emblemLeft, top: emblemTop },
      { input: layoutSvg, left: 0, top: 0 },
    ])
    .png()
    .toBuffer()

  await saveWhiteLogo(composed, 'soulage-wreath-logo.png', { trim: false })
}

await processHigonoieHeader()
await processHigonoieFull()
await processRapport()
await processSoulage()

console.log('[logo] Done.')
