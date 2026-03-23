export const spacing = {
  xxs: 4,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  xxxl: 40,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 9999,
};

export const motion = {
  fast: 140,
  normal: 240,
  slow: 360,
};

export const createElevation = (isDark) => {
  const shadowColor = '#000000';

  return {
    low: {
      elevation: 2,
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.22 : 0.08,
      shadowRadius: 3,
    },
    medium: {
      elevation: 6,
      shadowColor,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.3 : 0.13,
      shadowRadius: 8,
    },
    high: {
      elevation: 12,
      shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.38 : 0.18,
      shadowRadius: 16,
    },
  };
};
