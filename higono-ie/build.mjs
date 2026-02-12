import { mkdir, rm, cp, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFile = fileURLToPath(import.meta.url)
const subprojectRoot = path.dirname(currentFile)
const rootDir = path.resolve(subprojectRoot, '..')
const rootDist = path.join(rootDir, 'dist')
const fallbackIndex = path.join(rootDir, 'index.html')
const fallbackStyle = path.join(rootDir, 'public', 'static', 'style.css')
const distDir = path.join(subprojectRoot, 'dist')
const buildDir = path.join(subprojectRoot, 'build')
const outDir = path.join(subprojectRoot, 'out')
const outputDir = path.join(subprojectRoot, 'output')
const cloudflareOutputDir = path.join(subprojectRoot, '.output', 'public')
const targets = [distDir, buildDir, outDir, outputDir, cloudflareOutputDir]

async function ensureFromRootDist() {
  for (const target of targets) {
    await rm(target, { recursive: true, force: true })
    await mkdir(path.dirname(target), { recursive: true })
    await cp(rootDist, target, { recursive: true })
  }
}

async function ensureFromFallback() {
  const html = await readFile(fallbackIndex, 'utf8')
  const css = await readFile(fallbackStyle, 'utf8')

  for (const target of targets) {
    await rm(target, { recursive: true, force: true })
    await mkdir(path.join(target, 'static'), { recursive: true })
    await writeFile(path.join(target, 'index.html'), html)
    await writeFile(path.join(target, 'static', 'style.css'), css)
  }
}

try {
  await ensureFromRootDist()
} catch {
  await ensureFromFallback()
}
