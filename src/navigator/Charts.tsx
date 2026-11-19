import type React from 'react';
import { REGIONS, COLORS } from './regions';
import type { Ephem, Metrics, Priority, Terrain } from './data';
import { HOURS, horizonDeg } from './data';

const R = 1737400, HALF = 224640; // half-width (m) of south-pole-hillshade.png (see .json)
const toMap = (lat: number, lon: number, size: number) => {
  const r = 2 * R * Math.tan(((90 + lat) * Math.PI) / 360); const a = (lon * Math.PI) / 180;
  return [((r * Math.sin(a) + HALF) / (2 * HALF)) * size, ((HALF - r * Math.cos(a)) / (2 * HALF)) * size];
};
const SHORT: Record<string, string> = { 'cabeus-b': 'Cabeus B', haworth: 'Haworth', malapert: 'Malapert', 'mouton-plateau': 'Mouton Plateau', mouton: 'Mons Mouton', 'nobile-1': 'Nobile 1', 'nobile-2': 'Nobile 2', 'degerlache-2': 'de Gerlache 2', slater: 'Slater' };
export const shortName = (id: string) => SHORT[id] ?? id;

/** Mapa del polo sur con relieve LOLA sombreado y los polígonos oficiales (USGS). Crop centrado en el polo. */
export function PoleMap({ active, scenarioSites, onPick }: { active: string; scenarioSites: string[]; onPick: (id: string) => void }) {
  const S = 1000, x0 = 50, y0 = 80, w = 860, hgt = 600; // recorte de la zona con regiones
  return (
    <svg viewBox={`${x0} ${y0} ${w} ${hgt}`} className="pm" role="img" aria-label="South pole map">
      <image href={`${import.meta.env.BASE_URL}data/south-pole-hillshade.png`} x={0} y={0} width={S} height={S} className="pm-img" />
      {(() => { const [px, py] = toMap(-90, 0, S); return <g className="pm-pole"><circle cx={px} cy={py} r={4} /><text x={px + 7} y={py + 4}>90°S</text></g>; })()}
      {REGIONS.map(r => {
        const idx = scenarioSites.indexOf(r.id); const pts = r.polygon.map(([la, lo]) => toMap(la, lo, S).map(v => v.toFixed(1)).join(',')).join(' ');
        const [px, py] = toMap(r.lat, r.lon, S); const on = r.id === active; const col = idx >= 0 ? COLORS[idx] : undefined;
        return (
          <g key={r.id} className={`pm-r ${on ? 'on' : ''}`} onClick={() => onPick(r.id)} tabIndex={0} role="button" aria-label={r.name} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onPick(r.id)} style={col ? ({ '--c': col } as React.CSSProperties) : undefined}>
            <title>{r.name} · {Math.abs(r.lat).toFixed(2)}°S {r.lon.toFixed(2)}° · {r.elevationM} m</title>
            <polygon points={pts} className={idx >= 0 ? 'sel' : ''} />
            <circle cx={px} cy={py} r={idx >= 0 ? 9 : 6} className={idx >= 0 ? 'sel' : ''} />
            <text x={px + 8} y={py + 4} className={idx >= 0 || on ? 'sel' : ''}>{idx >= 0 ? `${String.fromCharCode(65 + idx)} · ` : ''}{shortName(r.id)}</text>
          </g>
        );
      })}
    </svg>
  );
}

function runs(arr: Uint8Array) { const out: [number, number][] = []; let s = -1; for (let i = 0; i <= arr.length; i++) { if (arr[i] && s < 0) s = i; if (!arr[i] && s >= 0) { out.push([s, i - s]); s = -1; } } return out; }

/** Ventanas de operación por escenario, alineadas desde el aterrizaje. */
export function Timeline({ rows, dur, cursor, setCursor, active, setActive }: { rows: { label: string; color: string; m: Metrics }[]; dur: number; cursor: number; setCursor: (h: number) => void; active: number; setActive: (i: number) => void }) {
  const W = 1000; const sx = W / dur;
  const ticks: number[] = []; for (let d = 0; d <= dur / 24; d += dur > 300 ? 4 : dur > 200 ? 2 : 1) ticks.push(d);
  const pick = (ev: React.PointerEvent<SVGSVGElement>) => { const b = ev.currentTarget.getBoundingClientRect(); setCursor(Math.max(0, Math.min(dur - 1, Math.floor(((ev.clientX - b.left) / b.width) * dur)))); };
  return (
    <div className="tl">
      {rows.map((r, i) => (
        <div className={`tl-row ${i === active ? 'on' : ''}`} key={i}>
          <button className="tl-label" onClick={() => setActive(i)} style={{ color: r.color }}>{r.label}</button>
          <svg viewBox={`0 0 ${W} 22`} preserveAspectRatio="none" onPointerDown={pick} onPointerMove={ev => ev.buttons && pick(ev)}>
            <rect width={W} height={9} className="tl-bg" />
            {runs(r.m.sun).map(([s, l]) => <rect key={s} x={s * sx} width={l * sx} height={9} className="f-sun" />)}
            <rect width={W} height={9} y={12} className="tl-bg" />
            {runs(r.m.earth).map(([s, l]) => <rect key={s} x={s * sx} width={l * sx} y={12} height={9} className="f-earth" />)}
            <line x1={(cursor + 0.5) * sx} x2={(cursor + 0.5) * sx} y1={0} y2={22} className="tl-cursor" />
          </svg>
        </div>
      ))}
      <div className="tl-row"><span /><div className="tl-ticks">{ticks.map(d => <span key={d} style={{ left: `${((d * 24) / dur) * 100}%` }}>{d}d</span>)}</div></div>
    </div>
  );
}

/** Mapa del cielo: azimut (x, centrado en el Norte) vs elevación (y). */
export function SkyMap({ e, siteId, start, dur, terrain, cursor, L }: { e: Ephem; siteId: string; start: number; dur: number; terrain: Terrain; cursor: number; L: { sun: string; earth: string; now: string; path: string } }) {
  const s = e.sites.find(x => x.id === siteId)!; const W = 900, H = 300, eMin = -6, eMax = 16;
  const X = (az: number) => (((az + 180) % 360) / 360) * W, Y = (el: number) => H - ((el - eMin) / (eMax - eMin)) * H;
  const path = (tr: { az: number[]; el: number[] }) => { const out: [number, number][] = []; for (let i = 0; i < dur; i += 2) { const h = Math.min(start + i, HOURS - 1); out.push([X(tr.az[h] / e.azScale), Y(tr.el[h] / e.elScale)]); } return out; };
  const at = (tr: { az: number[]; el: number[] }) => { const h = Math.min(start + cursor, HOURS - 1); return [tr.az[h] / e.azScale, tr.el[h] / e.elScale]; };
  const [sa, se] = at(s.sun), [ea, ee] = at(s.earth);
  const ground: string[] = []; for (let x = 0; x <= W; x += 2) { const az = ((x / W) * 360 + 180) % 360; ground.push(`${x},${Y(horizonDeg(e, siteId, az, terrain)).toFixed(1)}`); }
  const sunUp = se > horizonDeg(e, siteId, sa, terrain), earthUp = ee > horizonDeg(e, siteId, ea, terrain);
  return (
    <svg viewBox={`-36 -8 ${W + 48} ${H + 34}`} className="sky" role="img" aria-label="Sky map">
      {[-5, 0, 5, 10, 15].map(v => <g key={v}><line x1={0} x2={W} y1={Y(v)} y2={Y(v)} className={v === 0 ? 'sky-zero' : 'sky-grid'} /><text x={-6} y={Y(v) + 4} textAnchor="end" className="sky-ax">{v}°</text></g>)}
      <path d={`M0,${H} L${ground.join(' L')} L${W},${H} Z`} className="sky-ground" />
      <path d={`M${ground.join(' L')}`} className="sky-ridge" fill="none" />
      {path(s.sun).map(([x, y], i) => <circle key={'s' + i} cx={x} cy={y} r={1.4} className="f-sun" opacity={0.55} />)}
      {path(s.earth).map(([x, y], i) => <circle key={'e' + i} cx={x} cy={y} r={1.4} className="f-earth" opacity={0.55} />)}
      {[0, 90, 180, 270, 360].map(x => <text key={x} x={(x / 360) * W} y={H + 20} textAnchor={x === 0 ? 'start' : x === 360 ? 'end' : 'middle'} className="sky-ax">{['S', 'O/W', 'N', 'E', 'S'][x / 90]}</text>)}
      <g className={sunUp ? '' : 'sky-off'}><circle cx={X(sa)} cy={Y(se)} r={9} className="f-sun sky-body" /><text x={X(sa)} y={Y(se) - 15} textAnchor="middle" className="sky-lbl">☀ {L.sun} {L.now}</text></g>
      <g className={earthUp ? '' : 'sky-off'}><circle cx={X(ea)} cy={Y(ee)} r={7} className="f-earth sky-body" /><text x={X(ea)} y={Y(ee) + 22} textAnchor="middle" className="sky-lbl">◉ {L.earth} {L.now}</text></g>
    </svg>
  );
}

/** Calendario: filas = sitios, columnas = días de 2028. */
export function Heatmap({ data, p, onPick, activeSite, activeDay, lang = 'es' }: { data: { id: string; f: Float32Array }[]; p: Priority; onPick: (id: string, day: number) => void; activeSite: string; activeDay: number; lang?: 'es' | 'en' }) {
  const cw = 2.5, ch = 22, Lw = 112, days = data[0]?.f.length ?? 366;
  const mStart = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]; const mName = Array.from({ length: 12 }, (_, m) => new Date(Date.UTC(2028, m, 1)).toLocaleDateString(lang === 'es' ? 'es-UY' : 'en-GB', { month: 'short', timeZone: 'UTC' }).replace('.', ''));
  const cls = p === 'sun' ? 'f-sun' : p === 'earth' ? 'f-earth' : 'f-both';
  const row = data.findIndex(r => r.id === activeSite);
  return (
    <div className="hm-wrap"><svg viewBox={`0 0 ${Lw + days * cw} ${data.length * ch + 18}`} className="hm" onPointerDown={ev => {
      const b = (ev.currentTarget as SVGSVGElement).getBoundingClientRect(); const sc = (Lw + days * cw) / b.width;
      const x = (ev.clientX - b.left) * sc - Lw, y = (ev.clientY - b.top) * sc; const r = Math.floor(y / ch), d = Math.floor(x / cw);
      if (x >= 0 && r >= 0 && r < data.length && d < days) onPick(data[r].id, d);
    }}>
      {data.map((r, i) => (
        <g key={r.id} transform={`translate(0 ${i * ch})`}>
          <text x={0} y={ch - 7} className={r.id === activeSite ? 'hm-name on' : 'hm-name'}>{shortName(r.id)}</text>
          {Array.from(r.f, (v, d) => <rect key={d} x={Lw + d * cw} width={cw + 0.25} height={ch - 3} className={cls} opacity={(0.05 + 0.95 * v * v).toFixed(2)} />)}
        </g>
      ))}
      {mStart.map((d, i) => <text key={i} x={Lw + d * cw + 2} y={data.length * ch + 13} className="hm-ax">{mName[i]}</text>)}
      {row >= 0 && <rect x={Lw + activeDay * cw - 1.5} y={row * ch - 1.5} width={cw + 3} height={ch} className="hm-sel" />}
    </svg></div>
  );
}

/** Nivel de batería durante la estadía, con franjas de estado (hibernando / sin energía) y las horas con Sol de fondo. */
export function BatteryChart({ battery, state, sun, cursor, onSeek }: { battery: Float32Array; state: Uint8Array; sun: Uint8Array; cursor: number; onSeek: (h: number) => void }) {
  const W = 1000, H = 120, n = battery.length, sx = W / n;
  let d = ''; for (let i = 0; i < n; i++) d += `${i ? 'L' : 'M'}${(i * sx).toFixed(1)},${(H - battery[i] * H).toFixed(1)}`;
  const band = (k: number) => { const a = new Uint8Array(n); for (let i = 0; i < n; i++) a[i] = state[i] === k ? 1 : 0; return runs(a); };
  const days = n / 24; const step = days > 14 ? 7 : days > 7 ? 2 : 1; const ticks: number[] = []; for (let t = 0; t <= days; t += step) ticks.push(t);
  return (
    <div className="bat-wrap">
      <div className="bat-y mono"><span>100 %</span><span>50 %</span><span>0 %</span></div>
      <div className="bat-plot">
        <svg viewBox={`0 0 ${W} ${H + 14}`} preserveAspectRatio="none" className="bat" onPointerDown={ev => { const b = ev.currentTarget.getBoundingClientRect(); onSeek(Math.max(0, Math.min(n - 1, Math.floor(((ev.clientX - b.left) / b.width) * n)))); }}>
          {runs(sun).map(([s0, l]) => <rect key={s0} x={s0 * sx} width={l * sx} height={H} className="bat-sun" />)}
          {[0.25, 0.5, 0.75].map(v => <line key={v} x1={0} x2={W} y1={H * v} y2={H * v} className={v === 0.75 ? 'bat-25' : 'bat-grid'} />)}
          <path d={`${d}L${W},${H}L0,${H}Z`} className="bat-area" /><path d={d} className="bat-line" />
          {band(1).map(([s0, l]) => <rect key={'h' + s0} x={s0 * sx} width={l * sx} y={H + 4} height={9} rx={2} className="bat-hib" />)}
          {band(2).map(([s0, l]) => <rect key={'o' + s0} x={s0 * sx} width={l * sx} y={H + 4} height={9} rx={2} className="bat-off" />)}
          <line x1={(cursor + 0.5) * sx} x2={(cursor + 0.5) * sx} y1={0} y2={H + 14} className="tl-cursor" />
        </svg>
        <div className="tl-ticks">{ticks.map(t => <span key={t} style={{ left: `${(t / days) * 100}%` }}>{t}d</span>)}</div>
      </div>
    </div>
  );
}
