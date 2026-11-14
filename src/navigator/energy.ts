/** Modelo energético de un módulo en el polo sur, alimentado por la visibilidad real (LOLA + Horizons).
 *  Paneles verticales que siguen al Sol en azimut (en el polo el Sol está siempre a pocos grados de altura).
 *  Tres estados por hora:
 *   - operando:    consume la carga nominal, produce datos y los envía si ve la Tierra
 *   - hibernando:  sin Sol y con la batería bajo el 25 %, apaga todo salvo los calefactores de supervivencia
 *   - sin energía: batería agotada; queda apagado hasta que el Sol recarga el 15 % y se reinicia
 *  Unidades: W y Wh, paso de 1 h. Es un modelo didáctico para comparar sitios, no para dimensionar hardware. */
export interface Equipment { panelW: number; batteryWh: number; loadW: number; survivalW: number; autoHibernate: boolean }
export const DEFAULT_EQUIPMENT: Equipment = { panelW: 600, batteryWh: 6000, loadW: 250, survivalW: 80, autoHibernate: true };

export const ON = 0, HIB = 1, OFF = 2;
export type EventKind = 'shadow' | 'sunrise' | 'hibernate' | 'wake' | 'off' | 'reboot';
export interface EnergyEvent { h: number; kind: EventKind; pct: number }
export interface EnergyRun {
  battery: Float32Array; state: Uint8Array; events: EnergyEvent[];
  survived: boolean; offAt: number; offH: number; hibernatedH: number; minPct: number; dataMB: number; sentMB: number;
}

const WAKE_PCT = 0.4, REBOOT_PCT = 0.15, HIB_PCT = 0.25;

export function runEnergy(sun: Uint8Array, earth: Uint8Array, eq: Equipment): EnergyRun {
  const n = sun.length; const battery = new Float32Array(n); const state = new Uint8Array(n); const events: EnergyEvent[] = [];
  let b = eq.batteryWh * 0.9, st = ON, data = 0, sent = 0, buffer = 0, offAt = -1, offH = 0, hibH = 0, minPct = 100;
  const log = (h: number, kind: EventKind) => events.push({ h, kind, pct: Math.round((b / eq.batteryWh) * 100) });
  for (let i = 0; i < n; i++) {
    if (i > 0 && sun[i] !== sun[i - 1]) log(i, sun[i] ? 'sunrise' : 'shadow');
    // transiciones de estado antes de consumir la hora
    if (st === ON && eq.autoHibernate && !sun[i] && b < eq.batteryWh * HIB_PCT) { st = HIB; log(i, 'hibernate'); }
    else if (st === HIB && (sun[i] || !eq.autoHibernate) && b >= eq.batteryWh * (sun[i] ? HIB_PCT : WAKE_PCT)) { st = ON; log(i, 'wake'); }
    else if (st === OFF && b >= eq.batteryWh * REBOOT_PCT) { st = ON; log(i, 'reboot'); }
    const load = st === ON ? eq.loadW : st === HIB ? eq.survivalW : 0;
    b = Math.min(eq.batteryWh, b + (sun[i] ? eq.panelW : 0) - load);
    if (b <= 0 && st !== OFF) { b = 0; st = OFF; if (offAt < 0) offAt = i; log(i, 'off'); }
    b = Math.max(0, b);
    if (st === ON) { data += 40; buffer += 40; if (earth[i]) { const tx = Math.min(buffer, 200); buffer -= tx; sent += tx; } }
    battery[i] = b / eq.batteryWh; state[i] = st; hibH += st === HIB ? 1 : 0; offH += st === OFF ? 1 : 0; minPct = Math.min(minPct, battery[i] * 100);
  }
  return { battery, state, events, survived: offAt < 0, offAt, offH, hibernatedH: hibH, minPct, dataMB: data, sentMB: sent };
}
