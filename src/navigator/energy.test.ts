import { describe, expect, it } from 'vitest';
import { runEnergy, DEFAULT_EQUIPMENT } from './energy';

describe('runEnergy', () => {
  it('survives with constant sunlight', () => {
    const n = 48; const r = runEnergy(new Uint8Array(n).fill(1), new Uint8Array(n).fill(1), DEFAULT_EQUIPMENT);
    expect(r.survived).toBe(true); expect(r.minPct).toBeGreaterThan(80);
  });
  it('dies in a long night without hibernation', () => {
    const n = 100; const r = runEnergy(new Uint8Array(n), new Uint8Array(n), { ...DEFAULT_EQUIPMENT, autoHibernate: false });
    expect(r.survived).toBe(false); expect(r.diedAt).toBe(Math.ceil((DEFAULT_EQUIPMENT.batteryWh * 0.9) / DEFAULT_EQUIPMENT.loadW) - 1);
  });
  it('hibernation extends survival', () => {
    const n = 100; const night = new Uint8Array(n);
    const a = runEnergy(night, night, { ...DEFAULT_EQUIPMENT, autoHibernate: true }), b = runEnergy(night, night, { ...DEFAULT_EQUIPMENT, autoHibernate: false });
    expect(a.diedAt).toBeGreaterThan(b.diedAt + 10); expect(a.hibernatedH).toBeGreaterThan(0);
  });
  it('only sends data with Earth in view', () => {
    const n = 24; const r = runEnergy(new Uint8Array(n).fill(1), new Uint8Array(n), DEFAULT_EQUIPMENT);
    expect(r.sentMB).toBe(0); expect(r.dataMB).toBe(960);
  });
});
