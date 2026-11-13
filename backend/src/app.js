'use strict';
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { corsOrigin, trustProxy, uploadDir } = require('./config');
const { pool } = require('./db');
const { loadUser, errorHandler } = require('./middleware');

const app = express();
app.set('trust proxy', trustProxy);
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin.split(',') }));
app.use(express.json({ limit: '100kb' }));

app.get('/health', async (_req, res) => {
  try {
    await pool.query('select 1');
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

app.use('/uploads', express.static(uploadDir, { maxAge: '7d', immutable: true, index: false, dotfiles: 'deny' }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Trop de tentatives. Réessayez dans quelques minutes.' } });

app.use(loadUser);
app.use('/auth', authLimiter, require('./routes/auth'));
app.use('/me', require('./routes/me'));
app.use('/products', require('./routes/products'));

app.use((_req, res) => res.status(404).json({ error: 'Introuvable.' }));
app.use(errorHandler);

module.exports = app;
