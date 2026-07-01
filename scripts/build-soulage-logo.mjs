#!/usr/bin/env node
/**
 * スラジェロゴ — らぽーると同じ 341×439 / 2属性 / 同じ視覚密度。
 * 公式PDFの家＋月桂冠エンブレム + 上部アーチ「スラジェ」+ 下部「Soulage」
 */
import { execSync } from 'node:child_process'
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const staticDir = path.join(root, 'public', 'static')

const CANVAS_W = 341
const CANVAS_H = 439
const SITE_WHITE = { r: 238, g: 248, b: 250 }
const WHITE = `rgb(${SITE_WHITE.r},${SITE_WHITE.g},${SITE_WHITE.b})`

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

function createLabelSvg() {
  const cx = CANVAS_W / 2
  const p0 = { x: 52, y: 98 }
  const p1 = { x: cx, y: 34 }
  const p2 = { x: 289, y: 98 }
  const chars = 'スラジェ'
  const ts = [0.22, 0.4, 0.58, 0.76]
  const fontSize = 32
  const arch = [...chars]
    .map((ch, i) => {
      const { x, y } = arcPoint(p0, p1, p2, ts[i])
      const rot = arcTangentDeg(p0, p1, p2, ts[i])
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="sans-serif" font-size="${fontSize}" font-weight="700" fill="${WHITE}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})">${ch}</text>`
    })
    .join('')
  return Buffer.from(`<svg width="${CANVAS_W}" height="${CANVAS_H}" xmlns="http://www.w3.org/2000/svg">
    ${arch}
    <text x="${cx.toFixed(1)}" y="405" font-family="sans-serif" font-size="34" font-weight="700" fill="${WHITE}" text-anchor="middle" dominant-baseline="middle">Soulage</text>
  </svg>`)
}

function isCream(r, g, b, a) {
  if (a < 40) return true
  const lum = r * 0.299 + g * 0.587 + b * 0.114
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return lum > 228 && max - min < 18
}

function eraseRegion(data, width, box) {
  for (let y = box.top; y < box.top + box.height; y++) {
    for (let x = box.left; x < box.left + box.width; x++) {
      data[(y * width + x) * 4 + 3] = 0
    }
  }
}

async function extractPdfEmblem() {
  const pdfPath = path.join(staticDir, 'incoming', 'soulage-logo-official.pdf')
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
  const source = await sharp(tmpPdfImg)
    .extract({ left, top: 0, width: cropW, height: meta.height })
    .png()
    .toBuffer()

  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const cleaned = Buffer.alloc(data.length)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    if (isCream(r, g, b, a)) {
      cleaned[i + 3] = 0
      continue
    }
    const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255
    cleaned[i] = SITE_WHITE.r
    cleaned[i + 1] = SITE_WHITE.g
    cleaned[i + 2] = SITE_WHITE.b
    cleaned[i + 3] = Math.round(a * Math.min(1, 0.55 + lum * 0.45))
  }

  eraseRegion(cleaned, info.width, { left: 55, top: 135, width: 400, height: 82 })
  eraseRegion(cleaned, info.width, { left: 70, top: 448, width: 330, height: 95 })

  return sharp(cleaned, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 12 })
    .png()
    .toBuffer()
}

async function buildSoulageLogo() {
  const emblem = await extractPdfEmblem()
  const emblemMeta = await sharp(emblem).metadata()

  /** らぽーると同じエンブレムゾーン — 縦いっぱいに配置 */
  const EMBLEM_TOP = 78
  const EMBLEM_H = 318
  const scale = (EMBLEM_H / emblemMeta.height) * 1.14
  const scaledW = Math.round(emblemMeta.width * scale)
  const scaledH = EMBLEM_H

  let emblemScaled = await sharp(emblem).resize({ width: scaledW, height: scaledH }).png().toBuffer()

  if (scaledW > CANVAS_W) {
    const cropLeft = Math.round((scaledW - CANVAS_W) / 2)
    emblemScaled = await sharp(emblemScaled)
      .extract({ left: cropLeft, top: 0, width: CANVAS_W, height: scaledH })
      .png()
      .toBuffer()
  }

  const finalEmblemMeta = await sharp(emblemScaled).metadata()
  const emblemLeft = Math.round((CANVAS_W - finalEmblemMeta.width) / 2)

  let composed = await sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: emblemScaled, left: emblemLeft, top: EMBLEM_TOP },
      { input: createLabelSvg(), left: 0, top: 0 },
    ])
    .png()
    .toBuffer()

  /** らぽーると同じ規則：341×439 を端から端まで使う（cover で余白ゼロ） */
  const trimmed = await sharp(composed).trim({ threshold: 10 }).png().toBuffer()
  composed = await sharp(trimmed)
    .resize(CANVAS_W, CANVAS_H, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer()

  const outPath = path.join(staticDir, 'soulage-logo-site-toned.png')
  await sharp(composed).png({ compressionLevel: 9 }).toFile(outPath)
  const meta = await sharp(outPath).metadata()
  console.log(`[soulage-logo] ${outPath} (${meta.width}x${meta.height})`)
}

await buildSoulageLogo()
