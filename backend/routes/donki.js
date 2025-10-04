import { Router } from 'express';
import { getFlares, getCMEs, getGeomagneticStorms, getHSS, getIPS, getRBE, getSEP, getWSAEnlil } from '../services/nasaAPI.js';

// Cache simple en memoria por ruta
const cache = new Map();
const setCache = (k,v,ttl=60000)=>cache.set(k,{v,exp:Date.now()+ttl});
const getCache = (k)=>{const e=cache.get(k); if(!e) return null; if(Date.now()>e.exp){cache.delete(k); return null;} return e.v;};

const router = Router();

router.get('/flares', async (req, res, next) => {
  try {
    const key = req.originalUrl;
    const hit = getCache(key); if (hit) return res.json(hit);
    const out = await getFlares({ days: Number(req.query.days)||2 });
    setCache(key, out, 30_000);
    res.json(out);
  } catch (e) { next(e); }
});

router.get('/flares-range', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });
    const key = req.originalUrl;
    const hit = getCache(key); if (hit) return res.json(hit);
    const out = await getFlares({ startDate, endDate });
    setCache(key, out, 30_000);
    res.json(out);
  } catch (e) { next(e); }
});

router.get('/cmes', async (req, res, next) => {
  try {
    const key = req.originalUrl;
    const hit = getCache(key); if (hit) return res.json(hit);
    const out = await getCMEs({ days: Number(req.query.days)||3 });
    setCache(key, out, 30_000);
    res.json(out);
  } catch (e) { next(e); }
});

router.get('/gst', async (req, res, next) => {
  try {
    const key = req.originalUrl;
    const hit = getCache(key); if (hit) return res.json(hit);
    const out = await getGeomagneticStorms({ days: Number(req.query.days)||5 });
    setCache(key, out, 60_000);
    res.json(out);
  } catch (e) { next(e); }
});

router.get('/hss', async (req, res, next) => {
  try { const key=req.originalUrl; const hit=getCache(key); if(hit) return res.json(hit);
    const out = await getHSS({ days: Number(req.query.days)||5 });
    setCache(key,out,60_000); res.json(out);
  } catch (e) { next(e); }
});

router.get('/ips', async (req, res, next) => {
  try { const key=req.originalUrl; const hit=getCache(key); if(hit) return res.json(hit);
    const out = await getIPS({ days: Number(req.query.days)||5 });
    setCache(key,out,60_000); res.json(out);
  } catch (e) { next(e); }
});

router.get('/rbe', async (req, res, next) => {
  try { const key=req.originalUrl; const hit=getCache(key); if(hit) return res.json(hit);
    const out = await getRBE({ days: Number(req.query.days)||5 });
    setCache(key,out,60_000); res.json(out);
  } catch (e) { next(e); }
});

router.get('/sep', async (req, res, next) => {
  try { const key=req.originalUrl; const hit=getCache(key); if(hit) return res.json(hit);
    const out = await getSEP({ days: Number(req.query.days)||5 });
    setCache(key,out,60_000); res.json(out);
  } catch (e) { next(e); }
});

router.get('/wsa-enlil', async (req, res, next) => {
  try { const key=req.originalUrl; const hit=getCache(key); if(hit) return res.json(hit);
    const out = await getWSAEnlil({ days: Number(req.query.days)||7 });
    setCache(key,out,60_000); res.json(out);
  } catch (e) { next(e); }
});

router.get('/cme-analysis', async (req, res, next) => {
  try {
    const { startDate, endDate, mostAccurateOnly, speed, halfAngle, catalog } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });
    const key = req.originalUrl; const hit = getCache(key); if (hit) return res.json(hit);
    const out = await getCMEAnalysis({ startDate, endDate, mostAccurateOnly: mostAccurateOnly === 'true', speed, halfAngle, catalog });
    setCache(key, out, 60_000);
    res.json(out);
  } catch (e) { next(e); }
});

router.get('/notifications', async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });
    const key = req.originalUrl; const hit = getCache(key); if (hit) return res.json(hit);
    const out = await getNotifications({ startDate, endDate, type: type || 'all' });
    setCache(key, out, 60_000);
    res.json(out);
  } catch (e) { next(e); }
});

router.get('/mpc', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });
    const key = req.originalUrl; const hit = getCache(key); if (hit) return res.json(hit);
    const out = await getMPC({ startDate, endDate });
    setCache(key, out, 60_000);
    res.json(out);
  } catch (e) { next(e); }
});

export default router;
