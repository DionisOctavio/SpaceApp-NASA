// ========================================
// CONFIGURACIÓN DE IA - EJEMPLO
// ========================================
// Copia este archivo y renómbralo a: ai-config.js
// Luego, descomenta y configura tu API key
// ========================================

// OPCIÓN 1: Google Gemini (RECOMENDADO - GRATIS)
// Obtén tu API key en: https://aistudio.google.com/app/apikey
export const AI_CONFIG = {
  provider: 'gemini', // 'gemini' o 'openai'
  apiKey: 'TU_API_KEY_AQUI', // Reemplaza con tu key
  
  // Configuración de Gemini
  gemini: {
    model: 'gemini-1.5-flash',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    temperature: 0.7,
    maxTokens: 500
  },
  
  // OPCIÓN 2: OpenAI ChatGPT (REQUIERE PAGO)
  // Obtén tu API key en: https://platform.openai.com/api-keys
  openai: {
    model: 'gpt-3.5-turbo',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    temperature: 0.7,
    maxTokens: 500
  }
};

// ========================================
// INSTRUCCIONES RÁPIDAS:
// ========================================
// 1. Ve a: https://aistudio.google.com/app/apikey
// 2. Crea tu API key (GRATIS, sin tarjeta)
// 3. Reemplaza 'TU_API_KEY_AQUI' arriba
// 4. Guarda el archivo
// 5. Recarga la página
// 6. ¡El asistente usará IA real! 🎉
// ========================================
