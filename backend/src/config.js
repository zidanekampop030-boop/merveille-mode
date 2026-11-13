'use strict';

const env = process.env;

function required(name) {
  const v = env[name];
  if (!v) throw new Error(`Variable d'environnement manquante : ${name}`);
  return v;
}

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 32) throw new Error('JWT_SECRET doit contenir au moins 32 caractères.');

module.exports = {
  port: Number(env.PORT) || 3000,
  databaseUrl: required('DATABASE_URL'),
  jwtSecret,
  uploadDir: env.UPLOAD_DIR || '/data/uploads',
  corsOrigin: env.CORS_ORIGIN || '*',
  trustProxy: Number(env.TRUST_PROXY || 0),
  googleClientIds: (env.GOOGLE_CLIENT_IDS || '').split(',').map((s) => s.trim()).filter(Boolean),
};
