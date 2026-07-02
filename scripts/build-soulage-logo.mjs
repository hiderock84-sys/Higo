#!/usr/bin/env node
/**
 * スラジェロゴ — らぽーる計測レイアウト完全一致（341×439）。
 *
 * 実測（rapport-logo-site-toned.png）:
 *   上部アーチ  span ~242, y 0–96
 *   中央紋章    span 341, y 90–355
 *   下部英字    span 282, x 32, y 366
 */
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { access, createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const staticDir = path.join(root, 'public', 'static')
const notoFontPath = path.join(staticDir, 'incoming', 'fonts', 'NotoSansJP.ttf')

const CANVAS_W = 341
const CANVAS_H = 439
const WHITE = '#eef8fa'
const JP_FONT = `'Noto Sans JP', sans-serif`
const EN_FONT = `'Inter', 'Plus Jakarta Sans', sans-serif`

const LAYOUT = {
  emblem: { left: 0, top: 90, width: 341, height: 265 },
  bottom: { left: 32, top: 366, width: 282 },
  arch: [
    { ch: 'ス', x: 68, y: 80, size: 36 },
    { ch: 'ラ', x: 128, y: 48, size: 36 },
    { ch: 'ジェ', x: 224, y: 66, size: 38 },
  ],
}

function notoFontFaceCss() {
  return `@font-face { font-family: 'Noto Sans JP'; src: url('file://${notoFontPath}'); font-weight: 700; }`
}

async function ensureNotoFont() {
  try {
    await access(notoFontPath)
  } catch {
    await mkdir(path.dirname(notoFontPath), { recursive: true })
    const response = await fetch(
      'https://github.com/google/fonts/raw/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf'
    )
    if (!response.ok) throw new Error(`Noto Sans JP の取得に失敗: ${response.status}`)
    await pipeline(response.body, createWriteStream(notoFontPath))
    console.log('[soulage-logo] Noto Sans JP を取得しました')
  }
}

function createEmblemSvg() {
  const cx = CANVAS_W / 2
  const leaf = (cx, cy, rx, ry, rot, sw = 2.4) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${WHITE}" stroke-width="${sw}" transform="rotate(${rot} ${cx} ${cy})"/>`

  return Buffer.from(
    `<svg width="${CANVAS_W}" height="${CANVAS_H}" xmlns="http://www.w3.org/2000/svg">` +
      `<path d="M 18 358 C -8 310, -4 236, 16 168 C 36 108, 68 62, 108 34 C 84 78, 62 128, 50 182 C 36 244, 40 304, 62 346" fill="none" stroke="${WHITE}" stroke-width="3.2" stroke-linecap="round"/>` +
      `<path d="M ${CANVAS_W - 18} 358 C ${CANVAS_W + 8} 310, ${CANVAS_W + 4} 236, ${CANVAS_W - 16} 168 C ${CANVAS_W - 36} 108, ${CANVAS_W - 68} 62, ${CANVAS_W - 108} 34 C ${CANVAS_W - 84} 78, ${CANVAS_W - 62} 128, ${CANVAS_W - 50} 182 C ${CANVAS_W - 36} 244, ${CANVAS_W - 40} 304, ${CANVAS_W - 62} 346" fill="none" stroke="${WHITE}" stroke-width="3.2" stroke-linecap="round"/>` +
      leaf(42, 306, 12, 6.5, -30) +
      leaf(28, 252, 12, 6.5, -50) +
      leaf(36, 198, 11, 6, -68) +
      leaf(58, 148, 10, 5.5, -84) +
      leaf(92, 102, 10, 5.5, -100) +
      leaf(CANVAS_W - 42, 306, 12, 6.5, 30) +
      leaf(CANVAS_W - 28, 252, 12, 6.5, 50) +
      leaf(CANVAS_W - 36, 198, 11, 6, 68) +
      leaf(CANVAS_W - 58, 148, 10, 5.5, 84) +
      leaf(CANVAS_W - 92, 102, 10, 5.5, 100) +
      leaf(cx - 50, 336, 9, 5, -12) +
      leaf(cx + 50, 336, 9, 5, 12) +
      `<circle cx="56" cy="232" r="3" fill="${WHITE}"/><circle cx="42" cy="280" r="2.6" fill="${WHITE}"/>` +
      `<circle cx="${CANVAS_W - 56}" cy="232" r="3" fill="${WHITE}"/><circle cx="${CANVAS_W - 42}" cy="280" r="2.6" fill="${WHITE}"/>` +
      `<g stroke="${WHITE}" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M ${cx} 168 L 232 214 L 232 286 L 109 286 L 109 214 Z"/>` +
      `<path d="M ${cx} 168 L 109 214"/><path d="M ${cx} 168 L 232 214"/>` +
      `<rect x="144" y="234" width="38" height="48" rx="2"/>` +
      `<path d="M ${cx} 192 Q ${cx} 236 ${cx} 258" stroke-width="2.6"/>` +
      `<path d="M ${cx} 204 Q ${cx - 18} 220 ${cx - 26} 240" stroke-width="2.2"/>` +
      `<path d="M ${cx} 204 Q ${cx + 18} 220 ${cx + 26} 240" stroke-width="2.2"/>` +
      `</g>` +
      `<path d="M ${cx} 226 Q ${cx - 10} 244 ${cx} 262 Q ${cx + 10} 244 ${cx} 226 Z" fill="none" stroke="${WHITE}" stroke-width="2.4"/>` +
      `<path d="M ${cx - 58} 344 Q ${cx} 358 ${cx + 58} 344" fill="none" stroke="${WHITE}" stroke-width="2.6" stroke-linecap="round"/>` +
      `</svg>`
  )
}

async function renderGlyph(ch, size) {
  const svg = Buffer.from(
    `<svg width="160" height="96" xmlns="http://www.w3.org/2000/svg">` +
      `<defs><style>${notoFontFaceCss()}</style></defs>` +
      `<text x="80" y="56" font-family="${JP_FONT}" font-size="${size}" font-weight="700" fill="${WHITE}" text-anchor="middle" dominant-baseline="middle">${ch}</text>` +
      `</svg>`
  )
  return sharp(svg).trim({ threshold: 1 }).png().toBuffer()
}

async function createArchLayer() {
  const layers = []
  for (const { ch, x, y, size } of LAYOUT.arch) {
    const glyph = await renderGlyph(ch, size)
    const meta = await sharp(glyph).metadata()
    layers.push({ input: glyph, left: Math.round(x - meta.width / 2), top: Math.round(y - meta.height / 2) })
  }
  return sharp({
    create: { width: CANVAS_W, height: CANVAS_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(layers)
    .png()
    .toBuffer()
}

async function createBottomLayer() {
  let label = await sharp(
    Buffer.from(
      `<svg width="420" height="96" xmlns="http://www.w3.org/2000/svg">` +
        `<text x="210" y="58" font-family="${EN_FONT}" font-size="48" font-weight="700" fill="${WHITE}" text-anchor="middle" dominant-baseline="middle">Soulage</text></svg>`
    )
  )
    .trim({ threshold: 1 })
    .png()
    .toBuffer()
  label = await sharp(label).resize({ width: LAYOUT.bottom.width }).png().toBuffer()
  return sharp({
    create: { width: CANVAS_W, height: CANVAS_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: label, left: LAYOUT.bottom.left, top: LAYOUT.bottom.top }])
    .png()
    .toBuffer()
}

async function buildSoulageLogo() {
  await ensureNotoFont()

  let emblem = await sharp(createEmblemSvg()).png().toBuffer()
  emblem = await sharp(emblem)
    .extract({ left: 0, top: LAYOUT.emblem.top, width: CANVAS_W, height: LAYOUT.emblem.height })
    .png()
    .toBuffer()
  emblem = await sharp(emblem)
    .resize(LAYOUT.emblem.width, LAYOUT.emblem.height, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer()

  const [archLayer, bottomLayer] = await Promise.all([createArchLayer(), createBottomLayer()])

  const composed = await sharp({
    create: { width: CANVAS_W, height: CANVAS_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: emblem, left: LAYOUT.emblem.left, top: LAYOUT.emblem.top },
      { input: archLayer, left: 0, top: 0 },
      { input: bottomLayer, left: 0, top: 0 },
    ])
    .png()
    .toBuffer()

  const outPath = path.join(staticDir, 'soulage-logo-site-toned.png')
  await sharp(composed).png({ compressionLevel: 9 }).toFile(outPath)

  const { data, info } = await sharp(outPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let ink = 0
  for (let i = 3; i < data.length; i += 4) if (data[i] > 20) ink++
  console.log(
    `[soulage-logo] ${outPath} (${CANVAS_W}x${CANVAS_H}) ink ${((ink / (info.width * info.height)) * 100).toFixed(1)}%`
  )
}

await buildSoulageLogo()
