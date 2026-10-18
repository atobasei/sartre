import { DEFAULT_SETTINGS, Prototype, type Nav, type PrototypeSettings } from '@sartre/app';
import { HttpBookProvider } from '@sartre/data';
import { createBackend, DEMO_OPTIONS, type Backend } from '@sartre/firebase';
import { Slot, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

// Book search goes through the web app's /api/books proxy (never straight to
// Open Library from devices). Point this at your dev machine's LAN IP on a phone.
const liveProvider = new HttpBookProvider(`${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'}/api/books`);

// Same fallback as web: the demo project on the emulators. On a phone, set
// EXPO_PUBLIC_FIREBASE_EMULATOR_HOST to your machine's LAN IP.
let backend: Backend | undefined;
const getBackend = () =>
  (backend ??= createBackend(
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
      ? {
          options: {
            apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
            appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
          },
        }
      : { options: DEMO_OPTIONS, emulatorHost: process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || '127.0.0.1' },
  ));

/** Native adapter: Expo Router for navigation, prototype settings in memory. */
export default function RootLayout() {
  const router = useRouter();
  const [settings, setSettings] = useState<PrototypeSettings>(DEFAULT_SETTINGS);
  const update = useCallback((patch: Partial<PrototypeSettings>) => setSettings((s) => ({ ...s, ...patch })), []);
  const nav = useMemo<Nav>(
    () => ({
      push: (href) => router.push(href as never),
      replace: (href) => router.replace(href as never),
      back: () => router.back(),
    }),
    [router],
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Prototype nav={nav} settings={settings} onSettingsChange={update} liveProvider={liveProvider} getBackend={getBackend}>
        <Slot />
      </Prototype>
    </SafeAreaView>
  );
}
