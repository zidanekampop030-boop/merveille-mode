'use strict';
const jwt = require('jsonwebtoken');
const { ZodError } = require('zod');
const { jwtSecret } = require('./config');
const { query } = require('./db');

const toUser = (r) => ({ id: r.id, email: r.email, name: r.name, role: r.role, avatarUrl: r.avatar_url });
const USER_COLS = 'id, email, name, role, avatar_url';

const signToken = (userId) => jwt.sign({ sub: userId }, jwtSecret, { algorithm: 'HS256', expiresIn: '30d' });

/** Charge l'utilisateur depuis la base à chaque requête : le rôle est toujours à jour (rétrogradation immédiate). */
async function loadUser(req, _res, next) {
  const h = req.headers.authorization;
  if (h && h.startsWith('Bearer ')) {
    try {
      const { sub } = jwt.verify(h.slice(7), jwtSecret, { algorithms: ['HS256'] });
      const { rows } = await query(`select ${USER_COLS} from users where id = $1`, [sub]);
      if (rows[0]) req.user = toUser(rows[0]);
      else req.badToken = true;
    } catch (e) {
      if (e && e.name && /JsonWebToken|TokenExpired|NotBefore/.test(e.name)) req.badToken = true;
      else return next(e); // erreur base de données, etc.
    }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Non connecté.' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Non connecté.' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé.' });
  next();
}

const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Données invalides.', details: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`) });
  }
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Image trop lourde (5 Mo maximum).' : 'Envoi du fichier impossible.' });
  }
  if (err && err.status && err.status < 500) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur.' });
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = { toUser, USER_COLS, signToken, loadUser, requireAuth, requireAdmin, asyncH, errorHandler, HttpError };
