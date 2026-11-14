import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Stars } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef } from 'react';
import type React from 'react';

import * as THREE from 'three';
type OrbitImpl = { target: THREE.Vector3; update: () => void };

/* Marco local del sitio: x = este, y = arriba, z = sur (el norte es −z). Unidades: metros. */
export const dirFromAzEl = (az: number, el: number) => {
  const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el);
  return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
};

export interface Body { az: number; el: number; horizon: number }
export type CameraPreset = 'sun' | 'earth' | 'aerial' | 'free';
export interface SceneLabels { sun: string; earth: string; lander: string; above: (d: string) => string; hidden: string; link: string; noLink: string; light: string; dark: string }

const SIZE_EXAG = 3;               // Sol y Tierra dibujados 3 veces más grandes que su tamaño angular real
const RING_R = 30000, SUN_R = 60000, EARTH_R = 50000;

function Terrain({ heights, size, step }: { heights: Int16Array; size: number; step: number }) {
  const geo = useMemo(() => {
    const w = (size - 1) * step; const g = new THREE.PlaneGeometry(w, w, size - 1, size - 1); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setY(i, heights[i]);
    g.computeVertexNormals();
    // Color por pendiente: laderas empinadas más oscuras, planicies con regolito más claro
    const n = g.attributes.normal as THREE.BufferAttribute; const col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const k = 0.6 + 0.4 * Math.pow(n.getY(i), 3); col[i * 3] = 0.46 * k; col[i * 3 + 1] = 0.44 * k; col[i * 3 + 2] = 0.41 * k; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, [heights, size, step]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={1} metalness={0} /></mesh>;
}

/** Anillo lejano cuya silueta es exactamente la máscara de horizonte LOLA (hasta 250 km). */
function HorizonRing({ mask }: { mask: Int16Array }) {
  const geo = useMemo(() => {
    const n = mask.length; const pos: number[] = []; const idx: number[] = [];
    for (let i = 0; i <= n; i++) {
      const az = (i % n) * (360 / n); const el = mask[i % n] / 100; const d = dirFromAzEl(az, 0);
      const top = RING_R * Math.tan(THREE.MathUtils.degToRad(el));
      pos.push(d.x * RING_R, top, d.z * RING_R, d.x * RING_R * 1.02, -9000, d.z * RING_R * 1.02);
      if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }, [mask]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo}><meshStandardMaterial color="#4a4743" roughness={1} side={THREE.DoubleSide} /></mesh>;
}

function earthTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d')!;
  g.fillStyle = '#1d4f8f'; g.fillRect(0, 0, 512, 256);
  let s = 11; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  g.fillStyle = '#5f7f4a'; for (let i = 0; i < 26; i++) { g.beginPath(); g.ellipse(r() * 512, 50 + r() * 156, 14 + r() * 50, 8 + r() * 30, r() * 3, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,0.75)'; for (let i = 0; i < 70; i++) { g.beginPath(); g.ellipse(r() * 512, r() * 256, 10 + r() * 40, 2 + r() * 6, r() * 0.6, 0, 7); g.fill(); }
  g.fillStyle = '#f2f5f8'; g.fillRect(0, 0, 512, 18); g.fillRect(0, 238, 512, 18);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Tierra con fase real: iluminada desde la dirección del Sol aunque el Sol esté bajo el horizonte local. */
function Earth({ pos, sunDir }: { pos: THREE.Vector3; sunDir: THREE.Vector3 }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { map: { value: earthTexture() }, sunDir: { value: new THREE.Vector3() } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN; void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.0);} ',
    fragmentShader: 'uniform sampler2D map; uniform vec3 sunDir; varying vec2 vUv; varying vec3 vN; void main(){ vec3 c=texture2D(map,vUv).rgb; float l=max(dot(normalize(vN),normalize(sunDir)),0.0); float rim=pow(1.0-abs(vN.z),3.0); gl_FragColor=vec4(c*(0.04+1.6*l)+vec3(0.25,0.5,1.0)*rim*0.25*l,1.0);} ',
  }), []);
  useEffect(() => { mat.uniforms.sunDir.value.copy(sunDir); }, [mat, sunDir]);
  const r = EARTH_R * Math.tan(THREE.MathUtils.degToRad(0.95)) * SIZE_EXAG;
  return <mesh position={pos} material={mat}><sphereGeometry args={[r, 48, 24]} /></mesh>;
}

function Sun({ pos, frac }: { pos: THREE.Vector3; frac: number }) {
  const r = SUN_R * Math.tan(THREE.MathUtils.degToRad(0.2665)) * SIZE_EXAG;
  const glow = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,236,200,1)'); gr.addColorStop(0.2, 'rgba(255,200,120,0.55)'); gr.addColorStop(1, 'rgba(255,170,80,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
  }, []);
  return <group position={pos}>
    <mesh><sphereGeometry args={[r, 32, 16]} /><meshBasicMaterial color={new THREE.Color(6, 5.2, 4)} toneMapped={false} /></mesh>
    <sprite scale={[r * 10, r * 10, 1]}><spriteMaterial map={glow} transparent opacity={0.35 + 0.5 * frac} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
  </group>;
}

function Lander({ charging, linked }: { charging: boolean; linked: boolean }) {
  const dish = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => { if (dish.current) (dish.current.material as THREE.MeshStandardMaterial).emissiveIntensity = linked ? 0.6 + 0.4 * Math.sin(clock.elapsedTime * 3) : 0; });
  return <group position={[0, 1.6, 0]}>
    <mesh castShadow><cylinderGeometry args={[1.6, 2, 1.8, 8]} /><meshStandardMaterial color="#cfc8b6" metalness={0.6} roughness={0.35} /></mesh>
    <mesh position={[0, 1.15, 0]} castShadow><cylinderGeometry args={[1.1, 1.6, 0.5, 8]} /><meshStandardMaterial color="#d9a441" metalness={0.8} roughness={0.25} /></mesh>
    {[-1, 1].map(x => <mesh key={x} position={[x * 2.6, 2.4, 0]} castShadow><boxGeometry args={[0.12, 3.2, 2]} /><meshStandardMaterial color="#1a3550" emissive="#2a6aa0" emissiveIntensity={charging ? 0.5 : 0.02} metalness={0.4} roughness={0.3} /></mesh>)}
    {[-1, 1].map(x => <mesh key={'a' + x} position={[x * 1.9, 2.4, 0]}><boxGeometry args={[1.4, 0.08, 0.08]} /><meshStandardMaterial color="#888" /></mesh>)}
    <mesh position={[0, 3.2, 0]}><cylinderGeometry args={[0.06, 0.06, 2.4]} /><meshStandardMaterial color="#ddd" metalness={0.8} /></mesh>
    <mesh ref={dish} position={[0, 4.4, 0]} rotation={[0.9, 0, 0]}><sphereGeometry args={[0.55, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2.4]} /><meshStandardMaterial color="#e8eaec" emissive="#5aa9ff" side={THREE.DoubleSide} metalness={0.5} /></mesh>
    {[[-1.4, -1.4], [-1.4, 1.4], [1.4, -1.4], [1.4, 1.4]].map(([x, z], i) => <group key={i}>
      <mesh position={[x * 1.1, -0.9, z * 1.1]} rotation={[z * 0.25, 0, -x * 0.25]}><cylinderGeometry args={[0.07, 0.07, 1.6]} /><meshStandardMaterial color="#8e918f" metalness={0.7} /></mesh>
      <mesh position={[x * 1.3, -1.6, z * 1.3]}><cylinderGeometry args={[0.35, 0.4, 0.08, 12]} /><meshStandardMaterial color="#666" /></mesh></group>)}
  </group>;
}

function CameraRig({ preset, sunAz, earthAz, nonce }: { preset: CameraPreset; sunAz: number; earthAz: number; nonce: number }) {
  const { camera, controls } = useThree() as unknown as { camera: THREE.PerspectiveCamera; controls: OrbitImpl | null };
  useEffect(() => {
    if (!controls || preset === 'free') return;
    if (preset === 'aerial') { const d = dirFromAzEl(sunAz + 120, 0); camera.position.set(d.x * 11000, 7000, d.z * 11000); controls.target.set(0, -1200, 0); }
    else { const az = preset === 'sun' ? sunAz : earthAz; const d = dirFromAzEl(az, 0), side = dirFromAzEl(az + 90, 0); camera.position.set(-d.x * 30 + side.x * 14, 7, -d.z * 30 + side.z * 14); controls.target.set(d.x * 40, 9, d.z * 40); }
    controls.update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, nonce, controls]);
  return null;
}

/** Proyecta posiciones 3D a la pantalla en cada cuadro y mueve etiquetas DOM (sin re-render de React). */
function Projector({ targets }: { targets: { pos: THREE.Vector3; el: React.RefObject<HTMLDivElement | null> }[] }) {
  const { camera, size } = useThree(); const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    for (const t of targets) {
      const el = t.el.current; if (!el) continue;
      v.copy(t.pos).project(camera);
      const behind = v.z > 1; el.style.display = behind ? 'none' : '';
      el.style.transform = `translate(-50%,-50%) translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px)`;
    }
  });
  return null;
}

function Compass({ mask }: { mask: Int16Array }) {
  return <>{[['N', 0], ['E', 90], ['S', 180], ['O', 270]].map(([t, az]) => {
    const d = dirFromAzEl(az as number, 0); const y = RING_R * 0.6 * Math.tan(THREE.MathUtils.degToRad(mask[Math.round((az as number) * 2) % mask.length] / 100)) + 600;
    return <Html key={t} position={[d.x * RING_R * 0.6, y, d.z * RING_R * 0.6]} center zIndexRange={[5, 0]}><span className="sc-compass">{t}</span></Html>;
  })}</>;
}

export function SiteScene({ heights, size, step, mask, sun, earth, labels, preset, presetNonce, onUserMove }: {
  heights: Int16Array | null; size: number; step: number; mask: Int16Array; sun: Body; earth: Body; labels: SceneLabels;
  preset: CameraPreset; presetNonce: number; onUserMove: () => void;
}) {
  const sunDir = useMemo(() => dirFromAzEl(sun.az, sun.el), [sun.az, sun.el]);
  const earthDir = useMemo(() => dirFromAzEl(earth.az, earth.el), [earth.az, earth.el]);
  // Fracción del disco solar sobre el horizonte (diámetro 0.53°): suaviza amanecer y atardecer
  const frac = THREE.MathUtils.clamp((sun.el - sun.horizon) / 0.53 + 0.5, 0, 1);
  const earthUp = earth.el > earth.horizon;
  const lightPos = useMemo(() => sunDir.clone().multiplyScalar(20000), [sunDir]);
  const sunPos = useMemo(() => sunDir.clone().multiplyScalar(SUN_R), [sunDir]), earthPos = useMemo(() => earthDir.clone().multiplyScalar(EARTH_R), [earthDir]);
  const fmt = (b: Body) => `${b.el >= 0 ? '+' : ''}${b.el.toFixed(1)}°`;
  const sunRef = useRef<HTMLDivElement>(null), earthRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const targets = useMemo(() => [{ pos: sunPos, el: sunRef }, { pos: earthPos, el: earthRef }, { pos: new THREE.Vector3(0, 7, 0), el: pinRef }], [sunPos, earthPos]);
  return (
    <div className="sc-root">
    <Canvas shadows camera={{ position: [-30, 9, 20], fov: 55, near: 0.5, far: 200000 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }} dpr={[1, 1.75]}>
      <color attach="background" args={['#020304']} />
      <Stars radius={150000} depth={20000} count={2500} factor={2600} saturation={0} fade={false} speed={0} />
      <ambientLight intensity={0.03} color="#9db4d0" />
      {/* Luz de Tierra: la Tierra iluminada refleja algo de luz azulada cuando está sobre el horizonte */}
      <directionalLight position={earthPos} intensity={earthUp ? 0.12 : 0} color="#8fb8ff" />
      <directionalLight position={lightPos} intensity={2.4 * frac} color="#fff1dc" castShadow
        shadow-mapSize-width={4096} shadow-mapSize-height={4096} shadow-bias={-0.0004} shadow-normalBias={20}
        shadow-camera-left={-12500} shadow-camera-right={12500} shadow-camera-top={12500} shadow-camera-bottom={-12500} shadow-camera-near={100} shadow-camera-far={60000} />
      {heights && <Terrain heights={heights} size={size} step={step} />}
      <HorizonRing mask={mask} />
      <Lander charging={frac > 0} linked={earthUp} />
      <Sun pos={sunPos} frac={frac} />
      <Earth pos={earthPos} sunDir={sunDir} />
      <Compass mask={mask} />
      <OrbitControls makeDefault enableDamping target={[0, 4, 0]} minDistance={8} maxDistance={30000} maxPolarAngle={Math.PI * 0.53} onStart={onUserMove} />
      <CameraRig preset={preset} sunAz={sun.az} earthAz={earth.az} nonce={presetNonce} />
      <Projector targets={targets} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={1.2} luminanceThreshold={1.2} luminanceSmoothing={0.2} mipmapBlur />
        <Vignette offset={0.25} darkness={0.7} />
      </EffectComposer>
    </Canvas>
      <div ref={pinRef} className="sc-anchor"><div className="sc-pin">▼ {labels.lander}</div></div>
      <div ref={sunRef} className="sc-anchor"><div className={`sc-label sun ${frac > 0 ? '' : 'off'}`}><b>☀ {labels.sun}</b><span>{frac > 0 ? labels.above(fmt(sun)) : labels.hidden}</span><em>{frac > 0 ? labels.light : labels.dark}</em></div></div>
      <div ref={earthRef} className="sc-anchor"><div className={`sc-label earth ${earthUp ? '' : 'off'}`}><b>◉ {labels.earth}</b><span>{earthUp ? labels.above(fmt(earth)) : labels.hidden}</span><em>{earthUp ? labels.link : labels.noLink}</em></div></div>
    </div>
  );
}
