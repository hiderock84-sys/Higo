#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { access, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const outDir = path.join(root, 'release')
const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
const zipName = `higonoie-dist-${stamp}.zip`
const zipPath = path.join(outDir, zipName)

function run(cmd, args, cwd = root) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: 'inherit' })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))))
    child.on('error', reject)
  })
}

async function main() {
  await run('npm', ['run', 'build'])
  await access(path.join(distDir, 'index.html'))
  await mkdir(outDir, { recursive: true })
  await run('zip', ['-r', zipPath, '.'], distDir)
  console.log(`\n[package] Created: ${zipPath}`)
  console.log('[package] Upload: Cloudflare Dashboard → Workers & Pages → higo → Create deployment → Upload assets')
}

main().catch((err) => {
  console.error('[package] Failed:', err.message)
  process.exit(1)
})
