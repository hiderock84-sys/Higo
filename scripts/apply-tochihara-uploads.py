#!/usr/bin/env python3
"""チャット／incoming に置いた3枚を代表理事用ファイルへ反映する。"""
from pathlib import Path
from shutil import copy2

ROOT = Path(__file__).resolve().parents[1]
INCOMING = ROOT / "public/static/incoming"
OUT = ROOT / "public/static"
PAIRS = (
    ("tochihara-portrait.jpg", "tochihara-portrait-2026.jpg"),
    ("tochihara-facility.jpg", "tochihara-facility-2026.jpg"),
    ("tochihara-meeting.jpg", "tochihara-meeting-2026.jpg"),
)


def main() -> None:
    copied = 0
    for src_name, dst_name in PAIRS:
        src = INCOMING / src_name
        if not src.is_file():
            continue
        dst = OUT / dst_name
        copy2(src, dst)
        print(f"copied {src} -> {dst} ({dst.stat().st_size} bytes)")
        copied += 1
    if copied == 0:
        raise SystemExit(
            "incoming に写真がありません。次の3ファイルを置いて再実行:\n"
            + "\n".join(f"  {INCOMING / n}" for n, _ in PAIRS)
        )
    print(f"完了 ({copied} 枚)。npm run build && npm run deploy:prod")


if __name__ == "__main__":
    main()
