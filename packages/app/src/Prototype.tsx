import type { Profile, ProfilePatch } from '@sartre/core';
import type { BookProvider } from '@sartre/data';
import { MockBookProvider } from '@sartre/data';
import type { Backend } from '@sartre/firebase';
import { ThemeProvider, Text, useTheme } from '@sartre/ui';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { AppShell } from './AppShell';
import { AuthFrame } from './components/AuthFrame';
import { NavProvider, type Nav } from './nav';
import { SignInScreen } from './screens/SignInScreen';
import { UsernameScreen } from './screens/UsernameScreen';
import { VerifyEmailScreen } from './screens/VerifyEmailScreen';
import { SessionProvider, useSession } from './session';
import { SettingsProvider, type PrototypeSettings } from './settings';
import { emptyLibrary, LibraryProvider } from './store';

/**
 * Everything a platform needs to mount the shared screens: its router, the
 * current prototype settings, a live book provider (our /api/books proxy), and
 * a Firebase backend for `data=firebase` (created lazily, client-side).
 */
export function Prototype({
  nav,
  settings,
  onSettingsChange,
  liveProvider,
  getBackend,
  children,
}: {
  nav: Nav;
  settings: PrototypeSettings;
  onSettingsChange: (patch: Partial<PrototypeSettings>) => void;
  liveProvider: BookProvider;
  getBackend: () => Backend;
  children: ReactNode;
}) {
  const mock = useMemo(() => new MockBookProvider(), []);
  const provider = settings.search === 'live' ? liveProvider : mock;
  const settingsValue = useMemo(() => ({ settings, update: onSettingsChange }), [settings, onSettingsChange]);

  return (
    <NavProvider nav={nav}>
      <SettingsProvider value={settingsValue}>
        <ThemeProvider name={settings.theme}>
          {settings.data === 'firebase' ? (
            <SessionProvider getBackend={getBackend}>
              <SessionGate provider={provider}>{children}</SessionGate>
            </SessionProvider>
          ) : (
            <LibraryProvider key={settings.volume} volume={settings.volume} provider={provider}>
              <AppShell>{children}</AppShell>
            </LibraryProvider>
          )}
        </ThemeProvider>
      </SettingsProvider>
    </NavProvider>
  );
}

function SessionGate({ provider, children }: { provider: BookProvider; children: ReactNode }) {
  const session = useSession();
  const state = session?.state;
  if (!session || !state || state.status === 'loading') return <Blank />;
  if (state.status === 'error') {
    return (
      <AuthFrame>
        <Text variant="body" tone="muted">
          {state.message}
        </Text>
      </AuthFrame>
    );
  }
  if (state.status === 'signedOut') return <SignInScreen session={session} />;
  if (state.status === 'needsVerification') return <VerifyEmailScreen session={session} user={state.user} />;
  if (state.status === 'needsUsername') return <UsernameScreen session={session} user={state.user} />;
  return (
    <AccountLibrary key={state.profile.uid} backend={session.backend} profile={state.profile} provider={provider}>
      {children}
    </AccountLibrary>
  );
}

function AccountLibrary({
  backend,
  profile,
  provider,
  children,
}: {
  backend: Backend;
  profile: Profile;
  provider: BookProvider;
  children: ReactNode;
}) {
  // Seeded once per account (the caller keys by uid); later edits flow through the store.
  const [seed] = useState(() => emptyLibrary(profile));
  const { uid } = profile;
  const persistProfile = useCallback((patch: ProfilePatch) => backend.saveProfile(uid, patch), [backend, uid]);
  return (
    <LibraryProvider seed={seed} provider={provider} persistProfile={persistProfile}>
      <AppShell>{children}</AppShell>
    </LibraryProvider>
  );
}

function Blank() {
  const { colors } = useTheme();
  return <View style={{ flex: 1, minHeight: '100%', backgroundColor: colors.bg }} />;
}
