
export type ThemeName = 'light' | 'dark';

export interface Palette {
  // Brand
  primary: string;        // main brand (buttons, active tab, links)
  primaryAccent: string;  // brighter accent (highlights, focus)
  primaryDeep: string;    // deepest royal (headers, emphasis)
  primaryMuted: string;   // tinted background for subtle surfaces

  // Surfaces
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;

  // Text
  text: string;
  textSecondary: string;
  textInverse: string;

  // Status
  success: string;
  danger: string;
  warning: string;

  // Interaction
  like: string;   // green-ish for the LIKE action
  pass: string;   // grey-ish for the PASS action
}

export const lightPalette: Palette = {
  primary: '#1E3A8A',
  primaryAccent: '#4169E1',
  primaryDeep: '#002366',
  primaryMuted: '#EEF2FF',

  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',

  text: '#0F172A',
  textSecondary: '#475569',
  textInverse: '#FFFFFF',

  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',

  like: '#10B981',
  pass: '#94A3B8',
};

export const darkPalette: Palette = {
  primary: '#4169E1',
  primaryAccent: '#6383E7',
  primaryDeep: '#1E3A8A',
  primaryMuted: '#1E293B',

  background: '#0F172A',
  surface: '#1E293B',
  surfaceAlt: '#334155',
  border: '#334155',

  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textInverse: '#0F172A',

  success: '#22C55E',
  danger: '#F87171',
  warning: '#FBBF24',

  like: '#22C55E',
  pass: '#64748B',
};

export const palettes: Record<ThemeName, Palette> = {
  light: lightPalette,
  dark: darkPalette,
};
