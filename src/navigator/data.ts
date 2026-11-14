export interface Track { az: number[]; el: number[] }
export interface SiteEphem { id: string; sun: Track; earth: Track }
export interface Ephem { source: string; start: string; stepHours: number; azScale: number; elScale: number; sites: SiteEphem[] }
export const YEAR_START = Date.UTC(2028, 0, 1);
export const HOURS = 8784;

let cache: Promise<Ephem> | null = null;
export const loadEphem = () => (cache ??= fetch(`${import.meta.env.BASE_URL}data/ephem-2028.json`).then(r => r.json()));

export const dateToHour = (d: string) => Math.round((Date.parse(d + 'T00:00:00Z') - YEAR_START) / 36e5);
export const hourToDate = (h: number) => new Date(YEAR_START + h * 36e5).toISOString().slice(0, 10);
export const hourToStamp = (h: number) => new Date(YEAR_START + h * 36e5).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

export interface Metrics { sunH: number; earthH: number; bothH: number; longestDark: number; longestNoComm: number; sun: Uint8Array; earth: Uint8Array }

/** Visibilidad = centro del cuerpo por encima del horizonte local (en grados). */
export function metrics(e: Ephem, siteId: string, start: number, dur: number, horizon: number): Metrics {
  const s = e.sites.find(x => x.id === siteId)!; const k = e.elScale; const lim = horizon * k;
  const sun = new Uint8Array(dur), earth = new Uint8Array(dur);
  let sunH = 0, earthH = 0, bothH = 0, dark = 0, longestDark = 0, nc = 0, longestNoComm = 0;
  for (let i = 0; i < dur; i++) {
    const h = Math.min(start + i, HOURS - 1);
    const a = s.sun.el[h] > lim ? 1 : 0, b = s.earth.el[h] > lim ? 1 : 0;
    sun[i] = a; earth[i] = b; sunH += a; earthH += b; bothH += a & b;
    dark = a ? 0 : dark + 1; longestDark = Math.max(longestDark, dark);
    nc = b ? 0 : nc + 1; longestNoComm = Math.max(longestNoComm, nc);
  }
  return { sunH, earthH, bothH, longestDark, longestNoComm, sun, earth };
}

export type Priority = 'both' | 'sun' | 'earth';
/** Mejor día de inicio (00:00 UTC) en 2028 para un sitio y duración, con ventana deslizante. */
export function bestStart(e: Ephem, siteId: string, dur: number, horizon: number, p: Priority): number {
  const s = e.sites.find(x => x.id === siteId)!; const lim = horizon * e.elScale;
  const v = new Float64Array(HOURS + 1);
  for (let h = 0; h < HOURS; h++) {
    const a = s.sun.el[h] > lim ? 1 : 0, b = s.earth.el[h] > lim ? 1 : 0;
    v[h + 1] = v[h] + (p === 'sun' ? a : p === 'earth' ? b : a * b * 2 + a + b);
  }
  let best = 0, bestV = -1;
  for (let d = 0; d * 24 + dur <= HOURS; d++) { const val = v[d * 24 + dur] - v[d * 24]; if (val > bestV) { bestV = val; best = d * 24; } }
  return best;
}

/** Fracción diaria de horas visibles (para el calendario). */
export function dailyFraction(e: Ephem, siteId: string, horizon: number, p: Priority): Float32Array {
  const s = e.sites.find(x => x.id === siteId)!; const lim = horizon * e.elScale; const out = new Float32Array(HOURS / 24);
  for (let h = 0; h < HOURS; h++) {
    const a = s.sun.el[h] > lim, b = s.earth.el[h] > lim;
    if (p === 'sun' ? a : p === 'earth' ? b : a && b) out[Math.floor(h / 24)] += 1 / 24;
  }
  return out;
}
