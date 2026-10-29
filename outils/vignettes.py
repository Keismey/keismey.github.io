#!/usr/bin/env python3
"""Keismey Studio : fabrique les vignettes du hub (couvertures et icônes des jeux, légères et au même format).

    python3 outils/vignettes.py              # images lues sur https://keismey.github.io
    python3 outils/vignettes.py --site DIR   # images lues dans une copie locale du site

À relancer après l'ajout d'un jeu ou un changement de couverture dans games.js.
Écrit vignettes/*.webp et vignettes.js (correspondance image du jeu → vignette).
Sans vignette, le hub affiche l'image d'origine du jeu : rien ne casse si on oublie.
Il faut Python 3 avec Pillow (pip install pillow) et Node (pour lire games.js).
"""
import hashlib, io, json, os, subprocess, sys, urllib.request
from PIL import Image

HUB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HUB, 'vignettes')
COVER = (960, 600)     # format des cartes (16/10), assez net pour un téléphone et un ordinateur
ICON = 168             # icône affichée en 56 px, écran ×3

# games.js lu par Node : la couverture peut être une fonction (Brume-Haute : jour ou nuit selon l'heure)
DUMP = r"""
global.window = {}; global.localStorage = { getItem: () => null };
require(process.argv[1]);
const RealDate = Date, out = [];
for (const g of window.GAMES) {
  let covers = [g.cover];
  if (typeof g.cover === 'function') {
    covers = [];
    for (const h of [12, 23]) {
      global.Date = class extends RealDate { getHours() { return h; } };
      covers.push(g.cover());
    }
    global.Date = RealDate;
  }
  out.push({ id: g.id, covers: [...new Set(covers)], focus: g.focus || '50% 50%', icon: g.icon || g.path.split('?')[0] + 'icons/icon-192.png' });
}
console.log(JSON.stringify(out));
"""

def games():
    return json.loads(subprocess.check_output(['node', '-e', DUMP, os.path.join(HUB, 'games.js')]))

def read(path, site):
    if site:
        with open(os.path.join(site, path.lstrip('/')), 'rb') as f:
            return f.read()
    with urllib.request.urlopen('https://keismey.github.io' + path, timeout=30) as r:
        return r.read()

def pct(v):
    return float(v.strip().rstrip('%')) / 100

def cover(img, focus):
    fx, fy = (pct(x) for x in (focus.split() + ['50%'])[:2])
    w, h = img.size
    tw, th = COVER
    if w / h > tw / th:                      # trop large : on recadre sur les côtés
        cw, ch = round(h * tw / th), h
    else:                                    # trop haute : on recadre en haut et en bas
        cw, ch = w, round(w * th / tw)
    x, y = round((w - cw) * fx), round((h - ch) * fy)   # même règle que object-position en CSS
    img = img.crop((x, y, x + cw, y + ch))
    return img.resize(COVER, Image.LANCZOS) if cw > tw else img   # jamais agrandie : ça pèserait plus sans être plus net

def save(img, name, q):
    buf = io.BytesIO()
    img.save(buf, 'WEBP', quality=q, method=6)
    data = buf.getvalue()
    with open(os.path.join(OUT, name), 'wb') as f:
        f.write(data)
    return '/vignettes/' + name + '?v=' + hashlib.sha1(data).hexdigest()[:8], len(data)

def main():
    site = sys.argv[sys.argv.index('--site') + 1] if '--site' in sys.argv else None
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith('.webp'):
            os.remove(os.path.join(OUT, f))
    table, total = {}, 0
    for g in games():
        for i, src in enumerate(g['covers']):
            img = Image.open(io.BytesIO(read(src, site))).convert('RGB')
            name = g['id'] + ('-' + str(i + 1) if len(g['covers']) > 1 else '') + '.webp'
            table[src], n = save(cover(img, g['focus']), name, 72)
            total += n
            print(f'{name:28} {n // 1024:4} Ko  ← {src}')
        img = Image.open(io.BytesIO(read(g['icon'], site))).convert('RGBA')
        img = img.resize((ICON, ICON), Image.LANCZOS)
        table[g['icon']], n = save(img, g['id'] + '-icone.webp', 80)
        total += n
        print(f"{g['id'] + '-icone.webp':28} {n // 1024:4} Ko  ← {g['icon']}")
    with open(os.path.join(HUB, 'vignettes.js'), 'w', encoding='utf-8') as f:
        f.write('// Fait par outils/vignettes.py : ne pas modifier à la main.\n'
                '// Image du jeu → vignette du hub (même cadrage, plus légère). Couvertures déjà recadrées en 16/10.\n'
                'window.VIGNETTES = ' + json.dumps(table, indent=1, ensure_ascii=False) + ';\n')
    print(f'Total : {total // 1024} Ko')

main()
