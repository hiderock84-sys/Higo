import { spawn } from 'node:child_process'

const args = process.argv.slice(2)
const hasToken = Boolean(process.env.CLOUDFLARE_API_TOKEN)

if (!hasToken) {
  console.log('[deploy] CLOUDFLARE_API_TOKEN is not set. Skipping wrangler deploy step.')
  process.exit(0)
}

const wranglerArgs = ['wrangler', 'pages', 'deploy', 'dist', ...args]
const child = spawn('npx', wranglerArgs, { stdio: 'inherit', shell: false })

child.on('exit', (code) => {
  process.exit(code ?? 1)
})

child.on('error', (error) => {
  console.error('[deploy] Failed to invoke wrangler:', error.message)
  process.exit(1)
})
