'use strict';
const app = require('./app');
const { port } = require('./config');
const { pool } = require('./db');

const server = app.listen(port, () => console.log(`API Merveille à l'écoute sur le port ${port}`));

function shutdown(signal) {
  console.log(`${signal} reçu, arrêt en douceur…`);
  server.close(() => pool.end().then(() => process.exit(0)));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
