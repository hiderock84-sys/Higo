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

function getGoldLogoBbox(data, width, height) {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const max = Math.max(r, g, b)
      const isLogoInk = max > 165 && r > 115 && r + g > b * 1.35 && r - b > 20

      if (isLogoInk) {
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

async function processSoulage() {
  const input = path.join(staticDir, 'soulage-logo.png')
  const { data, info } = await rawFromSharp(sharp(input))
  const box = getGoldLogoBbox(data, info.width, info.height)

  let source = sharp(input)
  if (box) {
    const pad = 4
    source = source.extract({
      left: Math.max(0, box.minX - pad),
      top: Math.max(0, box.minY - pad),
      width: Math.min(info.width, box.maxX - box.minX + 1 + pad * 2),
      height: Math.min(info.height, box.maxY - box.minY + 1 + pad * 2),
    })
  }

  const cropped = await rawFromSharp(source)
  const cleaned = Buffer.alloc(cropped.data.length)

  for (let i = 0; i < cropped.info.width * cropped.info.height; i++) {
    const o = i * 4
    const r = cropped.data[o]
    const g = cropped.data[o + 1]
    const b = cropped.data[o + 2]
    const a = cropped.data[o + 3]
    const max = Math.max(r, g, b)
    const isLogoInk = max > 150 && r > 100 && r + g > b * 1.25 && r - b > 15

    if (a < 8 || !isLogoInk) {
      cleaned[o + 3] = 0
      continue
    }

    const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255
    cleaned[o] = SITE_WHITE.r
    cleaned[o + 1] = SITE_WHITE.g
    cleaned[o + 2] = SITE_WHITE.b
    cleaned[o + 3] = Math.round(a * Math.min(1, 0.4 + lum * 0.6))
  }

  await sharp(cleaned, { raw: { width: cropped.info.width, height: cropped.info.height, channels: 4 } })
    .trim({ threshold: 12 })
    .png({ compressionLevel: 9 })
    .toFile(path.join(staticDir, 'soulage-wreath-logo.png'))
  console.log('[logo] soulage-wreath-logo.png')
}

await processHigonoieHeader()
await processHigonoieFull()
await processRapport()
await processSoulage()

console.log('[logo] Done.')
