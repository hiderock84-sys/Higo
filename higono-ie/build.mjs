import { mkdir, rm, cp, readFile, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFile = fileURLToPath(import.meta.url)
const subprojectRoot = path.dirname(currentFile)
const rootDir = path.resolve(subprojectRoot, '..')
const rootDist = path.join(rootDir, 'dist')
const fallbackIndex = path.join(rootDir, 'index.html')
const fallbackStaticDir = path.join(rootDir, 'public', 'static')
const distDir = path.join(subprojectRoot, 'dist')
const buildDir = path.join(subprojectRoot, 'build')
const outDir = path.join(subprojectRoot, 'out')
const outputDir = path.join(subprojectRoot, 'output')
const cloudflareOutputDir = path.join(subprojectRoot, '.output', 'public')
const targets = [distDir, buildDir, outDir, outputDir, cloudflareOutputDir]
const localIndex = path.join(subprojectRoot, 'index.html')
const localStaticDir = path.join(subprojectRoot, 'static')
const sourceDirCandidates = [rootDist, distDir, buildDir]
const fallbackIndexCandidates = [fallbackIndex, localIndex]
const fallbackStaticCandidates = [fallbackStaticDir, localStaticDir]
const workerPathReplacements = [
  ['root:"./dist"', 'root:"./"'],
  ['path:"./dist/index.html"', 'path:"./index.html"'],
  ["root:'./dist'", "root:'./'"],
  ["path:'./dist/index.html'", "path:'./index.html'"],
]

async function exists(targetPath) {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

async function pickExistingDirectory(candidates) {
  for (const candidate of candidates) {
    const hasIndex = await exists(path.join(candidate, 'index.html'))
    const hasStatic = await exists(path.join(candidate, 'static'))
    if (hasIndex && hasStatic) {
      return candidate
    }
  }
  return null
}

async function pickExistingFile(candidates) {
  for (const candidate of candidates) {
    if (await exists(candidate)) {
      return candidate
    }
  }
  return null
}

async function normalizeWorkerPaths(targetDir) {
  const workerPath = path.join(targetDir, '_worker.js')
  if (!(await exists(workerPath))) {
    return
  }

  const workerContent = await readFile(workerPath, 'utf8')
  let normalizedContent = workerContent
  for (const [fromPath, toPath] of workerPathReplacements) {
    normalizedContent = normalizedContent.replaceAll(fromPath, toPath)
  }

  if (normalizedContent !== workerContent) {
    await writeFile(workerPath, normalizedContent)
  }
}

async function copyFromSourceDirectory(sourceDir) {
  const resolvedSource = path.resolve(sourceDir)
  for (const target of targets) {
    if (path.resolve(target) === resolvedSource) {
      await normalizeWorkerPaths(target)
      continue
    }
    await rm(target, { recursive: true, force: true })
    await mkdir(path.dirname(target), { recursive: true })
    await cp(sourceDir, target, { recursive: true })
    await normalizeWorkerPaths(target)
  }
}

async function ensureFromFallback() {
  const indexSource = await pickExistingFile(fallbackIndexCandidates)
  const staticSource = await pickExistingFile(fallbackStaticCandidates)

  if (!indexSource || !staticSource) {
    throw new Error('No fallback sources available for higono-ie build output generation')
  }

  const html = await readFile(indexSource, 'utf8')

  for (const target of targets) {
    await rm(target, { recursive: true, force: true })
    await mkdir(target, { recursive: true })
    await writeFile(path.join(target, 'index.html'), html)
    await cp(staticSource, path.join(target, 'static'), { recursive: true })
  }
}

try {
  const sourceDir = await pickExistingDirectory(sourceDirCandidates)
  if (sourceDir) {
    await copyFromSourceDirectory(sourceDir)
  } else {
    await ensureFromFallback()
  }
} catch {
  await ensureFromFallback()
}
