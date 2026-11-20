/* Service worker de Ciruquis: funciona sin conexión y muestra los avisos. */
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js",
  "config.js"
);
const CACHE = "ciruquis-v3";
const BASE = self.registration.scope;
const SHELL = ["", "index.html", "app.css", "app.js", "contenido.js", "especies.js", "config.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/badge-96.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(p => BASE + p))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Primero la red (para recibir siempre la última versión); sin conexión, lo guardado. */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const propio = url.origin === location.origin;
  const fuentes = /fonts\.(googleapis|gstatic)\.com|gstatic\.com\/firebasejs/.test(url.href);
  if (!propio && !fuentes) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match(BASE + "index.html")))
  );
});

/* Avisos: llegan como datos y los dibujamos nosotros, con la carita de Ciruquis. */
firebase.initializeApp(self.CIRUQUIS_CONFIG.firebase);
const messaging = firebase.messaging();
messaging.onBackgroundMessage(payload => {
  const d = payload.data || {};
  return self.registration.showNotification(d.title || "Ciruquis", {
    body: d.body || "",
    icon: BASE + "icons/icon-192.png",
    badge: BASE + "icons/badge-96.png",
    tag: d.tag || "ciruquis",
    renotify: true,
    vibrate: [120, 60, 120],
    data: { link: d.link || BASE }
  });
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const link = (e.notification.data && e.notification.data.link) || BASE;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
    const w = ws.find(c => c.url.startsWith(BASE));
    return w ? w.focus() : self.clients.openWindow(link);
  }));
});
