'use strict';
const { Pool } = require('pg');
const { databaseUrl } = require('./config');

const pool = new Pool({ connectionString: databaseUrl, max: 10, idleTimeoutMillis: 30000 });
pool.on('error', (err) => console.error('Erreur PostgreSQL (client inactif):', err.message));

module.exports = { pool, query: (text, params) => pool.query(text, params) };
