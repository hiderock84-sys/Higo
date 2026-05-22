# 代表理事写真の差し替え手順（オリジナルファイル用）

チャットに貼った画像は、こちらのサーバーに**ファイルとして届かない**ことがあります。
そのため「添付と同じ写真」にするには、次の手順でファイルをリポジトリに置いてください。

## 手順（全体像1枚でOK）

1. ブラウザで開く:  
   https://github.com/hiderock84-sys/Higo/upload/main/public/static/incoming

2. 添付の**全体像（コラージュ）**を `tochihara-collage-full.jpg` という名前でアップロード

3. 「Commit changes」を押す

4. こちら（または Cloud Agent）に「アップロードした」と伝える

5. 実行されるコマンド:

```bash
python3 scripts/split-tochihara-collage.py
npm run build
npm run deploy:prod
```

## 3枚を別々に送る場合

同じフォルダに次の名前で置く:

- `tochihara-portrait.jpg` → `public/static/tochihara-portrait-2026.jpg` にコピー
- `tochihara-facility.jpg` → `public/static/tochihara-facility-2026.jpg`
- `tochihara-meeting.jpg` → `public/static/tochihara-meeting-2026.jpg`

## 現在のサイトについて

`https://higonoie.com` には近似画像が載っていますが、**ご提供のオリジナルバイナリとは別ファイル**です。
オリジナルに差し替えるには上記アップロードが必要です。
