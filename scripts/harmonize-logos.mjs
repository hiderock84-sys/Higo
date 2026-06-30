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

async function saveWhiteLogo(pngBuffer, outputName) {
  const { data, info } = await rawFromSharp(sharp(pngBuffer))
  const out = Buffer.alloc(data.length)
  applySiteWhite(data, info, out)
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 12 })
    .png({ compressionLevel: 9 })
    .toFile(path.join(staticDir, outputName))
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
  const gap = Math.max(6, Math.round(info.height * 0.015))
  const outW = Math.max(iconW, textW)
  const outH = iconH + gap + textH
  const out = Buffer.alloc(outW * outH * 4)

  blitRegion(data, info.width, out, outW, iconBox, 0, 0)
  blitRegion(data, info.width, out, outW, textBox, 0, iconH + gap)

  await saveWhiteLogo(
    await sharp(out, { raw: { width: outW, height: outH, channels: 4 } }).png().toBuffer(),
    'soulage-logo-site-toned.png'
  )
}

await processHigonoieHeader()
await processHigonoieFull()
await processRapport()
await processSoulage()

console.log('[logo] Done.')
