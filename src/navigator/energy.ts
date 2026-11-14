/** Modelo energético simple de un módulo en el polo sur, alimentado por la visibilidad real (LOLA + Horizons).
 *  Paneles verticales que siguen al Sol en azimut (el Sol está siempre a pocos grados de altura en el polo).
 *  Carga: operación normal vs hibernación (solo calefactores de supervivencia). Unidades: W y Wh, paso 1 h. */
export interface Equipment { panelW: number; batteryWh: number; loadW: number; survivalW: number; autoHibernate: boolean }
export const DEFAULT_EQUIPMENT: Equipment = { panelW: 600, batteryWh: 6000, loadW: 250, survivalW: 80, autoHibernate: true };
export interface EnergyRun { battery: Float32Array; hibernating: Uint8Array; survived: boolean; diedAt: number; minPct: number; dataMB: number; sentMB: number; hibernatedH: number }

export function runEnergy(sun: Uint8Array, earth: Uint8Array, eq: Equipment): EnergyRun {
  const n = sun.length; const battery = new Float32Array(n); const hib = new Uint8Array(n);
  let b = eq.batteryWh * 0.9, data = 0, sent = 0, buffer = 0, diedAt = -1, minPct = 100, hibH = 0;
  for (let i = 0; i < n; i++) {
    const h = eq.autoHibernate && b < eq.batteryWh * 0.25 && !sun[i];
    const load = h ? eq.survivalW : eq.loadW;
    b = Math.min(eq.batteryWh, b + (sun[i] ? eq.panelW : 0) - load);
    if (!h) { data += 40; buffer += 40; }          // 40 MB/h de ciencia en operación
    if (earth[i] && !h) { const tx = Math.min(buffer, 200); buffer -= tx; sent += tx; } // enlace directo ~200 MB/h
    if (b <= 0 && diedAt < 0) { diedAt = i; b = 0; }
    if (diedAt >= 0) b = 0;
    battery[i] = b / eq.batteryWh; hib[i] = h ? 1 : 0; hibH += h ? 1 : 0; minPct = Math.min(minPct, (b / eq.batteryWh) * 100);
  }
  return { battery, hibernating: hib, survived: diedAt < 0, diedAt, minPct, dataMB: data, sentMB: sent, hibernatedH: hibH };
}
