import { AstroService } from '../../infra/service/AstroService.js';
import { addItem as addHistItem, getByType as getHistByType, removeItem as removeHistItem, clearType as clearHistType } from '../../infra/util/historyStore.js';

const container = document.querySelector('.container');
const svgNS = 'http://www.w3.org/2000/svg';
const width = 900, height = 600;
const svg = document.createElementNS(svgNS, 'svg');
svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
svg.setAttribute('width', '100%');
svg.setAttribute('height', '480');
svg.style.background = 'radial-gradient(circle at 50% 50%, #fff7e6, #ffd966)';

// internal group which will be scaled for zoom (keeps svg viewport fixed)
const visualGroup = document.createElementNS(svgNS, 'g');
svg.appendChild(visualGroup);

const centerX = width/2, centerY = height/2;

// Sun (small relative to 1 AU)
const sun = document.createElementNS(svgNS,'circle');
sun.setAttribute('cx', centerX);
sun.setAttribute('cy', centerY);
sun.setAttribute('r', 20);
sun.setAttribute('fill', '#ffcc33');
sun.setAttribute('stroke', '#ff9900');
visualGroup.appendChild(sun);

// Layout: left visual, right panel
const layout = document.createElement('div');
layout.style.display = 'grid';
layout.style.gridTemplateColumns = '1fr 320px';
layout.style.gap = '1rem';
layout.style.alignItems = 'start';

const visualWrap = document.createElement('div');
visualWrap.appendChild(svg);
// ensure overlay absolute positioning anchors to this wrapper
visualWrap.style.position = 'relative';
visualWrap.style.display = 'inline-block';
visualWrap.style.width = '100%';
visualWrap.style.maxWidth = `${width}px`;
svg.style.display = 'block';
svg.style.width = '100%';
svg.style.height = `${height}px`;

const panel = document.createElement('div');
panel.style.minHeight = '480px';
panel.innerHTML = `
  <h3>CMEs (últimos 7 días)</h3>
  <div id="cme-list"></div>
  <div id="cme-details" style="margin-top:1rem"></div>
`;

// legend explaining the animation
const legend = document.createElement('div');
legend.className = 'cme-legend';
legend.innerHTML = `<b>¿Qué muestra la animación?</b> La animación representa la propagación frontal de una CME desde el Sol hacia 1 AU usando la velocidad reportada en el análisis. El cono indica la apertura angular (half-angle) y el punto rojo el frente propagándose; la estimación de llegada se calcula como distancia a 1 AU / velocidad.`;
panel.appendChild(legend);

layout.appendChild(visualWrap);
layout.appendChild(panel);
container.prepend(layout);

// Top-level title + history: el usuario quiere Titular y debajo el histórico
if(!document.getElementById('cme-history-wrapper')){
  // Aseguramos un h1 consistente al inicio del contenedor
  let titleEl = document.getElementById('cme-page-title');
  if(!titleEl){
    titleEl = document.createElement('h1');
    titleEl.id = 'cme-page-title';
    titleEl.textContent = 'Mapa de CMEs';
    titleEl.style.margin = '0 0 .65rem';
    container.prepend(titleEl);
  }
  const cmeHistWrapper = document.createElement('div');
  cmeHistWrapper.id = 'cme-history-wrapper';
  cmeHistWrapper.style.margin = '0 0 1rem';
  cmeHistWrapper.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:.55rem;">
      <button id="cme-history-toggle" class="quick-load-btn btn-compact" style="font-size:.6rem;">🗂 Histórico <span id=\"cme-history-badge\" class=\"badge-count\" aria-label=\"CMEs guardadas\">0</span></button>
      <button id="cme-history-clear" class="quick-load-btn btn-compact" style="font-size:.6rem;">🧹 Limpiar</button>
    </div>
    <div id="cme-history-panel" style="margin-top:.55rem;border:1px solid rgba(255,255,255,0.12);padding:.6rem .65rem;border-radius:8px;background:rgba(255,255,255,0.04);display:none;">
      <div id="cme-history-status" style="font-size:.55rem;opacity:.8;margin-bottom:.25rem;"></div>
      <ul id="cme-history-list" style="list-style:none;padding:0;margin:0;display:grid;gap:.35rem;"></ul>
      <div style="margin-top:.45rem;font-size:.5rem;opacity:.55;line-height:1.25;">Persistencia local (este navegador). Guarda velocidad, half-angle y enlace fuente si existe.</div>
    </div>`;
  // Insertar inmediatamente después del título para cumplir estructura solicitada
  titleEl.insertAdjacentElement('afterend', cmeHistWrapper);
}

// Controls (ya no incluyen el H1 principal para evitar duplicarlo antes del histórico)
const controls = document.createElement('div');
controls.style.margin = '0.75rem 0';
controls.innerHTML = `
  <div style="display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;">
    <button id="cme-7d" class="cme-btn">7 días</button>
    <button id="cme-animate" class="cme-btn primary">Animar CME seleccionado</button>
  </div>
`;
visualWrap.insertBefore(controls, svg);

// add a small overlay in the visual area for zoom controls (top-left)
const zoomOverlay = document.createElement('div');
zoomOverlay.className = 'cme-zoom-overlay';
zoomOverlay.innerHTML = `<button id="cme-zoom-in-sm" class="cme-zoom">+</button><button id="cme-zoom-out-sm" class="cme-zoom">-</button>`;
// inline positioning to avoid external CSS overrides; place inside the visual box
zoomOverlay.style.position = 'absolute';
zoomOverlay.style.bottom = '12px';
zoomOverlay.style.left = '12px';
zoomOverlay.style.zIndex = 50;
visualWrap.appendChild(zoomOverlay);
const btnZoomInSm = zoomOverlay.querySelector('#cme-zoom-in-sm');
const btnZoomOutSm = zoomOverlay.querySelector('#cme-zoom-out-sm');
btnZoomInSm.addEventListener('click', () => setScale(currentScale + 0.2));
btnZoomOutSm.addEventListener('click', () => setScale(currentScale - 0.2));

const btn7d = controls.querySelector('#cme-7d');
const btnAnimate = controls.querySelector('#cme-animate');

let lastCMEs = [];
let selectedIndex = 0;

// ================= CME HISTORY INTEGRATION =================
const CME_HISTORY_TYPE = 'cme';
let cmeHistoryList, cmeHistoryStatus, cmeHistoryCollapsible, cmeHistoryBadge;

function initCmeHistory(){
  if(cmeHistoryList) return; // already
  const wrapper = document.getElementById('cme-history-wrapper');
  cmeHistoryList = document.getElementById('cme-history-list');
  cmeHistoryStatus = document.getElementById('cme-history-status');
  cmeHistoryCollapsible = document.getElementById('cme-history-panel');
  const btnToggle = document.getElementById('cme-history-toggle');
  const btnClear = document.getElementById('cme-history-clear');
  cmeHistoryBadge = document.getElementById('cme-history-badge');
  btnToggle?.addEventListener('click', ()=>{
    const open = cmeHistoryCollapsible.style.display !== 'none';
    cmeHistoryCollapsible.style.display = open? 'none':'block';
    if(!open) renderCmeHistory();
  });
  btnClear?.addEventListener('click', ()=>{
    if(confirm('¿Vaciar histórico de CMEs?')){
      clearHistType(CME_HISTORY_TYPE);
      renderCmeHistory();
      flashCmeHist('🗑 Vacío');
    }
  });
}

function flashCmeHist(msg){
  if(!cmeHistoryStatus) return;
  cmeHistoryStatus.textContent = msg;
  cmeHistoryStatus.style.transition='none';
  cmeHistoryStatus.style.opacity='1';
  requestAnimationFrame(()=>{
    cmeHistoryStatus.style.transition='opacity .8s ease';
    cmeHistoryStatus.style.opacity='0';
  });
}

function normalizeCME(raw){
  const analysis = raw.cmeAnalyses && raw.cmeAnalyses[0] || {};
  const id = raw.activityID || raw.startTime || (raw.time21_5) || Date.now()+'';
  const speed = analysis.speed || analysis.avgSpeed || raw.speed;
  return {
    id,
    type: CME_HISTORY_TYPE,
    date: raw.startTime || raw.time || analysis.time21_5 || null,
    label: `Vel ${speed||'?'} km/s • Half ${analysis.halfAngle||'?'}°`,
    intensity: speed || null,
    sourceUrl: raw.link || raw.catalogUrl || null,
    extra: {
      speed: speed,
      halfAngle: analysis.halfAngle,
      longitude: analysis.longitude,
      latitude: analysis.latitude,
      catalog: raw.catalog
    },
    savedAt: Date.now()
  };
}

function renderCmeHistory(){
  if(!cmeHistoryList) return;
  const items = getHistByType(CME_HISTORY_TYPE);
  cmeHistoryList.innerHTML='';
  if(cmeHistoryBadge) cmeHistoryBadge.textContent = items.length;
  if(items.length===0){
    cmeHistoryList.innerHTML='<li style="font-size:.55rem;opacity:.6;">(vacío)</li>';
    return;
  }
  items.sort((a,b)=> (b.date||'').localeCompare(a.date||''));
  for(const item of items){
    const li = document.createElement('li');
    li.style.cssText='background:rgba(255,255,255,.05);padding:.45rem .55rem;border-radius:6px;display:flex;flex-direction:column;gap:.25rem;';
    li.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;">
        <div style="flex:1;min-width:0;">
          <strong style="font-size:.6rem;">${(item.date||'').replace('T',' ').replace('Z','')}</strong>
          <div style="font-size:.55rem;line-height:1.15;margin-top:.2rem;">${item.label}</div>
          ${item.sourceUrl? `<a class="gst-source-link" style="font-size:.5rem;" href="${item.sourceUrl}" target="_blank" rel="noopener">🔗 Fuente</a>`:''}
        </div>
        <div style="display:flex;flex-direction:column;gap:.3rem;">
          <button class="quick-load-btn btn-compact" data-id="${item.id}" data-act="load" style="font-size:.5rem;">📥</button>
          <button class="quick-load-btn btn-compact" data-id="${item.id}" data-act="del" style="font-size:.5rem;">✖</button>
        </div>
      </div>`;
    cmeHistoryList.appendChild(li);
  }
  cmeHistoryList.querySelectorAll('button[data-act=del]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      removeHistItem(btn.dataset.id);
      renderCmeHistory();
      flashCmeHist('❌ Eliminada');
    });
  });
  cmeHistoryList.querySelectorAll('button[data-act=load]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id = btn.dataset.id;
      const itemsNow = getHistByType(CME_HISTORY_TYPE);
      const it = itemsNow.find(x=>x.id===id);
      if(it){
        // Try to find current dataset CME; else just flash
        const idx = lastCMEs.findIndex(c=> (c.activityID||c.startTime) === it.id);
        if(idx>=0){
          selectedIndex = idx;
          showDetails(idx);
          highlightCME(idx);
        }
        flashCmeHist('📥 Cargada');
      }
    });
  });
}

function addCurrentCMEToHistory(raw){
  const added = addHistItem(normalizeCME(raw));
  flashCmeHist(added? '✅ Guardada':'ℹ️ Ya existía');
  renderCmeHistory();
}
// ===========================================================

// Map 1 AU to visual radius
const AU_KM = 149597870; // km
const maxVisualRadius = Math.min(width, height) * 0.45; // px
const pxPerKm = maxVisualRadius / AU_KM;

function clearVisual() {
  // remove all children from the visual group and re-add the sun
  while (visualGroup.firstChild) visualGroup.removeChild(visualGroup.firstChild);
  visualGroup.appendChild(sun);
}

function createConePath(angleDeg, halfAngleDeg, radiusPx) {
  const angle = (angleDeg - 90) * Math.PI/180; // zero at top
  const a1 = angle - (halfAngleDeg*Math.PI/180);
  const a2 = angle + (halfAngleDeg*Math.PI/180);
  const x1 = centerX + radiusPx*Math.cos(a1); const y1 = centerY + radiusPx*Math.sin(a1);
  const x2 = centerX + radiusPx*Math.cos(a2); const y2 = centerY + radiusPx*Math.sin(a2);
  return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radiusPx} ${radiusPx} 0 0 1 ${x2} ${y2} Z`;
}

function renderList(cmes) {
  const list = panel.querySelector('#cme-list');
  list.innerHTML = '';
  // make the list scrollable so it doesn't stretch the page
  list.style.maxHeight = '360px';
  list.style.overflowY = 'auto';
  list.style.paddingRight = '6px';
  cmes.forEach((cme, idx) => {
    const div = document.createElement('div');
  div.className = 'cme-item';
  div.style.padding = '0.5rem';
  div.style.borderBottom = '1px solid rgba(255,255,255,0.03)';
  div.style.cursor = 'pointer';
    const t = cme.startTime || cme.time || cme.activityTime || 'N/D';
    const analysis = cme.cmeAnalyses && cme.cmeAnalyses[0];
    const speed = analysis?.speed || analysis?.avgSpeed || (cme.speed) || 'N/D';
    div.innerHTML = `<strong>${t}</strong><br/><small>Vel: ${speed} km/s • Cat: ${cme.catalog || 'N/A'}</small>`;
    div.addEventListener('click', () => { selectedIndex = idx; showDetails(idx); highlightCME(idx); div.scrollIntoView({ block: 'nearest' }); });
    list.appendChild(div);
  });
}

function showDetails(idx) {
  initCmeHistory();
  const dpanel = panel.querySelector('#cme-details');
  const cme = lastCMEs[idx];
  if (!cme) { dpanel.innerHTML = '<p class="text-muted">No hay datos</p>'; return; }
  const analysis = cme.cmeAnalyses && cme.cmeAnalyses[0];
  const speed = analysis?.speed || analysis?.avgSpeed || 'N/D';
  const halfAngle = analysis?.halfAngle || 'N/D';
  const lat = analysis?.latitude ?? analysis?.lat ?? 'N/D';
  const lon = analysis?.longitude ?? analysis?.long ?? 'N/D';
  const start = cme.startTime || cme.time || 'N/D';
  const estHours = (speed && speed !== 'N/D') ? (AU_KM / Number(speed) / 3600).toFixed(1) : 'N/D';
  const sourceSection = cme.link ? `
    <div style="margin:.75rem 0 0;padding:.6rem .7rem;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:linear-gradient(135deg,rgba(255,160,0,.08),rgba(255,160,0,.02));">
      <h5 style="margin:0 0 .4rem;font-size:.7rem;letter-spacing:.5px;display:flex;align-items:center;gap:.4rem;">
        <span style=\"font-size:.9rem;\">🔗</span> Fuente Oficial
      </h5>
      <p style="margin:0 0 .45rem;font-size:.55rem;line-height:1.3;opacity:.85;">
        Datos procedentes del catálogo DONKI (NASA) para eyecciones de masa coronal. El enlace abre el evento
        detallado con metadatos completos y actualizaciones posteriores.
      </p>
      <a class="gst-source-link" href="${cme.link}" target="_blank" rel="noopener" style="font-size:.55rem;">Ver evento en DONKI</a>
    </div>` : '';

  dpanel.innerHTML = `
    <h4>Detalles</h4>
    <p><strong>Inicio:</strong> ${start}</p>
    <p><strong>Velocidad (km/s):</strong> ${speed}</p>
    <p><strong>Half angle (deg):</strong> ${halfAngle}</p>
    <p><strong>Lat/Lon:</strong> ${lat} / ${lon}</p>
    <p><strong>Estimación llegada 1AU:</strong> ${estHours} horas (aprox.)</p>
    <div style="display:flex;justify-content:flex-end;margin:.4rem 0 .5rem;">
      <button id="cme-save-inline" class="quick-load-btn btn-compact" style="font-size:.55rem;">💾 Guardar</button>
    </div>
    ${sourceSection}
  `;
  const saveBtn = dpanel.querySelector('#cme-save-inline');
  saveBtn?.addEventListener('click', ()=> addCurrentCMEToHistory(cme));
}

// Highlight a CME on the SVG (overlay cone + pulsing front)
let currentHighlight = null;
let currentPulseInterval = null;
function highlightCME(idx) {
  // remove previous highlight
  if (currentHighlight) { currentHighlight.remove(); currentHighlight = null; }
  if (currentPulseInterval) { clearInterval(currentPulseInterval); currentPulseInterval = null; }

  const cme = lastCMEs[idx];
  if (!cme) return;
  const analysis = cme.cmeAnalyses && cme.cmeAnalyses[0];
  if (!analysis) return;

  const lon = Number(analysis.longitude || 0);
  const half = Number(analysis.halfAngle || 30);
  const path = document.createElementNS(svgNS,'path');
  const d = createConePath(lon, half, maxVisualRadius);
  path.setAttribute('d', d);
  path.setAttribute('fill', 'rgba(255,160,0,0.12)');
  path.setAttribute('stroke', 'rgba(255,160,0,0.9)');
  path.setAttribute('stroke-width', '2');
  path.classList.add('cme-highlight');

  // pulsing front indicator
  const angle = (lon - 90) * Math.PI/180;
  const front = document.createElementNS(svgNS,'circle');
  front.setAttribute('cx', centerX + Math.cos(angle) * (maxVisualRadius));
  front.setAttribute('cy', centerY + Math.sin(angle) * (maxVisualRadius));
  front.setAttribute('r', 8);
  front.setAttribute('fill', 'rgba(255,60,0,0.95)');
  front.setAttribute('class', 'cme-front');

  const g = document.createElementNS(svgNS,'g');
  g.appendChild(path);
  g.appendChild(front);
  visualGroup.appendChild(g);
  currentHighlight = g;

  // simple pulsing effect (scale r)
  let grow = true;
  let r = 8;
  currentPulseInterval = setInterval(() => {
    if (grow) { r += 0.8; if (r > 14) grow = false; }
    else { r -= 0.8; if (r < 6) grow = true; }
    front.setAttribute('r', r);
  }, 80);

  // mark selected item in list
  const items = panel.querySelectorAll('.cme-item');
  items.forEach((it, i) => { if (i === idx) { it.style.background = 'rgba(255,160,0,0.06)'; it.style.borderLeft = '3px solid rgba(255,160,0,0.9)'; } else { it.style.background = ''; it.style.borderLeft = 'none'; } });
}

async function loadCMEs(){
  initCmeHistory();
  clearVisual();
  // support: load by number of days (loadCMEs.days) or by explicit range (loadCMEs.range)
  let data;
  if (typeof loadCMEs.days === 'number') {
    data = await AstroService.getCMEs(loadCMEs.days);
  } else if (loadCMEs.range) {
    const { startDate, endDate } = loadCMEs.range;
    data = await AstroService.getCMEAnalysis(startDate, endDate);
  } else {
    data = await AstroService.getCMEs(7);
  }
  lastCMEs = data || [];
  selectedIndex = 0;
  renderList(lastCMEs);
  if (lastCMEs.length) showDetails(0);
  // draw static cones lightly for all CMEs that have analyses
  lastCMEs.forEach((cme) => {
    const analysis = cme.cmeAnalyses && cme.cmeAnalyses[0];
    if (analysis && analysis.latitude !== undefined && analysis.longitude !== undefined) {
      const lon = Number(analysis.longitude || 0);
      const half = Number(analysis.halfAngle || 30);
      const path = document.createElementNS(svgNS,'path');
      const d = createConePath(lon, half, maxVisualRadius * 0.6);
      path.setAttribute('d', d);
      path.setAttribute('fill', 'rgba(255,140,0,0.08)');
      path.setAttribute('stroke', 'rgba(255,140,0,0.15)');
      visualGroup.appendChild(path);
    }
  });
}

let animFrame = null;
function animateCME(idx) {
  // clear any previous animation or highlight
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
  if (currentHighlight) { currentHighlight.remove(); currentHighlight = null; }
  if (currentPulseInterval) { clearInterval(currentPulseInterval); currentPulseInterval = null; }
  clearVisual();
  const cme = lastCMEs[idx];
  if (!cme) return alert('Selecciona una CME');
  const analysis = cme.cmeAnalyses && cme.cmeAnalyses[0];
  if (!analysis) return alert('No hay análisis para esta CME');

  const speed = Number(analysis.speed || analysis.avgSpeed || 500); // km/s fallback
  const half = Number(analysis.halfAngle || 30);
  const lon = Number(analysis.longitude || 0);

  const startTime = performance.now();

  function step(now) {
    const elapsed = (now - startTime) / 1000; // seconds
    const distanceKm = speed * elapsed; // km
    const radiusPx = distanceKm * pxPerKm;
      // update anim elements
      const radius = Math.min(radiusPx, maxVisualRadius);
      const d = createConePath(lon, half, radius);
      animCone.setAttribute('d', d);
      const angle = (lon - 90) * Math.PI/180;
      const fx = centerX + Math.cos(angle) * radius;
      const fy = centerY + Math.sin(angle) * radius;
      animFront.setAttribute('cx', fx); animFront.setAttribute('cy', fy);

    // update details panel with current ETA
    const estSeconds = (AU_KM / speed) - elapsed; // seconds remaining to 1 AU
    const estHours = estSeconds > 0 ? (estSeconds/3600).toFixed(1) : 'Llegó';
    panel.querySelector('#cme-details').innerHTML = `<p><strong>Vel:</strong> ${speed} km/s • <strong>Tiempo estimado a 1 AU:</strong> ${estHours} h</p>`;

    if (radiusPx < maxVisualRadius) {
      animFrame = requestAnimationFrame(step);
    } else {
      animFrame = null;
    }
  }

  // create reusable anim group and elements
  const animGroup = document.createElementNS(svgNS,'g');
  const animCone = document.createElementNS(svgNS,'path');
  animCone.setAttribute('fill', 'rgba(255,100,0,0.18)');
  animCone.setAttribute('stroke', 'rgba(255,80,0,0.25)');
  const animFront = document.createElementNS(svgNS,'circle');
  animFront.setAttribute('r', 6);
  animFront.setAttribute('fill', 'rgba(255,40,0,0.9)');
  animGroup.appendChild(animCone);
  animGroup.appendChild(animFront);
  visualGroup.appendChild(animGroup);

  animFrame = requestAnimationFrame(step);
}

// Zoom controls: scale the internal visualGroup so the viewport (SVG element) stays the same size
let currentScale = 1;
function setScale(s) {
  currentScale = Math.max(0.5, Math.min(2.5, s));
  // For SVG groups, scale around the visual center (centerX, centerY)
  const tx = centerX;
  const ty = centerY;
  visualGroup.setAttribute('transform', `translate(${tx} ${ty}) scale(${currentScale}) translate(${-tx} ${-ty})`);
}


// range buttons handlers
btn7d.addEventListener('click', async () => {
  loadCMEs.days = 7; delete loadCMEs.range;
  await loadCMEs();
});

btnAnimate.addEventListener('click', () => animateCME(selectedIndex));

// Auto-load last 7 days on open
(async () => {
  loadCMEs.days = 7; delete loadCMEs.range;
  await loadCMEs();
})();

export {};
