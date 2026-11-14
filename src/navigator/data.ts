export interface Track { az: number[]; el: number[] }
export interface SiteEphem { id: string; sun: Track; earth: Track }
export interface Ephem { source: string; start: string; stepHours: number; azScale: number; elScale: number; sites: SiteEphem[]; masks: Record<string, Int16Array>; horizonSource: string }
interface HorizonFile { source: string; azStepDeg: number; maskScale: number; sites: { id: string; mask: number[] }[] }
export const YEAR_START = Date.UTC(2028, 0, 1);
export const HOURS = 8784;

let cache: Promise<Ephem> | null = null;
const get = <T,>(f: string): Promise<T> => fetch(`${import.meta.env.BASE_URL}data/${f}`).then(r => { if (!r.ok) throw new Error(f); return r.json(); });
export const loadEphem = () => (cache ??= Promise.all([get<Omit<Ephem, 'masks' | 'horizonSource'>>('ephem-2028.json'), get<HorizonFile>('horizons.json')]).then(([e, h]) => ({
  ...e, horizonSource: h.source, masks: Object.fromEntries(h.sites.map(s => [s.id, Int16Array.from(s.mask)])),
})));

/** Terreno: 'lola' = horizonte real LRO/LOLA; 'flat' = horizonte geométrico 0° (para comparar cuánto importa el relieve). */
export type Terrain = 'lola' | 'flat';
/** Elevación del horizonte (en centésimas de grado) para un azimut dado en décimas de grado. Máscara a 0.5°. */
const maskAt = (m: Int16Array, az10: number) => m[Math.round(az10 / 5) % m.length];
export const horizonDeg = (e: Ephem, siteId: string, azDeg: number, t: Terrain) => (t === 'flat' ? 0 : maskAt(e.masks[siteId], azDeg * 10) / 100);
const visible = (e: Ephem, m: Int16Array, t: Terrain, az: number, el: number) => (t === 'flat' ? el > 0 : el > maskAt(m, az * (10 / e.azScale)) * (e.elScale / 100));

export const dateToHour = (d: string) => Math.round((Date.parse(d + 'T00:00:00Z') - YEAR_START) / 36e5);
export const hourToDate = (h: number) => new Date(YEAR_START + h * 36e5).toISOString().slice(0, 10);
export const hourToStamp = (h: number) => new Date(YEAR_START + h * 36e5).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

export interface Metrics { sunH: number; earthH: number; bothH: number; longestDark: number; longestNoComm: number; sun: Uint8Array; earth: Uint8Array }

/** Visibilidad = centro del cuerpo por encima del horizonte local (en grados). */
export function metrics(e: Ephem, siteId: string, start: number, dur: number, t: Terrain): Metrics {
  const s = e.sites.find(x => x.id === siteId)!; const m = e.masks[siteId];
  const sun = new Uint8Array(dur), earth = new Uint8Array(dur);
  let sunH = 0, earthH = 0, bothH = 0, dark = 0, longestDark = 0, nc = 0, longestNoComm = 0;
  for (let i = 0; i < dur; i++) {
    const h = Math.min(start + i, HOURS - 1);
    const a = visible(e, m, t, s.sun.az[h], s.sun.el[h]) ? 1 : 0, b = visible(e, m, t, s.earth.az[h], s.earth.el[h]) ? 1 : 0;
    sun[i] = a; earth[i] = b; sunH += a; earthH += b; bothH += a & b;
    dark = a ? 0 : dark + 1; longestDark = Math.max(longestDark, dark);
    nc = b ? 0 : nc + 1; longestNoComm = Math.max(longestNoComm, nc);
  }
  return { sunH, earthH, bothH, longestDark, longestNoComm, sun, earth };
}

export type Priority = 'both' | 'sun' | 'earth';
/** Mejor día de inicio (00:00 UTC) en 2028 para un sitio y duración, con ventana deslizante. */
export function bestStart(e: Ephem, siteId: string, dur: number, t: Terrain, p: Priority): number {
  const s = e.sites.find(x => x.id === siteId)!; const m = e.masks[siteId];
  const v = new Float64Array(HOURS + 1);
  for (let h = 0; h < HOURS; h++) {
    const a = visible(e, m, t, s.sun.az[h], s.sun.el[h]) ? 1 : 0, b = visible(e, m, t, s.earth.az[h], s.earth.el[h]) ? 1 : 0;
    v[h + 1] = v[h] + (p === 'sun' ? a : p === 'earth' ? b : a * b * 2 + a + b);
  }
  let best = 0, bestV = -1;
  for (let d = 0; d * 24 + dur <= HOURS; d++) { const val = v[d * 24 + dur] - v[d * 24]; if (val > bestV) { bestV = val; best = d * 24; } }
  return best;
}

/** Fracción diaria de horas visibles (para el calendario). */
export function dailyFraction(e: Ephem, siteId: string, t: Terrain, p: Priority): Float32Array {
  const s = e.sites.find(x => x.id === siteId)!; const m = e.masks[siteId]; const out = new Float32Array(HOURS / 24);
  for (let h = 0; h < HOURS; h++) {
    const a = visible(e, m, t, s.sun.az[h], s.sun.el[h]), b = visible(e, m, t, s.earth.az[h], s.earth.el[h]);
    if (p === 'sun' ? a : p === 'earth' ? b : a && b) out[Math.floor(h / 24)] += 1 / 24;
  }
  return out;
}
