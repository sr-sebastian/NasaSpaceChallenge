"""Máscaras de horizonte reales a partir de LRO/LOLA para las 9 regiones de Artemis III.

Entradas
  - DEM LOLA polar sur 80 m/px (PDS): ldem_80s_80m.img (+ .lbl)
    https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_80s_80m.img
  - Polígonos oficiales de las regiones (USGS, McClernan 2024, doi:10.5066/P1MEQ6UK):
    public/data/artemis3-regions.geojson
Salidas
  - public/data/horizons.json : por sitio, elevación del horizonte (0.5° de azimut) y altura del terreno
  - Necesita public/data/ephem-2028.json (cualquier punto de cada región sirve para el ranking).

Punto representativo: dentro de cada polígono oficial se evalúa una grilla de 1 km (2 km en Mons Mouton
Plateau, que es 10x más grande) y se elige el punto con más horas de Sol + Tierra en 2028 (prioridad: ambos
visibles a la vez). Las efemérides del ranking usan un punto de la región (error < 0.4° en 20 km); luego
fetch-horizons.mjs descarga las efemérides exactas del punto elegido.

Orden: node scripts/fetch-horizons.mjs  ->  python3 scripts/lola_horizon.py DEM  ->  node scripts/fetch-horizons.mjs
  - public/data/south-pole-hillshade.png : relieve sombreado para el mapa
Uso: python3 scripts/lola_horizon.py /ruta/a/ldem_80s_80m.img
"""
import json, math, sys
from pathlib import Path
import numpy as np
from PIL import Image

R = 1737400.0            # radio de referencia LOLA (m)
SCALE, OFF, N = 80.0, 3799.5, 7600
OBS_H = 2.0              # altura del observador sobre el terreno (m): antena/panel de un módulo
AZ_STEP = 0.5
ROOT = Path(__file__).resolve().parent.parent

dem = np.fromfile(sys.argv[1], dtype='<i2').reshape(N, N).astype(np.float32) * 0.5  # altura (m) sobre R

def to_xy(lat, lon):
    r = 2 * R * math.tan(math.radians(90 + lat) / 2); a = math.radians(lon)
    return r * math.sin(a), r * math.cos(a)

def to_latlon(x, y):
    r = math.hypot(x, y); return -90 + 2 * math.degrees(math.atan(r / (2 * R))), math.degrees(math.atan2(x, y))

def height(x, y):
    """Interpolación bilineal; NaN fuera del DEM. sample = OFF + x/80, line = OFF - y/80 (verificado con cráteres conocidos)."""
    s = OFF + np.asarray(x) / SCALE; l = OFF - np.asarray(y) / SCALE
    ok = (s >= 0) & (s < N - 1) & (l >= 0) & (l < N - 1)
    s0 = np.clip(np.floor(s).astype(int), 0, N - 2); l0 = np.clip(np.floor(l).astype(int), 0, N - 2)
    fs, fl = s - s0, l - l0
    v = (dem[l0, s0] * (1 - fs) * (1 - fl) + dem[l0, s0 + 1] * fs * (1 - fl) + dem[l0 + 1, s0] * (1 - fs) * fl + dem[l0 + 1, s0 + 1] * fs * fl)
    return np.where(ok, v, np.nan)

# distancias: 80 m fino hasta 10 km, luego progresión geométrica hasta 250 km
d = np.concatenate([np.arange(80, 10000, 80.0), 10000 * 1.005 ** np.arange(0, 650)])
d = d[d <= 250000]

def horizon(lat, lon):
    x0, y0 = to_xy(lat, lon); h0 = float(height(x0, y0)) + OBS_H
    a = math.radians(lon); Nv = np.array([math.sin(a), math.cos(a)]); Ev = np.array([math.cos(a), -math.sin(a)])
    az = np.arange(0, 360, AZ_STEP); A = np.radians(az)[:, None]
    dx = np.cos(A) * Nv[0] + np.sin(A) * Ev[0]; dy = np.cos(A) * Nv[1] + np.sin(A) * Ev[1]
    ht = height(x0 + dx * d, y0 + dy * d)
    th = d / R; r0 = R + h0; rt = R + ht
    elev = np.degrees(np.arctan2(rt * np.cos(th) - r0, rt * np.sin(th)))
    return h0 - OBS_H, np.nanmax(elev, axis=1)

EPH = json.loads((ROOT / 'public/data/ephem-2028.json').read_text())
EPH_SITES = {x['id']: x for x in EPH['sites']}

def score(site_id, mask):
    """Fracción anual (2028) de horas con Sol, con Tierra y con ambos, según una máscara de horizonte."""
    e = EPH_SITES[site_id]; out = []
    for body in ('sun', 'earth'):
        az = np.array(e[body]['az']) / EPH['azScale']; el = np.array(e[body]['el']) / EPH['elScale']
        out.append(el > mask[np.round(az / AZ_STEP).astype(int) % len(mask)])
    sun, earth = out
    return float(sun.mean()), float(earth.mean()), float((sun & earth).mean())

def inside(px, py, poly):
    n = len(poly); c = False; j = n - 1
    for i in range(n):
        xi, yi = poly[i]; xj, yj = poly[j]
        if (yi > py) != (yj > py) and px < (xj - xi) * (py - yi) / (yj - yi) + xi: c = not c
        j = i
    return c

def best_point(site_id, poly, step):
    pts = [to_xy(lat, lon) for lon, lat, *_ in poly]
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]; best = None; n = 0
    for x in np.arange(min(xs) + step / 2, max(xs), step):
        for y in np.arange(min(ys) + step / 2, max(ys), step):
            if not inside(x, y, pts): continue
            lat, lon = to_latlon(x, y); h, mask = horizon(lat, lon); su, ea, bo = score(site_id, mask); n += 1
            key = (bo, su + ea, h)
            if best is None or key > best[0]: best = (key, lat, lon, h, mask, su, ea, bo)
    return best, n

def centroid(poly):
    pts = [to_xy(lat, lon) for lon, lat, *_ in poly]; A = cx = cy = 0.0
    for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1]):
        c = x0 * y1 - x1 * y0; A += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
    return to_latlon(cx / (3 * A), cy / (3 * A))

ID = {'Peak Near Cabeus B': 'cabeus-b', 'Haworth': 'haworth', 'Malapert Massif': 'malapert', 'Mons Mouton Plateau': 'mouton-plateau',
      'Mons Mouton': 'mouton', 'Nobile Rim 1': 'nobile-1', 'Nobile Rim 2': 'nobile-2', 'de Gerlache Rim 2': 'degerlache-2', 'Slater Plain': 'slater'}
gj = json.loads((ROOT / 'public/data/artemis3-regions.geojson').read_text())
sites = []
for f in gj['features']:
    name = f['properties']['Region']; poly = f['geometry']['coordinates'][0]
    clat, clon = centroid(poly); sid = ID[name]
    (key, lat, lon, h, mask, su, ea, bo), n = best_point(sid, poly, 2000 if f['properties']['Area_km2'] > 1000 else 1000)
    _, cmask = horizon(clat, clon); csu, cea, cbo = score(sid, cmask)
    print(f"{name:20s} {n:4d} pts  best sun {su:4.0%} earth {ea:4.0%} both {bo:4.0%}  | centroid sun {csu:4.0%} earth {cea:4.0%}")
    sites.append({'id': sid, 'name': name, 'lat': round(lat, 4), 'lon': round(lon, 4), 'elevationM': round(h), 'areaKm2': round(f['properties']['Area_km2']),
                  'centroid': [round(clat, 4), round(clon, 4)], 'candidates': n,
                  'polygon': [[round(p[1], 4), round(p[0], 4)] for p in poly], 'mask': [int(round(v * 100)) for v in mask]})
order = list(ID.values()); sites.sort(key=lambda s: order.index(s['id']))
(ROOT / 'public/data/horizons.json').write_text(json.dumps({
    'source': 'LRO/LOLA LDEM_80S_80M (PDS) · Artemis III regions: USGS doi:10.5066/P1MEQ6UK',
    'observerHeightM': OBS_H, 'azStepDeg': AZ_STEP, 'maxDistanceKm': 250, 'maskScale': 100, 'sites': sites}))

# Relieve sombreado (hillshade) para el mapa: recorte hasta ~82.6°S, 600 m/px
k = 8; small = dem[: N // k * k, : N // k * k].reshape(N // k, k, N // k, k).mean(axis=(1, 3))
cell = SCALE * k; gy, gx = np.gradient(small, cell)
az, alt = math.radians(315), math.radians(35)
slope = np.arctan(np.hypot(gx, gy)); aspect = np.arctan2(-gx, gy)
hs = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)
hs = np.clip(hs, 0, 1)
c = small.shape[0] // 2; rad = int(225000 / cell)
img = (hs[c - rad: c + rad, c - rad: c + rad] * 255).astype(np.uint8)
Image.fromarray(img, 'L').save(ROOT / 'public/data/south-pole-hillshade.png', optimize=True)
(ROOT / 'public/data/south-pole-hillshade.json').write_text(json.dumps({'halfWidthM': rad * cell, 'pixels': img.shape[0], 'projection': 'south polar stereographic, R=1737.4 km, x=r·sin(lon), y=r·cos(lon), north-up = lon 0 at top'}))
print('hillshade', img.shape)
