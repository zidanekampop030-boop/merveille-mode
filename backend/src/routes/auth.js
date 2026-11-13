'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { z } = require('zod');
const { query } = require('../db');
const { googleClientIds } = require('../config');
const { toUser, USER_COLS, signToken, asyncH, HttpError } = require('../middleware');

const router = express.Router();
const googleClient = new OAuth2Client();
// Hachage factice : on compare toujours un mot de passe, même si l'e-mail n'existe pas (évite de révéler les comptes par le temps de réponse).
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 12);

const email = z.string().trim().toLowerCase().email().max(254);
const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email, password: z.string().min(6).max(128) });
const loginSchema = z.object({ email, password: z.string().min(1).max(128) });
const googleSchema = z.object({ idToken: z.string().min(20).max(4096) });

const session = (row) => ({ token: signToken(row.id), user: toUser(row) });

router.post('/register', asyncH(async (req, res) => {
  const { name, email: mail, password } = registerSchema.parse(req.body);
  const hash = await bcrypt.hash(password, 12);
  try {
    const { rows } = await query(
      `insert into users (email, password_hash, name) values ($1, $2, $3) returning ${USER_COLS}`,
      [mail, hash, name],
    );
    res.status(201).json(session(rows[0]));
  } catch (e) {
    if (e.code === '23505') throw new HttpError(409, 'Un compte existe déjà avec cet e-mail.');
    throw e;
  }
}));

router.post('/login', asyncH(async (req, res) => {
  const { email: mail, password } = loginSchema.parse(req.body);
  const { rows } = await query(`select ${USER_COLS}, password_hash from users where lower(email) = $1`, [mail]);
  const row = rows[0];
  const ok = await bcrypt.compare(password, (row && row.password_hash) || DUMMY_HASH);
  if (!row || !row.password_hash || !ok) throw new HttpError(401, 'E-mail ou mot de passe incorrect.');
  res.json(session(row));
}));

router.post('/google', asyncH(async (req, res) => {
  if (googleClientIds.length === 0) throw new HttpError(503, "La connexion Google n'est pas configurée sur le serveur.");
  const { idToken } = googleSchema.parse(req.body);
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: googleClientIds });
    payload = ticket.getPayload();
  } catch {
    throw new HttpError(401, 'Connexion Google refusée.');
  }
  if (!payload || !payload.sub || !payload.email || !payload.email_verified) throw new HttpError(401, 'Connexion Google refusée.');
  const mail = payload.email.toLowerCase();

  let { rows } = await query(`select ${USER_COLS} from users where google_sub = $1`, [payload.sub]);
  if (!rows[0]) {
    // Compte e-mail existant : on y rattache Google (l'e-mail est vérifié par Google)
    ({ rows } = await query(
      `update users set google_sub = $1 where lower(email) = $2 and google_sub is null returning ${USER_COLS}`,
      [payload.sub, mail],
    ));
  }
  if (!rows[0]) {
    ({ rows } = await query(
      `insert into users (email, google_sub, name, avatar_url) values ($1, $2, $3, null) returning ${USER_COLS}`,
      [mail, payload.sub, (payload.name || mail.split('@')[0]).slice(0, 80)],
    ));
  }
  res.json(session(rows[0]));
}));

module.exports = router;
