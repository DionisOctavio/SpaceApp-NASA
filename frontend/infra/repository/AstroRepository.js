// frontend/infra/repository/AstroRepository.js
import { FetchUtil } from "../util/FetchUtil.js";

export const AstroRepository = {
  getFeed: () => FetchUtil.get(`/feed`),
  getFlares: (days = 2) => FetchUtil.get(`/donki/flares?days=${days}`),
  getCMEs: (days = 3) => FetchUtil.get(`/donki/cmes?days=${days}`),
  getFlaresRange: (startDate, endDate) => FetchUtil.get(`/donki/flares-range?startDate=${startDate}&endDate=${endDate}`),
  getCMEAnalysis: (startDate, endDate, opts = {}) => {
    const params = new URLSearchParams({ startDate, endDate, ...(opts.mostAccurateOnly ? { mostAccurateOnly: 'true' } : {}), ...(opts.speed ? { speed: opts.speed } : {}), ...(opts.halfAngle ? { halfAngle: opts.halfAngle } : {}), ...(opts.catalog ? { catalog: opts.catalog } : {}) });
    return FetchUtil.get(`/donki/cme-analysis?${params.toString()}`);
  },
  getDonkiNotifications: (startDate, endDate, type='all') => FetchUtil.get(`/donki/notifications?startDate=${startDate}&endDate=${endDate}&type=${type}`),
  getMPC: (startDate, endDate) => FetchUtil.get(`/donki/mpc?startDate=${startDate}&endDate=${endDate}`),
  getGST: (days = 5) => FetchUtil.get(`/donki/gst?days=${days}`),
  getNeoToday: () => FetchUtil.get(`/neo/today`),
  getAPOD: (hd = true) => FetchUtil.get(`/apod?hd=${hd}`),
};
