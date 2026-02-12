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

async function ensureFromRootDist() {
  await rm(distDir, { recursive: true, force: true })
  await rm(buildDir, { recursive: true, force: true })
  await cp(rootDist, distDir, { recursive: true })
  await cp(rootDist, buildDir, { recursive: true })
}

async function ensureFromFallback() {
  await rm(distDir, { recursive: true, force: true })
  await rm(buildDir, { recursive: true, force: true })
  await mkdir(path.join(distDir, 'static'), { recursive: true })
  await mkdir(path.join(buildDir, 'static'), { recursive: true })

  const html = await readFile(fallbackIndex, 'utf8')
  const css = await readFile(fallbackStyle, 'utf8')

  await writeFile(path.join(distDir, 'index.html'), html)
  await writeFile(path.join(distDir, 'static', 'style.css'), css)
  await writeFile(path.join(buildDir, 'index.html'), html)
  await writeFile(path.join(buildDir, 'static', 'style.css'), css)
}

try {
  await ensureFromRootDist()
} catch {
  await ensureFromFallback()
}
