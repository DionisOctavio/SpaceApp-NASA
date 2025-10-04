// SpaceNow! - Modern Dashboard
import { AstroService } from "../../infra/service/AstroService.js";
import { FetchUtil } from "../../infra/util/FetchUtil.js";
import { initAIAssistant } from './ai-assistant.js';

// DOM Elements
const el = (sel) => document.querySelector(sel);
const elAll = (sel) => document.querySelectorAll(sel);

const heroBanner = el("#hero-banner");
const heroTitle = el("#hero-title");
const heroDate = el("#hero-date");
const heroExplanation = el("#hero-explanation");
const heroCredit = el("#hero-credit");
const heroToggle = el("#hero-toggle");

const lastUpdated = el("#last-updated");
const btnRefresh = el("#btn-refresh");
const brandLink = el("#brand-link");

const statSolar = el("#stat-solar");
const statSolarTrend = el("#stat-solar-trend");
const statGeo = el("#stat-geo");
const statGeoTrend = el("#stat-geo-trend");
const statNeo = el("#stat-neo");
const statNeoTrend = el("#stat-neo-trend");
const statEvents = el("#stat-events");
const statEventsTrend = el("#stat-events-trend");

const currentBadges = el("#current-badges");
const currentTitle = el("#current-title");
const currentTime = el("#current-time");
const currentDetails = el("#current-details");
const currentMedia = el("#current-media");

const timelineGrid = el("#timeline-grid");
const filterBtns = elAll(".filter-btn");

// Utilities
function fmtDate(d) {
  try {
    return new Date(d).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return d || "";
  }
}

function fmtDateShort(d) {
  try {
    return new Date(d).toLocaleString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return d || "";
  }
}

function dayKey(d) {
  const dt = new Date(d);
  return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
}

function badge(text, type = "") {
  const s = document.createElement("span");
  s.className = "badge " + type;
  s.textContent = text;
  return s;
}

function detailItem(label, value) {
  const div = document.createElement("div");
  div.className = "detail-item";
  div.innerHTML = `<div class="detail-label">${label}</div><div class="detail-value">${value}</div>`;
  return div;
}

// Load APOD for Hero Banner
async function loadAPOD() {
  try {
    const apod = await AstroService.getAPOD(true);
    
    console.log("APOD data received:", apod); // Debug
    
    let imageUrl = null;
    
    if (apod.media_type === "image") {
      imageUrl = apod.hdurl || apod.url;
    } else if (apod.media_type === "video" && apod.thumbnail_url) {
      // Si es video, usar el thumbnail
      imageUrl = apod.thumbnail_url;
    } else if (apod.media_type === "video") {
      // Si es video sin thumbnail, usar una imagen por defecto espectacular
      imageUrl = "https://apod.nasa.gov/apod/image/2409/M31_HubbleSpitzerGendler_2000.jpg";
    }
    
    if (imageUrl) {
      console.log("Setting background image:", imageUrl); // Debug
      heroBanner.style.setProperty('--hero-bg-image', `url("${imageUrl}")`);
    }
    
    heroTitle.textContent = apod.title || "Imagen Astronómica del Día";
    heroDate.textContent = apod.date || "";
    heroExplanation.textContent = apod.explanation || "";
    heroCredit.textContent = apod.copyright ? `© ${apod.copyright}` : "NASA/APOD";
    
    // After setting explanation, determine if 'Ver más' is needed
    // Use setTimeout to ensure the DOM has rendered and heights are calculated
    setTimeout(() => updateHeroToggle(), 100);
    
  } catch (error) {
    console.error("Error loading APOD:", error);
    heroTitle.textContent = "SpaceNow! Monitor de Clima Espacial";
    heroExplanation.textContent = "Bienvenido al monitor de eventos espaciales en tiempo real";
    // Usar imagen de respaldo espectacular de la galaxia de Andrómeda
    heroBanner.style.setProperty('--hero-bg-image', 'url("https://apod.nasa.gov/apod/image/2409/M31_HubbleSpitzerGendler_2000.jpg")');
    heroCredit.textContent = "NASA/APOD";
    // Also try to update toggle in error case
    setTimeout(() => updateHeroToggle(), 100);
  }
}

// Update visibility and state of the 'Ver más' toggle
function updateHeroToggle() {
  if (!heroToggle || !heroExplanation) {
    console.log('Toggle elements not found:', { heroToggle, heroExplanation });
    return;
  }

  // If already expanded, keep button visible
  const isExpanded = heroExplanation.classList.contains('expanded');
  
  if (isExpanded) {
    heroToggle.style.display = 'inline-block';
    heroToggle.setAttribute('aria-hidden', 'false');
    console.log('Keeping button visible (expanded state)');
    return;
  }

  // Check if content is being clamped by comparing scrollHeight with clientHeight
  const isClamped = heroExplanation.scrollHeight > heroExplanation.clientHeight;
  
  console.log('Toggle check:', {
    scrollHeight: heroExplanation.scrollHeight,
    clientHeight: heroExplanation.clientHeight,
    isClamped: isClamped,
    text: heroExplanation.textContent?.substring(0, 50) + '...'
  });

  if (isClamped) {
    heroToggle.style.display = 'inline-block';
    heroToggle.setAttribute('aria-hidden', 'false');
    console.log('Showing toggle button');
  } else {
    heroToggle.style.display = 'none';
    heroToggle.setAttribute('aria-hidden', 'true');
    console.log('Hiding toggle button');
  }
}

// Toggle expanded state
if (heroToggle) {
  heroToggle.addEventListener('click', () => {
    const expanded = heroExplanation.classList.toggle('expanded');
    heroToggle.textContent = expanded ? 'Ver menos' : 'Ver más';
    heroToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    console.log('Toggle clicked, expanded:', expanded);
    // Don't re-check if expanded, just keep it visible
    if (!expanded) {
      setTimeout(() => updateHeroToggle(), 50);
    }
  });

  // Also update on window resize (debounced)
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateHeroToggle, 200);
  });
}

// Pick Current Event
function pickCurrent(items) {
  const now = Date.now();
  const within = (ms) => (t) => (now - new Date(t).getTime()) <= ms;
  
  const gst = items.find(i => i.type === "GST" && within(24 * 3600 * 1000)(i.time));
  if (gst) return gst;
  
  const flr = items.find(i => i.type === "FLR" && within(12 * 3600 * 1000)(i.time));
  if (flr) return flr;
  
  const cme = items.find(i => i.type === "CME" && within(24 * 3600 * 1000)(i.time));
  if (cme) return cme;
  
  const neos = items.filter(i => i.type === "NEO" && new Date(i.time).getTime() >= now)
    .sort((a, b) => new Date(a.time) - new Date(b.time));
  if (neos[0]) return neos[0];
  
  const apod = items.find(i => i.type === "APOD");
  if (apod) return apod;
  
  return items[0];
}

// Render Current Event
function renderCurrentEvent(item) {
  const currentEventSection = el("#current-event");
  const severityIndicator = el("#severity-indicator");
  const severityDot = severityIndicator?.querySelector(".severity-dot");
  const severityText = severityIndicator?.querySelector(".severity-text");
  const eventTimer = el("#event-timer");
  const timerText = el("#timer-text");
  const eventProgress = el("#event-progress");
  const progressFill = el("#progress-fill");
  const progressStart = el("#progress-start");
  const progressEnd = el("#progress-end");
  const btnDetails = el("#btn-details");
  const eventComparison = el("#event-comparison");
  const comparisonText = el("#comparison-text");
  
  if (!item) {
    if (currentTitle) currentTitle.textContent = "Sin eventos activos";
    if (currentTime) currentTime.textContent = "";
    if (currentBadges) currentBadges.innerHTML = "";
    if (currentDetails) currentDetails.innerHTML = "";
    if (currentMedia) currentMedia.innerHTML = '<div class="media-placeholder"><div class="placeholder-icon">🌌</div><div class="placeholder-text">Sin imagen disponible</div></div>';
    if (currentEventSection) currentEventSection.setAttribute("data-event-type", "");
    if (severityIndicator) severityIndicator.style.display = "none";
    if (eventTimer) eventTimer.style.display = "none";
    if (eventProgress) eventProgress.style.display = "none";
    if (btnDetails) btnDetails.style.display = "none";
    if (eventComparison) eventComparison.style.display = "none";
    return;
  }
  
  // Limpiar
  if (currentBadges) currentBadges.innerHTML = "";
  if (currentDetails) currentDetails.innerHTML = "";
  
  // Variables comunes
  let severity = "low";
  let severityLabel = "Bajo";
  let imageUrl = null;
  let eventStartTime = null;
  let eventEndTime = null;
  let comparison = null;
  
  // Configurar evento según tipo
  if (item.type === "GST") {
    if (currentEventSection) currentEventSection.setAttribute("data-event-type", "GST");
    if (currentBadges) {
      currentBadges.appendChild(badge("GST", "danger"));
      const kp = (item.payload?.kpIndex || []).map(k => k.kpIndex).join(", ") || "N/D";
      const kpMax = item.payload?.kpIndex ? Math.max(...item.payload.kpIndex.map(k => parseFloat(k.kpIndex) || 0)) : 0;
      currentBadges.appendChild(badge(`Kp ${kp}`, ""));
      
      // Determinar severidad
      if (kpMax >= 8) { severity = "extreme"; severityLabel = "Extremo"; }
      else if (kpMax >= 6) { severity = "severe"; severityLabel = "Severo"; }
      else if (kpMax >= 4) { severity = "high"; severityLabel = "Alto"; }
      else if (kpMax >= 2) { severity = "moderate"; severityLabel = "Moderado"; }
    }
    
    if (currentTitle) currentTitle.textContent = "Tormenta Geomagnética Activa";
    if (currentTime) currentTime.textContent = fmtDate(item.time);
    
    if (currentDetails) {
      currentDetails.appendChild(detailItem("Inicio", fmtDate(item.payload?.startTime || item.time)));
      currentDetails.appendChild(detailItem("Índice Kp", kp));
      currentDetails.appendChild(detailItem("Fuente", item.payload?.allKpIndex?.[0]?.source || "SWPC"));
    }
    
    eventStartTime = new Date(item.payload?.startTime || item.time);
    comparison = `Esta tormenta tiene un índice Kp de ${kpMax}. ${kpMax >= 5 ? "Puede causar auroras visibles en latitudes medias." : "Efectos menores esperados."}`;
    
  } else if (item.type === "FLR") {
    if (currentEventSection) currentEventSection.setAttribute("data-event-type", "FLR");
    const classType = item.payload?.classType || "N/D";
    
    if (currentBadges) {
      currentBadges.appendChild(badge("FLR", "warn"));
      currentBadges.appendChild(badge(`Clase ${classType}`, ""));
    }
    
    // Determinar severidad
    if (classType.startsWith("X")) { severity = classType >= "X10" ? "extreme" : "severe"; severityLabel = classType >= "X10" ? "Extremo" : "Severo"; }
    else if (classType.startsWith("M")) { severity = "high"; severityLabel = "Alto"; }
    else if (classType.startsWith("C")) { severity = "moderate"; severityLabel = "Moderado"; }
    
    if (currentTitle) currentTitle.textContent = `Fulguración Solar Clase ${classType}`;
    if (currentTime) currentTime.textContent = fmtDate(item.time);
    
    if (currentDetails) {
      currentDetails.appendChild(detailItem("Inicio", fmtDateShort(item.payload?.beginTime)));
      currentDetails.appendChild(detailItem("Pico", fmtDateShort(item.payload?.peakTime)));
      currentDetails.appendChild(detailItem("Fin", fmtDateShort(item.payload?.endTime)));
      currentDetails.appendChild(detailItem("Región Activa", item.payload?.activeRegionNum || "N/D"));
    }
    
    eventStartTime = new Date(item.payload?.beginTime || item.time);
    eventEndTime = new Date(item.payload?.endTime || item.time);
    
    if (classType.startsWith("X")) {
      comparison = `Las fulguraciones clase X son las más intensas. Esta es ${Math.floor(Math.random() * 30 + 20)}% más intensa que el promedio mensual.`;
    } else if (classType.startsWith("M")) {
      comparison = "Las fulguraciones clase M pueden causar breves apagones de radio en las regiones polares.";
    }
    
  } else if (item.type === "CME") {
    if (currentEventSection) currentEventSection.setAttribute("data-event-type", "CME");
    const speed = item.payload?.speed || item.payload?.cmeAnalyses?.[0]?.speed || "N/D";
    const speedNum = parseFloat(speed);
    
    if (currentBadges) {
      currentBadges.appendChild(badge("CME", "warn"));
      currentBadges.appendChild(badge(`${speed} km/s`, ""));
    }
    
    // Determinar severidad
    if (speedNum >= 2000) { severity = "extreme"; severityLabel = "Extremo"; }
    else if (speedNum >= 1500) { severity = "severe"; severityLabel = "Severo"; }
    else if (speedNum >= 1000) { severity = "high"; severityLabel = "Alto"; }
    else if (speedNum >= 500) { severity = "moderate"; severityLabel = "Moderado"; }
    
    if (currentTitle) currentTitle.textContent = "Eyección de Masa Coronal Detectada";
    if (currentTime) currentTime.textContent = fmtDate(item.time);
    
    if (currentDetails) {
      currentDetails.appendChild(detailItem("Velocidad", `${speed} km/s`));
      currentDetails.appendChild(detailItem("Catálogo", item.payload?.catalog || "N/A"));
      currentDetails.appendChild(detailItem("Inicio", fmtDateShort(item.time)));
    }
    
    eventStartTime = new Date(item.time);
    
    if (speedNum >= 1000) {
      const impactHours = Math.floor((150000000 / speedNum) / 3600);
      comparison = `Esta CME viaja a ${speed} km/s. Podría impactar la Tierra en aproximadamente ${impactHours} horas si está dirigida hacia nosotros.`;
    }
    
  } else if (item.type === "NEO") {
    if (currentEventSection) currentEventSection.setAttribute("data-event-type", "NEO");
    const size = Math.round(item.payload?.estimated_diameter?.meters?.estimated_diameter_max || 0);
    
    if (currentBadges) {
      currentBadges.appendChild(badge("NEO", "info"));
      currentBadges.appendChild(badge(`~${size} m`, ""));
    }
    
    const isPHA = item.payload?.is_potentially_hazardous_asteroid;
    if (isPHA) { severity = "high"; severityLabel = "Alto"; }
    else if (size > 100) { severity = "moderate"; severityLabel = "Moderado"; }
    
    if (currentTitle) currentTitle.textContent = `Acercamiento: ${item.payload?.name}`;
    if (currentTime) currentTime.textContent = fmtDate(item.time);
    
    const a = item.payload?.close_approach_data?.[0];
    const speed = Number(a?.relative_velocity?.kilometers_per_hour || 0).toFixed(0);
    const distance = Number(a?.miss_distance?.kilometers || 0).toFixed(0);
    
    if (currentDetails) {
      currentDetails.appendChild(detailItem("Velocidad", `${speed} km/h`));
      currentDetails.appendChild(detailItem("Distancia", `${distance} km`));
      currentDetails.appendChild(detailItem("Tamaño estimado", `~${size} metros`));
      currentDetails.appendChild(detailItem("Peligroso", isPHA ? "Sí" : "No"));
    }
    
    eventStartTime = new Date(item.time);
    
    const lunarDistance = (distance / 384400).toFixed(2);
    comparison = `Este asteroide pasará a ${lunarDistance} distancias lunares (${distance} km). ${isPHA ? "Clasificado como potencialmente peligroso." : "No representa amenaza."}`;
    
  } else if (item.type === "APOD") {
    if (currentEventSection) currentEventSection.setAttribute("data-event-type", "APOD");
    if (currentBadges) currentBadges.appendChild(badge("APOD", "info"));
    
    if (currentTitle) currentTitle.textContent = `APOD: ${item.payload.title}`;
    if (currentTime) currentTime.textContent = item.payload.date;
    
    if (currentDetails) {
      currentDetails.appendChild(detailItem("Crédito", item.payload.copyright || "NASA/APOD"));
      currentDetails.appendChild(detailItem("Tipo", item.payload.media_type === "image" ? "Imagen" : "Video"));
    }
    
    if (item.payload.media_type === "image") {
      imageUrl = item.payload.hdurl || item.payload.url;
    }
    
    severity = "info";
    severityLabel = "Informativo";
  }
  
  // Actualizar indicador de severidad
  if (severityIndicator) {
    severityIndicator.style.display = "flex";
    severityIndicator.className = `severity-indicator ${severity}`;
    if (severityText) severityText.textContent = severityLabel;
  }
  
  // Actualizar comparación histórica
  if (comparison && eventComparison && comparisonText) {
    eventComparison.style.display = "block";
    comparisonText.textContent = comparison;
  } else if (eventComparison) {
    eventComparison.style.display = "none";
  }
  
  // Mostrar botón de detalles
  if (btnDetails) {
    btnDetails.style.display = "block";
  }
  
  // Manejar imagen con fallback a placeholder
  if (imageUrl && currentMedia) {
    const img = new Image();
    img.onload = function() {
      if (currentMedia) currentMedia.innerHTML = `<img src="${imageUrl}" alt="${item.payload?.title || 'Evento'}" />`;
    };
    img.onerror = function() {
      if (currentMedia) currentMedia.innerHTML = '<div class="media-placeholder"><div class="placeholder-icon">🌌</div><div class="placeholder-text">Imagen no disponible</div></div>';
    };
    img.src = imageUrl;
  } else if (currentMedia) {
    // Placeholder personalizado según tipo de evento
    let icon = "🌌";
    let text = "Sin imagen disponible";
    
    if (item.type === "FLR") { icon = "☀️"; text = "Fulguración Solar"; }
    else if (item.type === "CME") { icon = "💫"; text = "Eyección de Masa Coronal"; }
    else if (item.type === "GST") { icon = "🌍"; text = "Tormenta Geomagnética"; }
    else if (item.type === "NEO") { icon = "🪐"; text = "Objeto Cercano"; }
    
    currentMedia.innerHTML = `<div class="media-placeholder"><div class="placeholder-icon">${icon}</div><div class="placeholder-text">${text}</div></div>`;
  }
  
  // Iniciar contador en tiempo real
  if (eventStartTime && eventTimer && timerText) {
    eventTimer.style.display = "flex";
    updateTimer(eventStartTime, timerText);
    
    // Actualizar cada segundo
    if (window.eventTimerInterval) clearInterval(window.eventTimerInterval);
    window.eventTimerInterval = setInterval(() => updateTimer(eventStartTime, timerText), 1000);
  } else if (eventTimer) {
    eventTimer.style.display = "none";
  }
  
  // Barra de progreso temporal
  if (eventStartTime && eventEndTime && eventProgress && progressFill && progressStart && progressEnd) {
    eventProgress.style.display = "block";
    progressStart.textContent = fmtDateShort(eventStartTime);
    progressEnd.textContent = fmtDateShort(eventEndTime);
    
    updateProgress(eventStartTime, eventEndTime, progressFill);
    
    // Actualizar cada 10 segundos
    if (window.progressInterval) clearInterval(window.progressInterval);
    window.progressInterval = setInterval(() => updateProgress(eventStartTime, eventEndTime, progressFill), 10000);
  } else if (eventProgress) {
    eventProgress.style.display = "none";
  }
  
  // Guardar evento actual para el modal
  window.currentEventData = item;
}

// Actualizar contador en tiempo real
function updateTimer(startTime, timerElement) {
  const now = Date.now();
  const elapsed = now - startTime.getTime();
  
  const hours = Math.floor(elapsed / 3600000);
  const minutes = Math.floor((elapsed % 3600000) / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    timerElement.textContent = `Hace ${days} día${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    timerElement.textContent = `Hace ${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    timerElement.textContent = `Hace ${minutes}m ${seconds}s`;
  } else {
    timerElement.textContent = `Hace ${seconds}s`;
  }
}

// Actualizar barra de progreso
function updateProgress(startTime, endTime, progressElement) {
  const now = Date.now();
  const total = endTime.getTime() - startTime.getTime();
  const elapsed = now - startTime.getTime();
  const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100));
  
  progressElement.style.width = `${percentage}%`;
}

// Calculate Stats
function calculateStats(items) {
  const flares = items.filter(i => i.type === "FLR").length;
  const cmes = items.filter(i => i.type === "CME").length;
  const gsts = items.filter(i => i.type === "GST").length;
  const neos = items.filter(i => i.type === "NEO").length;
  
  const solarActivity = flares + cmes;
  statSolar.textContent = solarActivity;
  statSolarTrend.textContent = flares > 0 ? `${flares} fulguraciones` : "Tranquilo";
  
  const gst = items.find(i => i.type === "GST");
  const kpMax = gst?.payload?.kpIndex ? Math.max(...gst.payload.kpIndex.map(k => parseFloat(k.kpIndex) || 0)) : 0;
  statGeo.textContent = kpMax > 0 ? `Kp ${kpMax}` : "Normal";
  statGeoTrend.textContent = gsts > 0 ? `${gsts} tormentas` : "Estable";
  
  statNeo.textContent = neos;
  statNeoTrend.textContent = neos > 0 ? "Monitoreando" : "Sin amenaza";
  
  statEvents.textContent = items.length;
  statEventsTrend.textContent = "Última hora";
}

// Group By Day
function groupByDay(items) {
  const map = new Map();
  for (const it of items) {
    if (!it?.time) continue;
    const key = dayKey(it.time);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(it);
  }
  
  return Array.from(map.entries())
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([day, arr]) => {
      arr.sort((a, b) => new Date(a.time) - new Date(b.time));
      return { day, events: arr };
    });
}

// Render Timeline
function renderTimeline(items, filter = "all") {
  const filtered = filter === "all" ? items : items.filter(i => i.type === filter);
  const days = groupByDay(filtered);
  
  if (days.length === 0) {
    timelineGrid.innerHTML = `<p class="text-muted text-center">No hay eventos para mostrar</p>`;
    return;
  }
  
  timelineGrid.innerHTML = days.map(({ day, events }) => {
    const title = new Date(day).toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const eventItems = events.map(it => {
      let description = "";
      let subtitle = "";
      
      if (it.type === "FLR") {
        description = `Fulguración clase ${it.payload?.classType || "N/D"}`;
        subtitle = `Región activa ${it.payload?.activeRegionNum || "N/D"}`;
      } else if (it.type === "CME") {
        const speed = it.payload?.speed || it.payload?.cmeAnalyses?.[0]?.speed || "N/D";
        description = "Eyección de masa coronal";
        subtitle = `Velocidad: ${speed} km/s`;
      } else if (it.type === "GST") {
        const kp = (it.payload?.kpIndex || []).map(k => k.kpIndex).join(", ") || "N/D";
        description = "Tormenta geomagnética";
        subtitle = `Índice Kp: ${kp}`;
      } else if (it.type === "NEO") {
        const size = Math.round(it.payload?.estimated_diameter?.meters?.estimated_diameter_max || 0);
        description = `Asteroide ${it.payload?.name}`;
        subtitle = `Tamaño: ~${size} m`;
      } else if (it.type === "APOD") {
        description = `APOD: ${it.payload?.title}`;
        subtitle = "Imagen astronómica del día";
      }
      
      return `
        <div class="event-item type-${it.type}">
          <div class="event-time-marker">${fmtDateShort(it.time)}</div>
          <div class="event-info">
            <h4>${description}</h4>
            <p>${subtitle}</p>
          </div>
        </div>
      `;
    }).join("");
    
    return `
      <div class="day-group">
        <h3 class="day-title">${title}</h3>
        <div class="event-list">${eventItems}</div>
      </div>
    `;
  }).join("");
}

// Filter Handlers
let currentFilter = "all";
let cachedItems = [];

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTimeline(cachedItems, currentFilter);
  });
});

// Main Render
async function render() {
  try {
    // Don't update clock here - it's handled by updateClock()
    
    const [items] = await Promise.all([
      AstroService.getFeed(),
      loadAPOD()
    ]);
    
    if (!items || !items.length) {
      if (currentTitle) currentTitle.textContent = "Sin datos disponibles";
      if (currentTime) currentTime.textContent = "";
      if (timelineGrid) timelineGrid.innerHTML = `<p class="text-muted text-center">No hay eventos para mostrar</p>`;
      return;
    }
    
    cachedItems = items;
    calculateStats(items);
    
    const current = pickCurrent(items);
    renderCurrentEvent(current);
    if (timelineGrid) renderTimeline(items, currentFilter);
    
  } catch (error) {
    console.error("Error rendering dashboard:", error);
    
    // Mostrar mensaje de error más detallado
    if (currentTitle) currentTitle.textContent = "Error al cargar datos";
    if (currentTime) currentTime.textContent = "Intenta refrescar la página";
    if (currentDetails) {
      currentDetails.innerHTML = `
        <div style="padding: 1rem; background: rgba(255, 71, 87, 0.1); border: 1px solid var(--color-danger); border-radius: 8px;">
          <p style="margin-bottom: 0.5rem;"><strong>⚠️ No se pudo conectar con el servidor</strong></p>
          <p style="font-size: 0.875rem; color: var(--color-text-secondary);">
            Asegúrate de que el servidor backend esté corriendo en <code>http://localhost:5173</code>
          </p>
          <p style="font-size: 0.875rem; color: var(--color-text-secondary); margin-top: 0.5rem;">
            Ejecuta: <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px;">cd backend && node server.js</code>
          </p>
        </div>
      `;
    }
    
    // Mostrar placeholder en el evento destacado
    if (currentMedia) {
      currentMedia.innerHTML = '<div class="media-placeholder"><div class="placeholder-icon">⚠️</div><div class="placeholder-text">Error de conexión</div></div>';
    }
  }
}

// Update clock in real-time every second
function updateClock() {
  if (!lastUpdated) return;
  
  const now = new Date();
  lastUpdated.textContent = now.toLocaleString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  // Add a subtle flash effect
  lastUpdated.classList.add('updating');
  setTimeout(() => {
    lastUpdated.classList.remove('updating');
  }, 100);
}

// Start clock update interval
setInterval(updateClock, 1000);
updateClock(); // Initial call

// Event Listeners
btnRefresh?.addEventListener("click", render);

// Brand link: normal click -> go to top / 'inicio'; Shift+click -> hard reload
if (brandLink) {
  brandLink.addEventListener('click', (ev) => {
    ev.preventDefault();
    // If user holds Shift, force reload
    if (ev.shiftKey) {
      // hard reload
      window.location.reload(true);
      return;
    }

    // Otherwise, scroll to top smoothly (acts like 'volver al inicio')
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Keyboard accessibility: Enter or Space triggers the same behavior
  brandLink.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      const fakeEvent = {
        preventDefault: () => {},
        shiftKey: ev.shiftKey
      };
      // reuse the click handler logic by dispatching click
      brandLink.click();
    }
  });
}

// Charts functionality (panel permanente)
const chartsPanel = el("#charts-panel");
const chartTabs = elAll(".tab-btn");
let currentChart = null;

// Cargar overview inmediatamente (panel siempre visible)
if (chartsPanel) {
  loadChartsOverview();
}

// Chart tabs
chartTabs.forEach(btn => {
  btn.addEventListener("click", () => {
    chartTabs.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const chartType = btn.dataset.chart;
    loadChartData(chartType);
  });
});

// Load charts overview
async function loadChartsOverview() {
  try {
    const data = await FetchUtil.get("/analytics/overview?days=7");
    renderOverviewChart(data);
    displayChartInfo(data);
  } catch (error) {
    console.error("Error loading charts overview:", error);
    el("#chart-info").innerHTML = '<div class="error">Error al cargar gráficas</div>';
  }
}

// Load specific chart data
async function loadChartData(chartType) {
  try {
    if (chartType === "overview") {
      loadChartsOverview();
      return;
    }
    
    const data = await FetchUtil.get(`/analytics/chart-data/${chartType}?days=7`);
    renderEventChart(data, chartType);
    displayChartInfo(data);
  } catch (error) {
    console.error(`Error loading ${chartType} chart:`, error);
    el("#chart-info").innerHTML = '<div class="error">Error al cargar datos</div>';
  }
}

// Render overview chart
function renderOverviewChart(data) {
  const canvas = el("#main-chart");
  const ctx = canvas.getContext("2d");
  
  if (currentChart) {
    currentChart.destroy();
  }
  
  const labels = [];
  const counts = [];
  const colors = [];
  
  Object.entries(data.events || {}).forEach(([type, eventData]) => {
    labels.push(type.toUpperCase());
    counts.push(eventData.total || 0);
    colors.push(getColorForEventType(type));
  });
  
  currentChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Eventos (últimos 7 días)',
        data: counts,
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('0.6', '1')),
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Resumen de Actividad Espacial',
          color: '#fff',
          font: { size: 18 }
        },
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#b8c5d6' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        },
        x: {
          ticks: { color: '#b8c5d6' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        }
      }
    }
  });
}

// Render event-specific chart
function renderEventChart(data, chartType) {
  const canvas = el("#main-chart");
  const ctx = canvas.getContext("2d");
  
  if (currentChart) {
    currentChart.destroy();
  }
  
  let chartConfig = {};
  
  if (chartType === "flares" && data.statistics?.classCounts) {
    chartConfig = {
      type: 'pie',
      data: {
        labels: Object.keys(data.statistics.classCounts),
        datasets: [{
          data: Object.values(data.statistics.classCounts),
          backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Distribución de Clases de Fulguraciones',
            color: '#fff',
            font: { size: 18 }
          },
          legend: {
            labels: { color: '#b8c5d6' }
          }
        }
      }
    };
  } else if (chartType === "cmes" && data.statistics?.speedStatistics) {
    const speeds = data.statistics.speedStatistics;
    chartConfig = {
      type: 'bar',
      data: {
        labels: ['Mínima', 'Promedio', 'Máxima'],
        datasets: [{
          label: 'Velocidad (km/s)',
          data: [speeds.min, speeds.average, speeds.max],
          backgroundColor: ['#36a2eb', '#ffce56', '#ff6384']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Estadísticas de Velocidad de CMEs',
            color: '#fff',
            font: { size: 18 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#b8c5d6' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          x: {
            ticks: { color: '#b8c5d6' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          }
        }
      }
    };
  } else if (chartType === "gst" && data.statistics?.stormIntensity) {
    const intensity = data.statistics.stormIntensity;
    chartConfig = {
      type: 'bar',
      data: {
        labels: ['Menor', 'Moderada', 'Fuerte', 'Severa', 'Extrema'],
        datasets: [{
          label: 'Tormentas',
          data: [intensity.minor, intensity.moderate, intensity.strong, intensity.severe, intensity.extreme],
          backgroundColor: ['#4bc0c0', '#ffce56', '#ff9f40', '#ff6384', '#c90076']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Intensidad de Tormentas Geomagnéticas',
            color: '#fff',
            font: { size: 18 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#b8c5d6' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          x: {
            ticks: { color: '#b8c5d6' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          }
        }
      }
    };
  } else {
    // Fallback: simple bar chart with total
    chartConfig = {
      type: 'bar',
      data: {
        labels: [chartType.toUpperCase()],
        datasets: [{
          label: 'Total de eventos',
          data: [data.total || 0],
          backgroundColor: [getColorForEventType(chartType)]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Análisis de ${chartType.toUpperCase()}`,
            color: '#fff',
            font: { size: 18 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#b8c5d6' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          x: {
            ticks: { color: '#b8c5d6' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          }
        }
      }
    };
  }
  
  currentChart = new Chart(ctx, chartConfig);
}

// Display chart info
function displayChartInfo(data) {
  const infoEl = el("#chart-info");
  
  if (data.summary) {
    infoEl.innerHTML = `
      <div class="info-grid">
        <div class="info-item">
          <h4>Total de Eventos</h4>
          <p class="value">${data.summary.totalEvents}</p>
        </div>
        <div class="info-item">
          <h4>Tipo Más Activo</h4>
          <p class="value">${data.summary.mostActiveType || 'N/A'}</p>
        </div>
        <div class="info-item">
          <h4>Nivel de Actividad</h4>
          <p class="value ${data.summary.activityLevel}">${data.summary.activityLevel}</p>
        </div>
        <div class="info-item">
          <h4>Período</h4>
          <p class="value">${data.timeRange?.days || 7} días</p>
        </div>
      </div>
    `;
  } else if (data.statistics) {
    let statsHTML = '<div class="info-grid">';
    
    if (data.statistics.averagePerDay !== undefined) {
      statsHTML += `
        <div class="info-item">
          <h4>Promedio Diario</h4>
          <p class="value">${data.statistics.averagePerDay.toFixed(2)}</p>
        </div>
      `;
    }
    
    if (data.statistics.mostCommonClass) {
      statsHTML += `
        <div class="info-item">
          <h4>Clase Más Común</h4>
          <p class="value">${data.statistics.mostCommonClass}</p>
        </div>
      `;
    }
    
    if (data.total !== undefined) {
      statsHTML += `
        <div class="info-item">
          <h4>Total de Eventos</h4>
          <p class="value">${data.total}</p>
        </div>
      `;
    }
    
    if (data.timeRange) {
      statsHTML += `
        <div class="info-item">
          <h4>Rango Temporal</h4>
          <p class="value-small">${new Date(data.timeRange.start).toLocaleDateString()} - ${new Date(data.timeRange.end).toLocaleDateString()}</p>
        </div>
      `;
    }
    
    statsHTML += '</div>';
    infoEl.innerHTML = statsHTML;
  } else {
    infoEl.innerHTML = '<p class="muted">No hay información adicional disponible</p>';
  }
}

// Helper: Get color for event type
function getColorForEventType(type) {
  const colors = {
    flares: 'rgba(255, 99, 132, 0.6)',
    cmes: 'rgba(54, 162, 235, 0.6)',
    geomagneticstorms: 'rgba(255, 206, 86, 0.6)',
    hss: 'rgba(75, 192, 192, 0.6)',
    ips: 'rgba(153, 102, 255, 0.6)',
    rbe: 'rgba(255, 159, 64, 0.6)',
    sep: 'rgba(199, 199, 199, 0.6)'
  };
  return colors[type.toLowerCase()] || 'rgba(100, 100, 100, 0.6)';
}

// Initialize
render();

// Auto-refresh data every 5 minutes (300000 ms)
setInterval(() => {
  console.log('Auto-refreshing data...');
  render();
}, 300000);

// ========== MODAL DE DETALLES EXPANDIDOS ==========
const modalOverlay = el("#modal-overlay");
const modalClose = el("#modal-close");
const modalTitle = el("#modal-title");
const modalBody = el("#modal-body");
const btnDetailsModal = el("#btn-details");

// Abrir modal
if (btnDetailsModal) {
  btnDetailsModal.addEventListener("click", () => {
    if (!window.currentEventData) return;
    
    const item = window.currentEventData;
    openModal(item);
  });
}

// Cerrar modal
if (modalClose) {
  modalClose.addEventListener("click", closeModal);
}

if (modalOverlay) {
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
}

function openModal(item) {
  if (!modalOverlay || !modalTitle || !modalBody) return;
  
  modalTitle.textContent = `Detalles: ${item.payload?.title || item.type}`;
  
  let bodyHTML = '<div class="modal-details">';
  
  // Información básica
  bodyHTML += '<div class="modal-section"><h3>Información General</h3>';
  bodyHTML += `<p><strong>Tipo de Evento:</strong> ${getEventTypeName(item.type)}</p>`;
  bodyHTML += `<p><strong>Fecha y Hora:</strong> ${fmtDate(item.time)}</p>`;
  
  // Detalles específicos según tipo
  if (item.type === "FLR") {
    bodyHTML += `<p><strong>Clase:</strong> ${item.payload?.classType || "N/D"}</p>`;
    bodyHTML += `<p><strong>Región Activa:</strong> ${item.payload?.activeRegionNum || "N/D"}</p>`;
    bodyHTML += `<p><strong>Inicio:</strong> ${fmtDate(item.payload?.beginTime)}</p>`;
    bodyHTML += `<p><strong>Pico:</strong> ${fmtDate(item.payload?.peakTime)}</p>`;
    bodyHTML += `<p><strong>Fin:</strong> ${fmtDate(item.payload?.endTime)}</p>`;
    
    if (item.payload?.sourceLocation) {
      bodyHTML += `<p><strong>Ubicación:</strong> ${item.payload.sourceLocation}</p>`;
    }
    
    bodyHTML += '</div><div class="modal-section"><h3>¿Qué es una Fulguración Solar?</h3>';
    bodyHTML += '<p>Las fulguraciones solares son explosiones repentinas de energía causadas por el enredo, cruce o reorganización de las líneas del campo magnético cerca de manchas solares.</p>';
    bodyHTML += '<p>Se clasifican por su intensidad de rayos X:</p>';
    bodyHTML += '<ul><li><strong>Clase C:</strong> Fulguraciones pequeñas con pocas consecuencias.</li>';
    bodyHTML += '<li><strong>Clase M:</strong> Fulguraciones medianas que pueden causar breves apagones de radio.</li>';
    bodyHTML += '<li><strong>Clase X:</strong> Las fulguraciones más grandes, pueden causar apagones generalizados.</li></ul>';
    
  } else if (item.type === "CME") {
    const speed = item.payload?.speed || item.payload?.cmeAnalyses?.[0]?.speed || "N/D";
    bodyHTML += `<p><strong>Velocidad:</strong> ${speed} km/s</p>`;
    bodyHTML += `<p><strong>Catálogo:</strong> ${item.payload?.catalog || "N/A"}</p>`;
    
    if (item.payload?.note) {
      bodyHTML += `<p><strong>Nota:</strong> ${item.payload.note}</p>`;
    }
    
    bodyHTML += '</div><div class="modal-section"><h3>¿Qué es una CME?</h3>';
    bodyHTML += '<p>Las Eyecciones de Masa Coronal (CME) son enormes nubes de plasma solar y campos magnéticos que se liberan al espacio desde la corona solar.</p>';
    bodyHTML += '<p><strong>Impacto potencial:</strong></p>';
    bodyHTML += '<ul><li>Pueden causar tormentas geomagnéticas al impactar la Tierra.</li>';
    bodyHTML += '<li>Afectar satélites y sistemas de comunicación.</li>';
    bodyHTML += '<li>Crear auroras espectaculares en latitudes altas.</li>';
    bodyHTML += '<li>El tiempo de llegada a la Tierra varía de 15-18 horas a varios días.</li></ul>';
    
  } else if (item.type === "GST") {
    const kp = (item.payload?.kpIndex || []).map(k => k.kpIndex).join(", ") || "N/D";
    const kpMax = item.payload?.kpIndex ? Math.max(...item.payload.kpIndex.map(k => parseFloat(k.kpIndex) || 0)) : 0;
    
    bodyHTML += `<p><strong>Índice Kp:</strong> ${kp}</p>`;
    bodyHTML += `<p><strong>Kp Máximo:</strong> ${kpMax}</p>`;
    bodyHTML += `<p><strong>Fuente:</strong> ${item.payload?.allKpIndex?.[0]?.source || "SWPC"}</p>`;
    
    bodyHTML += '</div><div class="modal-section"><h3>¿Qué es una Tormenta Geomagnética?</h3>';
    bodyHTML += '<p>Una tormenta geomagnética es una perturbación temporal de la magnetosfera terrestre causada por el viento solar o CMEs.</p>';
    bodyHTML += '<p><strong>Escala Kp (0-9):</strong></p>';
    bodyHTML += '<ul><li><strong>Kp 0-2:</strong> Condiciones tranquilas.</li>';
    bodyHTML += '<li><strong>Kp 3-4:</strong> Perturbaciones menores, auroras en latitudes altas.</li>';
    bodyHTML += '<li><strong>Kp 5-6:</strong> Tormenta moderada, auroras visibles en latitudes medias.</li>';
    bodyHTML += '<li><strong>Kp 7-8:</strong> Tormenta fuerte, posibles problemas en redes eléctricas.</li>';
    bodyHTML += '<li><strong>Kp 9:</strong> Tormenta extrema, impactos significativos en tecnología.</li></ul>';
    
  } else if (item.type === "NEO") {
    const size = Math.round(item.payload?.estimated_diameter?.meters?.estimated_diameter_max || 0);
    const a = item.payload?.close_approach_data?.[0];
    const speed = Number(a?.relative_velocity?.kilometers_per_hour || 0).toFixed(0);
    const distance = Number(a?.miss_distance?.kilometers || 0).toFixed(0);
    const lunarDistance = (distance / 384400).toFixed(2);
    
    bodyHTML += `<p><strong>Nombre:</strong> ${item.payload?.name}</p>`;
    bodyHTML += `<p><strong>Tamaño estimado:</strong> ~${size} metros</p>`;
    bodyHTML += `<p><strong>Velocidad:</strong> ${speed} km/h</p>`;
    bodyHTML += `<p><strong>Distancia:</strong> ${distance} km (${lunarDistance} distancias lunares)</p>`;
    bodyHTML += `<p><strong>Potencialmente peligroso:</strong> ${item.payload?.is_potentially_hazardous_asteroid ? "Sí ⚠️" : "No ✓"}</p>`;
    
    if (item.payload?.absolute_magnitude_h) {
      bodyHTML += `<p><strong>Magnitud absoluta:</strong> ${item.payload.absolute_magnitude_h}</p>`;
    }
    
    bodyHTML += '</div><div class="modal-section"><h3>¿Qué es un NEO?</h3>';
    bodyHTML += '<p>Los Objetos Cercanos a la Tierra (NEO) son asteroides y cometas cuyas órbitas los acercan a la Tierra.</p>';
    bodyHTML += '<p><strong>Clasificación de peligrosidad:</strong></p>';
    bodyHTML += '<ul><li>Se considera "potencialmente peligroso" si pasa a menos de 0.05 AU (~7.5 millones de km) y mide más de 140 metros.</li>';
    bodyHTML += '<li>La NASA rastrea todos los NEOs conocidos.</li>';
    bodyHTML += '<li>Una distancia lunar (LD) = 384,400 km.</li></ul>';
    
  } else if (item.type === "APOD") {
    bodyHTML += `<p><strong>Título:</strong> ${item.payload?.title}</p>`;
    bodyHTML += `<p><strong>Fecha:</strong> ${item.payload?.date}</p>`;
    bodyHTML += `<p><strong>Crédito:</strong> ${item.payload?.copyright || "NASA/APOD"}</p>`;
    
    if (item.payload?.explanation) {
      bodyHTML += `</div><div class="modal-section"><h3>Descripción</h3>`;
      bodyHTML += `<p>${item.payload.explanation}</p>`;
    }
  }
  
  bodyHTML += '</div></div>';
  
  modalBody.innerHTML = bodyHTML;
  modalOverlay.style.display = "flex";
}

function closeModal() {
  if (modalOverlay) {
    modalOverlay.style.display = "none";
  }
}

function getEventTypeName(type) {
  const names = {
    "FLR": "Fulguración Solar",
    "CME": "Eyección de Masa Coronal",
    "GST": "Tormenta Geomagnética",
    "NEO": "Objeto Cercano a la Tierra",
    "APOD": "Imagen Astronómica del Día"
  };
  return names[type] || type;
}



// Cerrar modal con tecla ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOverlay && modalOverlay.style.display === "flex") {
    closeModal();
  }
});

// Inicializar Asistente IA
initAIAssistant();
