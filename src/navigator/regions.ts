// 9 regiones candidatas de Artemis III (NASA, oct-2024). Polígonos oficiales: USGS (McClernan 2024, doi:10.5066/P1MEQ6UK).
// lat/lon = punto representativo: el punto de una grilla de 1 km dentro de la región con más horas de Sol y Tierra
// a la vez en 2028 según el horizonte LRO/LOLA (scripts/lola_horizon.py). centroid = centro geométrico del polígono.
export interface Region { id: string; name: string; lat: number; lon: number; elevationM: number; areaKm2: number; centroid: [number, number]; polygon: [number, number][] }
export const REGIONS: Region[] = [
  { id: 'cabeus-b', name: 'Peak Near Cabeus B', lat: -83.5736, lon: -68.4976, elevationM: 4579, areaKm2: 400, centroid: [-83.6375, -68.7495], polygon: [[-83.2095, -67.1667], [-83.4364, -72.4735], [-84.06, -70.5595], [-83.81, -64.7999], [-83.2095, -67.1667]] },
  { id: 'haworth', name: 'Haworth', lat: -86.2994, lon: -23.2991, elevationM: 2655, areaKm2: 888, centroid: [-86.7639, -22.777], polygon: [[-86.1124, -26.652], [-86.9578, -34.9818], [-87.3935, -16.9908], [-86.4428, -12.3618], [-86.1124, -26.652]] },
  { id: 'malapert', name: 'Malapert Massif', lat: -85.9592, lon: 2.1038, elevationM: 5124, areaKm2: 441, centroid: [-85.9948, -0.2358], polygon: [[-85.6339, -4.7636], [-86.3228, -5.6595], [-86.3259, 5.1479], [-85.6366, 4.3323], [-85.6339, -4.7636]] },
  { id: 'mouton-plateau', name: 'Mons Mouton Plateau', lat: -84.5116, lon: 38.6626, elevationM: 6638, areaKm2: 4452, centroid: [-84.3347, 30.5923], polygon: [[-83.9502, 15.4942], [-85.7556, 22.3928], [-84.2893, 46.612], [-82.8467, 35.4425], [-83.9502, 15.4942]] },
  { id: 'mouton', name: 'Mons Mouton', lat: -85.3759, lon: 31.5941, elevationM: 6346, areaKm2: 256, centroid: [-85.4266, 31.7428], polygon: [[-85.3271, 27.288], [-85.7883, 30.5792], [-85.4974, 36.3666], [-85.0633, 32.7352], [-85.3271, 27.288]] },
  { id: 'nobile-1', name: 'Nobile Rim 1', lat: -85.2089, lon: 36.0237, elevationM: 6733, areaKm2: 400, centroid: [-85.4364, 37.347], polygon: [[-85.3514, 31.6437], [-85.8975, 36.48], [-85.4748, 43.2066], [-84.9746, 38.0547], [-85.3514, 31.6437]] },
  { id: 'nobile-2', name: 'Nobile Rim 2', lat: -84.0993, lon: 57.7737, elevationM: 1537, areaKm2: 400, centroid: [-83.9541, 58.8215], polygon: [[-84.048, 54.4618], [-84.4047, 59.9616], [-83.8264, 63.0242], [-83.5016, 57.8402], [-84.048, 54.4618]] },
  { id: 'degerlache-2', name: 'de Gerlache Rim 2', lat: -88.4691, lon: -67.8548, elevationM: 1569, areaKm2: 400, centroid: [-88.23, -64.6284], polygon: [[-87.7853, -60.5725], [-88.0239, -77.4712], [-88.66, -71.3421], [-88.3279, -49.3987], [-87.7853, -60.5725]] },
  { id: 'slater', name: 'Slater Plain', lat: -87.273, lon: 127.6295, elevationM: 528, areaKm2: 400, centroid: [-87.1637, 125.5377], polygon: [[-87.6222, 123.6906], [-87.2023, 134.9976], [-86.7032, 126.8696], [-87.0511, 116.5672], [-87.6222, 123.6906]] },
];
export const COLORS = ['#f2a93b', '#5aa9ff', '#d77bff', '#4fd1a5'];
