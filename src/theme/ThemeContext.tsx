import React, { createContext, useContext, useMemo, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Palette, ThemeName, palettes } from './colors';
import { spacing, radius, typography } from './spacing';

interface ThemeContextValue {
  themeName: ThemeName;
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  setThemeName: (name: ThemeName | 'system') => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  // override === null  -> follow the system setting
  const [override, setOverride] = useState<ThemeName | null>(null);

  useEffect(() => {
    // hook for future persistence via secureStore or asyncStorage if desired
  }, []);

  const themeName: ThemeName = override ?? (system === 'dark' ? 'dark' : 'light');

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeName,
      colors: palettes[themeName],
      spacing,
      radius,
      typography,
      setThemeName: (name) => setOverride(name === 'system' ? null : name),
    }),
    [themeName],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
