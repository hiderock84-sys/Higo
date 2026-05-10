# ひごのいえ

依存症回復支援施設「ひごのいえ」のランディングサイトです。  
Cloudflare Pages 向けに、静的ページ + Workers ルーティングで構成しています。

## ページ構成

### メイン
- `/` (トップ)

### セクション専用ページ
- `/about` (私たちについて)
- `/staff` (スタッフ紹介)
- `/program` (プログラム)
- `/testimonials` (体験談)
- `/rapport` (女性専用施設)
- `/grouphome` (グループホーム)
- `/guide` (利用案内)
- `/family-guide` (家族ガイド)
- `/contact` (相談窓口)

### 互換ルート（旧リンク）
- `/women` → `/rapport`
- `/usage` → `/guide`
- `/family` → `/family-guide`

## SEO / 品質

- ルート別に静的HTMLを生成（title/description/canonical/OGP/Twitter）
- `robots.txt` / `sitemap.xml` を配信
- JSON-LD（Organization / FAQPage）を埋め込み
- ルート別本文（要約 + 要点）を自動生成

## 開発コマンド

```bash
npm run dev
npm run build
npm run verify:site
```

### build の内容
`npm run build` は以下を連続実行します:
1. `vite build`
2. `scripts/prepare-pages-output.mjs`（互換出力・ルート別静的ページ生成）
3. `scripts/verify-generated-site.mjs`（自動検証）

検証で失敗した場合、ビルドはエラー終了します。

## デプロイ

```bash
npm run deploy
```

`CLOUDFLARE_API_TOKEN` が設定されている場合のみ、Wrangler による deploy を実行します。

## 技術スタック

- Vite
- Hono（Cloudflare Workers）
- Cloudflare Pages
- 静的HTML / CSS / JavaScript
