import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme, useWindowDimensions } from 'react-native';
import * as secureStore from '../storage/secureStore';
import { createResponsiveRadius, createResponsiveSpacing, createResponsiveTypography, getBreakpoint, getUiScale } from '../ui/foundation/responsive';
import { radius as baseRadius, spacing as baseSpacing, createElevation, motion } from '../ui/foundation/tokens';
import { typography as baseTypography } from '../ui/foundation/typography';

const THEME_PREFS_KEY = 'allison_theme_prefs';

// The "Deep Pacific" palette prioritizes high contrast and deep marine tones.
const palettes = {
  ocean: {
    label: 'Ocean (Default)',
    light: { 
      accent: '#0066CC',       // Deep marine blue
      accentMuted: '#7EC8E3',  // Clear, shallow water cyan
      accentSoft: 'rgba(0, 102, 204, 0.12)' // Transparent marine base
    },
    dark: { 
      accent: '#4DA6FF',       // Luminous azure for dark mode visibility
      accentMuted: '#1A4C73',  // Deep trench navy
      accentSoft: 'rgba(77, 166, 255, 0.16)' // Transparent azure base
    },
  },
  // The "Deep Pine" palette establishes a grounded and reliable green aesthetic.
  forest: {
    label: 'Forest',
    light: { 
      accent: '#2E7D32',       // Rich pine green
      accentMuted: '#A5D6A7',  // Soft sage green
      accentSoft: 'rgba(46, 125, 50, 0.12)' // Transparent pine base
    },
    dark: { 
      accent: '#66BB6A',       // Luminous emerald for dark mode visibility
      accentMuted: '#1B5E20',  // Deep moss green
      accentSoft: 'rgba(102, 187, 106, 0.16)' // Transparent emerald base
    },
  },
  // The "Ember" palette captures the sophisticated warmth of a smoldering coal.
  ember: {
    label: 'Ember',
    light: { 
      accent: '#8B1E3F', 
      accentMuted: '#F6D3DD', 
      accentSoft: 'rgba(139, 30, 63, 0.14)' 
    },
    dark: { 
      accent: '#b3294e', 
      accentMuted: '#3A0F1C', 
      accentSoft: 'rgba(179, 41, 78, 0.18)' // Mathematically aligned with #b3294e
    },
  },
  // The "Amethyst" palette establishes a vibrant and highly accessible violet aesthetic.
  amethyst: {
    label: 'Amethyst',
    light: { 
      accent: '#6D28D9', 
      accentMuted: '#E9D5FF', 
      accentSoft: 'rgba(109, 40, 217, 0.14)' 
    },
    dark: { 
      accent: '#A78BFA', 
      accentMuted: '#23133F', 
      accentSoft: 'rgba(167, 139, 250, 0.18)' 
    },
  },
};

const lightColors = {
  background: '#F6F8FF',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF3FF',

  text: '#0E1A2B',
  textMuted: '#5A6B80',

  // Brand: deep + premium
  accent: palettes.ocean.light.accent,
  accentMuted: palettes.ocean.light.accentMuted,
  accentSoft: palettes.ocean.light.accentSoft,

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

  accent: palettes.ocean.dark.accent,
  accentMuted: palettes.ocean.dark.accentMuted,
  accentSoft: palettes.ocean.dark.accentSoft,

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

const buildTheme = (colors, isDark, responsive) => {
  const elevation = createElevation(isDark);

  return {
    colors,
    spacing: responsive.spacing,
    radius: responsive.radius,
    typography: responsive.typography,
    elevation,
    motion,
    responsive,
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
  theme: buildTheme(lightColors, false, {
    width: 0,
    height: 0,
    uiScale: 1,
    breakpoint: 'phone',
    spacing: baseSpacing,
    radius: baseRadius,
    typography: baseTypography,
  }),
  isDark: false,
  accentKey: 'ocean',
  setAccentKey: async () => {},
  toggleTheme: () => {},
  backgroundStyle: null,
});

export const ThemeProvider = ({ children }) => {
  const systemPreference = useColorScheme();
  const { width, height } = useWindowDimensions();
  const [isDark, setIsDark] = useState(systemPreference === 'dark');
  const [accentKey, setAccentKeyState] = useState('ocean');

  useEffect(() => {
    const loadPrefs = async () => {
      const prefs = await secureStore.getJsonItemAsync(THEME_PREFS_KEY);
      const savedKey = prefs?.accentKey;

      // Migrate old keys → new premium palette names
      const migratedKey =
        savedKey === 'blue'
          ? 'ocean'
          : savedKey === 'emerald'
          ? 'forest'
          : savedKey === 'wine'
          ? 'ember'
          : savedKey === 'purple'
          ? 'amethyst'
          : savedKey;

      if (migratedKey && palettes[migratedKey]) {
        setAccentKeyState(migratedKey);
        if (migratedKey !== savedKey) {
          await secureStore.mergeJsonItemAsync(THEME_PREFS_KEY, { accentKey: migratedKey });
        }
      }
    };
    loadPrefs();
  }, []);

  const setAccentKey = async (nextKey) => {
    if (!palettes[nextKey]) return;
    setAccentKeyState(nextKey);
    await secureStore.mergeJsonItemAsync(THEME_PREFS_KEY, { accentKey: nextKey });
  };

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const theme = useMemo(() => {
    const base = isDark ? darkColors : lightColors;
    const palette = palettes[accentKey] || palettes.ocean;
    const accentPatch = isDark ? palette.dark : palette.light;

    const uiScale = getUiScale({ width, height });
    const breakpoint = getBreakpoint({ width, height });

    const responsive = {
      width,
      height,
      uiScale,
      breakpoint,
      spacing: createResponsiveSpacing(baseSpacing, uiScale),
      radius: createResponsiveRadius(baseRadius, uiScale),
      typography: createResponsiveTypography(baseTypography, uiScale),
    };

    return buildTheme({ ...base, ...accentPatch }, isDark, responsive);
  }, [isDark, accentKey, width, height]);

  // Premium background: subtle tint + overlay for readability.
  // We keep the base `colors.background` intact for existing components,
  // but expose `backgroundStyle` for AppScreen to render behind everything.
  const backgroundStyle = useMemo(() => {
    const palette = palettes[accentKey] || palettes.ocean;

    const tint = isDark ? palette.dark.accentSoft : palette.light.accentSoft;
    // Keep this low so the accent tint is actually visible.
    // AppScreen already uses `colors.background` as the base fill.
    const overlay = isDark ? 'rgba(8, 16, 28, 0.18)' : 'rgba(246, 248, 255, 0.18)';

    return {
      tint,
      overlay,
    };
  }, [isDark, accentKey]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, accentKey, setAccentKey, toggleTheme, backgroundStyle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
