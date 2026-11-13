// Tokens de design centralisés — noir, blanc et beige sable, thèmes clair et sombre.
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSettings } from './store/settings';

const light = {
  primary: '#111111', // fonds de boutons, accents (noir)
  onPrimary: '#FFFFFF', // texte sur fond primary
  primarySoft: '#F3EBDC', // beige sable très clair
  heading: '#111111', // titres
  banner: '#111111', // bandeaux sombres (toujours sombres)
  onGold: '#111111', // texte sur fond sable
  gold: '#D8C3A0', // beige sable
  goldText: '#7A6540', // sable foncé, lisible sur fond clair (contraste > 4.5:1)
  bg: '#FAF8F4',
  card: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#111111',
  muted: '#5C5750',
  border: '#E6DDCC',
  placeholder: '#7A7367',
  danger: '#B42318',
  success: '#15803D',
  successBg: '#E8F3EA',
  warnBg: '#F6EEDD',
  promo: '#8A6A2F',
  onPromo: '#FFFFFF',
  white: '#FFFFFF',
  glass: 'rgba(255,255,255,0.92)',
  overlay: 'rgba(17,17,17,0.55)',
};

export type Palette = { [K in keyof typeof light]: string };

const dark: Palette = {
  primary: '#D8C3A0',
  onPrimary: '#111111',
  primarySoft: '#26221B',
  heading: '#F5F1EA',
  banner: '#1F1B15',
  onGold: '#111111',
  gold: '#D8C3A0',
  goldText: '#D8C3A0',
  bg: '#0E0E0E',
  card: '#1A1A1A',
  surface: '#1A1A1A',
  text: '#F5F1EA',
  muted: '#B0A99C',
  border: '#33302A',
  placeholder: '#8F887C',
  danger: '#F87171',
  success: '#4ADE80',
  successBg: '#17301D',
  warnBg: '#2E2616',
  promo: '#D8C3A0',
  onPromo: '#111111',
  white: '#FFFFFF',
  glass: 'rgba(26,26,26,0.92)',
  overlay: 'rgba(0,0,0,0.65)',
};

export const lightColors: Palette = light;
export const darkColors: Palette = dark;

export function useIsDark(): boolean {
  const pref = useSettings((s) => s.themePref);
  const system = useColorScheme();
  return pref === 'dark' || (pref === 'system' && system === 'dark');
}

export const useColors = (): Palette => (useIsDark() ? darkColors : lightColors);

/** Construit (et mémorise) les styles pour la palette courante. */
export function useStyles<T>(factory: (c: Palette) => T): T {
  const c = useColors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(c), [c]);
}

export const fonts = {
  serif: 'CormorantGaramond_700Bold',
  serifSemi: 'CormorantGaramond_600SemiBold',
  sans: 'Montserrat_400Regular',
  sansMedium: 'Montserrat_500Medium',
  sansSemi: 'Montserrat_600SemiBold',
  sansBold: 'Montserrat_700Bold',
};

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 };

export const shadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;
