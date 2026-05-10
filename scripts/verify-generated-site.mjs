import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFile = fileURLToPath(import.meta.url)
const projectRoot = path.resolve(path.dirname(currentFile), '..')
const distDir = path.join(projectRoot, 'dist')
const pagesBaseUrl = 'https://higono-ie.pages.dev'

const routeChecks = [
  { slug: 'about', title: '私たちについて | ひごのいえ' },
  { slug: 'staff', title: 'スタッフ紹介 | ひごのいえ' },
  { slug: 'program', title: 'プログラム | ひごのいえ' },
  { slug: 'testimonials', title: '体験談 | ひごのいえ' },
  { slug: 'rapport', title: '女性専用施設 | ひごのいえ' },
  { slug: 'grouphome', title: 'グループホーム | ひごのいえ' },
  { slug: 'guide', title: '利用案内 | ひごのいえ' },
  { slug: 'family-guide', title: '家族ガイド | ひごのいえ' },
  { slug: 'contact', title: '相談窓口 | ひごのいえ' },
]

function mustContain(haystack, needle, errorMessage, failures) {
  if (!haystack.includes(needle)) {
    failures.push(errorMessage)
  }
}

async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function verify() {
  const failures = []
  const rootIndexPath = path.join(distDir, 'index.html')
  const rootIndexHtml = await readFile(rootIndexPath, 'utf8')

  for (const { slug } of routeChecks) {
    mustContain(
      rootIndexHtml,
      `href="/${slug}"`,
      `index.html is missing link href="/${slug}"`,
      failures,
    )
  }

  for (const { slug, title } of routeChecks) {
    const routeFilePath = path.join(distDir, slug, 'index.html')
    const exists = await fileExists(routeFilePath)
    if (!exists) {
      failures.push(`Missing generated route file: dist/${slug}/index.html`)
      continue
    }

    const routeHtml = await readFile(routeFilePath, 'utf8')
    mustContain(
      routeHtml,
      `<title>${title}</title>`,
      `dist/${slug}/index.html title mismatch`,
      failures,
    )
    mustContain(
      routeHtml,
      `<link rel="canonical" href="${pagesBaseUrl}/${slug}">`,
      `dist/${slug}/index.html canonical mismatch`,
      failures,
    )
    mustContain(
      routeHtml,
      '<meta name="robots" content="index,follow">',
      `dist/${slug}/index.html missing robots meta`,
      failures,
    )
  }

  const robotsPath = path.join(distDir, 'robots.txt')
  const sitemapPath = path.join(distDir, 'sitemap.xml')
  const headersPath = path.join(distDir, '_headers')
  const redirectsPath = path.join(distDir, '_redirects')
  const compatibilityWorkerChecks = [
    path.join(projectRoot, 'hidonoie', 'dist', '_worker.js'),
    path.join(projectRoot, 'higono-ie', 'dist', '_worker.js'),
  ]

  if (!(await fileExists(robotsPath))) {
    failures.push('Missing dist/robots.txt')
  } else {
    const robots = await readFile(robotsPath, 'utf8')
    mustContain(
      robots,
      `Sitemap: ${pagesBaseUrl}/sitemap.xml`,
      'robots.txt missing sitemap declaration',
      failures,
    )
  }

  if (!(await fileExists(sitemapPath))) {
    failures.push('Missing dist/sitemap.xml')
  } else {
    const sitemap = await readFile(sitemapPath, 'utf8')
    for (const { slug } of routeChecks) {
      mustContain(
        sitemap,
        `<loc>${pagesBaseUrl}/${slug}</loc>`,
        `sitemap.xml missing route /${slug}`,
        failures,
      )
    }
  }

  if (!(await fileExists(headersPath))) {
    failures.push('Missing dist/_headers')
  } else {
    const headers = await readFile(headersPath, 'utf8')
    mustContain(headers, 'X-Frame-Options: DENY', '_headers missing X-Frame-Options', failures)
    mustContain(headers, 'X-Content-Type-Options: nosniff', '_headers missing nosniff', failures)
    mustContain(headers, 'Strict-Transport-Security:', '_headers missing HSTS', failures)
    mustContain(headers, 'Content-Security-Policy:', '_headers missing CSP', failures)
  }

  if (!(await fileExists(redirectsPath))) {
    failures.push('Missing dist/_redirects')
  } else {
    const redirects = await readFile(redirectsPath, 'utf8')
    mustContain(redirects, '/women', '_redirects missing /women rule', failures)
    mustContain(redirects, '/usage', '_redirects missing /usage rule', failures)
    mustContain(redirects, '/family', '_redirects missing /family rule', failures)
    mustContain(redirects, '/rapport', '_redirects missing /rapport target', failures)
    mustContain(redirects, '/guide', '_redirects missing /guide target', failures)
    mustContain(redirects, '/family-guide', '_redirects missing /family-guide target', failures)
  }

  for (const workerPath of compatibilityWorkerChecks) {
    if (await fileExists(workerPath)) {
      failures.push(
        `Compatibility output must not include worker runtime: ${path.relative(projectRoot, workerPath)}`,
      )
    }
  }

  if (failures.length > 0) {
    console.error('[verify-generated-site] Verification failed:')
    for (const failure of failures) {
      console.error(`- ${failure}`)
    }
    process.exit(1)
  }

  console.log('[verify-generated-site] All route, SEO, sitemap, headers, and redirects checks passed.')
}

await verify()
