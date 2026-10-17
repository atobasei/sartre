import { OpenLibraryProvider } from '@sartre/data';

// Server-only Open Library client behind /api/books. Open Library asks clients to
// identify themselves; set OPEN_LIBRARY_CONTACT (an email or URL) before deploying.
const contact = process.env.OPEN_LIBRARY_CONTACT;

export const openLibrary = new OpenLibraryProvider({
  userAgent: `Sartre/0.1${contact ? ` (${contact})` : ''}`,
});

// Small per-instance cache so typing and back/forward don't re-hit Open Library.
// Vercel's CDN caches responses too (see Cache-Control in the route handlers).
const TTL_MS = 60 * 60 * 1000;
const MAX_ENTRIES = 500;
const cache = new Map<string, { at: number; value: unknown }>();

export async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value!);
  return value;
}

export const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' };
