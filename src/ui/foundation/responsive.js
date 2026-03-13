import { Platform } from 'react-native';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Breakpoints are based on the *shortest* screen dimension so orientation changes behave predictably.
 * - phone: < 600
 * - tablet: 600 - 1023
 * - desktop: >= 1024 (mostly web)
 */
export const getBreakpoint = ({ width, height }) => {
  const short = Math.min(width || 0, height || 0);

  if (short >= 1024) return 'desktop';
  if (short >= 600) return 'tablet';
  return 'phone';
};

/**
 * Returns a density that scales UI tokens (spacing / typography / radius).
 * We keep this conservative to avoid huge jumps.
 */
export const getUiScale = ({ width, height }) => {
  const bp = getBreakpoint({ width, height });

  // Slightly different feel on web desktop (more breathing room).
  if (bp === 'desktop') {
    return Platform.OS === 'web' ? 1.18 : 1.12;
  }
  if (bp === 'tablet') return 1.08;

  // Phone: slightly tighter to prevent clipping.
  return 0.95;
};

export const scaleNumber = (value, scale, { min, max } = {}) => {
  const scaled = value * scale;
  if (typeof min === 'number' || typeof max === 'number') {
    return clamp(scaled, min ?? -Infinity, max ?? Infinity);
  }
  return scaled;
};

export const createResponsiveSpacing = (base, scale) => {
  const round = (n) => Math.round(n);
  return {
    xxs: round(scaleNumber(base.xxs, scale, { min: 2, max: 8 })),
    xs: round(scaleNumber(base.xs, scale, { min: 6, max: 12 })),
    sm: round(scaleNumber(base.sm, scale, { min: 10, max: 18 })),
    md: round(scaleNumber(base.md, scale, { min: 12, max: 22 })),
    lg: round(scaleNumber(base.lg, scale, { min: 16, max: 28 })),
    xl: round(scaleNumber(base.xl, scale, { min: 18, max: 34 })),
    xxl: round(scaleNumber(base.xxl, scale, { min: 24, max: 44 })),
    xxxl: round(scaleNumber(base.xxxl, scale, { min: 32, max: 56 })),
  };
};

export const createResponsiveRadius = (base, scale) => {
  const round = (n) => Math.round(n);
  return {
    sm: round(scaleNumber(base.sm, scale, { min: 6, max: 12 })),
    md: round(scaleNumber(base.md, scale, { min: 8, max: 16 })),
    lg: round(scaleNumber(base.lg, scale, { min: 12, max: 20 })),
    xl: round(scaleNumber(base.xl, scale, { min: 16, max: 28 })),
    pill: base.pill,
  };
};

export const createResponsiveTypography = (base, scale) => {
  const round = (n) => Math.round(n);

  const scaleText = (t, { minSize, maxSize } = {}) => ({
    ...t,
    fontSize: round(scaleNumber(t.fontSize, scale, { min: minSize, max: maxSize })),
    lineHeight: round(scaleNumber(t.lineHeight, scale, { min: minSize ? minSize + 4 : undefined, max: maxSize ? maxSize + 10 : undefined })),
  });

  return {
    display: scaleText(base.display, { minSize: 32, maxSize: 48 }),
    h1: scaleText(base.h1, { minSize: 24, maxSize: 38 }),
    h2: scaleText(base.h2, { minSize: 20, maxSize: 30 }),
    h3: scaleText(base.h3, { minSize: 18, maxSize: 26 }),
    subtitle: scaleText(base.subtitle, { minSize: 14, maxSize: 20 }),
    body: scaleText(base.body, { minSize: 14, maxSize: 20 }),
    bodySmall: scaleText(base.bodySmall, { minSize: 12, maxSize: 18 }),
    label: scaleText(base.label, { minSize: 12, maxSize: 18 }),
    caption: scaleText(base.caption, { minSize: 11, maxSize: 16 }),
  };
};
