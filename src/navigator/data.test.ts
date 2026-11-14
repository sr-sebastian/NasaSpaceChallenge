import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dateToHour, hourToDate } from './data';
import { REGIONS } from './regions';

const eph = JSON.parse(readFileSync('public/data/ephem-2028.json', 'utf8'));
const hz = JSON.parse(readFileSync('public/data/horizons.json', 'utf8'));

describe('data files', () => {
  it('cover the 9 Artemis III regions with a full hourly year', () => {
    expect(eph.sites.map((s: { id: string }) => s.id).sort()).toEqual(REGIONS.map(r => r.id).sort());
    for (const s of eph.sites) { expect(s.sun.el).toHaveLength(8784); expect(s.earth.az).toHaveLength(8784); }
  });
  it('have a 720-step LOLA horizon mask per site within plausible bounds', () => {
    for (const s of hz.sites) { expect(s.mask).toHaveLength(720); expect(Math.max(...s.mask) / 100).toBeLessThan(25); expect(Math.min(...s.mask) / 100).toBeGreaterThan(-10); }
  });
  it('keep each representative point inside the south polar cap (<7° from pole)', () => {
    for (const r of REGIONS) expect(r.lat).toBeLessThan(-83);
  });
  it('Malapert sees Earth whenever it is above the LOLA horizon (sanity: >95% of 2028)', () => {
    const s = eph.sites.find((x: { id: string }) => x.id === 'malapert'); const m = hz.sites.find((x: { id: string }) => x.id === 'malapert').mask;
    let v = 0; for (let i = 0; i < 8784; i++) v += s.earth.el[i] > m[Math.round(s.earth.az[i] / 5) % 720] ? 1 : 0;
    expect(v / 8784).toBeGreaterThan(0.95);
  });
});

describe('dates', () => {
  it('round-trip UTC dates', () => { expect(hourToDate(dateToHour('2028-09-01'))).toBe('2028-09-01'); expect(dateToHour('2028-01-01')).toBe(0); });
});
