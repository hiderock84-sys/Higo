import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()
const ORIGIN_BASE = 'https://higono-ie.pages.dev'
const ORIGIN_HOME = `${ORIGIN_BASE}/`

const proEnhancementStyle = `
<style id="pro-enhancement-style">
  :root {
    --pro-bg-0: #edf3f9;
    --pro-bg-1: #f8fbff;
    --pro-ink: #0f2a43;
    --pro-ink-soft: #2f4b68;
    --pro-line: rgba(15, 42, 67, 0.14);
    --pro-shadow-sm: 0 8px 18px rgba(15, 42, 67, 0.10);
    --pro-shadow-md: 0 16px 34px rgba(15, 42, 67, 0.14);
    --pro-shadow-lg: 0 24px 48px rgba(15, 42, 67, 0.18);
    --pro-accent: #165c9a;
    --pro-accent-alt: #2a9d8f;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    background:
      radial-gradient(circle at 14% 0%, rgba(22, 92, 154, 0.17), transparent 38%),
      radial-gradient(circle at 92% 14%, rgba(42, 157, 143, 0.14), transparent 42%),
      linear-gradient(135deg, var(--pro-bg-0), var(--pro-bg-1)) !important;
    color: var(--pro-ink);
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

  .logo {
    transition: transform 0.25s ease;
  }

  .logo:hover {
    transform: translateY(-1px);
  }

  .nav-menu a {
    border-radius: 10px;
    transition: all 0.22s ease !important;
    padding: 0.45rem 0.62rem !important;
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
    border: 1px solid rgba(255, 255, 255, 0.40);
    box-shadow: var(--pro-shadow-lg);
  }

  .landing-hero-overlay {
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.36),
      rgba(0, 0, 0, 0.22),
      rgba(0, 0, 0, 0.46)
    ) !important;
  }

  .landing-intro,
  .section {
    border-radius: 18px;
    border: 1px solid var(--pro-line);
    background: rgba(255, 255, 255, 0.86);
    box-shadow: var(--pro-shadow-sm);
    backdrop-filter: blur(4px);
    margin-top: 1.25rem;
    margin-bottom: 1.25rem;
  }

  .three-pillars {
    border-radius: 18px;
    border: 1px solid rgba(22, 92, 154, 0.18) !important;
    box-shadow: var(--pro-shadow-sm);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(240, 248, 255, 0.76)) !important;
  }

  .btn {
    transition: transform 0.22s ease, box-shadow 0.22s ease !important;
  }

  .btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--pro-shadow-md);
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--pro-accent), var(--pro-accent-alt)) !important;
    border-color: transparent !important;
  }

  .btn-secondary {
    background: #ffffff !important;
    color: var(--pro-accent) !important;
    border: 1px solid rgba(22, 92, 154, 0.28) !important;
  }

  .fixed-cta a {
    border-radius: 12px !important;
    box-shadow: var(--pro-shadow-sm) !important;
  }

  footer {
    background: linear-gradient(180deg, #0f2a43, #0b2237) !important;
  }

  .footer-section {
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.03);
    padding: 0.9rem;
  }

  .footer-bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.20) !important;
  }
</style>
`

function absolutizeInternalLinks(html: string): string {
  return html
    .replace(/(href|src|action)=("|')\/(?!\/)/g, `$1=$2${ORIGIN_BASE}/`)
    .replace(/content=("|')\/(?!\/)/g, `content=$1${ORIGIN_BASE}/`)
    .replace(/url\((['"]?)\/(?!\/)/g, `url($1${ORIGIN_BASE}/`)
}

function injectProStyle(html: string): string {
  if (html.includes('id="pro-enhancement-style"')) {
    return html
  }
  if (html.includes('</head>')) {
    return html.replace('</head>', `${proEnhancementStyle}\n</head>`)
  }
  return `${proEnhancementStyle}\n${html}`
}

async function renderProPage() {
  const upstream = await fetch(ORIGIN_HOME)
  if (!upstream.ok) {
    throw new Error(`Failed to fetch origin page: ${upstream.status}`)
  }
  const upstreamHtml = await upstream.text()
  const withAbsoluteLinks = absolutizeInternalLinks(upstreamHtml)
  return injectProStyle(withAbsoluteLinks)
}

// Serve static files
app.use('/static/*', serveStatic({ root: './dist' }))

// Serve pro-level homepage variant without touching existing homepage
app.get('/pro', async (c) => {
  try {
    const html = await renderProPage()
    return c.html(html)
  } catch {
    return serveStatic({ path: './dist/pro/index.html' })(c, async () => c.notFound())
  }
})
app.get('/pro/', async (c) => {
  try {
    const html = await renderProPage()
    return c.html(html)
  } catch {
    return serveStatic({ path: './dist/pro/index.html' })(c, async () => c.notFound())
  }
})
app.get('/pro/index.html', async (c) => {
  try {
    const html = await renderProPage()
    return c.html(html)
  } catch {
    return serveStatic({ path: './dist/pro/index.html' })(c, async () => c.notFound())
  }
})

// Serve index.html for root path
app.get('/', serveStatic({ path: './dist/index.html' }))

export default app
