import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme, useWindowDimensions } from 'react-native';
import * as secureStore from '../storage/secureStore';
import {
  createResponsiveRadius,
  createResponsiveSpacing,
  createResponsiveTypography,
  getBreakpoint,
  getUiScale,
} from '../ui/foundation/responsive';
import { createElevation, motion, radius as baseRadius, spacing as baseSpacing } from '../ui/foundation/tokens';
import { typography as baseTypography } from '../ui/foundation/typography';

const THEME_PREFS_KEY = 'allison_theme_prefs';

const palettes = {
  ocean: {
    label: 'Ocean (Default)',
    light: {
      accent: '#014390',
      accentMuted: '#ADC6FF',
      accentSoft: 'rgba(1, 67, 144, 0.12)',
    },
    dark: {
      accent: '#ADC6FF',
      accentMuted: '#4B76BE',
      accentSoft: 'rgba(173, 198, 255, 0.18)',
    },
  },
  forest: {
    label: 'Forest',
    light: {
      accent: '#005111',
      accentMuted: '#88D982',
      accentSoft: 'rgba(0, 81, 17, 0.12)',
    },
    dark: {
      accent: '#97E990',
      accentMuted: '#3E7D45',
      accentSoft: 'rgba(151, 233, 144, 0.18)',
    },
  },
  ember: {
    label: 'Ember',
    light: {
      accent: '#8E2A2A',
      accentMuted: '#F2CACA',
      accentSoft: 'rgba(142, 42, 42, 0.14)',
    },
    dark: {
      accent: '#FFB4AB',
      accentMuted: '#6E3A35',
      accentSoft: 'rgba(255, 180, 171, 0.2)',
    },
  },
  amethyst: {
    label: 'Amethyst',
    light: {
      accent: '#5A3FA8',
      accentMuted: '#D8CCF9',
      accentSoft: 'rgba(90, 63, 168, 0.14)',
    },
    dark: {
      accent: '#CFBDFF',
      accentMuted: '#5B4E8D',
      accentSoft: 'rgba(207, 189, 255, 0.2)',
    },
  },
};

const lightColors = {
  background: '#F8F9FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F2F4F6',
  surfaceHigh: '#E6E8EA',
  surfaceHighest: '#E0E3E5',
  surfaceDim: '#D8DADC',
  text: '#191C1E',
  textMuted: '#434751',
  textSubtle: '#737782',
  accent: palettes.ocean.light.accent,
  accentMuted: palettes.ocean.light.accentMuted,
  accentSoft: palettes.ocean.light.accentSoft,
  mint: '#196B22',
  mintSoft: 'rgba(25, 107, 34, 0.14)',
  amber: '#A66600',
  amberSoft: 'rgba(166, 102, 0, 0.14)',
  pink: '#A33F69',
  pinkSoft: 'rgba(163, 63, 105, 0.14)',
  border: '#C3C6D3',
  success: '#196B22',
  danger: '#BA1A1A',
  warning: '#A66600',
  overlay: 'rgba(25, 28, 30, 0.42)',
};

const darkColors = {
  background: '#0D1217',
  surface: '#151C23',
  surfaceMuted: '#1C2530',
  surfaceHigh: '#283445',
  surfaceHighest: '#314054',
  surfaceDim: '#08101C',
  text: '#E9EDF1',
  textMuted: '#B6C0CC',
  textSubtle: '#8D98A6',
  accent: palettes.ocean.dark.accent,
  accentMuted: palettes.ocean.dark.accentMuted,
  accentSoft: palettes.ocean.dark.accentSoft,
  mint: '#97E990',
  mintSoft: 'rgba(151, 233, 144, 0.2)',
  amber: '#FFC776',
  amberSoft: 'rgba(255, 199, 118, 0.2)',
  pink: '#FFB8D5',
  pinkSoft: 'rgba(255, 184, 213, 0.2)',
  border: '#3A4658',
  success: '#97E990',
  danger: '#FFB4AB',
  warning: '#FFC776',
  overlay: 'rgba(1, 4, 8, 0.68)',
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
      background: isDark ? ['#0D1217', '#1C2530'] : ['#F8F9FB', '#EEF2F6'],
      hero: isDark ? ['#1C2530', '#151C23'] : ['#FFFFFF', '#F2F4F6'],
      accent: isDark ? ['#CFDCFF', '#ADC6FF'] : ['#2B5BA9', '#014390'],
      success: isDark ? ['#97E990', '#5EBB65'] : ['#196B22', '#2D8A3D'],
      candy: isDark ? ['#CFBDFF', '#ADC6FF'] : ['#5A3FA8', '#2B5BA9'],
    },

    // Compatibility aliases used across existing screens.
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
    const selectedPalette = isDark ? palette.dark : palette.light;

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

    return buildTheme(
      {
        ...base,
        accent: selectedPalette.accent,
        accentMuted: selectedPalette.accentMuted,
        accentSoft: selectedPalette.accentSoft,
      },
      isDark,
      responsive
    );
  }, [isDark, accentKey, width, height]);

  const backgroundStyle = useMemo(() => {
    const palette = palettes[accentKey] || palettes.ocean;
    return {
      tint: isDark ? palette.dark.accentSoft : palette.light.accentSoft,
      overlay: isDark ? 'rgba(8, 16, 28, 0.22)' : 'rgba(248, 249, 251, 0.16)',
    };
  }, [isDark, accentKey]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, accentKey, setAccentKey, toggleTheme, backgroundStyle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
