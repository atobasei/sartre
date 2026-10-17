import type { BookProvider, EditionResult, ProviderId, SearchOptions, WorkResult } from './provider';

/**
 * Client for our own /api/books proxy. Web and mobile both use this, so neither
 * talks to Open Library or Google directly and the provider can change server-side.
 */
export class HttpBookProvider implements BookProvider {
  constructor(
    private readonly baseUrl: string,
    readonly id: ProviderId = 'openlibrary',
  ) {}

  async search(query: string, { limit, signal }: SearchOptions = {}): Promise<WorkResult[]> {
    const params = new URLSearchParams({ q: query });
    if (limit) params.set('limit', String(limit));
    return this.get(`/search?${params}`, signal);
  }

  async getEditions(externalWorkId: string, { signal }: SearchOptions = {}): Promise<EditionResult[]> {
    return this.get(`/works/${encodeURIComponent(externalWorkId)}/editions`, signal);
  }

  private async get<T>(path: string, signal?: AbortSignal): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, { signal });
    if (!res.ok) throw new Error(`Book search failed (${res.status})`);
    return (await res.json()) as T;
  }
}
