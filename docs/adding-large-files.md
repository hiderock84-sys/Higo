# 容量の大きいファイルをサイトに載せる方法

## 基本（いまのひごのいえ）

1. 画像・PDF などを **`public/static/`** に置く  
2. HTML から **`/static/ファイル名`** で参照する  
3. 更新後は **`npm run build`** → **`npm run deploy:prod`**（または PR マージ後の自動デプロイ）

例:

```html
<img src="/static/my-photo.jpg?v=20260529" alt="説明" width="1200" height="800" loading="lazy">
```

キャッシュ対策で、差し替えたら **`?v=日付`** を付けてください。

## Cloudflare Pages の目安

| 項目 | 目安 |
|------|------|
| 1ファイル上限 | 約 **25MB** |
| リポジトリ全体 | 無料プランは **500MB** 前後が実務的な上限 |

2〜3MB の JPEG が多数あると、デプロイと表示が重くなります。

## おすすめ手順（画像）

1. **リサイズ** … 表紙は横 1920px、本文用は 1200〜1600px 程度で十分  
2. **圧縮** … JPEG 品質 75〜85、可能なら **WebP** も併用  
3. **ファイル名** … 英数字・ハイフン（例: `facility-garden-2026.webp`）  
4. Git にコミット → デプロイ

コマンド例（ImageMagick が入っている場合）:

```bash
magick input.jpg -resize 1920x\> -quality 82 public/static/hero-new.jpg
```

## それでも大きい場合（動画・数十MB〜）

Git や Pages に直置きせず、次のいずれかを使います。

- **Cloudflare R2**（ストレージ）＋公開 URL  
- **YouTube / Vimeo**（動画は埋め込み）  
- **Google Drive** 等は避け、専用 CDN か R2 を推奨

サイトからは通常の `<img src="https://...">` または `<video>` で参照します。

## 注意

- **Git LFS** だけでは Pages の表示速度は改善しません。公開前の圧縮が重要です。  
- 個人情報のある原本はリポジトリに入れず、加工済みのみを `public/static/` に置いてください。
