import type {LunarSite} from './sites';
export interface EphemerisPoint {sunAz:number;sunElev:number;earthAz:number;earthElev:number}
const rad=(d:number)=>d*Math.PI/180; const mod=(n:number,m:number)=>((n%m)+m)%m;
export interface EphemerisProvider {at(site:LunarSite,hoursSince2028:number):EphemerisPoint}
export const simplifiedEphemeris:EphemerisProvider={at(site,t){
 const colat=90+site.lat; const sunAz=mod(t/708.73*360+site.dir,360); const decl=1.54*Math.sin(2*Math.PI*t/8319);
 const sunElev=decl+colat*Math.cos(rad(sunAz-site.dir-180)); const lib=2*Math.PI*t/655.7;
 return {sunAz,sunElev,earthAz:mod(site.earthAz+180+7*Math.sin(lib),360),earthElev:colat*.8+6.7*Math.sin(lib+1.3)-1};
}};
export const dateToHours=(date:string)=>(new Date(date+'T00:00:00Z').getTime()-Date.UTC(2028,0,1))/36e5;
export const directionFromAzElev=(az:number,elev:number,distance=100)=>{const a=rad(az),e=rad(elev);return [Math.sin(a)*Math.cos(e)*distance,Math.sin(e)*distance,-Math.cos(a)*Math.cos(e)*distance] as [number,number,number]};
// Implementá otro EphemerisProvider para sustituir este modelo por JSON horario de JPL Horizons.
