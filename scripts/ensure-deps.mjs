import { access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const currentFile = fileURLToPath(import.meta.url)
const projectRoot = path.resolve(path.dirname(currentFile), '..')
const viteBinPath = path.join(projectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite')

async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: projectRoot,
      shell: false,
      ...options,
    })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`))
      }
    })
  })
}

async function ensureDeps() {
  const hasVite = await fileExists(viteBinPath)
  if (hasVite) {
    console.log('[ensure-deps] node_modules already prepared.')
    return
  }

  console.log('[ensure-deps] node_modules not found. Running npm install...')
  await run('npm', ['install', '--no-package-lock', '--prefix', projectRoot])
}

await ensureDeps()
