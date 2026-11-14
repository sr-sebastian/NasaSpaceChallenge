export type SiteId='shk'|'con'|'mal'|'nob'|'haw';
export interface LunarSite {id:SiteId;name:string;lat:number;dir:number;earthAz:number;roughness:number;seed:number;summary:string}
export const SITES:LunarSite[]=[
 {id:'shk',name:'Borde de Shackleton',lat:-89.67,dir:200,earthAz:0,roughness:.9,seed:1103,summary:'Horizonte bajo y luz persistente.'},
 {id:'con',name:'Cresta de conexión',lat:-89.45,dir:120,earthAz:10,roughness:1.1,seed:2207,summary:'Equilibrio entre energía y enlace.'},
 {id:'mal',name:'Macizo Malapert',lat:-86,dir:0,earthAz:0,roughness:1.4,seed:3313,summary:'Vista terrestre favorable.'},
 {id:'nob',name:'Borde de Nobile',lat:-85.3,dir:40,earthAz:40,roughness:2.2,seed:4421,summary:'Relieve exigente y sombras extensas.'},
 {id:'haw',name:'Haworth',lat:-87.5,dir:320,earthAz:350,roughness:2.6,seed:5531,summary:'El desafío térmico más severo.'}
];
export const siteById=(id:SiteId)=>SITES.find(s=>s.id===id)!;
