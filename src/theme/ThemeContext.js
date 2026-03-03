import { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { createElevation, motion, radius, spacing } from '../ui/foundation/tokens';
import { typography } from '../ui/foundation/typography';

const lightColors = {
  background: '#f3f6fb',
  surface: '#ffffff',
  surfaceMuted: '#eef3fb',
  text: '#102033',
  textMuted: '#5b6b7c',
  accent: '#1f7ae0',
  accentMuted: '#d8e7fb',
  accentSoft: 'rgba(31, 122, 224, 0.12)',
  border: '#d4deea',
  success: '#0e9f6e',
  danger: '#d14343',
  warning: '#cc8a00',
  overlay: 'rgba(9, 16, 24, 0.5)',
};

const darkColors = {
  background: '#0c1522',
  surface: '#111f33',
  surfaceMuted: '#172a42',
  text: '#eef5ff',
  textMuted: '#a2b5cf',
  accent: '#5ea2ff',
  accentMuted: '#1a3560',
  accentSoft: 'rgba(94, 162, 255, 0.18)',
  border: '#274261',
  success: '#2bc48a',
  danger: '#ff7575',
  warning: '#ffb74a',
  overlay: 'rgba(1, 5, 10, 0.65)',
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
      background: isDark ? ['#0c1522', '#10263d'] : ['#f3f6fb', '#e9f0fa'],
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
