/* Contenido del jardín: íconos, lecciones, datos curiosos, medallas y tienda. */
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
const TXT = {riego:"Riego",revision:"Prueba del dedo",abono:"Abono",plagas:"Patrulla de plagas",poda:"Poda",leccion:"Lección",brotes:"Brotes nuevos",dato:"Dato curioso",practica:"Práctica",juego:"Memoria del jardín",foto:"Foto de seguimiento",nota:"Nota"};
const LEVELS = [[0,"Semilla"],[30,"Brote"],[80,"Plantita"],[160,"Arbusto"],[300,"Floración"],[500,"Abuelita sabia"],[800,"Reina del balcón"]];
/* puntos (nivel) y monedas (tienda) por tipo de cuidado */
const PTS = e => ({riego:10,revision:5,abono:15,poda:15,plagas:10,brotes:10,nota:2,dato:3,leccion:e.ok===false?1:5})[e.tipo] ?? 0;
const MON = e => (e.tipo==="practica"||e.tipo==="juego") ? (e.monedas||0) : (({riego:10,revision:5,abono:15,poda:12,plagas:8,brotes:10,foto:5,dato:3,leccion:e.ok===false?1:5})[e.tipo] ?? 0);
const HITOS = [[3,10],[7,25],[14,40],[30,100],[60,150],[100,300]];
const TIER_MON = [15,30,60];

/* Cuidado = familia; aprendizaje = cada persona */
const CUIDADO = ["riego","revision","plagas","abono","poda","brotes","foto"];
const APRENDE = ["leccion","dato","practica","juego"];
const HITOS_A = [[3,10],[7,20],[14,35],[30,80],[60,120]];
/* c = {F: cuidados de todos, M: mis entradas, MC: mis cuidados, RF: racha familiar, RA: mi racha de aprendizaje} */
const BADGES_F = [
  {k:"riego", name:"Regadores del balcón", t:[3,10,30], icon:"riego", count:c=>c.F.filter(e=>e.tipo==="riego").length},
  {k:"plagas", name:"Detectives de plagas", t:[2,6,15], icon:"plagas", count:c=>c.F.filter(e=>e.tipo==="plagas").length},
  {k:"abono", name:"Chefs del jardín", t:[1,5,12], icon:"abono", count:c=>c.F.filter(e=>e.tipo==="abono").length},
  {k:"poda", name:"Tijeras de oro", t:[1,3,8], icon:"poda", count:c=>c.F.filter(e=>e.tipo==="poda").length},
  {k:"racha", name:"Llama eterna", t:[7,30,100], icon:"racha", count:c=>c.RF.best}
];
const BADGES_P = [
  {k:"leccion", name:"Sabia como Ciruquis", t:[3,10,30], icon:"leccion", count:c=>new Set(c.M.filter(e=>e.tipo==="leccion"&&e.ok!==false).map(e=>e.nota)).size},
  {k:"dato", name:"Coleccionista curiosa", t:[5,12,16], icon:"dato", count:c=>new Set(c.M.filter(e=>e.tipo==="dato").map(e=>e.nota)).size},
  {k:"constante", name:"Mente constante", t:[3,7,30], icon:"aprender", count:c=>c.RA.best},
  {k:"manoverde", name:"Mano verde", t:[5,20,60], icon:"maceta", count:c=>c.MC.length, bolsa:"familia"}
];
/* Tienda personal: se paga con lo que cada uno aprende */
const MARCO_SVG = {
  flores:'<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="none" stroke="#E5338F" stroke-width="4"/>'+[0,72,144,216,288].map(a=>`<g transform="rotate(${a} 20 20)"><circle cx="20" cy="5" r="4" fill="#F7A8CF"/><circle cx="20" cy="5" r="1.6" fill="#FFF8E6"/></g>`).join("")+'</svg>',
  tejido:'<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="none" stroke="#7A2457" stroke-width="5"/><circle cx="20" cy="20" r="15" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-dasharray="3 3"/></svg>',
  dorado:'<svg viewBox="0 0 40 40"><defs><linearGradient id="gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE38A"/><stop offset=".5" stop-color="#D9A400"/><stop offset="1" stop-color="#FFF2B8"/></linearGradient></defs><circle cx="20" cy="20" r="15" fill="none" stroke="url(#gd)" stroke-width="5"/><path d="M20 1l2 4h-4z" fill="#D9A400"/></svg>',
  hojas:'<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="none" stroke="#2F7A4F" stroke-width="3"/>'+[20,80,140,200,260,320].map(a=>`<ellipse cx="20" cy="5.5" rx="2.6" ry="4.5" fill="#4FB377" transform="rotate(${a} 20 20)"/>`).join("")+'</svg>'
};
const SHOP_P = [
  {id:"marco-flores", tipo:"marco", valor:"flores", name:"Marco de bugambilias", price:25, desc:"Flores fucsias alrededor de tu foto.", svg:MARCO_SVG.flores},
  {id:"marco-hojas", tipo:"marco", valor:"hojas", name:"Marco de hojitas", price:25, desc:"Una coronita verde para tu foto.", svg:MARCO_SVG.hojas},
  {id:"marco-tejido", tipo:"marco", valor:"tejido", name:"Marco tejido", price:40, desc:"Tejido morado, como las chompas de Ciruquis.", svg:MARCO_SVG.tejido},
  {id:"marco-dorado", tipo:"marco", valor:"dorado", name:"Marco dorado", price:80, desc:"Para quien aprende sin parar.", svg:MARCO_SVG.dorado},
  {id:"titulo-bugambilias", tipo:"titulo", valor:"Experta en bugambilias", name:"Título: Experta en bugambilias", price:30, desc:"Aparece bajo tu nombre en el perfil."},
  {id:"titulo-abogada", tipo:"titulo", valor:"Abogada de las plantas", name:"Título: Abogada de las plantas", price:30, desc:"Defiende sus derechos a la luz y al agua."},
  {id:"titulo-curiosa", tipo:"titulo", valor:"Curiosa sin remedio", name:"Título: Curiosa sin remedio", price:20, desc:"Para quien no se pierde un dato."},
  {id:"titulo-sabia", tipo:"titulo", valor:"Sabia del jardín", name:"Título: Sabia del jardín", price:60, desc:"Como la abuelita Ciruquis."},
  {id:"protector-aprendizaje", tipo:"protector", name:"Protector de aprendizaje", price:20, desc:"Salva tu racha de aprendizaje un día. Máximo 2.", consumible:true}
];

const SHOP = [
  {id:"protector", name:"Protector de racha familiar", price:30, desc:"Salva la racha del jardín si un día nadie cuida. Máximo 2.", consumible:true,
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

Object.assign(ICON, {
  inicio:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 7.5V21h-6v-6H9v6H3V10.5z"/></svg>',
  aprender:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l11 6 9-4.9V17h2V9zM5 13.2v4L12 21l7-3.8v-4L12 17z"/></svg>',
  premios:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12v2h3v3a5 5 0 0 1-4.5 5A6 6 0 0 1 13 16.9V19h4v2H7v-2h4v-2.1A6 6 0 0 1 7.5 13 5 5 0 0 1 3 8V5h3zm0 4H5v1a3 3 0 0 0 1.2 2.4C6.1 9.9 6 9.5 6 9zm12 0v2c0 .5-.1.9-.2 1.4A3 3 0 0 0 19 8V7z"/></svg>',
  diario:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h11a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm2 5v2h8V7zm0 4v2h8v-2zm0 4v2h5v-2z"/></svg>',
  perfil:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4.5"/><path d="M3 21c0-4.4 4-7 9-7s9 2.6 9 7z"/></svg>',
  campana:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8a2.5 2.5 0 0 0 2.4 2zm7-6V11a7 7 0 0 0-5.5-6.8V3a1.5 1.5 0 0 0-3 0v1.2A7 7 0 0 0 5 11v5l-2 2v1h18v-1z"/></svg>',
  instalar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M12 7v7M9 11l3 3 3-3"/></svg>',
  libro:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5"/></svg>',
  salir:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/></svg>',
  corazon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/></svg>',
  calendario:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  medalla:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h4l1 4 1-4h4l-3 7a6 6 0 1 1-4 0z"/></svg>',
  tema:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20zm0 2.2v15.6a7.8 7.8 0 0 0 0-15.6z" opacity=".35"/><path d="M12 2a10 10 0 0 0 0 20V2z"/></svg>',
  maceta:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 11c0-4 2-7 7-7 0 4-2 7-7 7zm0 0C9 11 5 9 5 4c4 0 7 3 7 7zM5 12h14l-2 9H7z"/></svg>'
});

/* Monedas: la de la familia es fucsia con una bugambilia; las personales son doradas,
   con Popeye (gatito) para Esthef y Zoe (perrita) para Matias. */
const MONEDA = {
  familia:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#9E1462"/><circle cx="12" cy="12" r="9.2" fill="#D6247F"/>'+[0,120,240].map(r=>`<ellipse cx="12" cy="8.3" rx="2.6" ry="3.8" transform="rotate(${r} 12 12)" fill="#FFE3F0"/>`).join("")+'<circle cx="12" cy="12" r="1.5" fill="#F7C948"/></svg>',
  popeye:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#B57D00"/><circle cx="12" cy="12" r="9.2" fill="#F2B21B"/><path d="M6.6 9.6 L7.4 4.8 L10.3 7.6 Q12 7.1 13.7 7.6 L16.6 4.8 L17.4 9.6 Q18.3 11.4 17.6 13.6 Q16.2 17.4 12 17.4 Q7.8 17.4 6.4 13.6 Q5.7 11.4 6.6 9.6Z" fill="#FFF3C4"/><circle cx="9.6" cy="11.6" r="1.1" fill="#6B4500"/><circle cx="14.4" cy="11.6" r="1.1" fill="#6B4500"/><path d="M11.2 13.4 L12.8 13.4 L12 14.3Z" fill="#E5338F"/><path d="M12 14.3 Q11 15.6 10 15 M12 14.3 Q13 15.6 14 15 M4.8 12.8 L8 13.4 M4.9 14.6 L8 14.2 M19.2 12.8 L16 13.4 M19.1 14.6 L16 14.2" stroke="#6B4500" stroke-width=".8" fill="none" stroke-linecap="round"/></svg>',
  zoe:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#B57D00"/><circle cx="12" cy="12" r="9.2" fill="#F2B21B"/><path d="M8 8.6 Q12 6.4 16 8.6 Q17.6 10.4 17.2 13.4 Q16.4 17.6 12 17.6 Q7.6 17.6 6.8 13.4 Q6.4 10.4 8 8.6Z" fill="#FFF3C4"/><path d="M8.2 8.4 Q5.2 7.6 5 10.8 Q5 13.6 7 14.4 Q7.6 11 8.2 8.4Z" fill="#9C6B12"/><path d="M15.8 8.4 Q18.8 7.6 19 10.8 Q19 13.6 17 14.4 Q16.4 11 15.8 8.4Z" fill="#9C6B12"/><circle cx="9.9" cy="11.6" r="1.1" fill="#6B4500"/><circle cx="14.1" cy="11.6" r="1.1" fill="#6B4500"/><ellipse cx="12" cy="13.9" rx="1.5" ry="1.1" fill="#4A2F00"/><path d="M12 15 L12 15.8 M10.6 16 Q12 16.9 13.4 16" stroke="#6B4500" stroke-width=".8" fill="none" stroke-linecap="round"/><path d="M12 15.9 Q12.4 17.2 12.9 16.2" fill="#E5338F"/></svg>'
};

Object.assign(ICON, {
  sobre:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2.3V17h16V7.3l-8 5.4z"/><path d="M4 6l8 5.6L20 6z" opacity=".55"/></svg>',
  juego:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2" opacity=".55"/><rect x="3" y="13" width="8" height="8" rx="2" opacity=".55"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>',
  practica:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h6l-1 8 9-12h-6z"/></svg>',
  enviar:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5l18-8.5L3 3.5 3 10l12 2-12 2z"/></svg>'
});
/* Banco de práctica: las lecciones de la bugambilia más preguntas generales de plantas */
const PRACTICA_EXTRA = [
  {id:"p-co2",q:"¿Qué gas toman las plantas del aire para hacer la fotosíntesis?",o:["Dióxido de carbono","Oxígeno","Nitrógeno"],a:0,e:"Toman CO₂ del aire y, con luz y agua, fabrican su alimento."},
  {id:"p-oxigeno",q:"Durante la fotosíntesis, las plantas liberan…",o:["Oxígeno","Humo","Dióxido de carbono"],a:0,e:"El oxígeno que respiramos sale en gran parte de la fotosíntesis."},
  {id:"p-clorofila",q:"¿Qué pigmento da el color verde a las hojas?",o:["Caroteno","Clorofila","Antocianina"],a:1,e:"La clorofila atrapa la luz del sol y es verde."},
  {id:"p-raices",q:"¿Por dónde absorbe agua una planta?",o:["Por las flores","Por las raíces","Por las espinas"],a:1,e:"Las raíces absorben agua y nutrientes de la tierra."},
  {id:"p-estomas",q:"Los poros diminutos de las hojas por donde entra y sale el aire se llaman…",o:["Estomas","Nudos","Brácteas"],a:0,e:"Por los estomas entra el CO₂ y sale el vapor de agua."},
  {id:"p-suculenta",q:"¿Por qué las suculentas tienen hojas gorditas?",o:["Para guardar agua","Porque comen mucho","Para dar sombra"],a:0,e:"Almacenan agua en sus hojas para aguantar sequías."},
  {id:"p-sansevieria",q:"La sansevieria es famosa por…",o:["Necesitar riego diario","Aguantar poca luz y poco riego","Dar frutos dulces"],a:1,e:"Es de las plantas más resistentes para interiores."},
  {id:"p-drenaje",q:"¿Qué significa que una tierra drene bien?",o:["Que el agua sobrante sale rápido y no se encharca","Que nunca se moja","Que tiene mucho abono"],a:0,e:"Un buen drenaje evita que las raíces se pudran."},
  {id:"p-agujeros",q:"¿Para qué sirven los agujeros de la maceta?",o:["Para que entren insectos","Para que salga el agua sobrante","Para que respire la maceta"],a:1,e:"Sin agujeros, el agua se acumula y ahoga las raíces."},
  {id:"p-amarillas",q:"Hojas amarillas con la tierra siempre mojada suelen indicar…",o:["Falta de agua","Exceso de riego","Mucho sol"],a:1,e:"El exceso de agua es el error más común con las plantas."},
  {id:"p-potus",q:"¿Cómo son las hojas del potus?",o:["Como agujas","En forma de corazón","Redondas y peludas"],a:1,e:"Tiene hojas acorazonadas y crece colgante o trepadora."},
  {id:"p-orquidea",q:"En la naturaleza, muchas orquídeas crecen…",o:["Sobre los árboles","Bajo el agua","En la arena del mar"],a:0,e:"Son epífitas: se agarran a los árboles sin dañarlos."},
  {id:"p-monstera",q:"A la monstera le dicen costilla de Adán por…",o:["Sus raíces blancas","Los cortes y agujeros de sus hojas","Su tallo duro"],a:1,e:"Sus hojas grandes tienen cortes que recuerdan a costillas."},
  {id:"p-aloe",q:"¿Dónde guarda el aloe vera su gel?",o:["En sus hojas","En sus flores","En sus raíces"],a:0,e:"El gel está dentro de sus hojas gruesas."},
  {id:"p-helecho",q:"Los helechos se reproducen por…",o:["Semillas","Esporas","Bulbos"],a:1,e:"Las esporas son los puntitos que aparecen debajo de sus hojas."},
  {id:"p-nitrogeno",q:"En el abono, el nitrógeno ayuda sobre todo a…",o:["Que crezcan hojas y tallos","Que salgan flores","Que la tierra drene"],a:0,e:"Por eso a la bugambilia no le conviene mucho nitrógeno."},
  {id:"p-hora",q:"En verano, ¿cuál es la mejor hora para regar?",o:["Al mediodía","Temprano en la mañana o al atardecer","A medianoche siempre"],a:1,e:"Con menos calor, el agua no se evapora tan rápido."},
  {id:"p-inviernolima",q:"En el invierno de Lima las plantas necesitan menos agua porque…",o:["Hay menos sol y más humedad","Llueve todos los días","Duermen todo el día"],a:0,e:"Con la panza de burro, la tierra tarda más en secarse."},
  {id:"p-luz",q:"Si una planta se estira e inclina hacia la ventana, es porque…",o:["Busca más luz","Tiene frío","Quiere salir"],a:0,e:"Las plantas crecen hacia la luz. Girar la maceta ayuda."},
  {id:"p-podar",q:"¿Qué es podar?",o:["Cambiar de maceta","Cortar partes para guiar el crecimiento","Regar con abono"],a:1,e:"Una buena poda da plantas más tupidas y con más flores."},
  {id:"p-jabon",q:"¿Para qué sirve el jabón potásico en las plantas?",o:["Para controlar plagas como pulgones","Para que brillen las hojas","Como abono"],a:0,e:"Es una opción suave contra plagas pequeñas."},
  {id:"p-cactus",q:"Los cactus son nativos casi todos de…",o:["América","Europa","La Antártida"],a:0,e:"Desde Canadá hasta la Patagonia, incluido Perú."},
  {id:"p-longeva",q:"¿Cuánto puede vivir una bugambilia bien cuidada?",o:["Un par de meses","Un año","Varias décadas"],a:2,e:"Con cuidados, puede acompañarte muchísimos años."},
  {id:"p-plato",q:"¿Qué pasa si dejas agua en el plato de la maceta por días?",o:["Las raíces pueden pudrirse","La planta crece más rápido","Nada"],a:0,e:"Además atrae mosquitas y zancudos."}
];
const PRACTICA = () => LESSONS.concat(PRACTICA_EXTRA);
const JUEGO_ESPECIES = ["bugambilia","suculenta","potus","sansevieria","orquidea","helecho"];

Object.assign(ICON, {
  foto:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.5 4h7l1.6 2.2H20a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.2a2 2 0 0 1 2-2h2.9zM12 17.2a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0-2a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>',
  compartir:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>'
});
