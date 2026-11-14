import type {LunarSite} from './sites';
const fract=(n:number)=>n-Math.floor(n); const hash=(x:number,z:number,seed:number)=>fract(Math.sin(x*127.1+z*311.7+seed*74.7)*43758.5453)*2-1;
const smooth=(t:number)=>t*t*(3-2*t);
function noise(x:number,z:number,seed:number){const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi;const a=hash(xi,zi,seed),b=hash(xi+1,zi,seed),c=hash(xi,zi+1,seed),d=hash(xi+1,zi+1,seed);const u=smooth(xf),v=smooth(zf);return (a+(b-a)*u)+((c+(d-c)*u)-(a+(b-a)*u))*v}
export function terrainHeight(site:LunarSite,x:number,z:number){const r=Math.hypot(x,z);let n=0,amp=1,f=.018;for(let i=0;i<5;i++){n+=noise(x*f,z*f,site.seed+i*19)*amp;amp*=.5;f*=2.03}const basin=Math.exp(-r*r/4200)*-1.5;const mesa=Math.exp(-r*r/180)*2.2;const distant=Math.pow(Math.min(1,r/180),1.8)*site.roughness*9*(.7+.3*Math.sin(Math.atan2(z,x)*5+site.seed));return n*site.roughness*2.2+basin+mesa+distant}
export function horizonElevation(site:LunarSite,az:number,mast:number){let max=-90;const a=az*Math.PI/180;for(let d=40;d<=2000;d+=25){const x=Math.sin(a)*d,z=-Math.cos(a)*d;const elev=Math.atan2(terrainHeight(site,x,z)-(2+mast),d)*180/Math.PI;max=Math.max(max,elev)}return max}
