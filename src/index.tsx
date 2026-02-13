import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()
const sectionPageRoutes = [
  '/top',
  '/about',
  '/staff',
  '/program',
  '/testimonials',
  '/rapport',
  '/women',
  '/grouphome',
  '/guide',
  '/usage',
  '/family-guide',
  '/family',
  '/contact',
]

// Serve static files
app.use('/static/*', serveStatic({ root: './dist' }))

// Serve index.html for root path
app.get('/', serveStatic({ path: './dist/index.html' }))
for (const routePath of sectionPageRoutes) {
  app.get(routePath, serveStatic({ path: './dist/index.html' }))
}

export default app
