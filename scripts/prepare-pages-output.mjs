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
    summaryTitle: '回復支援の全体像',
    summaryLead:
      '依存症は、適切な支援・環境・仲間とのつながりがあれば回復できる病気です。ひごのいえは、当事者とご家族が「次の一歩」を踏み出すための回復拠点です。',
    summaryBody:
      '医療機関・行政機関・ご家族と連携しながら、初回相談から生活再建までを一貫して支援します。まずは現在の状況を、安心してご相談ください。',
    summaryPoints: [
      '初回相談は無料。秘密厳守で対応します。',
      'ご本人だけでなく、ご家族のみの相談にも対応します。',
      '女性専用施設・共同生活支援・退所後支援まで一体で伴走します。',
    ],
  },
  {
    slug: 'about',
    title: '私たちについて | ひごのいえ',
    description: 'ひごのいえの理念と依存症回復支援体制をご紹介します。',
    summaryTitle: '私たちについて',
    summaryLead:
      'ひごのいえは、依存症に悩む方の「生き直し」を支えるために、医療・福祉・行政との連携を重視した支援体制を整えています。',
    summaryBody:
      '本人の尊厳を守ること、ご家族の不安を軽減すること、社会との再接続を現実的に設計すること。この3点を軸に、回復の道のりを具体化します。',
    summaryPoints: [
      '一人ひとりの背景に合わせた個別支援計画',
      '医療機関・行政機関との連携による安全な受け入れ',
      '退所後の生活再建まで見据えた継続支援',
    ],
  },
  {
    slug: 'staff',
    title: 'スタッフ紹介 | ひごのいえ',
    description: '回復経験と支援経験を持つスタッフによるサポート体制をご紹介します。',
    summaryTitle: 'スタッフ紹介',
    summaryLead:
      'ひごのいえには、依存症支援の経験を持つスタッフに加え、回復を実体験として語れるスタッフが在籍しています。',
    summaryBody:
      '「わかる」だけで終わらせず、再発予防に向けた具体的な行動に落とし込む支援を重視。日々の対話を通じて、安心できる関係づくりを進めます。',
    summaryPoints: [
      '当事者性と専門性を両立したサポート体制',
      '生活・就労・家族関係まで見据えた助言',
      '孤立を防ぐ伴走型コミュニケーション',
    ],
  },
  {
    slug: 'program',
    title: 'プログラム | ひごのいえ',
    description: '希望・正直・回復を軸にした、再発予防まで見据えた回復支援プログラムの概要です。',
    summaryTitle: '回復プログラム',
    summaryLead:
      '回復には、焦らず段階を踏むことが欠かせません。ひごのいえでは「Hope・Honesty・Healing」を軸に、着実な回復プロセスを設計します。',
    summaryBody:
      '状態の整理、生活リズムの再構築、対人関係の回復、再発予防計画までを一連の流れで支援。必要に応じて関係機関と連携しながら進めます。',
    summaryPoints: [
      '初期安定化：安全確保と生活基盤の立て直し',
      '中期支援：習慣改善と再発要因の可視化',
      '移行支援：地域生活・就労・家族関係の再構築',
    ],
  },
  {
    slug: 'testimonials',
    title: '体験談 | ひごのいえ',
    description: '依存症回復を実現した体験談と、回復への具体的な道のりをご紹介します。',
    summaryTitle: '体験談',
    summaryLead:
      '回復者の声には、苦しみを乗り越えるための実践知が詰まっています。同じ痛みを抱える方にとって、次の一歩を後押しする力になります。',
    summaryBody:
      '薬物・ギャンブル・アルコールなど背景は異なっても、適切な支援で人生を再構築できることは共通しています。ぜひ、具体的な変化の過程をご覧ください。',
    summaryPoints: [
      'どん底から回復へ向かった実例',
      '家族関係・就労・生活の再建プロセス',
      '回復を継続するための具体的な行動変化',
    ],
  },
  {
    slug: 'rapport',
    title: '女性専用施設 | ひごのいえ',
    description: '女性専用施設らぽーるの支援内容と、安心して回復できる環境をご案内します。',
    summaryTitle: '女性専用施設 らぽーる',
    summaryLead:
      '女性専用施設「らぽーる」では、女性が安心して心を開ける環境づくりを最優先に、回復支援を行っています。',
    summaryBody:
      '女性スタッフが常駐し、家庭背景や対人トラウマ、育児課題など女性特有の事情に配慮した支援を実施。安心と尊厳を守りながら回復を支えます。',
    summaryPoints: [
      '女性スタッフ常駐による安心の相談体制',
      'プライバシーと安全を重視した生活環境',
      '再発予防と社会復帰を見据えた個別伴走支援',
    ],
  },
  {
    slug: 'grouphome',
    title: 'グループホーム | ひごのいえ',
    description: '共同生活を通じた生活再建と回復支援についてご紹介します。',
    summaryTitle: 'グループホーム',
    summaryLead:
      'グループホームでは、安心できる共同生活を通じて、生活習慣・対人関係・自己管理力の回復を目指します。',
    summaryBody:
      '日々の生活を整えながら、孤立を防ぎ、社会とつながる力を少しずつ取り戻すことを重視。無理のないペースで生活再建を進めます。',
    summaryPoints: [
      '生活リズムの再構築とセルフケア習慣の定着',
      '仲間との関係づくりを通じた孤立予防',
      '地域生活移行を見据えた段階的な支援',
    ],
  },
  {
    slug: 'guide',
    title: '利用案内 | ひごのいえ',
    description: '初回相談から利用開始、生活再建までのご利用の流れをご案内します。',
    summaryTitle: '利用案内',
    summaryLead:
      '初回相談から利用開始、回復プログラム、退所後支援まで、ひごのいえの利用の流れをわかりやすくご案内します。',
    summaryBody:
      '「何を準備すればよいかわからない」という段階でも問題ありません。現在の状況を伺いながら、必要な手続きと次の行動を丁寧に整理します。',
    summaryPoints: [
      '初回相談（電話・メール）',
      '状況確認と受け入れ検討（関係機関連携）',
      '利用開始後の継続支援と生活再建サポート',
    ],
  },
  {
    slug: 'family-guide',
    title: '家族ガイド | ひごのいえ',
    description: 'ご家族向けの相談支援と連携体制についてご案内します。',
    summaryTitle: '家族ガイド',
    summaryLead:
      '依存症は本人だけでなく、ご家族にも大きな影響を及ぼします。ひごのいえは、ご家族が孤立しないための支援を重視しています。',
    summaryBody:
      '責めない関わり方、境界線の保ち方、支援機関との連携方法など、ご家族が「今できること」を整理し、回復を支える土台をつくります。',
    summaryPoints: [
      'ご家族のみの相談にも対応',
      '関わり方の整理と心理的負担の軽減支援',
      '医療・行政との連携を含めた実践的サポート',
    ],
  },
  {
    slug: 'contact',
    title: '相談窓口 | ひごのいえ',
    description: '相談窓口の受付時間と連絡先をご案内します。',
    summaryTitle: '相談窓口',
    summaryLead:
      '「相談していいのかわからない」段階でも大丈夫です。ひごのいえは、最初の一歩を丁寧に受け止める相談窓口を整えています。',
    summaryBody:
      'ご本人・ご家族・医療機関・行政機関からの相談に対応し、状況に応じた支援の選択肢をご提案します。秘密は厳守いたします。',
    summaryPoints: [
      '電話：0964-41-2387（平日10:00〜17:00）',
      'メール：info@higonoie.or.jp（24時間受付）',
      '面談相談：予約制（ご家族のみの相談可）',
    ],
  },
]

async function copyDistToTargets() {
  for (const target of targets) {
    await rm(target, { recursive: true, force: true })
    await mkdir(path.dirname(target), { recursive: true })
    await cp(distDir, target, { recursive: true })
  }
}

async function removeWorkersFromOutputs() {
  for (const target of [distDir, ...targets]) {
    await rm(path.join(target, '_worker.js'), { force: true })
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

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
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

function renderRouteSummarySection(pageDefinition) {
  const points = pageDefinition.summaryPoints
    .map((point) => `      <li>${escapeHtml(point)}</li>`)
    .join('\n')

  return `  <section class="content-section route-summary" id="route-summary">
    <h2 class="section-title">${escapeHtml(pageDefinition.summaryTitle)}</h2>
    <div class="text-content">
      ${escapeHtml(pageDefinition.summaryLead)}
    </div>
    <div class="text-content">
      ${escapeHtml(pageDefinition.summaryBody)}
    </div>
    <ul class="route-summary-list" aria-label="${escapeHtml(pageDefinition.summaryTitle)}のポイント">
${points}
    </ul>
  </section>`
}

function applyRouteSummary(sourceHtml, pageDefinition) {
  const summarySection = renderRouteSummarySection(pageDefinition)
  return sourceHtml.replace(
    /<!-- ROUTE_SUMMARY_START -->[\s\S]*?<!-- ROUTE_SUMMARY_END -->/s,
    `<!-- ROUTE_SUMMARY_START -->\n${summarySection}\n  <!-- ROUTE_SUMMARY_END -->`,
  )
}

async function generateSectionPagesForOutputs() {
  const sourceIndex = path.join(projectRoot, 'index.html')
  const html = await readFile(sourceIndex, 'utf8')

  for (const target of allOutputTargets) {
    for (const pageDefinition of routePageDefinitions) {
      const pageHtml = applyRouteSummary(applySeoMetadata(html, pageDefinition), pageDefinition)
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
await removeWorkersFromOutputs()
await syncRootFilesForOutputs()
await generateSectionPagesForOutputs()
await syncRootFilesForSubprojects()
await cleanupUnusedAssets()
