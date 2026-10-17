// Monkeytype-style selectable themes. Every color in the UI comes from one of
// these semantic slots; components never hard-code hex values.

export interface ThemeColors {
  /** Page background. */
  bg: string;
  /** Cards, sheets, inputs. */
  surface: string;
  /** Hover / pressed surface, subtle fills (timeline dots, progress track). */
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  /** Text/icons placed on top of `accent`. */
  onAccent: string;
  loved: string;
  liked: string;
  meh: string;
  /** Backgrounds for the typographic fallback cover, picked per-book by hash. */
  coverTints: readonly string[];
  /** Ink color on the fallback cover. */
  coverInk: string;
}

export interface Theme {
  name: ThemeName;
  label: string;
  scheme: 'light' | 'dark';
  colors: ThemeColors;
}

export type ThemeName = 'paper' | 'ink' | 'serika' | 'moss';

export const themes: Record<ThemeName, Theme> = {
  paper: {
    name: 'paper',
    label: 'Paper',
    scheme: 'light',
    colors: {
      bg: '#F3EEE4',
      surface: '#FBF8F2',
      surfaceAlt: '#E9E2D4',
      border: '#DED4C2',
      text: '#221E18',
      textMuted: '#6B6253',
      textFaint: '#A3998A',
      accent: '#A8432A',
      onAccent: '#FBF8F2',
      loved: '#A8432A',
      liked: '#8A6D3B',
      meh: '#8C877D',
      coverTints: ['#D9CBB0', '#C9B79C', '#BFC6B4', '#D6BFB0', '#C4C0B4'],
      coverInk: '#2A241C',
    },
  },
  ink: {
    name: 'ink',
    label: 'Ink',
    scheme: 'dark',
    colors: {
      bg: '#101113',
      surface: '#18191C',
      surfaceAlt: '#232428',
      border: '#2A2C31',
      text: '#ECE9E2',
      textMuted: '#9A978F',
      textFaint: '#5E5C57',
      accent: '#E8C27A',
      onAccent: '#101113',
      loved: '#E8C27A',
      liked: '#9DB4A0',
      meh: '#6F6E6A',
      coverTints: ['#2B2A30', '#31302B', '#2A3130', '#33292B', '#2C2D33'],
      coverInk: '#D8D3C8',
    },
  },
  serika: {
    name: 'serika',
    label: 'Serika',
    scheme: 'dark',
    colors: {
      bg: '#323437',
      surface: '#2C2E31',
      surfaceAlt: '#3A3C40',
      border: '#43464A',
      text: '#D1D0C5',
      textMuted: '#8A8C8F',
      textFaint: '#646669',
      accent: '#E2B714',
      onAccent: '#323437',
      loved: '#E2B714',
      liked: '#D1D0C5',
      meh: '#646669',
      coverTints: ['#3F4145', '#46443C', '#3C4441', '#463E3E', '#40414A'],
      coverInk: '#D1D0C5',
    },
  },
  moss: {
    name: 'moss',
    label: 'Moss',
    scheme: 'dark',
    colors: {
      bg: '#13201A',
      surface: '#1A2A23',
      surfaceAlt: '#22352C',
      border: '#2B4036',
      text: '#E5EDE3',
      textMuted: '#93A79A',
      textFaint: '#5D7266',
      accent: '#C9D77E',
      onAccent: '#13201A',
      loved: '#C9D77E',
      liked: '#8FB8A2',
      meh: '#5F7569',
      coverTints: ['#24382E', '#2E3A2A', '#26353A', '#33362B', '#2A3331'],
      coverInk: '#DCE6D8',
    },
  },
};

export const themeNames = Object.keys(themes) as ThemeName[];
export const defaultTheme: ThemeName = 'paper';

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === 'string' && value in themes;
}
