import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

/* Suelo: malla LOLA (100 m) + parche cercano de 500 m con microrrelieve, cráteres y piedras.
   El parche se interpola con la MISMA triangulación que PlaneGeometry para quedar cosido a la malla. */

let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

/** Textura de regolito procedural (grano + manchas + micro-cráteres), en escala de grises para multiplicar. */
function regolithTexture(repeat: number) {
  const N = 512, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d')!;
  seed = 7; const img = g.createImageData(N, N);
  for (let i = 0; i < N * N; i++) { const v = 196 + (rnd() - 0.5) * 46; img.data[i * 4] = v; img.data[i * 4 + 1] = v * 0.985; img.data[i * 4 + 2] = v * 0.96; img.data[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '40,38,35' : '255,252,245'},${0.03 + rnd() * 0.05})`; g.beginPath(); g.arc(rnd() * N, rnd() * N, 6 + rnd() * 40, 0, 7); g.fill(); }
  for (let i = 0; i < 70; i++) { const x = rnd() * N, y = rnd() * N, r = 2 + rnd() * 9; g.strokeStyle = 'rgba(255,250,240,.22)'; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); g.fillStyle = 'rgba(20,18,16,.18)'; g.beginPath(); g.arc(x + r * 0.2, y + r * 0.2, r * 0.75, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

/** Altura de la malla LOLA en (x, z) usando la triangulación exacta de PlaneGeometry. */
export function terrainHeight(h: Int16Array, size: number, step: number, x: number, z: number) {
  const half = ((size - 1) * step) / 2; const fx = (x + half) / step, fy = (z + half) / step;
  const ix = Math.min(size - 2, Math.max(0, Math.floor(fx))), iy = Math.min(size - 2, Math.max(0, Math.floor(fy))); const u = fx - ix, v = fy - iy;
  const A = h[iy * size + ix], B = h[(iy + 1) * size + ix], C = h[(iy + 1) * size + ix + 1], D = h[iy * size + ix + 1];
  return u + v <= 1 ? A + u * (D - A) + v * (B - A) : C + (1 - u) * (B - C) + (1 - v) * (D - C);
}

export function Terrain({ heights, size, step }: { heights: Int16Array; size: number; step: number }) {
  const { geo, map } = useMemo(() => {
    const w = (size - 1) * step; const g = new THREE.PlaneGeometry(w, w, size - 1, size - 1); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setY(i, heights[i]);
    g.computeVertexNormals();
    const n = g.attributes.normal as THREE.BufferAttribute; const col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const k = 0.62 + 0.38 * Math.pow(n.getY(i), 4); col[i * 3] = 0.5 * k; col[i * 3 + 1] = 0.48 * k; col[i * 3 + 2] = 0.45 * k; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return { geo: g, map: regolithTexture(160) };
  }, [heights, size, step]);
  useEffect(() => () => { geo.dispose(); map.dispose(); }, [geo, map]);
  return <mesh geometry={geo} castShadow receiveShadow><meshStandardMaterial vertexColors map={map} roughness={1} metalness={0} /></mesh>;
}

/** Plano liso para el modo «sin relieve». */
export function FlatGround() {
  const map = useMemo(() => regolithTexture(400), []);
  return <mesh rotation-x={-Math.PI / 2} receiveShadow><circleGeometry args={[24000, 96]} /><meshStandardMaterial color="#7a756d" map={map} roughness={1} /></mesh>;
}

const PATCH_R = 250, PATCH_RES = 2;
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Parche cercano: microrrelieve y cráteres de 1–15 m alrededor del módulo, y piedras con sombra. */
export function NearField({ heights, size, step, flat }: { heights: Int16Array | null; size: number; step: number; flat: boolean }) {
  const { geo, map, rocks } = useMemo(() => {
    seed = 31;
    const craters = Array.from({ length: 46 }, () => { const r = 1 + Math.pow(rnd(), 2.5) * 14; const a = rnd() * 6.283, d = 12 + rnd() * (PATCH_R - 30); return { x: Math.cos(a) * d, z: Math.sin(a) * d, r }; });
    const base = (x: number, z: number) => (flat || !heights ? 0 : terrainHeight(heights, size, step, x, z));
    const relief = (x: number, z: number) => {
      const d = Math.hypot(x, z); const fade = 1 - smooth(PATCH_R * 0.65, PATCH_R, d); const pad = 1 - smooth(4, 9, d) * 0; // zona de aterrizaje alisada
      let b = 0.35 * Math.sin(x * 0.11 + Math.sin(z * 0.07) * 2) * Math.cos(z * 0.09) + 0.18 * Math.sin(x * 0.31 + z * 0.23) + 0.08 * Math.sin(x * 0.9 - z * 0.7);
      for (const c of craters) { const q = Math.hypot(x - c.x, z - c.z) / c.r; if (q < 1.6) b += c.r * 0.22 * (q < 1 ? q * q - 1 : 0.35 * Math.pow(1 - (q - 1) / 0.6, 2)); }
      const landing = smooth(3, 10, d); // el módulo apoya en suelo nivelado
      return (0.9 + b * landing) * fade * pad;
    };
    const n = Math.round((PATCH_R * 2) / PATCH_RES); const g = new THREE.PlaneGeometry(PATCH_R * 2, PATCH_R * 2, n, n); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute; const keep: number[] = [];
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, base(x, z) + Math.max(0.04, relief(x, z) + 0.04)); }
    // recorta las esquinas: sólo triángulos dentro del círculo
    const idx = g.index!; for (let i = 0; i < idx.count; i += 3) { const a = idx.getX(i); if (Math.hypot(p.getX(a), p.getZ(a)) < PATCH_R) keep.push(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2)); }
    g.setIndex(keep); g.computeVertexNormals();
    const rockList = Array.from({ length: 420 }, () => { const a = rnd() * 6.283, d = 6 + Math.pow(rnd(), 0.8) * (PATCH_R - 40); const x = Math.cos(a) * d, z = Math.sin(a) * d; const s = 0.08 + Math.pow(rnd(), 3) * 1.1; return { x, z, y: base(x, z) + relief(x, z) + 0.04 + s * 0.3, s, ry: rnd() * 6.28, rx: rnd() * 0.6 }; });
    return { geo: g, map: regolithTexture(PATCH_R / 6), rocks: rockList };
  }, [heights, size, step, flat]);
  useEffect(() => () => { geo.dispose(); map.dispose(); }, [geo, map]);
  const rockGeo = useMemo(() => { const g = new THREE.DodecahedronGeometry(1, 0); g.scale(1, 0.62, 0.85); return g; }, []);
  const inst = useMemo(() => {
    const m = new THREE.InstancedMesh(rockGeo, new THREE.MeshStandardMaterial({ color: '#6f6a62', roughness: 0.95, flatShading: true }), rocks.length);
    const o = new THREE.Object3D(); rocks.forEach((r, i) => { o.position.set(r.x, r.y, r.z); o.rotation.set(r.rx, r.ry, 0); o.scale.setScalar(r.s); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
    m.castShadow = true; m.receiveShadow = true; return m;
  }, [rocks, rockGeo]);
  return <>
    <mesh geometry={geo} receiveShadow castShadow><meshStandardMaterial color="#8a847b" map={map} roughness={1} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} /></mesh>
    <primitive object={inst} />
  </>;
}

/** Altura del suelo bajo el módulo (centro del parche). */
export const LANDER_BASE = 0.94;
