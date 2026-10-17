'use client';

import { useServerInsertedHTML } from 'next/navigation';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

// react-native-web generates atomic CSS at runtime. During SSR, flush it into the
// HTML so server-rendered pages arrive styled instead of flashing until hydration.
const getSheet = (StyleSheet as unknown as { getSheet: () => { id: string; textContent: string } }).getSheet;

export function StyleRegistry({ children }: { children: ReactNode }) {
  useServerInsertedHTML(() => {
    const sheet = getSheet();
    return <style id={sheet.id} dangerouslySetInnerHTML={{ __html: sheet.textContent }} />;
  });
  return <>{children}</>;
}
