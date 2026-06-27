#!/usr/bin/env python3
"""Extract the three facility logos from higo-group-logos-source.pdf."""

from __future__ import annotations

import shutil
from collections import deque
from pathlib import Path

import fitz
import numpy as np
from PIL import Image

from logo_gold_enhance import enhance_gold_logo

ROOT = Path(__file__).resolve().parents[1]
STATIC = ROOT / "public" / "static"
INCOMING = STATIC / "incoming"
PDF = INCOMING / "higo-group-logos-source.pdf"

SEGMENTS = (
    ("higonoie-full-logo-transparent.png", 0, 806),
    ("rapport-logo-light.png", 839, 1614),
    ("soulage-logo.png", 1681, 2347),
)
X_MIN = 460
ARTIFACT_MAX_PIXELS = 180


def remove_corner_artifacts(mask: np.ndarray) -> np.ndarray:
    """Drop tiny gold blobs left over from the PDF background gradient."""
    height, width = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    cleaned = mask.copy()

    for y in range(height):
        for x in range(width):
            if not mask[y, x] or visited[y, x]:
                continue
            queue: deque[tuple[int, int]] = deque([(y, x)])
            visited[y, x] = True
            coords: list[tuple[int, int]] = []
            while queue:
                cy, cx = queue.popleft()
                coords.append((cy, cx))
                for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                    if 0 <= ny < height and 0 <= nx < width and mask[ny, nx] and not visited[ny, nx]:
                        visited[ny, nx] = True
                        queue.append((ny, nx))

            if len(coords) > ARTIFACT_MAX_PIXELS:
                continue

            avg_x = sum(cx for _, cx in coords) / len(coords)
            avg_y = sum(cy for cy, _ in coords) / len(coords)
            if avg_x < width * 0.22 and avg_y < height * 0.22:
                for cy, cx in coords:
                    cleaned[cy, cx] = False

    return cleaned


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
    mask = remove_corner_artifacts(mask)

    output = np.zeros((height, width, 4), dtype=np.uint8)
    output[:, :, 0] = np.where(mask, np.clip(red, 0, 255).astype(np.uint8), 0)
    output[:, :, 1] = np.where(mask, np.clip(green, 0, 255).astype(np.uint8), 0)
    output[:, :, 2] = np.where(mask, np.clip(blue, 0, 255).astype(np.uint8), 0)
    output[:, :, 3] = np.where(mask, 255, 0).astype(np.uint8)

    alpha = output[:, :, 3]
    ys, xs = np.where(alpha > 0)
    pad = 4
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
        logo = enhance_gold_logo(extract_logo(image[y0:y1]))
        target = STATIC / filename
        extracted = INCOMING / filename.replace(".png", "-extracted.png")
        Image.fromarray(logo).save(extracted)
        shutil.copy2(extracted, target)
        print(f"Wrote {target} ({logo.shape[1]}x{logo.shape[0]})")

    shutil.copy2(STATIC / "rapport-logo-light.png", STATIC / "rapport-logo.png")


if __name__ == "__main__":
    main()
