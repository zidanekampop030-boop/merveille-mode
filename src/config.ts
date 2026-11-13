export const BRAND = {
  name: 'Merveille',
  tagline: 'Mode & Élégance',
  fullName: 'Merveille Mode & Élégance',
};

export const WHATSAPP_NUMBER = process.env.EXPO_PUBLIC_WHATSAPP ?? '237681546178';

/** Nombre d'articles visibles sans compte : seuls les articles marqués "aperçu" sont montrés aux visiteurs. */
export const CATEGORIES = [
  { key: 'chaussures', label: 'Chaussures', icon: 'shoe-sneaker' },
  { key: 'vetements', label: 'Vêtements', icon: 'tshirt-crew-outline' },
  { key: 'sacs', label: 'Sacs', icon: 'bag-personal-outline' },
  { key: 'perruques', label: 'Perruques', icon: 'face-woman-shimmer-outline' },
  { key: 'accessoires', label: 'Accessoires', icon: 'diamond-stone' },
  { key: 'beaute', label: 'Beauté', icon: 'lipstick' },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]['key'];

export const categoryLabel = (key: string) => CATEGORIES.find((c) => c.key === key)?.label ?? key;
