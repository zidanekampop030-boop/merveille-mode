import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appStorage } from '../lib/app-storage';

export interface CartLine {
  productId: string;
  size: string | null;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  add: (productId: string, size: string | null, maxQty: number) => boolean;
  setQty: (productId: string, size: string | null, qty: number, maxQty: number) => void;
  remove: (productId: string, size: string | null) => void;
  clear: () => void;
  count: () => number;
}

const same = (l: CartLine, id: string, size: string | null) => l.productId === id && l.size === size;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (productId, size, maxQty) => {
        const existing = get().lines.find((l) => same(l, productId, size));
        if (existing && existing.qty >= maxQty) return false;
        set({
          lines: existing
            ? get().lines.map((l) => (same(l, productId, size) ? { ...l, qty: l.qty + 1 } : l))
            : [...get().lines, { productId, size, qty: 1 }],
        });
        return true;
      },
      setQty: (productId, size, qty, maxQty) =>
        set({
          lines: get()
            .lines.map((l) => (same(l, productId, size) ? { ...l, qty: Math.min(qty, maxQty) } : l))
            .filter((l) => l.qty > 0),
        }),
      remove: (productId, size) => set({ lines: get().lines.filter((l) => !same(l, productId, size)) }),
      clear: () => set({ lines: [] }),
      count: () => get().lines.reduce((n, l) => n + l.qty, 0),
    }),
    { name: 'merveille.cart', storage: createJSONStorage(() => appStorage) },
  ),
);
