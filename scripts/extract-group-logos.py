#!/usr/bin/env python3
"""Extract the three facility logos from higo-group-logos-source.pdf."""

from __future__ import annotations

import shutil
from pathlib import Path

import fitz
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
STATIC = ROOT / "public" / "static"
INCOMING = STATIC / "incoming"
PDF = INCOMING / "higo-group-logos-source.pdf"

SEGMENTS = (
    ("higonoie-full-logo-transparent.png", 0, 806),
    ("rapport-logo-light.png", 839, 1614),
    ("soulage-logo.png", 1681, 2347),
)
X_MIN = 620


def extract_logo(segment: np.ndarray, x_min: int = X_MIN) -> np.ndarray:
    cropped = segment[:, x_min:]
    height, width = cropped.shape[:2]
    red = cropped[:, :, 0].astype(np.int16)
    green = cropped[:, :, 1].astype(np.int16)
    blue = cropped[:, :, 2].astype(np.int16)

    is_gold = (
        (red + green > blue + 100)
        & (red > 130)
        & (green > 90)
        & (blue < 170)
        & (red > blue + 30)
    )
    is_light = (red > 200) & (green > 180) & (blue > 140) & (red - blue < 100)
    mask = is_gold | is_light

    output = np.zeros((height, width, 4), dtype=np.uint8)
    output[:, :, 0] = np.where(mask, np.clip(red, 0, 255).astype(np.uint8), 0)
    output[:, :, 1] = np.where(mask, np.clip(green, 0, 255).astype(np.uint8), 0)
    output[:, :, 2] = np.where(mask, np.clip(blue, 0, 255).astype(np.uint8), 0)
    output[:, :, 3] = np.where(mask, 255, 0).astype(np.uint8)

    alpha = output[:, :, 3]
    ys, xs = np.where(alpha > 0)
    pad = 2
    y0 = max(0, ys.min() - pad)
    y1 = min(height, ys.max() + pad + 1)
    x0 = max(0, xs.min() - pad)
    x1 = min(width, xs.max() + pad + 1)
    return output[y0:y1, x0:x1]


def main() -> None:
    if not PDF.exists():
        raise SystemExit(f"Missing source PDF: {PDF}")

    INCOMING.mkdir(parents=True, exist_ok=True)
    pix = fitz.open(PDF)[0].get_pixmap(matrix=fitz.Matrix(3, 3), alpha=True)
    image = np.array(
        Image.frombytes("RGBA", [pix.width, pix.height], pix.samples)
    )

    for filename, y0, y1 in SEGMENTS:
        logo = extract_logo(image[y0:y1])
        target = STATIC / filename
        extracted = INCOMING / filename.replace(".png", "-extracted.png")
        Image.fromarray(logo).save(extracted)
        shutil.copy2(extracted, target)
        print(f"Wrote {target} ({logo.shape[1]}x{logo.shape[0]})")

    shutil.copy2(STATIC / "rapport-logo-light.png", STATIC / "rapport-logo.png")


if __name__ == "__main__":
    main()
