'use strict';
const express = require('express');
const multer = require('multer');
const { z } = require('zod');
const { query } = require('../db');
const { toUser, USER_COLS, requireAuth, asyncH } = require('../middleware');
const { saveImage, deleteUpload } = require('../images');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

router.use(requireAuth);

router.get('/', (req, res) => res.json({ user: req.user }));

router.patch('/', asyncH(async (req, res) => {
  const body = z.object({ name: z.string().trim().min(2).max(80) }).parse(req.body);
  const { rows } = await query(`update users set name = $1 where id = $2 returning ${USER_COLS}`, [body.name, req.user.id]);
  res.json({ user: toUser(rows[0]) });
}));

router.post('/avatar', upload.single('file'), asyncH(async (req, res) => {
  const url = await saveImage(req.file);
  const old = req.user.avatarUrl;
  const { rows } = await query(`update users set avatar_url = $1 where id = $2 returning ${USER_COLS}`, [url, req.user.id]);
  await deleteUpload(old);
  res.json({ user: toUser(rows[0]) });
}));

router.delete('/avatar', asyncH(async (req, res) => {
  const old = req.user.avatarUrl;
  const { rows } = await query(`update users set avatar_url = null where id = $1 returning ${USER_COLS}`, [req.user.id]);
  await deleteUpload(old);
  res.json({ user: toUser(rows[0]) });
}));

module.exports = router;
