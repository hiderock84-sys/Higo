#!/usr/bin/env node
/**
 * ロゴをサイトのティール／ネイビー基調に合わせて調整し、黒背景マットを除去する。
 */
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const staticDir = path.join(root, 'public', 'static')

const BRAND_TINT = { r: 168, g: 228, b: 232 } // #a8e4e8 — ヘッダーアクセントに近い色
const FACILITY_TINT = { r: 184, g: 232, b: 236 } // #b8e8ec — カバー上のロゴ用

function blendChannel(value, tint, amount) {
  return Math.round(value * (1 - amount) + tint * amount)
}

async function toneHigonoieLogo(inputName, outputName) {
  const input = path.join(staticDir, inputName)
  const output = path.join(staticDir, outputName)
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const out = Buffer.from(data)

  for (let i = 0; i < info.width * info.height; i++) {
    const o = i * 4
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    const a = data[o + 3]
    if (a < 8) continue

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const sat = max === 0 ? 0 : (max - min) / max

    if (sat > 0.08) {
      const amount = 0.42
      out[o] = blendChannel(r, BRAND_TINT.r, amount)
      out[o + 1] = blendChannel(g, BRAND_TINT.g, amount)
      out[o + 2] = blendChannel(b, BRAND_TINT.b, amount)
    } else {
      const amount = 0.35
      const ink = { r: 196, g: 214, b: 220 }
      out[o] = blendChannel(r, ink.r, amount)
      out[o + 1] = blendChannel(g, ink.g, amount)
      out[o + 2] = blendChannel(b, ink.b, amount)
    }
  }

  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .modulate({ saturation: 0.72, brightness: 1.04 })
    .png({ compressionLevel: 9 })
    .toFile(output)
  console.log(`[logo] ${outputName}`)
}

async function removeBlackMatte(inputName, outputName, tint = FACILITY_TINT, { creamThreshold = 175 } = {}) {
  const input = path.join(staticDir, inputName)
  const output = path.join(staticDir, outputName)
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const out = Buffer.from(data)

  for (let i = 0; i < info.width * info.height; i++) {
    const o = i * 4
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)

    if (max < 42) {
      out[o + 3] = 0
      continue
    }

    if (min > creamThreshold - 40 && max > creamThreshold) {
      const amount = 0.28
      out[o] = blendChannel(r, tint.r, amount)
      out[o + 1] = blendChannel(g, tint.g, amount)
      out[o + 2] = blendChannel(b, tint.b, amount)
    } else if (max - min < 28 && max > 90 && max < 210) {
      const amount = 0.18
      out[o] = blendChannel(r, tint.r, amount)
      out[o + 1] = blendChannel(g, tint.g, amount)
      out[o + 2] = blendChannel(b, tint.b, amount)
    }
  }

  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(output)
  console.log(`[logo] ${outputName}`)
}

async function toneSoulageLogo(inputName, outputName) {
  const input = path.join(staticDir, inputName)
  const output = path.join(staticDir, outputName)
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const out = Buffer.from(data)

  for (let i = 0; i < info.width * info.height; i++) {
    const o = i * 4
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    const max = Math.max(r, g, b)

    if (max < 42) {
      out[o + 3] = 0
      continue
    }

    const lum = (r + g + b) / 3
    const amount = lum > 140 ? 0.22 : 0.12
    out[o] = blendChannel(r, BRAND_TINT.r, amount)
    out[o + 1] = blendChannel(g, BRAND_TINT.g, amount)
    out[o + 2] = blendChannel(b, BRAND_TINT.b, amount)
    out[o + 3] = Math.min(255, Math.round(data[o + 3] * (0.82 + (lum / 255) * 0.18)))
  }

  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(output)
  console.log(`[logo] ${outputName}`)
}

await toneHigonoieLogo(
  'higonoie-header-logo-complete-final-cutout.png',
  'higonoie-header-logo-site-toned.png'
)
await toneHigonoieLogo('higonoie-full-logo-transparent.png', 'higonoie-full-logo-site-toned.png')
await removeBlackMatte('rapport-logo-light.png', 'rapport-logo-site-toned.png')
await toneSoulageLogo('soulage-logo.png', 'soulage-logo-site-toned.png')

console.log('[logo] Done.')
