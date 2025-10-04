# SpaceApp-NASA — Registro de cambios y resumen

Fecha: 2025-10-03

Proyecto: SpaceApp-NASA
Ruta base: `frontend/ui/` y `backend/`

## Resumen ejecutable — Cambios realizados

Objetivo general
- Separar la "línea de tiempo" en páginas individuales (Fulguraciones, CMEs, Tormentas geomagnéticas, NEOs).
- Implementar una visualización interactiva para CMEs (mapa/visualización SVG con zoom y animación del frente hasta 1 AU).
- Aislar estilos por página para evitar que reglas específicas (overlay, leyendas, botones) afecten otras páginas.
- Evitar fugas visuales: eliminar botones de compartir y neutralizar estilos asociados.

Enfoque aplicado
- Cambios en HTML, JS y CSS del frontend.
- Añadidos endpoints y wrappers en el backend para consultar DONKI y NeoWs/APOD.
- Creación de hojas de estilo por página (cmes.css, flares.css) para contener reglas específicas.

---

## Cambios principales (resumen por archivo / componente)

### frontend/ui/js/cmes.js
- Implementación completa de la visualización de CMEs (módulo ES):
  - Visualización SVG con un <g> escalable (`visualGroup`) usado para zoom interno.
  - Dibujo del Sol y conos de CMEs a partir de `cmeAnalyses` (longitude, halfAngle, speed).
  - Lista desplazable con #cme-list; items clicables muestran detalles y resaltan la CME seleccionada.
  - Funciones clave: `loadCMEs`, `renderList`, `showDetails`, `highlightCME`, `animateCME`, `createConePath`, `setScale`.
  - Animación del frente usando `requestAnimationFrame` (propagación según `speed` y distancia hasta 1 AU).
  - Controles UI: "7 días" para recarga, "Animar CME seleccionada", botones de zoom (+ / -) en overlay.
  - Mapeo espacial: AU_KM = 149,597,870 km; cálculo `pxPerKm` según tamaño visual.
  - Autocarga por defecto: últimos 7 días.

Ubicación: `frontend/ui/js/cmes.js` (módulo ES).

### frontend/ui/css/cmes.css
- Nueva hoja de estilos por-página con reglas específicas para la visualización (botones `cme-btn`, leyenda `.cme-legend`, overlay `.cme-zoom-overlay`, etc.).
- Objetivo: evitar que reglas para el visualizador CMEs afecten otras páginas.

### frontend/ui/css/flares.css
- Nueva hoja por-página (copia inicial de `styles.css`) preparada para contener reglas específicas de Fulguraciones.

### frontend/ui/css/styles.css
- Archivo global principal con paleta, diseño base, navegación, tarjetas y utilidades.
- Reglas específicas migradas a archivos por-página cuando fue apropiado.
- Actualización reciente: la clase `.btn-share` ha sido neutralizada (ahora `display: none !important;`) para evitar que botones de compartir aparezcan en el modal.

### frontend/ui/html/index.html
- Navegación actualizada (vínculos a `flares.html`, `cmes.html`, `gst.html`, `neos.html`).
- Timeline principal movido a páginas separadas; la sección actual muestra tarjetas/redirección.
- Modal de detalles: los botones de compartir fueron eliminados del HTML; el elemento `modal-footer` ahora está oculto (aria-hidden, `display:none`).

### frontend/ui/html/cmes.html
- Contenedor preparado para el visualizador (`#cme-content`, `#cme-visual`).
- Nota: el usuario restauró algunas versiones; si deseas que `cmes.js` inyecte el H1 y otros elementos, hay una versión alternativa que lo hace (reaplicar si procede).

### backend/services/nasaAPI.js
- Wrappers/funciones añadidas para las APIs NASA/DONKI/NeoWs/APOD: `getFlares`, `getCMEs`, `getCMEAnalysis`, `getNeoFeed`, `getAPOD`, etc.
- Implementación usa `fetchWithRetry` (desde `utils/`) y gestiona formatos de fecha con utilitarios (p. ej. `dayjs` si está disponible).

### backend/routes/donki.js
- Router Express con endpoints: `/flares`, `/cmes`, `/gst`, `/hss`, `/ips`, `/rbe`, `/sep`, `/wsa-enlil`, `/cme-analysis`, `/notifications`, `/mpc`.
- Simple caching en memoria (Map con TTL) para reducir llamadas repetidas a la API pública.

---

## Cambios de comportamiento y decisiones de diseño

Visualización CMEs
- Zoom: se implementó escalado del grupo `visualGroup` dentro del SVG, manteniendo el viewport fijo (mejor control y menos reflujo).
- Animación: la propagación frontal de la CME se calcula a partir del `speed` (km/s) y la distancia a 1 AU; la animación usa `requestAnimationFrame`.
- Resalte: la selección en la lista resalta la CME y aplica un pulso sobre el frente (actualmente basado en `setInterval`, se puede migrar a `rAF` para suavizar).
- Datos: `cmes.js` consume datos a través de `AstroService` (ubicado en `frontend/infra/service/AstroService.js`) que hace peticiones al backend. `AstroService.getCMEs(days)` y `AstroService.getCMEAnalysis(start,end)` son usados por el visualizador.

Separación CSS por página
- Razón: reglas específicas pueden introducir side-effects entre páginas (por ejemplo, overlays y botones del visualizador CMEs que modifiquen globalmente `.modal-footer` o `.btn-share`).
- Estado: `cmes.css` y `flares.css` creados; `gst.css` y `neos.css` pendientes o revertidos por el usuario.

Eliminación de botones de compartir
- Acciones realizadas:
  - Eliminado el listener en `frontend/ui/js/main.js` que reaccionaba a `.btn-share`.
  - Eliminados los botones en `frontend/ui/html/index.html` (modal footer).
  - CSS `.btn-share` neutralizado en `frontend/ui/css/styles.css` (`display:none !important;`).
- Resultado: las opciones de compartir ya no aparecen en el modal de detalles completos.

---

## Estado actual y archivos revertidos
- Algunos archivos HTML/CSS fueron revertidos por el usuario (index.html, flares.html, cmes.html, gst.html, neos.html, gst.css, neos.css). Antes de continuar con más cambios, confirmar si quieres que re-aplique la versión con inyección JS de `cmes.html` y que cree `gst.css` / `neos.css`.

## Tareas pendientes (recomendadas)
1. Crear `frontend/ui/css/gst.css` y `frontend/ui/css/neos.css` (copias por-página o adaptadas).
2. Reaplicar/adaptar los cambios en `cmes.html` para que cargue `cmes.css` y permita la inyección por `cmes.js` (si ese comportamiento lo deseas).
3. Ejecutar verificación end-to-end: levantar backend y comprobar que `cmes.js` obtiene datos reales y que la animación/highlight funcionan.
4. Mejoras: migrar el pulso a `rAF`, añadir controles de pausa y reset de zoom, y pruebas unitarias para funciones puras.

## Instrucciones rápidas para probar (opcional)
- Desde la raíz del repositorio:

```powershell
cd backend
npm install
npm start
```

- Luego, servir `frontend/ui/html` con un servidor estático (por ejemplo `npx serve frontend/ui/html` o abrir `index.html` en un navegador desde un simple servidor) y navegar a `cmes.html`.

---

## Registro de cambios específicos recientes (delta)
- Eliminado handler JS para botones `.btn-share` en `frontend/ui/js/main.js`.
- Eliminados botones de compartir del modal en `frontend/ui/html/index.html`.
- Neutralizada la clase `.btn-share` en `frontend/ui/css/styles.css` (ahora `display:none !important;`).

---

Si quieres, puedo:
- Reaplicar la versión JS-driven de `cmes.html` y actualizar sus referencias CSS.
- Crear `gst.css` y `neos.css` ahora.
- Hacer un commit con estos cambios y un mensaje claro.


