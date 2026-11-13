'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { uploadDir } = require('./config');
const { HttpError } = require('./middleware');

/** Détecte le vrai type de l'image par ses premiers octets (on ne fait jamais confiance au nom ni au type annoncé). */
function detectType(buf) {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 12 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 12 && buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

async function saveImage(file) {
  if (!file) throw new HttpError(400, 'Aucun fichier reçu.');
  const ext = detectType(file.buffer);
  if (!ext) throw new HttpError(400, 'Format non pris en charge (JPEG, PNG ou WebP).');
  await fs.promises.mkdir(uploadDir, { recursive: true });
  const name = `${crypto.randomUUID()}.${ext}`;
  await fs.promises.writeFile(path.join(uploadDir, name), file.buffer, { flag: 'wx' });
  return `/uploads/${name}`;
}

/** Supprime un fichier envoyé par l'API (sans jamais sortir du dossier d'envoi). */
async function deleteUpload(url) {
  if (typeof url !== 'string' || !url.startsWith('/uploads/')) return;
  const name = path.basename(url);
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name)) return;
  await fs.promises.unlink(path.join(uploadDir, name)).catch(() => undefined);
}

module.exports = { saveImage, deleteUpload };
