import { mkdir, rm, cp, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFile = fileURLToPath(import.meta.url)
const projectRoot = path.resolve(path.dirname(currentFile), '..')
const distDir = path.join(projectRoot, 'dist')
const proHomepageSource = path.join(projectRoot, 'pro-homepage.html')
const proRouteDir = path.join(distDir, 'pro')
const proRouteIndex = path.join(proRouteDir, 'index.html')
const proHomepageDistCopy = path.join(distDir, 'pro-homepage.html')
const proOriginBase = 'https://higono-ie.pages.dev'
const proOriginHome = `${proOriginBase}/`
const proEnhancementStyle = `
<style id="pro-enhancement-style">
  :root {
    --pro-bg-0: #edf3f9;
    --pro-bg-1: #f8fbff;
    --pro-line: rgba(15, 42, 67, 0.14);
    --pro-shadow-sm: 0 8px 18px rgba(15, 42, 67, 0.10);
    --pro-shadow-md: 0 16px 34px rgba(15, 42, 67, 0.14);
    --pro-shadow-lg: 0 24px 48px rgba(15, 42, 67, 0.18);
    --pro-accent: #165c9a;
    --pro-accent-2: #2a9d8f;
  }

  body {
    background:
      radial-gradient(circle at 14% 0%, rgba(22, 92, 154, 0.17), transparent 38%),
      radial-gradient(circle at 92% 14%, rgba(42, 157, 143, 0.14), transparent 42%),
      linear-gradient(135deg, var(--pro-bg-0), var(--pro-bg-1)) !important;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }

  header {
    background: rgba(255, 255, 255, 0.90) !important;
    border-bottom: 1px solid var(--pro-line) !important;
    box-shadow: var(--pro-shadow-sm) !important;
    backdrop-filter: blur(8px);
  }

  .header-container {
    max-width: 1200px !important;
    margin-inline: auto;
  }

  .nav-menu a {
    border-radius: 10px;
    transition: all 0.2s ease !important;
    padding: 0.42rem 0.62rem !important;
  }

  .nav-menu a:hover {
    background: rgba(22, 92, 154, 0.12);
    color: #0f4f87 !important;
  }

  .landing-hero {
    max-width: 1240px;
    margin: 1rem auto 0 !important;
    border-radius: 22px !important;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.36);
    box-shadow: var(--pro-shadow-lg);
  }

  .landing-intro,
  .section {
    border-radius: 18px !important;
    border: 1px solid var(--pro-line) !important;
    background: rgba(255, 255, 255, 0.88) !important;
    box-shadow: var(--pro-shadow-sm) !important;
    margin-top: 1.2rem !important;
    margin-bottom: 1.2rem !important;
  }

  .three-pillars {
    border-radius: 18px !important;
    border: 1px solid rgba(22, 92, 154, 0.20) !important;
    box-shadow: var(--pro-shadow-sm) !important;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.90), rgba(240, 248, 255, 0.78)) !important;
  }

  .btn,
  .fixed-cta a {
    border-radius: 12px !important;
    transition: transform 0.2s ease, box-shadow 0.2s ease !important;
    box-shadow: var(--pro-shadow-sm) !important;
  }

  .btn:hover,
  .fixed-cta a:hover {
    transform: translateY(-2px);
    box-shadow: var(--pro-shadow-md) !important;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--pro-accent), var(--pro-accent-2)) !important;
    border-color: transparent !important;
  }

  .btn-secondary {
    background: #fff !important;
    color: var(--pro-accent) !important;
    border: 1px solid rgba(22, 92, 154, 0.28) !important;
  }

  footer {
    background: linear-gradient(180deg, #0f2a43, #0b2237) !important;
  }

  .footer-section {
    border-radius: 14px !important;
    border: 1px solid rgba(255, 255, 255, 0.16) !important;
    background: rgba(255, 255, 255, 0.03) !important;
    padding: 0.9rem !important;
  }
</style>
`
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

function absolutizeInternalLinks(html) {
  return html
    .replace(/(href|src|action)=("|')\/(?!\/)/g, `$1=$2${proOriginBase}/`)
    .replace(/content=("|')\/(?!\/)/g, `content=$1${proOriginBase}/`)
    .replace(/url\((['"]?)\/(?!\/)/g, `url($1${proOriginBase}/`)
}

function injectProStyle(html) {
  if (html.includes('id="pro-enhancement-style"')) {
    return html
  }
  if (html.includes('</head>')) {
    return html.replace('</head>', `${proEnhancementStyle}\n</head>`)
  }
  return `${proEnhancementStyle}\n${html}`
}

async function refreshProHomepageSource() {
  let existing = ''
  try {
    existing = await readFile(proHomepageSource, 'utf8')
  } catch {
    existing = ''
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    const response = await fetch(proOriginHome, {
      signal: controller.signal,
      headers: {
        'user-agent': 'higonoie-build/1.0',
      },
    })
    clearTimeout(timer)

    if (!response.ok) {
      throw new Error(`status ${response.status}`)
    }

    const html = await response.text()
    const proHtml = injectProStyle(absolutizeInternalLinks(html))
    await writeFile(proHomepageSource, proHtml)
  } catch (error) {
    if (!existing) {
      throw error
    }
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[build] Could not refresh pro page from ${proOriginHome}: ${message}`)
    console.warn('[build] Using existing pro-homepage.html as fallback.')
  }
}

async function copyDistToTargets() {
  for (const target of targets) {
    await rm(target, { recursive: true, force: true })
    await mkdir(path.dirname(target), { recursive: true })
    await cp(distDir, target, { recursive: true })
  }
}

async function addProHomepageToDist() {
  const proHtml = await readFile(proHomepageSource, 'utf8')
  await mkdir(proRouteDir, { recursive: true })
  await writeFile(proRouteIndex, proHtml)
  await writeFile(proHomepageDistCopy, proHtml)
}

async function syncRootFilesForSubprojects() {
  const sourceIndex = path.join(projectRoot, 'index.html')
  const sourceStyle = path.join(projectRoot, 'public', 'static', 'style.css')
  const html = await readFile(sourceIndex, 'utf8')
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

await refreshProHomepageSource()
await addProHomepageToDist()
await copyDistToTargets()
await syncRootFilesForSubprojects()
await cleanupUnusedAssets()
