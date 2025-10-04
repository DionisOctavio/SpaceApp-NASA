// backend/routes/feed.js
import { Router } from 'express';
import { getFlares, getCMEs, getGeomagneticStorms, getNeoToday, getAPOD } from '../services/nasaAPI.js';

const router = Router();
const cache = new Map();
const setCache = (k,v,ttl=30000)=>cache.set(k,{v,exp:Date.now()+ttl});
const getCache = (k)=>{const e=cache.get(k); if(!e) return null; if(Date.now()>e.exp){cache.delete(k); return null;} return e.v;};

function toItem(type, time, title, payload) {
  return { type, time, title, payload };
}

router.get('/', async (req, res, next) => {
  try {
    const key = req.originalUrl;
    const hit = getCache(key); if (hit) return res.json(hit);

    const results = await Promise.allSettled([
      getFlares({ days: Number(req.query.flares_days)||2 }),
      getCMEs({ days: Number(req.query.cmes_days)||3 }),
      getGeomagneticStorms({ days: Number(req.query.gst_days)||5 }),
      getNeoToday(),
      getAPOD({})
    ]);

    const [flaresR, cmesR, gstR, neoTodayR, apodR] = results;

    const flares   = flaresR.status === 'fulfilled' ? flaresR.value : [];
    const cmes     = cmesR.status   === 'fulfilled' ? cmesR.value   : [];
    const gst      = gstR.status    === 'fulfilled' ? gstR.value    : [];
    const neoToday = neoTodayR.status=== 'fulfilled' ? neoTodayR.value: { near_earth_objects: {} };
    const apod     = apodR.status   === 'fulfilled' ? apodR.value   : null;

    const neoObjs = Object.values(neoToday.near_earth_objects || {}).flat();

    const items = [
      ...(apod ? [toItem('APOD', apod.date, `APOD: ${apod.title}`, apod)] : []),
      ...flares.map(f => toItem('FLR', f.beginTime || f.peakTime || f.endTime, `Fulguración ${f.classType||''}`, f)),
      ...cmes.map(c => toItem('CME', c.startTime, 'Eyección de masa coronal (CME)', c)),
      ...gst.map(g => toItem('GST', g.startTime, 'Tormenta geomagnética', g)),
      ...neoObjs.map(o => {
        const a = o.close_approach_data?.[0];
        const when = a?.close_approach_date_full || a?.close_approach_date;
        return toItem('NEO', when, `Asteroide ${o.name}`, o);
      }),
    ].filter(it => !!it.time);

    items.sort((a,b) => new Date(b.time) - new Date(a.time));

    setCache(key, items, 30_000);
    res.json(items);
  } catch (e) {
    // Nunca propagues 404 de NASA al feed; responde lista vacía si falla todo
    if (e.status === 404) return res.json([]);
    next(e);
  }
});

export default router;
