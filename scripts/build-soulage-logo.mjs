#!/usr/bin/env node
/**
 * スラジェロゴ — らぽーる計測レイアウト完全一致（341×439）。
 * デザイン方針: 線画ではなく塗り要素で視覚的重さをらぽーるに合わせる。
 *
 * 実測（rapport-logo-site-toned.png）:
 *   上部アーチ  span ~246, y 0–96
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
    { ch: 'ス', x: 73, y: 63, size: 48 },
    { ch: 'ラ', x: 150, y: 31, size: 48 },
    { ch: 'ジェ', x: 258, y: 53, size: 50 },
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

function leaf(cx, cy, w, h, rot) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${w}" ry="${h}" fill="${WHITE}" transform="rotate(${rot} ${cx} ${cy})"/>`
}

function teardropLeaf(cx, cy, size, rot) {
  const s = size
  return `<path d="M ${cx} ${cy - s} Q ${cx + s * 0.55} ${cy - s * 0.15} ${cx} ${cy + s * 0.85} Q ${cx - s * 0.55} ${cy - s * 0.15} ${cx} ${cy - s} Z" fill="${WHITE}" transform="rotate(${rot} ${cx} ${cy})"/>`
}

function createEmblemSvg() {
  const cx = CANVAS_W / 2
  const parts = []

  parts.push(
    `<path d="M 24 348 C 8 300, 10 228, 28 168 C 46 112, 72 72, 104 48 C 88 88, 68 132, 56 182 C 42 238, 44 296, 58 338" fill="none" stroke="${WHITE}" stroke-width="6.5" stroke-linecap="round"/>`,
    `<path d="M ${CANVAS_W - 24} 348 C ${CANVAS_W - 8} 300, ${CANVAS_W - 10} 228, ${CANVAS_W - 28} 168 C ${CANVAS_W - 46} 112, ${CANVAS_W - 72} 72, ${CANVAS_W - 104} 48 C ${CANVAS_W - 88} 88, ${CANVAS_W - 68} 132, ${CANVAS_W - 56} 182 C ${CANVAS_W - 42} 238, ${CANVAS_W - 44} 296, ${CANVAS_W - 58} 338" fill="none" stroke="${WHITE}" stroke-width="6.5" stroke-linecap="round"/>`
  )

  const leftLeaves = [
    [38, 318, 16, 8.5, -28],
    [26, 278, 17, 9, -42],
    [22, 236, 16, 8.5, -58],
    [28, 196, 15, 8, -72],
    [42, 158, 14, 7.5, -86],
    [62, 124, 13, 7, -98],
    [88, 96, 12, 6.5, -108],
    [48, 292, 12, 6.5, -18],
    [34, 252, 13, 7, -35],
    [30, 212, 12, 6.5, -50],
    [36, 174, 12, 6.5, -65],
    [52, 140, 11, 6, -80],
    [74, 110, 11, 6, -92],
    [58, 326, 10, 5.5, -10],
    [18, 248, 11, 6, -52],
    [46, 218, 10, 5.5, -62],
  ]
  for (const [x, y, w, h, r] of leftLeaves) parts.push(leaf(x, y, w, h, r))

  const rightLeaves = leftLeaves.map(([x, y, w, h, r]) => [CANVAS_W - x, y, w, h, -r])
  for (const [x, y, w, h, r] of rightLeaves) parts.push(leaf(x, y, w, h, r))

  const innerLeaves = [
    [cx - 88, 286, 12, -18],
    [cx - 70, 252, 11, -12],
    [cx - 54, 222, 10, -8],
    [cx + 88, 286, 12, 18],
    [cx + 70, 252, 11, 12],
    [cx + 54, 222, 10, 8],
    [cx - 36, 286, 9, -4],
    [cx + 36, 286, 9, 4],
    [cx - 22, 302, 8, 0],
    [cx + 22, 302, 8, 0],
    [cx, 296, 9, 90],
    [cx - 48, 178, 8, -20],
    [cx + 48, 178, 8, 20],
  ]
  for (const [x, y, s, r] of innerLeaves) parts.push(teardropLeaf(x, y, s, r))

  for (const [x, y, r] of [
    [52, 228, 4],
    [40, 268, 3.5],
    [CANVAS_W - 52, 228, 4],
    [CANVAS_W - 40, 268, 3.5],
    [cx - 18, 318, 3.2],
    [cx + 18, 318, 3.2],
    [cx - 34, 328, 2.8],
    [cx + 34, 328, 2.8],
    [cx, 334, 3],
  ]) {
    parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${WHITE}"/>`)
  }

  parts.push(
    `<g fill="${WHITE}" stroke="${WHITE}" stroke-linejoin="round">` +
      `<path d="M ${cx} 176 L 228 218 L 228 288 L 114 288 L 114 218 Z" fill="none" stroke-width="5.2"/>` +
      `<path d="M ${cx} 176 L 114 218 L ${cx} 176 L 228 218" fill="${WHITE}" stroke="none"/>` +
      `<rect x="148" y="238" width="36" height="46" rx="2" fill="${WHITE}" stroke="none"/>` +
      `</g>`
  )

  parts.push(
    teardropLeaf(cx, 248, 18, 0),
    `<path d="M ${cx} 228 L ${cx} 268" stroke="${WHITE}" stroke-width="2.8" stroke-linecap="round"/>`,
    `<path d="M ${cx} 242 Q ${cx - 16} 252 ${cx - 22} 264" fill="none" stroke="${WHITE}" stroke-width="2.6" stroke-linecap="round"/>`,
    `<path d="M ${cx} 242 Q ${cx + 16} 252 ${cx + 22} 264" fill="none" stroke="${WHITE}" stroke-width="2.6" stroke-linecap="round"/>`
  )

  parts.push(
    `<path d="M ${cx - 62} 342 Q ${cx} 356 ${cx + 62} 342" fill="none" stroke="${WHITE}" stroke-width="4.8" stroke-linecap="round"/>`,
    `<circle cx="${cx - 62}" cy="342" r="4" fill="${WHITE}"/>`,
    `<circle cx="${cx + 62}" cy="342" r="4" fill="${WHITE}"/>`
  )

  for (const ox of [-34, 0, 34]) {
    parts.push(
      `<circle cx="${cx + ox}" cy="318" r="6" fill="${WHITE}"/>`,
      teardropLeaf(cx + ox, 306, 8, 0)
    )
  }

  return Buffer.from(
    `<svg width="${CANVAS_W}" height="${CANVAS_H}" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`
  )
}

async function renderGlyph(ch, size) {
  const svg = Buffer.from(
    `<svg width="200" height="120" xmlns="http://www.w3.org/2000/svg">` +
      `<defs><style>${notoFontFaceCss()}</style></defs>` +
      `<text x="100" y="68" font-family="${JP_FONT}" font-size="${size}" font-weight="700" fill="${WHITE}" text-anchor="middle" dominant-baseline="middle">${ch}</text>` +
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
