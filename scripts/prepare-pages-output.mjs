import { mkdir, rm, cp, readFile, writeFile, readdir, unlink } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFile = fileURLToPath(import.meta.url)
const projectRoot = path.resolve(path.dirname(currentFile), '..')
const distDir = path.join(projectRoot, 'dist')
const buildId = process.env.BUILD_ID || `20260701${Date.now().toString(36).slice(-4)}`
const subprojectRoots = ['hidonoie', 'higono-ie']
const rootTargets = [
  path.join(projectRoot, 'build'),
  path.join(projectRoot, 'out'),
  path.join(projectRoot, 'output'),
  path.join(projectRoot, '.output', 'public'),
  path.join(projectRoot, '.vercel', 'output', 'static'),
]
const subprojectTargets = subprojectRoots.flatMap((folder) => [
  path.join(projectRoot, folder, 'dist'),
  path.join(projectRoot, folder, 'build'),
  path.join(projectRoot, folder, 'out'),
  path.join(projectRoot, folder, 'output'),
  path.join(projectRoot, folder, '.output', 'public'),
])
const targets = [...rootTargets, ...subprojectTargets]
const cleanupAssets = [
  path.join(projectRoot, 'dist', 'static', 'logo-design.jpg'),
  ...targets.map((target) => path.join(target, 'static', 'logo-design.jpg')),
]

async function injectBuildAssets(html, buildId) {
  const soulageUrl = `/static/soulage-logo-site-toned.png?v=${buildId}`
  let out = html
    .replaceAll('__BUILD_ID__', buildId)
    .replaceAll('__SOULAGE_LOGO_URL__', soulageUrl)
    .replaceAll(/\/static\/soulage-logo-site-toned(?:\.[a-f0-9]+)?\.png(?:\?[^"']*)?/g, soulageUrl)
    .replaceAll(/\/static\/soulage-wreath-logo\.png(?:\?[^"']*)?/g, soulageUrl)

  // すべての /static/ 参照に同一 BUILD_ID を付与（古い ?v= も置換）
  out = out.replace(
    /(\/static\/[^"'?#\s]+)(\?v=[^"'#\s&]+)?/g,
    (_, assetPath) => `${assetPath}?v=${buildId}`
  )

  return out
}

async function cleanupLegacySoulageAssets() {
  const staticDir = path.join(projectRoot, 'public', 'static')
  const files = await readdir(staticDir)
  await Promise.all(
    files
      .filter((name) => /^soulage-logo-site-toned\.[a-f0-9]+\.png$/.test(name))
      .map((name) => unlink(path.join(staticDir, name)))
  )
  await rm(path.join(staticDir, 'soulage-logo.manifest.json'), { force: true })
}

async function syncStaticAssetsToDist() {
  const { execSync } = await import('node:child_process')
  execSync('node scripts/build-soulage-logo.mjs', { stdio: 'inherit', cwd: projectRoot })
  await cleanupLegacySoulageAssets()

  const sourceIndex = path.join(projectRoot, 'index.html')
  const sourceStaticDir = path.join(projectRoot, 'public', 'static')
  const distStaticDir = path.join(distDir, 'static')

  const redirectsSource = path.join(projectRoot, 'public', '_redirects')
  const headersSource = path.join(projectRoot, 'public', '_headers')
  await mkdir(distStaticDir, { recursive: true })

  const html = await injectBuildAssets(await readFile(sourceIndex, 'utf8'), buildId)
  await writeFile(path.join(distDir, 'index.html'), html)
  await writeFile(path.join(distStaticDir, 'build-id.json'), `${JSON.stringify({ buildId })}\n`)

  await cp(sourceStaticDir, distStaticDir, { recursive: true })
  await cp(redirectsSource, path.join(distDir, '_redirects'))
  await cp(headersSource, path.join(distDir, '_headers'))
  // SPA: static only — remove worker so _redirects handles all routes
  await rm(path.join(distDir, '_worker.js'), { force: true })
  await rm(path.join(distDir, '_routes.json'), { force: true })
}

async function copyDistToTargets() {
  await syncStaticAssetsToDist()
  for (const target of targets) {
    await rm(target, { recursive: true, force: true })
    await mkdir(path.dirname(target), { recursive: true })
    await cp(distDir, target, { recursive: true })
  }
}

async function syncRootFilesForSubprojects() {
  const sourceIndex = path.join(projectRoot, 'index.html')
  const sourceStyle = path.join(projectRoot, 'public', 'static', 'style.css')
  const html = await injectBuildAssets(await readFile(sourceIndex, 'utf8'), buildId)
  const css = await readFile(sourceStyle, 'utf8')

  for (const folder of subprojectRoots) {
    const targetIndex = path.join(projectRoot, folder, 'index.html')
    const targetStyle = path.join(projectRoot, folder, 'static', 'style.css')
    await mkdir(path.dirname(targetStyle), { recursive: true })
    await writeFile(targetIndex, html)
    await writeFile(targetStyle, css)
  }
}

async function cleanupUnusedAssets() {
  for (const assetPath of cleanupAssets) {
    await rm(assetPath, { force: true })
  }
}

await copyDistToTargets()
await syncRootFilesForSubprojects()
await cleanupUnusedAssets()

const distIndex = await readFile(path.join(distDir, 'index.html'), 'utf8')
if (distIndex.includes('__BUILD_ID__') || distIndex.includes('__SOULAGE_LOGO_URL__')) {
  throw new Error('dist/index.html に BUILD_ID プレースホルダが残っています。')
}
if (distIndex.includes('program-section-title__main">一日の型<')) {
  throw new Error(
    'dist/index.html に「一日の型」が残っています。ルート index.html を「ひごのいえの一日」に修正してから再ビルドしてください。'
  )
}
if (!distIndex.includes('program-section-title__main">ひごのいえの一日<')) {
  throw new Error('dist/index.html に「ひごのいえの一日」がありません。')
}
