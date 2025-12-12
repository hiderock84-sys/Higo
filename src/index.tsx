import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Serve static files
app.use('/static/*', serveStatic({ root: './dist' }))

// Serve index.html for root path
app.get('/', serveStatic({ path: './dist/index.html' }))

export default app
