import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions, type ScaledSize } from 'react-native';

// On web the server has no window, so useWindowDimensions() renders 0×0 during SSR
// and the hydrated tree keeps that layout. Report a fixed desktop size until after
// hydration, then the real one. Native has real dimensions from the first frame.
const SSR_SIZE = { width: 1280, height: 800, scale: 1, fontScale: 1 } satisfies ScaledSize;

export function useViewport(): ScaledSize {
  const dims = useWindowDimensions();
  const [hydrated, setHydrated] = useState(Platform.OS !== 'web');
  useEffect(() => setHydrated(true), []);
  return hydrated ? dims : SSR_SIZE;
}
