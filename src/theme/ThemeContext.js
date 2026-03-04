import { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { createElevation, motion, radius, spacing } from '../ui/foundation/tokens';
import { typography } from '../ui/foundation/typography';

const lightColors = {
  background: '#F6F8FF',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF3FF',

  text: '#0E1A2B',
  textMuted: '#5A6B80',

  // Brand: playful, high-contrast, Duolingo-ish
  accent: '#4C6FFF',
  accentMuted: '#DDE3FF',
  accentSoft: 'rgba(76, 111, 255, 0.14)',

  // Secondary accents for “alive” UI
  mint: '#22C55E',
  mintSoft: 'rgba(34, 197, 94, 0.14)',
  amber: '#F59E0B',
  amberSoft: 'rgba(245, 158, 11, 0.14)',
  pink: '#EC4899',
  pinkSoft: 'rgba(236, 72, 153, 0.14)',

  border: '#D8E0F0',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  overlay: 'rgba(9, 16, 24, 0.5)',
};

const darkColors = {
  background: '#08101C',
  surface: '#0E1A2B',
  surfaceMuted: '#14243B',

  text: '#EAF1FF',
  textMuted: '#A8B7D1',

  accent: '#6B8CFF',
  accentMuted: '#1C3166',
  accentSoft: 'rgba(107, 140, 255, 0.18)',

  mint: '#34D399',
  mintSoft: 'rgba(52, 211, 153, 0.18)',
  amber: '#FBBF24',
  amberSoft: 'rgba(251, 191, 36, 0.18)',
  pink: '#F472B6',
  pinkSoft: 'rgba(244, 114, 182, 0.18)',

  border: '#20365B',
  success: '#34D399',
  danger: '#FB7185',
  warning: '#FBBF24',
  overlay: 'rgba(1, 5, 10, 0.68)',
};

const buildTheme = (colors, isDark) => {
  const elevation = createElevation(isDark);

  return {
    colors,
    spacing,
    radius,
    typography,
    elevation,
    motion,
    gradients: {
      background: isDark ? ['#08101C', '#14243B'] : ['#F6F8FF', '#EEF3FF'],
      hero: isDark ? ['#14243B', '#0E1A2B'] : ['#FFFFFF', '#EEF3FF'],
      accent: isDark ? ['#6B8CFF', '#4C6FFF'] : ['#4C6FFF', '#6B8CFF'],
      success: isDark ? ['#34D399', '#22C55E'] : ['#22C55E', '#34D399'],
      candy: isDark ? ['#F472B6', '#6B8CFF'] : ['#EC4899', '#4C6FFF'],
    },

    // Backwards-compatible aliases for current code paths.
    background: colors.background,
    surface: colors.surface,
    text: colors.text,
    textMuted: colors.textMuted,
    accent: colors.accent,
    accentMuted: colors.accentMuted,
    border: colors.border,
    success: colors.success,
    danger: colors.danger,
  };
};

export const ThemeContext = createContext({
  theme: buildTheme(lightColors, false),
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const systemPreference = useColorScheme();
  const [isDark, setIsDark] = useState(systemPreference === 'dark');

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const theme = useMemo(
    () => buildTheme(isDark ? darkColors : lightColors, isDark),
    [isDark]
  );

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
