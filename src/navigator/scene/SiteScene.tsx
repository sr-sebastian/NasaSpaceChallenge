import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef } from 'react';
import type React from 'react';
import * as THREE from 'three';
import { FlatGround, LANDER_BASE, NearField, Terrain } from './ground';
import { Lander } from './Lander';

type OrbitImpl = { target: THREE.Vector3; update: () => void };

/* Marco local del sitio: x = este, y = arriba, z = sur (el norte es −z). Unidades: metros. */
export const dirFromAzEl = (az: number, el: number) => {
  const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el);
  return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
};

export interface Body { az: number; el: number; horizon: number }
export type CameraPreset = 'sun' | 'earth' | 'aerial' | 'free';
export interface SceneLabels { sun: string; earth: string; lander: string; above: (d: string) => string; hidden: string; link: string; noLink: string; light: string; dark: string; compass: string[] }

const SIZE_EXAG = 3;               // Sol y Tierra dibujados 3 veces más grandes que su tamaño angular real
const RING_R = 30000, SUN_R = 60000, EARTH_R = 50000;

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
  return <mesh geometry={geo}><meshStandardMaterial color="#2e2c29" roughness={1} side={THREE.DoubleSide} /></mesh>;
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
    fragmentShader: 'uniform sampler2D map; uniform vec3 sunDir; varying vec2 vUv; varying vec3 vN; void main(){ vec3 c=texture2D(map,vUv).rgb; float l=max(dot(normalize(vN),normalize(sunDir)),0.0); gl_FragColor=vec4(c*(0.035+1.5*l),1.0);} ',
  }), []);
  useEffect(() => { mat.uniforms.sunDir.value.copy(sunDir); }, [mat, sunDir]);
  const r = EARTH_R * Math.tan(THREE.MathUtils.degToRad(0.95)) * SIZE_EXAG;
  return <mesh position={pos} material={mat}><sphereGeometry args={[r, 48, 24]} /></mesh>;
}

function Sun({ pos, frac }: { pos: THREE.Vector3; frac: number }) {
  const r = SUN_R * Math.tan(THREE.MathUtils.degToRad(0.2665)) * SIZE_EXAG;
  const glow = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,236,200,1)'); gr.addColorStop(0.18, 'rgba(255,205,130,0.5)'); gr.addColorStop(1, 'rgba(255,170,80,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
  }, []);
  return <group position={pos}>
    <mesh><sphereGeometry args={[r, 32, 16]} /><meshBasicMaterial color={new THREE.Color(6, 5.2, 4)} toneMapped={false} /></mesh>
    <sprite scale={[r * 9, r * 9, 1]}><spriteMaterial map={glow} transparent opacity={0.25 + 0.45 * frac} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
  </group>;
}

/** Luz solar con sombra adaptativa: el encuadre de la sombra se ajusta a la distancia de la cámara
 *  (de cerca: sombra nítida del módulo y las piedras; de lejos: sombras de montañas de km). */
function SunLight({ dir, intensity }: { dir: THREE.Vector3; intensity: number }) {
  const light = useRef<THREE.DirectionalLight>(null); const { camera, scene } = useThree(); const last = useRef(0);
  useEffect(() => { if (light.current) scene.add(light.current.target); }, [scene]);
  useFrame(() => {
    const l = light.current; if (!l) return;
    const d = camera.position.length(); const ext = THREE.MathUtils.clamp(d * 2.2, 40, 12500);
    if (Math.abs(ext - last.current) / ext > 0.15) {
      last.current = ext; const c = l.shadow.camera; c.left = -ext; c.right = ext; c.top = ext; c.bottom = -ext;
      c.near = 1; c.far = ext * 8 + 4000; c.updateProjectionMatrix(); l.shadow.normalBias = ext / 900; l.shadow.bias = -0.0002;
    }
    l.position.copy(dir).multiplyScalar(ext * 4 + 1500); l.target.position.set(0, 0, 0); l.target.updateMatrixWorld();
  });
  return <directionalLight ref={light} intensity={intensity} color="#fff1dc" castShadow shadow-mapSize-width={4096} shadow-mapSize-height={4096} />;
}

function CameraRig({ preset, sunAz, earthAz, nonce }: { preset: CameraPreset; sunAz: number; earthAz: number; nonce: number }) {
  const { camera, controls } = useThree() as unknown as { camera: THREE.PerspectiveCamera; controls: OrbitImpl | null };
  useEffect(() => {
    if (!controls || preset === 'free') return;
    if (preset === 'aerial') { const d = dirFromAzEl(sunAz + 120, 0); camera.position.set(d.x * 11000, 7000, d.z * 11000); controls.target.set(0, -1200, 0); }
    else { const az = preset === 'sun' ? sunAz : earthAz; const d = dirFromAzEl(az, 0), side = dirFromAzEl(az + 90, 0); camera.position.set(-d.x * 22 + side.x * 9, 4.5, -d.z * 22 + side.z * 9); controls.target.set(d.x * 40, 7, d.z * 40); }
    controls.update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, nonce, controls]);
  return null;
}

/* ---------- Capa de marcadores (DOM) ---------- */
interface Marker { pos: THREE.Vector3; el: React.RefObject<HTMLDivElement | null>; edge: boolean }

/** Proyecta Sol/Tierra/módulo a pantalla en cada cuadro. Fuera de cuadro: flecha en el borde apuntando hacia el cuerpo.
 *  También mueve la cinta de la brújula según hacia dónde mira la cámara. */
function Overlay({ markers, tape, sunAz, earthAz }: { markers: Marker[]; tape: React.RefObject<HTMLDivElement | null>; sunAz: number; earthAz: number }) {
  const { camera, size } = useThree(); const v = useMemo(() => new THREE.Vector3(), []); const f = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const W = size.width, H = size.height, pad = 46, padTop = 78, padBottom = 70;
    for (const m of markers) {
      const el = m.el.current; if (!el) continue;
      v.copy(m.pos).project(camera); const behind = v.z > 1;
      let x = ((v.x + 1) / 2) * W, y = ((1 - v.y) / 2) * H; if (behind) { x = W - x; y = H - y; }
      const out = behind || x < pad || x > W - pad || y < padTop || y > H - padBottom;
      if (out && m.edge) {
        const cx = W / 2, cy = H / 2; let dx = x - cx, dy = y - cy; if (behind && Math.hypot(dx, dy) < 1) dy = 1;
        const k = Math.min((W / 2 - pad) / Math.abs(dx || 1e-6), (dy < 0 ? H / 2 - padTop : H / 2 - padBottom) / Math.abs(dy || 1e-6)); x = cx + dx * k; y = cy + dy * k;
        el.dataset.edge = '1'; el.style.setProperty('--ang', `${Math.atan2(dy, dx)}rad`);
      } else { el.dataset.edge = ''; if (!m.edge) el.style.display = behind ? 'none' : ''; }
      el.dataset.flip = x > W * 0.58 ? '1' : '';
      el.style.transform = `translate(${x}px, ${y}px)`;
    }
    const t = tape.current;
    if (t) {
      camera.getWorldDirection(f); const yaw = (THREE.MathUtils.radToDeg(Math.atan2(f.x, -f.z)) + 360) % 360;
      t.style.setProperty('--yaw', String(yaw)); t.style.setProperty('--sa', String(((sunAz - yaw + 540) % 360) - 180)); t.style.setProperty('--ea', String(((earthAz - yaw + 540) % 360) - 180));
    }
  });
  return null;
}

export function SiteScene({ heights, size, step, mask, sun, earth, labels, preset, presetNonce, onUserMove, flat }: {
  heights: Int16Array | null; size: number; step: number; mask: Int16Array; sun: Body; earth: Body; labels: SceneLabels;
  preset: CameraPreset; presetNonce: number; onUserMove: () => void; flat: boolean;
}) {
  const sunDir = useMemo(() => dirFromAzEl(sun.az, sun.el), [sun.az, sun.el]);
  const earthDir = useMemo(() => dirFromAzEl(earth.az, earth.el), [earth.az, earth.el]);
  // Fracción del disco solar sobre el horizonte (diámetro 0.53°): suaviza amanecer y atardecer
  const frac = THREE.MathUtils.clamp((sun.el - sun.horizon) / 0.53 + 0.5, 0, 1);
  const earthUp = earth.el > earth.horizon;
  const sunPos = useMemo(() => sunDir.clone().multiplyScalar(SUN_R), [sunDir]), earthPos = useMemo(() => earthDir.clone().multiplyScalar(EARTH_R), [earthDir]);
  const sunRef = useRef<HTMLDivElement>(null), earthRef = useRef<HTMLDivElement>(null), pinRef = useRef<HTMLDivElement>(null), tapeRef = useRef<HTMLDivElement>(null);
  const markers = useMemo<Marker[]>(() => [{ pos: sunPos, el: sunRef, edge: true }, { pos: earthPos, el: earthRef, edge: true }, { pos: new THREE.Vector3(0, LANDER_BASE + 5.2, 0), el: pinRef, edge: false }], [sunPos, earthPos]);
  const fmt = (b: Body) => `${b.el >= 0 ? '+' : '−'}${Math.abs(b.el).toFixed(1)}°`;
  const ready = flat || !!heights;
  const ticks = useMemo(() => Array.from({ length: 72 }, (_, i) => i * 15 - 360), []);
  return (
    <div className="sc-root">
      <Canvas shadows camera={{ position: [-20, 5, 14], fov: 55, near: 0.3, far: 200000 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }} dpr={[1, 1.75]}>
        <color attach="background" args={['#020304']} />
        <Stars radius={150000} depth={20000} count={2500} factor={2600} saturation={0} fade={false} speed={0} />
        <ambientLight intensity={0.035} color="#9db4d0" />
        {/* luz de Tierra: la Tierra iluminada refleja algo de luz azulada cuando está sobre el horizonte */}
        <directionalLight position={earthPos} intensity={earthUp ? 0.1 : 0} color="#8fb8ff" />
        <SunLight dir={sunDir} intensity={2.6 * frac} />
        {flat ? <FlatGround /> : heights && <Terrain heights={heights} size={size} step={step} />}
        {ready && <NearField heights={flat ? null : heights} size={size} step={step} flat={flat} />}
        <HorizonRing mask={mask} />
        <Lander base={LANDER_BASE} sunDir={sunDir} earthDir={earthDir} charging={frac > 0} linked={earthUp} />
        <Sun pos={sunPos} frac={frac} />
        <Earth pos={earthPos} sunDir={sunDir} />
        <OrbitControls makeDefault enableDamping target={[0, 4, 0]} minDistance={6} maxDistance={30000} maxPolarAngle={Math.PI * 0.52} onStart={onUserMove} />
        <CameraRig preset={preset} sunAz={sun.az} earthAz={earth.az} nonce={presetNonce} />
        <Overlay markers={markers} tape={tapeRef} sunAz={sun.az} earthAz={earth.az} />
        <EffectComposer multisampling={0}>
          <Bloom intensity={1.1} luminanceThreshold={1.4} luminanceSmoothing={0.15} mipmapBlur />
          <Vignette offset={0.3} darkness={0.65} />
        </EffectComposer>
      </Canvas>

      <div ref={pinRef} className="mk-pin"><span>{labels.lander}</span></div>
      <div ref={sunRef} className={`mk sun ${frac > 0 ? '' : 'off'}`}>
        <i className="mk-ring" /><i className="mk-arrow" />
        <div className="mk-card"><span className="mk-ico">☀</span><b>{labels.sun}</b><strong className="mono">{fmt(sun)}</strong><em>{frac > 0 ? labels.light : labels.hidden}</em></div>
      </div>
      <div ref={earthRef} className={`mk earth ${earthUp ? '' : 'off'}`}>
        <i className="mk-ring" /><i className="mk-arrow" />
        <div className="mk-card"><span className="mk-ico">◉</span><b>{labels.earth}</b><strong className="mono">{fmt(earth)}</strong><em>{earthUp ? labels.link : labels.hidden}</em></div>
      </div>
      <div ref={tapeRef} className="tape" aria-hidden>
        <div className="tape-strip">{ticks.map(a => { const n = ((a % 360) + 360) % 360; const major = n % 90 === 0; return <span key={a} className={major ? 'maj' : n % 45 === 0 ? 'mid' : ''} style={{ '--a': a } as React.CSSProperties}>{(major || n % 45 === 0) && <em>{major ? labels.compass[n / 90] : n}</em>}</span>; })}</div>
        <i className={`tape-mk sun ${frac > 0 ? '' : 'off'}`} /><i className={`tape-mk earth ${earthUp ? '' : 'off'}`} /><b className="tape-c" />
      </div>
    </div>
  );
}
