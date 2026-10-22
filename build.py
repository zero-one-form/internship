#!/usr/bin/env python3
"""Build dist/twinsoul.html from src/ + assets/.  Usage: python3 build.py"""
import os
ROOT = os.path.dirname(os.path.abspath(__file__))
ORDER = ['b_core.js', 'e_skills.js', 'g_items.js', 'h_dungeon.js', 'i_quests.js', 'c1_assets.js', 'c2_render.js', 'd_ui.js', 'k_ui.js', 'l_audio.js',
         'm_abyss.js', 'n_feel.js', 'o_ending.js', 'p_op.js', 'q_vfx.js', 'r_floor.js', 's_layout.js', 't_meta.js', 'u_class.js', 'v_pet.js', 'w_world.js', 'x_aria.js', 'y_legend.js', 'z_daily.js', 'za_soul.js', 'zb_skills.js', 'zc_party.js', 'zd_tips.js', 'ze_heroine.js', 'zf_login.js']
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
