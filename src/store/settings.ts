import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appStorage } from '../lib/app-storage';

export type Lang = 'fr' | 'en';
export type ThemePref = 'system' | 'light' | 'dark';
export type PayMethod = 'momo' | 'om' | 'card';

interface SettingsState {
  hydrated: boolean;
  lang: Lang;
  themePref: ThemePref;
  payMethod: PayMethod;
  payPhone: string; // numéro Mobile Money (9 chiffres)
  setLang: (l: Lang) => void;
  setThemePref: (t: ThemePref) => void;
  setPayMethod: (m: PayMethod) => void;
  setPayPhone: (p: string) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      hydrated: false,
      lang: 'fr',
      themePref: 'system',
      payMethod: 'momo',
      payPhone: '',
      setLang: (lang) => set({ lang }),
      setThemePref: (themePref) => set({ themePref }),
      setPayMethod: (payMethod) => set({ payMethod }),
      setPayPhone: (payPhone) => set({ payPhone: payPhone.replace(/\D/g, '').slice(0, 9) }),
    }),
    {
      name: 'merveille.settings',
      storage: createJSONStorage(() => appStorage),
      partialize: (s) => ({ lang: s.lang, themePref: s.themePref, payMethod: s.payMethod, payPhone: s.payPhone }),
      onRehydrateStorage: () => () => useSettings.setState({ hydrated: true }),
    },
  ),
);
