export const formatFCFA = (n: number) =>
  `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;

export const discountPercent = (price: number, promo?: number | null) =>
  promo && promo < price ? Math.round(((price - promo) / price) * 100) : 0;

export const effectivePrice = (p: { price: number; promoPrice?: number | null }) =>
  p.promoPrice && p.promoPrice < p.price ? p.promoPrice : p.price;
