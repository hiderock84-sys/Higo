代表理事写真の差し替え用フォルダ

【おすすめ】全体像（コラージュ）1枚だけ置く場合:
  tochihara-collage-full.jpg
  → リポジトリルートで: python3 scripts/split-tochihara-collage.py

【または】3枚を別ファイルで置く場合:
  tochihara-portrait.jpg   … 左の大きいポートレート
  tochihara-facility.jpg   … 右上
  tochihara-meeting.jpg    … 右下
  → それぞれ ../tochihara-portrait-2026.jpg などにリネームしてコピー

【スラジェ公式ロゴ】PDFの月桂冠デザイン（一般社団法人ひごのいえ＋家＋Soulage＋月桂）:
  soulage-logo.png
  → ../soulage-logo.png にコピー後 npm run logos:harmonize
  → 出力: ../soulage-facility-logo.png（サイトで使用）
