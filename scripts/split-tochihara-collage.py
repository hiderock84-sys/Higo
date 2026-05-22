#!/usr/bin/env python3
"""全体像コラージュを3枚に分割して public/static に書き出す。"""
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    raise SystemExit("Pillow が必要です: pip install pillow")

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "public/static/incoming/tochihara-collage-full.jpg"
OUT_DIR = ROOT / "public/static"
NAMES = (
    "tochihara-portrait-2026.jpg",
    "tochihara-facility-2026.jpg",
    "tochihara-meeting-2026.jpg",
)


def main() -> None:
    if not INPUT.is_file():
        raise SystemExit(
            f"入力がありません:\n  {INPUT}\n"
            "添付の全体像を上記パスに保存してから再実行してください。"
        )

    image = Image.open(INPUT).convert("RGB")
    w, h = image.size
    split_x = round(w * 0.52)
    mid_y = round(h / 2)

    boxes = [
        (0, 0, split_x, h),
        (split_x, 0, w, mid_y),
        (split_x, mid_y, w, h),
    ]

    for box, name in zip(boxes, NAMES):
        part = image.crop(box)
        target = OUT_DIR / name
        part.save(target, "JPEG", quality=93, optimize=True)
        print(f"wrote {target} ({part.size[0]}x{part.size[1]})")

    print("完了: npm run build && npm run deploy:prod")


if __name__ == "__main__":
    main()
