import { Router } from 'express';
import { 
  getFlares, getCMEs, getGeomagneticStorms, getHSS, 
  getIPS, getRBE, getSEP 
} from '../services/nasaAPI.js';

const router = Router();

// Cache para analytics
const cache = new Map();
const setCache = (k, v, ttl = 300000) => cache.set(k, { v, exp: Date.now() + ttl }); // 5 min default
const getCache = (k) => {
  const e = cache.get(k); 
  if (!e) return null; 
  if (Date.now() > e.exp) { cache.delete(k); return null; } 
  return e.v;
};

// Helpers
function normalizeEventType(t) {
  if (!t) return '';
  const s = String(t).toLowerCase();
  const map = {
    flare: 'flares',
    flares: 'flares',
    cme: 'cmes',
    cmes: 'cmes',
    gst: 'geomagneticstorms',
    geomagneticstorm: 'geomagneticstorms',
    geomagneticstorms: 'geomagneticstorms',
    'geomagnetic-storms': 'geomagneticstorms',
    hss: 'hss',
    ips: 'ips',
    rbe: 'rbe',
    sep: 'sep',
  };
  return map[s] || s;
}

function toValidDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d) ? null : d;
}

function extractEventDate(ev) {
  const candidates = [
    ev.eventTime,
    ev.beginTime,
    ev.peakTime,
    ev.endTime,
    ev.startTime,
    ev.time,
    ev.date,
  ];
  for (const c of candidates) {
    const d = toValidDate(c);
    if (d) return d;
  }
  return null;
}

// Función para procesar datos de DONKI y generar estadísticas
function analyzeEvents(events, eventType) {
  if (!Array.isArray(events) || events.length === 0) {
    return {
      eventType,
      total: 0,
      timeRange: null,
      statistics: {}
    };
  }

  const analysis = {
    eventType,
    total: events.length,
    timeRange: {
      start: null,
      end: null
    },
    statistics: {},
    events: events
  };

  const dates = events
    .map(extractEventDate)
    .filter(d => d && !isNaN(d));

  if (dates.length > 0) {
    const minMs = Math.min(...dates.map(d => d.getTime()));
    const maxMs = Math.max(...dates.map(d => d.getTime()));
    if (isFinite(minMs) && isFinite(maxMs)) {
      analysis.timeRange.start = new Date(minMs).toISOString();
      analysis.timeRange.end = new Date(maxMs).toISOString();
    } else {
      analysis.timeRange = null;
    }
  }

  // Análisis específico por tipo de evento
  switch (eventType.toLowerCase()) {
    case 'flares':
      analysis.statistics = analyzeFlares(events);
      break;
    case 'cmes':
      analysis.statistics = analyzeCMEs(events);
      break;
    case 'geomagneticstorms':
      analysis.statistics = analyzeGeomagneticStorms(events);
      break;
    case 'hss':
      analysis.statistics = analyzeHSS(events);
      break;
    case 'ips':
      analysis.statistics = analyzeIPS(events);
      break;
    case 'rbe':
      analysis.statistics = analyzeRBE(events);
      break;
    case 'sep':
      analysis.statistics = analyzeSEP(events);
      break;
  }

  return analysis;
}

function analyzeFlares(flares) {
  const classCounts = {};
  const intensityDistribution = { low: 0, medium: 0, high: 0 };

  flares.forEach(flare => {
    if (flare.classType) {
      const classKey = flare.classType.charAt(0);
      classCounts[classKey] = (classCounts[classKey] || 0) + 1;
      
      if (classKey === 'C') intensityDistribution.low++;
      else if (classKey === 'M') intensityDistribution.medium++;
      else if (classKey === 'X') intensityDistribution.high++;
    }
  });

  return {
    classCounts,
    intensityDistribution,
    averagePerDay: flares.length / 7,
    mostCommonClass: Object.keys(classCounts).reduce((a, b) => 
      classCounts[a] > classCounts[b] ? a : b, Object.keys(classCounts)[0]
    )
  };
}

function analyzeCMEs(cmes) {
  const speeds = [];
  const catalogs = {};

  cmes.forEach(cme => {
    if (cme.cmeAnalyses && cme.cmeAnalyses[0]?.speed) {
      speeds.push(cme.cmeAnalyses[0].speed);
    }
    if (cme.catalog) {
      catalogs[cme.catalog] = (catalogs[cme.catalog] || 0) + 1;
    }
  });

  return {
    catalogCounts: catalogs,
    speedStatistics: speeds.length > 0 ? {
      average: speeds.reduce((a, b) => a + b, 0) / speeds.length,
      min: Math.min(...speeds),
      max: Math.max(...speeds),
      total: speeds.length
    } : null,
    averagePerDay: cmes.length / 7
  };
}

function analyzeGeomagneticStorms(storms) {
  const kpIndices = [];

  storms.forEach(storm => {
    if (storm.allKpIndex) {
      storm.allKpIndex.forEach(kp => {
        if (kp.kpIndex !== null) {
          kpIndices.push(kp.kpIndex);
        }
      });
    }
  });

  return {
    kpStatistics: kpIndices.length > 0 ? {
      average: kpIndices.reduce((a, b) => a + b, 0) / kpIndices.length,
      min: Math.min(...kpIndices),
      max: Math.max(...kpIndices),
      total: kpIndices.length
    } : null,
    stormIntensity: {
      minor: kpIndices.filter(kp => kp >= 5 && kp < 6).length,
      moderate: kpIndices.filter(kp => kp >= 6 && kp < 7).length,
      strong: kpIndices.filter(kp => kp >= 7 && kp < 8).length,
      severe: kpIndices.filter(kp => kp >= 8 && kp < 9).length,
      extreme: kpIndices.filter(kp => kp >= 9).length
    },
    averagePerDay: storms.length / 7
  };
}

function analyzeHSS(hss) {
  return { total: hss.length, averagePerDay: hss.length / 7 };
}

function analyzeIPS(ips) {
  return { total: ips.length, averagePerDay: ips.length / 7 };
}

function analyzeRBE(rbe) {
  return { total: rbe.length, averagePerDay: rbe.length / 7 };
}

function analyzeSEP(sep) {
  return { total: sep.length, averagePerDay: sep.length / 7 };
}

// Endpoint principal para analytics de DONKI
router.get('/overview', async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const cacheKey = `analytics_overview_${days}`;
    const hit = getCache(cacheKey);
    if (hit) return res.json(hit);

    const [
      flares,
      cmes,
      geomagneticStorms,
      hss,
      ips,
      rbe,
      sep
    ] = await Promise.allSettled([
      getFlares({ days: Number(days) }),
      getCMEs({ days: Number(days) }),
      getGeomagneticStorms({ days: Number(days) }),
      getHSS({ days: Number(days) }),
      getIPS({ days: Number(days) }),
      getRBE({ days: Number(days) }),
      getSEP({ days: Number(days) })
    ]);

    const analytics = {
      timeRange: {
        days: Number(days),
        generated: new Date().toISOString()
      },
      events: {},
      summary: {
        totalEvents: 0,
        mostActiveType: null,
        activityLevel: 'low'
      }
    };

    if (flares.status === 'fulfilled') {
      analytics.events.flares = analyzeEvents(flares.value, 'flares');
      analytics.summary.totalEvents += analytics.events.flares.total;
    }

    if (cmes.status === 'fulfilled') {
      analytics.events.cmes = analyzeEvents(cmes.value, 'cmes');
      analytics.summary.totalEvents += analytics.events.cmes.total;
    }

    if (geomagneticStorms.status === 'fulfilled') {
      analytics.events.geomagneticStorms = analyzeEvents(geomagneticStorms.value, 'geomagneticStorms');
      analytics.summary.totalEvents += analytics.events.geomagneticStorms.total;
    }

    if (hss.status === 'fulfilled') {
      analytics.events.hss = analyzeEvents(hss.value, 'hss');
      analytics.summary.totalEvents += analytics.events.hss.total;
    }

    if (ips.status === 'fulfilled') {
      analytics.events.ips = analyzeEvents(ips.value, 'ips');
      analytics.summary.totalEvents += analytics.events.ips.total;
    }

    if (rbe.status === 'fulfilled') {
      analytics.events.rbe = analyzeEvents(rbe.value, 'rbe');
      analytics.summary.totalEvents += analytics.events.rbe.total;
    }

    if (sep.status === 'fulfilled') {
      analytics.events.sep = analyzeEvents(sep.value, 'sep');
      analytics.summary.totalEvents += analytics.events.sep.total;
    }

    let maxEvents = 0;
    Object.entries(analytics.events).forEach(([type, data]) => {
      if (data.total > maxEvents) {
        maxEvents = data.total;
        analytics.summary.mostActiveType = type;
      }
    });

    const dailyAverage = analytics.summary.totalEvents / Number(days);
    if (dailyAverage > 10) analytics.summary.activityLevel = 'high';
    else if (dailyAverage > 5) analytics.summary.activityLevel = 'medium';
    else analytics.summary.activityLevel = 'low';

    setCache(cacheKey, analytics, 300000);
    res.json(analytics);
  } catch (e) {
    res.status(500).json({ error: 'Analytics overview failed', message: e.message });
  }
});

// Endpoint para datos de gráfico específico
router.get('/chart-data/:eventType', async (req, res, next) => {
  try {
    const { eventType } = req.params;
    const { days = 7 } = req.query;
    const canonical = normalizeEventType(eventType);
    
    const cacheKey = `chart_${canonical}_${days}`;
    const hit = getCache(cacheKey);
    if (hit) return res.json(hit);

    let data;

    switch (canonical) {
      case 'flares':
        data = await getFlares({ days: Number(days) });
        break;
      case 'cmes':
        data = await getCMEs({ days: Number(days) });
        break;
      case 'geomagneticstorms':
        data = await getGeomagneticStorms({ days: Number(days) });
        break;
      case 'hss':
        data = await getHSS({ days: Number(days) });
        break;
      case 'ips':
        data = await getIPS({ days: Number(days) });
        break;
      case 'rbe':
        data = await getRBE({ days: Number(days) });
        break;
      case 'sep':
        data = await getSEP({ days: Number(days) });
        break;
      default:
        return res.status(400).json({ error: `Unknown event type: ${eventType}` });
    }

    const analysis = analyzeEvents(data, canonical);

    setCache(cacheKey, analysis, 180000);
    res.json(analysis);
  } catch (e) {
    res.status(500).json({ error: 'Chart data failed', message: e.message });
  }
});

export default router;
