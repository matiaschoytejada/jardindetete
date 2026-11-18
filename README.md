# Ciruquis 🌺

La bugambilia de Teté, convertida en app: racha diaria, monedas, medallas, tienda de regalitos,
lecciones y datos curiosos. Se instala desde el navegador del celular y manda avisos cuando
Ciruquis tiene sed o la racha está en peligro.

- **App:** archivos estáticos en la raíz, publicados con GitHub Pages.
- **Datos:** Firebase (Authentication con Google + Firestore). Solo las cuentas autorizadas en las reglas de Firestore pueden leer o escribir.
- **Avisos:** `.github/workflows/avisos.yml` corre `notify/index.mjs` a las 7:00 p. m. y 8:30 a. m. (hora de Lima) y envía notificaciones con Firebase Cloud Messaging. Necesita el secreto `FIREBASE_SERVICE_ACCOUNT`.

Para probar un aviso: pestaña **Actions → Avisos de Ciruquis → Run workflow → prueba**.

Hecho con cariño, en honor a la abuelita Ciruquis 🧶
