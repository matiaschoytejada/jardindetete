// Revisa cómo está Ciruquis y, solo si hace falta, le manda un aviso a Teté.
// Corre en GitHub Actions con TZ=America/Lima.
import admin from "firebase-admin";

const MODO = process.env.MODE || "tarde";          // tarde | manana | prueba
const APP = process.env.APP_URL || "/";
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore();

// Mensajitos: cada 15 minutos se avisan los que aún no se avisaron
if (MODO === "mensajes") {
  const pend = await db.collection("mensajes").where("notificado", "==", false).get();
  if (pend.empty) { console.log("Sin mensajitos nuevos."); process.exit(0); }
  const gente = Object.fromEntries((await db.collection("personas").get()).docs.map(d => [d.id, d.data()]));
  const nom = uid => { const p = gente[uid] || {}; return (p.apodo || "").trim() || (p.nombre || "").split(" ")[0] || "tu familia"; };
  const toks = (await db.collection("tokens").get()).docs;
  for (const m of pend.docs) {
    const d = m.data();
    const dest = toks.filter(t => d.para === "*" ? t.data().uid !== d.de : t.data().uid === d.para);
    if (dest.length) {
      const res = await admin.messaging().sendEach(dest.map(t => ({
        token: t.id,
        data: { title: `💌 Mensajito de ${nom(d.de)}`, body: String(d.texto || "").slice(0, 140), tag: "msg-" + m.id, link: APP + "#mensajes" },
        webpush: { headers: { Urgency: "high", TTL: "86400" }, fcmOptions: { link: APP + "#mensajes" } }
      })));
      await Promise.all(res.responses.map((x, i) => (!x.success && /not-registered|invalid-argument/.test(x.error?.code || "")) ? dest[i].ref.delete() : null));
      console.log(`Mensaje ${m.id}: ${res.successCount}/${dest.length}`);
    }
    await m.ref.update({ notificado: true });
  }
  process.exit(0);
}

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
const CUIDADO = ["riego", "revision", "plagas", "abono", "poda", "brotes"];
const cuid = reg.filter(e => CUIDADO.includes(e.tipo));
const activoHoy = cuid.some(e => entre(e.fecha, hoy) === 0);

// rachas (igual que en la app, con protectores): la del jardín es de todos; la de aprender, de cada uno
function racha(lista, prot) {
  const act = new Set(lista.map(e => clave(e.fecha)));
  if (!act.size) return 0;
  prot = prot.map(c => dia(c.fecha));
  let s = 0, usados = 0;
  for (let d = dia(lista[lista.length - 1].fecha); d < dia(hoy); d.setDate(d.getDate() + 1)) {
    if (act.has(clave(d))) s++;
    else if (s > 0 && prot.filter(p => p <= d).length - usados > 0) usados++;
    else s = 0;
  }
  return s;
}
const aprendeDe = uid => reg.filter(e => (e.tipo === "leccion" || e.tipo === "dato") && e.quien === uid);
const rachaA = uid => racha(aprendeDe(uid), compras.filter(c => c.item === "protector-aprendizaje" && c.quien === uid));
const r = racha(cuid, compras.filter(c => c.item === "protector"));
const plagasDomingo = hoy.getDay() === 0 && estados.some(s => s.plagasToca);
const sinAguaTxt = n => n >= 99 ? "mucho tiempo" : `${n} días`;

// arma el aviso con el apodo de quien lo recibe
function aviso(c, uid) {
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
  const aprendioHoy = aprendeDe(uid).some(e => entre(e.fecha, hoy) === 0), ra = rachaA(uid);
  if (!aprendioHoy && ra > 0)
    return { title: `Tu racha de aprendizaje: ${ra} día${ra === 1 ? "" : "s"} 📚`, body: `No la pierdas, ${c}. La lección de hoy toma un minuto.`, tag: "aprende" };
  if (!activoHoy)
    return { title: `Ciruquis te extraña, ${c} 🧶`, body: "Un cuidado de hoy enciende la racha del jardín.", tag: "racha" };
  if (!aprendioHoy)
    return { title: `${c}, hay un dato curioso nuevo 💡`, body: "Ábrelo en Aprender y súmalo a tu álbum.", tag: "aprende" };
  return null;
}
const apodoDe = uid => { const p = personas[uid] || {}; return (p.apodo || "").trim() || (p.nombre || "").split(" ")[0] || ""; };

console.log({ MODO, temporada: temp.k, plantas: estados.map(e => `${e.p.nombre}:${e.animo}(${e.sinAgua}d)`), activoHoy, rachaJardin: r });

const toks = await db.collection("tokens").get();
if (toks.empty) { console.log("No hay celulares registrados todavía."); process.exit(0); }
const envios = toks.docs.map(t => ({ t, a: aviso(apodoDe(t.data().uid), t.data().uid) })).filter(x => x.a);
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
