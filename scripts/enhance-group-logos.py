#!/usr/bin/env python3
"""Enhance gold facility logos for balanced visibility on dark backgrounds."""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from logo_gold_enhance import enhance_gold_logo

STATIC = ROOT / "public" / "static"
INCOMING = STATIC / "incoming"
LOGOS = (
    "higonoie-full-logo-transparent.png",
    "rapport-logo-light.png",
    "soulage-logo.png",
)


def main() -> None:
    INCOMING.mkdir(parents=True, exist_ok=True)

    for filename in LOGOS:
        source = STATIC / filename
        if not source.exists():
            raise SystemExit(f"Missing logo file: {source}")

        logo = enhance_gold_logo(np.array(Image.open(source).convert("RGBA")))
        extracted = INCOMING / filename.replace(".png", "-enhanced.png")
        Image.fromarray(logo).save(extracted)
        shutil.copy2(extracted, source)
        print(f"Enhanced {source} ({logo.shape[1]}x{logo.shape[0]})")

    shutil.copy2(STATIC / "rapport-logo-light.png", STATIC / "rapport-logo.png")


if __name__ == "__main__":
    main()
