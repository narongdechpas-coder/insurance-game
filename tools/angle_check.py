"""Measure the ground angles of a sprite's plinth and check them against the game's projection.

Usage: python3 tools/angle_check.py [png ...]   (default: every building / environment sprite)

How: the plinth is the lowest part of an isometric sprite. For every column we take the
lowest opaque pixel (the "bottom profile"). Left of the front corner that profile is the
left ground edge, right of it the right ground edge. A robust median slope of each side
gives the two ground angles in degrees (positive = edge rises away from the front corner).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

TARGET = 26.57  # true 2:1 isometric
TOL = 3.0


def bottom_profile(path):
    a = np.array(Image.open(path).getchannel('A')) > 128
    h, w = a.shape
    has = a.any(axis=0)
    low = np.where(has, h - 1 - np.argmax(a[::-1], axis=0), -1)
    return low, has, w


def side_angle(xs, ys):
    if len(xs) < 8:
        return float('nan')
    idx = np.random.default_rng(0).integers(0, len(xs), size=(400, 2))
    dx = xs[idx[:, 1]] - xs[idx[:, 0]]
    ok = np.abs(dx) > len(xs) * 0.2
    slopes = (ys[idx[ok, 1]] - ys[idx[ok, 0]]) / dx[ok]
    return float(np.degrees(np.arctan(np.median(slopes))))


def measure(path):
    low, has, w = bottom_profile(path)
    cols = np.nonzero(has)[0]
    x0, x1 = cols.min(), cols.max()
    front = int(np.argmax(np.where(has, low, -1)))
    # use the middle 70% of each side so rounded corners don't bend the fit
    def seg(a, b):
        lo, hi = a + (b - a) * 0.15, a + (b - a) * 0.85
        xs = np.arange(int(lo), int(hi))
        xs = xs[has[xs]]
        return xs.astype(float), low[xs].astype(float)
    lx, ly = seg(x0, front)
    rx, ry = seg(front, x1)
    left = side_angle(lx, ly)  # y grows toward the front corner → positive slope
    right = -side_angle(rx, ry)
    return left, right, front / w


if __name__ == '__main__':
    files = sys.argv[1:] or sorted(str(p) for p in Path('public/assets/buildings').glob('*.png'))
    print(f'{"sprite":38s} {"left°":>7s} {"right°":>7s} {"front@":>7s}  verdict (target {TARGET}° ±{TOL})')
    for f in files:
        l, r, fx = measure(f)
        ok = abs(l - TARGET) <= TOL and abs(r - TARGET) <= TOL
        print(f'{f:38s} {l:7.1f} {r:7.1f} {fx:7.2f}  {"PASS" if ok else "FAIL"}')
