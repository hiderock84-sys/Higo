import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Serve static files
app.use('/static/*', serveStatic({ root: './dist' }))

// Serve pro-level homepage variant without touching existing homepage
app.get('/pro', serveStatic({ path: './dist/pro/index.html' }))
app.get('/pro/', serveStatic({ path: './dist/pro/index.html' }))
app.get('/pro/index.html', serveStatic({ path: './dist/pro/index.html' }))

// Serve index.html for root path
app.get('/', serveStatic({ path: './dist/index.html' }))

export default app
