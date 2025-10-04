// backend/routes/apod.js
import { Router } from 'express';
import { getAPOD } from '../services/nasaAPI.js';

// Cache simple en memoria
const cache = new Map();
const setCache = (k, v, ttl = 30 * 60_000) => cache.set(k, { v, exp: Date.now() + ttl });
const getCache = (k) => {
  const e = cache.get(k);
  if (!e) return null;
  if (Date.now() > e.exp) { cache.delete(k); return null; }
  return e.v;
};

const router = Router();

/**
 * GET /api/apod
 * Query:
 *  - date: YYYY-MM-DD (opcional; por defecto hoy UTC)
 *  - hd:   true|false (opcional; por defecto false)
 * 
 * Devuelve el objeto APOD tal cual de NASA (si es vídeo trae thumbs).
 */
router.get('/', async (req, res, next) => {
  try {
    const { date, hd } = req.query;
    const useHd = String(hd).toLowerCase() === 'true';

    // cache key por fecha + hd
    const key = `apod:${date || 'default'}:${useHd}`;
    const hit = getCache(key);
    if (hit) return res.json(hit);

    let data;
    try {
      data = await getAPOD({ date, hd: useHd });
    } catch (e) {
      // Si falla, intentar con fecha conocida que tiene imagen (2024-09-30 - Andrómeda)
      if (e.status === 404 || e.status === 400) {
        data = await getAPOD({ date: '2024-09-30', hd: useHd });
      } else {
        throw e;
      }
    }
    
    setCache(key, data, 30 * 60_000); // 30 min
    res.json(data);
  } catch (e) {
    // Si NASA devuelve 404 por una fecha no válida, propagamos 404 claro
    if (e.status === 404) {
      return res.status(404).json({ error: 'APOD not found for the requested date' });
    }
    next(e);
  }
});

export default router;
