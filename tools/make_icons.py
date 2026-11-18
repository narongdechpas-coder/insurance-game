"""Build app icons from the transparent logo mark (raw-assets/brand/logo-mark.png).

iOS rules followed: square, full-bleed, fully opaque (iOS applies its own rounded mask,
so no corners or transparency are baked in), artwork inside a safe margin. Outputs go
to public/icons/. Run: python3 tools/make_icons.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = Path('raw-assets/brand/logo-mark.png')
OUT = Path('public/icons')
N = 1024


def background(dark=False):
    """Sky gradient with a soft glow behind the logo and two faint clouds (iOS-style depth)."""
    y = np.linspace(0, 1, N)[:, None]
    top, bottom = (np.array([10, 40, 110]), np.array([4, 14, 44])) if dark else (np.array([92, 190, 255]), np.array([22, 92, 224]))
    rgb = top * (1 - y) + bottom * y
    img = np.repeat(rgb[:, None, :], N, axis=1).reshape(N, N, 3)
    # radial glow centred slightly above the middle
    yy, xx = np.mgrid[0:N, 0:N]
    r = np.hypot(xx - N * 0.5, yy - N * 0.42) / (N * 0.55)
    glow = np.clip(1 - r, 0, 1) ** 2
    img = img + glow[..., None] * (np.array([40, 70, 120]) if dark else np.array([90, 70, 40]))
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGB').convert('RGBA')
    if not dark:
        clouds = Image.new('RGBA', (N, N), (0, 0, 0, 0))
        d = ImageDraw.Draw(clouds)
        for cx, cy, s in ((190, 190, 1.0), (850, 230, 0.8)):
            for dx, dy, rr in ((0, 0, 60), (60, -25, 70), (125, 0, 55), (60, 20, 60)):
                x, y0, rad = cx + dx * s, cy + dy * s, rr * s
                d.ellipse((x - rad, y0 - rad, x + rad, y0 + rad), fill=(255, 255, 255, 120))
        im.alpha_composite(clouds.filter(ImageFilter.GaussianBlur(6)))
    return im


def compose(dark=False, scale=0.86):
    bg = background(dark)
    logo = Image.open(SRC).convert('RGBA')
    logo = logo.crop(logo.getbbox())
    side = int(N * scale)
    logo.thumbnail((side, side), Image.LANCZOS)
    # soft drop shadow so the mark lifts off the background
    sh = Image.new('RGBA', logo.size, (0, 0, 0, 0))
    sh.putalpha(logo.getchannel('A').point(lambda a: int(a * 0.45)))
    sh = sh.filter(ImageFilter.GaussianBlur(14))
    x, y = (N - logo.width) // 2, (N - logo.height) // 2 + 6
    bg.alpha_composite(sh, (x, y + 18))
    bg.alpha_composite(logo, (x, y))
    return bg.convert('RGB')  # opaque, as iOS requires


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    full = compose()
    full.save(OUT / 'icon-1024.png')  # App Store / iOS marketing size
    compose(dark=True).save(OUT / 'icon-1024-dark.png')  # iOS dark-mode variant
    for name, px in (('apple-touch-icon.png', 180), ('icon-192.png', 192), ('icon-512.png', 512), ('favicon-48.png', 48), ('favicon-32.png', 32)):
        full.resize((px, px), Image.LANCZOS).save(OUT / name)
    # Android maskable: the launcher may crop to a circle, keep the art inside the central 80%
    compose(scale=0.70).resize((512, 512), Image.LANCZOS).save(OUT / 'icon-maskable-512.png')
    print('icons →', sorted(p.name for p in OUT.iterdir()))


if __name__ == '__main__':
    main()
