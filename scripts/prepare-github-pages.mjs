#!/usr/bin/env node
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const outDir = path.join(root, 'dist-pages')
const baseHref = (process.env.GITHUB_PAGES_BASE || '/Higo/').replace(/\/?$/, '/') 

async function main() {
  await mkdir(outDir, { recursive: true })
  await cp(distDir, outDir, { recursive: true })

  const indexPath = path.join(outDir, 'index.html')
  let html = await readFile(indexPath, 'utf8')
  if (!html.includes('<base ')) {
    html = html.replace('<head>', `<head>\n  <base href="${baseHref}">`)
  }
  await writeFile(indexPath, html)
  await writeFile(path.join(outDir, '404.html'), html)
  console.log(`[github-pages] Prepared ${outDir} with base href ${baseHref}`)
}

main().catch((err) => {
  console.error('[github-pages] Failed:', err.message)
  process.exit(1)
})
