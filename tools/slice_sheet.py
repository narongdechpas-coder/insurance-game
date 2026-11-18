"""Slice a transparent sprite sheet into individual PNG sprites.

Usage:
  python3 tools/slice_sheet.py detect <sheet> <out_dir>      # numbered crops + preview
  python3 tools/slice_sheet.py export <manifest.json>         # named crops into public/assets

Detection groups opaque pixels into blobs (with a small merge gap so a tree that
touches a plinth stays one sprite), then crops each blob with padding.
Only Pillow + numpy are needed.
"""
import json
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ALPHA_MIN = 160  # detection only: core pixels; faint halos would bridge sprites
SCALE = 4  # detection runs on a 1/4 grid for speed
GROW = 3  # cells each sprite may claim around itself for soft edges
ROW_BAND = 160  # px; sprites whose centres share a band count as one row
ALPHA_FLOOR = 12  # fainter pixels are cleared (removes sheet haze)
MIN_AREA = 60  # grid cells; smaller blobs are dust
PAD = 4


def detect(sheet: Path):
    """Return (image, boxes, labels). labels is a full-res int map: pixel → sprite id (-1 = none).

    Sprites on these sheets almost touch, so blobs are found without merging,
    then each label grows a few cells into unclaimed space (to keep soft edges and
    shadows) without ever stealing a neighbour's pixels.
    """
    im = Image.open(sheet).convert('RGBA')
    a = np.array(im.getchannel('A'))
    h, w = a.shape
    gh, gw = -(-h // SCALE), -(-w // SCALE)
    pad = np.zeros((gh * SCALE, gw * SCALE), np.uint8)
    pad[:h, :w] = a
    grid = pad.reshape(gh, SCALE, gw, SCALE).max(axis=(1, 3)) > ALPHA_MIN
    lab = np.full((gh, gw), -1, np.int32)
    comps = []
    for y in range(gh):
        for x in range(gw):
            if not grid[y, x] or lab[y, x] >= 0:
                continue
            k = len(comps)
            q = deque([(y, x)])
            lab[y, x] = k
            cells = []
            while q:
                cy, cx = q.popleft()
                cells.append((cy, cx))
                for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                    if 0 <= ny < gh and 0 <= nx < gw and grid[ny, nx] and lab[ny, nx] < 0:
                        lab[ny, nx] = k
                        q.append((ny, nx))
            comps.append(cells)
    # drop dust
    keep = [i for i, c in enumerate(comps) if len(c) >= MIN_AREA]
    remap = np.full(len(comps) + 1, -1, np.int32)
    for new_id, old in enumerate(keep):
        remap[old] = new_id
    lab = remap[lab]
    # grow into unclaimed cells (soft edges, halos)
    for _ in range(GROW):
        grown = lab.copy()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            sh = np.full_like(lab, -1)
            ys = slice(max(dy, 0), gh + min(dy, 0))
            yd = slice(max(-dy, 0), gh + min(-dy, 0))
            xs = slice(max(dx, 0), gw + min(dx, 0))
            xd = slice(max(-dx, 0), gw + min(-dx, 0))
            sh[ys, xs] = lab[yd, xd]
            grown = np.where((grown < 0) & (sh >= 0), sh, grown)
        lab = grown
    boxes = []
    for k in range(len(keep)):
        ys, xs = np.nonzero(lab == k)
        boxes.append((xs.min() * SCALE, ys.min() * SCALE, (xs.max() + 1) * SCALE, (ys.max() + 1) * SCALE))
    order = sorted(range(len(boxes)), key=lambda i: ((boxes[i][1] + boxes[i][3]) // 2 // ROW_BAND, boxes[i][0]))
    inv = np.full(len(boxes) + 1, -1, np.int32)
    for new_id, old in enumerate(order):
        inv[old] = new_id
    lab = inv[lab]
    boxes = [boxes[i] for i in order]
    full = np.repeat(np.repeat(lab, SCALE, 0), SCALE, 1)[:h, :w]
    return im, boxes, full


def tight_crop(im: Image.Image, box, labels, k):
    x0, y0, x1, y1 = box
    x1, y1 = min(x1, im.width), min(y1, im.height)
    arr = np.array(im.crop((x0, y0, x1, y1)))
    mask = labels[y0:y1, x0:x1] == k
    arr[..., 3] = np.where(mask, arr[..., 3], 0)
    arr[..., 3] = np.where(arr[..., 3] < ALPHA_FLOOR, 0, arr[..., 3])
    c = Image.fromarray(arr)
    bb = c.getchannel('A').getbbox()
    c = c.crop(bb) if bb else c
    out = Image.new('RGBA', (c.width + PAD * 2, c.height + PAD * 2))
    out.paste(c, (PAD, PAD))
    return out


def cmd_detect(sheet, out):
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    im, boxes, _ = detect(Path(sheet))
    prev = Image.new('RGBA', im.size, (235, 240, 248, 255))
    prev.alpha_composite(im)
    d = ImageDraw.Draw(prev)
    for i, b in enumerate(boxes):
        d.rectangle(b, outline=(255, 0, 80, 255), width=2)
        d.rectangle((b[0], b[1], b[0] + 30, b[1] + 22), fill=(255, 0, 80, 255))
        d.text((b[0] + 4, b[1] + 4), str(i), fill='white')
    prev.convert('RGB').save(out / 'preview.jpg', quality=85)
    json.dump([[int(v) for v in b] for b in boxes], open(out / 'boxes.json', 'w'))
    print(f'{len(boxes)} sprites → {out}/preview.jpg')


def cmd_export(manifest):
    m = json.load(open(manifest))
    root = Path(manifest).parent
    for sheet, entries in m['sheets'].items():
        im, boxes, labels = detect(root / sheet)
        for idx, name in entries.items():
            sprite = tight_crop(im, boxes[int(idx)], labels, int(idx))
            dst = Path(m['out']) / f'{name}.png'
            dst.parent.mkdir(parents=True, exist_ok=True)
            sprite.save(dst, optimize=True)
            print(f'{sheet}#{idx} → {dst} {sprite.size}')


def cmd_singles(manifest):
    """Import standalone images: trim, clear haze, downscale to a max side.

    The output format follows the name's extension: .webp (lossy q88, alpha kept),
    .jpg (opaque backgrounds) or .png (default).
    """
    m = json.load(open(manifest))
    root = Path(manifest).parent
    for src, (name, max_side) in m['singles'].items():
        im = Image.open(root / src).convert('RGBA')
        arr = np.array(im)
        arr[..., 3] = np.where(arr[..., 3] < ALPHA_FLOOR, 0, arr[..., 3])
        im = Image.fromarray(arr)
        bb = im.getchannel('A').getbbox()
        if bb:
            im = im.crop(bb)
        im.thumbnail((max_side, max_side), Image.LANCZOS)
        dst = Path(m['out']) / (name if Path(name).suffix else f'{name}.png')
        dst.parent.mkdir(parents=True, exist_ok=True)
        if dst.suffix == '.webp':
            im.save(dst, 'WEBP', quality=88, method=6)
        elif dst.suffix == '.jpg':
            im.convert('RGB').save(dst, 'JPEG', quality=84, optimize=True, progressive=True)
        else:
            im.save(dst, optimize=True)
        print(f'{src} → {dst} {im.size}')


def build_meta(asset_root='public/assets', out='src/assets/sprites.json'):
    """Write size, ground anchor and file type for every transparent sprite (png/webp).

    anchor = the lowest opaque point (the plinth's front corner). The game places
    that point on the ground position, so sprites of different heights line up.
    """
    meta = {}
    root = Path(asset_root)
    for f in sorted([*root.rglob('*.png'), *root.rglob('*.webp')]):
        if f.parent.name == 'brand':
            continue
        im = Image.open(f).convert('RGBA')
        a = np.array(im.getchannel('A')) > 128
        ys, xs = np.nonzero(a)
        bottom = ys.max()
        ax = float(xs[ys >= bottom - 2].mean())
        key = str(f.relative_to(root).with_suffix(''))
        meta[key] = {'w': im.width, 'h': im.height, 'ax': round(ax / im.width, 3), 'ay': round((bottom + 1) / im.height, 3), 'ext': f.suffix[1:]}
    Path(out).write_text(json.dumps(meta, indent=1))
    print(f'{len(meta)} sprites → {out}')


if __name__ == '__main__':
    {'detect': lambda: cmd_detect(sys.argv[2], sys.argv[3]), 'export': lambda: (cmd_export(sys.argv[2]), cmd_singles(sys.argv[2]), build_meta())}[sys.argv[1]]()
