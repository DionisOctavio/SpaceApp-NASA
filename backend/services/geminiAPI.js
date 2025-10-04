// services/aiService.js
// Servicio para interactuar con Cohere API (100% GRATIS con API key gratuita)

import https from 'https';

// Cohere API - GRATIS con API key gratuita
// Crea tu API key gratis en: https://dashboard.cohere.com/api-keys
const COHERE_API_KEY = process.env.COHERE_API_KEY || 'tu_api_key_aqui';
const COHERE_API_URL = 'https://api.cohere.ai/v1/chat';

/**
 * Helper para hacer requests HTTPS
 */
function httpsRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

/**
 * Llama a Cohere para generar respuestas (100% GRATIS con API key)
 */
async function generateWithCohere(prompt) {
  const requestBody = JSON.stringify({
    message: prompt,
    temperature: 0.7,
    max_tokens: 500
  });

  const data = await httpsRequest(COHERE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${COHERE_API_KEY}`
    }
  }, requestBody);

  if (data.text) {
    return data.text.trim();
  } else if (data.message) {
    throw new Error(`Cohere Error: ${data.message}`);
  } else {
    throw new Error('Respuesta inesperada de Cohere');
  }
}

/**
 * Llama a la API de IA para generar respuestas educativas
 * @param {string} question - Pregunta del usuario
 * @param {object} context - Contexto con datos de clima espacial
 * @returns {Promise<string>} - Respuesta generada por la IA
 */
export async function generateEducationalResponse(question, context) {
  const prompt = buildEducationalPrompt(question, context);

  try {
    console.log('🚀 Generando respuesta con Cohere (100% gratis)...');
    const response = await generateWithCohere(prompt);
    console.log('✅ Respuesta generada exitosamente con Cohere');
    return response;
  } catch (error) {
    console.error('❌ Error con Cohere:', error.message);
    console.log('💡 Crea tu API key gratis en: https://dashboard.cohere.com/api-keys');
    
    // Fallback a respuesta predefinida si falla
    return generateFallbackResponse(question);
  }
}

/**
 * Respuesta de fallback si la IA no está disponible
 */
function generateFallbackResponse(question) {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('cme') || lowerQuestion.includes('eyección') || lowerQuestion.includes('coronal')) {
    return 'Las Eyecciones de Masa Coronal (CME) son explosiones masivas de plasma solar que pueden afectar la magnetosfera terrestre, causando tormentas geomagnéticas y auroras.';
  } else if (lowerQuestion.includes('llamarada') || lowerQuestion.includes('flare') || lowerQuestion.includes('solar')) {
    return 'Las llamaradas solares son explosiones intensas de radiación electromagnética en la atmósfera del Sol, clasificadas de la clase A (menor) a X (mayor).';
  } else if (lowerQuestion.includes('asteroide') || lowerQuestion.includes('neo')) {
    return 'Los Objetos Cercanos a la Tierra (NEO) son asteroides y cometas cuyas órbitas los acercan a nuestro planeta. NASA los monitorea constantemente para prevenir impactos.';
  } else if (lowerQuestion.includes('tormenta') || lowerQuestion.includes('geomagnética')) {
    return 'Las tormentas geomagnéticas son perturbaciones en el campo magnético terrestre causadas por el viento solar y CMEs, clasificadas en escala G1 a G5.';
  } else {
    return 'El clima espacial incluye varios fenómenos como llamaradas solares, eyecciones de masa coronal, tormentas geomagnéticas y radiación solar. Estos eventos pueden afectar satélites, comunicaciones y redes eléctricas en la Tierra.';
  }
}

/**
 * Construye el prompt educativo con contexto de datos reales
 * @param {string} question - Pregunta del usuario
 * @param {object} context - Datos de clima espacial
 * @returns {string} - Prompt formateado
 */
function buildEducationalPrompt(question, context) {
  let dataContext = '';

  // Formatear fulguraciones
  if (context.flares && context.flares.length > 0) {
    dataContext += '\n📊 FULGURACIONES SOLARES RECIENTES:\n';
    context.flares.slice(0, 5).forEach(f => {
      dataContext += `- Clase ${f.classType}, Fecha: ${f.beginTime}\n`;
    });
  }

  // Formatear CMEs
  if (context.cmes && context.cmes.length > 0) {
    dataContext += '\n📊 EYECCIONES DE MASA CORONAL (CMEs) RECIENTES:\n';
    context.cmes.slice(0, 3).forEach(c => {
      const speed = c.cmeAnalyses?.[0]?.speed || 'desconocida';
      dataContext += `- Velocidad: ${speed} km/s, Fecha: ${c.activityID}\n`;
    });
  }

  // Formatear tormentas geomagnéticas
  if (context.gst && context.gst.length > 0) {
    dataContext += '\n📊 TORMENTAS GEOMAGNÉTICAS RECIENTES:\n';
    context.gst.slice(0, 3).forEach(s => {
      const kp = s.allKpIndex?.[0]?.kpIndex || 'desconocido';
      dataContext += `- Índice Kp: ${kp}, Fecha: ${s.startTime}\n`;
    });
  }

  // Formatear asteroides
  if (context.neos && context.neos.length > 0) {
    dataContext += '\n📊 ASTEROIDES CERCANOS HOY:\n';
    context.neos.slice(0, 3).forEach(neo => {
      const distance = neo.close_approach_data?.[0]?.miss_distance?.lunar;
      dataContext += `- ${neo.name}, Distancia: ${distance ? parseFloat(distance).toFixed(2) : 'desconocida'} distancias lunares\n`;
    });
  }

  if (!dataContext) {
    dataContext = '\n📊 No hay eventos significativos de clima espacial en este momento.\n';
  }

  return `Eres un asistente educativo sobre clima espacial para niños y público general. Tu objetivo es explicar conceptos complejos de manera simple, amigable y accesible.

CONTEXTO DE DATOS REALES DE NASA:
${dataContext}

INSTRUCCIONES IMPORTANTES:
- Usa un lenguaje simple y amigable, como si hablaras con un niño de 10 años
- Incluye emojis relevantes (☀️, 🌍, 💫, 🪐, ⚡, 🌟, 😊)
- Haz comparaciones con cosas cotidianas (velocidad de un avión, distancia de tu casa a la escuela, etc.)
- Explica el impacto en la vida real (GPS, comunicaciones, satélites, auroras)
- Sé breve pero completo (máximo 300 palabras)
- Si hay datos actuales en el contexto, menciόnalos y explícalos
- Si hay alertas activas, explica su importancia de forma que no asuste pero informe
- Usa un tono positivo y entusiasta
- Si no hay datos sobre lo que pregunta, explica el concepto general de forma educativa

PREGUNTA DEL USUARIO: ${question}

Responde de forma educativa, basándote en los datos reales proporcionados:`;
}

// No usar module.exports, ya se usa export en la función
