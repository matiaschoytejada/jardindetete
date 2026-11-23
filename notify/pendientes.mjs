// Anota cuidados que Matias pidió registrar desde el chat con Claude.
// Es idempotente: cada cuidado tiene un id fijo, así que correrlo dos veces no duplica nada.
import admin from "firebase-admin";
import { readFileSync } from "node:fs";

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore();
const pend = JSON.parse(readFileSync(new URL("./pendientes.json", import.meta.url)));
const gente = (await db.collection("personas").get()).docs.map(d => ({ id: d.id, ...d.data() }));
const buscar = n => gente.find(p => (p.apodo || "").trim().toLowerCase() === n.toLowerCase() || (p.nombre || "").toLowerCase().split(" ")[0] === n.toLowerCase()
  || (n === "Teté" && /esthef/i.test(p.nombre || "")));

for (const p of pend) {
  const quien = buscar(p.persona), anota = p.anotadoPor ? buscar(p.anotadoPor) : null;
  if (!quien) { console.log(`No encontré a ${p.persona} entre: ${gente.map(g => g.apodo || g.nombre).join(", ")}`); process.exitCode = 1; continue; }
  const ref = db.collection("registro").doc(p.id);
  if ((await ref.get()).exists) { console.log(`Ya estaba: ${p.id}`); continue; }
  const dia = p.fecha.slice(0, 10);
  const mismos = (await db.collection("registro").where("tipo", "==", p.tipo).get()).docs
    .map(d => ({ ref: d.ref, ...d.data() })).filter(d => (d.plantaId || "ciruquis") === p.plantaId && new Date(d.fecha).toLocaleDateString("en-CA", { timeZone: "America/Lima" }) === dia);
  if (mismos.length) {
    const nom = uid => { const g = gente.find(x => x.id === uid); return g ? (g.apodo || g.nombre || uid) : "Claude/sin nombre"; };
    console.log(`Ya había ${mismos.length} ${p.tipo} el ${dia}: ` + mismos.map(m => `${nom(m.quien)} a las ${new Date(m.fecha).toLocaleTimeString("es-PE", { timeZone: "America/Lima" })}`).join("; "));
    if (mismos.some(m => m.quien === quien.id)) { console.log("Ya está a su nombre. No cambio nada."); continue; }
    const m = mismos[0];
    await m.ref.update({ quien: quien.id, anotadoPor: m.quien || (anota ? anota.id : null) });
    console.log(`Pasado a nombre de ${p.persona}: el riego que había anotado ${nom(m.quien)}.`);
    continue;
  }
  const doc = { tipo: p.tipo, nota: p.nota || "", fecha: new Date(p.fecha).toISOString(), quien: quien.id, plantaId: p.plantaId };
  if (anota && anota.id !== quien.id) doc.anotadoPor = anota.id;
  await ref.set(doc);
  console.log(`Anotado: ${p.tipo} de ${p.persona} el ${dia}`);
}
