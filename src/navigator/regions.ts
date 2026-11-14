// Puntos representativos APROXIMADOS de las 9 regiones candidatas de Artemis III (NASA, agosto 2024).
// Deben coincidir con scripts/regions.mjs (fuente de las efemérides descargadas).
export interface Region { id: string; name: string; lat: number; lon: number }
export const REGIONS: Region[] = [
  { id: 'cabeus-b', name: 'Peak near Cabeus B', lat: -84.48, lon: -49.6 },
  { id: 'haworth', name: 'Haworth', lat: -86.8, lon: -16.0 },
  { id: 'malapert', name: 'Malapert Massif', lat: -85.99, lon: 2.9 },
  { id: 'mouton-plateau', name: 'Mons Mouton Plateau', lat: -85.3, lon: 31.4 },
  { id: 'mouton', name: 'Mons Mouton', lat: -84.6, lon: 39.5 },
  { id: 'nobile-1', name: 'Nobile Rim 1', lat: -84.75, lon: 37.0 },
  { id: 'nobile-2', name: 'Nobile Rim 2', lat: -83.6, lon: 58.6 },
  { id: 'degerlache-2', name: 'de Gerlache Rim 2', lat: -88.6, lon: -64.0 },
  { id: 'slater', name: 'Slater Plain', lat: -88.2, lon: -116.0 },
];
export const COLORS = ['#f2a93b', '#5aa9ff', '#d77bff', '#4fd1a5'];
