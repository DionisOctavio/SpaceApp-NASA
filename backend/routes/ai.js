// routes/ai.js
// Ruta para el asistente de IA educativo

import express from 'express';
import * as geminiAPI from '../services/geminiAPI.js';

const router = express.Router();

/**
 * POST /api/ai/ask
 * Endpoint para hacer preguntas al asistente de IA
 * Body: { question, context }
 */
router.post('/ask', async (req, res) => {
  try {
    const { question, context } = req.body;

    // Validar datos de entrada
    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        error: 'La pregunta es requerida y debe ser un string'
      });
    }

    if (!context || typeof context !== 'object') {
      return res.status(400).json({
        error: 'El contexto es requerido y debe ser un objeto'
      });
    }

    // Llamar al servicio de Gemini
    const response = await geminiAPI.generateEducationalResponse(question, context);

    res.json({
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en /api/ai/ask:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error al procesar la pregunta',
      message: error.message
    });
  }
});

/**
 * GET /api/ai/health
 * Endpoint para verificar el estado de la API de Cohere
 */
router.get('/health', (req, res) => {
  const hasApiKey = !!process.env.COHERE_API_KEY;
  
  res.json({
    success: true,
    geminiConfigured: hasApiKey, // Mantener nombre por compatibilidad con frontend
    cohereConfigured: hasApiKey,
    message: hasApiKey 
      ? 'API de Cohere está configurada y lista para usar' 
      : 'API de Cohere NO está configurada. Configura COHERE_API_KEY en .env'
  });
});

export default router;
