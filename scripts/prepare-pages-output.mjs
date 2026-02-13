import { mkdir, rm, cp, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFile = fileURLToPath(import.meta.url)
const projectRoot = path.resolve(path.dirname(currentFile), '..')
const distDir = path.join(projectRoot, 'dist')
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
const allOutputTargets = [distDir, ...targets]
const cleanupAssets = [
  path.join(projectRoot, 'dist', 'static', 'logo-design.jpg'),
  ...targets.map((target) => path.join(target, 'static', 'logo-design.jpg')),
]
const pagesBaseUrl = 'https://higono-ie.pages.dev'
const routePageDefinitions = [
  {
    slug: 'top',
    title: 'トップ | ひごのいえ',
    description: '依存症回復支援施設ひごのいえのトップページ。相談・回復支援・連携体制の概要をご案内します。',
  },
  {
    slug: 'about',
    title: '私たちについて | ひごのいえ',
    description: 'ひごのいえの理念と依存症回復支援体制をご紹介します。',
  },
  {
    slug: 'staff',
    title: 'スタッフ紹介 | ひごのいえ',
    description: '回復経験と支援経験を持つスタッフによるサポート体制をご紹介します。',
  },
  {
    slug: 'program',
    title: 'プログラム | ひごのいえ',
    description: '希望・正直・回復を軸にした、再発予防まで見据えた回復支援プログラムの概要です。',
  },
  {
    slug: 'testimonials',
    title: '体験談 | ひごのいえ',
    description: '依存症回復を実現した体験談と、回復への具体的な道のりをご紹介します。',
  },
  {
    slug: 'rapport',
    title: '女性専用施設 | ひごのいえ',
    description: '女性専用施設らぽーるの支援内容と、安心して回復できる環境をご案内します。',
  },
  {
    slug: 'grouphome',
    title: 'グループホーム | ひごのいえ',
    description: '共同生活を通じた生活再建と回復支援についてご紹介します。',
  },
  {
    slug: 'guide',
    title: '利用案内 | ひごのいえ',
    description: '初回相談から利用開始、生活再建までのご利用の流れをご案内します。',
  },
  {
    slug: 'family-guide',
    title: '家族ガイド | ひごのいえ',
    description: 'ご家族向けの相談支援と連携体制についてご案内します。',
  },
  {
    slug: 'contact',
    title: '相談窓口 | ひごのいえ',
    description: '相談窓口の受付時間と連絡先をご案内します。',
  },
]

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

async function syncRootFilesForOutputs() {
  const sourceIndex = path.join(projectRoot, 'index.html')
  const sourceStyle = path.join(projectRoot, 'public', 'static', 'style.css')
  const html = await readFile(sourceIndex, 'utf8')
  const css = await readFile(sourceStyle, 'utf8')

  for (const target of allOutputTargets) {
    await mkdir(path.join(target, 'static'), { recursive: true })
    await writeFile(path.join(target, 'index.html'), html)
    await writeFile(path.join(target, 'static', 'style.css'), css)
  }
}

function escapeAttr(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
}

function applySeoMetadata(sourceHtml, pageDefinition) {
  const pageUrl = `${pagesBaseUrl}/${pageDefinition.slug}`
  const escapedTitle = escapeAttr(pageDefinition.title)
  const escapedDescription = escapeAttr(pageDefinition.description)

  return sourceHtml
    .replace(/<title>.*?<\/title>/s, `<title>${escapedTitle}</title>`)
    .replace(
      /<meta name="description" content=".*?">/s,
      `<meta name="description" content="${escapedDescription}">`,
    )
    .replace(
      /<link rel="canonical" href=".*?">/s,
      `<link rel="canonical" href="${pageUrl}">`,
    )
    .replace(
      /<meta property="og:title" content=".*?">/s,
      `<meta property="og:title" content="${escapedTitle}">`,
    )
    .replace(
      /<meta property="og:description" content=".*?">/s,
      `<meta property="og:description" content="${escapedDescription}">`,
    )
    .replace(/<meta property="og:url" content=".*?">/s, `<meta property="og:url" content="${pageUrl}">`)
    .replace(
      /<meta name="twitter:title" content=".*?">/s,
      `<meta name="twitter:title" content="${escapedTitle}">`,
    )
    .replace(
      /<meta name="twitter:description" content=".*?">/s,
      `<meta name="twitter:description" content="${escapedDescription}">`,
    )
}

async function generateSectionPagesForOutputs() {
  const sourceIndex = path.join(projectRoot, 'index.html')
  const html = await readFile(sourceIndex, 'utf8')

  for (const target of allOutputTargets) {
    for (const pageDefinition of routePageDefinitions) {
      const pageHtml = applySeoMetadata(html, pageDefinition)
      const outputPath = path.join(target, pageDefinition.slug, 'index.html')
      await mkdir(path.dirname(outputPath), { recursive: true })
      await writeFile(outputPath, pageHtml)
    }
  }
}

async function cleanupUnusedAssets() {
  for (const assetPath of cleanupAssets) {
    await rm(assetPath, { force: true })
  }
}

await copyDistToTargets()
await syncRootFilesForOutputs()
await generateSectionPagesForOutputs()
await syncRootFilesForSubprojects()
await cleanupUnusedAssets()
