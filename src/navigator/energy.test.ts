import { describe, expect, it } from 'vitest';
import { runEnergy, DEFAULT_EQUIPMENT, HIB, OFF, ON } from './energy';

const ones = (n: number) => new Uint8Array(n).fill(1);
const zeros = (n: number) => new Uint8Array(n);

describe('runEnergy', () => {
  it('stays operating with constant sunlight', () => {
    const r = runEnergy(ones(48), ones(48), DEFAULT_EQUIPMENT);
    expect(r.survived).toBe(true); expect(r.minPct).toBeGreaterThan(80); expect([...r.state].every(s => s === ON)).toBe(true);
  });
  it('runs out in a long night without hibernation', () => {
    const r = runEnergy(zeros(100), zeros(100), { ...DEFAULT_EQUIPMENT, autoHibernate: false });
    expect(r.survived).toBe(false); expect(r.offAt).toBe(Math.ceil((DEFAULT_EQUIPMENT.batteryWh * 0.9) / DEFAULT_EQUIPMENT.loadW) - 1);
    expect(r.events.some(e => e.kind === 'off')).toBe(true);
  });
  it('hibernation extends survival and is logged', () => {
    const a = runEnergy(zeros(100), zeros(100), DEFAULT_EQUIPMENT), b = runEnergy(zeros(100), zeros(100), { ...DEFAULT_EQUIPMENT, autoHibernate: false });
    expect(a.offAt).toBeGreaterThan(b.offAt + 10); expect(a.hibernatedH).toBeGreaterThan(0);
    expect(a.events.find(e => e.kind === 'hibernate')?.pct).toBeLessThan(25); expect(a.state.includes(HIB)).toBe(true);
  });
  it('reboots when the Sun returns after running out', () => {
    const sun = new Uint8Array(200); sun.fill(1, 120); const r = runEnergy(sun, zeros(200), DEFAULT_EQUIPMENT);
    expect(r.survived).toBe(false); expect(r.state.includes(OFF)).toBe(true); expect(r.state[199]).toBe(ON);
    expect(r.events.map(e => e.kind)).toContain('reboot');
  });
  it('only sends data with Earth in view', () => {
    const r = runEnergy(ones(24), zeros(24), DEFAULT_EQUIPMENT);
    expect(r.sentMB).toBe(0); expect(r.dataMB).toBe(960);
  });
});
