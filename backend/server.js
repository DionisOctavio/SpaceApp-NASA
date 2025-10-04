// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import pino from 'pino';
import pinoHttp from 'pino-http';

import donkiRouter from './routes/donki.js';
import neoRouter from './routes/neo.js';
import feedRouter from './routes/feed.js';
import apodRouter from './routes/apod.js';
import analyticsRouter from './routes/analytics.js'; // NUEVO
import aiRouter from './routes/ai.js'; // NUEVO - Asistente IA

const app = express();

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
app.use(pinoHttp({ logger }));

// Configurar CORS más permisivo para desarrollo
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: false
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

app.use('/api/donki', donkiRouter);
app.use('/api/neo', neoRouter);
app.use('/api/feed', feedRouter);
app.use('/api/apod', apodRouter);
app.use('/api/analytics', analyticsRouter); // NUEVO
app.use('/api/ai', aiRouter); // NUEVO - Asistente IA

// Error handler minimal
app.use((err, req, res, next) => {
  logger.error({ err }, 'Unhandled error');
  res.status(err.status || 500).json({ error: err.message || 'Internal error' });
});

const PORT = process.env.PORT || 5173;
app.listen(PORT, () => {
  const baseUrl = `http://localhost:${PORT}`;
  logger.info(`🚀 SpaceNow! backend escuchando en ${baseUrl}`);
});