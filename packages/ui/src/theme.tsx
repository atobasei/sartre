import { defaultTheme, themes, type Theme, type ThemeName } from '@sartre/tokens';
import { createContext, useContext, type ReactNode } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

/** RN 0.88's generated types no longer export StyleSheet.NamedStyles. */
export type NamedStyles<T> = { [K in keyof T]: ViewStyle | TextStyle | ImageStyle };

const ThemeContext = createContext<Theme>(themes[defaultTheme]);

export function ThemeProvider({ name, children }: { name: ThemeName; children: ReactNode }) {
  return <ThemeContext.Provider value={themes[name]}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/**
 * Themed StyleSheet factory. Sheets are created once per theme and cached,
 * so switching themes is a lookup, not a re-render storm of new style objects.
 *
 *   const useStyles = makeStyles((t) => ({ root: { backgroundColor: t.colors.bg } }));
 */
export function makeStyles<T extends NamedStyles<T>>(factory: (theme: Theme) => T & NamedStyles<T>) {
  const cache = new Map<string, T>();
  return function useStyles(): T {
    const theme = useTheme();
    let sheet = cache.get(theme.name);
    if (!sheet) {
      sheet = StyleSheet.create(factory(theme)) as T;
      cache.set(theme.name, sheet);
    }
    return sheet;
  };
}
