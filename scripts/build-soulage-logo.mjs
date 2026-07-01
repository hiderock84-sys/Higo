#!/usr/bin/env node
/**
 * スラジェロゴを SVG から一から生成（らぽーると同じ 341×439 / 2属性規則）。
 * PDF・旧 soulage-wreath-logo.png には依存しない。
 */
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const staticDir = path.join(root, 'public', 'static')

const CANVAS_W = 341
const CANVAS_H = 439
const WHITE = '#eef8fa'

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

function arcText(chars, ts, p0, p1, p2, fontSize) {
  return [...chars]
    .map((ch, i) => {
      const { x, y } = arcPoint(p0, p1, p2, ts[i])
      const rot = arcTangentDeg(p0, p1, p2, ts[i])
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="sans-serif" font-size="${fontSize}" font-weight="700" fill="${WHITE}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})">${ch}</text>`
    })
    .join('\n    ')
}

/** 月桂冠の葉（楕円＋回転） */
function leaf(cx, cy, w, h, rot) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${w}" ry="${h}" fill="none" stroke="${WHITE}" stroke-width="1.6" transform="rotate(${rot} ${cx} ${cy})"/>`
}

function createSoulageLogoSvg() {
  const cx = CANVAS_W / 2
  const topArc = {
    p0: { x: 52, y: 98 },
    p1: { x: cx, y: 34 },
    p2: { x: 289, y: 98 },
    fontSize: 32,
    chars: 'スラジェ',
    ts: [0.22, 0.4, 0.58, 0.76],
  }

  const house = `
    <g stroke="${WHITE}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M ${cx} 178 L 206 218 L 206 268 L 135 268 L 135 218 Z"/>
      <path d="M ${cx} 178 L 135 218"/>
      <path d="M ${cx} 178 L 206 218"/>
      <path d="M ${cx} 198 Q ${cx} 228 ${cx} 248" stroke-width="1.8"/>
      <path d="M ${cx} 210 Q ${cx - 14} 222 ${cx - 20} 236" stroke-width="1.4"/>
      <path d="M ${cx} 210 Q ${cx + 14} 222 ${cx + 20} 236" stroke-width="1.4"/>
      <path d="M ${cx} 215 Q ${cx - 8} 225 ${cx - 10} 235" stroke-width="1.2"/>
      <path d="M ${cx} 215 Q ${cx + 8} 225 ${cx + 10} 235" stroke-width="1.2"/>
    </g>`

  const wreathLeft = `
    <path d="M 88 332
      C 62 300, 58 250, 72 210
      C 84 178, 108 152, 132 138
      C 118 160, 102 188, 96 218
      C 88 252, 92 290, 108 318" fill="none" stroke="${WHITE}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M 108 318 C 98 308, 92 296, 88 332" fill="none" stroke="${WHITE}" stroke-width="2.2" stroke-linecap="round"/>`

  const wreathRight = `
    <path d="M ${CANVAS_W - 88} 332
      C ${CANVAS_W - 62} 300, ${CANVAS_W - 58} 250, ${CANVAS_W - 72} 210
      C ${CANVAS_W - 84} 178, ${CANVAS_W - 108} 152, ${CANVAS_W - 132} 138
      C ${CANVAS_W - 118} 160, ${CANVAS_W - 102} 188, ${CANVAS_W - 96} 218
      C ${CANVAS_W - 88} 252, ${CANVAS_W - 92} 290, ${CANVAS_W - 108} 318" fill="none" stroke="${WHITE}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M ${CANVAS_W - 108} 318 C ${CANVAS_W - 98} 308, ${CANVAS_W - 92} 296, ${CANVAS_W - 88} 332" fill="none" stroke="${WHITE}" stroke-width="2.2" stroke-linecap="round"/>`

  const leaves = [
    leaf(78, 285, 7, 4, -35),
    leaf(68, 248, 7, 4, -55),
    leaf(74, 208, 7, 4, -70),
    leaf(92, 172, 6, 3.5, -85),
    leaf(118, 148, 6, 3.5, -100),
    leaf(104, 298, 6, 3.5, -20),
    leaf(CANVAS_W - 78, 285, 7, 4, 35),
    leaf(CANVAS_W - 68, 248, 7, 4, 55),
    leaf(CANVAS_W - 74, 208, 7, 4, 70),
    leaf(CANVAS_W - 92, 172, 6, 3.5, 85),
    leaf(CANVAS_W - 118, 148, 6, 3.5, 100),
    leaf(CANVAS_W - 104, 298, 6, 3.5, 20),
    leaf(cx - 38, 318, 5, 3, -15),
    leaf(cx + 38, 318, 5, 3, 15),
  ].join('\n    ')

  const berries = [
    `<circle cx="96" cy="232" r="2.2" fill="${WHITE}"/>`,
    `<circle cx="88" cy="268" r="2" fill="${WHITE}"/>`,
    `<circle cx="${CANVAS_W - 96}" cy="232" r="2.2" fill="${WHITE}"/>`,
    `<circle cx="${CANVAS_W - 88}" cy="268" r="2" fill="${WHITE}"/>`,
  ].join('\n    ')

  return Buffer.from(`<svg width="${CANVAS_W}" height="${CANVAS_H}" xmlns="http://www.w3.org/2000/svg">
    ${arcText(topArc.chars, topArc.ts, topArc.p0, topArc.p1, topArc.p2, topArc.fontSize)}
    ${wreathLeft}
    ${wreathRight}
    ${leaves}
    ${berries}
    ${house}
    <text x="${cx.toFixed(1)}" y="405" font-family="sans-serif" font-size="34" font-weight="700" fill="${WHITE}" text-anchor="middle" dominant-baseline="middle">Soulage</text>
  </svg>`)
}

async function buildSoulageLogo() {
  const svg = createSoulageLogoSvg()
  const png = await sharp(svg).png().toBuffer()
  const outPath = path.join(staticDir, 'soulage-logo-site-toned.png')
  await sharp(png).png({ compressionLevel: 9 }).toFile(outPath)
  const meta = await sharp(outPath).metadata()
  console.log(`[soulage-logo] ${outPath} (${meta.width}x${meta.height})`)
}

await buildSoulageLogo()
