import { AstroService } from '../../infra/service/AstroService.js';
import { addItem, getByType, removeItem, clearType } from '../../infra/util/historyStore.js';

// DOM Elements
const svg = document.querySelector('#sun-map svg');
const hotspotsGroup = svg.querySelector('#hotspots');
const detailsPanel = document.getElementById('details-panel');
const startInput = document.getElementById('timeline-start');
const endInput = document.getElementById('timeline-end');
const btnPrev = document.getElementById('timeline-prev');
const btnNext = document.getElementById('timeline-next');
const btnToday = document.getElementById('btn-today');
const btn7d = document.getElementById('btn-7d');
const btn30d = document.getElementById('btn-30d');
const statusEl = document.getElementById('timeline-status');

// History UI injection (siempre arriba del módulo de flares)
const flareModuleRoot = document.getElementById('flares-root') || statusEl?.parentElement || document.body;
const historyWrapper = document.createElement('div');
historyWrapper.style.marginBottom = '.75rem';
historyWrapper.innerHTML = `
  <div class="flare-history-controls" style="display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;">
    <button id="flare-history-toggle" class="quick-load-btn" style="margin-top:.25rem;">🗂 Histórico <span id="flare-history-badge" class="badge-count" aria-label="Fulguraciones guardadas">0</span></button>
    <button id="flare-history-clear" class="quick-load-btn" style="margin-top:.25rem;">🧹 Limpiar</button>
  </div>
  <div id="flare-history-panel" style="margin-top:.55rem;border:1px solid rgba(255,255,255,0.1);padding:.6rem;border-radius:8px;background:rgba(255,255,255,0.03);display:none;">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;flex-wrap:wrap;">
      <h4 style="margin:0;font-size:.85rem;">Histórico Fulguraciones <span id="flare-history-count" style="font-weight:400;color:var(--color-text-secondary)"></span></h4>
      <button id="flare-history-close" class="quick-load-btn btn-compact" style="font-size:.55rem;">✕</button>
    </div>
    <div id="flare-history-empty" class="text-muted" style="font-size:.6rem;margin-top:.4rem;">No hay fulguraciones guardadas.</div>
    <div id="flare-history-list" style="display:grid;gap:.35rem;margin-top:.5rem;"></div>
    <div style="margin-top:.5rem;font-size:.5rem;opacity:.6;line-height:1.3;">Persistencia local (este navegador). Las entradas guardan clase, región, tiempos y enlace fuente.</div>
  </div>`;
flareModuleRoot.prepend(historyWrapper);

const historyControls = historyWrapper.querySelector('.flare-history-controls');
const historyPanel = historyWrapper.querySelector('#flare-history-panel');

const btnToggleHist = historyControls.querySelector('#flare-history-toggle');
const btnClearHist = historyControls.querySelector('#flare-history-clear');
const btnCloseHist = historyPanel.querySelector('#flare-history-close');
const histListEl = historyPanel.querySelector('#flare-history-list');
const histEmptyEl = historyPanel.querySelector('#flare-history-empty');
const histCountEl = historyPanel.querySelector('#flare-history-count');
const histBadgeEl = document.getElementById('flare-history-badge');

function normalizeFlare(f){
  if(!f) return null;
  const start = f.beginTime || f.begin;
  const id = f.activityID || `${start}_${f.classType}`;
  const label = `Clase ${f.classType || 'N/D'} AR ${f.activeRegionNum || f.activeRegion || 'N/D'}`;
  const sourceUrl = f.link || f.url || null;
  return {
    id,
    type: 'flare',
    startTime: start,
    endTime: f.endTime || f.end || null,
    label,
    intensity: f.classType || null,
    sourceUrl,
    savedAt: new Date().toISOString(),
    extra: {
      peakTime: f.peakTime || f.peak || null,
      activeRegion: f.activeRegionNum || f.activeRegion || null
    }
  };
}

function renderFlareHistory(){
  const items = getByType('flare');
  if(histCountEl) histCountEl.textContent = `(${items.length})`;
  if(histBadgeEl) histBadgeEl.textContent = items.length;
  if(!items.length){
    histEmptyEl.hidden = false;
    histListEl.innerHTML = '';
    return;
  }
  histEmptyEl.hidden = true;
  histListEl.innerHTML = items.map((it,i)=>{
    const dateDisp = it.startTime ? isoToLocale(it.startTime) : 'Sin fecha';
    const src = it.sourceUrl ? `<a href="${it.sourceUrl}" target="_blank" rel="noopener" class="history-src-btn" style="font-size:.55rem;text-decoration:none;">🔗 Fuente</a>` : '<span style="font-size:.5rem;opacity:.35;">Sin fuente</span>';
    return `<div class="history-item" data-idx="${i}" style="display:flex;flex-wrap:wrap;align-items:center;gap:.4rem;padding:.35rem .5rem;border:1px solid rgba(255,255,255,.08);border-radius:6px;background:rgba(255,255,255,0.03);">
      <div style="flex:1;min-width:160px;">
        <div style="font-size:.65rem;font-weight:600;">${dateDisp}</div>
        <div style="font-size:.55rem;opacity:.7;">${it.label}</div>
      </div>
      <button data-view="${i}" class="history-load-btn" style="font-size:.55rem;">Ver</button>
      <button data-del="${i}" class="history-del-btn" style="font-size:.55rem;">🗑</button>
      ${src}
    </div>`;
  }).join('');
  // attach events
  histListEl.querySelectorAll('[data-view]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const idx = Number(e.currentTarget.getAttribute('data-view'));
      // intentar localizar en currentFlares por startTime
      const items = getByType('flare');
      const item = items[idx];
      if(!item) return;
      const localIdx = currentFlares.findIndex(fl=> (fl.beginTime||fl.begin) === item.startTime);
      if(localIdx>=0){ showDetails(currentFlares[localIdx], localIdx); flashStatus('📌 Fulguración seleccionada'); }
      else { flashStatus('⚠️ No está en el rango cargado'); }
    });
  });
  histListEl.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const idx = Number(e.currentTarget.getAttribute('data-del'));
      removeItem('flare', idx);
      renderFlareHistory();
    });
  });
}

function toggleFlareHistory(force){
  const show = force !== undefined ? force : historyPanel.style.display === 'none';
  historyPanel.style.display = show ? 'block':'none';
  if(show) renderFlareHistory();
}

function flashStatus(msg){
  if(!statusEl) return; statusEl.textContent = msg; statusEl.style.background = 'rgba(0,217,255,0.15)';
  statusEl.animate([{opacity:.5},{opacity:1}],{duration:300});
}

btnToggleHist?.addEventListener('click', ()=> toggleFlareHistory());
btnCloseHist?.addEventListener('click', ()=> toggleFlareHistory(false));
btnClearHist?.addEventListener('click', ()=>{ if(confirm('¿Limpiar histórico de fulguraciones?')){ clearType('flare'); renderFlareHistory(); flashStatus('🧹 Histórico limpio'); } });

// State
let currentFlares = [];
let selectedFlare = null;

// Utility Functions
function isoToLocale(iso) {
  try { 
    return new Date(iso).toLocaleString('es-ES', { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    }); 
  }
  catch { return iso; }
}

function getFlareClass(classType) {
  if (!classType) return 'C';
  const first = classType.charAt(0).toUpperCase();
  if (['C', 'M', 'X'].includes(first)) return first;
  return 'C';
}

function getFlareColor(classType) {
  const flClass = getFlareClass(classType);
  if (flClass === 'X') return '#ff3b30';
  if (flClass === 'M') return '#ff6b35';
  return '#ffa502';
}

function getFlareRadius(classType) {
  const flClass = getFlareClass(classType);
  if (flClass === 'X') return 14;
  if (flClass === 'M') return 11;
  return 8;
}

function isRecentFlare(time) {
  const now = Date.now();
  const flareTime = new Date(time).getTime();
  const diff = now - flareTime;
  return diff < (6 * 3600 * 1000); // Less than 6 hours
}

// Projection: convert solar coordinates (lat, lon) to SVG (x, y)
function projectLatLon(lat, lon) {
  const r = 300; // Solar radius in SVG
  const cx = 400, cy = 400; // Center of sun
  
  // Simple equirectangular projection
  // lon: -180 to 180 → x: -r to r
  // lat: -90 to 90 → y: r to -r (inverted)
  const x = cx + (lon / 180) * r;
  const y = cy - (lat / 90) * r;
  
  return { x, y };
}

// Clear all hotspots
function clearHotspots() { 
  hotspotsGroup.innerHTML = ''; 
  currentFlares = [];
  selectedFlare = null;
}

// Render single hotspot
function renderHotspot(flare, index) {
  // Extract coordinates
  const lat = parseFloat(flare.latitude || flare.solarLatitude || 0);
  const lon = parseFloat(flare.longitude || flare.solarLongitude || 0);
  
  const { x, y } = projectLatLon(lat, lon);
  const classType = flare.classType;
  const color = getFlareColor(classType);
  const radius = getFlareRadius(classType);
  const flClass = getFlareClass(classType);
  const recent = isRecentFlare(flare.beginTime || flare.time);
  
  // Create circle
  const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c.setAttribute('cx', x);
  c.setAttribute('cy', y);
  c.setAttribute('r', radius);
  c.setAttribute('fill', color);
  c.setAttribute('stroke', '#fff');
  c.setAttribute('stroke-width', '2');
  c.setAttribute('tabindex', '0');
  c.classList.add('hotspot', `class-${flClass}`);
  if (recent) c.classList.add('recent');
  c.dataset.index = index;
  
  hotspotsGroup.appendChild(c);
  
  // Event listeners
  c.addEventListener('click', () => showDetails(flare, index));
  c.addEventListener('keydown', (ev) => { 
    if (ev.key === 'Enter' || ev.key === ' ') { 
      ev.preventDefault(); 
      showDetails(flare, index); 
    } 
  });
}

// Show details panel for selected flare
function showDetails(flare, index) {
  selectedFlare = index;
  
  // Highlight selected hotspot using CSS classes instead of inline styles
  const hotspots = hotspotsGroup.querySelectorAll('.hotspot');
  hotspots.forEach((h, i) => {
    if (i === index) {
      h.classList.add('selected');
    } else {
      h.classList.remove('selected');
    }
  });
  
  const classType = flare.classType || 'N/D';
  const flareClass = getFlareClass(classType);
  const activeRegion = flare.activeRegionNum || flare.activeRegion || 'N/D';
  const beginTime = flare.beginTime || flare.begin || 'N/D';
  const peakTime = flare.peakTime || flare.peak || 'N/D';
  const endTime = flare.endTime || flare.end || 'N/D';
  const sourceLocation = flare.sourceLocation || `Lat: ${flare.latitude || 0}°, Lon: ${flare.longitude || 0}°`;
  const instruments = flare.instruments || [];
  const linkedEvents = flare.linkedEvents || [];
  
  const intensityLabel = flareClass === 'X' ? 'Fulguración Extrema' : 
                        flareClass === 'M' ? 'Fulguración Moderada' : 
                        'Fulguración Menor';
  const intensityIcon = flareClass === 'X' ? '🔴' : flareClass === 'M' ? '🟠' : '🟡';
  
  // Parse instruments display name
  const instrumentsDisplay = instruments.map(inst => {
    if (typeof inst === 'object' && inst.displayName) return inst.displayName;
    return inst;
  });
  
  detailsPanel.innerHTML = `
    <div class="flare-header">
      <div class="flare-badge class-${flareClass}">
        <span class="flare-icon">${intensityIcon}</span>
        <div class="flare-title">
          <h4>Fulguración Solar Clase ${classType}</h4>
          <p class="flare-intensity">${intensityLabel}</p>
        </div>
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;margin:.25rem 0 .5rem;">
      <button id="flare-save-inline" class="quick-load-btn btn-compact" style="font-size:.55rem;">💾 Guardar</button>
    </div>
    ${flare.raw?.link ? `
      <div style=\"margin:.6rem 0 .4rem;padding:.55rem .65rem;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:linear-gradient(135deg,rgba(255,165,0,.08),rgba(255,165,0,.02));\">
        <h5 style=\"margin:0 0 .35rem;font-size:.7rem;letter-spacing:.5px;display:flex;align-items:center;gap:.4rem;\"><span style=\"font-size:.85rem;\">🔗</span> Fuente Oficial</h5>
        <p style=\"margin:0 0 .45rem;font-size:.55rem;line-height:1.3;opacity:.85;\">Registro DONKI de la fulguración. Incluye metadatos completos y contexto adicional sobre región activa e instrumentos.</p>
        <a class=\"gst-source-link\" style=\"font-size:.55rem;\" href=\"${flare.raw.link}\" target=\"_blank\" rel=\"noopener\">Ver evento en DONKI</a>
      </div>` : ''}
    
    <div class="flare-stats">
      <div class="stat-card">
        <div class="stat-icon-wrapper">
          <span class="stat-icon">📍</span>
        </div>
        <div class="stat-content">
          <span class="stat-label">Región Activa</span>
          <span class="stat-value">${activeRegion}</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon-wrapper">
          <span class="stat-icon">🌐</span>
        </div>
        <div class="stat-content">
          <span class="stat-label">Ubicación</span>
          <span class="stat-value">${sourceLocation}</span>
        </div>
      </div>
    </div>
    
    <div class="flare-section">
      <div class="section-header">
        <span class="section-icon">⏱️</span>
        <h5>Línea Temporal</h5>
      </div>
      <div class="timeline-grid">
        <div class="timeline-item">
          <span class="timeline-dot"></span>
          <div class="timeline-content">
            <span class="timeline-label">Inicio</span>
            <span class="timeline-value">${isoToLocale(beginTime)}</span>
          </div>
        </div>
        <div class="timeline-item highlight">
          <span class="timeline-dot"></span>
          <div class="timeline-content">
            <span class="timeline-label">Pico</span>
            <span class="timeline-value">${isoToLocale(peakTime)}</span>
          </div>
        </div>
        <div class="timeline-item">
          <span class="timeline-dot"></span>
          <div class="timeline-content">
            <span class="timeline-label">Fin</span>
            <span class="timeline-value">${isoToLocale(endTime)}</span>
          </div>
        </div>
      </div>
    </div>
    
    ${instrumentsDisplay.length > 0 ? `
      <div class="flare-section">
        <div class="section-header">
          <span class="section-icon">🛰️</span>
          <h5>Instrumentos</h5>
        </div>
        <div class="instruments-list">
          ${instrumentsDisplay.map(inst => `<span class="instrument-tag">${inst}</span>`).join('')}
        </div>
      </div>
    ` : ''}
    
    ${linkedEvents.length > 0 ? `
      <div class="flare-section">
        <div class="section-header">
          <span class="section-icon">🔗</span>
          <h5>Eventos Relacionados</h5>
        </div>
        <div class="events-info">
          <span class="events-badge">${linkedEvents.length}</span>
          <span class="events-text">evento${linkedEvents.length > 1 ? 's' : ''} relacionado${linkedEvents.length > 1 ? 's' : ''}</span>
        </div>
      </div>
    ` : ''}
    
    <div class="flare-description">
      <p>${flare.note || 'Fulguración solar detectada por instrumentos de la NASA. Las fulguraciones liberan energía equivalente a millones de bombas nucleares en cuestión de minutos.'}</p>
    </div>
  `;
  
  // Scroll to details (mobile)
  detailsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  const inlineBtn = document.getElementById('flare-save-inline');
  if(inlineBtn){
    inlineBtn.addEventListener('click', ()=>{
      const raw = flare.raw || flare;
      const added = addItem(normalizeFlare(raw));
      flashStatus(added? '✅ Guardada':'ℹ️ Ya existía');
      renderFlareHistory();
    });
  }
}

// Load flares for date range
async function loadRange(startDate, endDate) {
  try {
    statusEl.textContent = `🔄 Cargando ${startDate} → ${endDate}...`;
    statusEl.style.background = 'rgba(0, 217, 255, 0.1)';
    
    const data = await AstroService.getFlaresRange(startDate, endDate);
    clearHotspots();
    
    if (!Array.isArray(data) || data.length === 0) {
      detailsPanel.innerHTML = `
        <p class="text-muted">
          No se encontraron fulguraciones en el rango seleccionado.<br><br>
          Intenta seleccionar un rango más amplio o una fecha diferente.
        </p>
      `;
      statusEl.textContent = `📅 ${startDate} → ${endDate} | 0 fulguraciones`;
      statusEl.style.background = 'rgba(255, 165, 2, 0.1)';
      return;
    }
    
    // Process and normalize data
    data.forEach((d, index) => {
      const meta = {
        beginTime: d.beginTime || d.begin,
        peakTime: d.peakTime || d.peak,
        endTime: d.endTime || d.end,
        classType: d.classType || 'C1.0',
        activeRegionNum: d.activeRegionNum || d.activeRegion || 'N/D',
        latitude: d.sourceLocation ? extractLat(d.sourceLocation) : 0,
        longitude: d.sourceLocation ? extractLon(d.sourceLocation) : 0,
        sourceLocation: d.sourceLocation || 'N/D',
        instruments: d.instruments ? (Array.isArray(d.instruments) ? d.instruments : [d.instruments]) : [],
        linkedEvents: d.linkedEvents || [],
        note: d.note || d.comment || '',
        raw: d
      };
      
      currentFlares.push(meta);
      renderHotspot(meta, index);
    });
    
    statusEl.textContent = `✅ ${startDate} → ${endDate} | ${data.length} fulguraciones cargadas`;
    statusEl.style.background = 'rgba(46, 213, 115, 0.1)';
    
    // Select most recent/intense flare automatically
    if (currentFlares.length > 0) {
      const mostIntense = findMostIntenseFlare();
      showDetails(currentFlares[mostIntense], mostIntense);
    }
    
  } catch (e) {
    console.error('Error loading flares range', e);
    detailsPanel.innerHTML = `
      <div style="padding: 1rem; background: rgba(255, 71, 87, 0.1); border: 1px solid var(--color-danger); border-radius: 8px;">
        <p style="margin-bottom: 0.5rem;"><strong>⚠️ Error al cargar datos</strong></p>
        <p style="font-size: 0.875rem;">
          ${e.message || 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.'}
        </p>
      </div>
    `;
    statusEl.textContent = '❌ Error cargando datos';
    statusEl.style.background = 'rgba(255, 71, 87, 0.1)';
  }
}

// Extract latitude from sourceLocation string (e.g., "N12E34" or "S12W34")
function extractLat(loc) {
  if (!loc) return 0;
  const match = loc.match(/([NS])(\d+)/);
  if (!match) return 0;
  const val = parseInt(match[2]);
  return match[1] === 'N' ? val : -val;
}

// Extract longitude from sourceLocation string
function extractLon(loc) {
  if (!loc) return 0;
  const match = loc.match(/([EW])(\d+)/);
  if (!match) return 0;
  const val = parseInt(match[2]);
  return match[1] === 'E' ? val : -val;
}

// Find most intense flare (X > M > C, then by number)
function findMostIntenseFlare() {
  let maxIndex = 0;
  let maxScore = -1;
  
  currentFlares.forEach((f, i) => {
    const classType = f.classType || 'C1.0';
    const letter = classType.charAt(0).toUpperCase();
    const num = parseFloat(classType.substring(1)) || 1;
    
    let score = 0;
    if (letter === 'X') score = 10000 + num;
    else if (letter === 'M') score = 1000 + num;
    else score = num;
    
    if (score > maxScore) {
      maxScore = score;
      maxIndex = i;
    }
  });
  
  return maxIndex;
}

// Date manipulation helpers
function stepDate(iso, offset) { 
  const d = new Date(iso); 
  d.setDate(d.getDate() + offset); 
  return d.toISOString().slice(0, 10); 
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// Initialize Timeline Controls
function initTimeline() {
  const today = getToday();
  const yesterday = getDaysAgo(1);
  
  // Set default range: yesterday to today
  startInput.value = yesterday;
  endInput.value = today;
  
  // Load initial data
  loadRange(yesterday, today);
  
  // Quick load buttons
  btnToday.addEventListener('click', () => {
    const t = getToday();
    startInput.value = t;
    endInput.value = t;
    loadRange(t, t);
  });
  
  btn7d.addEventListener('click', () => {
    const end = getToday();
    const start = getDaysAgo(7);
    startInput.value = start;
    endInput.value = end;
    loadRange(start, end);
  });
  
  btn30d.addEventListener('click', () => {
    const end = getToday();
    const start = getDaysAgo(30);
    startInput.value = start;
    endInput.value = end;
    loadRange(start, end);
  });
  
  // Navigation buttons
  btnPrev.addEventListener('click', () => { 
    const ns = stepDate(startInput.value, -1); 
    const ne = stepDate(endInput.value, -1); 
    startInput.value = ns; 
    endInput.value = ne; 
    loadRange(ns, ne); 
  });
  
  btnNext.addEventListener('click', () => { 
    const ns = stepDate(startInput.value, 1); 
    const ne = stepDate(endInput.value, 1); 
    startInput.value = ns; 
    endInput.value = ne; 
    loadRange(ns, ne); 
  });
  
  // Manual date change
  startInput.addEventListener('change', () => loadRange(startInput.value, endInput.value));
  endInput.addEventListener('change', () => loadRange(startInput.value, endInput.value));
}

// Initialize
initTimeline();

