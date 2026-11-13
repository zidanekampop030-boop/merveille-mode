import { create } from 'zustand';
import { ApiError, api } from '../lib/api';
import type { Product, User } from '../types';

export type ProductInput = Omit<Product, 'id' | 'createdAt'>;

interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetch: (user?: User | null) => Promise<void>;
  create: (data: ProductInput) => Promise<void>;
  update: (id: string, patch: Partial<ProductInput>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useProducts = create<ProductsState>((set, get) => ({
  products: [],
  loading: false,
  error: null,

  // Le serveur décide quels articles renvoyer : aperçu pour les visiteurs, tout le catalogue pour les comptes connectés.
  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const r = await api<{ products: Product[] }>('/products');
      set({ products: r.products });
    } catch (e) {
      set({ error: e instanceof ApiError ? e.message : 'Chargement impossible' });
    } finally {
      set({ loading: false });
    }
  },

  create: async (data) => {
    const r = await api<{ product: Product }>('/products', { method: 'POST', json: data });
    set({ products: [r.product, ...get().products] });
  },

  update: async (id, patch) => {
    const r = await api<{ product: Product }>(`/products/${id}`, { method: 'PATCH', json: patch });
    set({ products: get().products.map((p) => (p.id === id ? r.product : p)) });
  },

  remove: async (id) => {
    await api(`/products/${id}`, { method: 'DELETE' });
    set({ products: get().products.filter((p) => p.id !== id) });
  },
}));
