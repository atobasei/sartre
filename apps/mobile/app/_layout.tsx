import { DEFAULT_SETTINGS, Prototype, type Nav, type PrototypeSettings } from '@sartre/app';
import { HttpBookProvider } from '@sartre/data';
import { Slot, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

// Book search goes through the web app's /api/books proxy (never straight to
// Open Library from devices). Point this at your dev machine's LAN IP on a phone.
const liveProvider = new HttpBookProvider(`${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'}/api/books`);

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
      <Prototype nav={nav} settings={settings} onSettingsChange={update} liveProvider={liveProvider}>
        <Slot />
      </Prototype>
    </SafeAreaView>
  );
}
