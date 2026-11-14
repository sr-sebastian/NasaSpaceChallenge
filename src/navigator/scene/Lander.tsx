import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

/* Módulo robótico polar genérico (~4 m de alto): cuerpo octogonal con aislamiento térmico dorado (MLI),
   patas con amortiguador, tobera, paneles solares VERTICALES que siguen al Sol en azimut (en el polo el Sol
   está siempre bajo) y antena de alta ganancia que apunta a la Tierra. Diseño propio, no replica ninguna nave. */

function mliTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')!;
  const gr = g.createLinearGradient(0, 0, 256, 256); gr.addColorStop(0, '#b8862f'); gr.addColorStop(0.5, '#d9ab4c'); gr.addColorStop(1, '#a8752a'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  let s = 3; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(${r() < 0.5 ? '255,236,180' : '90,60,20'},${0.15 + r() * 0.25})`; g.lineWidth = 0.6 + r() * 1.6; g.beginPath(); const x = r() * 256, y = r() * 256; g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 70, y + (r() - 0.5) * 70); g.stroke(); }
  g.strokeStyle = 'rgba(80,55,20,.5)'; g.lineWidth = 2; for (let x = 0; x <= 256; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

function cellTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 384; const g = c.getContext('2d')!;
  g.fillStyle = '#0d1b33'; g.fillRect(0, 0, 256, 384);
  for (let y = 0; y < 12; y++) for (let x = 0; x < 8; x++) { const gr = g.createLinearGradient(x * 32, y * 32, x * 32 + 32, y * 32 + 32); gr.addColorStop(0, '#1b3a6b'); gr.addColorStop(1, '#0f2448'); g.fillStyle = gr; g.fillRect(x * 32 + 2, y * 32 + 2, 28, 28); }
  g.strokeStyle = 'rgba(190,200,215,.35)'; g.lineWidth = 1; for (let x = 0; x <= 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 384); g.stroke(); }
  g.strokeStyle = '#b9c0c9'; g.lineWidth = 6; g.strokeRect(0, 0, 256, 384);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function dishGeometry() {
  const pts: THREE.Vector2[] = []; for (let i = 0; i <= 12; i++) { const r = (i / 12) * 0.55; pts.push(new THREE.Vector2(r, (r * r) / 0.9)); }
  const g = new THREE.LatheGeometry(pts, 32); g.rotateX(Math.PI / 2); return g; // abre hacia +z
}

export function Lander({ base, sunDir, earthDir, charging, linked }: { base: number; sunDir: THREE.Vector3; earthDir: THREE.Vector3; charging: boolean; linked: boolean }) {
  const tex = useMemo(() => ({ mli: mliTexture(), cells: cellTexture(), dish: dishGeometry() }), []);
  const wings = useRef<THREE.Group>(null), hga = useRef<THREE.Group>(null), led = useRef<THREE.MeshStandardMaterial>(null);
  const sunH = useMemo(() => new THREE.Vector3(sunDir.x, 0, sunDir.z).normalize(), [sunDir]);
  useFrame(({ clock }, dt) => {
    // los paneles giran suavemente hacia el azimut del Sol; la antena apunta a la Tierra
    if (wings.current) { const target = Math.atan2(sunH.x, sunH.z); const cur = wings.current.rotation.y; let d = target - cur; d = Math.atan2(Math.sin(d), Math.cos(d)); wings.current.rotation.y = cur + d * Math.min(1, dt * 3); }
    if (hga.current) { const p = hga.current.getWorldPosition(new THREE.Vector3()); hga.current.lookAt(p.add(earthDir)); }
    if (led.current) led.current.emissiveIntensity = linked ? 1.5 + Math.sin(clock.elapsedTime * 4) * 1.2 : 0.2;
  });
  const metal = <meshStandardMaterial color="#9aa0a6" metalness={0.75} roughness={0.38} />;
  const legs = [0, 1, 2, 3].map(i => (i * Math.PI) / 2 + Math.PI / 4);
  return (
    <group position={[0, base, 0]}>
      {/* patas: puntal principal + amortiguador + pie */}
      {legs.map((a, i) => { const fx = Math.cos(a) * 2.5, fz = Math.sin(a) * 2.5; const top = new THREE.Vector3(Math.cos(a) * 1.05, 1.5, Math.sin(a) * 1.05); const foot = new THREE.Vector3(fx, 0.12, fz);
        const mid = top.clone().add(foot).multiplyScalar(0.5); const len = top.distanceTo(foot); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(foot).normalize());
        return <group key={i}>
          <mesh position={mid} quaternion={q} castShadow><cylinderGeometry args={[0.06, 0.08, len, 8]} />{metal}</mesh>
          <mesh position={[Math.cos(a) * 1.7, 0.8, Math.sin(a) * 1.7]} quaternion={q} castShadow><cylinderGeometry args={[0.11, 0.11, 0.7, 10]} /><meshStandardMaterial color="#d6d8da" metalness={0.6} roughness={0.3} /></mesh>
          <mesh position={[fx, 0.06, fz]} castShadow><cylinderGeometry args={[0.32, 0.4, 0.1, 16]} />{metal}</mesh>
        </group>; })}
      {/* tobera */}
      <mesh position={[0, 0.85, 0]} castShadow><cylinderGeometry args={[0.18, 0.42, 0.55, 20, 1, true]} /><meshStandardMaterial color="#3a3d42" metalness={0.8} roughness={0.35} side={THREE.DoubleSide} /></mesh>
      {/* cuerpo con MLI dorado (rugoso: sin brillo especular que se queme) */}
      <mesh position={[0, 1.85, 0]} castShadow receiveShadow><cylinderGeometry args={[1.25, 1.35, 1.6, 8]} /><meshStandardMaterial map={tex.mli} metalness={0.35} roughness={0.62} /></mesh>
      <mesh position={[0, 2.7, 0]} castShadow><cylinderGeometry args={[1.32, 1.32, 0.1, 8]} /><meshStandardMaterial color="#d9dadb" metalness={0.2} roughness={0.7} /></mesh>
      {/* radiador blanco en una cara */}
      <mesh position={[0, 1.85, 1.28]}><planeGeometry args={[0.9, 1.1]} /><meshStandardMaterial color="#eef0f2" roughness={0.5} /></mesh>
      {/* mástil + alas solares verticales que giran hacia el Sol */}
      <mesh position={[0, 3.3, 0]} castShadow><cylinderGeometry args={[0.07, 0.07, 1.2, 10]} />{metal}</mesh>
      <group ref={wings} position={[0, 3.4, 0]}>
        <mesh castShadow><boxGeometry args={[4.6, 0.06, 0.06]} />{metal}</mesh>
        {[-1, 1].map(s => <mesh key={s} position={[s * 1.55, 0.25, 0.04]} castShadow><planeGeometry args={[1.3, 1.95]} /><meshStandardMaterial map={tex.cells} metalness={0.35} roughness={0.28} emissive="#1d3e78" emissiveIntensity={charging ? 0.25 : 0} side={THREE.DoubleSide} /></mesh>)}
      </group>
      {/* antena de alta ganancia apuntando a la Tierra */}
      <mesh position={[0.75, 3.0, -0.6]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />{metal}</mesh>
      <group ref={hga} position={[0.75, 3.32, -0.6]}>
        <mesh geometry={tex.dish} castShadow><meshStandardMaterial color="#e9ebee" metalness={0.3} roughness={0.45} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, 0, 0.28]}><cylinderGeometry args={[0.02, 0.02, 0.56, 6]} /><meshStandardMaterial color="#888" /></mesh>
      </group>
      {/* luz de estado: parpadea cuando hay enlace con la Tierra */}
      <mesh position={[0, 2.78, 1.15]}><sphereGeometry args={[0.07, 12, 8]} /><meshStandardMaterial ref={led} color="#103a20" emissive="#5dff9c" emissiveIntensity={0.2} toneMapped={false} /></mesh>
    </group>
  );
}
