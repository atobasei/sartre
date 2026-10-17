import type { BookProvider } from '@sartre/data';
import { MockBookProvider } from '@sartre/data';
import { ThemeProvider } from '@sartre/ui';
import { useMemo, type ReactNode } from 'react';
import { AppShell } from './AppShell';
import { NavProvider, type Nav } from './nav';
import { SettingsProvider, type PrototypeSettings } from './settings';
import { LibraryProvider } from './store';

/**
 * Everything a platform needs to mount the shared screens: its router, the
 * current prototype settings, and a live book provider (our /api/books proxy).
 */
export function Prototype({
  nav,
  settings,
  onSettingsChange,
  liveProvider,
  children,
}: {
  nav: Nav;
  settings: PrototypeSettings;
  onSettingsChange: (patch: Partial<PrototypeSettings>) => void;
  liveProvider: BookProvider;
  children: ReactNode;
}) {
  const mock = useMemo(() => new MockBookProvider(), []);
  const provider = settings.search === 'live' ? liveProvider : mock;
  const settingsValue = useMemo(() => ({ settings, update: onSettingsChange }), [settings, onSettingsChange]);

  return (
    <NavProvider nav={nav}>
      <SettingsProvider value={settingsValue}>
        <ThemeProvider name={settings.theme}>
          <LibraryProvider key={settings.volume} volume={settings.volume} provider={provider}>
            <AppShell>{children}</AppShell>
          </LibraryProvider>
        </ThemeProvider>
      </SettingsProvider>
    </NavProvider>
  );
}
