import { useTheme } from '../../theme/ThemeContext';

/**
 * Typed wrapper around ThemeContext for UI layer consumption.
 */
export const useAppTheme = () => {
  const { theme, isDark, toggleTheme, accentKey, setAccentKey, backgroundStyle } = useTheme();

  return {
    theme,
    colors: theme.colors,
    spacing: theme.spacing,
    radius: theme.radius,
    typography: theme.typography,
    elevation: theme.elevation,
    motion: theme.motion,
    isDark,
    statusBarStyle: isDark ? 'light' : 'dark',
    toggleTheme,
    accentKey,
    setAccentKey,
    backgroundStyle,
  };
};
