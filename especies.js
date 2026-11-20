/* Catálogo de plantas del Jardín de Teté.
   riego: días máximos entre riegos según temporada en Lima (verano nov–abr, primavera oct, otoño may, invierno jun–sep).
   abono: cada cuántos días en temporada de crecimiento (oct–abr); 0 = no hace falta.
   Lo usan la app y el script de avisos. */
(typeof self !== "undefined" ? self : globalThis).ESPECIES = {
  bugambilia: {
    nombre: "Bugambilia", forma: "flor",
    riego: { verano: 4, primavera: 7, otono: 10, invierno: 15 }, abono: 21,
    tips: [
      "Necesita 5–6 horas de sol directo para florecer.",
      "Riega solo con la tierra seca a 3–4 cm y vacía el plato.",
      "Poda las puntas después de cada floración."
    ]
  },
  suculenta: {
    nombre: "Suculenta o cactus", forma: "suculenta",
    riego: { verano: 10, primavera: 14, otono: 18, invierno: 24 }, abono: 30,
    tips: [
      "Le encanta la luz fuerte; cerca de la ventana más soleada.",
      "Riega a fondo y espera a que la tierra esté totalmente seca.",
      "Maceta con agujeros y tierra para cactus: el exceso de agua la pudre."
    ]
  },
  potus: {
    nombre: "Potus", forma: "hojas",
    riego: { verano: 5, primavera: 7, otono: 9, invierno: 12 }, abono: 30,
    tips: [
      "Aguanta poca luz, pero crece más rápido con luz indirecta brillante.",
      "Riega cuando los primeros 2–3 cm de tierra estén secos.",
      "Si las hojas se ponen amarillas, probablemente es exceso de agua."
    ]
  },
  sansevieria: {
    nombre: "Sansevieria (lengua de suegra)", forma: "espada",
    riego: { verano: 12, primavera: 16, otono: 20, invierno: 28 }, abono: 45,
    tips: [
      "Casi indestructible: tolera sombra y olvidos.",
      "Riega poco; en invierno, una vez al mes basta.",
      "No mojes el centro de la roseta de hojas."
    ]
  },
  orquidea: {
    nombre: "Orquídea", forma: "orquidea",
    riego: { verano: 6, primavera: 7, otono: 9, invierno: 10 }, abono: 21,
    tips: [
      "Luz brillante pero sin sol directo del mediodía.",
      "Riega cuando las raíces se vean plateadas, no verdes.",
      "Nunca dejes agua acumulada en la base de las hojas."
    ]
  },
  helecho: {
    nombre: "Helecho", forma: "helecho",
    riego: { verano: 3, primavera: 4, otono: 5, invierno: 6 }, abono: 30,
    tips: [
      "Prefiere sombra luminosa y ambiente húmedo.",
      "Mantén la tierra apenas húmeda, nunca encharcada.",
      "Rocía sus hojas en los días secos de verano."
    ]
  },
  aloe: {
    nombre: "Aloe vera (sábila)", forma: "espada",
    riego: { verano: 10, primavera: 14, otono: 18, invierno: 24 }, abono: 45,
    tips: [
      "Mucho sol y tierra que drene muy bien.",
      "Riega a fondo solo cuando la tierra esté completamente seca.",
      "Si las hojas se doblan o se ponen finas, le falta luz o agua."
    ]
  },
  monstera: {
    nombre: "Monstera (costilla de Adán)", forma: "hojas",
    riego: { verano: 6, primavera: 8, otono: 10, invierno: 12 }, abono: 30,
    tips: [
      "Luz indirecta brillante; el sol directo quema sus hojas.",
      "Riega cuando la mitad superior de la tierra esté seca.",
      "Limpia sus hojas grandes con un paño húmedo."
    ]
  },
  otra: {
    nombre: "Otra planta", forma: "hojas",
    riego: { verano: 5, primavera: 7, otono: 9, invierno: 12 }, abono: 30,
    tips: [
      "Haz la prueba del dedo antes de regar.",
      "Vacía siempre el plato después de regar.",
      "Fíjate en sus hojas: te dirán si le falta luz o agua."
    ]
  }
};
(typeof self !== "undefined" ? self : globalThis).temporadaLima = function (d) {
  const m = new Date(d).getMonth() + 1;
  if (m >= 11 || m <= 4) return { k: "verano", n: "Verano", crece: true };
  if (m === 10) return { k: "primavera", n: "Primavera", crece: true };
  if (m === 5) return { k: "otono", n: "Otoño", crece: false };
  return { k: "invierno", n: "Invierno", crece: false };
};
