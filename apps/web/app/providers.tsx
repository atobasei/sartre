'use client';

import { Prototype, settingsFromParams, settingsToParams, type Nav, type PrototypeSettings } from '@sartre/app';
import { HttpBookProvider } from '@sartre/data';
import { createBackend, DEMO_OPTIONS, type Backend } from '@sartre/firebase';
import { themes } from '@sartre/tokens';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, type ReactNode } from 'react';

const liveProvider = new HttpBookProvider('/api/books');

// Without a real project configured, use the demo project on the local emulators
// (`pnpm emulators`). Env vars must be referenced literally for Next to inline them.
let backend: Backend | undefined;
const getBackend = () =>
  (backend ??= createBackend(
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      ? {
          options: {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          },
        }
      : { options: DEMO_OPTIONS, emulatorHost: '127.0.0.1' },
  ));

/** Web adapter: Next router for navigation, prototype settings in the URL query. */
export function WebPrototype({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const settings = useMemo(() => settingsFromParams((k) => params.get(k)), [params]);

  // Keep prototype settings (volume, theme, …) when moving between pages.
  const withSettings = useCallback(
    (href: string) => {
      const query = settingsToParams(settings).toString();
      if (!query) return href;
      return href + (href.includes('?') ? '&' : '?') + query;
    },
    [settings],
  );

  const nav = useMemo<Nav>(
    () => ({
      push: (href) => router.push(withSettings(href)),
      replace: (href) => router.replace(withSettings(href)),
      back: () => router.back(),
    }),
    [router, withSettings],
  );

  const onSettingsChange = useCallback(
    (patch: Partial<PrototypeSettings>) => {
      const next = settingsToParams({ ...settings, ...patch });
      // Keep the one page-level param we use (re-rank flow) intact.
      const rerank = params.get('rerank');
      if (rerank) next.set('rerank', rerank);
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [settings, params, pathname, router],
  );

  // Page background follows the theme (also covers overscroll areas).
  useEffect(() => {
    const t = themes[settings.theme];
    document.documentElement.style.background = t.colors.bg;
    document.documentElement.style.colorScheme = t.scheme;
  }, [settings.theme]);

  return (
    <Prototype nav={nav} settings={settings} onSettingsChange={onSettingsChange} liveProvider={liveProvider} getBackend={getBackend}>
      {children}
    </Prototype>
  );
}
