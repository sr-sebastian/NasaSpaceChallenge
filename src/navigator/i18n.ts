export type Lang = 'es' | 'en';
const T = {
  es: {
    title: 'Lunar Landing Site Navigator', tagline: '¿Dónde y cuándo aterrizar en el polo sur de la Luna?',
    q: 'Si cambio el sitio o la fecha, ¿cuánto tiempo gano o pierdo de luz y de comunicación?',
    method: 'Datos y método', teach: 'Simulador 3D (docentes)', loading: 'Cargando efemérides de NASA/JPL Horizons…',
    scenarios: 'Escenarios', stay: 'Estadía', days: 'días', horizon: 'Horizonte local', add: 'Agregar escenario',
    site: 'Sitio', date: 'Aterrizaje (UTC)', base: 'BASE', remove: 'Quitar', best: 'Mejor fecha',
    sun: 'Sol', earth: 'Tierra', both: 'Ambos', light: 'Luz solar', comm: 'Enlace directo con la Tierra',
    longestDark: 'Noche más larga', longestNoComm: 'Mayor apagón de radio', h: 'h',
    vs: 'vs', gain: 'ganás', lose: 'perdés', same: 'igual',
    sentence: (a: string, b: string, sun: number, earth: number) =>
      `Si pasás de ${a} a ${b}, ${sun === 0 ? 'mantenés las mismas horas de luz' : `${sun > 0 ? 'ganás' : 'perdés'} ${Math.abs(sun)} h de luz`} y ${earth === 0 ? 'las mismas de comunicación' : `${earth > 0 ? 'ganás' : 'perdés'} ${Math.abs(earth)} h de comunicación`}.`,
    timeline: 'Ventanas de operación', since: 'desde el aterrizaje', panorama: 'Cielo desde el sitio', panoramaHint: 'Recorrido del Sol y la Tierra sobre el horizonte durante la estadía (azimut vs elevación).',
    calendar: 'Calendario 2028', calendarHint: 'Fracción de cada día con visibilidad. Clic para usar esa fecha en el escenario activo.',
    ranking: 'Ranking de sitios para esta fecha', map: 'Regiones candidatas Artemis III', mapHint: 'Clic en una región para asignarla al escenario activo.',
    priority: 'Prioridad', active: 'activo', csv: 'Exportar CSV', share: 'Copiar enlace', copied: '¡Copiado!',
    below: 'bajo el horizonte', above: 'sobre el horizonte', now: 'Hora',
  },
  en: {
    title: 'Lunar Landing Site Navigator', tagline: 'Where and when should we land at the lunar south pole?',
    q: 'If I change the site or the date, how much sunlight and communication time do I gain or lose?',
    method: 'Data & method', teach: '3D simulator (educators)', loading: 'Loading NASA/JPL Horizons ephemerides…',
    scenarios: 'Scenarios', stay: 'Stay', days: 'days', horizon: 'Local horizon', add: 'Add scenario',
    site: 'Site', date: 'Landing (UTC)', base: 'BASE', remove: 'Remove', best: 'Best date',
    sun: 'Sun', earth: 'Earth', both: 'Both', light: 'Sunlight', comm: 'Direct-to-Earth link',
    longestDark: 'Longest night', longestNoComm: 'Longest radio blackout', h: 'h',
    vs: 'vs', gain: 'gain', lose: 'lose', same: 'same',
    sentence: (a: string, b: string, sun: number, earth: number) =>
      `Moving from ${a} to ${b}, you ${sun === 0 ? 'keep the same sunlight' : `${sun > 0 ? 'gain' : 'lose'} ${Math.abs(sun)} h of sunlight`} and ${earth === 0 ? 'the same comms time' : `${earth > 0 ? 'gain' : 'lose'} ${Math.abs(earth)} h of Earth contact`}.`,
    timeline: 'Operating windows', since: 'since landing', panorama: 'Sky from the site', panoramaHint: 'Sun and Earth paths above the horizon during the stay (azimuth vs elevation).',
    calendar: '2028 calendar', calendarHint: 'Fraction of each day with visibility. Click to use that date in the active scenario.',
    ranking: 'Site ranking for this date', map: 'Artemis III candidate regions', mapHint: 'Click a region to assign it to the active scenario.',
    priority: 'Priority', active: 'active', csv: 'Export CSV', share: 'Copy link', copied: 'Copied!',
    below: 'below horizon', above: 'above horizon', now: 'Hour',
  },
};
export type Dict = typeof T.es;
export const t = (l: Lang): Dict => T[l] as Dict;
