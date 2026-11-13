'use strict';
const express = require('express');
const multer = require('multer');
const { z } = require('zod');
const { query } = require('../db');
const { requireAdmin, asyncH, HttpError } = require('../middleware');
const { saveImage, deleteUpload } = require('../images');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

const CATEGORIES = ['chaussures', 'vetements', 'sacs', 'perruques', 'accessoires', 'beaute'];
const imageRef = z.string().max(500).regex(/^(local:p\d{2}|\/uploads\/[0-9a-f-]{36}\.(jpg|png|webp)|https:\/\/.+)$/, 'image invalide');

const productSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(2000).default(''),
    category: z.enum(CATEGORIES),
    price: z.number().int().min(1).max(100000000),
    promoPrice: z.number().int().min(1).nullable().default(null),
    images: z.array(imageRef).min(1).max(6),
    isNew: z.boolean().default(false),
    preview: z.boolean().default(false),
    published: z.boolean().default(true),
    stock: z.number().int().min(0).max(100000),
    sizes: z.array(z.string().trim().min(1).max(12)).max(20).default([]),
  })
  .refine((p) => p.promoPrice === null || p.promoPrice < p.price, { message: 'le prix promo doit être inférieur au prix', path: ['promoPrice'] });

const COLS = 'id, name, description, category, price, promo_price, images, is_new, preview, published, stock, sizes, created_at';
const toProduct = (r) => ({
  id: r.id, name: r.name, description: r.description, category: r.category, price: r.price,
  promoPrice: r.promo_price, images: r.images, isNew: r.is_new, preview: r.preview, published: r.published,
  stock: r.stock, sizes: r.sizes, createdAt: r.created_at,
});
const values = (p) => [p.name, p.description, p.category, p.price, p.promoPrice, p.images, p.isNew, p.preview, p.published, p.stock, p.sizes];

/** Catalogue : visiteur = articles « aperçu » ; client connecté = tous les articles publiés ; admin = tout. */
router.get('/', asyncH(async (req, res) => {
  if (req.badToken) return res.status(401).json({ error: 'Session expirée. Reconnectez-vous.' });
  let where = 'published and preview';
  if (req.user) where = req.user.role === 'admin' ? 'true' : 'published';
  const { rows } = await query(`select ${COLS} from products where ${where} order by created_at desc, id`);
  res.json({ products: rows.map(toProduct) });
}));

router.post('/', requireAdmin, asyncH(async (req, res) => {
  const p = productSchema.parse(req.body);
  const { rows } = await query(
    `insert into products (name, description, category, price, promo_price, images, is_new, preview, published, stock, sizes)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning ${COLS}`,
    values(p),
  );
  res.status(201).json({ product: toProduct(rows[0]) });
}));

router.patch('/:id', requireAdmin, asyncH(async (req, res) => {
  const { rows: cur } = await query(`select ${COLS} from products where id = $1`, [req.params.id]);
  if (!cur[0]) throw new HttpError(404, 'Article introuvable.');
  const { id, createdAt, ...current } = toProduct(cur[0]);
  const p = productSchema.parse({ ...current, ...req.body });
  const { rows } = await query(
    `update products set name=$1, description=$2, category=$3, price=$4, promo_price=$5, images=$6,
       is_new=$7, preview=$8, published=$9, stock=$10, sizes=$11, updated_at=now()
     where id = $12 returning ${COLS}`,
    [...values(p), req.params.id],
  );
  // nettoyage des images remplacées (uniquement celles envoyées par l'API)
  await Promise.all(current.images.filter((u) => !p.images.includes(u)).map(deleteUpload));
  res.json({ product: toProduct(rows[0]) });
}));

router.delete('/:id', requireAdmin, asyncH(async (req, res) => {
  const { rows } = await query('delete from products where id = $1 returning images', [req.params.id]);
  if (!rows[0]) throw new HttpError(404, 'Article introuvable.');
  await Promise.all(rows[0].images.map(deleteUpload));
  res.status(204).end();
}));

/** Import d'une image d'article (administrateur). */
router.post('/images', requireAdmin, upload.single('file'), asyncH(async (req, res) => {
  res.status(201).json({ url: await saveImage(req.file) });
}));

module.exports = router;
