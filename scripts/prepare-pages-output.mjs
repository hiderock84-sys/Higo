import { mkdir, rm, cp, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFile = fileURLToPath(import.meta.url)
const projectRoot = path.resolve(path.dirname(currentFile), '..')
const distDir = path.join(projectRoot, 'dist')
const targets = [
  path.join(projectRoot, 'build'),
  path.join(projectRoot, 'hidonoie', 'dist'),
  path.join(projectRoot, 'hidonoie', 'build'),
]
const cleanupAssets = [
  path.join(projectRoot, 'dist', 'static', 'logo-design.jpg'),
  path.join(projectRoot, 'build', 'static', 'logo-design.jpg'),
  path.join(projectRoot, 'hidonoie', 'dist', 'static', 'logo-design.jpg'),
  path.join(projectRoot, 'hidonoie', 'build', 'static', 'logo-design.jpg'),
]

async function copyDistToTargets() {
  for (const target of targets) {
    await rm(target, { recursive: true, force: true })
    await mkdir(path.dirname(target), { recursive: true })
    await cp(distDir, target, { recursive: true })
  }
}

async function syncRootFilesForSubproject() {
  const sourceIndex = path.join(projectRoot, 'index.html')
  const targetIndex = path.join(projectRoot, 'hidonoie', 'index.html')
  const sourceStyle = path.join(projectRoot, 'public', 'static', 'style.css')
  const targetStyle = path.join(projectRoot, 'hidonoie', 'static', 'style.css')

  const html = await readFile(sourceIndex, 'utf8')
  await mkdir(path.dirname(targetStyle), { recursive: true })
  await writeFile(targetIndex, html)
  await writeFile(targetStyle, await readFile(sourceStyle, 'utf8'))
}

async function cleanupUnusedAssets() {
  for (const assetPath of cleanupAssets) {
    await rm(assetPath, { force: true })
  }
}

await copyDistToTargets()
await syncRootFilesForSubproject()
await cleanupUnusedAssets()
