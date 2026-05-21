#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const projectName = process.env.CLOUDFLARE_PAGES_PROJECT || 'higo'

const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID

function run(command, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: root,
      shell: false,
      env: { ...process.env, ...extraEnv },
    })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`))))
    child.on('error', reject)
  })
}

async function main() {
  console.log('[deploy] Verifying build output...')
  await access(path.join(distDir, 'index.html'))
  await access(path.join(distDir, 'static', 'hero-cover-aso-kumamoto.jpg'))

  if (!token) {
    console.error(`
[deploy] CLOUDFLARE_API_TOKEN が未設定のため、Wrangler デプロイをスキップしました。

次のいずれかでデプロイを完了してください:

1) GitHub Secrets（推奨）
   - CLOUDFLARE_API_TOKEN
   - CLOUDFLARE_ACCOUNT_ID
   設定後: Actions → "Deploy to Cloudflare Pages" → Run workflow

2) ローカル / Cloud Agent 環境変数
   export CLOUDFLARE_API_TOKEN="..."
   export CLOUDFLARE_ACCOUNT_ID="..."
   npm run deploy

3) Cloudflare ダッシュボード
   Pages → higo-8il → Git 連携 → main ブランチ → ビルドコマンド: npm run build / 出力: dist
`)
    process.exit(1)
  }

  const args = [
    'wrangler',
    'pages',
    'deploy',
    'dist',
    '--project-name',
    projectName,
    '--branch',
    'main',
    '--commit-dirty=true',
    '--skip-caching',
  ]

  console.log(`[deploy] Deploying to Cloudflare Pages project: ${projectName}`)
  await run('npx', args, {
    CLOUDFLARE_API_TOKEN: token,
    ...(accountId ? { CLOUDFLARE_ACCOUNT_ID: accountId } : {}),
  })
  console.log('[deploy] Done.')
}

main().catch((error) => {
  console.error('[deploy] Failed:', error.message)
  process.exit(1)
})
