import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()
const sectionPageRouteMap: Record<string, string> = {
  '/top': './dist/top/index.html',
  '/about': './dist/about/index.html',
  '/staff': './dist/staff/index.html',
  '/program': './dist/program/index.html',
  '/testimonials': './dist/testimonials/index.html',
  '/rapport': './dist/rapport/index.html',
  '/grouphome': './dist/grouphome/index.html',
  '/guide': './dist/guide/index.html',
  '/family-guide': './dist/family-guide/index.html',
  '/contact': './dist/contact/index.html',
  // Backward-compatible aliases
  '/women': './dist/rapport/index.html',
  '/usage': './dist/guide/index.html',
  '/family': './dist/family-guide/index.html',
}

// Serve static files
app.use('/static/*', serveStatic({ root: './dist' }))

// Serve index.html for root path
app.get('/', serveStatic({ path: './dist/index.html' }))
for (const [routePath, htmlPath] of Object.entries(sectionPageRouteMap)) {
  app.get(routePath, serveStatic({ path: htmlPath }))
}

export default app
