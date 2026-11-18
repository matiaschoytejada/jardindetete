// Revisa cómo está Ciruquis y, solo si hace falta, le manda un aviso a Teté.
// Corre en GitHub Actions con TZ=America/Lima.
import admin from "firebase-admin";

const MODO = process.env.MODE || "tarde";          // tarde | manana | prueba
const APP = process.env.APP_URL || "/";
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore();

const dia = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const clave = d => dia(d).toDateString();
const entre = (a, b) => Math.round((dia(b) - dia(a)) / 86400000);
function temporada(d) {
  const m = new Date(d).getMonth() + 1;
  if (m >= 11 || m <= 4) return { max: 4 };
  if (m === 10) return { max: 7 };
  if (m === 5) return { max: 10 };
  return { max: 15 };
}
const esAgua = e => e.tipo === "riego" || (e.tipo === "revision" && e.nota === "humeda");

const hoy = new Date();
const reg = (await db.collection("registro").orderBy("fecha", "desc").limit(500).get()).docs.map(d => d.data());
const compras = (await db.collection("compras").get()).docs.map(d => d.data());

// estado de agua
const ultAgua = reg.find(esAgua);
const max = temporada(hoy).max;
const sinAgua = ultAgua ? entre(ultAgua.fecha, hoy) : 99;
const animo = sinAgua <= max - 2 ? "feliz" : sinAgua <= max ? "sed" : sinAgua <= max * 2 ? "agua" : "rescate";
const aguaHoy = reg.some(e => esAgua(e) && entre(e.fecha, hoy) === 0);
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
const ultPlagas = reg.find(e => e.tipo === "plagas");
const plagasToca = !ultPlagas || entre(ultPlagas.fecha, hoy) >= 14;

let aviso = null;
if (MODO === "prueba") {
  aviso = { title: "¡Hola, Teté! Soy Ciruquis 💜", body: "Así te voy a avisar cuando te necesite. Ya puedes seguir tejiendo tranquila.", tag: "prueba" };
} else if (MODO === "manana") {
  if (animo === "rescate" && !aguaHoy)
    aviso = { title: "Buenos días, Teté… ¡rescátame! 🥀", body: `Llevo ${sinAgua} días sin agüita. Antes de irte, ¿me revisas la tierra?`, tag: "agua" };
} else {
  if (!aguaHoy && (animo === "agua" || animo === "rescate"))
    aviso = { title: "Teté, ¡tengo sed! 💧", body: `Llevo ${sinAgua} días sin agüita. Hazme la prueba del dedo y, si estoy seca, riégame.`, tag: "agua" };
  else if (!activoHoy && animo === "sed")
    aviso = { title: "Teté, ya me va dando sed…", body: "Hazme la prueba del dedo hoy, porfa. Tu racha también te lo agradece.", tag: "agua" };
  else if (!activoHoy && r > 0)
    aviso = { title: `¡Tu racha de ${r} día${r === 1 ? "" : "s"} está en peligro! 🔥`, body: plagasToca && hoy.getDay() === 0 ? "Hoy toca patrulla de plagas. Con eso la salvas, Teté." : "Una lección o el dato curioso de hoy la salvan, Teté.", tag: "racha" };
  else if (!activoHoy)
    aviso = { title: "Ciruquis te extraña, Teté 🧶", body: "Hoy hay un dato curioso nuevo esperándote. ¿Vienes un ratito?", tag: "racha" };
}

console.log({ MODO, sinAgua, animo, aguaHoy, activoHoy, racha: r, plagasToca, aviso: aviso?.title || "ninguno" });
if (!aviso) process.exit(0);

const toks = await db.collection("tokens").get();
if (toks.empty) { console.log("No hay celulares registrados todavía."); process.exit(0); }
const res = await admin.messaging().sendEach(toks.docs.map(t => ({
  token: t.id,
  data: { ...aviso, link: APP },
  webpush: { headers: { Urgency: "high", TTL: "43200" }, fcmOptions: { link: APP } }
})));
await Promise.all(res.responses.map((x, i) => {
  if (x.success) return null;
  const code = x.error?.code || "";
  console.log("falló", code);
  if (code.includes("registration-token-not-registered") || code.includes("invalid-argument")) return toks.docs[i].ref.delete();
  return null;
}));
console.log(`Enviados: ${res.successCount}/${toks.size}`);
