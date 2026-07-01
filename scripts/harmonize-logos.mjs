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

async function scaleContentToContainCanvas(contentBuffer, canvasW, canvasH) {
  const trimmed = await sharp(contentBuffer).trim({ threshold: 12 }).png().toBuffer()
  const meta = await sharp(trimmed).metadata()
  const scale = Math.min(canvasW / meta.width, canvasH / meta.height)
  const newW = Math.round(meta.width * scale)
  const newH = Math.round(meta.height * scale)
  const scaled = await sharp(trimmed).resize({ width: newW, height: newH }).png().toBuffer()

  return sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: scaled, left: Math.round((canvasW - newW) / 2), top: Math.round((canvasH - newH) / 2) }])
    .png()
    .toBuffer()
}

async function processSoulage() {
  const input = path.join(staticDir, 'soulage-logo.png')
  const rapportRef = await sharp(path.join(staticDir, 'rapport-logo-site-toned.png')).metadata()
  const CANVAS_W = rapportRef.width || 341
  const CANVAS_H = rapportRef.height || 439

  const { data, info } = await rawFromSharp(sharp(input))
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

  const toned = await sharp(cleaned, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer()

  const composed = await scaleContentToContainCanvas(toned, CANVAS_W, CANVAS_H)
  await saveWhiteLogo(composed, 'soulage-wreath-logo.png', { trim: false })
}

await processHigonoieHeader()
await processHigonoieFull()
await processRapport()
await processSoulage()

console.log('[logo] Done.')
