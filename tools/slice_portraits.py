"""Slice portrait sheets (3 moods side by side) into portraits/<who>-<mood>.webp.

Usage: python3 tools/slice_portraits.py [raw-assets/round10]

Each sheet holds one person 3 times, left → right: normal, happy, shocked
(see docs/prompts/portraits.md). Figures are split on empty columns, cropped,
edge-cleaned (generated sheets carry coloured fringes on soft edges) and scaled
to a common height. Then src/assets/sprites.json is rebuilt.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, str(Path(__file__).parent))
from slice_sheet import build_meta  # noqa: E402

MOODS = ['normal', 'happy', 'shocked']
HEIGHT = 480  # px; largest on-screen use is ~230 px tall, so this is sharp at 2× DPR
OUT = Path('public/assets/portraits')


def figures(a: np.ndarray):
    """Column runs that contain a figure (wider than 100 px)."""
    cols = (a > 40).any(axis=0)
    runs, s = [], None
    for x, c in enumerate(cols):
        if c and s is None:
            s = x
        if not c and s is not None:
            runs.append((s, x))
            s = None
    if s is not None:
        runs.append((s, len(cols)))
    return [r for r in runs if r[1] - r[0] > 100]


def defringe(im: Image.Image) -> Image.Image:
    """Replace the colour of soft edge pixels with the colour of the solid pixels next to them."""
    arr = np.array(im).astype(np.float32)
    a = arr[..., 3]
    core = (a >= 235).astype(np.float32)
    rgb = arr[..., :3] * core[..., None]
    # blur in 8-bit (Pillow cannot blur float images); weights are rescaled to 0..1
    blur = lambda x: np.array(Image.fromarray(x.clip(0, 255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(3)), np.float32)  # noqa: E731
    w = blur(core * 255) / 255
    fill = np.stack([blur(rgb[..., i]) for i in range(3)], -1) / np.maximum(w, 1e-3)[..., None]
    edge = (a < 235) & (w > 0.02)
    arr[..., :3][edge] = fill[edge]
    arr[..., 3][a < 24] = 0
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8), 'RGBA')


def main(src='raw-assets/round10'):
    OUT.mkdir(parents=True, exist_ok=True)
    for sheet in sorted(Path(src).glob('*.png')):
        im = Image.open(sheet).convert('RGBA')
        a = np.array(im.getchannel('A'))
        runs = figures(a)
        if len(runs) != 3:
            print(f'skip {sheet.name}: found {len(runs)} figures, expected 3')
            continue
        for mood, (x0, x1) in zip(MOODS, runs):
            fig = im.crop((x0, 0, x1, im.height))
            fig = fig.crop(fig.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())
            fig = defringe(fig)
            w = round(fig.width * HEIGHT / fig.height)
            fig = fig.resize((w, HEIGHT), Image.LANCZOS)
            out = OUT / f'{sheet.stem}-{mood}.webp'
            fig.save(out, quality=90, method=6)
            print(f'{out}  {fig.width}×{fig.height}')
    build_meta()


if __name__ == '__main__':
    main(*sys.argv[1:])
