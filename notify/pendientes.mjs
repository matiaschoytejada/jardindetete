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
    .map(d => d.data()).filter(d => (d.plantaId || "ciruquis") === p.plantaId && new Date(d.fecha).toLocaleDateString("en-CA", { timeZone: "America/Lima" }) === dia);
  if (mismos.length) { console.log(`Ya había un ${p.tipo} el ${dia}; no lo duplico.`); continue; }
  const doc = { tipo: p.tipo, nota: p.nota || "", fecha: new Date(p.fecha).toISOString(), quien: quien.id, plantaId: p.plantaId };
  if (anota && anota.id !== quien.id) doc.anotadoPor = anota.id;
  await ref.set(doc);
  console.log(`Anotado: ${p.tipo} de ${p.persona} el ${dia}`);
}
