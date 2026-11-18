"""Make a texture seamless: shift it by half a tile so the seams move to the centre,
then cross-fade that centre cross with the original image (whose centre has no seam).

Usage: python3 tools/make_tileable.py <in> <out.jpg> [size] [--grid N]
--grid N: for regular patterns (paving) crop to N whole cells first, so the
          pattern period matches the tile and grout lines meet at the edges.
"""
import sys
import numpy as np
from PIL import Image


def seam_score(a):
    a = a.astype(float)
    return (np.abs(a[:, 0] - a[:, -1]).mean() + np.abs(a[0] - a[-1]).mean()) / 2, np.abs(np.diff(a, axis=1)).mean()


def grid_crop(im, n):
    """Crop between the first and last interior grout lines, so each grout line appears once per tile."""
    g = np.asarray(im.convert('L')).astype(float)
    def grout(profile):
        thr = np.median(profile) - 15
        mins = [i for i in range(1, len(profile) - 1) if profile[i] < thr and profile[i] <= profile[i - 1] and profile[i] <= profile[i + 1]]
        clusters = []
        for i in mins:
            if clusters and i - clusters[-1][-1] < 8:
                clusters[-1].append(i)
            else:
                clusters.append([i])
        return [int(np.mean(c)) for c in clusters]
    cols, rows = grout(g.mean(0)), grout(g.mean(1))
    return im.crop((cols[0], rows[0], cols[-1], rows[-1]))


def make_tileable(im, band=0.18):
    a = np.asarray(im.convert('RGB')).astype(float)
    h, w, _ = a.shape
    shifted = np.roll(np.roll(a, h // 2, 0), w // 2, 1)  # seams now cross the centre
    yy, xx = np.mgrid[0:h, 0:w]
    dx = np.abs(xx - w / 2) / (w * band)
    dy = np.abs(yy - h / 2) / (h * band)
    # weight of the ORIGINAL image: 1 on the centre cross, fading to 0 away from it
    m = np.clip(1 - np.minimum(dx, dy), 0, 1)
    m = m * m * (3 - 2 * m)  # smoothstep
    out = shifted * (1 - m[..., None]) + a * m[..., None]
    return Image.fromarray(out.clip(0, 255).astype(np.uint8))


if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    size = int(sys.argv[3]) if len(sys.argv) > 3 and not sys.argv[3].startswith('--') else 512
    im = Image.open(src).convert('RGB')
    if '--grid' in sys.argv:
        n = int(sys.argv[sys.argv.index('--grid') + 1])
        im = grid_crop(im, n)
        out = im  # whole cells already tile; no blend (it would smear the grout)
    else:
        out = make_tileable(im)
    out = out.resize((size, size), Image.LANCZOS)
    before = seam_score(np.asarray(Image.open(src).convert('RGB')))
    after = seam_score(np.asarray(out))
    out.save(dst, 'JPEG', quality=86, optimize=True, progressive=True)
    print(f'{dst}: seam {before[0]:.1f} → {after[0]:.1f}  (inner {after[1]:.1f})')
