import type { CategoryKey } from './config';

export type Role = 'admin' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: CategoryKey;
  price: number;
  promoPrice: number | null;
  images: string[]; // "local:pNN" (image embarquée) ou URL
  isNew: boolean;
  preview: boolean; // visible sans compte
  published: boolean;
  stock: number;
  sizes: string[];
  createdAt: string;
}
