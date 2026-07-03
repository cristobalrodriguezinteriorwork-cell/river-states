══════════════════════════════════════════════════════════
  PORTAL DEL CLIENTE — RIVER STATES   (preparado por Adrian)
══════════════════════════════════════════════════════════

QUÉ ES: una página web donde tu cliente (el desarrollador) entra con un
código y ve el avance en vivo (plano con colores, % de avance, estado por
etapa) y reporta GARANTÍAS. Ustedes (admin) programan visitas y marcan
arreglado. El token de Monday queda SEGURO en el servidor (no en el navegador).

ARCHIVOS EN ESTA CARPETA:
  • cliente.html                     → va en la RAÍZ del repo river-states
  • netlify/functions/portal.js      → va en el repo, en esa misma ruta

────────────────────────────────────────────────
PASO 1 — SUBIR LOS ARCHIVOS AL REPO (GitHub web)
────────────────────────────────────────────────
1. Entra al repo "river-states" en GitHub.
2. Sube "cliente.html" a la raíz (Add file → Upload files → arrástralo → Commit).
3. Crea el archivo de la función:
   Add file → Create new file → en el nombre escribe EXACTAMENTE:
        netlify/functions/portal.js
   (al escribir las barras "/", GitHub crea las carpetas solo)
   → pega TODO el contenido de portal.js → Commit.

────────────────────────────────────────────────
PASO 2 — PONER LAS CLAVES EN NETLIFY (una sola vez)
────────────────────────────────────────────────
En Netlify → tu sitio de River States → "Site configuration" →
"Environment variables" → Add a variable. Agrega estas 3:

   MONDAY_TOKEN        = (tu token de Monday, el mismo de Power BI)
   PORTAL_CLIENT_CODE  = (un código para el cliente, ej: 2050)
   PORTAL_ADMIN_CODE   = (un código para ustedes, ej: 9090)

*** Elige tú los códigos. No compartas el ADMIN con el cliente. ***

Luego → Deploys → "Trigger deploy" → "Deploy site" (o se despliega solo al subir).

────────────────────────────────────────────────
PASO 3 — PROBAR
────────────────────────────────────────────────
Abre:  https://rivers-tate.netlify.app/cliente.html
  • Con el código de CLIENTE  → ves todo + puedes reportar garantías.
  • Con el código de ADMIN    → además programas visita y marcas ✓ arreglado.

Le das al cliente ese link + su código. ¡Listo!

NOTAS:
  • Necesita que "logo.png" y el PDF del plano ya estén en el repo (ya están, la app los usa).
  • Las FOTOS del avance las agregamos en la próxima versión del portal.
  • Si algo falla, mándame el mensaje y lo arreglamos.
