#!/usr/bin/env python3
"""Prepare AI-generated heroine art for the game.

Removes a plain white background (flood fill from the edges, so white inside the character is kept),
trims to the character, resizes and saves WebP into assets/heroines/.

Usage: python3 tools/cutout.py <image> [<image> ...] [--name mina_bust_normal]
  The output name defaults to the input file name (e.g. mina_bust_smile.png -> mina_bust_smile.webp).
  Names: <id>_bust_normal / <id>_bust_smile / <id>_bust_sad / <id>_chibi   (id: mina, aria, ...)
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'heroines')
KEY = (255, 0, 255)


def cutout(src, name):
    im = Image.open(src).convert('RGBA')
    if im.getextrema()[3][0] < 250:
        cut = im  # already has transparency
    else:
        rgb = im.convert('RGB')
        w, h = rgb.size
        step = max(4, min(w, h) // 64)
        seeds = [(x, 0) for x in range(0, w, step)] + [(x, h - 1) for x in range(0, w, step)] + [(0, y) for y in range(0, h, step)] + [(w - 1, y) for y in range(0, h, step)]
        for p in seeds:
            r, g, b = rgb.getpixel(p)
            if min(r, g, b) > 225 and rgb.getpixel(p) != KEY:
                ImageDraw.floodfill(rgb, p, KEY, thresh=40)
        mask = Image.new('L', (w, h), 255)
        px, mp = rgb.load(), mask.load()
        for y in range(h):
            for x in range(w):
                if px[x, y] == KEY:
                    mp[x, y] = 0
        mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
        cut = im.copy()
        cut.putalpha(mask)
    box = cut.getbbox()
    if box:
        cut = cut.crop(box)
    limit = 420 if 'chibi' in name else 900
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
    name = None
    if '--name' in argv:
        i = argv.index('--name')
        name = argv[i + 1]
        del argv[i:i + 2]
    for src in argv:
        cutout(src, name or os.path.splitext(os.path.basename(src))[0])
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
