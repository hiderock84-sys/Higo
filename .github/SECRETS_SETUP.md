# デプロイ用シークレット設定（必須）

本番 `https://higonoie.com` に反映するには、**Cloudflare API トークン**が必要です。  
Cloud Agent からは **こちらで自動登録できません**（GitHub / Cursor の権限のため）。オーナーが次のいずれかを設定してください。

---

## 方法 A: Cursor Cloud Agent（推奨・「Agent にデプロイして」と言う場合）

1. https://cursor.com/dashboard/cloud-agents を開く
2. **Secrets** タブ
3. 次を **Runtime Secret** として追加:
   - `CLOUDFLARE_API_TOKEN` … Cloudflare の API トークン（Pages Edit 権限）
   - `CLOUDFLARE_ACCOUNT_ID` … `e696c49d9b07a09be98acdb426cb008e`
4. **Cloud Agent を再起動**（実行中のままでは環境変数が入りません）
5. チャットで「`npm run deploy:prod` を実行して」と依頼

---

## 方法 B: GitHub Actions（push で自動デプロイ）

**設定 URL:** https://github.com/hiderock84-sys/Higo/settings/secrets/actions

| Secret 名 | 値 |
|-----------|-----|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API トークン |
| `CLOUDFLARE_ACCOUNT_ID` | `e696c49d9b07a09be98acdb426cb008e` |

登録後: Actions → **Deploy to Cloudflare Pages** → **Run workflow**（branch: `main`）

---

## 方法 C: 手動 ZIP（トークン不要・約5分）

1. https://github.com/hiderock84-sys/Higo/releases/tag/deploy-20260531 から ZIP をダウンロード
2. Cloudflare Dashboard → Workers & Pages → **higo** → Create deployment → Upload assets

---

## トークン作成

https://dash.cloudflare.com/profile/api-tokens → テンプレート「Edit Cloudflare Workers」または Pages Edit 権限

---

## 反映確認

https://higonoie.com/rapport のページソースに **`rapport-faq-block`** があれば拡充版です。
