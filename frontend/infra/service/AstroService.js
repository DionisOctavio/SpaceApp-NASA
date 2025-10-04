// frontend/infra/service/AstroService.js
import { AstroRepository } from "../repository/AstroRepository.js";

export const AstroService = {
  getFeed: () => AstroRepository.getFeed(),
  getFlares: (d=2) => AstroRepository.getFlares(d),
  getCMEs: (d=3) => AstroRepository.getCMEs(d),
  getFlaresRange: (startDate, endDate) => AstroRepository.getFlaresRange(startDate, endDate),
  getCMEAnalysis: (startDate, endDate, opts) => AstroRepository.getCMEAnalysis(startDate, endDate, opts),
  getDonkiNotifications: (startDate, endDate, type='all') => AstroRepository.getDonkiNotifications(startDate, endDate, type),
  getMPC: (startDate, endDate) => AstroRepository.getMPC(startDate, endDate),
  getGST: (d=5) => AstroRepository.getGST(d),
  getNeoToday: () => AstroRepository.getNeoToday(),
  getAPOD: (hd=true) => AstroRepository.getAPOD(hd),
};
