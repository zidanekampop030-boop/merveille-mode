'use strict';
// Usage : node scripts/make-admin.js email@exemple.com   (le compte doit déjà exister)
const { pool } = require('../src/db');

(async () => {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!email) {
    console.error('Usage : node scripts/make-admin.js email@exemple.com');
    process.exit(1);
  }
  const { rowCount } = await pool.query("update users set role = 'admin' where lower(email) = $1", [email]);
  console.log(rowCount ? `${email} est maintenant administrateur.` : `Aucun compte trouvé pour ${email} (inscrivez-vous d'abord dans l'application).`);
  await pool.end();
  process.exit(rowCount ? 0 : 2);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
