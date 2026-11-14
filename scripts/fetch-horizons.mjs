// Descarga efemérides horarias reales (NASA/JPL Horizons, DE441) del Sol y la Tierra
// vistas desde el centro de cada una de las 9 regiones candidatas de Artemis III (NASA, 2024; polígonos USGS).
// Uso: node scripts/fetch-horizons.mjs  -> public/data/ephem-2028.json
import { writeFileSync } from 'node:fs';
import { readFileSync } from 'node:fs';
// Sitios: centroides de los polígonos oficiales USGS + altura LOLA (generados por scripts/lola_horizon.py)
const REGIONS = JSON.parse(readFileSync(new URL('../public/data/horizons.json', import.meta.url))).sites;

const START = '2028-01-01 00:00', STOP = '2028-12-31 23:00';
const API = 'https://ssd.jpl.nasa.gov/api/horizons.api';

async function query(body, lat, lon, altKm) {
  const p = new URLSearchParams({
    format: 'text', COMMAND: `'${body}'`, CENTER: "'coord@301'", COORD_TYPE: "'GEODETIC'",
    SITE_COORD: `'${lon},${lat},${altKm}'`, EPHEM_TYPE: "'OBSERVER'", START_TIME: `'${START}'`,
    STOP_TIME: `'${STOP}'`, STEP_SIZE: "'1h'", QUANTITIES: "'4'", APPARENT: "'AIRLESS'", CSV_FORMAT: "'YES'",
  });
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const txt = await (await fetch(`${API}?${p}`)).text();
      const block = txt.split('$$SOE')[1]?.split('$$EOE')[0];
      if (!block) throw new Error(txt.slice(0, 400));
      const az = [], el = [];
      for (const line of block.trim().split('\n')) {
        const c = line.split(',').map(s => s.trim());
        az.push(Math.round(parseFloat(c[3]) * 10)); el.push(Math.round(parseFloat(c[4]) * 100));
      }
      return { az, el };
    } catch (e) { console.error(body, lat, lon, 'retry', attempt, e.message); await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); }
  }
  throw new Error('failed');
}

const out = { source: 'NASA/JPL Horizons API (DE441), airless apparent Az/El, topocentric on Moon (coord@301)', start: '2028-01-01T00:00:00Z', stepHours: 1, azScale: 10, elScale: 100, sites: [] };
for (const r of REGIONS) {
  const [sun, earth] = await Promise.all([query('10', r.lat, r.lon, r.elevationM / 1000), query('399', r.lat, r.lon, r.elevationM / 1000)]);
  out.sites.push({ id: r.id, sun, earth });
  console.log('ok', r.id, sun.az.length);
}
writeFileSync(new URL('../public/data/ephem-2028.json', import.meta.url), JSON.stringify(out));
