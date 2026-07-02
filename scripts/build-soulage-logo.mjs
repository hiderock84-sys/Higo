#!/usr/bin/env node
/**
 * スラジェロゴ — SVG から完全新規生成（PDF・旧画像に非依存）。
 * らぽーると同じ 341×439 / 上部アーチ「スラジェ」+ 中央エンブレム + 下部「Soulage」
 */
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { access, mkdir, writeFile } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const staticDir = path.join(root, 'public', 'static')
const notoFontPath = path.join(staticDir, 'incoming', 'fonts', 'NotoSansJP.ttf')

const CANVAS_W = 341
const CANVAS_H = 439
const WHITE = '#eef8fa'
const JP_FONT = `'Noto Sans JP', WenQuanYi Micro Hei, Droid Sans Fallback, sans-serif`
const EN_FONT = 'Inter, Plus Jakarta Sans, sans-serif'

function notoFontFaceCss() {
  return `@font-face { font-family: 'Noto Sans JP'; src: url('file://${notoFontPath}'); font-weight: 700; }`
}

async function ensureNotoFont() {
  try {
    await access(notoFontPath)
    return
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

function leaf(cx, cy, w, h, rot, sw = 3) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${w}" ry="${h}" fill="none" stroke="${WHITE}" stroke-width="${sw}" transform="rotate(${rot} ${cx} ${cy})"/>`
}

/** 横書き「スラジェ」を1枚描画→分割→アーチ配置（ラ/ジェの字形崩れを防ぐ） */
async function createArchLabelLayer() {
  const archUnits = ['ス', 'ラ', 'ジェ']
  const ts = [0.17, 0.46, 0.78]
  const p0 = { x: 48, y: 96 }
  const p1 = { x: CANVAS_W / 2, y: 28 }
  const p2 = { x: 293, y: 96 }

  const lineSvg = Buffer.from(
    `<svg width="420" height="80" xmlns="http://www.w3.org/2000/svg">` +
      `<defs><style>${notoFontFaceCss()}</style></defs>` +
      `<text x="210" y="52" font-family="${JP_FONT}" font-size="38" font-weight="700" fill="${WHITE}" text-anchor="middle" dominant-baseline="middle">スラジェ</text>` +
      `</svg>`
  )

  const trimmedLine = await sharp(lineSvg).trim({ threshold: 1 }).png().toBuffer()
  const trimmedMeta = await sharp(trimmedLine).metadata()
  const { data, info } = await sharp(trimmedLine).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  const colInk = Array.from({ length: info.width }, (_, x) => {
    let n = 0
    for (let y = 0; y < info.height; y++) {
      if (data[(y * info.width + x) * 4 + 3] > 20) n++
    }
    return n
  })

  const gaps = []
  for (let x = 1; x < info.width - 1; x++) {
    if (colInk[x] === 0 && colInk[x - 1] > 0) gaps.push(x)
  }

  if (gaps.length < 2) {
    throw new Error('[soulage-logo] 「スラジェ」の字間検出に失敗しました')
  }

  const segments = [
    { left: 0, width: gaps[0] },
    { left: gaps[0], width: gaps[1] - gaps[0] },
    { left: gaps[1], width: info.width - gaps[1] },
  ]

  const layers = []

  for (let i = 0; i < archUnits.length; i++) {
    const { left, width } = segments[i]
    const glyph = await sharp(trimmedLine)
      .extract({ left, top: 0, width, height: trimmedMeta.height })
      .trim({ threshold: 1 })
      .png()
      .toBuffer()
    const { x, y } = arcPoint(p0, p1, p2, ts[i])
    const rot = arcTangentDeg(p0, p1, p2, ts[i])
    const rotated = await sharp(glyph)
      .rotate(rot, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
    const rMeta = await sharp(rotated).metadata()
    layers.push({
      input: rotated,
      left: Math.round(x - rMeta.width / 2),
      top: Math.round(y - rMeta.height / 2),
    })
  }

  return sharp({
    create: { width: CANVAS_W, height: CANVAS_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(layers)
    .png()
    .toBuffer()
}

function createEmblemSvg() {
  const cx = CANVAS_W / 2

  const house = `
    <g stroke="${WHITE}" stroke-width="4.8" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M ${cx} 158 L 228 208 L 228 282 L 113 282 L 113 208 Z"/>
      <path d="M ${cx} 158 L 113 208"/>
      <path d="M ${cx} 158 L 228 208"/>
      <rect x="148" y="232" width="36" height="50" rx="2"/>
      <path d="M ${cx} 186 Q ${cx} 232 ${cx} 258" stroke-width="3.6"/>
      <path d="M ${cx} 200 Q ${cx - 22} 218 ${cx - 32} 244" stroke-width="3"/>
      <path d="M ${cx} 200 Q ${cx + 22} 218 ${cx + 32} 244" stroke-width="3"/>
      <path d="M ${cx} 208 Q ${cx - 12} 224 ${cx - 14} 242" stroke-width="2.6"/>
      <path d="M ${cx} 208 Q ${cx + 12} 224 ${cx + 14} 242" stroke-width="2.6"/>
    </g>`

  const wreathLeft = `
    <path d="M 62 348
      C 28 304, 18 242, 36 188
      C 52 148, 82 108, 118 82
      C 96 116, 74 162, 64 208
      C 52 262, 56 314, 82 342" fill="none" stroke="${WHITE}" stroke-width="4.2" stroke-linecap="round"/>
    <path d="M 82 342 C 66 326, 58 312, 62 348" fill="none" stroke="${WHITE}" stroke-width="4.2" stroke-linecap="round"/>`

  const wreathRight = `
    <path d="M ${CANVAS_W - 62} 348
      C ${CANVAS_W - 28} 304, ${CANVAS_W - 18} 242, ${CANVAS_W - 36} 188
      C ${CANVAS_W - 52} 148, ${CANVAS_W - 82} 108, ${CANVAS_W - 118} 82
      C ${CANVAS_W - 96} 116, ${CANVAS_W - 74} 162, ${CANVAS_W - 64} 208
      C ${CANVAS_W - 52} 262, ${CANVAS_W - 56} 314, ${CANVAS_W - 82} 342" fill="none" stroke="${WHITE}" stroke-width="4.2" stroke-linecap="round"/>
    <path d="M ${CANVAS_W - 82} 342 C ${CANVAS_W - 66} 326, ${CANVAS_W - 58} 312, ${CANVAS_W - 62} 348" fill="none" stroke="${WHITE}" stroke-width="4.2" stroke-linecap="round"/>`

  const leaves = [
    leaf(64, 292, 10, 5.5, -30, 2.4),
    leaf(52, 248, 10, 5.5, -50, 2.4),
    leaf(58, 202, 9, 5, -68, 2.2),
    leaf(78, 162, 8, 4.5, -82, 2.2),
    leaf(108, 128, 8, 4.5, -98, 2.2),
    leaf(92, 312, 8, 4.5, -18, 2.2),
    leaf(82, 178, 7, 4, -75, 2),
    leaf(CANVAS_W - 64, 292, 10, 5.5, 30, 2.4),
    leaf(CANVAS_W - 52, 248, 10, 5.5, 50, 2.4),
    leaf(CANVAS_W - 58, 202, 9, 5, 68, 2.2),
    leaf(CANVAS_W - 78, 162, 8, 4.5, 82, 2.2),
    leaf(CANVAS_W - 108, 128, 8, 4.5, 98, 2.2),
    leaf(CANVAS_W - 92, 312, 8, 4.5, 18, 2.2),
    leaf(CANVAS_W - 82, 178, 7, 4, 75, 2),
    leaf(cx - 44, 328, 7, 4, -12, 2),
    leaf(cx + 44, 328, 7, 4, 12, 2),
    leaf(cx - 28, 318, 6, 3.5, -8, 2),
    leaf(cx + 28, 318, 6, 3.5, 8, 2),
    leaf(128, 148, 7, 4, -105, 2),
    leaf(CANVAS_W - 128, 148, 7, 4, 105, 2),
  ].join('\n    ')

  const berries = [
    `<circle cx="88" cy="224" r="3" fill="${WHITE}"/>`,
    `<circle cx="74" cy="268" r="2.6" fill="${WHITE}"/>`,
    `<circle cx="102" cy="298" r="2.4" fill="${WHITE}"/>`,
    `<circle cx="${CANVAS_W - 88}" cy="224" r="3" fill="${WHITE}"/>`,
    `<circle cx="${CANVAS_W - 74}" cy="268" r="2.6" fill="${WHITE}"/>`,
    `<circle cx="${CANVAS_W - 102}" cy="298" r="2.4" fill="${WHITE}"/>`,
  ].join('\n    ')

  const ribbon = `
    <path d="M ${cx - 58} 338 Q ${cx} 352 ${cx + 58} 338" fill="none" stroke="${WHITE}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M ${cx - 58} 338 L ${cx - 68} 352 M ${cx + 58} 338 L ${cx + 68} 352" fill="none" stroke="${WHITE}" stroke-width="2.4" stroke-linecap="round"/>`

  const bottomText = `
    <text x="${cx.toFixed(1)}" y="410" font-family="${EN_FONT}" font-size="38" font-weight="700" fill="${WHITE}" text-anchor="middle" dominant-baseline="middle">Soulage</text>`

  return Buffer.from(`<svg width="${CANVAS_W}" height="${CANVAS_H}" xmlns="http://www.w3.org/2000/svg">
    ${wreathLeft}
    ${wreathRight}
    ${leaves}
    ${berries}
    ${ribbon}
    ${house}
    ${bottomText}
  </svg>`)
}

async function buildSoulageLogo() {
  await ensureNotoFont()
  const [archLayer, emblemLayer] = await Promise.all([
    createArchLabelLayer(),
    sharp(createEmblemSvg()).png().toBuffer(),
  ])

  let composed = await sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: emblemLayer, left: 0, top: 0 },
      { input: archLayer, left: 0, top: 0 },
    ])
    .png()
    .toBuffer()

  composed = await sharp(composed)
    .trim({ threshold: 8 })
    .resize(CANVAS_W, CANVAS_H, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer()

  const outPath = path.join(staticDir, 'soulage-logo-site-toned.png')
  await sharp(composed).png({ compressionLevel: 9 }).toFile(outPath)
  const meta = await sharp(outPath).metadata()
  console.log(`[soulage-logo] ${outPath} (${meta.width}x${meta.height})`)
}

await buildSoulageLogo()
