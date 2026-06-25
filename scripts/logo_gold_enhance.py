"""Shared logo cleanup and brand-color recoloring."""

from __future__ import annotations

from collections import deque

import numpy as np

# Site brand palette (teal / cyan — matches header, footer, CTAs)
BRAND_DARK = np.array([18, 118, 128], dtype=np.float32)      # #127680
BRAND_MID = np.array([40, 179, 174], dtype=np.float32)       # #28b3ae
BRAND_BRIGHT = np.array([94, 212, 232], dtype=np.float32)    # #5ed4e8
BRAND_LIGHT = np.array([196, 244, 252], dtype=np.float32)    # #c4f4fc
BRAND_PEAK = np.array([255, 255, 255], dtype=np.float32)


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


def _mix_stops(t: np.ndarray) -> np.ndarray:
    """Map 0..1 luminance to brand cyan gradient (Nx3)."""
    t = np.clip(t, 0.0, 1.0)
    out = np.zeros((t.size, 3), dtype=np.float32)

    low = t < 0.28
    mid = (t >= 0.28) & (t < 0.58)
    high = (t >= 0.58) & (t < 0.82)
    peak = t >= 0.82

    if low.any():
        ratio = t[low] / 0.28
        out[low] = BRAND_DARK + (BRAND_MID - BRAND_DARK) * ratio[:, None]
    if mid.any():
        ratio = (t[mid] - 0.28) / 0.3
        out[mid] = BRAND_MID + (BRAND_BRIGHT - BRAND_MID) * ratio[:, None]
    if high.any():
        ratio = (t[high] - 0.58) / 0.24
        out[high] = BRAND_BRIGHT + (BRAND_LIGHT - BRAND_BRIGHT) * ratio[:, None]
    if peak.any():
        ratio = (t[peak] - 0.82) / 0.18
        out[peak] = BRAND_LIGHT + (BRAND_PEAK - BRAND_LIGHT) * ratio[:, None]

    return out


def enhance_gold_logo(rgba: np.ndarray) -> np.ndarray:
    """Recolor facility logos to bold brand cyan/teal for site-wide consistency."""
    output = remove_stray_artifacts(rgba).astype(np.float32)
    mask = output[:, :, 3] > 20
    rgb = output[:, :, :3]

    luminance = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
    visible = luminance[mask]
    low = float(np.percentile(visible, 4))
    high = float(np.percentile(visible, 99))
    tone = np.clip((luminance - low) / max(high - low, 1.0), 0.0, 1.0)
    tone = np.power(tone, 0.82)

    recolored = _mix_stops(tone[mask])
    output[:, :, 0][mask] = recolored[:, 0]
    output[:, :, 1][mask] = recolored[:, 1]
    output[:, :, 2][mask] = recolored[:, 2]
    output[:, :, 3] = np.where(mask, 255, 0)
    return output.astype(np.uint8)
