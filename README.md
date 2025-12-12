# ひごのいえ - 依存症回復支援施設

## プロジェクト概要
- **名前**: ひごのいえ (Higonoie)
- **目標**: 熊本県御船町にある依存症回復支援施設のランディングページ
- **主な機能**: 
  - 施設情報の紹介
  - 回復支援プログラムの説明
  - 相談窓口の案内
  - スタッフの体験談
  - レスポンシブデザイン対応

## URL
- **本番環境**: https://higonoie.pages.dev/
- **ローカルテスト**: https://3000-iskfi6o22jcy0uz3roc7j-2e77fc33.sandbox.novita.ai

## 完了した機能
✅ ヒーロー画像を美しい鳥居と湖の風景画像に更新
✅ 完全なランディングページ構造
✅ レスポンシブデザイン（モバイル/デスクトップ対応）
✅ モバイルメニュー機能
✅ スムーズスクロール
✅ 連絡先情報（電話/メール）
✅ 日本語フォント対応（Shippori Mincho B1, Zen Kaku Gothic New, Noto Serif JP）

## データアーキテクチャ
- **データモデル**: 静的コンテンツ（HTML/CSS）
- **ストレージ**: Cloudflare Pages（CDN経由で配信）
- **画像**: 
  - ヒーロー画像: `/static/hero-image.jpg` (鳥居と湖の風景)
  - カスタムCSS: `/static/style.css`

## ユーザーガイド
このサイトは、依存症からの回復を目指す方々とそのご家族のための情報提供サイトです。

**主要セクション:**
1. **ヒーローセクション**: 施設のビジョンとメッセージ
2. **三つの柱**: Hope（希望）、Honesty（正直）、Healing（回復）
3. **回復者の体験談**: リアルなストーリー
4. **相談窓口**: 電話・メール連絡先
5. **アクセス情報**: 施設の所在地と連絡先

**連絡先:**
- 電話: 0964-41-2387
- メール: info@higonoie.or.jp
- 受付時間: 平日 10:00〜17:00

## デプロイ
- **プラットフォーム**: Cloudflare Pages
- **ステータス**: ✅ 更新準備完了
- **技術スタック**: HTML5 + CSS3 + Vanilla JavaScript + Cloudflare Workers
- **最終更新**: 2025-12-12

## デプロイ手順

### Cloudflare Pagesへのデプロイ
1. Cloudflare APIキーの設定が必要です
2. DeployタブでAPIキーを設定
3. 以下のコマンドでデプロイ:
```bash
cd /home/user/webapp
npx wrangler pages deploy dist --project-name higonoie
```

### ローカル開発
```bash
cd /home/user/webapp/dist
python3 -m http.server 3000
```

ブラウザで http://localhost:3000 にアクセス

## プロジェクト構成
```
webapp/
├── dist/               # デプロイ用ディレクトリ
│   ├── index.html     # メインHTMLファイル
│   ├── static/        # 静的アセット
│   │   ├── style.css  # カスタムCSS
│   │   └── hero-image.jpg # ヒーロー背景画像（鳥居と湖）
│   └── _worker.js     # Cloudflare Workerスクリプト
├── public/            # ソース静的ファイル
├── src/               # ソースコード
├── .gitignore         # Git除外ファイル
├── wrangler.jsonc     # Cloudflare設定
└── README.md          # このファイル
```

## 推奨される次のステップ
1. ✅ ヒーロー画像の更新 - **完了**
2. Cloudflare APIキーを設定してデプロイ
3. カスタムドメインの設定（例: www.higonoie.or.jp）
4. Google Analyticsの追加（アクセス解析）
5. お問い合わせフォームの機能追加
6. 追加ページの作成（プログラム詳細、スタッフ紹介など）

## 技術詳細

### 使用技術
- **フロントエンド**: HTML5, CSS3, JavaScript (Vanilla)
- **CSSフレームワーク**: Tailwind CSS (CDN)
- **フォント**: Google Fonts (Shippori Mincho B1, Zen Kaku Gothic New, Noto Serif JP)
- **デプロイ**: Cloudflare Pages + Workers
- **バージョン管理**: Git

### 画像の詳細
- **ヒーロー画像**: `/static/hero-image.jpg`
  - 説明: 美しい鳥居と湖、山々の風景
  - サイズ: 116.4 KB
  - 用途: ランディングページのメインビジュアル
  - グラデーションオーバーレイ: `rgba(70, 130, 150, 0.25)` → `rgba(52, 140, 169, 0.45)`

### カスタマイゼーション
CSSの主要カラーパレット:
- プライマリ: `#348ca9` (ティールブルー)
- セカンダリ: `#165c9a` (ディープブルー)
- アクセント: `#2dbca0` (ターコイズ)

## 変更履歴
- 2025-12-12: ヒーロー画像を鳥居と湖の風景に更新
- 2025-12-12: 初期プロジェクト作成
