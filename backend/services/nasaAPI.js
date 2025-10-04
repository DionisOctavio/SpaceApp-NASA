import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { fetchWithRetry } from '../utils/fetchWithRetry.js';

dayjs.extend(utc);

const KEY = process.env.NASA_KEY || 'DEMO_KEY';
const NASA_BASE = 'https://api.nasa.gov';
const DONKI = `${NASA_BASE}/DONKI`;
const NEO   = `${NASA_BASE}/neo/rest/v1`;

const fmt = (d = new Date()) => dayjs(d).utc().format('YYYY-MM-DD');

async function getJSON(url, params = {}) {
  const res = await fetchWithRetry(url, { params: { api_key: KEY, ...params } });
  return res.json();
}

// ---------- DONKI ----------
export async function getFlares({ days = 2, startDate, endDate } = {}) {
  // Si se pasan fechas explícitas, usarlas; si no, calcular desde days
  const end = endDate || fmt();
  const start = startDate || fmt(dayjs(end).subtract(days, 'day'));
  return getJSON(`${DONKI}/FLR`, { startDate: start, endDate: end });
}
export async function getCMEs({ days = 3 } = {}) {
  const endDate = fmt();
  const startDate = fmt(dayjs(endDate).subtract(days, 'day'));
  return getJSON(`${DONKI}/CME`, { startDate, endDate });
}
export async function getGeomagneticStorms({ days = 5 } = {}) {
  const endDate = fmt();
  const startDate = fmt(dayjs(endDate).subtract(days, 'day'));
  return getJSON(`${DONKI}/GST`, { startDate, endDate });
}
export async function getHSS({ days = 5 } = {}) {
  const endDate = fmt();
  const startDate = fmt(dayjs(endDate).subtract(days, 'day'));
  return getJSON(`${DONKI}/HSS`, { startDate, endDate });
}
export async function getIPS({ days = 5 } = {}) {
  const endDate = fmt();
  const startDate = fmt(dayjs(endDate).subtract(days, 'day'));
  return getJSON(`${DONKI}/IPS`, { startDate, endDate });
}
export async function getRBE({ days = 5 } = {}) {
  const endDate = fmt();
  const startDate = fmt(dayjs(endDate).subtract(days, 'day'));
  return getJSON(`${DONKI}/RBE`, { startDate, endDate });
}
export async function getSEP({ days = 5 } = {}) {
  const endDate = fmt();
  const startDate = fmt(dayjs(endDate).subtract(days, 'day'));
  return getJSON(`${DONKI}/SEP`, { startDate, endDate });
}
export async function getWSAEnlil({ days = 7 } = {}) {
  const endDate = fmt();
  const startDate = fmt(dayjs(endDate).subtract(days, 'day'));
  return getJSON(`${DONKI}/WSAEnlilSimulations`, { startDate, endDate });
}

export async function getCMEAnalysis({ startDate, endDate, mostAccurateOnly = false, speed, halfAngle, catalog } = {}) {
  const params = {};
  if (!startDate || !endDate) throw new Error('startDate and endDate required');
  params.startDate = startDate; params.endDate = endDate;
  if (mostAccurateOnly) params.mostAccurateOnly = mostAccurateOnly;
  if (speed) params.speed = speed;
  if (halfAngle) params.halfAngle = halfAngle;
  if (catalog) params.catalog = catalog;
  return getJSON(`${DONKI}/CMEAnalysis`, params);
}

export async function getNotifications({ startDate, endDate, type = 'all' } = {}) {
  if (!startDate || !endDate) throw new Error('startDate and endDate required');
  return getJSON(`${DONKI}/notifications`, { startDate, endDate, type });
}

export async function getMPC({ startDate, endDate } = {}) {
  if (!startDate || !endDate) throw new Error('startDate and endDate required');
  return getJSON(`${DONKI}/MPC`, { startDate, endDate });
}

// ---------- NeoWs ----------
export async function getNeoFeed({ startDate, endDate } = {}) {
  const end = endDate || fmt();
  const start = startDate || fmt(dayjs(end).subtract(7, 'day'));
  return getJSON(`${NEO}/feed`, { start_date: start, end_date: end });
}
export async function getNeoToday() {
  return getJSON(`${NEO}/feed/today`, { detailed: true });
}
export async function getNeoLookup(id) {
  return getJSON(`${NEO}/neo/${id}`);
}

// ---------- APOD ----------
export async function getAPOD({ date, hd = false } = {}) {
  // Si no se especifica fecha, la API de NASA devolverá la imagen de HOY
  const params = {};
  
  // Solo añadir date si se especifica
  if (date) {
    params.date = date;
  }
  
  // Siempre pedir thumbs (útil si es video)
  params.thumbs = true;
  
  // Solo añadir hd si es true
  if (hd === true || hd === 'true') {
    params.hd = true;
  }
  
  return getJSON(`${NASA_BASE}/planetary/apod`, params);
}
