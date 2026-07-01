代表理事写真の差し替え用フォルダ

【おすすめ】全体像（コラージュ）1枚だけ置く場合:
  tochihara-collage-full.jpg
  → リポジトリルートで: python3 scripts/split-tochihara-collage.py

【または】3枚を別ファイルで置く場合:
  tochihara-portrait.jpg   … 左の大きいポートレート
  tochihara-facility.jpg   … 右上
  tochihara-meeting.jpg    … 右下
  → それぞれ ../tochihara-portrait-2026.jpg などにリネームしてコピー

【スラジェ公式ロゴ】PDF（HIGO NO IE GROUP 3ロゴ版）から右端を切り出し:
  public/static/incoming/soulage-logo-official.pdf
  → soulage-logo.png に配置後 npm run logos:harmonize
  → 出力: soulage-wreath-logo.png（サイトで使用）
