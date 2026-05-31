# デプロイ手順（Cloudflare Pages: higo）

## 自動デプロイ（GitHub Actions）

`main` ブランチへの push でワークフロー `Deploy to Cloudflare Pages` が実行されます。

### 必須: GitHub リポジトリ Secrets

| Secret 名 | 内容 |
|-----------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API トークン（Pages Edit 権限） |
| `CLOUDFLARE_ACCOUNT_ID` | `e696c49d9b07a09be98acdb426cb008e` |

設定場所: https://github.com/hiderock84-sys/Higo/settings/secrets/actions

トークン作成: https://dash.cloudflare.com/profile/api-tokens → 「Edit Cloudflare Workers」テンプレート

### 手動デプロイ（Actions）

1. Secrets を設定
2. Actions → **Deploy to Cloudflare Pages** → **Run workflow** → branch: `main`

## ローカル / Cloud Agent からデプロイ

```bash
export CLOUDFLARE_API_TOKEN="your-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
npm run deploy:prod
```

## ビルド設定（Cloudflare ダッシュボード Git 連携時）

| 項目 | 値 |
|------|-----|
| ビルドコマンド | `npm run build` |
| ビルド出力ディレクトリ | `dist` |
| Node.js バージョン | 20 |

## デプロイ確認

成功後、次の URL で新画像を確認:

- `https://higo-8il.pages.dev/static/hero-cover-aso-kumamoto.jpg?v=20260521b`
- トップのヒーローに阿蘇の草原画像
- スタッフ欄に `staff-energetic-laughing.jpg`

Safari ではキャッシュ削除またはスーパーリロードを実施してください。

## 「らぽーるの新しいページが見えない」とき

本番 `https://higonoie.com/rapport` は **Cloudflare Pages に最新ビルドが載っていない** と、短い旧版のままになります。

### 確認方法

ブラウザでページのソースを表示し、次の文字列があるか確認:

- ある → 最新版: `rapport-faq-block`（よくある質問ブロック）
- ない → 未デプロイ: 下記の Secrets 設定とデプロイを実施

### よくある原因

1. **GitHub Secrets 未設定** — Actions のデプロイが `CLOUDFLARE_API_TOKEN` 不足で失敗している（ログに `non-interactive environment` と出る）
2. **`main` が古い** — 機能ブランチだけ更新され、本番用 `main` にマージされていない
3. **ブラウザキャッシュ** — スーパーリロード（Cmd+Shift+R / Ctrl+Shift+R）

Secrets 設定後: Actions → **Deploy to Cloudflare Pages** → **Run workflow**（branch: `main`）
