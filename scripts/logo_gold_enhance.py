"""Shared gold-logo color enhancement and cleanup."""

from __future__ import annotations

from collections import deque

import numpy as np


def _connected_components(mask: np.ndarray) -> list[list[tuple[int, int]]]:
    height, width = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    components: list[list[tuple[int, int]]] = []

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
            components.append(coords)

    return components


def remove_stray_artifacts(rgba: np.ndarray) -> np.ndarray:
    """Remove detached PDF-gradient blobs from the top-left of logo PNGs."""
    output = rgba.copy()
    mask = output[:, :, 3] > 20
    height, width = mask.shape
    cleaned = np.zeros_like(mask, dtype=bool)

    for coords in _connected_components(mask):
        xs = [point[1] for point in coords]
        ys = [point[0] for point in coords]
        max_x = max(xs)
        max_y = max(ys)
        min_x = min(xs)
        min_y = min(ys)
        size = len(coords)
        left_cutoff = max(52, int(width * 0.065))

        if max_x < left_cutoff and max_y < int(height * 0.24):
            continue
        if max_x < int(width * 0.035) and size < 600:
            continue
        if size < 320 and max_x < int(width * 0.08) and min_y < int(height * 0.2):
            continue
        if size < 90 and max_x < int(width * 0.04):
            continue
        if size < 30 and min_x < int(width * 0.05):
            continue

        for y, x in coords:
            cleaned[y, x] = True

    for channel in range(3):
        output[:, :, channel] = np.where(cleaned, output[:, :, channel], 0)
    output[:, :, 3] = np.where(cleaned, output[:, :, 3], 0)

  # Trim empty margin created by artifact removal.
    alpha = output[:, :, 3]
    ys, xs = np.where(alpha > 0)
    if len(xs):
        pad = 2
        y0 = max(0, ys.min() - pad)
        y1 = min(height, ys.max() + pad + 1)
        x0 = max(0, xs.min() - pad)
        x1 = min(width, xs.max() + pad + 1)
        output = output[y0:y1, x0:x1]

    return output


def enhance_gold_logo(rgba: np.ndarray) -> np.ndarray:
    """Balance gold logos for strong, professional contrast on dark UI."""
    output = remove_stray_artifacts(rgba).astype(np.float32)
    mask = output[:, :, 3] > 20
    rgb = output[:, :, :3]

    rgb[mask] = np.clip((rgb[mask] - 92) * 1.2 + 108, 0, 252)

    red = rgb[:, :, 0]
    green = rgb[:, :, 1]
    blue = rgb[:, :, 2]
    red[mask] = np.clip(red[mask] * 1.06 + 14, 0, 252)
    green[mask] = np.clip(green[mask] * 1.03 + 8, 0, 248)
    blue[mask] = np.clip(blue[mask] * 0.8, 0, 198)

    output[:, :, :3] = rgb
    output[:, :, 3] = np.where(mask, 255, 0)
    return output.astype(np.uint8)
