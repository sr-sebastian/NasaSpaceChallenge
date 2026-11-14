import { metrics, dateToHour, type Ephem, type Terrain } from './data';
import type { CameraPreset } from './scene/SiteScene';
import { DEFAULT_EQUIPMENT, type Equipment } from './energy';

export interface TourCtx {
  e: Ephem | null; setScen: (s: { site: string; date: string }[]) => void; setActive: (i: number) => void; setCursor: (h: number) => void;
  setTerrain: (t: Terrain) => void; setDays: (d: number) => void; look: (p: CameraPreset) => void; setPlaying: (p: boolean) => void; setEq: (e: Equipment) => void;
}
interface Step { title: { es: string; en: string }; body: { es: string; en: string }; apply: (c: TourCtx) => void }

/** Primera hora de la estadía en que se cumple una condición (para encuadrar cada paso en un momento elocuente). */
function firstHour(c: TourCtx, site: string, date: string, dur: number, pred: (sun: number, earth: number) => boolean) {
  if (!c.e) return 0; const m = metrics(c.e, site, dateToHour(date), dur, 'lola');
  for (let i = 0; i < dur; i++) if (pred(m.sun[i], m.earth[i])) return i; return 0;
}

export const TOUR: Step[] = [
  {
    title: { es: 'Estás en el polo sur de la Luna', en: 'You are at the Moon’s south pole' },
    body: {
      es: 'Esto es el terreno real medido por la sonda LRO de la NASA alrededor de Malapert Massif, una de las 9 regiones donde podría aterrizar Artemis III. El módulo del centro sos vos. Arrastrá para mirar alrededor.',
      en: 'This is the real terrain measured by NASA’s LRO spacecraft around Malapert Massif, one of the 9 regions where Artemis III could land. The lander in the middle is you. Drag to look around.',
    },
    apply: c => { c.setTerrain('lola'); c.setDays(7); const d = '2028-10-07'; c.setScen([{ site: 'malapert', date: d }, { site: 'degerlache-2', date: d }]); c.setActive(0); c.setCursor(firstHour(c, 'malapert', d, 168, s => !!s)); c.setPlaying(false); c.look('aerial'); },
  },
  {
    title: { es: 'El Sol nunca sube', en: 'The Sun never climbs' },
    body: {
      es: 'En el polo, el Sol da una vuelta completa al horizonte cada 29,5 días sin subir más de unos pocos grados. Por eso las montañas proyectan sombras de kilómetros y una cresta puede apagar los paneles durante días. Mirá cómo se mueve con ▶.',
      en: 'At the pole the Sun circles the whole horizon every 29.5 days and never climbs more than a few degrees. That is why mountains cast shadows kilometers long and a ridge can switch the panels off for days. Watch it move with ▶.',
    },
    apply: c => { c.look('sun'); c.setPlaying(true); },
  },
  {
    title: { es: 'Las montañas deciden', en: 'The mountains decide' },
    body: {
      es: 'Ahora el horizonte es plano, como si no hubiera relieve. Mirá arriba cuántas horas de luz y de contacto «aparecen». Esa diferencia es la razón por la que la elección del sitio importa tanto. En el siguiente paso volvemos al relieve real.',
      en: 'Now the horizon is flat, as if there were no terrain. Look at how many hours of light and contact “appear” at the top. That difference is why choosing the site matters so much. The next step brings back the real terrain.',
    },
    apply: c => { c.setPlaying(false); c.setTerrain('flat'); c.look('sun'); },
  },
  {
    title: { es: 'La Tierra se balancea', en: 'Earth wobbles' },
    body: {
      es: 'Desde la Luna, la Tierra no sale ni se pone: queda casi fija en el cielo, pero se balancea unos 7° arriba y abajo (libración). Desde el polo está muy baja, así que un sitio orientado hacia la Tierra, como Malapert, mantiene el contacto por radio y otros lo pierden durante días.',
      en: 'From the Moon, Earth does not rise or set: it stays almost fixed in the sky but wobbles about 7° up and down (libration). From the pole it sits very low, so a site facing Earth, like Malapert, keeps radio contact while others lose it for days.',
    },
    apply: c => { c.setTerrain('lola'); c.setPlaying(false); c.look('earth'); },
  },
  {
    title: { es: 'Sobrevivir a la noche', en: 'Surviving the night' },
    body: {
      es: 'Lo que pone en riesgo a un módulo no es el promedio de luz sino la noche continua más larga: la batería tiene que aguantarla sola. Abajo, en «Energía del módulo», probá una batería más chica y fijate si el módulo sobrevive en cada sitio.',
      en: 'What endangers a lander is not average light but the longest continuous night: the battery must carry it alone. Below, in “Lander power”, try a smaller battery and see whether the lander survives at each site.',
    },
    apply: c => { c.setEq({ ...DEFAULT_EQUIPMENT, batteryWh: 3000 }); c.setActive(1); c.look('sun'); document.querySelector('.duo')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
  },
  {
    title: { es: 'Ahora decidí vos', en: 'Now you decide' },
    body: {
      es: 'Cambiá el sitio o la fecha de los escenarios y la barra de arriba te dice cuánto ganás o perdés. El calendario muestra todo 2028: las celdas más intensas son las mejores ventanas de aterrizaje.',
      en: 'Change the site or date of the scenarios and the bar at the top tells you what you gain or lose. The calendar shows all of 2028: the strongest cells are the best landing windows.',
    },
    apply: c => { c.setEq(DEFAULT_EQUIPMENT); c.setActive(1); document.querySelector('.cal')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
  },
];
