'use client';

import { Prototype, settingsFromParams, settingsToParams, type Nav, type PrototypeSettings } from '@sartre/app';
import { HttpBookProvider } from '@sartre/data';
import { themes } from '@sartre/tokens';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, type ReactNode } from 'react';

const liveProvider = new HttpBookProvider('/api/books');

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
    <Prototype nav={nav} settings={settings} onSettingsChange={onSettingsChange} liveProvider={liveProvider}>
      {children}
    </Prototype>
  );
}
