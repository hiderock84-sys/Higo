# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

静的ランディングページ（依存症回復支援施設「ひごのいえ」）。Hono + Vite + Cloudflare Pages構成。

### Development commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite開発サーバー起動 (port 5173) |
| `npm run build` | プロダクションビルド (`dist/` 出力) |
| `npm run dev:sandbox` | Wrangler Pages ローカルプレビュー (port 3000、要事前ビルド) |

### Notes

- lint/test用の専用コマンドは未設定。`npm run build` でビルドエラーの確認が可能。
- `npm run test` は `curl http://localhost:3000` のみ（Wrangler sandbox向け）。Vite開発サーバーのテストは `curl http://localhost:5173/` で行う。
- デプロイには `CLOUDFLARE_API_TOKEN` 環境変数が必要だが、ローカル開発には不要。
- `higono-ie/` と `hidonoie/` ディレクトリはビルド出力のミラーコピー。開発時は無視してよい。
