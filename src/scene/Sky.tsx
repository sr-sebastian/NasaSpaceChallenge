import {Stars,Sphere} from '@react-three/drei'; import {directionFromAzElev} from '../lib/ephemeris'; import type {HourForecast} from '../lib/sim';
export function Sky({hour,transmitting}:{hour:HourForecast;transmitting:boolean}){const sun=directionFromAzElev(hour.sunAz,hour.sunElev,500);const earth=directionFromAzElev(hour.earthAz,hour.earthElev,220);return <>
 <color attach="background" args={['#030405']}/><Stars radius={300} depth={40} count={1500} factor={3} saturation={0} fade speed={.2}/>
 <hemisphereLight args={['#9ec9e8','#2b2d31',hour.sun>.05?.48:.28]}/><ambientLight intensity={hour.sun>.05?.18:.12}/><directionalLight position={sun} intensity={.65+hour.sun*2.5} color="#ffcf8a" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-120} shadow-camera-right={120} shadow-camera-top={120} shadow-camera-bottom={-120}/>
 <Sphere args={[5,24,24]} position={sun}><meshBasicMaterial color="#ffe0a0" toneMapped={false}/></Sphere><pointLight position={sun} intensity={20} color="#ffb547"/>
 <group position={earth}><Sphere args={[4.2,32,32]}><meshStandardMaterial color="#2e97ca" roughness={.72} emissive="#123b60" emissiveIntensity={.55}/></Sphere>{transmitting&&<pointLight intensity={12} distance={30} color="#5cc8ff"/>}</group>
 </>}
