import { useColorScheme } from 'react-native';

import type { VibeId } from '@/src/vibe/analyze';

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displaySoft: 'Fraunces_500Medium',
  body: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
} as const;

export type Theme = {
  mode: 'dark' | 'light';
  bg: string;
  bgElevated: string;
  card: string;
  border: string;
  text: string;
  textSoft: string;
  textFaint: string;
  accent: string;
  accentInk: string;
  mint: string;
  danger: string;
  scrim: string;
  status: 'light' | 'dark';
};

const shared = {
  accent: '#C9B8FF',
  accentInk: '#1A1524',
};

export const darkTheme: Theme = {
  mode: 'dark',
  bg: '#09080D',
  bgElevated: '#121118',
  card: '#18161F',
  border: 'rgba(246,243,238,0.08)',
  text: '#F6F3EE',
  textSoft: '#B7AFC6',
  textFaint: '#7E7690',
  accent: shared.accent,
  accentInk: shared.accentInk,
  mint: '#9EE6C8',
  danger: '#F0A0A0',
  scrim: 'rgba(9,8,13,0.72)',
  status: 'light',
};

export const lightTheme: Theme = {
  mode: 'light',
  bg: '#F4F0E8',
  bgElevated: '#FFFCF8',
  card: '#FFFFFF',
  border: 'rgba(22,20,28,0.08)',
  text: '#16141C',
  textSoft: '#5C5668',
  textFaint: '#8A8496',
  accent: '#6D56D6',
  accentInk: '#FFFFFF',
  mint: '#1F8A62',
  danger: '#A33B3B',
  scrim: 'rgba(22,20,28,0.35)',
  status: 'dark',
};

const tagInk: Record<VibeId, { dark: string; light: string }> = {
  golden: { dark: '#F2C98A', light: '#8A5A12' },
  warm: { dark: '#F0B48A', light: '#A85A28' },
  cool: { dark: '#9FD0E4', light: '#1E5E78' },
  pastel: { dark: '#F0C2D4', light: '#8A4560' },
  night: { dark: '#C9C4E8', light: '#3A3A62' },
  moody: { dark: '#C4B6E0', light: '#53407A' },
  bright: { dark: '#F6E7B2', light: '#7A6410' },
  airy: { dark: '#C7E6F2', light: '#1E6070' },
  vivid: { dark: '#F0A0C0', light: '#8E2450' },
  muted: { dark: '#C8C2BC', light: '#5C5854' },
};

export function tagColor(id: VibeId, mode: Theme['mode']): string {
  return tagInk[id][mode];
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'light' ? lightTheme : darkTheme;
}
