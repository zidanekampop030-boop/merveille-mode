import type { PayMethod } from '../store/settings';

export interface PayOption {
  key: PayMethod;
  label: string; // clé de traduction
  icon: 'cellphone' | 'credit-card-outline';
  needsPhone: boolean;
  dot: string;
}

export const PAY_OPTIONS: PayOption[] = [
  { key: 'momo', label: 'MTN Mobile Money', icon: 'cellphone', needsPhone: true, dot: '#FFCC00' },
  { key: 'om', label: 'Orange Money', icon: 'cellphone', needsPhone: true, dot: '#FF7900' },
  { key: 'card', label: 'Carte bancaire', icon: 'credit-card-outline', needsPhone: false, dot: '#8A6A2F' },
];

/** Numéro mobile camerounais : 9 chiffres commençant par 6 (sans l'indicatif +237). */
export const isValidCmPhone = (p: string) => /^6\d{8}$/.test(p);
