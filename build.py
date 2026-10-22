#!/usr/bin/env python3
"""Build from src/ + assets/.  Usage: python3 build.py

  dist/twinsoul.html  one self-contained file (the claude.ai artifact; must stay under 16MB)
  dist/site/          the GitHub Pages / PWA build: same game, assets as separate files (no size limit),
                      installable to the home screen and playable offline (service worker)
"""
import os
ROOT = os.path.dirname(os.path.abspath(__file__))
ORDER = ['b_core.js', 'e_skills.js', 'g_items.js', 'h_dungeon.js', 'i_quests.js', 'c1_assets.js', 'c2_render.js', 'd_ui.js', 'k_ui.js', 'l_audio.js',
         'm_abyss.js', 'n_feel.js', 'o_ending.js', 'p_op.js', 'q_vfx.js', 'r_floor.js', 's_layout.js', 't_meta.js', 'u_class.js', 'v_pet.js', 'w_world.js', 'x_aria.js', 'y_legend.js', 'z_daily.js', 'za_soul.js', 'zb_skills.js', 'zc_party.js', 'zd_tips.js', 'ze_heroine.js', 'zf_login.js', 'zg_fish.js', 'zh_forge.js']
rd = lambda *p: open(os.path.join(ROOT, *p), encoding='utf-8').read()


def heroine_art():
    # assets/heroines/<id>_<kind>.webp|png -> window.__HEROINE_ART (data URIs); missing art falls back to code-drawn placeholders
    import base64, json
    d, out = os.path.join(ROOT, 'assets', 'heroines'), {}
    if os.path.isdir(d):
        for f in sorted(os.listdir(d)):
            name, ext = os.path.splitext(f)
            if ext.lower() in ('.webp', '.png'):
                mime = 'image/webp' if ext.lower() == '.webp' else 'image/png'
                out[name] = 'data:' + mime + ';base64,' + base64.b64encode(open(os.path.join(d, f), 'rb').read()).decode()
    return 'window.__HEROINE_ART=' + json.dumps(out) + ';\n'
head = rd('src', 'a_head.html')            # ends with "<script>\n" that opens the game IIFE
assert head.endswith('<script>\n')
body = ''.join(rd('src', f) for f in ORDER) + "  boot();\n})();\n</script>\n</body>\n</html>\n"
html = head[:-len('<script>\n')] + '<script>\n' + heroine_art() + '</script>\n<script>\n' + rd('assets', 'flare_data.js') + '</script>\n<script>\n' + rd('assets', 'song.js') + '</script>\n<script>\n' + body
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
out = os.path.join(ROOT, 'dist', 'twinsoul.html')
open(out, 'w', encoding='utf-8').write(html)
open(os.path.join(ROOT, 'dist', 'game_only.js'), 'w', encoding='utf-8').write(body.split('</script>')[0])
print('built', out, round(len(html.encode('utf-8')) / 1e6, 2), 'MB (limit 16MB)')


def build_site():
    import hashlib, json, shutil
    site = os.path.join(ROOT, 'dist', 'site')
    shutil.rmtree(site, ignore_errors=True)
    os.makedirs(os.path.join(site, 'art'))
    art, files = {}, ['./', 'index.html', 'flare_data.js', 'song.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']
    d = os.path.join(ROOT, 'assets', 'heroines')
    for f in sorted(os.listdir(d)):
        name, ext = os.path.splitext(f)
        if ext.lower() in ('.webp', '.png'):
            shutil.copy(os.path.join(d, f), os.path.join(site, 'art', f)); art[name] = 'art/' + f; files.append('art/' + f)
    for f in ('flare_data.js', 'song.js'):
        shutil.copy(os.path.join(ROOT, 'assets', f), os.path.join(site, f))
    # not for search engines: only people who have the link should find it
    pwa = ('<meta name="robots" content="noindex, nofollow, noarchive, noimageindex">\n<meta name="googlebot" content="noindex, nofollow">\n'
           '<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="#0b0e24">\n'
           '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n'
           '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<link rel="apple-touch-icon" href="icon-192.png">\n<link rel="icon" href="icon-192.png">\n')
    h = head[:-len('<script>\n')].replace('</head>', pwa + '</head>', 1)
    reg = "if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));\n"
    page = (h + '<script>\nwindow.__HEROINE_ART=' + json.dumps(art) + ';\n' + reg + '</script>\n<script src="flare_data.js"></script>\n<script src="song.js"></script>\n<script>\n' + body)
    open(os.path.join(site, 'index.html'), 'w', encoding='utf-8').write(page)
    icons(site)
    json.dump({'name': 'YOU, THY ARIA', 'short_name': 'THY ARIA', 'start_url': './', 'scope': './', 'display': 'fullscreen', 'orientation': 'any',
               'background_color': '#0b0e24', 'theme_color': '#0b0e24', 'lang': 'ja',
               'icons': [{'src': 'icon-192.png', 'sizes': '192x192', 'type': 'image/png'}, {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any maskable'}]},
              open(os.path.join(site, 'manifest.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False)
    hsh = hashlib.sha1()
    for f in files[1:]: hsh.update(open(os.path.join(site, f), 'rb').read())
    sw = rd('tools', 'sw.js').replace('__VERSION__', hsh.hexdigest()[:12]).replace('__FILES__', json.dumps(files))
    open(os.path.join(site, 'sw.js'), 'w', encoding='utf-8').write(sw)
    open(os.path.join(site, '.nojekyll'), 'w').write('')
    tot = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(site) for f in fs)
    print('built', site, round(tot / 1e6, 2), 'MB in', len(files) + 1, 'files (GitHub Pages / PWA)')


def icons(site):
    # app icon: Aria's smile on the night-sky colour of the title screen
    from PIL import Image, ImageDraw
    src = os.path.join(ROOT, 'assets', 'heroines', 'aria_bust_smile.webp')
    for n in (192, 512):
        bg = Image.new('RGBA', (n, n), (11, 14, 36, 255))
        g = ImageDraw.Draw(bg)
        for r in range(n // 2, 0, -2):
            a = int(90 * (1 - r / (n / 2)))
            g.ellipse((n / 2 - r, n * 0.42 - r, n / 2 + r, n * 0.42 + r), fill=(120 + a, 100 + a, 200, 255))
        if os.path.exists(src):
            im = Image.open(src).convert('RGBA'); s0 = int(im.width * 0.78)
            face = im.crop(((im.width - s0) // 2, 0, (im.width + s0) // 2, s0)).resize((int(n * 0.86), int(n * 0.86)), Image.LANCZOS)
            bg.alpha_composite(face, (int(n * 0.07), int(n * 0.14)))
        bg.convert('RGB').save(os.path.join(site, 'icon-%d.png' % n))


build_site()
