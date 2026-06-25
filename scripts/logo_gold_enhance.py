"""Shared gold-logo color enhancement."""

from __future__ import annotations

import numpy as np


def enhance_gold_logo(rgba: np.ndarray) -> np.ndarray:
    """Warm and brighten extracted gold logos for dark UI backgrounds."""
    output = rgba.astype(np.float32).copy()
    mask = output[:, :, 3] > 20
    rgb = output[:, :, :3]
    rgb[mask] = np.clip((rgb[mask] - 108) * 1.14 + 122, 0, 245)

    red = rgb[:, :, 0]
    green = rgb[:, :, 1]
    blue = rgb[:, :, 2]
    red[mask] = np.clip(red[mask] * 1.035 + 6, 0, 245)
    green[mask] = np.clip(green[mask] * 1.015 + 3, 0, 242)
    blue[mask] = np.clip(blue[mask] * 0.88, 0, 215)

    output[:, :, :3] = rgb
    output[:, :, 3] = np.where(mask, 255, 0)
    return output.astype(np.uint8)
