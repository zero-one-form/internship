#!/usr/bin/env python3
"""Prepare AI-generated heroine art for the game.

Removes a plain white background (flood fill from the edges, so white inside the character is kept),
trims to the character, resizes and saves WebP into assets/heroines/.

Usage: python3 tools/cutout.py <image> [<image> ...] [--name mina_bust_normal] [--keep-white]
  --keep-white: do not remove enclosed white pockets (for white gloves, fur, ghosts...).
  The output name defaults to the input file name (e.g. mina_bust_smile.png -> mina_bust_smile.webp).
  Names: <id>_bust_normal / <id>_bust_smile / <id>_bust_sad / <id>_chibi   (id: mina, aria, ...)
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'heroines')
KEY = (255, 0, 255)


def cutout(src, name, keep_white=False):
    im = Image.open(src).convert('RGBA')
    if im.getextrema()[3][0] < 250:
        cut = im  # already has transparency
    else:
        rgb = im.convert('RGB')
        w, h = rgb.size
        step = max(4, min(w, h) // 64)
        # A bust is cut off at the bottom edge (white dresses touch it), so only chibis seed from there.
        bottom = [(x, h - 1) for x in range(0, w, step)] if 'chibi' in name else []
        seeds = [(x, 0) for x in range(0, w, step)] + bottom + [(0, y) for y in range(0, h - 1, step)] + [(w - 1, y) for y in range(0, h - 1, step)]
        for p in seeds:
            r, g, b = rgb.getpixel(p)
            if min(r, g, b) > 225 and rgb.getpixel(p) != KEY:
                ImageDraw.floodfill(rgb, p, KEY, thresh=40)
        # Background pockets enclosed by hair or arms: large, neutral pure-white regions.
        # Eye whites, skin highlights and glows are warmer (r - b >= 3) or small, so they stay.
        orig, px = im.convert('RGB'), rgb.load()
        comps, k = [], 0
        for y in range(0, h, 6):
            for x in range(0, w, 6):
                if min(px[x, y]) > 238 and px[x, y] != KEY:
                    k += 1
                    col = (0, 128 | (k >> 8) & 127, k & 255)
                    ImageDraw.floodfill(rgb, (x, y), col, thresh=20)
                    comps.append(col)
        area = {c: n for n, c in rgb.getcolors(w * h)}
        cand = {c for c in comps if area.get(c, 0) > max(2000, w * h // 2000)}
        acc = {c: [0, 0, 0] for c in cand}
        op = orig.load()
        for y in range(h):
            for x in range(w):
                a = acc.get(px[x, y])
                if a is not None:
                    r, _, b = op[x, y]
                    a[0] += r; a[1] += b; a[2] += 1
        drop = set() if keep_white else {c for c, (r, b, n) in acc.items() if b / n > 251 and (r - b) / n < 3}
        mask = Image.new('L', (w, h), 255)
        mp = mask.load()
        for y in range(h):
            for x in range(w):
                if px[x, y] == KEY or px[x, y] in drop:
                    mp[x, y] = 0
        mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
        cut = im.copy()
        cut.putalpha(mask)
    box = cut.getbbox()
    if box:
        cut = cut.crop(box)
    limit = 300 if 'chibi' in name else 640
    k = min(1.0, limit / max(cut.size))
    if k < 1:
        cut = cut.resize((round(cut.width * k), round(cut.height * k)), Image.LANCZOS)
    os.makedirs(OUT, exist_ok=True)
    dst = os.path.join(OUT, name + '.webp')
    cut.save(dst, 'WEBP', quality=88, method=6)
    print('saved', os.path.relpath(dst, ROOT), cut.size, round(os.path.getsize(dst) / 1024), 'KB')


def main(argv):
    if not argv:
        print(__doc__)
        return 1
    name, keep = None, '--keep-white' in argv
    argv = [a for a in argv if a != '--keep-white']
    if '--name' in argv:
        i = argv.index('--name')
        name = argv[i + 1]
        del argv[i:i + 2]
    for src in argv:
        cutout(src, name or os.path.splitext(os.path.basename(src))[0], keep)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
