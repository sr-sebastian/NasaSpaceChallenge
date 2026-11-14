import { useEffect, useMemo, useState } from 'react';
import { REGIONS, COLORS } from './regions';
import { loadEphem, metrics, bestStart, dailyFraction, dateToHour, hourToDate, hourToStamp, HOURS, type Ephem, type Priority, type Terrain } from './data';
import { t, type Lang } from './i18n';
import { PolarMap, Timeline, Panorama, Heatmap } from './Charts';
import './nv.css';

interface Scenario { site: string; date: string }
const nameOf = (id: string) => REGIONS.find(r => r.id === id)?.name ?? id;
const DEFAULT: Scenario[] = [{ site: 'malapert', date: '2028-09-01' }, { site: 'degerlache-2', date: '2028-09-01' }];

function readHash() {
  try {
    const p = new URLSearchParams(location.hash.slice(1));
    const sc = p.get('s')?.split(';').map(x => { const [site, date] = x.split('@'); return { site, date }; }).filter(x => REGIONS.some(r => r.id === x.site) && /^2028-\d\d-\d\d$/.test(x.date));
    return { sc: sc?.length ? sc : null, dur: Number(p.get('d')) || null, hz: (p.get('t') === 'flat' ? 'flat' : 'lola') as Terrain, lang: (p.get('l') as Lang) || null };
  } catch { return { sc: null, dur: null, hz: 'lola' as Terrain, lang: null }; }
}

function Delta({ v, unit, invert }: { v: number; unit: string; invert?: boolean }) {
  const good = invert ? v < 0 : v > 0; const cls = v === 0 ? 'zero' : good ? 'up' : 'down';
  return <span className={`nv-delta ${cls}`}>{v > 0 ? '+' : v < 0 ? '−' : '±'}{Math.abs(v)} {unit}</span>;
}

export function Navigator({ onTeach }: { onTeach: () => void }) {
  const init = useMemo(readHash, []);
  const [lang, setLang] = useState<Lang>(init.lang ?? (navigator.language.startsWith('es') ? 'es' : 'en'));
  const L = t(lang);
  const [e, setE] = useState<Ephem | null>(null);
  const [scen, setScen] = useState<Scenario[]>(init.sc ?? DEFAULT);
  const [active, setActive] = useState(0);
  const [days, setDays] = useState(init.dur ?? 14);
  const [terrain, setTerrain] = useState<Terrain>(init.hz);
  const [cursor, setCursor] = useState(0);
  const [prio, setPrio] = useState<Priority>('both');
  const [tab, setTab] = useState<'sky' | 'cal' | 'rank'>('sky');
  const [method, setMethod] = useState(false);
  const [copied, setCopied] = useState(false);
  const dur = days * 24;

  useEffect(() => { loadEphem().then(setE); }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  useEffect(() => { history.replaceState(null, '', `#s=${scen.map(s => `${s.site}@${s.date}`).join(';')}&d=${days}&t=${terrain}&l=${lang}`); }, [scen, days, terrain, lang]);
  useEffect(() => { setCursor(c => Math.min(c, dur - 1)); }, [dur]);

  const maxDate = hourToDate(HOURS - dur);
  const upd = (i: number, patch: Partial<Scenario>) => setScen(s => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const ms = useMemo(() => (e ? scen.map(s => metrics(e, s.site, dateToHour(s.date), dur, terrain)) : []), [e, scen, dur, terrain]);
  const act = scen[Math.min(active, scen.length - 1)];
  const heat = useMemo(() => (e && tab === 'cal' ? REGIONS.map(r => ({ id: r.id, name: r.name, f: dailyFraction(e, r.id, terrain, prio) })) : []), [e, tab, terrain, prio]);
  const ranking = useMemo(() => {
    if (!e || tab !== 'rank') return [];
    const h0 = dateToHour(act.date);
    return REGIONS.map(r => ({ r, m: metrics(e, r.id, h0, dur, terrain) }))
      .sort((a, b) => (prio === 'sun' ? b.m.sunH - a.m.sunH : prio === 'earth' ? b.m.earthH - a.m.earthH : b.m.bothH - a.m.bothH || b.m.sunH + b.m.earthH - a.m.sunH - a.m.earthH));
  }, [e, tab, act.date, dur, terrain, prio]);

  const exportCsv = () => {
    if (!e) return; const rows = ['scenario,site,lat,lon,utc,hours_since_landing,sun_az,sun_el,sun_visible,earth_az,earth_el,earth_visible'];
    scen.forEach((s, i) => { const site = e.sites.find(x => x.id === s.site)!; const r = REGIONS.find(x => x.id === s.site)!; const h0 = dateToHour(s.date);
      for (let k = 0; k < dur; k++) { const h = h0 + k; rows.push([String.fromCharCode(65 + i), r.name, r.lat, r.lon, hourToStamp(h), k, site.sun.az[h] / 10, site.sun.el[h] / 100, ms[i].sun[k], site.earth.az[h] / 10, site.earth.el[h] / 100, ms[i].earth[k]].join(',')); } });
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' })); a.download = 'lunar-landing-scenarios.csv'; a.click();
  };
  const share = async () => { try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ } };
  const letter = (i: number) => String.fromCharCode(65 + i);

  return (
    <div className="nv">
      <header className="nv-head">
        <div className="nv-brand"><span className="nv-logo" aria-hidden>◐</span><div><b>{L.title}</b><small>{L.tagline}</small></div></div>
        <nav className="nv-actions">
          <button onClick={() => setMethod(true)}>{L.method}</button>
          <button onClick={onTeach}>{L.teach}</button>
          <button className="nv-lang" onClick={() => setLang(lang === 'es' ? 'en' : 'es')} aria-label="Language">{lang === 'es' ? 'EN' : 'ES'}</button>
        </nav>
      </header>

      <p className="nv-question">{L.q}</p>

      {!e ? <div className="nv-loading">{L.loading}</div> : (
        <main className="nv-grid">
          <section className="nv-panel nv-scen">
            <div className="nv-row"><h2>{L.scenarios}</h2>
              <label className="nv-inline">{L.stay}<select value={days} onChange={ev => setDays(+ev.target.value)}>{[3, 7, 14, 28].map(d => <option key={d} value={d}>{d} {L.days}</option>)}</select></label>
              <label className="nv-inline">{L.horizon}<select value={terrain} onChange={ev => setTerrain(ev.target.value as Terrain)}><option value="lola">{L.terrainLola}</option><option value="flat">{L.terrainFlat}</option></select></label>
            </div>
            <div className="nv-cards">
              {scen.map((s, i) => { const m = ms[i], b = ms[0]; return (
                <article key={i} className={`nv-card ${i === active ? 'on' : ''}`} style={{ ['--c' as string]: COLORS[i] }} onClick={() => setActive(i)}>
                  <div className="nv-card-top"><span className="nv-tag">{letter(i)}{i === 0 && <em>{L.base}</em>}{i === active && <em>{L.active}</em>}</span>
                    {scen.length > 1 && <button className="nv-x" onClick={ev => { ev.stopPropagation(); setScen(sc => sc.filter((_, j) => j !== i)); setActive(0); }} aria-label={L.remove}>×</button>}</div>
                  <label>{L.site}<select value={s.site} onChange={ev => upd(i, { site: ev.target.value })}>{REGIONS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
                  <div className="nv-daterow"><label>{L.date}<input type="date" min="2028-01-01" max={maxDate} value={s.date} onChange={ev => ev.target.value && upd(i, { date: ev.target.value > maxDate ? maxDate : ev.target.value })} /></label>
                    <button className="nv-best" onClick={ev => { ev.stopPropagation(); upd(i, { date: hourToDate(bestStart(e, s.site, dur, terrain, prio)) }); }} title={L.best}>★ {L.best}</button></div>
                  <dl className="nv-stats">
                    <div><dt><i className="dot sun" />{L.sun}</dt><dd>{m.sunH} {L.h} <small>{Math.round((m.sunH / dur) * 100)}%</small>{i > 0 && <Delta v={m.sunH - b.sunH} unit={L.h} />}</dd></div>
                    <div><dt><i className="dot earth" />{L.earth}</dt><dd>{m.earthH} {L.h} <small>{Math.round((m.earthH / dur) * 100)}%</small>{i > 0 && <Delta v={m.earthH - b.earthH} unit={L.h} />}</dd></div>
                    <div><dt><i className="dot both" />{L.both}</dt><dd>{m.bothH} {L.h}{i > 0 && <Delta v={m.bothH - b.bothH} unit={L.h} />}</dd></div>
                    <div><dt>☾ {L.longestDark}</dt><dd>{m.longestDark} {L.h}{i > 0 && <Delta v={m.longestDark - b.longestDark} unit={L.h} invert />}</dd></div>
                    <div><dt>⌁ {L.longestNoComm}</dt><dd>{m.longestNoComm} {L.h}{i > 0 && <Delta v={m.longestNoComm - b.longestNoComm} unit={L.h} invert />}</dd></div>
                  </dl>
                  {i > 0 && <p className="nv-sentence">{L.sentence(`${letter(0)} (${nameOf(scen[0].site)}, ${scen[0].date})`, `${letter(i)} (${nameOf(s.site)}, ${s.date})`, m.sunH - b.sunH, m.earthH - b.earthH)}</p>}
                </article>); })}
              {scen.length < 4 && <button className="nv-add" onClick={() => { setScen(s => [...s, { ...s[s.length - 1] }]); setActive(scen.length); }}>+ {L.add}</button>}
            </div>
            <div className="nv-row nv-tools">
              <label className="nv-inline">{L.priority}<select value={prio} onChange={ev => setPrio(ev.target.value as Priority)}><option value="both">{L.sun} + {L.earth}</option><option value="sun">{L.sun}</option><option value="earth">{L.earth}</option></select></label>
              <button onClick={exportCsv}>⇩ {L.csv}</button><button onClick={share}>⧉ {copied ? L.copied : L.share}</button>
            </div>
          </section>

          <section className="nv-panel nv-tl-panel">
            <div className="nv-row"><h2>{L.timeline}</h2><span className="nv-legend"><i className="dot sun" />{L.light} <i className="dot earth" />{L.comm}</span></div>
            <Timeline rows={scen.map((s, i) => ({ name: `${letter(i)} · ${nameOf(s.site)}`, color: COLORS[i], m: ms[i] }))} dur={dur} cursor={cursor} setCursor={setCursor} labels={{ sun: L.sun, earth: L.earth }} />
            <label className="nv-slider">{L.now} +{cursor} h {L.since} · {letter(active)}: {hourToStamp(dateToHour(act.date) + cursor)}
              <input type="range" min={0} max={dur - 1} value={cursor} onChange={ev => setCursor(+ev.target.value)} /></label>
          </section>

          <section className="nv-panel nv-map-panel">
            <h2>{L.map}</h2><p className="nv-hint">{L.mapHint}</p>
            <PolarMap selected={act.site} onPick={id => upd(active, { site: id })} scenarioSites={scen.map(s => s.site)} />
          </section>

          <section className="nv-panel nv-detail">
            <div className="nv-tabs" role="tablist">
              {(['sky', 'cal', 'rank'] as const).map(k => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{k === 'sky' ? L.panorama : k === 'cal' ? L.calendar : L.ranking}</button>)}
              <span className="nv-tab-ctx" style={{ color: COLORS[active] }}>{letter(active)} · {nameOf(act.site)}</span>
            </div>
            {tab === 'sky' && <><p className="nv-hint">{L.panoramaHint}</p><Panorama e={e} siteId={act.site} start={dateToHour(act.date)} dur={dur} terrain={terrain} cursor={cursor} labels={{ sun: L.sun, earth: L.earth, below: L.below }} /></>}
            {tab === 'cal' && <><p className="nv-hint">{L.calendarHint} ({prio === 'sun' ? L.sun : prio === 'earth' ? L.earth : L.both})</p>
              <Heatmap data={heat} p={prio} activeSite={act.site} activeDay={Math.floor(dateToHour(act.date) / 24)} onPick={(id, d) => upd(active, { site: id, date: hourToDate(Math.min(d * 24, HOURS - dur)) })} /></>}
            {tab === 'rank' && <div className="nv-table-wrap"><table className="nv-table"><thead><tr><th>#</th><th>{L.site}</th><th>{L.sun}</th><th>{L.earth}</th><th>{L.both}</th><th>{L.longestDark}</th><th>{L.longestNoComm}</th></tr></thead>
              <tbody>{ranking.map(({ r, m }, i) => <tr key={r.id} className={r.id === act.site ? 'on' : ''} onClick={() => upd(active, { site: r.id })}><td>{i + 1}</td><td>{r.name}</td><td>{m.sunH} h</td><td>{m.earthH} h</td><td>{m.bothH} h</td><td>{m.longestDark} h</td><td>{m.longestNoComm} h</td></tr>)}</tbody></table>
              <p className="nv-hint">{act.date} · {days} {L.days}</p></div>}
          </section>
        </main>
      )}

      <footer className="nv-foot">NASA Space Apps Challenge 2026 · Lunar Landing Site Navigator · {lang === 'es' ? 'Datos: NASA/JPL Horizons. Horas en UTC.' : 'Data: NASA/JPL Horizons. Times in UTC.'}</footer>

      {method && <div className="nv-modal" onClick={() => setMethod(false)}><div className="nv-modal-card" onClick={ev => ev.stopPropagation()}>
        <button className="nv-x" onClick={() => setMethod(false)}>×</button>
        {lang === 'es' ? <>
          <h2>Datos y método</h2>
          <p><b>Posiciones del Sol y la Tierra:</b> NASA/JPL Horizons (efemérides DE441), azimut y elevación aparentes sin atmósfera, calculados de forma topocéntrica sobre la superficie lunar (centro <code>coord@301</code>), cada hora durante todo 2028 (8784 h por sitio).</p>
          <p><b>Sitios:</b> un punto representativo <b>aproximado</b> dentro de cada una de las 9 regiones candidatas de Artemis III que NASA anunció en 2024. No son coordenadas oficiales de aterrizaje.</p>
          <p><b>Visibilidad:</b> un cuerpo cuenta como visible cuando su centro está por encima del horizonte local. Este prototipo usa un horizonte geométrico (0°) ajustable con el control «Horizonte local». Todavía no incorpora el relieve real de LRO/LOLA, que puede tapar el Sol o la Tierra durante muchas horas. Ese es el próximo paso del pipeline (<code>scripts/</code>).</p>
          <p><b>Métricas:</b> horas de Sol, de Tierra y de ambos a la vez durante la estadía, la noche continua más larga (crítica para baterías y supervivencia térmica) y el mayor apagón de radio directo.</p>
          <p><b>No incluye:</b> relieve local, eclipses, rendimiento de paneles, presupuesto de enlace ni relés. Herramienta educativa y de exploración, no de planificación operacional.</p>
          <p><b>Uso de IA:</b> el código y los textos de la interfaz se desarrollaron con ayuda de asistentes de IA (Claude Code, ChatGPT). Los datos provienen exclusivamente de las fuentes citadas.</p>
        </> : <>
          <h2>Data & method</h2>
          <p><b>Sun and Earth positions:</b> NASA/JPL Horizons (DE441 ephemerides), airless apparent azimuth and elevation computed topocentrically on the lunar surface (center <code>coord@301</code>), hourly for all of 2028 (8,784 h per site).</p>
          <p><b>Sites:</b> one <b>approximate</b> representative point inside each of the 9 Artemis III candidate regions announced by NASA in 2024. These are not official landing coordinates.</p>
          <p><b>Visibility:</b> a body counts as visible when its center is above the local horizon. This prototype uses a geometric horizon (0°), adjustable with the “Local horizon” control. It does not yet include real LRO/LOLA terrain, which can block the Sun or Earth for many hours. That is the next pipeline step (<code>scripts/</code>).</p>
          <p><b>Metrics:</b> Sun, Earth and simultaneous hours during the stay, the longest continuous night (critical for batteries and thermal survival) and the longest direct-to-Earth blackout.</p>
          <p><b>Not included:</b> local terrain, eclipses, solar panel performance, link budget or relays. An educational and exploratory tool, not for operational planning.</p>
          <p><b>AI use:</b> code and interface text were developed with help from AI assistants (Claude Code, ChatGPT). Data comes only from the cited sources.</p>
        </>}
        <p className="nv-hint">{e?.source}</p>
      </div></div>}
    </div>
  );
}
