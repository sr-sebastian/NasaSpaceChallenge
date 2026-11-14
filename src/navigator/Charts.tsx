import type React from 'react';
import { REGIONS, COLORS } from './regions';
import type { Ephem, Metrics, Priority } from './data';
import { HOURS } from './data';

/** Mapa polar (proyección azimutal centrada en el polo sur). */
export function PolarMap({ selected, onPick, scenarioSites }: { selected: string; onPick: (id: string) => void; scenarioSites: string[] }) {
  const R = 150, maxColat = 7; // 83°S en el borde
  const xy = (lat: number, lon: number) => { const r = ((90 + lat) / maxColat) * R; const a = (lon * Math.PI) / 180; return [R + r * Math.sin(a), R - r * Math.cos(a)]; };
  return (
    <svg viewBox={`-10 -10 ${2 * R + 20} ${2 * R + 20}`} className="nv-map" role="img" aria-label="South pole map">
      <circle cx={R} cy={R} r={R} className="nv-map-disc" />
      {[2, 4, 6].map(c => <g key={c}><circle cx={R} cy={R} r={(c / maxColat) * R} className="nv-map-ring" /><text x={R + 3} y={R - (c / maxColat) * R + 10} className="nv-map-lbl">{90 - c}°S</text></g>)}
      {[0, 90, 180, 270].map(l => { const [x, y] = xy(-83, l); return <g key={l}><line x1={R} y1={R} x2={x} y2={y} className="nv-map-ring" /><text x={x} y={y} dy={l === 0 ? -3 : l === 180 ? 10 : 3} dx={l === 90 ? 3 : l === 270 ? -22 : -6} className="nv-map-lbl">{l === 0 ? '0°' : l === 90 ? '90°E' : l === 180 ? '180°' : '90°W'}</text></g>; })}
      <text x={R} y={R + 3} textAnchor="middle" className="nv-map-lbl">✕ 90°S</text>
      {REGIONS.map(r => { const [x, y] = xy(r.lat, r.lon); const idx = scenarioSites.indexOf(r.id); return (
        <g key={r.id} className="nv-map-pt" onClick={() => onPick(r.id)} tabIndex={0} onKeyDown={e => e.key === 'Enter' && onPick(r.id)}>
          <circle cx={x} cy={y} r={r.id === selected ? 8 : 6} fill={idx >= 0 ? COLORS[idx] : 'var(--muted)'} stroke={r.id === selected ? 'var(--fg)' : 'none'} strokeWidth={2} />
          <title>{r.name} ({Math.abs(r.lat)}°S, {r.lon}°)</title>
          {(idx >= 0 || r.id === selected) && <text x={x + 10} y={y + 4} className="nv-map-name">{idx >= 0 ? String.fromCharCode(65 + idx) + ' · ' : ''}{r.name}</text>}
        </g>); })}
    </svg>
  );
}

function runs(arr: Uint8Array) { const out: [number, number][] = []; let s = -1; for (let i = 0; i <= arr.length; i++) { if (arr[i] && s < 0) s = i; if (!arr[i] && s >= 0) { out.push([s, i - s]); s = -1; } } return out; }

/** Líneas de tiempo alineadas por tiempo desde el aterrizaje. */
export function Timeline({ rows, dur, cursor, setCursor, labels }: { rows: { name: string; color: string; m: Metrics }[]; dur: number; cursor: number; setCursor: (h: number) => void; labels: { sun: string; earth: string } }) {
  const W = 1000; const sx = W / dur;
  const ticks: number[] = []; for (let d = 0; d <= dur / 24; d += dur > 200 ? 2 : 1) ticks.push(d);
  const pick = (ev: React.PointerEvent<SVGSVGElement>) => { const b = ev.currentTarget.getBoundingClientRect(); setCursor(Math.max(0, Math.min(dur - 1, Math.floor(((ev.clientX - b.left) / b.width) * dur)))); };
  return (
    <div className="nv-timeline">
      {rows.map((r, i) => (
        <div className="nv-tl-row" key={i}>
          <div className="nv-tl-label"><b style={{ color: r.color }}>{r.name}</b><small>{labels.sun} / {labels.earth}</small></div>
          <svg viewBox={`0 0 ${W} 30`} preserveAspectRatio="none" onPointerDown={pick} onPointerMove={ev => ev.buttons && pick(ev)}>
            <rect width={W} height={13} className="nv-tl-bg" />
            {runs(r.m.sun).map(([s, l]) => <rect key={s} x={s * sx} width={l * sx} height={13} className="nv-sun" />)}
            <rect width={W} height={13} y={16} className="nv-tl-bg" />
            {runs(r.m.earth).map(([s, l]) => <rect key={s} x={s * sx} width={l * sx} y={16} height={13} className="nv-earth" />)}
            <line x1={cursor * sx} x2={cursor * sx} y1={0} y2={30} className="nv-cursor" />
          </svg>
        </div>
      ))}
      <div className="nv-tl-row"><div /><div className="nv-tl-ticks">{ticks.map(d => <span key={d} style={{ left: `${(d * 24 / dur) * 100}%` }}>{d}d</span>)}</div></div>
    </div>
  );
}

/** Panorama 360° del cielo: azimut (x) vs elevación (y). */
export function Panorama({ e, siteId, start, dur, horizon, cursor, labels }: { e: Ephem; siteId: string; start: number; dur: number; horizon: number; cursor: number; labels: { sun: string; earth: string; below: string } }) {
  const s = e.sites.find(x => x.id === siteId)!; const W = 720, H = 260, eMin = -6, eMax = 10;
  const X = (az: number) => (((az + 180) % 360) / 360) * W, // centrado en el norte (donde está la Tierra)
    Y = (el: number) => H - ((el - eMin) / (eMax - eMin)) * H;
  const pts = (tr: { az: number[]; el: number[] }) => { const p: string[] = []; for (let i = 0; i < dur; i += 2) { const h = Math.min(start + i, HOURS - 1); p.push(`${X(tr.az[h] / e.azScale).toFixed(1)},${Y(tr.el[h] / e.elScale).toFixed(1)}`); } return p; };
  const at = (tr: { az: number[]; el: number[] }) => { const h = Math.min(start + cursor, HOURS - 1); return [tr.az[h] / e.azScale, tr.el[h] / e.elScale]; };
  const [sa, se] = at(s.sun), [ea, ee] = at(s.earth);
  return (
    <svg viewBox={`-34 -6 ${W + 44} ${H + 30}`} className="nv-pano" role="img" aria-label="Sky panorama">
      <rect x={0} y={Y(horizon)} width={W} height={H - Y(horizon)} className="nv-ground" />
      {[-5, 0, 5, 10].map(v => <g key={v}><line x1={0} x2={W} y1={Y(v)} y2={Y(v)} className="nv-grid" /><text x={-4} y={Y(v) + 3} textAnchor="end" className="nv-ax">{v}°</text></g>)}
      {[0, 90, 180, 270, 360].map(x => <text key={x} x={(x / 360) * W} y={H + 18} textAnchor={x === 0 ? 'start' : x === 360 ? 'end' : 'middle'} className="nv-ax">{['S 180°', 'W 270°', 'N 0°', 'E 90°', 'S 180°'][x / 90]}</text>)}
      <line x1={0} x2={W} y1={Y(horizon)} y2={Y(horizon)} className="nv-horizon" />
      <text x={6} y={Y(horizon) + 14} className="nv-ax">{labels.below}</text>
      {pts(s.sun).map((p, i) => { const [x, y] = p.split(','); return <circle key={'s' + i} cx={x} cy={y} r={1.6} className="nv-sun" />; })}
      {pts(s.earth).map((p, i) => { const [x, y] = p.split(','); return <circle key={'e' + i} cx={x} cy={y} r={1.6} className="nv-earth" />; })}
      <circle cx={X(sa)} cy={Y(se)} r={8} className="nv-sun nv-body" /><text x={X(sa) + 10} y={Y(se) - 8} className="nv-body-lbl">{labels.sun} {se.toFixed(1)}°</text>
      <circle cx={X(ea)} cy={Y(ee)} r={7} className="nv-earth nv-body" /><text x={X(ea) + 10} y={Y(ee) + 16} className="nv-body-lbl">{labels.earth} {ee.toFixed(1)}°</text>
    </svg>
  );
}

/** Calendario: filas = sitios, columnas = días de 2028. */
export function Heatmap({ data, p, onPick, activeSite, activeDay }: { data: { id: string; name: string; f: Float32Array }[]; p: Priority; onPick: (id: string, day: number) => void; activeSite: string; activeDay: number }) {
  const cw = 2.4, ch = 20, L = 150, days = data[0]?.f.length ?? 366;
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']; const mStart = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
  const color = p === 'sun' ? '242,169,59' : p === 'earth' ? '90,169,255' : '79,209,165';
  return (
    <svg viewBox={`0 0 ${L + days * cw} ${data.length * ch + 16}`} className="nv-heat" onPointerDown={ev => {
      const b = (ev.currentTarget as SVGSVGElement).getBoundingClientRect(); const sc = (L + days * cw) / b.width;
      const x = (ev.clientX - b.left) * sc - L, y = (ev.clientY - b.top) * sc; const row = Math.floor(y / ch), day = Math.floor(x / cw);
      if (x >= 0 && row >= 0 && row < data.length && day < days) onPick(data[row].id, day);
    }}>
      {data.map((r, i) => (
        <g key={r.id} transform={`translate(0 ${i * ch})`}>
          <text x={0} y={ch - 6} className={r.id === activeSite ? 'nv-heat-name on' : 'nv-heat-name'}>{r.name}</text>
          {Array.from(r.f, (v, d) => <rect key={d} x={L + d * cw} width={cw + 0.2} height={ch - 2} fill={`rgba(${color},${(0.06 + 0.94 * v).toFixed(2)})`} />)}
        </g>
      ))}
      {mStart.map((d, i) => <text key={i} x={L + d * cw} y={data.length * ch + 14} className="nv-ax">{months[i]}</text>)}
      <rect x={L + activeDay * cw - 1} y={data.findIndex(r => r.id === activeSite) * ch - 1} width={cw + 2} height={ch} className="nv-heat-sel" />
    </svg>
  );
}
