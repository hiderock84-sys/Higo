#!/usr/bin/env node
/**
 * ロゴをサイトのダークUI向けに統一（左揃え・単色ホワイト）。
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

function getRegionBbox(data, width, height, yStart, yEnd) {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = yStart; y < yEnd; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3]
      if (a > 16) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }

  if (maxX < minX) return null
  return { minX, minY, maxX, maxY }
}

function blitRegion(data, srcWidth, out, outWidth, srcBox, destX, destY) {
  for (let y = srcBox.minY; y <= srcBox.maxY; y++) {
    for (let x = srcBox.minX; x <= srcBox.maxX; x++) {
      const si = (y * srcWidth + x) * 4
      const dx = destX + (x - srcBox.minX)
      const dy = destY + (y - srcBox.minY)
      const di = (dy * outWidth + dx) * 4
      out[di] = data[si]
      out[di + 1] = data[si + 1]
      out[di + 2] = data[si + 2]
      out[di + 3] = data[si + 3]
    }
  }
}

async function scaleContentToCoverCanvas(contentBuffer, canvasW, canvasH) {
  const trimmed = await sharp(contentBuffer).trim({ threshold: 12 }).png().toBuffer()
  const meta = await sharp(trimmed).metadata()
  const scale = Math.max(canvasW / meta.width, canvasH / meta.height)
  const newW = Math.round(meta.width * scale)
  const newH = Math.round(meta.height * scale)
  const left = Math.max(0, Math.round((newW - canvasW) / 2))
  const top = Math.max(0, Math.round((newH - canvasH) / 2))

  return sharp(trimmed)
    .resize({ width: newW, height: newH })
    .extract({ left, top, width: canvasW, height: canvasH })
    .png()
    .toBuffer()
}

async function processSoulage() {
  const input = path.join(staticDir, 'soulage-logo.png')
  const { data, info } = await rawFromSharp(sharp(input))

  const splitY = Math.floor(info.height * 0.56)
  const iconBox = getRegionBbox(data, info.width, info.height, 0, splitY)
  const textBox = getRegionBbox(data, info.width, info.height, splitY, info.height)

  if (!iconBox || !textBox) {
    await saveWhiteLogo(await sharp(input).png().toBuffer(), 'soulage-logo-site-toned.png')
    return
  }

  const iconW = iconBox.maxX - iconBox.minX + 1
  const iconH = iconBox.maxY - iconBox.minY + 1
  const textW = textBox.maxX - textBox.minX + 1
  const textH = textBox.maxY - textBox.minY + 1

  /** フッター3ロゴの基準 = らぽーる（341×439）。英文27%・エンブレム主体・中央揃え */
  const rapportRef = await sharp(path.join(staticDir, 'rapport-logo-site-toned.png')).metadata()
  const CANVAS_W = rapportRef.width || 341
  const CANVAS_H = rapportRef.height || 439
  const iconTargetH = Math.round(CANVAS_H * 0.54)
  const textTargetH = Math.round(CANVAS_H * 0.28)
  const gap = Math.round(CANVAS_H * 0.04)
  const contentH = iconTargetH + gap + textTargetH
  const topPad = Math.max(0, Math.round((CANVAS_H - contentH) / 2))

  const iconBuffer = await sharp(input)
    .extract({ left: iconBox.minX, top: iconBox.minY, width: iconW, height: iconH })
    .resize({ height: iconTargetH })
    .png()
    .toBuffer()

  const textBuffer = await sharp(input)
    .extract({ left: textBox.minX, top: textBox.minY, width: textW, height: textH })
    .resize({ height: textTargetH })
    .png()
    .toBuffer()

  const iconMeta = await sharp(iconBuffer).metadata()
  const textMeta = await sharp(textBuffer).metadata()
  const iconLeft = Math.round((CANVAS_W - iconMeta.width) / 2)
  const textLeft = Math.round((CANVAS_W - textMeta.width) / 2)

  const draft = await sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: iconBuffer, left: iconLeft, top: topPad },
      { input: textBuffer, left: textLeft, top: topPad + iconTargetH + gap },
    ])
    .png()
    .toBuffer()

  /** らぽーると同じキャンバス占有率になるよう全体を拡大して中央配置 */
  const composed = await scaleContentToCoverCanvas(draft, CANVAS_W, CANVAS_H)

  await saveWhiteLogo(composed, 'soulage-logo-site-toned.png', { trim: false })
}

await processHigonoieHeader()
await processHigonoieFull()
await processRapport()
await processSoulage()

console.log('[logo] Done.')
