import type React from 'react';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { REGIONS, COLORS } from './regions';
import { loadEphem, metrics, bestStart, dailyFraction, dateToHour, hourToDate, hourToStamp, horizonDeg, HOURS, type Ephem, type Priority, type Terrain } from './data';
import { t, type Lang } from './i18n';
import { PoleMap, Timeline, SkyMap, Heatmap, BatteryChart, shortName } from './Charts';
import { runEnergy, DEFAULT_EQUIPMENT, type Equipment } from './energy';
import { TOUR } from './tour';
import type { CameraPreset } from './scene/SiteScene';
import './nv.css';

const SiteScene = lazy(() => import('./scene/SiteScene').then(m => ({ default: m.SiteScene })));

interface Scenario { site: string; date: string }
const letter = (i: number) => String.fromCharCode(65 + i);
const DEFAULT: Scenario[] = [{ site: 'malapert', date: '2028-10-07' }, { site: 'degerlache-2', date: '2028-10-07' }];
const fmtDate = (d: string, lang: Lang) => new Date(d + 'T00:00:00Z').toLocaleDateString(lang === 'es' ? 'es-UY' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function readHash() {
  try {
    const p = new URLSearchParams(location.hash.slice(1));
    const sc = p.get('s')?.split(';').map(x => { const [site, date] = x.split('@'); return { site, date }; }).filter(x => REGIONS.some(r => r.id === x.site) && /^2028-\d\d-\d\d$/.test(x.date));
    return { sc: sc?.length ? sc.slice(0, 4) : null, dur: Number(p.get('d')) || null, terrain: (p.get('t') === 'flat' ? 'flat' : 'lola') as Terrain, lang: (['es', 'en'].includes(p.get('l') ?? '') ? p.get('l') : null) as Lang | null };
  } catch { return { sc: null, dur: null, terrain: 'lola' as Terrain, lang: null }; }
}

const tileCache = new Map<string, Promise<Int16Array>>();
const loadTile = (id: string) => { if (!tileCache.has(id)) tileCache.set(id, fetch(`${import.meta.env.BASE_URL}data/terrain/${id}.bin`).then(r => r.arrayBuffer()).then(b => new Int16Array(b))); return tileCache.get(id)!; };

function Delta({ v, unit, better }: { v: number; unit: string; better: 'up' | 'down' }) {
  const good = better === 'up' ? v > 0 : v < 0; const cls = v === 0 ? 'zero' : good ? 'good' : 'bad';
  return <span className={`delta ${cls}`}>{v > 0 ? '+' : v < 0 ? '−' : '±'}{Math.abs(v)}<small>{unit}</small></span>;
}

export function Navigator() {
  const init = useMemo(readHash, []);
  const [lang, setLang] = useState<Lang>(init.lang ?? (navigator.language.startsWith('es') ? 'es' : 'en'));
  const L = t(lang);
  const [e, setE] = useState<Ephem | null>(null);
  const [err, setErr] = useState(false);
  const [scen, setScen] = useState<Scenario[]>(init.sc ?? DEFAULT);
  const [active, setActive] = useState(0);
  const [days, setDays] = useState(init.dur ?? 7);
  const [terrain, setTerrain] = useState<Terrain>(init.terrain);
  const [cursor, setCursor] = useState(36);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [prio, setPrio] = useState<Priority>('both');
  const [preset, setPreset] = useState<CameraPreset>('sun');
  const [nonce, setNonce] = useState(0);
  const [tile, setTile] = useState<Int16Array | null>(null);
  const [eq, setEq] = useState<Equipment>(DEFAULT_EQUIPMENT);
  const [method, setMethod] = useState(false);
  const [tour, setTour] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const dur = days * 24;
  const act = scen[Math.min(active, scen.length - 1)];
  const look = (p: CameraPreset) => { setPreset(p); setNonce(n => n + 1); };

  useEffect(() => { loadEphem().then(setE).catch(() => setErr(true)); }, []);
  useEffect(() => { document.documentElement.lang = lang; document.title = L.title; }, [lang, L.title]);
  useEffect(() => { history.replaceState(null, '', `#s=${scen.map(s => `${s.site}@${s.date}`).join(';')}&d=${days}&t=${terrain}&l=${lang}`); }, [scen, days, terrain, lang]);
  useEffect(() => { setCursor(c => Math.min(c, dur - 1)); }, [dur]);
  useEffect(() => { let live = true; setTile(null); loadTile(act.site).then(h => live && setTile(h)); return () => { live = false; }; }, [act.site]);
  const lastTick = useRef(0);
  useEffect(() => {
    if (!playing) return; let raf = 0;
    const tick = (ts: number) => { if (ts - lastTick.current > 70) { lastTick.current = ts; setCursor(c => { if (c + speed >= dur - 1) { setPlaying(false); return dur - 1; } return c + speed; }); } raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [playing, speed, dur]);

  const maxDate = hourToDate(HOURS - dur);
  const upd = (i: number, patch: Partial<Scenario>) => setScen(s => s.map((x, j) => (j === i ? { ...x, ...patch, date: (patch.date ?? x.date) > maxDate ? maxDate : (patch.date ?? x.date) } : x)));
  const ms = useMemo(() => (e ? scen.map(s => metrics(e, s.site, dateToHour(s.date), dur, terrain)) : []), [e, scen, dur, terrain]);
  const heat = useMemo(() => (e ? REGIONS.map(r => ({ id: r.id, f: dailyWindow(dailyFraction(e, r.id, terrain, prio), days) })) : []), [e, terrain, prio, days]);
  const ranking = useMemo(() => {
    if (!e) return []; const h0 = dateToHour(act.date);
    return REGIONS.map(r => ({ r, m: metrics(e, r.id, h0, dur, terrain) }))
      .sort((a, b) => (prio === 'sun' ? b.m.sunH - a.m.sunH : prio === 'earth' ? b.m.earthH - a.m.earthH : b.m.bothH - a.m.bothH || b.m.sunH + b.m.earthH - a.m.sunH - a.m.earthH));
  }, [e, act.date, dur, terrain, prio]);
  const am = ms[Math.min(active, ms.length - 1)];
  const energy = useMemo(() => (am ? runEnergy(am.sun, am.earth, eq) : null), [am, eq]);

  const bodies = useMemo(() => {
    if (!e) return null; const s = e.sites.find(x => x.id === act.site)!; const h = Math.min(dateToHour(act.date) + cursor, HOURS - 1);
    const mk = (tr: { az: number[]; el: number[] }) => { const az = tr.az[h] / e.azScale, el = tr.el[h] / e.elScale; return { az, el, horizon: horizonDeg(e, act.site, az, terrain) }; };
    return { sun: mk(s.sun), earth: mk(s.earth), stamp: hourToStamp(h) };
  }, [e, act, cursor, terrain]);
  const sceneMask = useMemo(() => (e ? (terrain === 'flat' ? new Int16Array(720) : e.masks[act.site]) : null), [e, act.site, terrain]);

  const exportCsv = () => {
    if (!e) return; const rows = ['scenario,site,lat,lon,utc,hours_since_landing,sun_az_deg,sun_el_deg,sun_visible,earth_az_deg,earth_el_deg,earth_visible,terrain'];
    scen.forEach((s, i) => { const site = e.sites.find(x => x.id === s.site)!; const r = REGIONS.find(x => x.id === s.site)!; const h0 = dateToHour(s.date);
      for (let k = 0; k < dur; k++) { const h = h0 + k; rows.push([letter(i), `"${r.name}"`, r.lat, r.lon, hourToStamp(h), k, site.sun.az[h] / e.azScale, site.sun.el[h] / e.elScale, ms[i].sun[k], site.earth.az[h] / e.azScale, site.earth.el[h] / e.elScale, ms[i].earth[k], terrain].join(',')); } });
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' })); a.download = 'lunar-landing-scenarios.csv'; a.click(); URL.revokeObjectURL(a.href);
  };
  const share = async () => { try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* sin portapapeles */ } };

  const tourCtx = { e, setScen, setActive, setCursor, setTerrain, setDays, look, setPlaying, setEq };
  const goStep = (i: number | null) => { setTour(i); if (i !== null && e) TOUR[i].apply(tourCtx); };

  if (err) return <div className="app"><p className="loading">Error loading data. Reload the page.</p></div>;

  return (
    <div className="app">
      <header className="top">
        <div className="brand"><svg viewBox="0 0 32 32" aria-hidden className="brand-mark"><circle cx="16" cy="16" r="13" /><path d="M3 19 Q9 14 13 17 T22 15 T29 18" /></svg>
          <div><b>{L.title}</b><small>{L.tagline}</small></div></div>
        <nav>
          <button className="ghost" onClick={() => goStep(0)} disabled={!e}>{L.tour}</button>
          <button className="ghost" onClick={() => setMethod(true)}>{L.method}</button>
          <div className="seg" role="group" aria-label="Idioma / Language">{(['es', 'en'] as Lang[]).map(l => <button key={l} aria-pressed={lang === l} onClick={() => setLang(l)}>{l.toUpperCase()}</button>)}</div>
        </nav>
      </header>

      <section className="answer" aria-live="polite">
        <p className="q">{L.q}</p>
        <div className="scen">
          {scen.map((s, i) => (
            <div key={i} className={`chip ${i === active ? 'on' : ''}`} style={{ '--c': COLORS[i] } as React.CSSProperties} onClick={() => setActive(i)}>
              <span className="chip-l">{letter(i)}{i === 0 && <em>{L.base}</em>}</span>
              <label className="sr" htmlFor={`site-${i}`}>{L.site}</label>
              <select id={`site-${i}`} value={s.site} onChange={ev => upd(i, { site: ev.target.value })}>{REGIONS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
              <label className="date-btn" htmlFor={`date-${i}`} title={L.date}>
                <span className="mono">{fmtDate(s.date, lang)}</span>
                <input id={`date-${i}`} type="date" min="2028-01-01" max={maxDate} value={s.date} onChange={ev => ev.target.value && upd(i, { date: ev.target.value })} onClick={ev => { try { (ev.currentTarget as HTMLInputElement).showPicker(); } catch { /* sin showPicker */ } }} aria-label={L.date} />
              </label>
              <button className="icon" title={L.bestHint} aria-label={L.best} onClick={ev => { ev.stopPropagation(); if (e) upd(i, { date: hourToDate(bestStart(e, s.site, dur, terrain, prio)) }); }}>★</button>
              {scen.length > 1 && <button className="icon" aria-label={L.remove} onClick={ev => { ev.stopPropagation(); setScen(sc => sc.filter((_, j) => j !== i)); setActive(0); }}>×</button>}
            </div>
          ))}
          {scen.length < 4 && <button className="chip add" onClick={() => { setScen(s => [...s, { ...s[s.length - 1] }]); setActive(scen.length); }}>+ {L.add}</button>}
          <div className="scen-opts">
            <label>{L.stay}<select value={days} onChange={ev => setDays(+ev.target.value)}>{[3, 6, 7, 14, 28].map(d => <option key={d} value={d}>{d} {L.days}</option>)}</select></label>
            <label title={L.terrainHint}>{L.terrain}<select value={terrain} onChange={ev => setTerrain(ev.target.value as Terrain)}><option value="lola">{L.terrainLola}</option><option value="flat">{L.terrainFlat}</option></select></label>
          </div>
        </div>

        {!e ? <p className="loading">{L.loading}</p> : scen.length < 2 ? <p className="verdict-one">{L.answerOne}</p> : (
          <div className="verdict">
            <p className="v-title">{L.answerFrom(`${letter(0)} · ${shortName(scen[0].site)}, ${fmtDate(scen[0].date, lang)}`, `${letter(active || 1)} · ${shortName(scen[active || 1].site)}, ${fmtDate(scen[active || 1].date, lang)}`)}</p>
            {(() => { const b = ms[0], m = ms[active || 1]; return <>
              <div className="v-stats">
                <div><span className="k"><i className="sw sun" />{L.light}</span><Delta v={m.sunH - b.sunH} unit={L.h} better="up" /><span className="of">{b.sunH} → {m.sunH} {L.h}</span></div>
                <div><span className="k"><i className="sw earth" />{L.comm}</span><Delta v={m.earthH - b.earthH} unit={L.h} better="up" /><span className="of">{b.earthH} → {m.earthH} {L.h}</span></div>
                <div><span className="k">{L.longestDark}</span><Delta v={m.longestDark - b.longestDark} unit={L.h} better="down" /><span className="of">{b.longestDark} → {m.longestDark} {L.h}</span></div>
                <div><span className="k">{L.longestNoComm}</span><Delta v={m.longestNoComm - b.longestNoComm} unit={L.h} better="down" /><span className="of">{b.longestNoComm} → {m.longestNoComm} {L.h}</span></div>
              </div>
              <p className="v-sentence">{L.sentence(m.sunH - b.sunH, m.earthH - b.earthH)}</p>
            </>; })()}
          </div>
        )}
      </section>

      {e && bodies && sceneMask && (
        <>
          <main className="main">
            <section className="stage">
              <div className="viewport">
                <Suspense fallback={<div className="loading">{L.loading}</div>}>
                  <SiteScene flat={terrain === 'flat'} heights={terrain === 'flat' ? null : tile} size={241} step={100} mask={sceneMask} sun={bodies.sun} earth={bodies.earth}
                    preset={preset} presetNonce={nonce} onUserMove={() => setPreset('free')}
                    labels={{ sun: L.sun, earth: L.earth, lander: L.lander, above: L.aboveH, hidden: L.hidden, link: L.linkOn, noLink: L.linkOff, light: L.lightOn, dark: L.lightOff, compass: L.compass }} />
                </Suspense>
                <div className="hud-tl">
                  <small>{L.standing}</small>
                  <b style={{ color: COLORS[active] }}>{letter(active)} · {REGIONS.find(r => r.id === act.site)!.name}</b>
                  <span className="mono">{L.day} {Math.floor(cursor / 24) + 1} · {bodies.stamp}</span>
                </div>
                <div className="hud-tr">
                  {(['sun', 'earth', 'aerial'] as const).map(p => <button key={p} aria-pressed={preset === p} onClick={() => look(p)}>{p === 'sun' ? L.viewSun : p === 'earth' ? L.viewEarth : L.viewAerial}</button>)}
                </div>
              </div>
              <p className="hint">{L.sceneHint} · {L.sizeNote}</p>
              <div className="transport">
                <button className="play" onClick={() => { if (cursor >= dur - 1) setCursor(0); setPlaying(p => !p); }} aria-label={playing ? L.pause : L.play}>{playing ? '❚❚' : '▶'}</button>
                <div className="seg small" role="group" aria-label={L.speed}>{[1, 2, 6].map(v => <button key={v} aria-pressed={speed === v} onClick={() => setSpeed(v)}>×{v}</button>)}</div>
                <input type="range" min={0} max={dur - 1} value={cursor} onChange={ev => { setPlaying(false); setCursor(+ev.target.value); }} aria-label="Hora" />
                <span className="mono t-now">+{cursor} {L.h}</span>
              </div>
              <div className="windows">
                <div className="sec-h"><h2>{L.windows}</h2><span className="legend"><i className="sw sun" />{L.light}<i className="sw earth" />{L.comm}</span></div>
                <Timeline rows={scen.map((s, i) => ({ label: `${letter(i)} · ${shortName(s.site)}`, color: COLORS[i], m: ms[i] }))} dur={dur} cursor={cursor} setCursor={c => { setPlaying(false); setCursor(c); }} active={active} setActive={setActive} />
                <p className="hint">{L.windowsHint}</p>
              </div>
            </section>

            <aside className="side">
              <section>
                <div className="sec-h"><h2>{L.compare}</h2></div>
                <div className="tbl-wrap"><table className="cmp">
                  <thead><tr><th>{L.metric}</th>{scen.map((s, i) => <th key={i} style={{ color: COLORS[i] }}>{letter(i)}</th>)}</tr></thead>
                  <tbody>
                    {([['sunH', L.light, 'up'], ['earthH', L.comm, 'up'], ['bothH', L.both, 'up'], ['longestDark', L.longestDark, 'down'], ['longestNoComm', L.longestNoComm, 'down']] as const).map(([k, label, better]) => (
                      <tr key={k}><th scope="row">{label}</th>{ms.map((m, i) => <td key={i}><b>{m[k]}</b>{i > 0 && <Delta v={m[k] - ms[0][k]} unit="" better={better} />}</td>)}</tr>
                    ))}
                  </tbody>
                </table></div>
                <div className="row-btns"><button className="ghost" onClick={exportCsv}>{L.csv}</button><button className="ghost" onClick={share}>{copied ? L.copied : L.share}</button></div>
              </section>
              <section>
                <div className="sec-h"><h2>{L.map}</h2></div>
                <PoleMap active={act.site} scenarioSites={scen.map(s => s.site)} onPick={id => upd(active, { site: id })} />
                <p className="hint">{L.mapHint}</p>
              </section>
            </aside>
          </main>

          <section className="duo">
            <section className="panel">
              <div className="sec-h"><h2>{L.skymap}</h2><span className="tag" style={{ color: COLORS[active] }}>{letter(active)} · {shortName(act.site)}</span></div>
              <p className="hint lead">{L.skymapHint}</p>
              <SkyMap e={e} siteId={act.site} start={dateToHour(act.date)} dur={dur} terrain={terrain} cursor={cursor} L={{ sun: L.sun, earth: L.earth, now: L.now, path: L.path }} />
            </section>
            {energy && <section className="panel">
              <div className="sec-h"><h2>{L.energy}</h2><span className="tag" style={{ color: COLORS[active] }}>{letter(active)} · {shortName(act.site)}</span></div>
              <p className="hint lead">{L.energyHint}</p>
              <div className="eq">
                <label>{L.panels}<select value={eq.panelW} onChange={ev => setEq({ ...eq, panelW: +ev.target.value })}>{[300, 600, 1200].map(v => <option key={v} value={v}>{v} W</option>)}</select></label>
                <label>{L.battery}<select value={eq.batteryWh} onChange={ev => setEq({ ...eq, batteryWh: +ev.target.value })}>{[3000, 6000, 12000, 24000].map(v => <option key={v} value={v}>{v / 1000} kWh</option>)}</select></label>
                <label>{L.load}<select value={eq.loadW} onChange={ev => setEq({ ...eq, loadW: +ev.target.value })}>{[150, 250, 400].map(v => <option key={v} value={v}>{v} W</option>)}</select></label>
                <label className="chk"><input type="checkbox" checked={eq.autoHibernate} onChange={ev => setEq({ ...eq, autoHibernate: ev.target.checked })} />{L.hibernate}</label>
              </div>
              <p className={`verdict-pill ${energy.survived ? 'ok' : 'ko'}`}>{energy.survived ? L.survived : L.died(energy.diedAt)}</p>
              <BatteryChart battery={energy.battery} hib={energy.hibernating} sun={am.sun} cursor={cursor} diedAt={energy.diedAt} />
              <dl className="kv"><div><dt>{L.minBattery}</dt><dd>{Math.round(energy.minPct)} %</dd></div><div><dt>{L.hibernated}</dt><dd>{energy.hibernatedH} {L.h}</dd></div><div><dt>{L.dataSent}</dt><dd>{(energy.sentMB / 1000).toFixed(1)} GB</dd></div></dl>
            </section>}
          </section>

          <section className="panel cal">
            <div className="sec-h"><h2>{L.calendar}</h2>
              <div className="seg small" role="group" aria-label={L.priority}>{(['both', 'sun', 'earth'] as Priority[]).map(p => <button key={p} aria-pressed={prio === p} onClick={() => setPrio(p)}>{p === 'both' ? L.both : p === 'sun' ? L.sun : L.earth}</button>)}</div></div>
            <p className="hint lead">{L.calendarHint}</p>
            <Heatmap data={heat} p={prio} activeSite={act.site} activeDay={Math.floor(dateToHour(act.date) / 24)} onPick={(id, d) => upd(active, { site: id, date: hourToDate(Math.min(d * 24, HOURS - dur)) })} />
            <h3>{L.ranking} · {fmtDate(act.date, lang)}</h3>
            <div className="tbl-wrap"><table className="rank"><thead><tr><th>#</th><th>{L.site}</th><th>{L.sun}</th><th>{L.earth}</th><th>{L.both}</th><th>{L.longestDark}</th></tr></thead>
              <tbody>{ranking.map(({ r, m }, i) => <tr key={r.id} className={r.id === act.site ? 'on' : ''} onClick={() => upd(active, { site: r.id })}><td>{i + 1}</td><td>{r.name}</td><td>{m.sunH}</td><td>{m.earthH}</td><td>{m.bothH}</td><td>{m.longestDark}</td></tr>)}</tbody></table></div>
          </section>
        </>
      )}

      <footer className="foot">{L.footer}</footer>

      {tour !== null && e && (
        <div className="tour" role="dialog" aria-label={L.tour}>
          <div className="tour-prog" aria-label={`${L.step} ${tour + 1}/${TOUR.length}`}>{TOUR.map((_, i) => <i key={i} className={i <= tour ? 'on' : ''} />)}</div>
          <h3>{TOUR[tour].title[lang]}</h3>
          <p>{TOUR[tour].body[lang]}</p>
          <div className="tour-btns">
            <button className="ghost" onClick={() => goStep(null)}>{L.close}</button>
            {tour > 0 && <button className="ghost" onClick={() => goStep(tour - 1)}>{L.prev}</button>}
            {tour < TOUR.length - 1 ? <button className="primary" onClick={() => goStep(tour + 1)}>{L.next}</button> : <button className="primary" onClick={() => goStep(null)}>{L.close}</button>}
          </div>
        </div>
      )}

      {method && <div className="modal" onClick={() => setMethod(false)}><div className="modal-card" onClick={ev => ev.stopPropagation()} role="dialog" aria-label={L.method}>
        <button className="icon close" onClick={() => setMethod(false)} aria-label={L.close}>×</button>
        {lang === 'es' ? <>
          <h2>Datos y método</h2>
          <p><b>Sol y Tierra:</b> NASA/JPL Horizons (efemérides DE441), azimut y elevación aparentes sin atmósfera, calculados de forma topocéntrica sobre la superficie lunar (<code>coord@301</code>) con la altura real del terreno, cada hora de 2028.</p>
          <p><b>Regiones:</b> los polígonos oficiales de las 9 regiones candidatas de Artemis III (NASA, octubre 2024) publicados por USGS (McClernan 2024, doi:10.5066/P1MEQ6UK). Dentro de cada región evaluamos una grilla de puntos cada 1 km y usamos el que tiene más horas con Sol y Tierra visibles a la vez en 2028. No es un sitio de aterrizaje oficial.</p>
          <p><b>Horizonte real:</b> LRO/LOLA LDEM_80S_80M (80 m/px). Para cada sitio trazamos 720 direcciones (cada 0,5°) hasta 250 km, con la curvatura lunar y un observador a 2 m del suelo. Un cuerpo es visible cuando su centro supera ese horizonte. La opción «Sin relieve» usa 0° para mostrar cuánto cambia el resultado.</p>
          <p><b>Escena 3D:</b> 24 × 24 km de terreno LOLA alrededor del sitio (100 m entre muestras, sin exageración vertical). El horizonte lejano se dibuja con la misma máscara. El Sol y la Tierra se dibujan 3 veces más grandes para que se vean; la fase de la Tierra es real.</p>
          <p><b>Energía:</b> modelo didáctico con paneles verticales que siguen al Sol, consumo constante e hibernación automática. Sirve para comparar sitios, no para dimensionar un módulo real.</p>
          <p><b>Límites:</b> sin obstáculos menores a 80 m, sin eclipses, sin presupuesto de enlace ni relés. Es una herramienta educativa y de exploración, no de planificación operacional.</p>
          <p><b>Uso de IA:</b> el código y los textos se desarrollaron con ayuda de asistentes de IA (Claude Code, ChatGPT). Los datos provienen solo de las fuentes citadas.</p>
        </> : <>
          <h2>Data & method</h2>
          <p><b>Sun and Earth:</b> NASA/JPL Horizons (DE441), airless apparent azimuth and elevation computed topocentrically on the lunar surface (<code>coord@301</code>) at the real terrain height, every hour of 2028.</p>
          <p><b>Regions:</b> the official polygons of the 9 Artemis III candidate regions (NASA, October 2024) published by USGS (McClernan 2024, doi:10.5066/P1MEQ6UK). Inside each region we evaluate a 1 km grid and use the point with the most hours with both Sun and Earth visible in 2028. It is not an official landing site.</p>
          <p><b>Real horizon:</b> LRO/LOLA LDEM_80S_80M (80 m/px). For each site we trace 720 directions (every 0.5°) out to 250 km, with lunar curvature and an observer 2 m above ground. A body is visible when its center clears that horizon. “No terrain” uses 0° to show how much the result changes.</p>
          <p><b>3D view:</b> 24 × 24 km of LOLA terrain around the site (100 m spacing, no vertical exaggeration). The far horizon is drawn from the same mask. Sun and Earth are drawn 3× larger so they can be seen; Earth’s phase is real.</p>
          <p><b>Power:</b> a teaching model with vertical sun-tracking panels, constant load and automatic hibernation. Use it to compare sites, not to size a real lander.</p>
          <p><b>Limits:</b> no obstacles smaller than 80 m, no eclipses, no link budget or relays. An educational and exploratory tool, not for operational planning.</p>
          <p><b>AI use:</b> code and interface text were developed with help from AI assistants (Claude Code, ChatGPT). Data comes only from the cited sources.</p>
        </>}
        <p className="hint mono">{e?.source} · {e?.horizonSource}</p>
      </div></div>}
    </div>
  );
}

/** Convierte la fracción diaria en la fracción de la estadía (ventana de `days` días desde cada día). */
function dailyWindow(f: Float32Array, days: number) {
  const out = new Float32Array(f.length); let s = 0;
  for (let i = 0; i < f.length; i++) { s += f[i]; if (i >= days) s -= f[i - days]; if (i >= days - 1) out[i - days + 1] = s / days; }
  for (let i = f.length - days + 1; i < f.length; i++) out[i] = 0;
  return out;
}
