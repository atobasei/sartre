import { describe, expect, it } from 'vitest';
import { OpenLibraryProvider, rankEditions } from './openLibrary';
import type { EditionResult } from './provider';

function stubFetch(body: unknown) {
  const calls: { url: string; headers: Record<string, string> }[] = [];
  const fetch = (async (url: URL, init?: RequestInit) => {
    calls.push({ url: String(url), headers: init?.headers as Record<string, string> });
    return new Response(JSON.stringify(body), { status: 200 });
  }) as unknown as typeof globalThis.fetch;
  return { fetch, calls };
}

describe('OpenLibraryProvider', () => {
  it('normalizes search docs and identifies itself', async () => {
    const { fetch, calls } = stubFetch({
      docs: [
        { key: '/works/OL3511459W', title: 'Stoner', author_name: ['John Williams'], cover_i: 8310729, first_publish_year: 1965, edition_count: 49 },
        { key: '/works/OL1W', title: 'No cover', cover_i: -1 },
      ],
    });
    const ol = new OpenLibraryProvider({ userAgent: 'Sartre/test', fetch });
    const [stoner, bare] = await ol.search('stoner');

    expect(stoner).toMatchObject({ provider: 'openlibrary', externalWorkId: 'OL3511459W', coverId: 8310729, authors: ['John Williams'] });
    expect(bare?.coverId).toBeUndefined();
    expect(bare?.authors).toEqual([]);
    expect(calls[0]?.headers['User-Agent']).toBe('Sartre/test');
    expect(calls[0]?.url).toContain('q=stoner');
  });

  it('normalizes editions', async () => {
    const { fetch } = stubFetch({
      entries: [
        { key: '/books/OL1M', title: 'Stoner', number_of_pages: 336, publishers: ['NYRB'], publish_date: 'March 2015', covers: [-1], languages: [{ key: '/languages/eng' }] },
      ],
    });
    const [e] = await new OpenLibraryProvider({ userAgent: 'x', fetch }).getEditions('OL3511459W');
    expect(e).toMatchObject({ externalEditionId: 'OL1M', pageCount: 336, publisher: 'NYRB', publishYear: 2015, language: 'eng' });
    expect(e?.coverId).toBeUndefined();
  });
});

describe('rankEditions', () => {
  const ed = (id: string, extra: Partial<EditionResult>): EditionResult => ({ provider: 'openlibrary', externalEditionId: id, title: 't', ...extra });

  it('prefers usable editions in the reader’s language, newest first', () => {
    const ranked = rankEditions([
      ed('foreign', { pageCount: 300, coverId: 1, language: 'tur', publishYear: 2023 }),
      ed('bare', {}),
      ed('old', { pageCount: 280, coverId: 2, language: 'eng', publishYear: 1990 }),
      ed('new', { pageCount: 336, coverId: 3, language: 'eng', publishYear: 2015 }),
    ]);
    expect(ranked.map((e) => e.externalEditionId)).toEqual(['new', 'old', 'foreign', 'bare']);
  });
});
