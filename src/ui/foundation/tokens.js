export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const motion = {
  fast: 120,
  normal: 220,
  slow: 320,
};

export const createElevation = (isDark) => {
  const shadowColor = '#000000';

  return {
    low: {
      elevation: 2,
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.28 : 0.12,
      shadowRadius: 2,
    },
    medium: {
      elevation: 6,
      shadowColor,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.34 : 0.18,
      shadowRadius: 6,
    },
    high: {
      elevation: 12,
      shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.4 : 0.22,
      shadowRadius: 14,
    },
  };
};
