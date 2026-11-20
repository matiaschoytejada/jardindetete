// Revisa cómo está Ciruquis y, solo si hace falta, le manda un aviso a Teté.
// Corre en GitHub Actions con TZ=America/Lima.
import admin from "firebase-admin";

const MODO = process.env.MODE || "tarde";          // tarde | manana | prueba
const APP = process.env.APP_URL || "/";
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore();

globalThis.self = globalThis;
await import("../especies.js");
const dia = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const clave = d => dia(d).toDateString();
const entre = (a, b) => Math.round((dia(b) - dia(a)) / 86400000);
const esAgua = e => e.tipo === "riego" || (e.tipo === "revision" && e.nota === "humeda");
const plantaDe = e => e.plantaId || "ciruquis";

const hoy = new Date();
const temp = temporadaLima(hoy);
const reg = (await db.collection("registro").orderBy("fecha", "desc").limit(800).get()).docs.map(d => d.data());
const compras = (await db.collection("compras").get()).docs.map(d => d.data());
let plantas = (await db.collection("plantas").get()).docs.map(d => ({ id: d.id, ...d.data() })).filter(p => !p.archivada);
if (!plantas.length) plantas = [{ id: "ciruquis", nombre: "Ciruquis", especie: "bugambilia" }];
const personas = Object.fromEntries((await db.collection("personas").get()).docs.map(d => [d.id, d.data()]));

// estado de agua de cada planta; la más necesitada manda
const ORDEN = { feliz: 0, sed: 1, agua: 2, rescate: 3 };
const estados = plantas.map(p => {
  const max = (ESPECIES[p.especie] || ESPECIES.otra).riego[temp.k];
  const de = reg.filter(e => plantaDe(e) === p.id);
  const ult = de.find(esAgua);
  const sinAgua = ult ? entre(ult.fecha, hoy) : 99;
  const animo = sinAgua <= Math.max(0, max - 2) ? "feliz" : sinAgua <= max ? "sed" : sinAgua <= max * 2 ? "agua" : "rescate";
  const aguaHoy = de.some(e => esAgua(e) && entre(e.fecha, hoy) === 0);
  const ultPlagas = de.find(e => e.tipo === "plagas");
  return { p, max, sinAgua, animo, aguaHoy, plagasToca: !ultPlagas || entre(ultPlagas.fecha, hoy) >= 14 };
}).sort((a, b) => ORDEN[b.animo] - ORDEN[a.animo] || b.sinAgua - a.sinAgua);
const peor = estados.find(s => !s.aguaHoy) || estados[0];
const activoHoy = reg.some(e => entre(e.fecha, hoy) === 0);

// racha (igual que en la app, con protectores)
function racha() {
  const act = new Set(reg.map(e => clave(e.fecha)));
  if (!act.size) return 0;
  const prot = compras.filter(c => c.item === "protector").map(c => dia(c.fecha));
  let s = 0, usados = 0;
  for (let d = dia(reg[reg.length - 1].fecha); d < dia(hoy); d.setDate(d.getDate() + 1)) {
    if (act.has(clave(d))) s++;
    else if (s > 0 && prot.filter(p => p <= d).length - usados > 0) usados++;
    else s = 0;
  }
  return s;
}
const r = racha();
const plagasDomingo = hoy.getDay() === 0 && estados.some(s => s.plagasToca);
const sinAguaTxt = n => n >= 99 ? "mucho tiempo" : `${n} días`;

// arma el aviso con el apodo de quien lo recibe
function aviso(c) {
  const n = peor.p.nombre, yo = n === "Ciruquis" ? "Ciruquis" : n;
  if (MODO === "prueba") return { title: `¡Hola, ${c}! Soy Ciruquis 💜`, body: "Así te voy a avisar cuando el jardín te necesite.", tag: "prueba" };
  if (MODO === "manana") {
    if (peor.animo === "rescate" && !peor.aguaHoy) return { title: `Buenos días, ${c}… ¡${yo} necesita rescate! 🥀`, body: `Lleva ${sinAguaTxt(peor.sinAgua)} sin agüita. Antes de irte, ¿le revisas la tierra?`, tag: "agua" };
    return null;
  }
  if (!peor.aguaHoy && (peor.animo === "agua" || peor.animo === "rescate"))
    return { title: n === "Ciruquis" ? `${c}, ¡tengo sed! 💧` : `${c}, ${n} tiene sed 💧`, body: `${sinAguaTxt(peor.sinAgua)} sin agüita. Prueba del dedo y, si está seca, a regar.`, tag: "agua" };
  if (!activoHoy && peor.animo === "sed")
    return { title: n === "Ciruquis" ? `${c}, ya me va dando sed…` : `${c}, a ${n} ya le va dando sed…`, body: "Hazle la prueba del dedo hoy, porfa. Tu racha también te lo agradece.", tag: "agua" };
  if (!activoHoy && r > 0)
    return { title: `¡Tu racha de ${r} día${r === 1 ? "" : "s"} está en peligro! 🔥`, body: plagasDomingo ? `Hoy toca patrulla de plagas. Con eso la salvas, ${c}.` : `Una lección o el dato curioso de hoy la salvan, ${c}.`, tag: "racha" };
  if (!activoHoy)
    return { title: `Ciruquis te extraña, ${c} 🧶`, body: "Hoy hay un dato curioso nuevo esperándote. ¿Vienes un ratito?", tag: "racha" };
  return null;
}
const apodoDe = uid => { const p = personas[uid] || {}; return (p.apodo || "").trim() || (p.nombre || "").split(" ")[0] || "Teté"; };

console.log({ MODO, temporada: temp.k, plantas: estados.map(e => `${e.p.nombre}:${e.animo}(${e.sinAgua}d)`), activoHoy, racha: r });

const toks = await db.collection("tokens").get();
if (toks.empty) { console.log("No hay celulares registrados todavía."); process.exit(0); }
const envios = toks.docs.map(t => ({ t, a: aviso(apodoDe(t.data().uid)) })).filter(x => x.a);
if (!envios.length) { console.log("Hoy no hace falta avisar."); process.exit(0); }
const res = await admin.messaging().sendEach(envios.map(({ t, a }) => ({
  token: t.id,
  data: { ...a, link: APP },
  webpush: { headers: { Urgency: "high", TTL: "43200" }, fcmOptions: { link: APP } }
})));
await Promise.all(res.responses.map((x, i) => {
  if (x.success) return null;
  const code = x.error?.code || "";
  console.log("falló", code);
  if (code.includes("registration-token-not-registered") || code.includes("invalid-argument")) return envios[i].t.ref.delete();
  return null;
}));
console.log(`Enviados: ${res.successCount}/${envios.length}`, envios.map(e => e.a.title));
