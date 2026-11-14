"""Recortes de terreno LOLA alrededor de cada sitio para la escena 3D.

Grilla en el plano tangente local (x = este, y = norte), 241 x 241 muestras cada 100 m (24 km de lado),
alturas en metros relativas al sitio e incluyendo la caída por curvatura lunar (d²/2R), int16 little-endian.
Uso: python3 scripts/terrain_tiles.py /ruta/a/ldem_80s_80m.img   (después de lola_horizon.py)
"""
import json, math, sys
from pathlib import Path
import numpy as np

R, SCALE, OFF, N = 1737400.0, 80.0, 3799.5, 7600
SIZE, STEP = 241, 100.0
ROOT = Path(__file__).resolve().parent.parent
dem = np.fromfile(sys.argv[1], dtype='<i2').reshape(N, N).astype(np.float32) * 0.5

def height(x, y):
    s = OFF + x / SCALE; l = OFF - y / SCALE
    s0 = np.clip(np.floor(s).astype(int), 0, N - 2); l0 = np.clip(np.floor(l).astype(int), 0, N - 2); fs, fl = s - s0, l - l0
    return dem[l0, s0] * (1 - fs) * (1 - fl) + dem[l0, s0 + 1] * fs * (1 - fl) + dem[l0 + 1, s0] * (1 - fs) * fl + dem[l0 + 1, s0 + 1] * fs * fl

hz = json.loads((ROOT / 'public/data/horizons.json').read_text())
out = ROOT / 'public/data/terrain'; out.mkdir(exist_ok=True)
half = (SIZE - 1) / 2 * STEP
e = np.linspace(-half, half, SIZE); n = np.linspace(half, -half, SIZE)  # fila 0 = norte
E, Nn = np.meshgrid(e, n)
for s in hz['sites']:
    r = 2 * R * math.tan(math.radians(90 + s['lat']) / 2); a = math.radians(s['lon'])
    x0, y0 = r * math.sin(a), r * math.cos(a); nv = (math.sin(a), math.cos(a)); ev = (math.cos(a), -math.sin(a))
    X = x0 + E * ev[0] + Nn * nv[0]; Y = y0 + E * ev[1] + Nn * nv[1]
    h = height(X, Y) - height(np.array(x0), np.array(y0)) - (E ** 2 + Nn ** 2) / (2 * R)
    np.round(h).astype('<i2').tofile(out / f"{s['id']}.bin")
    print(s['id'], 'relief', int(h.min()), int(h.max()))
hz['terrain'] = {'size': SIZE, 'stepM': STEP, 'format': 'int16 LE, meters relative to site, row 0 = north, col 0 = west, includes curvature drop'}
(ROOT / 'public/data/horizons.json').write_text(json.dumps(hz))
