// AI Assistant for Space Weather Education
// Analiza datos de las APIs y explica el clima espacial de forma educativa

import { AstroService } from '../../infra/service/AstroService.js';

// ========== CONFIGURACIÓN DE IA ==========
// La API key está protegida en el backend
const BACKEND_URL = 'http://localhost:5173/api/ai';

// DOM Elements
const aiButton = document.getElementById('ai-assistant-btn');
const aiPanel = document.getElementById('ai-chat-panel');
const aiCloseBtn = document.getElementById('ai-close-btn');
const aiMessages = document.getElementById('ai-chat-messages');
const aiInput = document.getElementById('ai-chat-input');
const aiSendBtn = document.getElementById('ai-send-btn');
const aiQuickBtns = document.querySelectorAll('.ai-quick-btn');
const aiAlertsContainer = document.getElementById('ai-alerts-container');
const aiToggleAlertsBtn = document.getElementById('ai-toggle-alerts');
const aiToggleAlertsCloseBtn = document.getElementById('ai-toggle-alerts-close');
const aiAlertsSection = document.getElementById('ai-alerts-section');

// State
let conversationHistory = [];
let currentData = {
  flares: [],
  cmes: [],
  gst: [],
  neos: []
};

// ========== INICIALIZACIÓN ==========

export function initAIAssistant() {
  // Event listeners
  aiButton?.addEventListener('click', togglePanel);
  aiCloseBtn?.addEventListener('click', closePanel);
  aiSendBtn?.addEventListener('click', sendMessage);
  aiInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // Toggle alerts button
  aiToggleAlertsBtn?.addEventListener('click', showAlerts);
  aiToggleAlertsCloseBtn?.addEventListener('click', hideAlerts);
  
  // Quick action buttons
  aiQuickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const question = btn.getAttribute('data-question');
      sendMessage(question);
    });
  });
  
  // Auto-resize textarea
  aiInput?.addEventListener('input', () => {
    aiInput.style.height = 'auto';
    aiInput.style.height = Math.min(aiInput.scrollHeight, 120) + 'px';
  });
  
  // Cargar datos iniciales y analizar
  loadDataAndAnalyze();
}

// ========== PANEL CONTROL ==========

function togglePanel() {
  if (aiPanel.style.display === 'none') {
    aiPanel.style.display = 'flex';
    aiButton.style.display = 'none';
  } else {
    closePanel();
  }
}

function closePanel() {
  aiPanel.style.display = 'none';
  aiButton.style.display = 'flex';
}

// ========== TOGGLE ALERTAS ==========

function showAlerts() {
  if (aiAlertsSection) {
    aiAlertsSection.style.display = 'block';
  }
  if (aiToggleAlertsBtn) {
    aiToggleAlertsBtn.style.display = 'none';
  }
}

function hideAlerts() {
  if (aiAlertsSection) {
    aiAlertsSection.style.display = 'none';
  }
  if (aiToggleAlertsBtn) {
    aiToggleAlertsBtn.style.display = 'block';
  }
}

// Actualizar contador de alertas
function updateAlertCount(count) {
  const badge = document.getElementById('alert-count-badge');
  if (badge) {
    badge.textContent = count;
    // Ocultar badge si no hay alertas
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

// ========== CARGAR Y ANALIZAR DATOS ==========

async function loadDataAndAnalyze() {
  try {
    // Cargar datos de todas las APIs
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    
    const [flares, cmes, gst, neos] = await Promise.all([
      AstroService.getFlaresRange(startDate, endDate).catch(() => []),
      AstroService.getCMEs(3).catch(() => []),
      AstroService.getGST(5).catch(() => []),
      AstroService.getNeoToday().catch(() => ({ near_earth_objects: {} }))
    ]);
    
    currentData.flares = Array.isArray(flares) ? flares : [];
    currentData.cmes = Array.isArray(cmes) ? cmes : [];
    currentData.gst = Array.isArray(gst) ? gst : [];
    
    // getNeoToday devuelve { near_earth_objects: { "2025-10-04": [...] } }
    // Necesitamos extraer el array de la primera fecha
    if (neos.near_earth_objects && typeof neos.near_earth_objects === 'object') {
      const dateKeys = Object.keys(neos.near_earth_objects);
      currentData.neos = dateKeys.length > 0 ? neos.near_earth_objects[dateKeys[0]] : [];
    } else {
      currentData.neos = [];
    }
    
    // Analizar y generar alertas
    generateAlerts();
    
  } catch (error) {
    console.error('Error loading data for AI:', error);
    showError('No pude cargar los datos. Intentaré de nuevo en un momento.');
  }
}

// ========== ANÁLISIS Y ALERTAS ==========

function generateAlerts() {
  const alerts = [];
  
  // Analizar fulguraciones
  const recentFlares = currentData.flares.filter(f => isRecent(f.beginTime, 24));
  const xFlares = recentFlares.filter(f => f.classType?.startsWith('X'));
  const mFlares = recentFlares.filter(f => f.classType?.startsWith('M'));
  
  if (xFlares.length > 0) {
    alerts.push({
      severity: 'high',
      icon: '🔴',
      title: `${xFlares.length} Fulguración${xFlares.length > 1 ? 'es' : ''} Clase X`,
      description: '¡Evento solar extremo! Puede afectar comunicaciones de radio y satélites.',
      type: 'flare',
      data: xFlares[0]
    });
  } else if (mFlares.length > 0) {
    alerts.push({
      severity: 'medium',
      icon: '🟠',
      title: `${mFlares.length} Fulguración${mFlares.length > 1 ? 'es' : ''} Clase M`,
      description: 'Evento solar moderado. Posibles interferencias menores.',
      type: 'flare',
      data: mFlares[0]
    });
  }
  
  // Analizar CMEs
  const recentCMEs = currentData.cmes.filter(c => isRecent(c.activityID, 48));
  if (recentCMEs.length > 0) {
    const fastCMEs = recentCMEs.filter(c => {
      const speed = c.cmeAnalyses?.[0]?.speed;
      return speed && parseInt(speed) > 1000;
    });
    
    if (fastCMEs.length > 0) {
      alerts.push({
        severity: 'high',
        icon: '💫',
        title: 'CME rápida detectada',
        description: `Eyección de masa coronal a ${fastCMEs[0].cmeAnalyses[0].speed} km/s. Podría llegar a la Tierra en 1-3 días.`,
        type: 'cme',
        data: fastCMEs[0]
      });
    }
  }
  
  // Analizar tormentas geomagnéticas
  const activeStorms = currentData.gst.filter(g => isRecent(g.startTime, 24));
  if (activeStorms.length > 0) {
    const kpIndex = activeStorms[0].allKpIndex?.[0]?.kpIndex || 0;
    if (kpIndex >= 7) {
      alerts.push({
        severity: 'high',
        icon: '🌍',
        title: 'Tormenta Geomagnética Severa',
        description: `Índice Kp=${kpIndex}. Posibles auroras y efectos en redes eléctricas.`,
        type: 'storm',
        data: activeStorms[0]
      });
    } else if (kpIndex >= 5) {
      alerts.push({
        severity: 'medium',
        icon: '🌎',
        title: 'Tormenta Geomagnética Moderada',
        description: `Índice Kp=${kpIndex}. Auroras visibles en latitudes altas.`,
        type: 'storm',
        data: activeStorms[0]
      });
    }
  }
  
  // Analizar NEOs
  const closeNeos = currentData.neos.filter(neo => {
    const distance = parseFloat(neo.close_approach_data?.[0]?.miss_distance?.lunar);
    return distance && distance < 10; // Menos de 10 distancias lunares
  });
  
  if (closeNeos.length > 0) {
    const closest = closeNeos[0];
    const distance = parseFloat(closest.close_approach_data[0].miss_distance.lunar).toFixed(2);
    alerts.push({
      severity: 'low',
      icon: '🪐',
      title: 'Objeto cercano a la Tierra',
      description: `Asteroide ${closest.name} pasará a ${distance} distancias lunares.`,
      type: 'neo',
      data: closest
    });
  }
  
  // Si no hay alertas, mensaje positivo
  if (alerts.length === 0) {
    aiAlertsContainer.innerHTML = `
      <div class="ai-alert-card severity-low">
        <div class="ai-alert-title">
          ✅ Todo tranquilo
        </div>
        <div class="ai-alert-description">
          No hay eventos significativos en este momento. El clima espacial está tranquilo.
        </div>
      </div>
    `;
    updateAlertCount(0);
    return;
  }
  
  // Actualizar contador de alertas
  updateAlertCount(alerts.length);
  
  // Mostrar alertas
  aiAlertsContainer.innerHTML = alerts.map(alert => `
    <div class="ai-alert-card severity-${alert.severity}" data-type="${alert.type}">
      <div class="ai-alert-title">
        <span>${alert.icon}</span>
        <span>${alert.title}</span>
      </div>
      <div class="ai-alert-description">${alert.description}</div>
    </div>
  `).join('');
  
  // Añadir indicador de alerta al botón
  if (alerts.some(a => a.severity === 'high')) {
    aiButton?.classList.add('has-alert');
  }
  
  // Event listeners para alertas
  document.querySelectorAll('.ai-alert-card').forEach((card, index) => {
    card.addEventListener('click', () => {
      explainAlert(alerts[index]);
    });
  });
}

function isRecent(timestamp, hours) {
  if (!timestamp) return false;
  const time = new Date(timestamp).getTime();
  const now = Date.now();
  return (now - time) < (hours * 60 * 60 * 1000);
}

function explainAlert(alert) {
  let explanation = '';
  
  switch (alert.type) {
    case 'flare':
      explanation = `Las fulguraciones solares son explosiones en el Sol que liberan mucha energía. ` +
                   `Esta fulguración es clase ${alert.data.classType}, lo que significa que ${
                     alert.severity === 'high' 
                       ? 'es muy intensa y puede afectar las comunicaciones de radio en la Tierra' 
                       : 'tiene intensidad moderada y podría causar interferencias menores'
                   }. ` +
                   `Ocurrió en la región activa ${alert.data.activeRegionNum || 'desconocida'} del Sol.`;
      break;
      
    case 'cme':
      const speed = alert.data.cmeAnalyses?.[0]?.speed || 'desconocida';
      explanation = `Una Eyección de Masa Coronal (CME) es como una burbuja gigante de plasma que sale del Sol. ` +
                   `Esta CME viaja a ${speed} km/s. Para comparar, ¡eso es mucho más rápido que un avión! ` +
                   `Si viene hacia la Tierra, podría causar auroras hermosas pero también afectar satélites.`;
      break;
      
    case 'storm':
      const kp = alert.data.allKpIndex?.[0]?.kpIndex || 0;
      explanation = `Una tormenta geomagnética ocurre cuando el viento solar llega a la Tierra y altera nuestro campo magnético. ` +
                   `El índice Kp=${kp} nos dice qué tan fuerte es. ` +
                   `${kp >= 7 ? 'Con este nivel, podrías ver auroras incluso en latitudes medias!' : 'Con este nivel, las auroras son visibles en el norte.'}`;
      break;
      
    case 'neo':
      const distance = parseFloat(alert.data.close_approach_data[0].miss_distance.lunar).toFixed(2);
      const diameter = alert.data.estimated_diameter?.meters?.estimated_diameter_max || 0;
      explanation = `Un asteroide llamado ${alert.data.name} está pasando cerca de la Tierra. ` +
                   `"Cerca" significa ${distance} veces la distancia a la Luna (unos ${(distance * 384400).toFixed(0)} km). ` +
                   `Tiene aproximadamente ${diameter.toFixed(0)} metros de diámetro. ` +
                   `No hay peligro, ¡pero es emocionante verlo pasar!`;
      break;
  }
  
  addBotMessage(explanation);
}

// ========== MENSAJERÍA ==========

function sendMessage(predefinedQuestion = null) {
  const message = predefinedQuestion || aiInput.value.trim();
  
  if (!message) return;
  
  // Limpiar input
  if (!predefinedQuestion) {
    aiInput.value = '';
    aiInput.style.height = 'auto';
  }
  
  // Añadir mensaje del usuario
  addUserMessage(message);
  
  // Mostrar indicador de "escribiendo..."
  addThinkingIndicator();
  
  // Procesar pregunta
  setTimeout(() => {
    processQuestion(message);
  }, 500 + Math.random() * 1000);
}

function addUserMessage(text) {
  const messageEl = document.createElement('div');
  messageEl.className = 'ai-message ai-message-user';
  messageEl.innerHTML = `
    <div class="ai-message-avatar">👤</div>
    <div class="ai-message-bubble">
      <p>${escapeHtml(text)}</p>
    </div>
  `;
  aiMessages.appendChild(messageEl);
  scrollToBottom();
}

function addBotMessage(text) {
  // Remover indicador de "escribiendo..."
  const thinking = aiMessages.querySelector('.ai-message-thinking');
  if (thinking) thinking.remove();
  
  const messageEl = document.createElement('div');
  messageEl.className = 'ai-message ai-message-bot';
  messageEl.innerHTML = `
    <div class="ai-message-avatar">🤖</div>
    <div class="ai-message-bubble">
      ${formatBotMessage(text)}
    </div>
  `;
  aiMessages.appendChild(messageEl);
  scrollToBottom();
}

function addThinkingIndicator() {
  const thinking = document.createElement('div');
  thinking.className = 'ai-message ai-message-bot';
  thinking.innerHTML = `
    <div class="ai-message-avatar">🤖</div>
    <div class="ai-message-thinking">
      <span>Pensando</span>
      <div class="thinking-dots">
        <div class="thinking-dot"></div>
        <div class="thinking-dot"></div>
        <div class="thinking-dot"></div>
      </div>
    </div>
  `;
  aiMessages.appendChild(thinking);
  scrollToBottom();
}

// Alias para compatibilidad con la nueva función processQuestion
function showThinking() {
  addThinkingIndicator();
}

function hideThinking() {
  const thinking = aiMessages.querySelector('.ai-message-thinking');
  if (thinking) thinking.closest('.ai-message').remove();
}

function formatBotMessage(text) {
  // Detectar listas
  if (text.includes('\n-') || text.includes('\n•')) {
    const parts = text.split('\n');
    let html = '';
    let inList = false;
    
    parts.forEach(part => {
      if (part.trim().startsWith('-') || part.trim().startsWith('•')) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        html += `<li>${part.trim().substring(1).trim()}</li>`;
      } else {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        if (part.trim()) {
          html += `<p>${part}</p>`;
        }
      }
    });
    
    if (inList) html += '</ul>';
    return html;
  }
  
  // Texto normal con párrafos
  return text.split('\n\n').map(p => `<p>${p.trim()}</p>`).join('');
}

function scrollToBottom() {
  aiMessages.scrollTop = aiMessages.scrollHeight;
}

function showError(message) {
  addBotMessage(`⚠️ ${message}`);
}

// ========== PROCESAMIENTO DE PREGUNTAS CON IA REAL ==========

async function processQuestion(question) {
  try {
    showThinking();
    
    // Verificar si el backend tiene configurada la IA
    const healthCheck = await fetch(`${BACKEND_URL}/health`).catch(() => null);
    
    if (!healthCheck || !healthCheck.ok) {
      // Si el backend no responde, usar fallback
      hideThinking();
      processQuestionFallback(question);
      return;
    }

    const healthData = await healthCheck.json();
    
    if (!healthData.geminiConfigured) {
      // Si el backend no tiene configurada la API key, usar fallback
      hideThinking();
      processQuestionFallback(question);
      return;
    }

    // Preparar contexto con datos reales
    const context = {
      flares: currentData.flares.slice(0, 5),
      cmes: currentData.cmes.slice(0, 3),
      gst: currentData.gst.slice(0, 3),
      neos: currentData.neos.slice(0, 3)
    };

    // Llamar al backend
    const response = await fetch(`${BACKEND_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        context
      })
    });

    hideThinking();

    if (!response.ok) {
      throw new Error(`Backend Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.response) {
      addBotMessage(data.response);
    } else {
      throw new Error('No response from backend');
    }

  } catch (error) {
    console.error('Error calling AI backend:', error);
    hideThinking();
    addBotMessage('❌ Hubo un problema al conectar con el asistente. Usaré mi conocimiento básico...');
    // Fallback a respuestas predefinidas
    processQuestionFallback(question);
  }
}

// Fallback: Sistema de respuestas predefinidas (cuando no hay conexión al backend)
function processQuestionFallback(question) {
  // Validar que question sea un string
  if (typeof question !== 'string') {
    console.error('processQuestionFallback recibió un tipo inválido:', typeof question, question);
    addBotMessage('❌ Error al procesar la pregunta. Por favor, intenta de nuevo.');
    return;
  }
  
  const q = question.toLowerCase();
  
  // Detectar intención
  if (q.includes('qué es') && (q.includes('clima espacial') || q.includes('esto'))) {
    explainSpaceWeather();
  } else if (q.includes('fulguración') || q.includes('solar flare') || q.includes('flr')) {
    explainFlares();
  } else if (q.includes('cme') || q.includes('eyección') || q.includes('masa coronal')) {
    explainCMEs();
  } else if (q.includes('tormenta') || q.includes('geomagnética') || q.includes('gst')) {
    explainStorms();
  } else if (q.includes('asteroide') || q.includes('neo') || q.includes('cometa')) {
    explainNEOs();
  } else if (q.includes('peligro') || q.includes('riesgo') || q.includes('peligroso')) {
    assessDanger();
  } else if (q.includes('ahora') || q.includes('actual') || q.includes('hoy')) {
    summarizeCurrentEvents();
  } else if (q.includes('afecta') || q.includes('impacto') || q.includes('consecuencia')) {
    explainImpacts();
  } else {
    // Respuesta general
    generalResponse(question);
  }
}

function explainSpaceWeather() {
  addBotMessage(
    `🌟 <strong>¿Qué es el Clima Espacial?</strong>\n\n` +
    `El clima espacial son las condiciones que cambian en el espacio entre el Sol y la Tierra. ` +
    `Aunque el Sol está a 150 millones de kilómetros de distancia, ¡lo que pasa allí nos afecta aquí!\n\n` +
    `Los eventos principales son:\n\n` +
    `- ☀️ <strong>Fulguraciones Solares:</strong> Explosiones de energía en el Sol\n` +
    `- 💫 <strong>CMEs:</strong> Burbujas gigantes de plasma que salen del Sol\n` +
    `- 🌍 <strong>Tormentas Geomagnéticas:</strong> Cuando el viento solar sacude el campo magnético de la Tierra\n` +
    `- 🪐 <strong>Objetos Cercanos:</strong> Asteroides y cometas que pasan cerca de nosotros\n\n` +
    `¿Quieres saber más sobre alguno de estos eventos?`
  );
}

function explainFlares() {
  const recent = currentData.flares.slice(0, 3);
  let response = `☀️ <strong>Fulguraciones Solares</strong>\n\n` +
    `Las fulguraciones son como explosiones en la superficie del Sol. Liberan muchísima energía en pocos minutos, ` +
    `¡equivalente a millones de bombas atómicas!\n\n` +
    `Se clasifican por su intensidad:\n\n` +
    `- <strong>Clase C:</strong> Pequeñas, pocas consecuencias\n` +
    `- <strong>Clase M:</strong> Medianas, pueden causar apagones de radio menores\n` +
    `- <strong>Clase X:</strong> ¡Las más grandes! Pueden afectar satélites y comunicaciones\n\n`;
  
  if (recent.length > 0) {
    response += `<strong>Últimas fulguraciones detectadas:</strong>\n\n`;
    recent.forEach(f => {
      response += `- ${f.classType}: ${formatDate(f.beginTime)}\n`;
    });
  } else {
    response += `No hay fulguraciones recientes registradas.`;
  }
  
  addBotMessage(response);
}

function explainCMEs() {
  const recent = currentData.cmes.slice(0, 2);
  let response = `💫 <strong>Eyecciones de Masa Coronal (CMEs)</strong>\n\n` +
    `Las CMEs son burbujas enormes de plasma (gas super caliente) que salen disparadas del Sol. ` +
    `Pueden viajar a más de 3,000 km por segundo, ¡eso es casi el 1% de la velocidad de la luz!\n\n` +
    `Cuando una CME llega a la Tierra (tarda entre 1 y 3 días), puede:\n\n` +
    `- Crear auroras hermosas (luces del norte/sur)\n` +
    `- Afectar satélites en órbita\n` +
    `- Interrumpir las comunicaciones de radio\n` +
    `- En casos extremos, dañar redes eléctricas\n\n`;
  
  if (recent.length > 0) {
    response += `<strong>CMEs recientes:</strong>\n\n`;
    recent.forEach(c => {
      const speed = c.cmeAnalyses?.[0]?.speed || 'desconocida';
      response += `- Velocidad: ${speed} km/s, ${formatDate(c.activityID)}\n`;
    });
  } else {
    response += `No hay CMEs recientes registradas.`;
  }
  
  addBotMessage(response);
}

function explainStorms() {
  const recent = currentData.gst[0];
  let response = `🌍 <strong>Tormentas Geomagnéticas</strong>\n\n` +
    `Estas tormentas ocurren cuando el viento solar (partículas que vienen del Sol) choca con el campo magnético ` +
    `protector de la Tierra. Es como cuando el viento hace que una bandera se mueva mucho.\n\n` +
    `Usamos el índice Kp para medir su intensidad (de 0 a 9):\n\n` +
    `- <strong>Kp 0-4:</strong> Tranquilo, nada especial\n` +
    `- <strong>Kp 5-6:</strong> Tormentas menores, auroras en el norte\n` +
    `- <strong>Kp 7-9:</strong> ¡Tormentas severas! Auroras visibles en latitudes medias\n\n`;
  
  if (recent) {
    const kp = recent.allKpIndex?.[0]?.kpIndex || 'desconocido';
    response += `<strong>Última tormenta:</strong> Índice Kp=${kp}, ${formatDate(recent.startTime)}`;
  } else {
    response += `No hay tormentas geomagnéticas recientes.`;
  }
  
  addBotMessage(response);
}

function explainNEOs() {
  const close = currentData.neos.slice(0, 3);
  let response = `🪐 <strong>Objetos Cercanos a la Tierra (NEOs)</strong>\n\n` +
    `Los NEOs son asteroides o cometas cuyas órbitas los traen cerca de la Tierra. ` +
    `"Cerca" en términos espaciales significa a menos de 50 millones de kilómetros.\n\n` +
    `No te preocupes: la NASA monitorea todos los NEOs y conocemos sus órbitas con mucha precisión. ` +
    `Cuando decimos que un asteroide "pasa cerca", normalmente está a millones de kilómetros de distancia.\n\n`;
  
  if (close.length > 0) {
    response += `<strong>Objetos pasando hoy:</strong>\n\n`;
    close.forEach(neo => {
      const distance = parseFloat(neo.close_approach_data?.[0]?.miss_distance?.lunar || 0).toFixed(1);
      response += `- ${neo.name}: ${distance} distancias lunares de la Tierra\n`;
    });
  } else {
    response += `No hay objetos cercanos registrados hoy.`;
  }
  
  addBotMessage(response);
}

function assessDanger() {
  const xFlares = currentData.flares.filter(f => f.classType?.startsWith('X') && isRecent(f.beginTime, 48));
  const fastCMEs = currentData.cmes.filter(c => {
    const speed = parseInt(c.cmeAnalyses?.[0]?.speed || 0);
    return speed > 2000 && isRecent(c.activityID, 72);
  });
  const severeStorms = currentData.gst.filter(g => {
    const kp = g.allKpIndex?.[0]?.kpIndex || 0;
    return kp >= 7 && isRecent(g.startTime, 24);
  });
  
  let dangerLevel = 'bajo';
  let response = '';
  
  if (xFlares.length > 0 || fastCMEs.length > 0 || severeStorms.length > 0) {
    dangerLevel = 'moderado';
    response = `⚠️ <strong>Nivel de Alerta: Moderado</strong>\n\n` +
      `Hay eventos significativos ocurriendo, pero no representan un peligro directo para las personas en la Tierra. ` +
      `Nuestro campo magnético y atmósfera nos protegen muy bien.\n\n` +
      `<strong>Posibles efectos:</strong>\n\n` +
      `- Interferencias temporales en comunicaciones de radio\n` +
      `- Los astronautas en el espacio toman precauciones extra\n` +
      `- Satélites podrían necesitar ajustes\n` +
      `- ¡Auroras hermosas más al sur de lo normal!\n\n` +
      `Para la mayoría de las personas, estos eventos son invisibles. Los científicos y operadores de satélites ` +
      `son quienes necesitan prestar atención.`;
  } else {
    response = `✅ <strong>Nivel de Alerta: Bajo</strong>\n\n` +
      `El clima espacial está tranquilo en este momento. No hay eventos que representen ningún riesgo.\n\n` +
      `Recuerda: la Tierra tiene dos protecciones muy efectivas:\n\n` +
      `- <strong>Campo magnético:</strong> Desvía las partículas cargadas del Sol\n` +
      `- <strong>Atmósfera:</strong> Absorbe la radiación dañina\n\n` +
      `Incluso durante tormentas solares extremas, las personas en la superficie estamos completamente seguras. ` +
      `Los efectos son principalmente tecnológicos (satélites, comunicaciones, redes eléctricas).`;
  }
  
  addBotMessage(response);
}

function summarizeCurrentEvents() {
  const recentFlares = currentData.flares.filter(f => isRecent(f.beginTime, 24));
  const recentCMEs = currentData.cmes.filter(c => isRecent(c.activityID, 48));
  const activeStorms = currentData.gst.filter(g => isRecent(g.startTime, 24));
  const todayNeos = currentData.neos;
  
  let summary = `📊 <strong>Resumen del Clima Espacial Actual</strong>\n\n`;
  
  // Fulguraciones
  if (recentFlares.length > 0) {
    const xCount = recentFlares.filter(f => f.classType?.startsWith('X')).length;
    const mCount = recentFlares.filter(f => f.classType?.startsWith('M')).length;
    const cCount = recentFlares.filter(f => f.classType?.startsWith('C')).length;
    
    summary += `☀️ <strong>Fulguraciones (últimas 24h):</strong> ${recentFlares.length} total\n`;
    if (xCount > 0) summary += `   - ${xCount} Clase X (extremas)\n`;
    if (mCount > 0) summary += `   - ${mCount} Clase M (moderadas)\n`;
    if (cCount > 0) summary += `   - ${cCount} Clase C (menores)\n`;
    summary += `\n`;
  } else {
    summary += `☀️ <strong>Fulguraciones:</strong> Ninguna en las últimas 24 horas\n\n`;
  }
  
  // CMEs
  if (recentCMEs.length > 0) {
    summary += `💫 <strong>CMEs (últimas 48h):</strong> ${recentCMEs.length} detectadas\n\n`;
  } else {
    summary += `💫 <strong>CMEs:</strong> Ninguna en las últimas 48 horas\n\n`;
  }
  
  // Tormentas
  if (activeStorms.length > 0) {
    const kp = activeStorms[0].allKpIndex?.[0]?.kpIndex || 0;
    summary += `🌍 <strong>Tormentas Geomagnéticas:</strong> Activa (Kp=${kp})\n\n`;
  } else {
    summary += `🌍 <strong>Tormentas Geomagnéticas:</strong> Ninguna activa\n\n`;
  }
  
  // NEOs
  if (todayNeos.length > 0) {
    summary += `🪐 <strong>Objetos Cercanos:</strong> ${todayNeos.length} asteroides pasando hoy\n\n`;
  } else {
    summary += `🪐 <strong>Objetos Cercanos:</strong> Ninguno hoy\n\n`;
  }
  
  // Conclusión
  if (recentFlares.length === 0 && recentCMEs.length === 0 && activeStorms.length === 0) {
    summary += `<strong>Conclusión:</strong> El clima espacial está tranquilo. ¡Todo normal! 🌟`;
  } else {
    summary += `<strong>Conclusión:</strong> Hay actividad espacial, pero todo bajo control. 👍`;
  }
  
  addBotMessage(summary);
}

function explainImpacts() {
  addBotMessage(
    `🌍 <strong>¿Cómo nos afecta el Clima Espacial?</strong>\n\n` +
    `El clima espacial puede afectar diferentes aspectos de nuestra vida tecnológica:\n\n` +
    `<strong>Para astronautas:</strong>\n` +
    `- Deben refugiarse durante fulguraciones grandes\n` +
    `- La radiación puede ser peligrosa fuera del escudo terrestre\n\n` +
    `<strong>Para aviones:</strong>\n` +
    `- Los pilotos de vuelos polares reciben más radiación\n` +
    `- Comunicaciones por radio pueden fallar\n\n` +
    `<strong>Para satélites:</strong>\n` +
    `- Pueden sufrir daños electrónicos\n` +
    `- El GPS puede volverse menos preciso\n\n` +
    `<strong>Para redes eléctricas:</strong>\n` +
    `- Tormentas extremas pueden causar apagones\n` +
    `- Los transformadores pueden sobrecargarse\n\n` +
    `<strong>Para ti y para mí:</strong>\n` +
    `- ¡Podemos ver auroras hermosas!\n` +
    `- La internet satelital puede ser más lenta\n` +
    `- En general, los efectos son mínimos 😊`
  );
}

function generalResponse(question) {
  addBotMessage(
    `Interesante pregunta. Te puedo ayudar con información sobre:\n\n` +
    `- Fulguraciones solares y su intensidad\n` +
    `- Eyecciones de masa coronal (CMEs)\n` +
    `- Tormentas geomagnéticas\n` +
    `- Asteroides y objetos cercanos\n` +
    `- Los eventos que están ocurriendo ahora\n` +
    `- Si hay algún peligro actual\n\n` +
    `¿Sobre qué te gustaría saber más?`
  );
}

// ========== UTILIDADES ==========

function formatDate(isoString) {
  if (!isoString) return 'Fecha desconocida';
  const date = new Date(isoString);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Exportar para uso en main.js
export { loadDataAndAnalyze };
