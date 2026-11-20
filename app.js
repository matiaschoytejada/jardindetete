/* Jardín de Teté — lógica de la app.
   Datos en Firestore: personas, plantas, registro, compras, ajustes, tokens. */
const $ = id => document.getElementById(id);
const el = (tag, cls, html) => { const e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; };
const esc = s => String(s??"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const vibrar = (ms=12) => { try{ navigator.vibrate && navigator.vibrate(ms); }catch(_){} };
const LS = { get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(_){ return d; } }, set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(_){} } };

/* ---------- fechas ---------- */
const day = d => { const x=new Date(d); x.setHours(0,0,0,0); return x; };
const dkey = d => { const x=day(d); return x.getFullYear()+"-"+(x.getMonth()+1)+"-"+x.getDate(); };
const daysBetween = (a,b) => Math.round((day(b)-day(a))/86400000);
const MESES=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

/* ---------- estado ---------- */
let db=null, miId=null, miEmail="", personas={}, plantas=[], entradas=[], compras=[], equipado=null;
let sel = LS.get("planta","ciruquis"), tab="inicio", cargado=false, puedeEscribir=true, mostrar=12, filtro="todas";
let R={cur:0,best:0,todayActive:false,freezesLeft:0,days:{}};
let prev={level:-1,tiers:-1,streak:-1,coins:null};

const COLORES_MACETA=["#7A2457","#2F7A4F","#3C7DD6","#E0A21B","#D9534F","#8E6CCB"];
const LEVELS_G=[[0,"Semilla"],[30,"Brote"],[80,"Plantita"],[160,"Arbusto"],[300,"Frondosa"],[500,"Experta"],[800,"Leyenda del jardín"]];
const plantaDe = e => e.plantaId || "ciruquis";
const yo = () => personas[miId] || {};
const apodo = () => { const p=yo(); return (p.apodo||"").trim() || (p.nombre||"").split(" ")[0] || "Teté"; };
const planta = () => plantas.find(p=>p.id===sel) || plantas[0] || {id:"ciruquis",nombre:"Ciruquis",especie:"bugambilia",color:"#7A2457"};
const esp = p => ESPECIES[p.especie] || ESPECIES.otra;
const esCiruquis = p => p && p.id==="ciruquis";
const entradasDe = id => entradas.filter(e=>plantaDe(e)===id);
const esAgua = e => e.tipo==="riego" || (e.tipo==="revision" && e.nota==="humeda");

function estadoPlanta(p){
  const t=temporadaLima(new Date()), max=esp(p).riego[t.k];
  const ref=entradasDe(p.id).find(esAgua);
  if(!ref) return {mood:"agua", d:null, max, t};
  const d=daysBetween(ref.fecha,new Date());
  const mood = d<=Math.max(0,max-2) ? "feliz" : d<=max ? "sed" : d<=max*2 ? "agua" : "rescate";
  return {mood,d,max,t};
}
const esCuidado = e => CUIDADO.includes(e.tipo);
const esAprende = e => APRENDE.includes(e.tipo);
let RA={cur:0,best:0,todayActive:false,freezesLeft:0,days:{}}, CTX={F:[],M:[],MC:[],RF:R,RA}, premiosVista="familia";
function rachaDe(lista,protC){
  const activos=new Set(lista.map(e=>dkey(e.fecha)));
  const prot=protC.map(c=>day(c.fecha)).sort((a,b)=>a-b);
  const res={cur:0,best:0,todayActive:activos.has(dkey(new Date())),freezesLeft:0,days:{}};
  if(!activos.size){ res.freezesLeft=prot.length; return res; }
  const primero=day(lista[lista.length-1].fecha), hoy=day(new Date());
  let s=0, usados=0;
  for(let d=new Date(primero); d<hoy; d.setDate(d.getDate()+1)){
    const k=dkey(d);
    if(activos.has(k)){ s++; res.days[k]="on"; }
    else { const disp=prot.filter(p=>p<=d).length-usados; if(s>0&&disp>0){ usados++; res.days[k]="frz"; } else { s=0; res.days[k]="off"; } }
    res.best=Math.max(res.best,s);
  }
  if(res.todayActive){ s++; res.days[dkey(hoy)]="on"; }
  res.cur=s; res.best=Math.max(res.best,s); res.freezesLeft=prot.length-usados;
  return res;
}
const misAprend = (uid=miId) => entradas.filter(e=>esAprende(e)&&e.quien===uid);
const protA = uid => compras.filter(c=>c.item==="protector-aprendizaje"&&c.quien===uid);
function ctxDe(uid,rf){ const M=entradas.filter(e=>e.quien===uid); return {F:entradas.filter(esCuidado),M,MC:M.filter(esCuidado),RF:rf,RA:rachaDe(M.filter(esAprende),protA(uid))}; }
function calcularRachas(){
  R=rachaDe(entradas.filter(esCuidado),compras.filter(c=>c.item==="protector"));
  CTX=ctxDe(miId,R); RA=CTX.RA;
}
function tierDe(b,c=CTX){ const n=b.count(c); let t=0; b.t.forEach((th,i)=>{ if(n>=th) t=i+1; }); return {c:n,t}; }
const premioDe = t => { let m=0; for(let i=0;i<t;i++) m+=TIER_MON[i]; return m; };
/* Monedas de la familia: cuidados de todos, hitos de la racha familiar, medallas familiares y la "Mano verde" de cada uno */
function monedasFam(){
  let m=entradas.filter(esCuidado).reduce((s,e)=>s+MON(e),0);
  HITOS.forEach(([d,b])=>{ if(R.best>=d) m+=b; });
  BADGES_F.forEach(b=>{ m+=premioDe(tierDe(b).t); });
  const gente=new Set([...Object.keys(personas),...entradas.map(e=>e.quien).filter(Boolean)]);
  gente.forEach(uid=>{ const c=uid===miId?CTX:ctxDe(uid,R); BADGES_P.filter(b=>b.bolsa==="familia").forEach(b=>{ m+=premioDe(tierDe(b,c).t); }); });
  return m - compras.filter(c=>c.bolsa!=="personal").reduce((s,c)=>s+(c.costo||0),0);
}
/* Monedas personales: lo que cada uno aprende */
function monedasPer(){
  let m=misAprend().reduce((s,e)=>s+MON(e),0);
  HITOS_A.forEach(([d,b])=>{ if(RA.best>=d) m+=b; });
  BADGES_P.filter(b=>b.bolsa!=="familia").forEach(b=>{ m+=premioDe(tierDe(b).t); });
  return m - compras.filter(c=>c.bolsa==="personal"&&c.quien===miId).reduce((s,c)=>s+(c.costo||0),0);
}
const monedas = monedasFam;
function nivelDe(p){
  const xp=entradasDe(p.id).filter(esCuidado).reduce((s,e)=>s+PTS(e),0), L=esCiruquis(p)?LEVELS:LEVELS_G;
  let i=0; while(i<L.length-1 && xp>=L[i+1][0]) i++;
  const cur=L[i][0], nxt=L[i+1]?L[i+1][0]:null;
  return {i,xp,name:L[i][1],nxt,pct:nxt?(xp-cur)/(nxt-cur)*100:100};
}
const COLORES = SHOP.filter(x=>x.grupo==="color").map(x=>x.id);
const tiene = id => compras.some(c=>c.item===id&&c.bolsa!=="personal");
const tieneP = id => compras.some(c=>c.item===id&&c.quien===miId);
const puesto = id => { if(!tiene(id)) return false; if(equipado) return equipado.includes(id); const ult=compras.filter(c=>COLORES.includes(c.item)).map(c=>c.item).pop(); return SHOP.find(x=>x.id===id)?.grupo==="color" ? id===ult : true; };

/* ---------- dibujos de plantas ---------- */
function bractG(x,y,s,fill="#E5338F"){
  return `<g class="bract">${[0,120,240].map(r=>`<ellipse cx="${x}" cy="${y-8*s}" rx="${7*s}" ry="${11*s}" transform="rotate(${r} ${x} ${y})" fill="${fill}" opacity=".92"/>`).join("")}<circle cx="${x}" cy="${y}" r="${2.6*s}" fill="#FFF8E6"/></g>`;
}
function copaSVG(forma,lvl){
  const L="#3E9A62", L2="#5DB57F";
  if(forma==="flor"){
    const spots=[[92,64],[148,76],[52,74],[120,62],[70,58],[160,92],[38,92]];
    return `<path d="M100 150 C100 120 96 100 92 70" stroke="#7A5C44" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M99 120 C115 105 130 98 146 80" stroke="#7A5C44" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M98 112 C84 100 70 92 54 78" stroke="#7A5C44" stroke-width="4" fill="none" stroke-linecap="round"/>
    <g fill="${L}"><ellipse cx="72" cy="104" rx="14" ry="8" transform="rotate(25 72 104)"/><ellipse cx="128" cy="108" rx="14" ry="8" transform="rotate(-25 128 108)"/><ellipse cx="88" cy="86" rx="12" ry="7" transform="rotate(-35 88 86)"/><ellipse cx="114" cy="90" rx="12" ry="7" transform="rotate(30 114 90)"/></g>`+spots.slice(0,Math.min(7,lvl+2)).map(([x,y])=>bractG(x,y,1)).join("");
  }
  if(forma==="suculenta"){
    let g=""; const rings=[[44,28,8,"#4C9A6E"],[34,22,7,"#62B384"],[22,16,6,"#7CC79A"]];
    rings.forEach(([rx,ry,n,c],k)=>{ for(let i=0;i<n;i++){ const a=i*360/n+k*20; g+=`<ellipse cx="100" cy="${132-ry}" rx="${10-k}" ry="${ry}" transform="rotate(${a} 100 132)" fill="${c}" stroke="#2F6E4A" stroke-width="1.2"/>`; } });
    return g+`<circle cx="100" cy="132" r="6" fill="#9ED9B4"/>`+(lvl>=3?`<circle cx="100" cy="92" r="6" fill="#F7A8CF"/><path d="M100 98v20" stroke="#4C9A6E" stroke-width="3"/>`:"");
  }
  if(forma==="espada"){
    const hojas=[[-26,96,"#3E8E5E"],[-12,70,"#4FA270"],[2,58,"#3E8E5E"],[16,74,"#4FA270"],[30,98,"#3E8E5E"]];
    return hojas.map(([dx,top,c])=>`<path d="M${100+dx*.5-9} 146 Q${100+dx*.8-10} ${(146+top)/2} ${100+dx} ${top} Q${100+dx*.8+10} ${(146+top)/2} ${100+dx*.5+9} 146Z" fill="${c}"/><path d="M${100+dx*.5-4} 140 Q${100+dx*.7} ${(146+top)/2} ${100+dx} ${top+10}" stroke="#E6D27A" stroke-width="1.6" fill="none" opacity=".7"/>`).join("");
  }
  if(forma==="orquidea"){
    const flor=(x,y)=>`<g class="bract">${[0,72,144,216,288].map(r=>`<ellipse cx="${x}" cy="${y-8}" rx="6" ry="9" transform="rotate(${r} ${x} ${y})" fill="#F4E9F7" stroke="#C987D6" stroke-width="1.2"/>`).join("")}<circle cx="${x}" cy="${y}" r="4" fill="#C8177A"/></g>`;
    return `<path d="M104 146 C108 110 120 80 142 62" stroke="#5B7A4A" stroke-width="3.5" fill="none"/>
    <ellipse cx="80" cy="138" rx="26" ry="10" fill="${L}" transform="rotate(-12 80 138)"/><ellipse cx="122" cy="140" rx="26" ry="10" fill="${L2}" transform="rotate(14 122 140)"/>`+[[118,96],[132,76],[146,60]].slice(0,Math.min(3,lvl+1)).map(([x,y])=>flor(x,y)).join("");
  }
  if(forma==="helecho"){
    const fronda=(ang,len)=>{ let g=`<g transform="rotate(${ang} 100 146)"><path d="M100 146 Q104 ${146-len*.6} 100 ${146-len}" stroke="#3E8E5E" stroke-width="3" fill="none"/>`; for(let i=1;i<9;i++){ const y=146-len*i/9; const w=10-i*.8; g+=`<ellipse cx="${100-w}" cy="${y}" rx="${w}" ry="3.2" fill="#55AE78"/><ellipse cx="${100+w}" cy="${y}" rx="${w}" ry="3.2" fill="#55AE78"/>`; } return g+"</g>"; };
    return fronda(-50,70)+fronda(50,70)+fronda(-25,86)+fronda(25,86)+fronda(0,94);
  }
  // hojas (potus, monstera, otra)
  const hoja=(x,y,r,s)=>`<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 0 C-16 -10 -16 -32 0 -40 C16 -32 16 -10 0 0Z" fill="${L}"/><path d="M0 -3 V-36" stroke="#2F6E4A" stroke-width="1.6"/></g>`;
  return `<path d="M100 146 C96 120 90 104 84 92 M100 146 C104 118 112 102 120 90 M100 146 C100 124 100 108 100 84" stroke="#4E7A3A" stroke-width="3" fill="none"/>`+hoja(84,94,-30,1)+hoja(120,92,30,1)+hoja(100,86,0,1.1)+hoja(70,122,-60,.85)+hoja(132,122,60,.85)+(lvl>=2?hoja(62,100,-50,.7)+hoja(140,100,50,.7):"");
}
function caraSVG(mood,lentes){
  const ink="var(--ink)";
  const ojos = mood==="feliz" ? `<path d="M79 175 q5 -6 10 0 M111 175 q5 -6 10 0" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : mood==="rescate" ? `<path d="M80 170 l8 7 M88 170 l-8 7 M112 170 l8 7 M120 170 l-8 7" stroke="${ink}" stroke-width="2.8" stroke-linecap="round"/>`
    : `<g class="blink"><circle cx="84" cy="173" r="3.8" fill="${ink}"/><circle cx="116" cy="173" r="3.8" fill="${ink}"/></g>`;
  const boca={feliz:"M90 190 Q100 200 110 190", sed:"M91 193 L109 193", agua:"M90 197 Q100 188 110 197", rescate:"M92 198 Q100 190 108 198"}[mood];
  return ojos+(lentes?`<g fill="none" stroke="${ink}" stroke-width="2.4"><circle cx="84" cy="173" r="10"/><circle cx="116" cy="173" r="10"/><path d="M94 172 Q100 168 106 172"/></g>`:"")+
    `<ellipse cx="72" cy="188" rx="7" ry="4" fill="#E5338F" opacity=".3"/><ellipse cx="128" cy="188" rx="7" ry="4" fill="#E5338F" opacity=".3"/><path d="${boca}" stroke="${lentes?"#6B1D4F":ink}" stroke-width="${lentes?4.4:3.4}" fill="none" stroke-linecap="round"/>`+
    ((mood==="agua"||mood==="rescate")?`<path d="M122 182 q4 7 0 10 q-4 -3 0 -10z" fill="#4AA3E0"/>`:"");
}
function plantaSVG(p,mood,lvl,{mini=false}={}){
  const color=p.color||"#7A2457", f=esp(p).forma;
  const pot=`<path d="M52 148 H148 L138 206 Q137 212 130 212 H70 Q63 212 62 206 Z" fill="var(--pot)" stroke="var(--pot-line)" stroke-width="3"/><rect x="46" y="140" width="108" height="15" rx="6" fill="${color}"/>`;
  if(mini) return `<svg viewBox="30 30 150 190" aria-hidden="true"><rect x="30" y="30" width="150" height="190" fill="${color}" opacity=".16"/>${copaSVG(f,3)}${pot}${caraSVG("feliz",esCiruquis(p))}</svg>`;
  return `<svg viewBox="0 0 210 230" role="img" aria-label="${esc(p.nombre)}"><g class="plant">${copaSVG(f,lvl)}</g><g class="potg">${pot}${caraSVG(mood,false)}</g></svg>`;
}
const miniDe = p => plantaSVG(p,"feliz",3,{mini:true});

/* Ciruquis usa su dibujo especial (con chompa, ovillo, lentes y regalos de la tienda) */
let ciruquisMontada=false;
function dibujarCiruquis(mood,lvl){
  const box=$("buga");
  if(!ciruquisMontada){ box.innerHTML=""; box.append($("tplCiruquis").content.cloneNode(true)); ciruquisMontada=true; }
  const cls=["buga","mood-"+mood]; SHOP.forEach(s=>{ if(!s.consumible && puesto(s.id)) cls.push("has-"+s.id); });
  box.className=cls.join(" ");
  const g=box.querySelector("#bracts"); g.innerHTML="";
  const spots=[[92,64],[148,76],[52,74],[120,62],[70,58],[160,92],[38,92]];
  const n = mood==="rescate"?0:Math.min(spots.length,lvl+1);
  g.innerHTML = spots.slice(0,n).map(([x,y])=>bractG(x,y,1,"var(--bract)")).join("");
  const eyes=box.querySelector("#eyes");
  if(mood==="feliz") eyes.innerHTML='<path d="M79 175 q5 -6 10 0 M111 175 q5 -6 10 0" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round"/>';
  else if(mood==="rescate") eyes.innerHTML='<path d="M80 170 l8 7 M88 170 l-8 7 M112 170 l8 7 M120 170 l-8 7" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round"/>';
  else eyes.innerHTML='<g class="blink"><circle cx="84" cy="173" r="3.8" fill="var(--ink)"/><circle cx="116" cy="173" r="3.8" fill="var(--ink)"/></g>';
  box.querySelector("#mouth").setAttribute("d",{feliz:"M90 190 Q100 200 110 190",sed:"M91 193 L109 193",agua:"M90 197 Q100 188 110 197",rescate:"M92 198 Q100 190 108 198"}[mood]);
  box.querySelector("#tear").setAttribute("opacity",mood==="agua"||mood==="rescate"?".9":"0");
  moverReloj();
}
function moverReloj(){ const h=$("buga").querySelector("#hHour"); if(!h) return; const d=new Date(), m=d.getMinutes(), hh=d.getHours()%12+m/60;
  h.setAttribute("transform",`rotate(${hh*30} 28 128)`); $("buga").querySelector("#hMin").setAttribute("transform",`rotate(${m*6} 28 128)`); }

/* ---------- mensajes ---------- */
function horaTxt(){
  const h=new Date().getHours();
  if(h>=5&&h<9) return "Buenos días. ¿Ya tomaste desayuno?";
  if(h>=9&&h<12) return "Buena mañana de trabajo. Tómate tu agüita tú también.";
  if(h>=12&&h<15) return "Hora de almorzar. No te saltes la comida.";
  if(h>=15&&h<19) return "¿Cómo va la tarde? Ciruquis sigue tejiendo.";
  if(h>=19&&h<22) return "Qué bueno que ya llegaste a casa.";
  return "Ya es tardecito. A descansar.";
}
/* Lo que dice la planta: una frase corta y un dato aparte, con su ícono */
function estadoTxt(p,st){
  if(st.d===null) return {t:"Todavía no sé cuándo tomé agua.", s:"Hazme la prueba del dedo", i:"revision"};
  const hace = st.d===0?"hoy":st.d===1?"ayer":`hace ${st.d} días`;
  if(st.mood==="feliz"){ const f=st.max-2-st.d; return {t:"¡Qué rico, ya tomé agüita!", s:`Último riego ${hace} · ${f<=0?"prueba del dedo mañana":`prueba del dedo en ${f} día${f===1?"":"s"}`}`, i:"riego"}; }
  if(st.mood==="sed") return {t:"Creo que ya me va dando sed…", s:`Último riego ${hace} · prueba del dedo hoy`, i:"revision"};
  if(st.mood==="agua") return {t:"¡Tengo sed! ¿Me revisas la tierra?", s:`Último riego ${hace}`, i:"riego"};
  return {t:"¡Rescátame, por favor!", s:`${st.d} días sin agua · riego a fondo y vaciar el plato`, i:"riego"};
}
function rotMensajes(){
  const p=planta(), st=estadoPlanta(p), out=[];
  out.push(horaTxt());
  out.push(st.mood==="feliz" ? `${p.nombre} está feliz y bien hidratada.` : st.mood==="sed" ? `${p.nombre} pronto tendrá sed.` : `${p.nombre} necesita agua hoy.`);
  out.push(R.cur>0 ? (R.todayActive ? `Racha del jardín: ${R.cur} día${R.cur===1?"":"s"}. Hoy ya está a salvo.` : `Racha del jardín: ${R.cur} día${R.cur===1?"":"s"}. Un cuidado de cualquiera la salva.`) : "Un cuidado de hoy enciende la racha del jardín.");
  if(!RA.todayActive) out.push(RA.cur>0?`Llevas ${RA.cur} día${RA.cur===1?"":"s"} aprendiendo. La lección de hoy te espera.`:"Tu lección de hoy te espera en Aprender.");
  const vistos=new Set(misAprend().filter(e=>e.tipo==="dato").map(e=>e.nota));
  if(vistos.size<DATOS.length&&RA.todayActive) out.push("Mañana hay otro dato curioso para tu álbum.");
  const tips=esp(p).tips; out.push(tips[Math.floor(Date.now()/864e5)%tips.length]);
  if(plantas.length>1) out.push(`Tu jardín tiene ${plantas.length} plantas. Cámbialas desde arriba.`);
  return out;
}
const CARINO=["¡Me haces cosquillas!","Gracias por cuidarme.","Te quiero mucho.","¿Ya tomaste agua tú también?","Aquí sigo, tejiendo una chompita.","¡Qué lindo verte!"];

/* ---------- navegación ---------- */
const TABS=["inicio","aprender","premios","diario","perfil"];
function irA(t,{scroll=true}={}){
  if(!TABS.includes(t)) t="inicio";
  const cambia = t!==tab; tab=t;
  document.querySelectorAll(".view").forEach(v=>{ const on=v.dataset.view===t; v.hidden=!on; if(on&&cambia){ v.classList.remove("enter"); void v.offsetWidth; v.classList.add("enter"); } });
  document.querySelectorAll(".tabbar button").forEach(b=>b.classList.toggle("on",b.dataset.tab===t));
  if(location.hash!=="#"+t) history.replaceState(null,"","#"+t);
  if(cargado){ renderHeader(); if(t==="premios") renderPremios(); }
  if(scroll&&cambia) window.scrollTo({top:0});
}
document.querySelectorAll(".tabbar button").forEach(b=>b.onclick=()=>{ vibrar(); irA(b.dataset.tab); });
window.addEventListener("hashchange",()=>irA(location.hash.slice(1)));
$("chipStreak").onclick=()=>{ vibrar(); premiosVista=vistaPersonal()?"personal":"familia"; irA("premios"); };
$("chipCoins").onclick=()=>{ vibrar(); premiosVista=vistaPersonal()?"personal":"familia"; irA("premios"); setTimeout(()=>{ const t=document.querySelector(premiosVista==="personal"?"#tiendaP":"#tiendaH"); t&&t.scrollIntoView({behavior:"smooth",block:"start"}); },80); };
$("plantChip").onclick=()=>{ vibrar(); hojaPlantas(); };

/* ---------- hojas (sheets) ---------- */
function abrirHoja(titulo,construir){
  $("sheetTitle").textContent=titulo; const body=$("sheetBody"); body.innerHTML=""; construir(body);
  $("sheetWrap").hidden=false; $("sheetWrap").classList.remove("closing");
}
function cerrarHoja(){ const w=$("sheetWrap"); if(w.hidden) return; w.classList.add("closing"); setTimeout(()=>{ w.hidden=true; w.classList.remove("closing"); },220); }
$("sheetBack").onclick=cerrarHoja; $("sheetClose").onclick=cerrarHoja;
document.addEventListener("keydown",e=>{ if(e.key==="Escape") cerrarHoja(); });

function boton(txt,cls,fn){ const b=el("button","btn "+(cls||"")); b.type="button"; b.textContent=txt; b.disabled=!db||!puedeEscribir; b.onclick=e=>{ vibrar(); fn(e,b); }; return b; }
function fila(...bs){ const d=el("div","btns"+(bs.length===1?" one":"")); d.append(...bs); return d; }
function avatarHTML(per,size=42,conMarco=true){
  const foto=per&&(per.foto||per.fotoGoogle);
  const ini=esc(((per&&(per.apodo||per.nombre))||"?").trim()[0]||"?").toUpperCase();
  const inner=`<span class="av" style="width:${size}px;height:${size}px;font-size:${size*.42}px">${foto?`<img src="${esc(foto)}" alt="" referrerpolicy="no-referrer">`:ini}</span>`;
  const m=conMarco&&per&&per.marco&&MARCO_SVG[per.marco];
  return m?`<span class="avw" style="width:${size}px;height:${size}px">${inner}<span class="marco">${m}</span></span>`:inner;
}

function hojaPlantas(){
  abrirHoja("Mi jardín", body=>{
    const list=el("div","list");
    plantas.forEach(p=>{
      const st=estadoPlanta(p), r=el("button","row"); r.type="button";
      r.innerHTML=`<span class="ri">${miniDe(p)}</span><span class="rt"><b>${esc(p.nombre)}</b><span>${esc(esp(p).nombre)}</span></span><span class="mood-pill ${st.mood}">${{feliz:"Feliz",sed:"Sed",agua:"Sedienta",rescate:"¡Rescate!"}[st.mood]}</span>${p.id===sel?'<span class="tag ok">Aquí</span>':'<i class="chev"></i>'}`;
      r.onclick=()=>{ vibrar(); sel=p.id; LS.set("planta",sel); ciruquisMontada=false; cerrarHoja(); irA("inicio"); render(); toast(`Hola de nuevo, ${p.nombre}`); };
      list.append(r);
    });
    body.append(list, boton("+ Agregar planta","plum wide",()=>formPlanta()));
  });
}

function formPlanta(p=null){
  const nueva=!p, d={nombre:p?.nombre||"", especie:p?.especie||"", color:p?.color||COLORES_MACETA[(plantas.length)%COLORES_MACETA.length], desde:p?.desde||""};
  abrirHoja(nueva?"Nueva planta":"Editar planta", body=>{
    const prev=el("div","prev"); const paint=()=>{ prev.innerHTML=plantaSVG({...d,id:p?.id||"nueva",especie:d.especie||"otra"},"feliz",3); };
    const fN=el("div","field",`<label for="pNombre">¿Cómo se llama?</label><input class="input" id="pNombre" maxlength="24" placeholder="Por ejemplo: Rosita" value="${esc(d.nombre)}">`);
    const fE=el("div","field",`<label>¿Qué planta es?</label>`); const grid=el("div","species");
    Object.entries(ESPECIES).forEach(([k,s])=>{ const b=el("button","sp"+(d.especie===k?" on":"")); b.type="button"; b.innerHTML=plantaSVG({especie:k,color:d.color,id:"x"},"feliz",3,{mini:true})+`<span>${esc(s.nombre.split(" (")[0])}</span>`;
      b.onclick=()=>{ vibrar(); d.especie=k; grid.querySelectorAll(".sp").forEach(x=>x.classList.remove("on")); b.classList.add("on"); paint(); }; grid.append(b); });
    fE.append(grid);
    const fC=el("div","field",`<label>Color de su maceta</label>`); const sws=el("div","swatches");
    COLORES_MACETA.forEach(c=>{ const s=el("button","sw"+(d.color===c?" on":"")); s.type="button"; s.style.background=c; s.setAttribute("aria-label","Color "+c);
      s.onclick=()=>{ vibrar(); d.color=c; sws.querySelectorAll(".sw").forEach(x=>x.classList.remove("on")); s.classList.add("on"); paint(); }; sws.append(s); });
    fC.append(sws);
    const fD=el("div","field",`<label for="pDesde">¿Desde cuándo vive con ustedes?</label><input class="input" type="date" id="pDesde" value="${esc(d.desde)}"><small>Opcional</small>`);
    body.append(prev,fN,fE,fC,fD); paint();
    body.querySelector("#pNombre").oninput=e=>{ d.nombre=e.target.value; };
    const guardarB=boton(nueva?"Agregar al jardín":"Guardar cambios","plum wide",async(e,b)=>{
      d.nombre=body.querySelector("#pNombre").value.trim(); d.desde=body.querySelector("#pDesde").value;
      if(!d.nombre){ toast("Ponle un nombre a tu planta"); body.querySelector("#pNombre").focus(); return; }
      if(!d.especie){ toast("Elige qué planta es"); return; }
      b.disabled=true;
      try{
        if(nueva){ const ref=await db.collection("plantas").add({...d, orden:plantas.length, creada:new Date().toISOString(), quien:miId}); sel=ref.id; LS.set("planta",sel); ciruquisMontada=false;
          cerrarHoja(); irA("inicio"); render(); setTimeout(()=>{ confeti(30); toast(`¡Bienvenida ${d.nombre} al jardín!`); },350); }
        else { await db.collection("plantas").doc(p.id).set(d,{merge:true}); cerrarHoja(); toast("Cambios guardados"); }
      }catch(_){ toast("No se pudo guardar. Intenta de nuevo."); b.disabled=false; }
    });
    body.append(guardarB);
    if(!nueva && plantas.length>1){
      const q=boton("Quitar del jardín","ghost",async(e,b)=>{
        if(!b.dataset.sure){ b.dataset.sure="1"; b.textContent=`¿Seguro? Toca otra vez para quitar a ${p.nombre}`; return; }
        await db.collection("plantas").doc(p.id).set({archivada:true},{merge:true});
        if(sel===p.id){ sel=plantas.find(x=>x.id!==p.id).id; LS.set("planta",sel); ciruquisMontada=false; render(); }
        cerrarHoja(); toast(`${p.nombre} salió del jardín. Su historial se conserva.`);
      });
      body.append(q);
    }
  });
}

let fotoPendiente=null;
function formPerfil(){
  const p=yo(); fotoPendiente=null;
  abrirHoja("Editar perfil", body=>{
    const top=el("div","profile-head");
    top.innerHTML=`<button class="avatar-xl" id="fAvatar" type="button" aria-label="Cambiar foto"><span>${avatarHTML(p,110).replace('class="av"','class="av" id="fAv"')}</span><i class="cam"></i></button>`;
    const acc=el("div","btns");
    acc.append(boton("Cambiar foto","alt small",()=>$("photoInput").click()), boton("Usar la de Google","alt small",()=>{ fotoPendiente=""; top.querySelector("#fAvatar span").innerHTML=avatarHTML({...p,foto:""},110); }));
    const fN=el("div","field",`<label for="fNombre">Tu nombre</label><input class="input" id="fNombre" maxlength="40" value="${esc(p.nombre||"")}">`);
    const fA=el("div","field",`<label for="fApodo">¿Cómo te llaman Ciruquis y tus plantas?</label><input class="input" id="fApodo" maxlength="20" value="${esc(p.apodo||"")}" placeholder="Teté"><small>Es el nombre que verás en los saludos y avisos.</small>`);
    const fM=el("div","field",`<label>Tu moneda personal</label><small>Es la que ganas al aprender.</small>`); const mg=el("div","coinpick"); let masc=mascotaDe({...p,email:miEmail});
    [["popeye","Popeye","el gatito"],["zoe","Zoe","la perrita"]].forEach(([k,n,d])=>{ const b=el("button","cp"+(masc===k?" on":"")); b.type="button"; b.innerHTML=`${MONEDA[k]}<b>${n}</b><span>${d}</span>`;
      b.onclick=()=>{ vibrar(); masc=k; mg.querySelectorAll(".cp").forEach(x=>x.classList.remove("on")); b.classList.add("on"); }; mg.append(b); });
    fM.append(mg); body.dataset.masc="";
    body.append(top,acc,fN,fA,fM);
    body._masc=()=>masc;
    top.querySelector("#fAvatar").onclick=()=>$("photoInput").click();
    body.append(boton("Guardar","plum wide",async(e,b)=>{
      b.disabled=true;
      const upd={nombre:body.querySelector("#fNombre").value.trim(), apodo:body.querySelector("#fApodo").value.trim(), mascota:body._masc()};
      if(fotoPendiente!==null) upd.foto=fotoPendiente;
      try{ await db.collection("personas").doc(miId).set(upd,{merge:true}); cerrarHoja(); toast("Perfil actualizado","ok"); confeti(18); }
      catch(_){ toast("No se pudo guardar. Intenta de nuevo."); b.disabled=false; }
    }));
  });
}
$("photoInput").onchange=async e=>{
  const f=e.target.files[0]; e.target.value=""; if(!f) return;
  try{
    const img=await new Promise((ok,ko)=>{ const i=new Image(); i.onload=()=>ok(i); i.onerror=ko; i.src=URL.createObjectURL(f); });
    const s=Math.min(img.naturalWidth,img.naturalHeight), c=document.createElement("canvas"); c.width=c.height=320;
    c.getContext("2d").drawImage(img,(img.naturalWidth-s)/2,(img.naturalHeight-s)/2,s,s,0,0,320,320);
    const url=c.toDataURL("image/jpeg",.82);
    if($("sheetWrap").hidden){ await db.collection("personas").doc(miId).set({foto:url},{merge:true}); toast("¡Qué linda foto!"); confeti(16); }
    else { fotoPendiente=url; const a=document.querySelector("#fAvatar span"); if(a) a.innerHTML=avatarHTML({foto:url},110); }
  }catch(_){ toast("No se pudo abrir esa foto. Prueba con otra."); }
};

/* ---------- vistas ---------- */
let rotIdx=0, rotTimer=null, rotLista=[], rotPlanta=null;
function pintarRot(i,anim=true){
  rotLista=rotMensajes(); if(!rotLista.length) return; rotIdx=(i+rotLista.length)%rotLista.length;
  const s=$("rotText");
  const set=()=>{ s.textContent=rotLista[rotIdx]; };
  if(anim){ s.classList.add("out"); setTimeout(()=>{ set(); s.classList.remove("out"); s.classList.add("in"); requestAnimationFrame(()=>requestAnimationFrame(()=>s.classList.remove("in"))); },300); } else set();
  const dots=$("rotDots"); dots.innerHTML="";
  rotLista.forEach((_,k)=>{ const b=el("button",k===rotIdx?"on":""); b.type="button"; b.setAttribute("aria-label","Mensaje "+(k+1)); b.onclick=()=>{ pintarRot(k); reiniciarRot(); }; dots.append(b); });
}
function reiniciarRot(){ clearInterval(rotTimer); rotTimer=setInterval(()=>pintarRot(rotIdx+1),6000); }

let burbujaIdx=-1;
function pintarBurbuja(m,anim){
  const b=$("bubble"); b.innerHTML="";
  const t=el("p","bt"); t.textContent=m.t; b.append(t);
  if(m.s){ const s=el("div","bs"); s.innerHTML=`<span class="bi">${ICON[m.i]||ICON.riego}</span><span></span>`; s.lastChild.textContent=m.s; b.append(s); }
  if(anim){ b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); }
}
$("mascot").onclick=()=>{
  vibrar(18); const m=$("mascot"); m.classList.remove("wiggle"); void m.offsetWidth; m.classList.add("wiggle");
  burbujaIdx=(burbujaIdx+1)%(CARINO.length+1);
  const p=planta(), st=estadoPlanta(p);
  pintarBurbuja(burbujaIdx===CARINO.length ? estadoTxt(p,st) : {t:CARINO[burbujaIdx]}, true);
  corazones();
};

const mascotaDe = per => (per&&per.mascota) || (per&&/^matiaschoytejada@/.test(per.email||"") ? "zoe" : "popeye");
const coinYo = () => MONEDA[mascotaDe({...yo(),email:yo().email||miEmail})] || MONEDA.popeye;
const coinFam = () => MONEDA.familia;
const coinIn = (svg,px=16) => svg.replace("<svg ",`<svg style="width:${px}px;height:${px}px;vertical-align:-3px" `);
const vistaPersonal = () => tab==="aprender"||tab==="perfil"||(tab==="premios"&&premiosVista==="personal");
function renderHeader(){
  const p=planta(), per=vistaPersonal(), r=per?RA:R;
  $("chipMini").innerHTML=miniDe(p); $("chipName").textContent=p.nombre;
  const cs=$("chipStreak"), cc=$("chipCoins");
  $("streakChip").textContent=r.cur; cs.classList.toggle("off",!r.cur||!r.todayActive); cs.classList.toggle("personal",per);
  cs.querySelector(".ico").innerHTML=ICON.racha; cc.querySelector(".ico").innerHTML=per?coinYo():coinFam(); cc.classList.toggle("personal",per);
  [cs,cc].forEach(c=>{ const w=el("i","who"); w.innerHTML=per?ICON.perfil:ICON.inicio; c.querySelector(".ico").append(w); });
  cs.setAttribute("aria-label",per?"Tu racha de aprendizaje":"Racha familiar del jardín");
  cc.setAttribute("aria-label",per?"Tus monedas personales":"Monedas de la familia");
  animarNumero($("coins"),Math.max(0,per?monedasPer():monedasFam()));
  document.querySelectorAll(".tabbar button").forEach(b=>{ const t=b.dataset.tab; if(t!=="perfil") b.querySelector(".ti").innerHTML=ICON[t]; });
  $("tabAvatar").innerHTML = (yo().foto||yo().fotoGoogle) ? avatarHTML(yo(),28,false) : ICON.perfil;
}
function animarNumero(nodo,a){
  const de=parseInt(nodo.textContent)||0; if(de===a){ nodo.textContent=a; return; }
  const t0=performance.now(), dur=650;
  const paso=t=>{ const k=Math.min(1,(t-t0)/dur); nodo.textContent=Math.round(de+(a-de)*(1-Math.pow(1-k,3))); if(k<1) requestAnimationFrame(paso); };
  requestAnimationFrame(paso); const st=nodo.parentElement; st.classList.remove("bump"); void st.offsetWidth; st.classList.add("bump");
}

function card({icon,cls,title,sub,tag,tagCls,done,who,coin}){
  const m=el("article","mission"+(done?" done":""));
  m.innerHTML=`<div class="mhead"><div class="micon ${done?"ok":cls||""}">${done?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>':ICON[icon]}</div><div class="mbody"><div class="mtitle"></div><div class="msub"></div></div>${tag?`<span class="tag ${tagCls}"></span>`:""}</div>`;
  m.querySelector(".mtitle").textContent=title; m.querySelector(".msub").textContent=sub;
  if(tag){ const t=m.querySelector(".tag"); if(tagCls==="coin") t.innerHTML=(coin==="yo"?coinYo():coinFam())+esc(tag); else t.textContent=tag; }
  if(who&&personas[who]){ const w=el("span","whoav",avatarHTML(personas[who],30,false)); w.title=nombreDe(who); m.querySelector(".mhead").append(w); }
  return m;
}
function renderInicio(){
  const p=planta(), st=estadoPlanta(p), lv=nivelDe(p), hoy=new Date(), s=esp(p);
  $("hello").textContent=`¡Hola, ${apodo()}!`;
  if(esCiruquis(p)) dibujarCiruquis(st.mood,lv.i);
  else { ciruquisMontada=false; const b=$("buga"); b.className="buga mood-"+st.mood; b.innerHTML=plantaSVG(p,st.mood,lv.i); }
  if(burbujaIdx<0 || burbujaIdx===CARINO.length) pintarBurbuja(estadoTxt(p,st),false);
  $("stageName").textContent=p.nombre;
  const pill=$("moodPill"); pill.className="mood-pill "+st.mood; pill.textContent={feliz:"Feliz",sed:"Con un poco de sed",agua:"Sedienta",rescate:"Necesita rescate"}[st.mood];
  $("levelName").textContent=`Nivel ${lv.i+1} · ${lv.name}`;
  $("levelNext").textContent=lv.nxt?`${lv.xp} / ${lv.nxt} pts`:`${lv.xp} pts`;
  requestAnimationFrame(()=>{ $("levelBar").style.width=lv.pct+"%"; });

  // misiones
  const box=$("missions"); box.innerHTML=""; const hechas=[], pend=[];
  const add=(c,done)=>(done?hechas:pend).push(c);
  const hoyDe = pred => entradasDe(p.id).find(e=>pred(e)&&daysBetween(e.fecha,hoy)===0);
  const porQuien = e => !e.quien ? "hoy" : e.quien===miId ? "por ti, hoy" : `por ${nombreDe(e.quien)}, hoy`;
  const ea=hoyDe(esAgua);
  if(ea) add(card({icon:"riego",title:"Agua al día",sub:`${ea.tipo==="riego"?"Regada":"Tierra revisada"} ${porQuien(ea)}.`,done:true,who:ea.quien}),true);
  else if(st.mood==="feliz"){
    const c=card({icon:"riego",title:`${p.nombre} está bien de agua`,sub:`En ${st.t.n.toLowerCase()}, riego cada ${st.max} días como máximo y siempre con la tierra seca.`,tag:"Al día",tagCls:"ok"});
    c.append(fila(boton("Revisar la tierra igual","alt",()=>{ c.querySelector(".btns").remove(); c.querySelector(".msub").textContent="Mete el dedo hasta pasar la primera articulación (3–4 cm). ¿Cómo está?"; c.append(fila(boton("Seca: la regué","",()=>guardar("riego","")),boton("Aún húmeda","alt",()=>guardar("revision","humeda")))); })));
    add(c,false);
  } else {
    const c=card({icon:"revision",cls:st.mood==="sed"?"":"pink",title:"Prueba del dedo",sub:"Mete el dedo hasta pasar la primera articulación (3–4 cm). ¿Cómo está la tierra?",tag:st.mood==="sed"?"+5 / +10":"¡Urgente!",tagCls:st.mood==="sed"?"coin":"due"});
    c.append(fila(boton("Seca: la regué","",()=>guardar("riego","")),boton("Aún húmeda","alt",()=>guardar("revision","humeda"))));
    add(c,false);
  }
  const lp=entradasDe(p.id).find(e=>e.tipo==="plagas"), dp=lp?daysBetween(lp.fecha,hoy):null;
  if(dp===0) add(card({icon:"plagas",title:"Patrulla de plagas",sub:`Revisada ${porQuien(lp)}. Próxima en 2 semanas.`,done:true,who:lp.quien}),true);
  else if(dp===null||dp>=14){
    const c=card({icon:"plagas",cls:"sun",title:"Patrulla de plagas",sub:"Revisa el envés de las hojas y los brotes: hormigas, pulgones, mosquitas.",tag:"+8",tagCls:"coin"});
    const n=el("div","hint"); n.textContent="Si ves bichitos: algodón con alcohol o jabón potásico, lejos de Popeye y Zoe.";
    c.append(n,fila(boton("Todo limpio","",()=>guardar("plagas","limpio")),boton("Encontré algo","alt",()=>guardar("plagas","encontré plagas"))));
    add(c,false);
  }
  if(st.t.crece && s.abono>0){
    if(esCiruquis(p) && !entradasDe(p.id).some(e=>e.tipo==="brotes")){
      const c=card({icon:"brotes",cls:"pink",title:"¿Ya salieron brotes nuevos?",sub:"Ciruquis se está recuperando. Apenas veas hojitas nuevas en los nudos, retomamos el abono.",tag:"+10",tagCls:"coin"});
      c.append(fila(boton("¡Vi brotes nuevos!","pink",()=>guardar("brotes",""))));
      add(c,false);
    } else {
      const la=entradasDe(p.id).find(e=>e.tipo==="abono"), da=la?daysBetween(la.fecha,hoy):null;
      if(da===0) add(card({icon:"abono",title:"Abono",sub:`Abonada ${porQuien(la)}.`,done:true,who:la.quien}),true);
      else if(da===null||da>=s.abono){
        const c=card({icon:"abono",title:"Hora del abono",sub:`Fertilizante sobre la tierra ya húmeda. Cada ${Math.round(s.abono/7)} semanas en temporada.`,tag:"+15",tagCls:"coin"});
        c.append(fila(boton("Listo, la aboné","",()=>guardar("abono","")))); add(c,false);
      }
    }
  }
  pend.forEach((c,i)=>{ c.style.animationDelay=(i*60)+"ms"; box.append(c); }); hechas.forEach(c=>box.append(c));
  $("missionCount").textContent=`${hechas.length} de ${hechas.length+pend.length} hechas`;
  const lecHoy=misAprend().some(e=>e.tipo==="leccion"&&daysBetween(e.fecha,hoy)===0), datHoy=misAprend().some(e=>e.tipo==="dato"&&daysBetween(e.fecha,hoy)===0);
  const ap=$("learnLink"); ap.innerHTML="";
  if(!(lecHoy&&datHoy)){
    const c=card({icon:"aprender",cls:"pink",title:"Tu momento de aprender",sub:`${!lecHoy&&!datHoy?"Lección y dato curioso":!lecHoy?"Lección":"Dato curioso"} de hoy · suma a tus monedas personales`});
    const b=boton("Ir a Aprender","pink",()=>irA("aprender")); b.disabled=false; c.append(fila(b)); ap.append(c);
  }
  $("tipsTitle").textContent=`Cómo cuidar a ${p.nombre}`;
  $("tips").innerHTML=s.tips.map((t,i)=>`<li><i>${i+1}</i><span>${esc(t)}</span></li>`).join("");
  renderSetup();
}
function leccionCard(){
  const hoy=new Date();
  if(misAprend().some(e=>e.tipo==="leccion"&&daysBetween(e.fecha,hoy)===0)) return {done:true,c:card({icon:"leccion",title:"Lección del día",sub:"¡Completada! Mañana Ciruquis te enseña otra cosa.",done:true})};
  const vistas=new Set(misAprend().filter(e=>e.tipo==="leccion"&&e.ok!==false).map(e=>e.nota));
  const pend=LESSONS.filter(l=>!vistas.has(l.id)), pool=pend.length?pend:LESSONS;
  const L=pool[Math.floor(day(hoy)/864e5)%pool.length];
  const c=card({icon:"leccion",cls:"pink",title:"Lección del día",sub:`Bugambilia · ${LESSONS.length-pend.length} de ${LESSONS.length} aprendidas`,tag:"+5",tagCls:"coin",coin:"yo"});
  const q=el("div","q"); q.textContent=L.q; const opts=el("div","opts");
  L.o.forEach((t,i)=>{ const b=el("button","opt"); b.type="button"; b.textContent=t; b.disabled=!db||!puedeEscribir;
    b.onclick=()=>{ vibrar(); const ok=i===L.a; opts.querySelectorAll(".opt").forEach((x,j)=>{ x.disabled=true; if(j===L.a) x.classList.add("right"); }); if(!ok){ b.classList.add("wrong"); vibrar([30,40,30]); }
      const ex=el("div","explain"+(ok?"":" no")); ex.textContent=(ok?"¡Correcto! ":"Casi. ")+L.e; c.append(ex);
      setTimeout(()=>guardar("leccion",L.id,{ok},"ciruquis"),1700); };
    opts.append(b); });
  c.append(q,opts); return {done:false,c};
}
function datoCard(){
  const hoy=new Date(), hoyDato=misAprend().find(e=>e.tipo==="dato"&&daysBetween(e.fecha,hoy)===0);
  const vistos=new Set(misAprend().filter(e=>e.tipo==="dato").map(e=>e.nota));
  const caja=D=>{ const f=el("div","factbox"); f.innerHTML="<b></b><span></span>"; f.querySelector("b").textContent=D.t; f.querySelector("span").textContent=D.x; return f; };
  if(hoyDato){ const D=DATOS.find(d=>d.id===hoyDato.nota); const c=card({icon:"dato",title:"Dato curioso del día",sub:"Guardado en tu álbum.",done:true}); if(D) c.append(caja(D)); return {done:true,c}; }
  const pend=DATOS.filter(d=>!vistos.has(d.id));
  if(!pend.length) return {done:true,c:card({icon:"dato",title:"¡Álbum completo!",sub:"Ya conoces todos los datos de la bugambilia.",done:true})};
  const D=pend[0], c=card({icon:"dato",cls:"sun",title:"Dato curioso del día",sub:`${DATOS.length-pend.length} de ${DATOS.length} en tu álbum`,tag:"+3",tagCls:"coin",coin:"yo"});
  c.append(caja(D),fila(boton("¡No lo sabía!","",()=>guardar("dato",D.id,{sabia:false},"ciruquis")),boton("Ya lo sabía","alt",()=>guardar("dato",D.id,{sabia:true},"ciruquis"))));
  return {done:false,c};
}

function rachaCard(r,hitos,{titulo,vacio,pendiente,listo,protector}){
  const on=r.cur>0, c=el("div","streak");
  c.innerHTML=`<div class="streak-top"><div class="flame${on?(r.todayActive?" live":""):" off"}">${ICON.racha}</div><div class="streak-txt"><div class="snum${on?"":" off"}">${r.cur}</div><div class="slabel">${esc(titulo(r.cur))}</div></div></div><p class="smsg"></p><div class="week"></div><div class="hitos"></div>`;
  let msg = !on ? vacio : !r.todayActive ? pendiente : (()=>{ const sig=hitos.find(([d])=>d>r.cur); return sig?`${listo} A los ${sig[0]} días ganan ${sig[1]} monedas.`:listo; })();
  if(r.freezesLeft>0) msg+=` ${protector(r.freezesLeft)}`;
  c.querySelector(".smsg").textContent=msg+` Mejor racha: ${r.best}.`;
  const w=c.querySelector(".week"), Ld=["D","L","M","M","J","V","S"], hoy=day(new Date());
  for(let i=6;i>=0;i--){ const d=new Date(hoy); d.setDate(d.getDate()-i); const st=r.days[dkey(d)], t=i===0;
    const x=el("div","wd"+(st==="on"?" on":st==="frz"?" frz":"")+(t&&st!=="on"?" today":"")); x.innerHTML=`<i>${st==="on"?ICON.racha:st==="frz"?ICON.hielo:""}</i><span>${t?"Hoy":Ld[d.getDay()]}</span>`; w.append(x); }
  c.querySelector(".hitos").innerHTML=hitos.map(([d,b])=>`<span class="hito${r.best>=d?" got":""}">${ICON.racha}${d} días · +${b}</span>`).join("");
  return c;
}
function renderAprender(){
  const top=$("learnTop"); top.innerHTML="";
  top.append(rachaCard(RA,HITOS_A,{titulo:n=>n===1?"día aprendiendo seguido":"días aprendiendo seguidos",vacio:"Haz la lección o el dato de hoy para empezar tu racha de aprendizaje.",pendiente:"Todavía no aprendes nada hoy. La lección o el dato mantienen tu racha.",listo:"¡Hoy ya aprendiste algo!",protector:n=>`Tienes ${n} protector${n>1?"es":""}.`}));
  top.querySelectorAll(".smsg").forEach(p=>p.textContent=p.textContent.replace("ganan","ganas"));
  const hoyBox=$("learnToday"); hoyBox.innerHTML="";
  const lec=leccionCard(), dat=datoCard();
  [lec,dat].sort((a,b)=>a.done-b.done).forEach(x=>hoyBox.append(x.c));
  $("learnCoins").innerHTML=`${coinIn(coinYo())} ${Math.max(0,monedasPer())} tuyas`;
  const box=$("course"); box.innerHTML="";
  const aprendidas=new Set(misAprend().filter(e=>e.tipo==="leccion"&&e.ok!==false).map(e=>e.nota));
  const especies=[...new Set(plantas.map(p=>p.especie))];
  if(!especies.includes("bugambilia")) especies.unshift("bugambilia");
  especies.forEach((k,ui)=>{
    const s=ESPECIES[k]||ESPECIES.otra, quien=plantas.filter(p=>p.especie===k).map(p=>p.nombre).join(", ");
    const u=el("div","unit"+(k==="bugambilia"?"":" green"));
    if(k==="bugambilia"){
      const hechas=LESSONS.filter(l=>aprendidas.has(l.id)).length;
      u.innerHTML=`<div><small>Unidad ${ui+1}${quien?" · "+esc(quien):""}</small><b>${esc(s.nombre)}</b></div><div class="count">${hechas}/${LESSONS.length}</div>`; box.append(u);
      const path=el("div","path"); let marcado=false;
      LESSONS.forEach((l,i)=>{ const done=aprendidas.has(l.id), next=!done&&!marcado; if(next) marcado=true;
        const n=el("div","node"+(done?" done":next?" next":" lockd")); n.style.paddingLeft=[0,40,72,40][i%4]+"px";
        n.innerHTML=`<i>${done?ICON.leccion:next?ICON.dato:ICON.candado}</i><span></span>`;
        n.querySelector("span").textContent=done?l.q.replace(/…$/,""):next?"Siguiente: te espera arriba, en Para hoy":`Lección ${i+1}`; path.append(n); });
      box.append(path);
    } else {
      u.innerHTML=`<div><small>Unidad ${ui+1}${quien?" · "+esc(quien):""}</small><b>${esc(s.nombre)}</b></div><div class="count">${ICON.candado}</div>`; u.querySelector(".count svg").style.width="24px";
      const n=el("div","soon"); n.textContent=`Las lecciones de ${s.nombre.split(" (")[0].toLowerCase()} están en camino. Pídele a Claude que las prepare. Mientras, sus consejos están en Inicio.`;
      box.append(u,n);
    }
  });
  const al=$("album"); al.innerHTML="";
  const vistos=new Set(misAprend().filter(e=>e.tipo==="dato").map(e=>e.nota));
  DATOS.filter(d=>vistos.has(d.id)).forEach(d=>{ const det=el("details","fact"); det.innerHTML=`<summary>${ICON.dato}<span></span></summary><p></p>`; det.querySelector("span").textContent=d.t; det.querySelector("p").textContent=d.x; det.ontoggle=()=>vibrar(8); al.append(det); });
  const faltan=DATOS.length-vistos.size;
  if(faltan>0){ const l=el("div","fact locked"); l.textContent=`${faltan} dato${faltan>1?"s":""} por descubrir. Uno nuevo cada día.`; al.append(l); }
  $("albumCount").textContent=`${vistos.size} de ${DATOS.length}`;
}

function medallasGrid(lista,ctx){
  const bx=el("div","badges"); let total=0;
  lista.forEach(b=>{ const {c,t}=tierDe(b,ctx), next=b.t[t]; total+=t;
    const x=el("div","badge t"+t); x.innerHTML=`<div class="medal">${ICON[b.icon]}</div><b></b><small></small><div class="minibar"><i></i></div>`;
    x.querySelector("b").textContent=b.name; x.querySelector("small").textContent=next?`${["Sin medalla","Bronce","Plata"][t]} · ${c}/${next}`:"Oro · completa";
    x.querySelector(".minibar i").style.width=(next?Math.min(100,c/next*100):100)+"%"; bx.append(x); });
  return {bx,total};
}
const monedaTxt = (n,svg) => `${coinIn(svg)} ${Math.max(0,n)} disponibles`;
function secH(t,nota,id){ const h=el("div","sec-h"); if(id) h.id=id; h.innerHTML=`<h2></h2><span class="sec-note"></span>`; h.querySelector("h2").textContent=t; h.querySelector(".sec-note").innerHTML=nota||""; return h; }
function renderPremios(){
  const seg=$("premiosSeg"); seg.innerHTML="";
  [["familia","Familia",ICON.inicio],["personal","Solo yo",ICON.perfil]].forEach(([k,n,ic])=>{ const b=el("button",premiosVista===k?"on":""); b.type="button"; b.innerHTML=`${ic}<span>${n}</span>`;
    b.onclick=()=>{ vibrar(); premiosVista=k; renderPremios(); renderHeader(); }; seg.append(b); });
  const body=$("premiosBody"); body.innerHTML=""; body.classList.remove("enter"); void body.offsetWidth; body.classList.add("enter");
  if(premiosVista==="familia"){
    $("premiosSub").textContent="Lo que logran juntos cuidando el jardín.";
    body.append(rachaCard(R,HITOS,{titulo:n=>n===1?"día de racha del jardín":"días de racha del jardín",vacio:"Cualquier cuidado de hoy, de cualquiera de los dos, enciende la racha del jardín.",pendiente:"Hoy nadie ha cuidado el jardín todavía. Un cuidado de cualquiera de los dos la salva.",listo:"¡Hoy el jardín ya está cuidado!",protector:n=>`Tienen ${n} protector${n>1?"es":""}.`}));
    const {bx,total}=medallasGrid(BADGES_F,CTX);
    body.append(secH("Medallas de la familia",`${total} de ${BADGES_F.length*3}`),bx);
    const saldo=monedasFam(), hayC=plantas.some(esCiruquis);
    if(hayC){
      body.append(secH("Tienda de Ciruquis",monedaTxt(saldo,coinFam()),"tiendaH"));
      const nota=el("p","sec-desc"); nota.textContent="Regalos para Ciruquis, pagados con las monedas de la familia."; body.append(nota);
      const sh=el("div","shop");
      SHOP.forEach(s=>{ const owned=tiene(s.id), on=puesto(s.id);
        const x=el("article","item"+(owned&&!s.consumible?" owned":"")); x.innerHTML=`<div class="thumb">${s.svg}</div><b></b><p></p><div class="price">${coinFam()}<span>${s.price}</span></div>`;
        x.querySelector("b").textContent=s.name; x.querySelector("p").textContent=s.desc; let b;
        if(s.consumible){ const lleno=R.freezesLeft>=2; b=boton(lleno?"Tienen 2":"Comprar","gold",(e,bb)=>comprar(s,bb,"familia")); b.disabled=b.disabled||lleno||saldo<s.price; }
        else if(!owned){ b=boton(saldo<s.price?`Faltan ${s.price-saldo}`:"Comprar","gold",(e,bb)=>comprar(s,bb,"familia")); b.disabled=b.disabled||saldo<s.price; }
        else { x.querySelector(".price").innerHTML='<span style="color:var(--bract)">Es suya</span>'; b=boton(on?"Quitárselo":"Ponérselo",on?"alt":"pink",()=>alternar(s.id)); }
        x.append(b); sh.append(x); });
      body.append(sh);
    }
  } else {
    $("premiosSub").textContent="Tus logros por aprender. Son solo tuyos.";
    body.append(rachaCard(RA,HITOS_A,{titulo:n=>n===1?"día aprendiendo seguido":"días aprendiendo seguidos",vacio:"La lección o el dato de hoy encienden tu racha de aprendizaje.",pendiente:"Todavía no aprendes nada hoy. La lección o el dato mantienen tu racha.",listo:"¡Hoy ya aprendiste algo!",protector:n=>`Tienes ${n} protector${n>1?"es":""}.`}));
    body.querySelectorAll(".smsg").forEach(p=>p.textContent=p.textContent.replace("ganan","ganas"));
    const {bx,total}=medallasGrid(BADGES_P,CTX);
    body.append(secH("Tus medallas",`${total} de ${BADGES_P.length*3}`),bx);
    const mv=el("p","sec-desc"); mv.textContent="Mano verde es tuya, pero lo que gana va a las monedas de la familia."; body.append(mv);
    const saldo=monedasPer(), p=yo();
    body.append(secH("Tu tienda",monedaTxt(saldo,coinYo()),"tiendaP"));
    const nota=el("p","sec-desc"); nota.textContent="Se paga con lo que aprendes. Los marcos y títulos se ven en tu perfil."; body.append(nota);
    const sh=el("div","shop");
    SHOP_P.forEach(s=>{ const owned=tieneP(s.id), on=s.tipo==="marco"?p.marco===s.valor:s.tipo==="titulo"?p.titulo===s.valor:false;
      const prev = s.tipo==="titulo" ? `<span class="titulo-pill">${esc(s.valor)}</span>` : s.tipo==="protector" ? `<span class="thumb-ico">${ICON.aprender}</span>` : `<span class="thumb-av">${avatarHTML({...p,marco:s.valor},46)}</span>`;
      const x=el("article","item"+(owned&&!s.consumible?" owned":"")); x.innerHTML=`<div class="thumb">${prev}</div><b></b><p></p><div class="price">${coinYo()}<span>${s.price}</span></div>`;
      x.querySelector("b").textContent=s.name.replace("Título: ",""); x.querySelector("p").textContent=s.desc; let b;
      if(s.consumible){ const lleno=RA.freezesLeft>=2; b=boton(lleno?"Tienes 2":"Comprar","gold",(e,bb)=>comprar(s,bb,"personal")); b.disabled=b.disabled||lleno||saldo<s.price; }
      else if(!owned){ b=boton(saldo<s.price?`Faltan ${s.price-saldo}`:"Comprar","gold",(e,bb)=>comprar(s,bb,"personal")); b.disabled=b.disabled||saldo<s.price; }
      else { x.querySelector(".price").innerHTML='<span style="color:var(--bract)">Es tuyo</span>'; b=boton(on?"Quitar":"Usar",on?"alt":"pink",()=>usarPersonal(s,!on)); }
      x.append(b); sh.append(x); });
    body.append(sh);
  }
}
async function usarPersonal(s,poner){
  try{ await db.collection("personas").doc(miId).set({[s.tipo]:poner?s.valor:""},{merge:true}); toast(poner?(s.tipo==="marco"?"Marco puesto en tu foto":"Título puesto en tu perfil"):"Listo, quitado","ok"); if(poner) confeti(14); }
  catch(_){ toast("No se pudo cambiar. Intenta de nuevo."); }
}
async function comprar(s,b,bolsa="familia"){
  if(!b.dataset.sure){ b.dataset.sure="1"; b.textContent=`¿Seguro? ${s.price}`; setTimeout(()=>{ if(b.isConnected&&b.dataset.sure){ delete b.dataset.sure; b.textContent="Comprar"; } },3500); return; }
  b.disabled=true;
  try{
    const saldo=bolsa==="personal"?monedasPer():monedasFam();
    if(saldo<s.price){ toast("No alcanzan las monedas todavía."); return; }
    await db.collection("compras").add({item:s.id,costo:s.price,bolsa,fecha:new Date().toISOString(),quien:miId});
    if(bolsa==="familia"&&!s.consumible) await guardarEquipo(conExclusivos([...(equipado||compras.filter(c=>c.bolsa!=="personal").map(c=>c.item)),s.id],s.id));
    if(bolsa==="personal"&&!s.consumible) await db.collection("personas").doc(miId).set({[s.tipo]:s.valor},{merge:true});
    monedasFx(bolsa==="personal"); confeti(24);
    toast(s.consumible?(bolsa==="personal"?"Protector de aprendizaje listo":"Protector de racha familiar listo"):bolsa==="personal"?`¡${s.name.replace("Título: ","")} ya es tuyo!`:`¡Le regalaron ${s.name.toLowerCase()} a Ciruquis!`,"ok");
  }catch(_){ toast("No se pudo comprar. Intenta de nuevo."); b.disabled=false; }
}
function conExclusivos(lista,id){ return COLORES.includes(id)?lista.filter(x=>!COLORES.includes(x)||x===id):lista; }
async function alternar(id){ const base=equipado||compras.filter(c=>c.bolsa!=="personal").map(c=>c.item); try{ await guardarEquipo(base.includes(id)?base.filter(x=>x!==id):conExclusivos([...base,id],id)); }catch(_){ toast("No se pudo cambiar. Intenta de nuevo."); } }
function guardarEquipo(lista){ return db.collection("ajustes").doc("ciruquis").set({equipado:[...new Set(lista)]}); }

function nombreDe(id){ if(!id) return "Claude"; const p=personas[id]; return p?((p.apodo||"").trim()||(p.nombre||"").split(" ")[0]||"Alguien"):(id===miId?"Tú":"Alguien"); }
function renderDiario(){
  const cuid=entradas.filter(esCuidado), tot={}, cnt={};
  cuid.forEach(e=>{ const k=e.quien||"_"; tot[k]=(tot[k]||0)+MON(e); cnt[k]=(cnt[k]||0)+1; });
  Object.keys(personas).forEach(k=>{ if(!(k in tot)){ tot[k]=0; cnt[k]=0; } });
  const tm=$("team"); tm.innerHTML="";
  Object.keys(tot).sort((a,b)=>tot[b]-tot[a]).forEach(k=>{ const m=el("div","member");
    m.innerHTML=(k==="_"?`<span class="av" style="width:42px;height:42px;font-size:18px">C</span>`:avatarHTML(personas[k],42))+`<div class="mi"><strong>${esc(k==="_"?"Desde el chat":nombreDe(k))}</strong><span>${cnt[k]} ${cnt[k]===1?"cuidado":"cuidados"}</span><small class="aporte">${coinFam()}+${tot[k]} para la familia</small></div>`; tm.append(m); });
  const fl=$("filters"); fl.innerHTML="";
  [["todas","Todas"],...plantas.map(p=>[p.id,p.nombre])].forEach(([id,n])=>{ const b=el("button","fchip"+(filtro===id?" on":"")); b.type="button"; b.textContent=n; b.onclick=()=>{ vibrar(); filtro=id; mostrar=12; renderDiario(); }; fl.append(b); });
  const ul=$("log"); ul.innerHTML="";
  const lista=cuid.filter(e=>filtro==="todas"||plantaDe(e)===filtro);
  if(!lista.length){ ul.innerHTML='<li class="empty">Todavía no hay cuidados aquí. Completa una misión y aparecerá.</li>'; return; }
  lista.slice(0,mostrar).forEach(e=>{
    const li=el("li"), f=new Date(e.fecha), pl=plantas.find(p=>p.id===plantaDe(e));
    li.innerHTML=`<div class="ico">${ICON[e.tipo]||ICON.nota}</div><div class="txt"><div class="t"></div><div class="m">${e.quien&&personas[e.quien]?avatarHTML(personas[e.quien],18,false):""}<span class="mt"></span></div></div><span class="x">+${MON(e)}</span>`;
    li.querySelector(".t").textContent=(TXT[e.tipo]||"Nota")+(pl&&plantas.length>1&&!["leccion","dato"].includes(e.tipo)?` · ${pl.nombre}`:"");
    li.querySelector(".m .mt").textContent=f.toLocaleDateString("es-PE",{weekday:"short",day:"numeric",month:"short"})+" · "+nombreDe(e.quien);
    const extra=e.tipo==="dato"?(DATOS.find(d=>d.id===e.nota)||{}).t:e.tipo==="revision"&&e.nota==="humeda"?"Tierra aún húmeda":e.tipo==="leccion"?(e.ok===false?"Respuesta para repasar":"Respuesta correcta"):(e.nota||"");
    if(extra){ const n=el("div","n"); n.textContent=extra; li.querySelector(".txt").append(n); }
    if(puedeEscribir){ const d=el("button","del"); d.type="button"; d.textContent="Borrar";
      d.onclick=()=>{ if(d.dataset.sure){ db.collection("registro").doc(e.id).delete().catch(()=>toast("No se pudo borrar.")); } else { d.dataset.sure="1"; d.textContent="¿Seguro?"; setTimeout(()=>{ if(d.isConnected){ delete d.dataset.sure; d.textContent="Borrar"; } },3000); } };
      li.append(d); }
    ul.append(li);
  });
  if(lista.length>mostrar){ const li=el("li"); li.style.padding="0"; const b=el("button","more"); b.type="button"; b.textContent="Ver más"; b.onclick=()=>{ mostrar+=15; renderDiario(); }; li.append(b); ul.append(li); }
}

function renderPerfil(){
  const p=yo();
  $("avatarXL").innerHTML=avatarHTML(p,110);
  $("profName").textContent=apodo();
  const ti=$("profTitulo"); ti.hidden=!p.titulo; ti.textContent=p.titulo||"";
  const desde=p.desde?new Date(p.desde):null;
  $("profSub").textContent=[p.nombre&&p.nombre!==apodo()?p.nombre:"", desde?`En el jardín desde ${MESES[desde.getMonth()]} ${desde.getFullYear()}`:""].filter(Boolean).join(" · ");
  const misCuid=CTX.MC.length, medallas=BADGES_P.reduce((s,b)=>s+tierDe(b).t,0), lecs=new Set(misAprend().filter(e=>e.tipo==="leccion"&&e.ok!==false).map(e=>e.nota)).size, datos=new Set(misAprend().filter(e=>e.tipo==="dato").map(e=>e.nota)).size;
  const sb=(ico,col,v,t)=>`<div class="sbox"><span class="si" style="color:${col}">${ico}</span><div><b>${v}</b><span>${t}</span></div></div>`;
  $("statgrid").innerHTML=sb(ICON.racha,"var(--sun)",RA.cur,"días aprendiendo")+sb(coinYo(),"var(--coin)",Math.max(0,monedasPer()),"monedas tuyas")+sb(ICON.leccion,"var(--bract)",`${lecs}/${LESSONS.length}`,"lecciones")+sb(ICON.dato,"var(--sun)",`${datos}/${DATOS.length}`,"datos curiosos")+sb(ICON.medalla,"var(--gold)",medallas,"medallas tuyas")+sb(ICON.corazon,"var(--bract)",misCuid,"cuidados al jardín");
  const gl=$("gardenList"); gl.innerHTML="";
  plantas.forEach(pl=>{ const st=estadoPlanta(pl), r=el("button","row"); r.type="button";
    r.innerHTML=`<span class="ri">${miniDe(pl)}</span><span class="rt"><b>${esc(pl.nombre)}</b><span>${esc(esp(pl).nombre)} · Nivel ${nivelDe(pl).i+1}</span></span><span class="mood-pill ${st.mood}">${{feliz:"Feliz",sed:"Sed",agua:"Sedienta",rescate:"¡Rescate!"}[st.mood]}</span><i class="chev"></i>`;
    r.onclick=()=>{ vibrar(); formPlanta(pl); }; gl.append(r); });
  const se=$("settings"); se.innerHTML="";
  const fila2=(ico,t,sub,fn,tag)=>{ const r=el(fn&&typeof fn==="string"?"a":"button","row"); if(typeof fn==="string"){ r.href=fn; r.target="_blank"; r.rel="noopener"; } else { r.type="button"; if(fn) r.onclick=()=>{ vibrar(); fn(); }; else r.disabled=true; }
    r.innerHTML=`<span class="ri sm">${ico}</span><span class="rt"><b>${esc(t)}</b>${sub?`<span>${esc(sub)}</span>`:""}</span>${tag||'<i class="chev"></i>'}`; se.append(r); };
  const tr=el("div","row seg-row"); tr.innerHTML=`<span class="ri sm">${ICON.tema}</span><span class="rt"><b>Apariencia</b><span>Elige cómo se ve la app en este celular</span></span>`;
  const seg=el("div","seg"); seg.setAttribute("role","radiogroup"); seg.setAttribute("aria-label","Apariencia");
  [["auto","Automático"],["light","Claro"],["dark","Oscuro"]].forEach(([k,n])=>{ const b=el("button",LS.get("tema","auto")===k?"on":""); b.type="button"; b.setAttribute("role","radio"); b.setAttribute("aria-checked",LS.get("tema","auto")===k); b.textContent=n;
    b.onclick=()=>{ vibrar(); LS.set("tema",k); aplicarTema(k); renderPerfil(); toast(k==="auto"?"La app sigue el modo de tu celular":k==="light"?"Modo claro activado":"Modo oscuro activado"); }; seg.append(b); });
  tr.append(seg); se.append(tr);
  const perm="Notification" in window?Notification.permission:"unsupported";
  if(perm==="granted") fila2(ICON.campana,"Avisos de Ciruquis","Activados: te avisa cuando una planta tiene sed o tu racha peligra",null,'<span class="tag ok">Activos</span>');
  else if(perm==="denied") fila2(ICON.campana,"Avisos de Ciruquis","Bloqueados. Actívalos en los ajustes del celular para esta app.",null,'<span class="tag due">Apagados</span>');
  else if(messaging) fila2(ICON.campana,"Activar avisos","Solo cuando una planta tenga sed o tu racha esté en peligro",()=>activarAvisos());
  else fila2(ICON.campana,"Avisos","En iPhone, instala la app en la pantalla de inicio para activarlos",null,'<span class="tag wait">—</span>');
  if(installEvt&&!esStandalone()) fila2(ICON.instalar,"Instalar en el celular","Queda en tu pantalla de inicio como cualquier app",()=>instalar());
  fila2(ICON.libro,"Guía de cuidados de la bugambilia","Se abre en Claude","https://claude.ai/artifact/Hnr58J6AW1dNxvcGsDxsVa");
  fila2(ICON.salir,"Cerrar sesión","",()=>salir());
  $("version").textContent="Versión "+VERSION;
}

/* ---------- apariencia ---------- */
function aplicarTema(k){
  const r=document.documentElement;
  if(k==="light"||k==="dark") r.dataset.theme=k; else delete r.dataset.theme;
  const oscuro = k==="dark" || (k!=="light" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelector('meta[name="theme-color"]').setAttribute("content", oscuro?"#101814":"#F3F6F2");
}
aplicarTema(LS.get("tema","auto"));
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",()=>aplicarTema(LS.get("tema","auto")));

/* ---------- render general ---------- */
function render(){
  if(!plantas.find(p=>p.id===sel) && plantas[0]){ sel=plantas[0].id; LS.set("planta",sel); ciruquisMontada=false; }
  calcularRachas();
  const p=planta(), lv=nivelDe(p), tiers=BADGES_F.reduce((s,b)=>s+tierDe(b).t,0)+BADGES_P.reduce((s,b)=>s+tierDe(b).t,0);
  renderHeader(); renderInicio(); renderAprender(); renderPremios(); renderDiario(); renderPerfil();
  if(cargado){
    if(prev.level>=0 && lv.i>prev.level){ toast(`¡Subió de nivel! ${p.nombre} ahora es ${lv.name}`,"ok"); confeti(40); $("buga").classList.add("pop-b"); }
    else if(prev.tiers>=0 && tiers>prev.tiers) setTimeout(()=>{ toast("¡Nueva medalla! Mírala en Premios","ok"); monedasFx(); },900);
    else { const h=HITOS.find(([d])=>d===R.cur); if(h && R.cur>prev.streak) setTimeout(()=>{ toast(`¡${h[0]} días de racha del jardín! +${h[1]} monedas`,"coin"); monedasFx(); },900); }
  }
  prev={level:lv.i,tiers,streak:R.cur};
  if(!rotTimer || rotPlanta!==sel){ rotPlanta=sel; pintarRot(0,false); reiniciarRot(); }
}

/* ---------- efectos ---------- */
function centro(){ const r=$("buga").getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height*.35,w:r.width||200}; }
function gotas(){ const c=centro(); for(let i=0;i<14;i++){ const d=el("div","drop"); d.style.left=(c.x-c.w*.3+Math.random()*c.w*.6)+"px"; d.style.top=(c.y-90+Math.random()*30)+"px"; d.style.animationDelay=(Math.random()*.5)+"s"; $("fx").append(d); setTimeout(()=>d.remove(),1600); } }
function lanzar(cls,n,o){ for(let i=0;i<n;i++){ const p=el("div",cls); p.style.left=o.x+"px"; p.style.top=o.y+"px"; const a=Math.random()*Math.PI*2, d=80+Math.random()*120; p.style.setProperty("--dx",Math.cos(a)*d+"px"); p.style.setProperty("--dy",(Math.sin(a)*d-40)+"px"); p.style.setProperty("--r",(Math.random()*540-270)+"deg"); if(cls==="petal"&&i%3===0) p.style.background="var(--sun)"; $("fx").append(p); setTimeout(()=>p.remove(),1500); } }
const confeti=(n=22)=>lanzar("petal",n,tab==="inicio"?centro():{x:innerWidth/2,y:innerHeight/2});
function monedasFx(personal){ if(personal===undefined) personal=vistaPersonal(); const r=$("coins").getBoundingClientRect(), svg=personal?coinYo():coinFam();
  for(let i=0;i<10;i++){ const p=el("div","coinfx",svg); p.style.left=(r.left+r.width/2)+"px"; p.style.top=(r.top+r.height/2)+"px"; const a=Math.random()*Math.PI*2, d=60+Math.random()*90;
    p.style.setProperty("--dx",Math.cos(a)*d+"px"); p.style.setProperty("--dy",(Math.sin(a)*d+40)+"px"); p.style.setProperty("--r",(Math.random()*360-180)+"deg"); $("fx").append(p); setTimeout(()=>p.remove(),1300); } }
function corazones(){ const c=centro(); for(let i=0;i<4;i++){ const h=el("div","heart",ICON.corazon); h.style.left=(c.x-20+Math.random()*40)+"px"; h.style.top=(c.y+20)+"px"; h.style.setProperty("--dx",(Math.random()*80-40)+"px"); h.style.animationDelay=(i*.12)+"s"; document.body.append(h); setTimeout(()=>h.remove(),1600); } }
let tt; function toast(t,tipo){
  if(!tipo) tipo=/^\+\d+ monedas/.test(t)?"coin":/^No se pudo|^Se perdió|bloquead|no tiene permiso|solo puede/i.test(t)?"err":"ok";
  const ico={ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',coin:coinFam(),coinyo:coinYo(),err:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 7v6M12 17h.01"/><circle cx="12" cy="12" r="9.5"/></svg>'}[tipo]||ICON.dato;
  const e=$("toast"); e.className="toast t-"+tipo; e.innerHTML=`<span class="ti2">${ico}</span><span class="tx"></span>`; e.querySelector(".tx").textContent=t;
  void e.offsetWidth; e.classList.add("show"); clearTimeout(tt); tt=setTimeout(()=>e.classList.remove("show"),3000);
}

async function guardar(tipo,nota,extra={},plantaId){
  if(!db) return;
  const pid=plantaId||sel, pl=plantas.find(p=>p.id===pid)||planta();
  const e={tipo,nota:nota||"",fecha:new Date().toISOString(),quien:miId||null,plantaId:pid,...extra};
  const gracias={dato:"Nuevo dato en tu álbum",riego:`¡Glu glu! ${pl.nombre} te lo agradece`,revision:"Anotado: tierra húmeda, sin regar",plagas:"Patrulla completada",abono:`¡Vitaminas para ${pl.nombre}!`,brotes:"¡Qué emoción, brotes nuevos!",leccion:"Lección completada",poda:"Poda anotada"};
  try{
    vibrar([15,30,15]);
    await db.collection("registro").add(e);
    if(tipo==="riego") gotas(); else confeti();
    monedasFx(APRENDE.includes(tipo)); toast(`+${MON(e)} moneda${MON(e)===1?"":"s"} ${APRENDE.includes(tipo)?"tuya"+(MON(e)===1?"":"s"):"para la familia"} · ${gracias[tipo]||"Guardado"}`,APRENDE.includes(tipo)?"coinyo":"coin");
  }catch(err){
    if(err&&err.code==="permission-denied"){ puedeEscribir=false; toast("Tu cuenta solo puede ver el jardín."); render(); }
    else toast("No se pudo guardar. Revisa la conexión.");
  }
}

/* ---------- avisos e instalación ---------- */
const CFG=self.CIRUQUIS_CONFIG;
let swReg=null, installEvt=null, messaging=null;
const esStandalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone;
window.addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); installEvt=e; if(cargado) render(); });
window.addEventListener("appinstalled",()=>{ installEvt=null; toast("¡El jardín ya vive en tu celular!"); if(cargado) render(); });
async function instalar(){ if(!installEvt) return; installEvt.prompt(); await installEvt.userChoice; installEvt=null; render(); }
async function registrarToken(pedir){
  if(!messaging||!swReg||!("Notification" in window)) return false;
  if(pedir){ const p=await Notification.requestPermission(); if(p!=="granted") return false; }
  if(Notification.permission!=="granted") return false;
  try{ const token=await messaging.getToken({vapidKey:CFG.vapidKey,serviceWorkerRegistration:swReg});
    if(token) await db.collection("tokens").doc(token).set({uid:miId,creado:new Date().toISOString(),agente:navigator.userAgent.slice(0,120)});
    return !!token; }catch(e){ console.warn("token",e); return false; }
}
async function activarAvisos(){ const ok=await registrarToken(true); if(ok){ toast("¡Listo! Te avisaré cuando me necesites"); confeti(); } else if(Notification.permission==="denied") toast("Los avisos quedaron bloqueados. Puedes activarlos en los ajustes del celular."); render(); }
function renderSetup(){
  const box=$("setup"), btns=$("setupBtns"); btns.innerHTML="";
  const perm="Notification" in window?Notification.permission:"unsupported", omit=LS.get("omitir",{});
  const mostrar=(art,t,txt,accion,fn,key)=>{ box.hidden=false; $("setupArt").innerHTML=art; $("setupTitle").textContent=t; $("setupText").textContent=txt;
    const a=boton(accion,"plum",fn); a.disabled=false; const n=boton("Ahora no","alt",()=>{ omit[key]=Date.now(); LS.set("omitir",omit); box.hidden=true; }); n.disabled=false; btns.append(n,a); };
  const reciente=k=>omit[k]&&Date.now()-omit[k]<3*864e5;
  if(!esStandalone()&&installEvt&&!reciente("instalar")) return mostrar(ICON.instalar,"Llévame en tu celular","Instálame y quedo en tu pantalla de inicio, como cualquier app.","Instalar",instalar,"instalar");
  if(perm==="default"&&messaging&&swReg&&!reciente("avisos")) return mostrar(ICON.campana,`¿Te aviso cuando te necesite?`,"Solo cuando una planta tenga sed o tu racha esté en peligro. Nada más.","Activar avisos",activarAvisos,"avisos");
  box.hidden=true;
}

/* ---------- semilla y migración ---------- */
const SEMILLA=[
  {id:"riego-2026-10-30",tipo:"riego",nota:"",fecha:"2026-10-30T17:00:00.000Z",quien:null},
  {id:"riego-2026-11-13",tipo:"riego",nota:"Riego a fondo después de 2 semanas sin agua; hojas caídas y sin brácteas.",fecha:"2026-11-13T17:00:00.000Z",quien:null},
  {id:"poda-2026-11-13",tipo:"poda",nota:"Cortada la rama con hojas negras (quemada junto al vidrio) y aflojada la cinta azul de la base del tronco.",fecha:"2026-11-13T18:00:00.000Z",quien:null},
  {id:"riego-2026-11-17",tipo:"riego",nota:"",fecha:"2026-11-17T23:00:00.000Z",quien:null}
];
async function sembrar(){
  const m=db.collection("ajustes").doc("migracion"), s=await m.get();
  if(!s.exists){ const b=db.batch(); SEMILLA.forEach(({id,...d})=>b.set(db.collection("registro").doc(id),d)); b.set(m,{hecho:new Date().toISOString()}); await b.commit(); }
  const c=db.collection("plantas").doc("ciruquis"), cs=await c.get();
  if(!cs.exists) await c.set({nombre:"Ciruquis",especie:"bugambilia",color:"#7A2457",desde:"2026-10-23",orden:0,creada:new Date().toISOString()});
}

/* ---------- arranque ---------- */
firebase.initializeApp(CFG.firebase);
const auth=firebase.auth();
db=firebase.firestore();
db.enablePersistence({synchronizeTabs:true}).catch(()=>{});
try{ if(firebase.messaging.isSupported()) messaging=firebase.messaging(); }catch(_){ messaging=null; }
const VERSION="2026.11.20 · v7";
if("serviceWorker" in navigator){
  const habia=!!navigator.serviceWorker.controller; let recargado=false;
  navigator.serviceWorker.addEventListener("controllerchange",()=>{ if(habia&&!recargado){ recargado=true; location.reload(); } });
  navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).then(r=>{ swReg=r; r.update().catch(()=>{}); if(miId){ registrarToken(false); render(); } }).catch(e=>console.warn("sw",e));
  document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible"&&swReg) swReg.update().catch(()=>{}); });
}
if(messaging) messaging.onMessage(p=>{ const d=p.data||{}; toast(d.body||d.title||"Ciruquis te habla"); });
setInterval(()=>{ moverReloj(); },60000);
irA(location.hash.slice(1)||"inicio",{scroll:false});

function mostrarLogin(msg){ $("login").hidden=false; $("loginErr").hidden=!msg; $("loginErr").textContent=msg||""; $("salirLogin").hidden=!msg; $("gbtn").hidden=!!msg; }
$("gbtn").onclick=async()=>{
  const p=new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({prompt:"select_account"});
  try{ await auth.signInWithPopup(p); }
  catch(e){ if(["auth/popup-blocked","auth/operation-not-supported-in-this-environment","auth/cancelled-popup-request"].includes(e.code)) auth.signInWithRedirect(p);
    else if(e.code!=="auth/popup-closed-by-user") mostrarLogin("No se pudo entrar. Revisa tu conexión e intenta otra vez."); }
};
const salir=()=>auth.signOut().then(()=>location.reload());
$("salirLogin").onclick=salir;
$("editProfile").onclick=()=>{ vibrar(); formPerfil(); };
$("avatarBtn").onclick=()=>{ vibrar(); $("photoInput").click(); };
$("addPlantBtn2").onclick=()=>{ vibrar(); formPlanta(); };

let arrancado=false;
auth.onAuthStateChanged(async u=>{
  if(!u){ mostrarLogin(); return; }
  miId=u.uid; miEmail=(u.email||"").toLowerCase();
  try{
    const ref=db.collection("personas").doc(u.uid), s=await ref.get();
    if(!s.exists) await ref.set({nombre:u.displayName||"",apodo:/^ebendezus@/.test(miEmail)?"Teté":"",fotoGoogle:u.photoURL||"",desde:new Date().toISOString(),mascota:/^matiaschoytejada@/.test(miEmail)?"zoe":"popeye"});
    else { const d=s.data(); await ref.set(d.mascota?{fotoGoogle:u.photoURL||""}:{fotoGoogle:u.photoURL||"",mascota:/^matiaschoytejada@/.test(miEmail)?"zoe":"popeye"},{merge:true}); }
  }catch(e){ if(e.code==="permission-denied"){ mostrarLogin(`La cuenta ${u.email} no tiene permiso para entrar al jardín.`); return; } }
  $("login").hidden=true;
  if(arrancado) return; arrancado=true;
  try{ await sembrar(); }catch(e){ console.warn("semilla",e); }
  registrarToken(false);
  const listos=new Set(), marcar=k=>{ listos.add(k); if(listos.size>=5){ render(); cargado=true; } };
  db.collection("personas").onSnapshot(s=>{ personas={}; s.docs.forEach(d=>personas[d.id]=d.data()); marcar("p"); if(cargado) render(); });
  db.collection("plantas").onSnapshot(s=>{ plantas=s.docs.map(d=>({id:d.id,...d.data()})).filter(p=>!p.archivada).sort((a,b)=>(a.orden??0)-(b.orden??0)); marcar("pl"); if(cargado) render(); });
  db.collection("registro").orderBy("fecha","desc").limit(800).onSnapshot(s=>{ entradas=s.docs.map(d=>({id:d.id,...d.data()})); marcar("r"); if(cargado) render(); },()=>toast("Se perdió la conexión. Revisa tu internet."));
  db.collection("compras").onSnapshot(s=>{ compras=s.docs.map(d=>({id:d.id,...d.data()})); marcar("c"); if(cargado) render(); },()=>marcar("c"));
  db.collection("ajustes").onSnapshot(s=>{ const d=s.docs.find(x=>x.id==="ciruquis"); equipado=d?(d.data().equipado||[]):null; marcar("a"); if(cargado) render(); },()=>marcar("a"));
});
