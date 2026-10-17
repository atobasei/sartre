import { fonts } from './fonts';

// 4px grid.
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
  8: 64,
  9: 96,
} as const;

export const radius = {
  /** Book covers: books have nearly square corners. */
  cover: 3,
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export interface TextStyleToken {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight?: '400' | '500' | '600' | '700';
  letterSpacing?: number;
  textTransform?: 'uppercase';
}

// Display serif for titles and big moments, sans for UI, mono for numbers
// (stats read as data, Monkeytype-style).
export const type = {
  hero: { fontFamily: fonts.display, fontSize: 56, lineHeight: 60, fontWeight: '500', letterSpacing: -1.2 },
  display: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46, fontWeight: '500', letterSpacing: -0.8 },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, fontWeight: '500', letterSpacing: -0.4 },
  heading: { fontFamily: fonts.display, fontSize: 20, lineHeight: 26, fontWeight: '500' },
  body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, fontWeight: '600' },
  small: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, fontWeight: '400' },
  label: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 1.1, textTransform: 'uppercase' },
  statXL: { fontFamily: fonts.mono, fontSize: 64, lineHeight: 68, fontWeight: '500', letterSpacing: -2 },
  stat: { fontFamily: fonts.mono, fontSize: 32, lineHeight: 36, fontWeight: '500', letterSpacing: -0.8 },
  mono: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 18, fontWeight: '400' },
} as const satisfies Record<string, TextStyleToken>;

export type TypeVariant = keyof typeof type;

/** Cover widths; height is always width × 1.5 (2:3). */
export const coverSize = {
  xs: 36,
  sm: 56,
  md: 88,
  lg: 132,
  xl: 200,
} as const;

export type CoverSize = keyof typeof coverSize;
export const COVER_ASPECT = 1.5;

export const layout = {
  /** Max content width for profile pages on desktop. */
  maxWidth: 880,
  gutter: 16,
} as const;
