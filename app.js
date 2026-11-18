const $ = id => document.getElementById(id);
const COIN_SVG='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="var(--surface)" stroke-width="1.6" opacity=".7"/></svg>';
const ICON = {
  riego:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2s7 7.6 7 12.5A7 7 0 0 1 5 14.5C5 9.6 12 2 12 2z"/></svg>',
  revision:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 11V4.5a1.5 1.5 0 0 1 3 0V11m0-1V3.5a1.5 1.5 0 0 1 3 0V11m0-.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-12.5 4.3L3.6 15a1.6 1.6 0 0 1 2.5-2L9 15"/></svg>',
  abono:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c0-6 1-10 7-13-1 6-3 10-7 13zm0 0C9 18 6 16 4 9c5 1 7 5 8 13z"/></svg>',
  plagas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/></svg>',
  poda:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.5 7.5L20 18M8.5 16.5L20 6"/></svg>',
  leccion:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l11 6 9-4.9V17h2V9zM5 13.2v4L12 21l7-3.8v-4L12 17z"/></svg>',
  brotes:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 21v-7C7 14 4 11 4 6c4 0 7 2 7 6 0-4 3-8 9-8 0 6-3 10-7 10v7z"/></svg>',
  racha:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.4 1.2-3.8 2.3-5 .2 1.6 1 2.7 2.2 3C11 8 12.4 5.4 12 2z"/></svg>',
  hielo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 2v20M4 7l16 10M20 7L4 17M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5"/></svg>',
  dato:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2zM9 19h6v1.5a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 20.5z"/></svg>',
  candado:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10V7a5 5 0 0 1 10 0v3h1v11H6V10zm2 0h6V7a3 3 0 0 0-6 0z"/></svg>',
  nota:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 4h14v16H5zM8 9h8M8 13h8M8 17h5"/></svg>'
};
const TXT = {riego:"Riego",revision:"Prueba del dedo",abono:"Abono",plagas:"Patrulla de plagas",poda:"Poda",leccion:"Lección",brotes:"Brotes nuevos",dato:"Dato curioso",nota:"Nota"};
const LEVELS = [[0,"Semilla"],[30,"Brote"],[80,"Plantita"],[160,"Arbusto"],[300,"Floración"],[500,"Abuelita sabia"],[800,"Reina del balcón"]];
/* puntos (nivel) y monedas (tienda) por tipo de cuidado */
const PTS = e => ({riego:10,revision:5,abono:15,poda:15,plagas:10,brotes:10,nota:2,dato:3,leccion:e.ok===false?1:5})[e.tipo] ?? 0;
const MON = e => ({riego:10,revision:5,abono:15,poda:12,plagas:8,brotes:10,dato:3,leccion:e.ok===false?1:5})[e.tipo] ?? 0;
const HITOS = [[3,10],[7,25],[14,40],[30,100],[60,150],[100,300]];
const TIER_MON = [15,30,60];

const BADGES = [
  {k:"riego", name:"Regadora", t:[3,10,30], icon:"riego", count:E=>E.filter(e=>e.tipo==="riego").length},
  {k:"revision", name:"Dedito verde", t:[3,10,25], icon:"revision", count:E=>E.filter(e=>e.tipo==="revision"||e.tipo==="riego").length},
  {k:"plagas", name:"Detective de plagas", t:[2,6,15], icon:"plagas", count:E=>E.filter(e=>e.tipo==="plagas").length},
  {k:"abono", name:"Chef de Ciruquis", t:[1,5,12], icon:"abono", count:E=>E.filter(e=>e.tipo==="abono").length},
  {k:"poda", name:"Tijeras de oro", t:[1,3,8], icon:"poda", count:E=>E.filter(e=>e.tipo==="poda").length},
  {k:"leccion", name:"Sabia como Ciruquis", t:[3,10,30], icon:"leccion", count:E=>E.filter(e=>e.tipo==="leccion"&&e.ok!==false).length},
  {k:"dato", name:"Coleccionista curiosa", t:[5,12,16], icon:"dato", count:E=>new Set(E.filter(e=>e.tipo==="dato").map(e=>e.nota)).size},
  {k:"racha", name:"Llama eterna", t:[7,30,100], icon:"racha", count:()=>R.best}
];

const SHOP = [
  {id:"protector", name:"Protector de racha", price:30, desc:"Salva la racha si un día no entran. Máximo 2.", consumible:true,
   svg:'<svg viewBox="0 0 40 40"><path d="M20 3l14 5v10c0 9-6 15-14 19C12 33 6 27 6 18V8z" fill="var(--ice-soft)" stroke="var(--ice)" stroke-width="2.5"/><path d="M20 11c.8 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1.8-4 .2 1.2.8 2 1.8 2.3C19 14.5 20.3 13 20 11z" fill="var(--ice)"/></svg>'},
  {id:"rosada", name:"Chompa rosada", price:40, desc:"Tejida con lana rosada, como las que hacía para la familia.", grupo:"color",
   svg:'<svg viewBox="0 0 40 40"><path d="M14 6h12l10 6-4 8-4-2v18H12V18l-4 2-4-8z" fill="#E58AB3"/><path d="M15 6q5 5 10 0" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/></svg>'},
  {id:"verde", name:"Chompa verde", price:50, desc:"Verde hoja, para combinar con sus ramas.", grupo:"color",
   svg:'<svg viewBox="0 0 40 40"><path d="M14 6h12l10 6-4 8-4-2v18H12V18l-4 2-4-8z" fill="#4E8A5F"/><path d="M15 6q5 5 10 0" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/></svg>'},
  {id:"rayas", name:"Rayas tejidas", price:80, desc:"Le teje rayas amarillas a la chompa que tenga puesta.",
   svg:'<svg viewBox="0 0 40 40"><path d="M14 6h12l10 6-4 8-4-2v18H12V18l-4 2-4-8z" fill="#7A2457"/><path d="M15 6q5 5 10 0" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/><path d="M12 24h16M12 30h16" stroke="#F2B33D" stroke-width="3"/></svg>'},
  {id:"reloj", name:"Reloj despertador", price:60, desc:"Siempre atenta a la hora, como la abuelita. Marca la hora real.",
   svg:'<svg viewBox="0 0 40 40"><circle cx="9" cy="8" r="4" fill="#7A2457"/><circle cx="31" cy="8" r="4" fill="#7A2457"/><circle cx="20" cy="22" r="14" fill="#fff" stroke="#7A2457" stroke-width="3"/><path d="M20 22V13M20 22l6 4" stroke="#16261C" stroke-width="2.4" stroke-linecap="round"/></svg>'},
  {id:"mariposa", name:"Mariposa amiga", price:110, desc:"Le hace compañía revoloteando.",
   svg:'<svg viewBox="0 0 40 40"><ellipse cx="13" cy="15" rx="9" ry="10" fill="var(--sun)"/><ellipse cx="27" cy="15" rx="9" ry="10" fill="var(--sun)"/><ellipse cx="14" cy="28" rx="6" ry="7" fill="var(--bract)"/><ellipse cx="26" cy="28" rx="6" ry="7" fill="var(--bract)"/><rect x="18.5" y="8" width="3" height="26" rx="1.5" fill="var(--ink)"/></svg>'},
  {id:"regadera", name:"Regadera dorada", price:150, desc:"El trofeo de las mejores jardineras.",
   svg:'<svg viewBox="0 0 40 40"><path d="M10 16h20l-2 20H12z" fill="var(--gold)" stroke="#9C7A00" stroke-width="1.5"/><path d="M10 20L2 10" stroke="#9C7A00" stroke-width="3.5" stroke-linecap="round"/><path d="M30 20q9 4 0 11" stroke="#9C7A00" stroke-width="2.5" fill="none"/></svg>'}
];

const LESSONS = [
  {id:"bractea",q:"Lo fucsia que parece pétalo en la bugambilia es…",o:["Una bráctea, una hoja de color","La flor verdadera","Un fruto"],a:0,e:"Es una bráctea. La flor verdadera es la florecita blanca del centro."},
  {id:"dedo",q:"¿Cuándo toca regar?",o:["Todos los días sin falta","Cuando la tierra está seca a 3–4 cm","Cuando ya se cayeron las hojas"],a:1,e:"Mete el dedo hasta pasar la primera articulación: si está seco, toca agua."},
  {id:"plato",q:"Después de regar, el agua del plato…",o:["Se deja para que tome después","Se vacía en unos 10 minutos","Se le agrega más"],a:1,e:"El agua estancada pudre las raíces y atrae mosquitas y zancudos."},
  {id:"sol",q:"¿Cuántas horas de sol directo necesita para florecer?",o:["1–2 horas","5–6 horas o más","Prefiere la sombra"],a:1,e:"Mientras más sol, más brácteas. En verano limeño se pone feliz."},
  {id:"nudo",q:"Al podar, el corte se hace…",o:["En el centro de la rama","5 mm encima de un nudo, en diagonal","Al ras de la tierra"],a:1,e:"El nudo es donde nace una hoja: de ahí brota la rama nueva."},
  {id:"tercio",q:"En una poda, como máximo se quita…",o:["Un tercio de la planta","La mitad","Todas las ramas largas"],a:0,e:"Más de un tercio la estresa demasiado."},
  {id:"abono",q:"¿Qué abono le gusta más para florecer?",o:["Mucho nitrógeno","Más fósforo y potasio","Ninguno, nunca"],a:1,e:"Mucho nitrógeno da hojas y pocas flores. El de floración trae más fósforo y potasio."},
  {id:"invierno",q:"En el invierno de Lima, la bugambilia…",o:["Necesita más agua","Se riega menos y no se abona","Hay que meterla adentro por la helada"],a:1,e:"Con la panza de burro bebe poco; cada 10–15 días basta. En Lima no hiela."},
  {id:"hormigas",q:"Si ves hormigas subiendo por el tallo, revisa si hay…",o:["Pulgones o cochinillas","Demasiado sol","Raíces fuera de la maceta"],a:0,e:"Las hormigas cuidan a los pulgones por su jugo dulce. Se limpian con algodón y alcohol o jabón potásico."},
  {id:"mascotas",q:"¿Qué producto es más seguro cerca de Popeye y Zoe?",o:["Cebo para hormigas","Insecticida en spray","Jabón potásico o aceite de neem"],a:2,e:"Son mucho más seguros. Aplícalos cuando ellos no estén cerca y deja secar."},
  {id:"cristal",q:"¿Por qué conviene separar las ramas del vidrio?",o:["Porque el vidrio se raya","Porque el calor del vidrio quema las hojas","No importa"],a:1,e:"Así se quemó la rama de hojas negras que cortaron."},
  {id:"bracteas-tierra",q:"Las brácteas caídas sobre la tierra…",o:["Se dejan como abono","Se recogen para evitar hongos y mosquitas","Se entierran"],a:1,e:"Con la humedad de Lima se pudren rápido."}
];

/* datos curiosos: cada planta trae los suyos; nuevas plantas se agregan aquí */
const DATOS = [
  {id:"nombre",t:"Se llama así por un explorador",x:"Su nombre homenajea a Louis Antoine de Bougainville, el navegante francés que dio la vuelta al mundo entre 1766 y 1769."},
  {id:"baret",t:"Una mujer disfrazada la encontró",x:"En esa expedición viajaba Jeanne Baret, vestida de hombre para poder ir como asistente del botánico. Se le atribuye haber recolectado la bugambilia en Brasil, y fue la primera mujer en dar la vuelta al mundo."},
  {id:"peru",t:"Es sudamericana, como nosotros",x:"Es nativa de Sudamérica. Hasta hay una especie llamada Bougainvillea peruviana, que crece silvestre en Perú y Ecuador."},
  {id:"tres",t:"Todo viene de a tres",x:"Cada grupito tiene tres brácteas, y cada bráctea lleva pegada una florecita blanca. Por eso en Venezuela le dicen trinitaria."},
  {id:"papel",t:"Flor de papel",x:"Sus brácteas son tan delgadas y secas al tacto que en varios países le dicen flor de papel o papelillo."},
  {id:"flor",t:"La flor verdadera dura poquito",x:"La florecita blanca dura apenas unos días, pero las brácteas pueden quedarse coloridas varias semanas."},
  {id:"polinizadores",t:"Sus colores son un anuncio",x:"Las brácteas de colores sirven para atraer colibríes, mariposas y abejas hacia las flores, que son pequeñas y difíciles de ver."},
  {id:"espinas",t:"Las espinas son ganchos",x:"En la naturaleza es trepadora: usa sus espinas curvas para engancharse a árboles y muros y subir hacia el sol."},
  {id:"altura",t:"Puede trepar muy alto",x:"Si la dejan crecer libre, puede pasar los 10 metros, cubriendo muros y techos enteros."},
  {id:"sed",t:"Florece mejor con un poco de sed",x:"Viene de zonas con temporadas secas. Un poco de sequedad entre riegos le avisa que es buen momento para florecer."},
  {id:"familia",t:"Su prima es la maravilla",x:"Pertenece a la misma familia que la maravilla o dondiego de noche (Nyctaginaceae), esa flor que abre al atardecer."},
  {id:"colores",t:"Viene en muchos colores",x:"Hay bugambilias fucsias, moradas, rojas, naranjas, amarillas, blancas y hasta de dos colores en la misma planta."},
  {id:"injerto",t:"Una sola planta, dos colores",x:"Los jardineros pueden injertar ramas de distintas variedades en un mismo tronco para tener varios colores juntos."},
  {id:"longeva",t:"Puede vivir muchísimos años",x:"Bien cuidada, una bugambilia vive décadas. Hay ejemplares con troncos gruesos como árboles."},
  {id:"bonsai",t:"También se hace bonsái",x:"Como aguanta bien la poda y el tronco se pone grueso y retorcido, es una de las plantas con flor favoritas para bonsái."},
  {id:"lima",t:"Le encanta el clima de Lima",x:"Como en Lima no hiela, puede estar afuera todo el año. Por eso se ve tanto en muros, parques y balcones limeños."}
];
const CURSOS = [
  {id:"bugambilia", unidad:"Unidad 1 · Bugambilia", nombre:"Conoce a Ciruquis", lecciones:()=>LESSONS},
  {id:"proxima", unidad:"Unidad 2", nombre:"Su próxima planta", locked:true}
];

/* ---------- fechas y temporada (Lima) ---------- */
const day = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const dkey = d => { const x=day(d); return x.getFullYear()+"-"+(x.getMonth()+1)+"-"+x.getDate(); };
const daysBetween = (a,b) => Math.round((day(b)-day(a))/86400000);
function season(d){
  const m = new Date(d).getMonth()+1;
  if (m>=11 || m<=4) return {n:"Verano", max:4, abono:true};
  if (m===10) return {n:"Primavera", max:7, abono:true};
  if (m===5) return {n:"Otoño", max:10, abono:false};
  return {n:"Invierno", max:15, abono:false};
}

let entradas=[], compras=[], equipado=null, db=null, user=null, miId=null, miNombre="Teté", perfiles={}, puedeEscribir=true, mostrar=8, cargado=false;
let prev={level:-1, tiers:-1, streak:-1};
let R={cur:0,best:0,todayActive:false,freezesLeft:0,days:{}};

const esAgua = e => e.tipo==="riego" || (e.tipo==="revision" && e.nota==="humeda");
const ultimo = pred => entradas.find(pred);

function estado(){
  const s = season(new Date()), ref = ultimo(esAgua);
  if (!ref) return {mood:"agua", d:null, max:s.max};
  const d = daysBetween(ref.fecha, new Date());
  return {mood: d<=s.max-2 ? "feliz" : d<=s.max ? "sed" : d<=s.max*2 ? "agua" : "rescate", d, max:s.max};
}

/* racha diaria: cualquier misión o lección cuenta; los protectores cubren días perdidos */
function calcularRacha(){
  const activos = new Set(entradas.map(e=>dkey(e.fecha)));
  const prot = compras.filter(c=>c.item==="protector").map(c=>day(c.fecha)).sort((a,b)=>a-b);
  const res={cur:0,best:0,todayActive:activos.has(dkey(new Date())),freezesLeft:0,days:{}};
  if(!activos.size){ res.freezesLeft=prot.length; return res; }
  const primero = day(entradas[entradas.length-1].fecha), hoy=day(new Date());
  let streak=0, usados=0;
  for(let d=new Date(primero); d<hoy; d.setDate(d.getDate()+1)){
    const k=dkey(d);
    if(activos.has(k)){ streak++; res.days[k]="on"; }
    else {
      const disp = prot.filter(p=>p<=d).length - usados;
      if(streak>0 && disp>0){ usados++; res.days[k]="frz"; }
      else { streak=0; res.days[k]="off"; }
    }
    res.best=Math.max(res.best,streak);
  }
  if(res.todayActive){ streak++; res.days[dkey(hoy)]="on"; }
  res.cur=streak; res.best=Math.max(res.best,streak);
  res.freezesLeft = prot.length - usados;
  return res;
}
function tierDe(b){ const c=b.count(entradas); let t=0; b.t.forEach((th,i)=>{ if(c>=th) t=i+1; }); return {c,t}; }
function monedas(){
  let m = entradas.reduce((s,e)=>s+MON(e),0);
  HITOS.forEach(([d,b])=>{ if(R.best>=d) m+=b; });
  BADGES.forEach(b=>{ const {t}=tierDe(b); for(let i=0;i<t;i++) m+=TIER_MON[i]; });
  m -= compras.reduce((s,c)=>s+(c.costo||0),0);
  return m;
}
function nivel(xp){
  let i=0; while(i<LEVELS.length-1 && xp>=LEVELS[i+1][0]) i++;
  const cur=LEVELS[i][0], nxt=LEVELS[i+1]?LEVELS[i+1][0]:null;
  return {i, name:LEVELS[i][1], nxt, pct: nxt? (xp-cur)/(nxt-cur)*100 : 100};
}
const tiene = id => compras.some(c=>c.item===id);
const puesto = id => { if(!tiene(id)) return false; if(equipado) return equipado.includes(id); const ult=compras.filter(c=>COLORES.includes(c.item)).map(c=>c.item).pop(); return SHOP.find(x=>x.id===id)?.grupo==="color" ? id===ult : true; };

/* ---------- Ciruquis ---------- */
const BRACT_SPOTS=[[92,64],[148,76],[52,74],[120,62],[70,58],[160,92],[38,92]];
function dibujarCiruquis(mood, lvl){
  const cls=["buga","mood-"+mood];
  SHOP.forEach(s=>{ if(!s.consumible && puesto(s.id)) cls.push("has-"+s.id); });
  $("buga").className = cls.join(" ");
  const g=$("bracts"); g.innerHTML="";
  const n = mood==="rescate"?0 : Math.min(BRACT_SPOTS.length, lvl+1);
  for (let k=0;k<n;k++){
    const [x,y]=BRACT_SPOTS[k];
    const b=document.createElementNS("http://www.w3.org/2000/svg","g"); b.setAttribute("class","bract");
    b.innerHTML=[0,120,240].map(r=>`<ellipse cx="${x}" cy="${y-8}" rx="7" ry="11" transform="rotate(${r} ${x} ${y})" fill="var(--bract)" opacity=".9"/>`).join("")+`<circle cx="${x}" cy="${y}" r="2.6" fill="#FFF8E6"/>`;
    g.append(b);
  }
  const eyes=$("eyes");
  if (mood==="feliz") eyes.innerHTML='<path d="M79 175 q5 -6 10 0 M111 175 q5 -6 10 0" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round"/>';
  else if (mood==="rescate") eyes.innerHTML='<path d="M80 170 l8 7 M88 170 l-8 7 M112 170 l8 7 M120 170 l-8 7" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round"/>';
  else eyes.innerHTML='<circle cx="84" cy="173" r="3.8" fill="var(--ink)"/><circle cx="116" cy="173" r="3.8" fill="var(--ink)"/>';
  $("mouth").setAttribute("d", {feliz:"M90 190 Q100 200 110 190", sed:"M91 193 L109 193", agua:"M90 197 Q100 188 110 197", rescate:"M92 198 Q100 190 108 198"}[mood]);
  $("tear").setAttribute("opacity", mood==="agua"||mood==="rescate" ? ".9" : "0");
}
function mensaje(st){
  const c = miNombre || "corazón";
  if (st.d===null) return ["¡Hola, "+c+"! Todavía no tengo riegos anotados.","Hazme la prueba del dedo y cuéntame."];
  const hace = st.d===0?"hoy":st.d===1?"ayer":`hace ${st.d} días`;
  switch(st.mood){
    case "feliz": { const f=st.max-2-st.d; return [`¡Qué rico, ${c}! Me dieron agüita ${hace}.`, f<=0?"Mañana me haces la prueba del dedo, ¿ya?":`Próxima prueba del dedo en ${f} día${f===1?"":"s"}.`]; }
    case "sed": return [`Ay, ${c}, creo que ya me va dando sed…`, `Último riego ${hace}. Hazme la prueba del dedo hoy.`];
    case "agua": return [`¡${c[0].toUpperCase()+c.slice(1)}, tengo sed! Revísame la tierra hoy.`, `Último riego ${hace}.`];
    default: return [`Llevo ${st.d} días sin agüita… ¡rescátame!`, "Riégame a fondo y vacía el plato después."];
  }
}

function horaAbuelita(){
  const h=new Date().getHours(), c=miNombre||"corazón";
  if(h>=5&&h<9) return `Buenos días, ${c}. ¿Ya tomaste desayuno? Que te vaya bonito en el trabajo.`;
  if(h>=9&&h<12) return `¿Ya estás trabajando, ${c}? Tómate tu agüita tú también.`;
  if(h>=12&&h<15) return `¿Ya almorzaste, ${c}? No te me saltes la comida.`;
  if(h>=15&&h<19) return `¿Cómo te fue hoy, ${c}? Yo aquí, tejiendo.`;
  if(h>=19&&h<22) return `Qué bueno que ya llegaste a casa, ${c}.`;
  return `Ya es tardecito, ${c}. Anda a descansar.`;
}
function moverReloj(){ const d=new Date(), m=d.getMinutes(), h=d.getHours()%12+m/60;
  $("hHour").setAttribute("transform",`rotate(${h*30} 28 128)`); $("hMin").setAttribute("transform",`rotate(${m*6} 28 128)`); }
setInterval(()=>{ moverReloj(); $("abu").textContent=horaAbuelita(); },60000);

/* ---------- racha ---------- */
function renderRacha(){
  $("streakChip").textContent=R.cur;
  const on=R.cur>0;
  $("snum").textContent=R.cur; $("snum").className="snum"+(on?"":" off");
  $("flame").className="flame"+(on?(R.todayActive?" live":""):" off");
  $("slabel").textContent = R.cur===1?"día de racha":"días de racha";
  let msg;
  if(!on) msg="Completa una misión o la lección de hoy para encender la racha.";
  else if(!R.todayActive) msg="¡Todavía no cuidas a Ciruquis hoy! Haz una misión o la lección para no perder la racha.";
  else { const sig=HITOS.find(([d])=>d>R.cur); msg = sig ? `¡Racha a salvo hoy! A los ${sig[0]} días ganas ${sig[1]} monedas.` : "¡Racha a salvo hoy! Eres leyenda."; }
  if(R.freezesLeft>0) msg+=` Tienes ${R.freezesLeft} protector${R.freezesLeft>1?"es":""} de racha.`;
  $("smsg").textContent=msg;
  const w=$("week"); w.innerHTML="";
  const L=["D","L","M","M","J","V","S"], hoy=day(new Date());
  for(let i=6;i>=0;i--){
    const d=new Date(hoy); d.setDate(d.getDate()-i);
    const st=R.days[dkey(d)], isToday=i===0;
    const el=document.createElement("div");
    el.className="wd"+(st==="on"?" on":st==="frz"?" frz":"")+(isToday&&st!=="on"?" today":"");
    el.innerHTML=`<i>${st==="on"?ICON.racha:st==="frz"?ICON.hielo:""}</i><span>${isToday?"Hoy":L[d.getDay()]}</span>`;
    w.append(el);
  }
}

/* ---------- misiones ---------- */
function card({icon,cls,title,sub,tag,tagCls,done}){
  const m=document.createElement("article"); m.className="mission"+(done?" done":"");
  m.innerHTML=`<div class="mhead"><div class="micon ${cls||""}">${ICON[icon]}</div><div class="mbody"><div class="mtitle"></div><div class="msub"></div></div>${tag?`<span class="tag ${tagCls}"></span>`:""}</div>`;
  m.querySelector(".mtitle").textContent=title; m.querySelector(".msub").textContent=sub;
  if(tag) m.querySelector(".tag").textContent=tag;
  return m;
}
function boton(txt,cls,fn){ const b=document.createElement("button"); b.type="button"; b.className="btn "+(cls||""); b.textContent=txt; b.disabled=!db||!puedeEscribir; b.onclick=fn; return b; }
function fila(...bs){ const d=document.createElement("div"); d.className="btns"+(bs.length===1?" one":""); d.append(...bs); return d; }

function renderMisiones(){
  const box=$("missions"); box.innerHTML="";
  const hoy=new Date(), st=estado(), s=season(hoy);
  const regadoHoy = entradas.some(e=>esAgua(e) && daysBetween(e.fecha,hoy)===0);
  if (regadoHoy){
    box.append(card({icon:"riego",title:"Agua al día",sub:"Ya me cuidaron hoy, Teté. Vuelve cuando te pida agüita.",tag:"Hecho",tagCls:"ok",done:true}));
  } else if (st.mood==="feliz"){
    const c=card({icon:"riego",title:"Ciruquis está bien de agua",sub:`En ${s.n.toLowerCase()}, riego cada ${s.max<=4?"3–4":s.max} días y siempre con la tierra seca.`,tag:"Al día",tagCls:"ok",done:true});
    c.append(fila(boton("Igual quiero revisar la tierra","alt",()=>abrirDedo(c)))); box.append(c);
  } else {
    const c=card({icon:"revision",title:"Prueba del dedo",sub:"Mete el dedo hasta pasar la primera articulación (3–4 cm). ¿Cómo está la tierra?",tag:st.mood==="sed"?"+5 / +10":"¡Urgente!",tagCls:st.mood==="sed"?"coin":"due"});
    c.append(fila(boton("Seca: la regué","",()=>guardar("riego","")), boton("Aún húmeda","alt",()=>guardar("revision","humeda"))));
    box.append(c);
  }
  const lp=ultimo(e=>e.tipo==="plagas"), dp=lp?daysBetween(lp.fecha,hoy):null;
  if (dp===null || dp>=14){
    const c=card({icon:"plagas",cls:"sun",title:"Patrulla de plagas",sub:"Revisa el envés de las hojas y los brotes: hormigas, pulgones, mosquitas.",tag:"+8",tagCls:"coin"});
    const n=document.createElement("div"); n.className="hint"; n.textContent="Si ves bichitos: algodón con alcohol o jabón potásico, lejos de Popeye y Zoe.";
    c.append(n, fila(boton("Revisé: todo limpio","",()=>guardar("plagas","limpio")), boton("Encontré algo","alt",()=>guardar("plagas","encontré plagas"))));
    box.append(c);
  }
  if (s.abono){
    const brotes=ultimo(e=>e.tipo==="brotes"), la=ultimo(e=>e.tipo==="abono"), da=la?daysBetween(la.fecha,hoy):null;
    if(!brotes){
      const c=card({icon:"brotes",cls:"pink",title:"¿Ya salieron brotes nuevos?",sub:"Ciruquis se está recuperando. Apenas veas hojitas nuevas en los nudos, retomamos el abono.",tag:"+10",tagCls:"coin"});
      c.append(fila(boton("¡Vi brotes nuevos!","pink",()=>guardar("brotes","")))); box.append(c);
    } else if (da===null || da>=21){
      const c=card({icon:"abono",title:"Hora del abono",sub:"Fertilizante para floración, sobre la tierra ya húmeda. Cada 3 semanas hasta abril.",tag:"+15",tagCls:"coin"});
      c.append(fila(boton("Listo, la aboné","",()=>guardar("abono","")))); box.append(c);
    }
  }
  box.append(leccionCard());
  box.append(datoCard());
}
function abrirDedo(c){
  c.querySelector(".btns").remove();
  c.querySelector(".msub").textContent="Mete el dedo hasta pasar la primera articulación (3–4 cm). ¿Cómo está?";
  c.append(fila(boton("Seca: la regué","",()=>guardar("riego","")), boton("Aún húmeda","alt",()=>guardar("revision","humeda"))));
}
function leccionCard(){
  const hoy=new Date();
  if (entradas.some(e=>e.tipo==="leccion" && daysBetween(e.fecha,hoy)===0))
    return card({icon:"leccion",cls:"pink",title:"Lección del día",sub:"¡Lección completada! Mañana Ciruquis te enseña otra cosa.",tag:"Hecho",tagCls:"ok",done:true});
  const vistas=new Set(entradas.filter(e=>e.tipo==="leccion"&&e.ok!==false).map(e=>e.nota));
  const pend=LESSONS.filter(l=>!vistas.has(l.id)), pool=pend.length?pend:LESSONS;
  const L=pool[Math.floor(day(hoy)/86400000)%pool.length];
  const c=card({icon:"leccion",cls:"pink",title:"Lección del día",sub:`${LESSONS.length-pend.length} de ${LESSONS.length} aprendidas`,tag:"+5",tagCls:"coin"});
  const q=document.createElement("div"); q.className="q"; q.textContent=L.q;
  const opts=document.createElement("div"); opts.className="opts";
  L.o.forEach((t,i)=>{
    const b=document.createElement("button"); b.type="button"; b.className="opt"; b.textContent=t; b.disabled=!db||!puedeEscribir;
    b.onclick=()=>{
      const ok=i===L.a;
      opts.querySelectorAll(".opt").forEach((x,j)=>{x.disabled=true; if(j===L.a) x.classList.add("right");});
      if(!ok) b.classList.add("wrong");
      const ex=document.createElement("div"); ex.className="explain"; ex.textContent=(ok?"¡Correcto! ":"Casi. ")+L.e; c.append(ex);
      setTimeout(()=>guardar("leccion",L.id,{ok}),1500);
    };
    opts.append(b);
  });
  c.append(q,opts); return c;
}

function datoCard(){
  const hoy=new Date();
  const hoyDato=entradas.find(e=>e.tipo==="dato"&&daysBetween(e.fecha,hoy)===0);
  const vistos=new Set(entradas.filter(e=>e.tipo==="dato").map(e=>e.nota));
  if(hoyDato){
    const D=DATOS.find(d=>d.id===hoyDato.nota);
    const c=card({icon:"dato",cls:"sun",title:"Dato curioso del día",sub:"Guardado en tu álbum. Mañana hay otro, Teté.",tag:"Hecho",tagCls:"ok",done:true});
    if(D){ const f=document.createElement("div"); f.className="factbox"; f.innerHTML="<b></b><span></span>"; f.querySelector("b").textContent=D.t; f.querySelector("span").textContent=D.x; c.append(f); }
    return c;
  }
  const pend=DATOS.filter(d=>!vistos.has(d.id));
  if(!pend.length) return card({icon:"dato",cls:"sun",title:"¡Álbum completo!",sub:"Teté, ya conoces todos los datos de la bugambilia. Pronto llegan los de otra planta.",tag:"Oro",tagCls:"ok",done:true});
  const D=pend[0];
  const c=card({icon:"dato",cls:"sun",title:"Dato curioso del día",sub:`${DATOS.length-pend.length} de ${DATOS.length} en tu álbum`,tag:"+3",tagCls:"coin"});
  const f=document.createElement("div"); f.className="factbox"; f.innerHTML="<b></b><span></span>"; f.querySelector("b").textContent=D.t; f.querySelector("span").textContent=D.x;
  c.append(f, fila(boton("¡No lo sabía!","",()=>guardar("dato",D.id,{sabia:false})), boton("Ya lo sabía","alt",()=>guardar("dato",D.id,{sabia:true}))));
  return c;
}
function renderCurso(){
  const box=$("course"); box.innerHTML="";
  const aprendidas=new Set(entradas.filter(e=>e.tipo==="leccion"&&e.ok!==false).map(e=>e.nota));
  for(const cu of CURSOS){
    const u=document.createElement("div"); u.className="unit"+(cu.locked?" locked":"");
    u.innerHTML="<div><span></span><br><b></b></div><div></div>";
    u.querySelector("span").textContent=cu.unidad; u.querySelector("b").textContent=cu.nombre;
    box.append(u);
    if(cu.locked){
      const n=document.createElement("p"); n.className="sub-h"; n.style.margin="2px 0 0";
      n.textContent="Cuando llegue otra planta a casa, pídanle a Claude que la agregue y se abre esta unidad con sus lecciones y datos.";
      u.lastChild.innerHTML=ICON.candado; u.lastChild.style.width="24px"; box.append(n); continue;
    }
    const L=cu.lecciones(), hechas=L.filter(l=>aprendidas.has(l.id)).length;
    u.lastChild.textContent=`${hechas}/${L.length}`; u.lastChild.style.fontWeight="800";
    const path=document.createElement("div"); path.className="path";
    let nextMarcado=false;
    L.forEach((l,i)=>{
      const done=aprendidas.has(l.id), next=!done&&!nextMarcado; if(next) nextMarcado=true;
      const n=document.createElement("div"); n.className="node"+(done?" done":next?" next":" lockd");
      n.style.paddingLeft=[0,36,64,36][i%4]+"px";
      n.innerHTML=`<i>${done?ICON.leccion:next?ICON.dato:ICON.candado}</i><span></span>`;
      n.querySelector("span").textContent= done ? l.q.replace(/…$/,"") : next ? "Siguiente lección: en tus misiones de hoy" : `Lección ${i+1}`;
      path.append(n);
    });
    box.append(path);
  }
  const al=$("album"); al.innerHTML="";
  const vistos=new Set(entradas.filter(e=>e.tipo==="dato").map(e=>e.nota));
  for(const d of DATOS){
    if(vistos.has(d.id)){
      const det=document.createElement("details"); det.className="fact";
      det.innerHTML=`<summary>${ICON.dato}<span></span></summary><p></p>`;
      det.querySelector("span").textContent=d.t; det.querySelector("p").textContent=d.x; al.append(det);
    }
  }
  const faltan=DATOS.length-vistos.size;
  if(faltan>0){ const l=document.createElement("div"); l.className="fact locked"; l.textContent=`${faltan} dato${faltan>1?"s":""} por descubrir. Uno nuevo cada día.`; al.append(l); }
}

/* ---------- premios y tienda ---------- */
function renderPremios(){
  const box=$("badges"); box.innerHTML="";
  for(const b of BADGES){
    const {c,t}=tierDe(b), next=b.t[t];
    const el=document.createElement("div"); el.className="badge t"+t;
    el.innerHTML=`<div class="medal">${ICON[b.icon]}</div><b></b><small></small><div class="minibar"><i></i></div>`;
    el.querySelector("b").textContent=b.name;
    el.querySelector("small").textContent = next ? `${["Sin medalla","Bronce","Plata"][t]} · ${c}/${next}` : "Oro · completo";
    el.querySelector(".minibar i").style.width = (next? Math.min(100,c/next*100) : 100)+"%";
    el.title = next ? `Siguiente medalla: ${next} (+${TIER_MON[t]} monedas)` : "Medalla de oro";
    box.append(el);
  }
}
function renderTienda(saldo){
  const box=$("shop"); box.innerHTML="";
  for(const s of SHOP){
    const owned=tiene(s.id), on=puesto(s.id);
    const el=document.createElement("article"); el.className="item"+(owned&&!s.consumible?" owned":"");
    el.innerHTML=`<div class="thumb">${s.svg}</div><b></b><p></p><div class="price">${COIN_SVG}<span>${s.price}</span></div>`;
    el.querySelector("b").textContent=s.name; el.querySelector("p").textContent=s.desc;
    let btn;
    if(s.consumible){
      const lleno=R.freezesLeft>=2;
      btn=boton(lleno?"Tienes 2":"Comprar","gold",()=>comprar(s,btn));
      btn.disabled = btn.disabled || lleno || saldo<s.price;
    } else if(!owned){
      btn=boton(saldo<s.price?`Faltan ${s.price-saldo}`:"Comprar","gold",()=>comprar(s,btn));
      btn.disabled = btn.disabled || saldo<s.price;
    } else {
      el.querySelector(".price").innerHTML='<span style="color:var(--bract)">Es suya</span>';
      btn=boton(on?"Quitárselo":"Ponérselo",on?"alt":"pink",()=>alternar(s.id));
    }
    el.append(btn); box.append(el);
  }
}
async function comprar(s,btn){
  if(!btn.dataset.sure){ btn.dataset.sure="1"; btn.textContent=`¿Seguro? ${s.price}`; setTimeout(()=>{ if(btn.isConnected&&btn.dataset.sure){ delete btn.dataset.sure; btn.textContent="Comprar"; } },3500); return; }
  btn.disabled=true;
  try{
    if(monedas()<s.price){ toast("No alcanzan las monedas todavía."); return; }
    await db.collection("compras").add({item:s.id, costo:s.price, fecha:new Date().toISOString(), quien:miId||null});
    if(!s.consumible) await guardarEquipo(conExclusivos([...(equipado||compras.map(c=>c.item)), s.id], s.id));
    monedasFx(); toast(s.consumible?"Protector de racha listo":`¡Le regalaste ${s.name.toLowerCase()} a Ciruquis!`);
  }catch(_){ toast("No se pudo comprar. Intenta de nuevo."); btn.disabled=false; }
}
const COLORES = SHOP.filter(x=>x.grupo==="color").map(x=>x.id);
function conExclusivos(lista,id){ return COLORES.includes(id) ? lista.filter(x=>!COLORES.includes(x)||x===id) : lista; }
async function alternar(id){
  const base = equipado || compras.map(c=>c.item);
  const nuevo = base.includes(id) ? base.filter(x=>x!==id) : conExclusivos([...base,id],id);
  try{ await guardarEquipo(nuevo); }catch(_){ toast("No se pudo cambiar. Intenta de nuevo."); }
}
function guardarEquipo(lista){ return db.collection("ajustes").doc("ciruquis").set({equipado:[...new Set(lista)]}); }

/* ---------- equipo y diario ---------- */
function nombreDe(id){ if(!id) return "Claude"; const p=perfiles[id]; return (p&&p.name)? p.name.split(" ")[0] : (id===miId?"Tú":"Alguien"); }
function renderEquipo(){
  const tot={}; for(const e of entradas){ const k=e.quien||"_"; tot[k]=(tot[k]||0)+PTS(e); }
  const box=$("team"); box.innerHTML="";
  const ks=Object.keys(tot).sort((a,b)=>tot[b]-tot[a]);
  if(!ks.length){ box.innerHTML='<div class="member"><span>Aún no hay puntos. ¡El primer cuidado los estrena!</span></div>'; return; }
  for(const k of ks){
    const d=document.createElement("div"); d.className="member";
    const b=document.createElement("b"); b.textContent=tot[k];
    const s=document.createElement("span"); s.textContent=(k==="_"?"Anotados por Claude":nombreDe(k))+" · puntos";
    d.append(b,s); box.append(d);
  }
}
function renderLog(){
  const ul=$("log"); ul.innerHTML="";
  if(!db){ ul.innerHTML='<li class="empty">El diario no está disponible en esta vista. Ábrelo desde Claude con tu cuenta.</li>'; return; }
  if(!entradas.length){ ul.innerHTML='<li class="empty">Todavía no hay cuidados. Completa una misión y aparecerá aquí.</li>'; return; }
  for(const e of entradas.slice(0,mostrar)){
    const li=document.createElement("li"), f=new Date(e.fecha);
    li.innerHTML=`<div class="ico">${ICON[e.tipo]||ICON.nota}</div><div class="txt"><div class="t"></div><div class="m"></div></div><span class="x"></span>`;
    li.querySelector(".t").textContent=TXT[e.tipo]||"Nota";
    li.querySelector(".m").textContent=f.toLocaleDateString("es-PE",{weekday:"short",day:"numeric",month:"short"})+" · "+nombreDe(e.quien);
    const extra = e.tipo==="dato" ? (DATOS.find(d=>d.id===e.nota)||{}).t : e.tipo==="revision"&&e.nota==="humeda"?"Tierra aún húmeda" : e.tipo==="leccion"?(e.ok===false?"Respuesta para repasar":"Respuesta correcta") : (e.nota||"");
    if(extra){ const n=document.createElement("div"); n.className="n"; n.textContent=extra; li.querySelector(".txt").append(n); }
    li.querySelector(".x").textContent="+"+MON(e)+" mon.";
    if(puedeEscribir){
      const d=document.createElement("button"); d.type="button"; d.className="del"; d.textContent="Borrar";
      d.onclick=()=>{
        if(d.dataset.sure){ db.collection("registro").doc(e.id).delete().catch(()=>toast("No se pudo borrar. Intenta de nuevo.")); }
        else { d.dataset.sure="1"; d.textContent="¿Seguro?"; setTimeout(()=>{ if(d.isConnected){ delete d.dataset.sure; d.textContent="Borrar"; } },3000); }
      };
      li.append(d);
    }
    ul.append(li);
  }
  if(entradas.length>mostrar){ const b=document.createElement("button"); b.className="more"; b.type="button"; b.textContent="Ver más"; b.onclick=()=>{mostrar+=10; renderLog();}; const li=document.createElement("li"); li.style.padding="0"; li.append(b); ul.append(li); }
}

/* ---------- render ---------- */
function render(){
  R=calcularRacha();
  const st=estado(), xp=entradas.reduce((s,e)=>s+PTS(e),0), lv=nivel(xp), saldo=monedas();
  $("coins").textContent=Math.max(0,saldo);
  renderRacha();
  dibujarCiruquis(st.mood, lv.i); moverReloj(); $("abu").textContent=horaAbuelita();
  const [a,b]=mensaje(st); const bub=$("bubble"); bub.innerHTML=""; bub.append(a); const sm=document.createElement("small"); sm.textContent=b; bub.append(sm);
  const pill=$("moodPill"); pill.className="mood-pill "+st.mood; pill.textContent={feliz:"Feliz",sed:"Con un poco de sed",agua:"Sedienta",rescate:"Necesita rescate"}[st.mood];
  $("levelName").textContent="Nivel "+(lv.i+1)+" · "+lv.name;
  $("levelNext").textContent= lv.nxt? `${xp} / ${lv.nxt} pts` : `${xp} pts`;
  requestAnimationFrame(()=>{$("levelBar").style.width=lv.pct+"%";});
  const tiers=BADGES.reduce((s,b)=>s+tierDe(b).t,0);
  if(cargado){
    if(lv.i>prev.level){ toast(`¡Subió de nivel! Ciruquis ahora es ${lv.name}`); confeti(40); $("buga").classList.add("pop"); }
    else if(tiers>prev.tiers){ setTimeout(()=>{toast("¡Nueva medalla! Mira tus premios"); monedasFx();},900); }
    else { const h=HITOS.find(([d])=>d===R.cur); if(h && R.cur>prev.streak) setTimeout(()=>{toast(`¡${h[0]} días de racha! +${h[1]} monedas`); monedasFx();},900); }
  }
  prev={level:lv.i,tiers,streak:R.cur};
  renderMisiones(); renderCurso(); renderPremios(); renderTienda(saldo); renderEquipo(); renderLog();
}

/* ---------- efectos ---------- */
function centro(){ const r=$("buga").getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height*0.35,w:r.width}; }
function gotas(){ const c=centro(); for(let i=0;i<14;i++){ const d=document.createElement("div"); d.className="drop"; d.style.left=(c.x-c.w*0.3+Math.random()*c.w*0.6)+"px"; d.style.top=(c.y-90+Math.random()*30)+"px"; d.style.animationDelay=(Math.random()*0.5)+"s"; $("fx").append(d); setTimeout(()=>d.remove(),1600);} }
function lanzar(cls,n,origen){ for(let i=0;i<n;i++){ const p=document.createElement("div"); p.className=cls; p.style.left=origen.x+"px"; p.style.top=origen.y+"px"; const ang=Math.random()*Math.PI*2, dist=80+Math.random()*120; p.style.setProperty("--dx",Math.cos(ang)*dist+"px"); p.style.setProperty("--dy",(Math.sin(ang)*dist-40)+"px"); p.style.setProperty("--r",(Math.random()*540-270)+"deg"); if(cls==="petal"&&i%3===0) p.style.background="var(--sun)"; $("fx").append(p); setTimeout(()=>p.remove(),1500);} }
const confeti = (n=22) => lanzar("petal",n,centro());
function monedasFx(){ const r=$("coins").getBoundingClientRect(); lanzar("coinfx",10,{x:r.left+r.width/2,y:r.top+r.height/2}); }
let tt; function toast(t){ const el=$("toast"); el.textContent=t; el.classList.add("show"); clearTimeout(tt); tt=setTimeout(()=>el.classList.remove("show"),2800); }

const GRACIAS={dato:"¡Nuevo dato en tu álbum, Teté!",riego:"¡Glu glu! Ciruquis te lo agradece",revision:"Anotado: tierra húmeda, sin regar",plagas:"Patrulla completada",abono:"¡Vitaminas para Ciruquis!",brotes:"¡Qué emoción, brotes nuevos!",leccion:"Lección completada",poda:"Poda anotada"};
async function guardar(tipo,nota,extra={}){
  if(!db) return;
  const e={tipo,nota:nota||"",fecha:new Date().toISOString(),quien:miId||null,...extra};
  try{
    await db.collection("registro").add(e);
    if(tipo==="riego") gotas(); else confeti();
    monedasFx();
    toast(`+${MON(e)} monedas · ${GRACIAS[tipo]||"Guardado"}`);
  }catch(err){
    if(err&&(err.code==="permission-denied")){ puedeEscribir=false; toast("Tu cuenta solo puede ver a Ciruquis."); render(); }
    else toast("No se pudo guardar. Revisa la conexión e intenta de nuevo.");
  }
}


/* ---------- semilla: historial traído del registro en Claude ---------- */
const SEMILLA = [
  {id:"riego-2026-10-30", tipo:"riego", nota:"", fecha:"2026-10-30T17:00:00.000Z", quien:null},
  {id:"riego-2026-11-13", tipo:"riego", nota:"Riego a fondo después de 2 semanas sin agua; hojas caídas y sin brácteas.", fecha:"2026-11-13T17:00:00.000Z", quien:null},
  {id:"poda-2026-11-13", tipo:"poda", nota:"Cortada la rama con hojas negras (quemada junto al vidrio) y aflojada la cinta azul de la base del tronco.", fecha:"2026-11-13T18:00:00.000Z", quien:null},
  {id:"riego-2026-11-17", tipo:"riego", nota:"", fecha:"2026-11-17T23:00:00.000Z", quien:null}
];
async function sembrar(){
  const m=db.collection("ajustes").doc("migracion");
  const s=await m.get();
  if(s.exists) return;
  const b=db.batch();
  SEMILLA.forEach(({id,...d})=>b.set(db.collection("registro").doc(id),d));
  b.set(m,{hecho:new Date().toISOString()});
  await b.commit();
}

/* ---------- avisos (Firebase Cloud Messaging) e instalación ---------- */
const CFG = self.CIRUQUIS_CONFIG;
let swReg=null, installEvt=null, messaging=null;
const esStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;
window.addEventListener("beforeinstallprompt", e=>{ e.preventDefault(); installEvt=e; renderSetup(); });
window.addEventListener("appinstalled", ()=>{ installEvt=null; toast("¡Ciruquis ya vive en tu celular!"); renderSetup(); });

async function registrarToken(pedir){
  if(!messaging || !swReg || !("Notification" in window)) return false;
  if(pedir){ const p=await Notification.requestPermission(); if(p!=="granted"){ renderSetup(); return false; } }
  if(Notification.permission!=="granted") return false;
  try{
    const token=await messaging.getToken({vapidKey:CFG.vapidKey, serviceWorkerRegistration:swReg});
    if(token){ await db.collection("tokens").doc(token).set({uid:miId, creado:new Date().toISOString(), agente:navigator.userAgent.slice(0,120)}); }
    return !!token;
  }catch(e){ console.warn("token", e); return false; }
}
function renderSetup(){
  const box=$("setup"), btns=$("setupBtns"); btns.innerHTML="";
  const permiso = "Notification" in window ? Notification.permission : "unsupported";
  if(!esStandalone() && installEvt){
    box.hidden=false; $("setupTitle").textContent="Llévame en tu celular, Teté";
    $("setupText").textContent="Instálame y quedo en tu pantalla de inicio, como cualquier app.";
    btns.append(boton("Instalar Ciruquis","plum",async()=>{ installEvt.prompt(); await installEvt.userChoice; installEvt=null; renderSetup(); }));
    btns.lastChild.disabled=false; return;
  }
  if(permiso==="default" && messaging){
    box.hidden=false; $("setupTitle").textContent="Déjame avisarte, Teté";
    $("setupText").textContent="Te mando un mensajito solo cuando tenga sed o tu racha esté en peligro. Nada más.";
    btns.append(boton("Activar avisos","plum",async()=>{ const ok=await registrarToken(true); if(ok){ toast("¡Listo! Te avisaré cuando te necesite"); confeti(); } renderSetup(); }));
    btns.lastChild.disabled=false; return;
  }
  if(permiso==="denied"){
    box.hidden=false; $("setupTitle").textContent="Los avisos están apagados";
    $("setupText").textContent="Para encenderlos: mantén presionado el ícono de Ciruquis → Información de la app → Notificaciones → Permitir.";
    return;
  }
  box.hidden=true;
}

/* ---------- arranque ---------- */
render();
firebase.initializeApp(CFG.firebase);
const auth=firebase.auth();
db=firebase.firestore();
db.enablePersistence({synchronizeTabs:true}).catch(()=>{});
try{ if(firebase.messaging.isSupported()) messaging=firebase.messaging(); }catch(_){ messaging=null; }
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js").then(r=>{ swReg=r; renderSetup(); if(miId) registrarToken(false); }).catch(e=>console.warn("sw",e));
}
if(messaging) messaging.onMessage(p=>{ const d=p.data||{}; toast(d.body||d.title||"Ciruquis te habla"); });

function mostrarLogin(msg){
  $("login").hidden=false;
  $("loginErr").hidden=!msg; $("loginErr").textContent=msg||"";
  $("salirLogin").hidden=!msg; $("gbtn").hidden=!!msg;
}
$("gbtn").onclick=async()=>{
  const p=new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({prompt:"select_account"});
  try{ await auth.signInWithPopup(p); }
  catch(e){
    if(["auth/popup-blocked","auth/operation-not-supported-in-this-environment","auth/cancelled-popup-request"].includes(e.code)) auth.signInWithRedirect(p);
    else if(e.code!=="auth/popup-closed-by-user") mostrarLogin("No se pudo entrar. Revisa tu conexión e intenta otra vez.");
  }
};
const salir=()=>auth.signOut().then(()=>location.reload());
$("salir").onclick=salir; $("salirLogin").onclick=salir;

let arrancado=false;
auth.onAuthStateChanged(async u=>{
  if(!u){ mostrarLogin(); return; }
  miId=u.uid;
  try{
    await db.collection("personas").doc(u.uid).set({nombre:u.displayName||"", foto:u.photoURL||""},{merge:true});
  }catch(e){
    if(e.code==="permission-denied"){ mostrarLogin(`La cuenta ${u.email} no tiene permiso para cuidar a Ciruquis.`); return; }
  }
  $("login").hidden=true;
  if(arrancado) return; arrancado=true;
  try{ await sembrar(); }catch(e){ console.warn("semilla",e); }
  registrarToken(false); renderSetup();
  let listos=0;
  const marcar=(()=>{ const vistos=new Set(); return k=>{ if(!vistos.has(k)){ vistos.add(k); listos++; } if(listos>=3){ render(); cargado=true; } }; })();
  db.collection("personas").onSnapshot(s=>{ s.docs.forEach(d=>{ perfiles[d.id]={name:d.data().nombre||""}; }); if(cargado) render(); });
  db.collection("registro").orderBy("fecha","desc").limit(500).onSnapshot(snap=>{
    entradas=snap.docs.map(d=>({id:d.id,...d.data()})); marcar("r");
  },()=>toast("Se perdió la conexión. Revisa tu internet."));
  db.collection("compras").onSnapshot(snap=>{ compras=snap.docs.map(d=>({id:d.id,...d.data()})); marcar("c"); },()=>marcar("c"));
  db.collection("ajustes").onSnapshot(snap=>{ const d=snap.docs.find(x=>x.id==="ciruquis"); equipado = d ? (d.data().equipado||[]) : null; marcar("a"); },()=>marcar("a"));
});
