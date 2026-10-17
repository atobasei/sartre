import type { BookProvider, EditionResult, SearchOptions, WorkResult } from './provider';

// Open Library: free, no key. Asks clients to send an identifying User-Agent and
// keep request rates low, so this runs server-side behind our /api/books proxy
// (which caches) rather than from every browser.

export interface OpenLibraryOptions {
  userAgent: string;
  baseUrl?: string;
  fetch?: typeof fetch;
}

interface OLSearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  edition_count?: number;
  number_of_pages_median?: number;
}

interface OLEdition {
  key: string;
  title: string;
  number_of_pages?: number;
  publishers?: string[];
  publish_date?: string;
  isbn_13?: string[];
  covers?: number[];
  physical_format?: string;
  languages?: { key: string }[];
}

const SEARCH_FIELDS = 'key,title,author_name,first_publish_year,cover_i,edition_count,number_of_pages_median';

export class OpenLibraryProvider implements BookProvider {
  readonly id = 'openlibrary' as const;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: OpenLibraryOptions) {
    this.baseUrl = options.baseUrl ?? 'https://openlibrary.org';
    this.fetchImpl = options.fetch ?? fetch;
  }

  async search(query: string, { limit = 12, signal }: SearchOptions = {}): Promise<WorkResult[]> {
    const url = new URL('/search.json', this.baseUrl);
    url.searchParams.set('q', query);
    url.searchParams.set('fields', SEARCH_FIELDS);
    url.searchParams.set('limit', String(limit));
    const json = await this.get<{ docs: OLSearchDoc[] }>(url, signal);
    return json.docs.map((d) => ({
      provider: this.id,
      externalWorkId: d.key.replace('/works/', ''),
      title: d.title,
      authors: d.author_name ?? [],
      firstPublishYear: d.first_publish_year,
      coverId: positive(d.cover_i),
      editionCount: d.edition_count,
      pagesMedian: d.number_of_pages_median,
    }));
  }

  async getEditions(externalWorkId: string, { limit = 40, signal }: SearchOptions = {}): Promise<EditionResult[]> {
    const url = new URL(`/works/${encodeURIComponent(externalWorkId)}/editions.json`, this.baseUrl);
    url.searchParams.set('limit', String(limit));
    const json = await this.get<{ entries: OLEdition[] }>(url, signal);
    return json.entries.map((e) => ({
      provider: this.id,
      externalEditionId: e.key.replace('/books/', ''),
      title: e.title,
      pageCount: e.number_of_pages,
      publisher: e.publishers?.[0],
      publishYear: parseYear(e.publish_date),
      isbn13: e.isbn_13,
      coverId: positive(e.covers?.[0]),
      format: e.physical_format,
      language: e.languages?.[0]?.key.replace('/languages/', ''),
    }));
  }

  private async get<T>(url: URL, signal?: AbortSignal): Promise<T> {
    const res = await this.fetchImpl(url, { headers: { 'User-Agent': this.options.userAgent }, signal });
    if (!res.ok) throw new Error(`Open Library ${res.status} for ${url.pathname}`);
    return (await res.json()) as T;
  }
}

/** OL uses -1 for "no cover" in some edition records. */
function positive(n: number | undefined): number | undefined {
  return n !== undefined && n > 0 ? n : undefined;
}

function parseYear(date: string | undefined): number | undefined {
  const m = date?.match(/\b(1[5-9]\d\d|20\d\d)\b/);
  return m ? Number(m[1]) : undefined;
}

/**
 * Order editions for the picker: ones we can actually use (page count, cover) first,
 * the user's language first, then newest.
 */
export function rankEditions(editions: EditionResult[], language = 'eng'): EditionResult[] {
  const score = (e: EditionResult) =>
    (e.pageCount ? 4 : 0) + (e.coverId ? 2 : 0) + (e.language === language ? 3 : e.language ? -3 : 0);
  return [...editions].sort((a, b) => score(b) - score(a) || (b.publishYear ?? 0) - (a.publishYear ?? 0));
}
