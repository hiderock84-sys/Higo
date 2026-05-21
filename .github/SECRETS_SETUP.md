# GitHub Secrets 手動登録（Agent からは自動登録不可）

Cloud Agent の GitHub トークンに Secrets 書き込み権限がないため、**リポジトリ管理者**が以下を登録してください。

**設定 URL:** https://github.com/hiderock84-sys/Higo/settings/secrets/actions

| Secret 名 | 値 |
|-----------|-----|
| `CLOUDFLARE_API_TOKEN` | （ご提供いただいた API トークン） |
| `CLOUDFLARE_ACCOUNT_ID` | `e696c49d9b07a09be98acdb426cb008e` |

登録後: Actions → **Deploy to Cloudflare Pages** → **Run workflow**
