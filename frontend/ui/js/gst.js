import { AstroService } from '../../infra/service/AstroService.js';

// Elements
const statusEl = document.getElementById('gst-status');
const listEl = document.getElementById('gst-list');
const detailsEl = document.getElementById('gst-details');
const kpTimelineEl = document.getElementById('kp-timeline');

const kpMaxEl = document.getElementById('kp-max');
const kpAvgEl = document.getElementById('kp-avg');
const gstCountEl = document.getElementById('gst-count');
const kpLastEl = document.getElementById('kp-last');

const btnToday = document.getElementById('gst-btn-today');
const btn3d = document.getElementById('gst-btn-3d');
const btn7d = document.getElementById('gst-btn-7d');
const btn30d = document.getElementById('gst-btn-30d');
const btnRefresh = document.getElementById('gst-refresh');

// State
let rawStorms = [];
let flattenedKp = []; // aggregated kpIndex entries across storms
let selectedIndex = null;
let currentDays = 7;
let currentKp = 0;
// History (local persistence)
const HISTORY_KEY = 'gst_saved_storms_v1';
let savedStorms = []; // array de objetos normalizados

// History related elements (after DOM load they exist in gst.html)
const btnViewHistory = document.getElementById('gst-view-history');
const btnJsonSelected = document.getElementById('gst-json-selected');
const btnJsonAll = document.getElementById('gst-json-all');
const btnClearHistory = document.getElementById('gst-clear-history');
const historyPanel = document.getElementById('gst-history-panel');
const historyListEl = document.getElementById('gst-history-list');
const historyEmptyEl = document.getElementById('gst-history-empty');
const historyCountEl = document.getElementById('gst-history-count');
const historyBadgeEl = document.getElementById('gst-history-badge');
const historyCloseBtn = document.getElementById('gst-history-close');

// =============== HISTÓRICO / PERSISTENCIA LOCAL ===============
function loadHistoryFromStorage(){
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    savedStorms = raw? JSON.parse(raw) : [];
  } catch { savedStorms = []; }
  renderHistory();
}

function persistHistory(){
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(savedStorms)); } catch {}
}

function normalizeStorm(storm){
  if(!storm || typeof storm!== 'object') return null;
  const kpEntries = getKpEntriesFromStorm(storm);
  const kpValues = kpEntries.map(k=>extractKpValue(k)).filter(v=>!isNaN(v));
  const maxKp = kpValues.length? Math.max(...kpValues):null;
  const minKp = kpValues.length? Math.min(...kpValues):null;
  const avgKp = kpValues.length? Number((kpValues.reduce((a,b)=>a+b,0)/kpValues.length).toFixed(2)) : null;
  const start = storm.startTime || storm.time || (kpEntries[0]?.observedTime) || null;
  const end = storm.endTime || (kpEntries[kpEntries.length-1]?.observedTime) || null;
  const id = storm.activityID || storm.link || `${start||''}_${maxKp||''}`;
  // Determinar fuente (link) si existe
  const sourceUrl = storm.link || storm.url || null;
  // Serializamos mediciones individuales (observedTime, kpValue, source)
  const measurements = kpEntries.map(entry=>({
    observedTime: entry.observedTime || entry.time || null,
    kpValue: (()=>{ const v=extractKpValue(entry); return isNaN(v)? null : Number(v.toFixed(1)); })(),
    source: entry.source || 'SWPC'
  })).filter(m=> m.observedTime && m.kpValue!=null);
  return {
    id,
    startTime: start,
    endTime: end,
    savedAt: new Date().toISOString(),
    kpCount: kpValues.length,
    kpMax: maxKp,
    kpMin: minKp,
    kpAvg: avgKp,
    source: kpEntries[0]?.source || 'SWPC',
  activityID: storm.activityID || '',
  sourceUrl,
    kpMeasurements: measurements,
    raw: { activityID: storm.activityID }
  };
}

function addCurrentStormToHistory(){
  if(selectedIndex==null){
    flashStatus('⚠️ Selecciona primero una tormenta para guardar','warn');
    return;
  }
  const storm = rawStorms[selectedIndex];
  const norm = normalizeStorm(storm);
  if(!norm){
    flashStatus('❌ No se pudo normalizar la tormenta','error');
    return;
  }
  // evitar duplicados por id+startTime
  if(savedStorms.some(s=> s.id===norm.id && s.startTime===norm.startTime)){
    flashStatus('ℹ️ Ya estaba guardada','info');
    return;
  }
  savedStorms.push(norm);
  savedStorms.sort((a,b)=> new Date(b.startTime||0) - new Date(a.startTime||0));
  persistHistory();
  renderHistory();
  flashStatus('✅ Tormenta guardada','ok');
}

function renderHistory(){
  if(!historyPanel) return;
  if(historyCountEl) historyCountEl.textContent = `(${savedStorms.length})`;
  if(historyBadgeEl) historyBadgeEl.textContent = savedStorms.length;
  if(!savedStorms.length){
    if(historyEmptyEl) historyEmptyEl.hidden = false;
    if(historyListEl) historyListEl.innerHTML='';
    return;
  }
  if(historyEmptyEl) historyEmptyEl.hidden = true;
  if(historyListEl){
    historyListEl.innerHTML = savedStorms.map((s,i)=>{
      const dateStr = s.startTime? isoToLocale(s.startTime) : 'Sin fecha';
      return `<div class="history-item" data-idx="${i}" style="display:flex;flex-wrap:wrap;align-items:center;gap:.5rem;padding:.35rem .5rem;border:1px solid rgba(255,255,255,.08);border-radius:6px;">
        <div style="flex:1;min-width:170px;">
          <div style="font-size:.7rem;font-weight:600;">${dateStr}</div>
          <div style="font-size:.55rem;opacity:.7;">Kp max: ${s.kpMax ?? '--'} · avg: ${s.kpAvg ?? '--'} · #${s.kpCount}</div>
        </div>
        <button class="history-load-btn" data-load="${i}" style="font-size:.6rem;" title="Seleccionar en la lista actual">Ver</button>
        <button class="history-del-btn" data-del="${i}" style="font-size:.6rem;" title="Eliminar">🗑</button>
      </div>`;
    }).join('');
  }
  // attach events
  historyListEl.querySelectorAll('[data-load]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const idx = Number(e.currentTarget.getAttribute('data-load'));
      const item = savedStorms[idx];
      if(!item) return;
      // intentar encontrar en rawStorms por startTime y kpMax
      const matchIdx = rawStorms.findIndex(st=>{
        const kpEntries = getKpEntriesFromStorm(st);
        const start = st.startTime || st.time || (kpEntries[0]?.observedTime);
        return start===item.startTime;
      });
      if(matchIdx>=0){ selectStorm(matchIdx); flashStatus('📌 Tormenta seleccionada','info'); }
      else { flashStatus('⚠️ Esta tormenta no está en el rango cargado','warn'); }
    });
  });
  historyListEl.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const idx = Number(e.currentTarget.getAttribute('data-del'));
      savedStorms.splice(idx,1);
      persistHistory();
      renderHistory();
    });
  });
}

function toggleHistoryPanel(force){
  if(!historyPanel) return;
  const show = force!==undefined? force : historyPanel.hasAttribute('hidden');
  if(show){ historyPanel.removeAttribute('hidden'); }
  else { historyPanel.setAttribute('hidden',''); }
}

function clearHistory(){
  if(!savedStorms.length){ flashStatus('ℹ️ No hay nada que limpiar','info'); return; }
  if(!confirm('¿Eliminar histórico de tormentas guardadas?')) return;
  savedStorms = [];
  persistHistory();
  renderHistory();
  flashStatus('🧹 Histórico limpiado','ok');
}

// (Funciones de exportación JSON eliminadas según nueva especificación)

function flashStatus(msg,type='info'){
  if(!statusEl) return;
  statusEl.textContent = msg;
  const base = 'rgba(255,255,255,0.08)';
  let bg = base;
  if(type==='ok') bg='rgba(46,213,115,0.15)';
  else if(type==='warn') bg='rgba(255,193,7,0.18)';
  else if(type==='error') bg='rgba(255,71,87,0.18)';
  else if(type==='info') bg='rgba(0,217,255,0.15)';
  statusEl.style.background = bg;
  statusEl.animate([{opacity:0.4},{opacity:1}],{duration:350});
}

// Attach history events (guard against missing elements)
btnViewHistory && btnViewHistory.addEventListener('click', ()=>{ toggleHistoryPanel(); });
// Eliminados botones de exportación JSON
btnClearHistory && btnClearHistory.addEventListener('click', clearHistory);
historyCloseBtn && historyCloseBtn.addEventListener('click', ()=> toggleHistoryPanel(false));

// Load persisted history at startup
loadHistoryFromStorage();

// 3D Earth visualization
let scene, camera, renderer, earth, earthGroup;
let auroraRings = [];
let isRotating = true;
let mouse = { x: 0, y: 0 };
let mousePressed = false;

// Gauge initialization
const gaugeSvg = document.getElementById('kp-gauge');
const gaugeFg = document.getElementById('kp-gauge-fg');
const gaugeNeedle = document.getElementById('kp-gauge-needle');
const gaugeTicksGroup = document.getElementById('kp-gauge-ticks');
const gaugeValueEl = document.getElementById('kp-gauge-value');
const gaugeTextEl = document.getElementById('kp-gauge-text');
const gaugeSubEl = document.getElementById('kp-gauge-sub');

// Add gradient defs if not present
if (gaugeSvg && !gaugeSvg.querySelector('#kpGaugeGradient')) {
  const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
  const grad = document.createElementNS('http://www.w3.org/2000/svg','linearGradient');
  grad.setAttribute('id','kpGaugeGradient');
  grad.setAttribute('x1','0%'); grad.setAttribute('x2','100%'); grad.setAttribute('y1','0%'); grad.setAttribute('y2','0%');
  const stops = [
    {o:'0% ', c:'#0D3B66'},
    {o:'20% ', c:'#607D8B'},
    {o:'40% ', c:'#FFC107'},
    {o:'55% ', c:'#FF9800'},
    {o:'72% ', c:'#FF5722'},
    {o:'85% ', c:'#FF1744'},
    {o:'100%', c:'#D500F9'}
  ];
  stops.forEach(s=>{ const st=document.createElementNS('http://www.w3.org/2000/svg','stop'); st.setAttribute('offset',s.o); st.setAttribute('stop-color',s.c); grad.appendChild(st); });
  defs.appendChild(grad);
  gaugeSvg.prepend(defs);
}

// Build ticks (0–9)
function buildGaugeTicks(){
  if(!gaugeTicksGroup) return;
  gaugeTicksGroup.innerHTML='';
  for(let k=0;k<=9;k++){
    const angle = (-180 + (k/9)*180) * Math.PI/180; // -180 to 0 degrees
    const rOuter = 90; const rInner = k % 3 === 0 ? 74 : 78; // longer every 3
    const cx=100, cy=110;
    const x1 = cx + rInner * Math.cos(angle);
    const y1 = cy + rInner * Math.sin(angle);
    const x2 = cx + rOuter * Math.cos(angle);
    const y2 = cy + rOuter * Math.sin(angle);
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',x1); line.setAttribute('y1',y1); line.setAttribute('x2',x2); line.setAttribute('y2',y2);
    gaugeTicksGroup.appendChild(line);
    if (k % 3 === 0) {
      const tx = cx + (rInner - 10) * Math.cos(angle);
      const ty = cy + (rInner - 10) * Math.sin(angle) + 3;
      const text = document.createElementNS('http://www.w3.org/2000/svg','text');
      text.setAttribute('x',tx); text.setAttribute('y',ty); text.setAttribute('text-anchor','middle');
      text.textContent = String(k);
      gaugeTicksGroup.appendChild(text);
    }
  }
}
buildGaugeTicks();

// Initialize 3D Earth visualization
initEarthVisualization();

// Arc path length for semicircle: approximate dynamic stroke-dasharray approach
const semicircleLength = Math.PI * 90; // r=90
gaugeFg && gaugeFg.setAttribute('stroke-dasharray', `${semicircleLength}`);
gaugeFg && gaugeFg.setAttribute('stroke-dashoffset', `${semicircleLength}`);

function updateGauge(kp){
  currentKp = kp;
  const clamped = Math.max(0, Math.min(9, kp));
  const fillPortion = clamped/9; // 0..1
  const targetOffset = semicircleLength * (1 - fillPortion);
  // animate stroke-dashoffset
  if (gaugeFg){
    gaugeFg.animate([
      { strokeDashoffset: gaugeFg.style.strokeDashoffset || semicircleLength },
      { strokeDashoffset: targetOffset }
    ], { duration: 600, easing:'cubic-bezier(.4,.0,.2,1)', fill:'forwards' });
    gaugeFg.style.strokeDashoffset = targetOffset;
  }
  // needle rotation ( -180° to 0° )
  if (gaugeNeedle){
    const angleDeg = -180 + fillPortion * 180;
    gaugeNeedle.animate([
      { transform: gaugeNeedle.style.transform || 'rotate(-180deg)' },
      { transform: `rotate(${angleDeg}deg)` }
    ], { duration: 650, easing:'cubic-bezier(.4,.0,.2,1)', fill:'forwards'});
    gaugeNeedle.style.transform = `rotate(${angleDeg}deg)`;
  }
  if (gaugeValueEl) gaugeValueEl.textContent = isNaN(kp)? '--' : kp.toFixed(1);
  if (gaugeTextEl) gaugeTextEl.textContent = severityLabel(kp).toUpperCase();
  if (gaugeSubEl) gaugeSubEl.textContent = `Máx observado: ${kpMaxEl.textContent || '--'}`;
}

function isoToLocale(iso) {
  try { return new Date(iso).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso || 'N/D'; }
}

function classifyKp(kp) {
  if (kp >= 8) return 'extreme';
  if (kp >= 7) return 'severe';
  if (kp >= 6) return 'severe';
  if (kp >= 5) return 'high';
  if (kp >= 4) return 'mod';
  return 'low';
}

function kpPillClass(kp) {
  const cls = classifyKp(kp);
  if (cls === 'extreme') return 'kp-extreme';
  if (cls === 'severe') return 'kp-severe';
  if (cls === 'high') return 'kp-high';
  if (cls === 'mod') return 'kp-mod';
  return 'kp-low';
}

function severityLabel(kp) {
  const c = classifyKp(kp);
  return c === 'extreme' ? 'Extremo (G5)' :
         c === 'severe' ? (kp >= 7 ? 'Severo (G4)' : 'Fuerte (G3)') :
         c === 'high' ? 'Tormenta Menor (G1/G2)' :
         c === 'mod' ? 'Activo' : 'Tranquilo';
}

function calcStats() {
  if (!rawStorms.length) {
    kpMaxEl.textContent = '--';
    kpAvgEl.textContent = '--';
    gstCountEl.textContent = '0';
    kpLastEl.textContent = '--';
    return;
  }
  const allKp = flattenedKp.map(k => extractKpValue(k)).filter(n => !isNaN(n));
  const max = allKp.length ? Math.max(...allKp) : 0;
  const avg = allKp.length ? (allKp.reduce((a,b)=>a+b,0)/allKp.length).toFixed(1) : '0';
  kpMaxEl.textContent = max.toString();
  kpAvgEl.textContent = avg;
  gstCountEl.textContent = rawStorms.length.toString();
  const last = flattenedKp.sort((a,b)=> new Date(b.observedTime) - new Date(a.observedTime))[0];
  const lastVal = last ? extractKpValue(last) : NaN;
  kpLastEl.textContent = !isNaN(lastVal) ? lastVal.toString() : '--';
  if (!isNaN(lastVal)) updateGauge(lastVal);
}

function clearUI() {
  listEl.innerHTML = '';
  detailsEl.innerHTML = '<p class="text-muted">Selecciona una tormenta geomagnética de la lista para ver sus detalles.</p>';
  kpTimelineEl.innerHTML = '';
}

function renderList() {
  listEl.innerHTML = '';
  rawStorms.forEach((storm, idx) => {
    const kpEntries = getKpEntriesFromStorm(storm);
    const kpArray = kpEntries.map(k => extractKpValue(k)).filter(n => !isNaN(n));
    const kpMax = kpArray.length ? Math.max(...kpArray) : 0;
    const kpCls = kpPillClass(kpMax);
    const start = storm.startTime || storm.time || (kpEntries[0]?.observedTime) || 'N/D';
    const div = document.createElement('div');
    div.className = 'gst-item';
    div.innerHTML = `
      <div class="gst-kp-pill ${kpCls}">${kpMax}</div>
      <div class="gst-item-body">
        <div class="gst-time">${isoToLocale(start)}</div>
        <div class="gst-meta">${kpArray.length} mediciones • ${severityLabel(kpMax)}</div>
      </div>`;
    div.addEventListener('click', () => { selectStorm(idx); div.scrollIntoView({ block: 'nearest' }); });
    listEl.appendChild(div);
  });
}

function renderTimeline() {
  kpTimelineEl.innerHTML = '';
  if (!flattenedKp.length) {
    kpTimelineEl.innerHTML = '<p class="text-muted" style="grid-column:1/-1;">Sin registros Kp en este rango.</p>';
    return;
  }
  // Group by day (YYYY-MM-DD)
  const groups = new Map();
  flattenedKp.forEach(row => {
    const day = (row.observedTime || '').slice(0,10);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day).push(row);
  });
  const sortedDays = Array.from(groups.keys()).sort();
  sortedDays.forEach(day => {
    // For each day, show max Kp entries in chronological order collapsed into single bar representing highest value each hour
    const rows = groups.get(day).sort((a,b)=> new Date(a.observedTime) - new Date(b.observedTime));
    const maxKp = Math.max(...rows.map(r => extractKpValue(r) || 0));
    const cls = classifyKp(maxKp);
    const rowDiv = document.createElement('div');
    rowDiv.className = 'kp-row';
    rowDiv.innerHTML = `<div class="kp-time">${day}</div><div class="kp-bar"><div class="kp-fill ${cls === 'mod' ? 'mod': cls === 'high' ? 'high': cls === 'severe' ? 'severe': cls === 'extreme' ? 'extreme' : ''}" style="width:${(maxKp/9)*100}%;">${maxKp}</div></div>`;
    kpTimelineEl.appendChild(rowDiv);
  });
}

function selectStorm(idx) {
  selectedIndex = idx;
  const items = listEl.querySelectorAll('.gst-item');
  items.forEach((it,i)=> { 
    if(i===idx) {
      it.classList.add('active');
      // Add visual feedback animation
      it.style.transform = 'scale(1.02)';
      setTimeout(() => {
        it.style.transform = '';
      }, 200);
    } else {
      it.classList.remove('active');
    }
  });
  
  const storm = rawStorms[idx];
  if (!storm) return;
  
  const kpEntries = getKpEntriesFromStorm(storm);
  const kpValues = kpEntries.map(k => extractKpValue(k)).filter(n=>!isNaN(n));
  const kpMax = kpValues.length? Math.max(...kpValues):0;
  const kpMin = kpValues.length? Math.min(...kpValues):0;
  const kpAvg = kpValues.length? (kpValues.reduce((a,b)=>a+b,0)/kpValues.length).toFixed(1):'0';
  const kpCls = kpPillClass(kpMax);
  const source = kpEntries[0]?.source || 'SWPC';
  const sourceUrl = storm.link || storm.url || storm.sourceUrl || null;

  // Update 3D visualization to show selected storm
  highlightSelectedStorm(idx);
  
  // Update gauge to show max Kp of selected storm
  if (!isNaN(kpMax)) {
    updateGauge(kpMax);
  }

  detailsEl.innerHTML = `
    <div class="gst-detail-section">
      <h4>Resumen</h4>
      <div style="display:flex;justify-content:flex-end;margin-bottom:.3rem;">
        <button id="gst-save-inline" class="quick-load-btn btn-compact" style="font-size:.55rem;">💾 Guardar</button>
      </div>
      <div class="gst-stat-grid">
        <div class="gst-stat"><span class="gst-stat-label">Máx Kp</span><span class="gst-stat-value ${kpCls}">${kpMax}</span></div>
        <div class="gst-stat"><span class="gst-stat-label">Promedio</span><span class="gst-stat-value">${kpAvg}</span></div>
        <div class="gst-stat"><span class="gst-stat-label">Mínimo</span><span class="gst-stat-value">${kpMin}</span></div>
        <div class="gst-stat"><span class="gst-stat-label">Mediciones</span><span class="gst-stat-value">${kpValues.length}</span></div>
      </div>
    </div>
    <div class="gst-detail-section">
      <h4>Mediciones</h4>
      ${kpEntries.map(k => {
        const kpVal = extractKpValue(k);
        return `<div style="display:flex;justify-content:space-between;font-size:.7rem;padding:.25rem .35rem;border-bottom:1px solid rgba(255,255,255,0.06);">` +
        `<span>${isoToLocale(k.observedTime)}</span><span class="gst-kp-pill ${kpPillClass(kpVal)}" style="font-size:.65rem;">${kpVal.toFixed(1)}</span></div>`;
      }).join('') || '<p class="text-muted">Sin datos Kp</p>'}
    </div>
    <div class="gst-detail-section">
      <div style="margin:.65rem 0 .5rem;padding:.55rem .65rem;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:linear-gradient(135deg,rgba(0,217,255,.08),rgba(0,217,255,.02));">
        <h5 style="margin:0 0 .35rem;font-size:.7rem;letter-spacing:.5px;display:flex;align-items:center;gap:.4rem;"><span style="font-size:.85rem;">🔗</span> Fuente Oficial</h5>
        <p style="margin:0 0 .45rem;font-size:.55rem;line-height:1.3;opacity:.85;">${sourceUrl ? 'Registro DONKI de la tormenta geomagnética. Incluye mediciones Kp y contexto adicional.' : 'Fuente oficial no disponible para este evento.'}</p>
        ${sourceUrl ? `<a class=\"gst-source-link\" style=\"font-size:.55rem;\" href=\"${sourceUrl}\" target=\"_blank\" rel=\"noopener\">Ver evento en DONKI</a>` : ''}
      </div>
      <p style="font-size:.55rem;line-height:1.4;color:var(--color-text-secondary);margin:.4rem 0 .35rem;"><strong>Fuente:</strong> ${source}${storm.allKpIndex? '<br>Total registros (allKpIndex): '+ storm.allKpIndex.length : ''}</p>
      <p style="font-size:.55rem;color:var(--color-text-muted);margin:0;">Interpretación: ${severityLabel(kpMax)}. ${kpMax >=6 ? 'Posibles auroras visibles en latitudes medias.' : kpMax >=4 ? 'Actividad geomagnética elevada.' : 'Condiciones relativamente tranquilas.'}</p>
    </div>
  `;

  // Inline save button wiring
  const saveBtn = document.getElementById('gst-save-inline');
  if(saveBtn){
    saveBtn.addEventListener('click', ()=> addCurrentStormToHistory());
  }
}

function setButtonLoadingState(button, isLoading) {
  if (!button) return;
  
  if (isLoading) {
    button.classList.add('loading');
    button.disabled = true;
    const span = button.querySelector('span');
    if (span) {
      button.dataset.originalText = span.textContent;
      span.textContent = '';
    }
  } else {
    button.classList.remove('loading');
    button.disabled = false;
    const span = button.querySelector('span');
    if (span && button.dataset.originalText) {
      span.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }
}

function updateActiveButton(activeDays) {
  const buttons = [btnToday, btn3d, btn7d, btn30d];
  const dayValues = [1, 3, 7, 30];
  
  buttons.forEach((btn, index) => {
    if (btn) {
      if (dayValues[index] === activeDays) {
        btn.classList.add('primary');
      } else {
        btn.classList.remove('primary');
      }
    }
  });
}

// Helper function to extract Kp value from different data structures
function extractKpValue(kpEntry) {
  if (!kpEntry || typeof kpEntry !== 'object') return NaN;
  
  // Try different possible property names for Kp value
  const possibleValues = [
    kpEntry.kpIndex,
    kpEntry.kp,
    kpEntry.value,
    kpEntry.index,
    kpEntry.kpValue
  ];
  
  for (const val of possibleValues) {
    if (val !== undefined && val !== null) {
      const numVal = parseFloat(val);
      if (!isNaN(numVal) && numVal >= 0 && numVal <= 9) {
        return numVal;
      }
    }
  }
  
  return NaN;
}

// Helper function to get all Kp entries from a storm
function getKpEntriesFromStorm(storm) {
  if (!storm) return [];
  
  const kpSources = [
    storm.kpIndex || [],
    storm.allKpIndex || [],
    storm.kp || [],
    storm.measurements || []
  ];
  
  return kpSources.flat().filter(entry => {
    return entry && 
           entry.observedTime && 
           !isNaN(extractKpValue(entry));
  });
}

// Function to validate and clean Kp data
function validateKpData(storms) {
  const validationResults = {
    totalStorms: storms.length,
    stormsWithKpData: 0,
    totalKpMeasurements: 0,
    kpRange: { min: 9, max: 0 },
    invalidEntries: 0,
    duplicateTimestamps: 0,
    sources: new Set()
  };
  
  const seenTimestamps = new Set();
  
  storms.forEach(storm => {
    const kpEntries = getKpEntriesFromStorm(storm);
    
    if (kpEntries.length > 0) {
      validationResults.stormsWithKpData++;
      
      kpEntries.forEach(entry => {
        const kpVal = extractKpValue(entry);
        
        if (!isNaN(kpVal)) {
          validationResults.totalKpMeasurements++;
          validationResults.kpRange.min = Math.min(validationResults.kpRange.min, kpVal);
          validationResults.kpRange.max = Math.max(validationResults.kpRange.max, kpVal);
          
          if (entry.source) {
            validationResults.sources.add(entry.source);
          }
          
          // Check for duplicate timestamps
          const timestamp = entry.observedTime;
          if (seenTimestamps.has(timestamp)) {
            validationResults.duplicateTimestamps++;
          } else {
            seenTimestamps.add(timestamp);
          }
        } else {
          validationResults.invalidEntries++;
        }
      });
    }
  });
  
  return validationResults;
}

// Debug function to analyze Kp data structure
function debugKpData(storms) {
  console.group('🔍 Análisis de datos Kp');
  
  // Run validation
  const validation = validateKpData(storms);
  console.log('📊 Resultados de validación:', validation);
  
  // Show structure analysis for first storm
  if (storms.length > 0) {
    const firstStorm = storms[0];
    console.group('🏗️ Estructura de datos');
    console.log('Primera tormenta completa:', firstStorm);
    
    // Check different possible property names for Kp data
    const possibleKpProps = ['kpIndex', 'allKpIndex', 'kp', 'kpData', 'measurements'];
    possibleKpProps.forEach(prop => {
      if (firstStorm[prop]) {
        console.log(`✅ Encontrado ${prop} (${firstStorm[prop].length} entradas):`, firstStorm[prop]);
        if (Array.isArray(firstStorm[prop]) && firstStorm[prop][0]) {
          console.log(`   └─ Primer elemento:`, firstStorm[prop][0]);
        }
      }
    });
    console.groupEnd();
    
    // Show extracted data for first few storms
    console.group('🎯 Datos extraídos');
    storms.slice(0, 3).forEach((storm, idx) => {
      const kpEntries = getKpEntriesFromStorm(storm);
      const kpValues = kpEntries.map(k => extractKpValue(k)).filter(n => !isNaN(n));
      
      console.log(`Tormenta ${idx + 1}:`);
      console.log(`   ├─ Entradas Kp encontradas: ${kpEntries.length}`);
      console.log(`   ├─ Valores Kp válidos: ${kpValues.length}`);
      console.log(`   ├─ Rango Kp: ${kpValues.length ? `${Math.min(...kpValues).toFixed(1)} - ${Math.max(...kpValues).toFixed(1)}` : 'N/A'}`);
      console.log(`   └─ Valores: [${kpValues.map(v => v.toFixed(1)).join(', ')}]`);
    });
    console.groupEnd();
    
    // Show data quality issues if any
    if (validation.invalidEntries > 0 || validation.duplicateTimestamps > 0) {
      console.group('⚠️ Problemas de calidad de datos');
      if (validation.invalidEntries > 0) {
        console.warn(`${validation.invalidEntries} entradas con valores Kp inválidos`);
      }
      if (validation.duplicateTimestamps > 0) {
        console.warn(`${validation.duplicateTimestamps} timestamps duplicados encontrados`);
      }
      console.groupEnd();
    }
  }
  
  console.groupEnd();
}

async function loadStorms(days) {
  currentDays = days;
  
  // Set loading states
  const activeButton = days === 1 ? btnToday : 
                      days === 3 ? btn3d : 
                      days === 7 ? btn7d : 
                      days === 30 ? btn30d : null;
  
  if (activeButton) setButtonLoadingState(activeButton, true);
  setButtonLoadingState(btnRefresh, true);
  
  statusEl.textContent = `🔄 Cargando últimos ${days} días...`;
  statusEl.style.background = 'rgba(0,217,255,0.1)';
  
  try {
    const data = await AstroService.getGST(days);
    rawStorms = Array.isArray(data) ? data : [];
    
    // Debug the received data structure
    debugKpData(rawStorms);
    
    // Improved Kp extraction using helper functions
    flattenedKp = rawStorms.flatMap(storm => getKpEntriesFromStorm(storm));
    clearUI();
    if (!rawStorms.length) {
      detailsEl.innerHTML = '<p class="text-muted">No hay tormentas geomagnéticas en el rango seleccionado.</p>';
      statusEl.textContent = '📭 Sin datos';
      statusEl.style.background = 'rgba(255,165,2,0.1)';
      calcStats();
      return;
    }
    renderList();
    renderTimeline();
    calcStats();
    updateAuroraVisualizations(); // Update 3D visualization
    updateActiveButton(days); // Update active button state
    
    // Show data quality info
    const validation = validateKpData(rawStorms);
    const kpDataInfo = validation.totalKpMeasurements > 0 ? 
      ` (${validation.totalKpMeasurements} mediciones Kp)` : 
      ' (sin datos Kp)';
    
    statusEl.textContent = `✅ ${rawStorms.length} tormenta(s) cargadas${kpDataInfo}`;
    statusEl.style.background = 'rgba(46,213,115,0.12)';
    
    // Add warning if data quality issues
    if (validation.invalidEntries > 0) {
      statusEl.textContent += ` ⚠️ ${validation.invalidEntries} entradas inválidas`;
      statusEl.style.background = 'rgba(255,193,7,0.12)';
    }
    // Auto select the storm with highest Kp
    let maxIdx = 0; let maxKp = -1;
    rawStorms.forEach((s,i)=> { 
      const kpEntries = getKpEntriesFromStorm(s);
      const arr = kpEntries.map(k=>extractKpValue(k)).filter(n=>!isNaN(n)); 
      const m = arr.length?Math.max(...arr):0; 
      if(m>maxKp){maxKp=m; maxIdx=i;} 
    });
    if (rawStorms.length) selectStorm(maxIdx);
    // If there was no lastVal in calcStats (no kp yet), set gauge to max storm value
    if (!flattenedKp.length) updateGauge(0); else {
      const lastEntry = flattenedKp.sort((a,b)=> new Date(b.observedTime) - new Date(a.observedTime))[0];
      if(lastEntry) updateGauge(extractKpValue(lastEntry));
    }
  } catch (e) {
    console.error('Error cargando GST', e);
    statusEl.textContent = '❌ Error cargando datos';
    statusEl.style.background = 'rgba(255,71,87,0.12)';
    detailsEl.innerHTML = `<div style="padding:1rem;border:1px solid var(--color-danger);background:rgba(255,71,87,0.1);border-radius:8px;font-size:.8rem;">
      <strong>⚠️ Error:</strong> ${e.message || 'No se pudo obtener datos del servidor.'}
    </div>`;
  } finally {
    // Clear loading states
    const activeButton = days === 1 ? btnToday : 
                        days === 3 ? btn3d : 
                        days === 7 ? btn7d : 
                        days === 30 ? btn30d : null;
    
    if (activeButton) setButtonLoadingState(activeButton, false);
    setButtonLoadingState(btnRefresh, false);
  }
}

// Button feedback functions
function addButtonFeedback(button) {
  if (!button) return;
  
  button.addEventListener('click', () => {
    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Visual ripple effect
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
}

// Add ripple effect styles
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  .quick-load-btn {
    position: relative;
    overflow: hidden;
  }
  
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
    transform: scale(0);
    animation: ripple-effect 0.6s linear;
    pointer-events: none;
  }
  
  @keyframes ripple-effect {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(rippleStyle);

// Event bindings with enhanced feedback
btnToday.addEventListener('click', () => {
  if (!btnToday.disabled) loadStorms(1);
});
btn3d.addEventListener('click', () => {
  if (!btn3d.disabled) loadStorms(3);
});
btn7d.addEventListener('click', () => {
  if (!btn7d.disabled) loadStorms(7);
});
btn30d.addEventListener('click', () => {
  if (!btn30d.disabled) loadStorms(30);
});
btnRefresh.addEventListener('click', () => {
  if (!btnRefresh.disabled) loadStorms(currentDays);
});

// Add feedback to all buttons
[btnToday, btn3d, btn7d, btn30d, btnRefresh].forEach(addButtonFeedback);

// ================= 3D Earth Visualization Functions =================
function initEarthVisualization() {
  const container = document.getElementById('earth-container');
  const canvas = document.getElementById('earth-canvas');
  
  if (!container || !canvas || typeof THREE === 'undefined') {
    console.warn('Three.js not loaded or earth container not found');
    return;
  }

  // Scene setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);

  // Earth group for rotation
  earthGroup = new THREE.Group();
  scene.add(earthGroup);

  // Create Earth sphere
  const earthGeometry = new THREE.SphereGeometry(2, 64, 64);
  
  // Earth material with basic texture simulation
  const earthMaterial = new THREE.MeshPhongMaterial({
    color: 0x4a90e2,
    shininess: 0.1,
    transparent: true,
    opacity: 0.9
  });
  
  earth = new THREE.Mesh(earthGeometry, earthMaterial);
  earthGroup.add(earth);

  // Add atmosphere glow
  const atmosphereGeometry = new THREE.SphereGeometry(2.1, 64, 64);
  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x87ceeb,
    transparent: true,
    opacity: 0.1,
    side: THREE.BackSide
  });
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  earthGroup.add(atmosphere);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 3, 5);
  scene.add(directionalLight);

  // Camera position
  camera.position.z = 6;

  // Mouse controls
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('wheel', onMouseWheel);

  // Control buttons
  const toggleBtn = document.getElementById('earth-toggle-rotation');
  const resetBtn = document.getElementById('earth-reset-view');
  const showAllBtn = document.getElementById('earth-show-all');
  
  toggleBtn?.addEventListener('click', toggleRotation);
  resetBtn?.addEventListener('click', resetView);
  showAllBtn?.addEventListener('click', showAllStorms);

  // Handle resize
  window.addEventListener('resize', onWindowResize);

  // Start animation loop
  animate();
}

function createAuroraRing(intensity, lat = 70) {
  const kpColor = getKpColor(intensity);
  const radius = 2.05;
  
  // Create aurora ring geometry
  const ringGeometry = new THREE.RingGeometry(radius - 0.1, radius + 0.1, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: kpColor,
    transparent: true,
    opacity: Math.min(0.8, intensity / 9 * 0.8 + 0.2),
    side: THREE.DoubleSide
  });
  
  const auroraRing = new THREE.Mesh(ringGeometry, ringMaterial);
  
  // Position aurora at polar regions
  const phi = (90 - lat) * Math.PI / 180;
  auroraRing.position.y = radius * Math.cos(phi);
  auroraRing.rotation.x = Math.PI / 2;
  
  // Add pulsing animation
  auroraRing.userData = {
    originalOpacity: ringMaterial.opacity,
    intensity: intensity,
    time: 0
  };
  
  return auroraRing;
}

function updateAuroraVisualizations() {
  // Clear existing auroras
  auroraRings.forEach(ring => earthGroup.remove(ring));
  auroraRings = [];

  if (!rawStorms.length) {
    updateEarthStormCount(0);
    return;
  }

  let activeStorms = 0;
  
  rawStorms.forEach(storm => {
    const kpEntries = getKpEntriesFromStorm(storm);
    const kpArray = kpEntries.map(k => extractKpValue(k)).filter(n => !isNaN(n));
    const maxKp = kpArray.length ? Math.max(...kpArray) : 0;
    
    if (maxKp >= 3) { // Only show storms with Kp >= 3
      activeStorms++;
      
      // Northern aurora
      const northAurora = createAuroraRing(maxKp, 70);
      earthGroup.add(northAurora);
      auroraRings.push(northAurora);
      
      // Southern aurora for stronger storms
      if (maxKp >= 5) {
        const southAurora = createAuroraRing(maxKp, -70);
        earthGroup.add(southAurora);
        auroraRings.push(southAurora);
      }
    }
  });
  
  updateEarthStormCount(activeStorms);
}

function getKpColor(kp) {
  if (kp >= 8) return 0xd500f9; // Extreme - Purple
  if (kp >= 7) return 0xff1744; // Severe - Red
  if (kp >= 6) return 0xff5722; // Severe - Orange-Red
  if (kp >= 5) return 0xff9800; // High - Orange
  if (kp >= 4) return 0xffc107; // Moderate - Yellow
  return 0x00d9ff; // Low - Cyan
}

function updateEarthStormCount(count) {
  const countEl = document.getElementById('earth-storm-count');
  if (countEl) {
    countEl.textContent = `${count} tormenta${count !== 1 ? 's' : ''} activa${count !== 1 ? 's' : ''}`;
  }
}

function animate() {
  requestAnimationFrame(animate);
  
  if (earthGroup && isRotating) {
    earthGroup.rotation.y += 0.005;
  }
  
  // Enhanced aurora animations
  auroraRings.forEach(ring => {
    const userData = ring.userData;
    userData.time += userData.pulseSpeed || 0.05;
    
    // Multi-layered pulsing effect based on intensity and layer
    const basePulse = Math.sin(userData.time) * 0.25 + 0.75;
    const secondaryPulse = Math.sin(userData.time * 1.5 + userData.layerIndex) * 0.15 + 0.85;
    const combinedPulse = basePulse * secondaryPulse;
    
    ring.material.opacity = userData.originalOpacity * combinedPulse;
    
    // Enhanced rotation with varying speeds
    const rotationSpeed = userData.rotationSpeed || 0.01;
    ring.rotation.z += rotationSpeed;
    
    // Add subtle scale animation for high-intensity storms
    if (userData.intensity >= 7) {
      const scaleVariation = Math.sin(userData.time * 0.8) * 0.02 + 1;
      ring.scale.setScalar(scaleVariation);
    }
    
    // Color shifting for extreme storms
    if (userData.intensity >= 8) {
      const colorShift = Math.sin(userData.time * 0.6) * 0.1 + 0.9;
      ring.material.color.multiplyScalar(colorShift);
    }
  });
  
  // Animate storm evolution if available
  if (earthGroup && earthGroup.userData.stormEvolution) {
    animateStormEvolution();
  }
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

function animateStormEvolution() {
  // This function could be expanded to show temporal evolution
  // For now, it just adds a subtle effect to indicate evolution data is available
  const evolutionData = earthGroup.userData.stormEvolution;
  if (evolutionData && evolutionData.length > 1) {
    // Add subtle brightness variation to indicate temporal data
    const time = Date.now() * 0.001;
    const evolutionEffect = Math.sin(time * 0.3) * 0.1 + 0.9;
    
    auroraRings.forEach(ring => {
      if (ring.userData.layerIndex === 0) { // Only affect the main layer
        ring.material.opacity *= evolutionEffect;
      }
    });
  }
}

function onMouseDown(event) {
  mousePressed = true;
  mouse.x = event.clientX;
  mouse.y = event.clientY;
}

function onMouseMove(event) {
  if (!mousePressed || !earthGroup) return;
  
  const deltaX = event.clientX - mouse.x;
  const deltaY = event.clientY - mouse.y;
  
  earthGroup.rotation.y += deltaX * 0.01;
  earthGroup.rotation.x += deltaY * 0.01;
  
  // Clamp X rotation to prevent flipping
  earthGroup.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, earthGroup.rotation.x));
  
  mouse.x = event.clientX;
  mouse.y = event.clientY;
}

function onMouseUp() {
  mousePressed = false;
}

function onMouseWheel(event) {
  if (!camera) return;
  
  const zoom = event.deltaY > 0 ? 1.1 : 0.9;
  camera.position.multiplyScalar(zoom);
  
  // Clamp zoom
  const distance = camera.position.length();
  if (distance < 3) camera.position.setLength(3);
  if (distance > 15) camera.position.setLength(15);
}

function toggleRotation() {
  isRotating = !isRotating;
  const btn = document.getElementById('earth-toggle-rotation');
  if (btn) {
    btn.textContent = isRotating ? '⏸️ Pausar rotación' : '▶️ Reanudar rotación';
  }
}

function resetView() {
  if (!camera || !earthGroup) return;
  
  // Reset camera position
  camera.position.set(0, 0, 6);
  
  // Reset earth rotation
  earthGroup.rotation.set(0, 0, 0);
  
  // Resume rotation
  isRotating = true;
  const btn = document.getElementById('earth-toggle-rotation');
  if (btn) {
    btn.textContent = '⏸️ Pausar rotación';
  }
}

function showAllStorms() {
  // Clear any selected storm
  selectedIndex = null;
  
  // Remove active state from all storm items
  const items = listEl?.querySelectorAll('.gst-item');
  items?.forEach(item => item.classList.remove('active'));
  
  // Reset to show all storms
  updateAuroraVisualizations();
  
  // Hide temporal info panel
  hideTemporalInfo();
  
  // Reset earth info display
  const earthInfo = document.querySelector('.earth-info');
  if (earthInfo) {
    earthInfo.innerHTML = `<span id="earth-storm-count">0 tormentas activas</span>`;
  }
  
  // Update storm count
  updateEarthStormCount(rawStorms.filter(storm => {
    const kpEntries = getKpEntriesFromStorm(storm);
    const kpArray = kpEntries.map(k => extractKpValue(k)).filter(n => !isNaN(n));
    const maxKp = kpArray.length ? Math.max(...kpArray) : 0;
    return maxKp >= 3;
  }).length);
  
  // Reset gauge to show overall maximum
  if (flattenedKp.length > 0) {
    const allKp = flattenedKp.map(k => extractKpValue(k)).filter(n => !isNaN(n));
    const maxKp = allKp.length ? Math.max(...allKp) : 0;
    updateGauge(maxKp);
  }
}

function onWindowResize() {
  if (!camera || !renderer) return;
  
  const container = document.getElementById('earth-container');
  if (!container) return;
  
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function highlightSelectedStorm(stormIdx) {
  if (!earthGroup || stormIdx < 0 || stormIdx >= rawStorms.length) {
    // If no valid selection, show all storms
    updateAuroraVisualizations();
    return;
  }
  
  const selectedStorm = rawStorms[stormIdx];
  const kpEntries = getKpEntriesFromStorm(selectedStorm);
  
  if (kpEntries.length === 0) {
    // No Kp data for this storm, clear visualization
    clearSelectedStormVisualization();
    return;
  }
  
  // Update visualization to show only the selected storm
  updateSelectedStormVisualization(selectedStorm, kpEntries);
}

function clearSelectedStormVisualization() {
  // Clear existing auroras
  auroraRings.forEach(ring => earthGroup.remove(ring));
  auroraRings = [];
  updateEarthStormCount(0);
}

function updateSelectedStormVisualization(storm, kpEntries) {
  // Clear existing auroras
  auroraRings.forEach(ring => earthGroup.remove(ring));
  auroraRings = [];
  
  // Get Kp values and create temporal visualization
  const kpValues = kpEntries.map(k => extractKpValue(k)).filter(n => !isNaN(n));
  const maxKp = kpValues.length ? Math.max(...kpValues) : 0;
  const avgKp = kpValues.length ? kpValues.reduce((a,b) => a+b, 0) / kpValues.length : 0;
  
  if (maxKp >= 3) {
    // Create multiple aurora rings with different intensities to show storm evolution
    const intensityLevels = [
      Math.min(maxKp, 9),      // Peak intensity
      Math.min(avgKp + 1, 9),  // Above average
      Math.max(avgKp - 1, 3)   // Below average but significant
    ];
    
    intensityLevels.forEach((intensity, index) => {
      // Northern auroras with different radii to show storm layers
      const northAurora = createEnhancedAuroraRing(intensity, 70, 2.05 + index * 0.05, index);
      earthGroup.add(northAurora);
      auroraRings.push(northAurora);
      
      // Southern auroras for stronger storms
      if (intensity >= 5) {
        const southAurora = createEnhancedAuroraRing(intensity, -70, 2.05 + index * 0.05, index);
        earthGroup.add(southAurora);
        auroraRings.push(southAurora);
      }
    });
    
    // Add temporal evolution effect if we have multiple measurements
    if (kpEntries.length > 1) {
      addTemporalEvolutionEffect(kpEntries);
    }
  }
  
  updateEarthStormCount(1);
  
  // Update storm info display
  updateSelectedStormInfo(storm, maxKp, avgKp, kpEntries.length);
}

function createEnhancedAuroraRing(intensity, lat = 70, radius = 2.05, layerIndex = 0) {
  const kpColor = getKpColor(intensity);
  
  // Create aurora ring geometry with varying thickness based on intensity
  const thickness = 0.08 + (intensity / 9) * 0.06; // 0.08 to 0.14
  const ringGeometry = new THREE.RingGeometry(radius - thickness, radius + thickness, 64);
  
  // Enhanced material with better visual effects
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: kpColor,
    transparent: true,
    opacity: Math.min(0.9, (intensity / 9) * 0.7 + 0.3 - layerIndex * 0.15),
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending // Better glow effect
  });
  
  const auroraRing = new THREE.Mesh(ringGeometry, ringMaterial);
  
  // Position aurora at polar regions
  const phi = (90 - lat) * Math.PI / 180;
  auroraRing.position.y = radius * Math.cos(phi);
  auroraRing.rotation.x = Math.PI / 2;
  
  // Enhanced animation data
  auroraRing.userData = {
    originalOpacity: ringMaterial.opacity,
    intensity: intensity,
    layerIndex: layerIndex,
    time: layerIndex * Math.PI * 0.3, // Offset animation phases
    pulseSpeed: 0.03 + (intensity / 9) * 0.04, // Faster pulse for higher intensity
    rotationSpeed: 0.005 + (intensity / 9) * 0.01 // Faster rotation for higher intensity
  };
  
  return auroraRing;
}

function addTemporalEvolutionEffect(kpEntries) {
  // Sort entries by time
  const sortedEntries = [...kpEntries].sort((a, b) => new Date(a.observedTime) - new Date(b.observedTime));
  
  // Add subtle particles or effects to show evolution over time
  // This could be enhanced with particle systems in future updates
  console.log(`🕒 Storm evolution: ${sortedEntries.length} measurements over time`);
  
  // Store evolution data for future enhancements
  if (earthGroup) {
    earthGroup.userData.stormEvolution = sortedEntries.map(entry => ({
      time: entry.observedTime,
      kp: extractKpValue(entry),
      source: entry.source
    }));
  }
}

function updateSelectedStormInfo(storm, maxKp, avgKp, measurementCount) {
  // Update the earth info display with selected storm details
  const earthInfo = document.querySelector('.earth-info');
  if (earthInfo) {
    const stormDate = storm.startTime || storm.time || 'Fecha desconocida';
    const formattedDate = isoToLocale(stormDate);
    
    earthInfo.innerHTML = `
      <div style="font-size: 0.7rem; line-height: 1.3;">
        <div style="font-weight: bold; color: var(--color-accent-cyan);">Tormenta Seleccionada</div>
        <div>${formattedDate}</div>
        <div>Kp máx: <span style="color: ${getKpColorHex(maxKp)}">${maxKp.toFixed(1)}</span></div>
        <div>Kp prom: ${avgKp.toFixed(1)}</div>
        <div>${measurementCount} mediciones</div>
      </div>
    `;
  }
  
  // Show temporal evolution panel if there are multiple measurements
  if (measurementCount > 1) {
    showTemporalInfo(storm);
  }
}

function showTemporalInfo(storm) {
  const temporalPanel = document.getElementById('earth-temporal-info');
  const temporalContent = document.getElementById('temporal-info-content');
  
  if (!temporalPanel || !temporalContent) return;
  
  const kpEntries = getKpEntriesFromStorm(storm);
  const sortedEntries = [...kpEntries].sort((a, b) => new Date(a.observedTime) - new Date(b.observedTime));
  
  // Generate temporal measurements display
  const measurementsHtml = sortedEntries.map(entry => {
    const kpVal = extractKpValue(entry);
    const time = new Date(entry.observedTime).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const kpColor = getKpColorHex(kpVal);
    
    return `
      <div class="temporal-measurement">
        <span class="temporal-time">${time}</span>
        <span class="temporal-kp" style="background: ${kpColor}; color: ${kpVal >= 6 ? 'white' : 'black'};">
          ${kpVal.toFixed(1)}
        </span>
      </div>
    `;
  }).join('');
  
  temporalContent.innerHTML = measurementsHtml;
  temporalPanel.style.display = 'block';
  
  // Set up close button
  const closeBtn = document.getElementById('close-temporal-info');
  if (closeBtn) {
    closeBtn.onclick = hideTemporalInfo;
  }
}

function hideTemporalInfo() {
  const temporalPanel = document.getElementById('earth-temporal-info');
  if (temporalPanel) {
    temporalPanel.style.display = 'none';
  }
}

function getKpColorHex(kp) {
  const color = getKpColor(kp);
  return `#${color.toString(16).padStart(6, '0')}`;
}

// Initial
loadStorms(7);

export {};
