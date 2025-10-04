import { Router } from 'express';
import { getNeoFeed, getNeoToday, getNeoLookup } from '../services/nasaAPI.js';

const cache = new Map();
const setCache = (k,v,ttl=60000)=>cache.set(k,{v,exp:Date.now()+ttl});
const getCache = (k)=>{const e=cache.get(k); if(!e) return null; if(Date.now()>e.exp){cache.delete(k); return null;} return e.v;};

const router = Router();

router.get('/feed', async (req, res, next) => {
  try {
    const key = req.originalUrl; const hit = getCache(key); if (hit) return res.json(hit);
    const { start_date, end_date } = req.query;
    const out = await getNeoFeed({ startDate: start_date, endDate: end_date });
    setCache(key, out, 60_000);
    res.json(out);
  } catch (e) { next(e); }
});

router.get('/today', async (req, res, next) => {
  try { const key=req.originalUrl; const hit=getCache(key); if(hit) return res.json(hit);
    const out = await getNeoToday();
    setCache(key,out,30_000); res.json(out);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try { const key=req.originalUrl; const hit=getCache(key); if(hit) return res.json(hit);
    const out = await getNeoLookup(req.params.id);
    setCache(key,out,10*60_000); res.json(out);
  } catch (e) { next(e); }
});

export default router;
