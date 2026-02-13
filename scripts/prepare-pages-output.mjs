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
const proPages = [
  { sourcePath: '/', slug: '' },
  { sourcePath: '/about', slug: 'about' },
  { sourcePath: '/program', slug: 'program' },
  { sourcePath: '/testimonials', slug: 'testimonials' },
  { sourcePath: '/rapport', slug: 'rapport' },
  { sourcePath: '/grouphome', slug: 'grouphome' },
  { sourcePath: '/guide', slug: 'guide' },
  { sourcePath: '/family-guide', slug: 'family-guide' },
  { sourcePath: '/contact', slug: 'contact' },
  { sourcePath: '/staff', slug: 'staff' },
  { sourcePath: '/404', slug: '404' },
]
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

const proEnhancementStyle = `
<style id="pro-enhancement-style">
  :root {
    --pro-bg-0: #eef4fb;
    --pro-bg-1: #fafdff;
    --pro-line: rgba(15, 42, 67, 0.14);
    --pro-shadow-sm: 0 10px 22px rgba(15, 42, 67, 0.10);
    --pro-shadow-md: 0 18px 38px rgba(15, 42, 67, 0.14);
    --pro-shadow-lg: 0 30px 56px rgba(15, 42, 67, 0.20);
    --pro-accent: #165c9a;
    --pro-accent-2: #2a9d8f;
    --pro-photo-1: url("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80");
    --pro-photo-2: url("https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1800&q=80");
    --pro-photo-3: url("https://images.unsplash.com/photo-1493244040629-496f6d136cc3?auto=format&fit=crop&w=1800&q=80");
    --pro-photo-4: url("https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=1800&q=80");
    --pro-photo-5: url("https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1800&q=80");
    --pro-photo-6: url("https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=80");
    --pro-photo-7: url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80");
    --pro-photo-8: url("https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1800&q=80");
    --pro-photo-9: url("https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1800&q=80");
    --pro-photo-10: url("https://images.unsplash.com/photo-1522364723953-452d3431c267?auto=format&fit=crop&w=1800&q=80");
    --pro-photo-11: url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=80");
    --pro-photo-12: url("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1800&q=80");
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    background:
      radial-gradient(circle at 14% 0%, rgba(22, 92, 154, 0.20), transparent 38%),
      radial-gradient(circle at 90% 12%, rgba(42, 157, 143, 0.16), transparent 40%),
      linear-gradient(135deg, var(--pro-bg-0), var(--pro-bg-1)) !important;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }

  header {
    background: rgba(255, 255, 255, 0.90) !important;
    border-bottom: 1px solid var(--pro-line) !important;
    box-shadow: var(--pro-shadow-sm) !important;
    backdrop-filter: blur(10px);
  }

  .header-container {
    max-width: 1240px !important;
    margin-inline: auto;
  }

  .logo-image {
    filter: drop-shadow(0 4px 8px rgba(15, 42, 67, 0.18));
  }

  .nav-menu a {
    border-radius: 12px;
    transition: all 0.2s ease !important;
    padding: 0.45rem 0.66rem !important;
  }

  .nav-menu a:hover {
    background: rgba(22, 92, 154, 0.12);
    color: #0f4f87 !important;
  }

  .landing-hero {
    max-width: 1240px;
    margin: 1rem auto 0 !important;
    border-radius: 24px !important;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.36);
    box-shadow: var(--pro-shadow-lg);
  }

  .landing-hero-overlay {
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.30), rgba(0, 0, 0, 0.20), rgba(0, 0, 0, 0.44)) !important;
  }

  .section,
  .landing-intro,
  .three-pillars {
    border-radius: 20px !important;
    border: 1px solid var(--pro-line) !important;
    box-shadow: var(--pro-shadow-sm) !important;
    margin-top: 1.15rem !important;
    margin-bottom: 1.15rem !important;
    overflow: hidden;
  }

  .section,
  .landing-intro {
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.93), rgba(247, 252, 255, 0.88)) !important;
  }

  .three-pillars {
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(239, 248, 255, 0.86)) !important;
  }

  .card,
  .story-card,
  .staff-card,
  .testimonial-card,
  .faq-item,
  .footer-section {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    border-radius: 16px !important;
    border: 1px solid var(--pro-line) !important;
    box-shadow: var(--pro-shadow-sm) !important;
    background-color: rgba(255, 255, 255, 0.90) !important;
  }

  .card > *,
  .story-card > *,
  .staff-card > *,
  .testimonial-card > *,
  .faq-item > *,
  .footer-section > * {
    position: relative;
    z-index: 2;
  }

  .card::before,
  .story-card::before,
  .staff-card::before,
  .testimonial-card::before,
  .faq-item::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 1;
    background:
      linear-gradient(160deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.60)),
      var(--pro-card-photo, var(--pro-photo-1)) center / cover no-repeat;
    opacity: 0.26;
  }

  main .card:nth-of-type(12n + 1) { --pro-card-photo: var(--pro-photo-1); }
  main .card:nth-of-type(12n + 2) { --pro-card-photo: var(--pro-photo-2); }
  main .card:nth-of-type(12n + 3) { --pro-card-photo: var(--pro-photo-3); }
  main .card:nth-of-type(12n + 4) { --pro-card-photo: var(--pro-photo-4); }
  main .card:nth-of-type(12n + 5) { --pro-card-photo: var(--pro-photo-5); }
  main .card:nth-of-type(12n + 6) { --pro-card-photo: var(--pro-photo-6); }
  main .card:nth-of-type(12n + 7) { --pro-card-photo: var(--pro-photo-7); }
  main .card:nth-of-type(12n + 8) { --pro-card-photo: var(--pro-photo-8); }
  main .card:nth-of-type(12n + 9) { --pro-card-photo: var(--pro-photo-9); }
  main .card:nth-of-type(12n + 10) { --pro-card-photo: var(--pro-photo-10); }
  main .card:nth-of-type(12n + 11) { --pro-card-photo: var(--pro-photo-11); }
  main .card:nth-of-type(12n + 12) { --pro-card-photo: var(--pro-photo-12); }

  .section-title,
  .hero-title,
  h1,
  h2,
  h3 {
    letter-spacing: 0.02em;
    text-wrap: balance;
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
    border: 1px solid rgba(22, 92, 154, 0.30) !important;
  }

  footer {
    background:
      linear-gradient(180deg, rgba(7, 31, 52, 0.96), rgba(7, 23, 40, 0.98)),
      var(--pro-photo-9) center / cover no-repeat !important;
    color: #e5f2ff !important;
  }

  .footer-section {
    background-color: rgba(255, 255, 255, 0.06) !important;
    border: 1px solid rgba(255, 255, 255, 0.18) !important;
  }

  .pro-reveal {
    opacity: 0;
    transform: translateY(14px);
    transition: opacity 0.45s ease, transform 0.45s ease;
    transition-delay: var(--pro-delay, 0ms);
  }

  .pro-reveal.is-visible {
    opacity: 1;
    transform: translateY(0);
  }

  body[data-pro-page="about"] .section:first-of-type { --pro-card-photo: var(--pro-photo-2); }
  body[data-pro-page="program"] .section:first-of-type { --pro-card-photo: var(--pro-photo-4); }
  body[data-pro-page="testimonials"] .section:first-of-type { --pro-card-photo: var(--pro-photo-8); }
  body[data-pro-page="rapport"] .section:first-of-type { --pro-card-photo: var(--pro-photo-6); }
  body[data-pro-page="grouphome"] .section:first-of-type { --pro-card-photo: var(--pro-photo-5); }
  body[data-pro-page="guide"] .section:first-of-type { --pro-card-photo: var(--pro-photo-10); }
  body[data-pro-page="family-guide"] .section:first-of-type { --pro-card-photo: var(--pro-photo-3); }
  body[data-pro-page="contact"] .section:first-of-type { --pro-card-photo: var(--pro-photo-7); }
  body[data-pro-page="staff"] .section:first-of-type { --pro-card-photo: var(--pro-photo-11); }

  @media (max-width: 768px) {
    .section,
    .landing-intro,
    .three-pillars {
      border-radius: 14px !important;
      margin-top: 0.75rem !important;
      margin-bottom: 0.75rem !important;
    }
  }
</style>
`

const proEnhancementScript = `
<script id="pro-enhancement-script">
(() => {
  if (window.__proEnhancedLanding) return;
  window.__proEnhancedLanding = true;
  const targets = Array.from(
    document.querySelectorAll('.section, .landing-intro, .three-pillars, .card, .btn, .footer-section')
  );
  if (!targets.length || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  targets.forEach((element, index) => {
    element.classList.add('pro-reveal');
    element.style.setProperty('--pro-delay', String(Math.min(index * 40, 520)) + 'ms');
    observer.observe(element);
  });
})();
</script>
`

function toProRoutePath(slug) {
  return slug ? `/pro/${slug}/index.html` : '/pro/index.html'
}

function normalizePath(pathname = '') {
  let value = pathname.trim()
  if (!value) return '/'
  value = value.replace(/^\.\//, '')
  value = value.replace(/\/{2,}/g, '/')
  if (!value.startsWith('/')) value = `/${value}`
  if (value.length > 1 && value.endsWith('/')) value = value.slice(0, -1)
  return value
}

function splitUrlParts(urlValue) {
  const match = urlValue.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/)
  return {
    path: match?.[1] ?? '',
    query: match?.[2] ?? '',
    hash: match?.[3] ?? '',
  }
}

const proRouteLookup = new Map()

function addRouteLookup(route) {
  const normalized = normalizePath(route.sourcePath)
  const proPath = toProRoutePath(route.slug)
  if (normalized === '/') {
    proRouteLookup.set('/', proPath)
    proRouteLookup.set('/index.html', proPath)
    return
  }
  proRouteLookup.set(normalized, proPath)
  proRouteLookup.set(`${normalized}/`, proPath)
  proRouteLookup.set(`${normalized}/index.html`, proPath)
}

for (const route of proPages) {
  addRouteLookup(route)
}
proRouteLookup.set('/top', '/pro/index.html')
proRouteLookup.set('/top/index.html', '/pro/index.html')

function rewriteHref(value) {
  const raw = value.trim()
  if (
    !raw ||
    raw.startsWith('#') ||
    raw.startsWith('mailto:') ||
    raw.startsWith('tel:') ||
    raw.startsWith('javascript:') ||
    raw.startsWith('data:')
  ) {
    return raw
  }

  let candidate = raw
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw)
      if (parsed.origin !== proOriginBase) return raw
      candidate = `${parsed.pathname}${parsed.search}${parsed.hash}`
    } catch {
      return raw
    }
  }

  if (candidate.startsWith('//')) return candidate

  const { path: pathPart, query, hash } = splitUrlParts(candidate)
  const normalized = normalizePath(pathPart || '/')
  const mapped = proRouteLookup.get(normalized)
  if (mapped) return `${mapped}${query}${hash}`

  if (normalized.startsWith('/static/') || normalized.startsWith('/cdn-cgi/')) {
    return `${proOriginBase}${normalized}${query}${hash}`
  }

  return `${proOriginBase}${normalized}${query}${hash}`
}

function rewriteSrcOrAction(value) {
  const raw = value.trim()
  if (
    !raw ||
    raw.startsWith('#') ||
    raw.startsWith('mailto:') ||
    raw.startsWith('tel:') ||
    raw.startsWith('javascript:') ||
    raw.startsWith('data:') ||
    raw.startsWith('blob:')
  ) {
    return raw
  }
  if (/^https?:\/\//i.test(raw) || raw.startsWith('//')) return raw

  const { path: pathPart, query, hash } = splitUrlParts(raw)
  const normalized = normalizePath(pathPart)
  return `${proOriginBase}${normalized}${query}${hash}`
}

function rewriteAttributes(html) {
  return html.replace(/(href|src|action)=("|')([^"']*)\2/gi, (full, attr, quote, value) => {
    const normalizedAttr = attr.toLowerCase()
    const nextValue = normalizedAttr === 'href' ? rewriteHref(value) : rewriteSrcOrAction(value)
    return `${attr}=${quote}${nextValue}${quote}`
  })
}

function rewriteCssUrls(html) {
  return html.replace(/url\((['"]?)(\/[^)'"]+)\1\)/gi, (_full, quote, urlPath) => {
    return `url(${quote}${proOriginBase}${urlPath}${quote})`
  })
}

function tagBody(html, slug) {
  const pageName = slug || 'top'
  return html.replace(/<body\b([^>]*)>/i, (full, attrs) => {
    if (/data-pro-page\s*=/.test(attrs)) {
      return `<body${attrs.replace(/data-pro-page=(".*?"|'.*?')/i, `data-pro-page="${pageName}"`)}>`
    }
    return `<body${attrs} data-pro-page="${pageName}">`
  })
}

function injectProStyle(html) {
  if (html.includes('id="pro-enhancement-style"')) return html
  if (html.includes('</head>')) return html.replace('</head>', `${proEnhancementStyle}\n</head>`)
  return `${proEnhancementStyle}\n${html}`
}

function injectProScript(html) {
  if (html.includes('id="pro-enhancement-script"')) return html
  if (html.includes('</body>')) return html.replace('</body>', `${proEnhancementScript}\n</body>`)
  return `${html}\n${proEnhancementScript}`
}

function buildProHtml(sourceHtml, slug) {
  let html = sourceHtml
  html = tagBody(html, slug)
  html = rewriteAttributes(html)
  html = rewriteCssUrls(html)
  html = injectProStyle(html)
  html = injectProScript(html)
  return html
}

function getFallbackCandidates(route) {
  const candidates = []
  if (!route.slug) candidates.push(proHomepageSource)
  candidates.push(
    route.slug
      ? path.join(projectRoot, 'build', 'pro', route.slug, 'index.html')
      : path.join(projectRoot, 'build', 'pro', 'index.html')
  )
  candidates.push(
    route.slug
      ? path.join(projectRoot, 'higono-ie', 'build', 'pro', route.slug, 'index.html')
      : path.join(projectRoot, 'higono-ie', 'build', 'pro', 'index.html')
  )
  return candidates
}

async function loadProSource(route) {
  const sourceUrl = `${proOriginBase}${route.sourcePath}`
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        'user-agent': 'higonoie-build/1.0',
      },
    })
    clearTimeout(timer)
    if (!response.ok && !(route.slug === '404' && response.status === 404)) {
      throw new Error(`status ${response.status}`)
    }
    return await response.text()
  } catch (error) {
    for (const candidate of getFallbackCandidates(route)) {
      try {
        return await readFile(candidate, 'utf8')
      } catch {
        // keep searching fallback candidates
      }
    }
    throw error
  }
}

async function generateProPages() {
  await mkdir(proRouteDir, { recursive: true })

  for (const route of proPages) {
    const sourceHtml = await loadProSource(route)
    const enhancedHtml = buildProHtml(sourceHtml, route.slug || 'top')
    const routeOutput = route.slug
      ? path.join(proRouteDir, route.slug, 'index.html')
      : proRouteIndex
    await mkdir(path.dirname(routeOutput), { recursive: true })
    await writeFile(routeOutput, enhancedHtml)

    if (route.slug) {
      await writeFile(path.join(proRouteDir, `${route.slug}.html`), enhancedHtml)
    } else {
      await writeFile(proHomepageSource, enhancedHtml)
      await writeFile(proHomepageDistCopy, enhancedHtml)
    }
  }
}

async function copyDistToTargets() {
  for (const target of targets) {
    await rm(target, { recursive: true, force: true })
    await mkdir(path.dirname(target), { recursive: true })
    await cp(distDir, target, { recursive: true })
  }
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

await generateProPages()
await copyDistToTargets()
await syncRootFilesForSubprojects()
await cleanupUnusedAssets()
