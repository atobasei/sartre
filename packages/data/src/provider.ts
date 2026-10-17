// Book catalog providers. Search results carry provider-specific IDs; they are
// mapped to our own Book/Edition IDs (via externalKeys) only when a user adds a book.
// Nothing outside this package and the catalog cache should see external IDs.

export type ProviderId = 'openlibrary' | 'google' | 'mock';

export interface WorkResult {
  provider: ProviderId;
  /** e.g. "OL20893680W" for Open Library. */
  externalWorkId: string;
  title: string;
  authors: string[];
  firstPublishYear?: number;
  /** Open Library cover ID; always prefer this over ISBN cover URLs (those are rate-limited). */
  coverId?: number;
  editionCount?: number;
  pagesMedian?: number;
}

export interface EditionResult {
  provider: ProviderId;
  externalEditionId: string;
  title: string;
  pageCount?: number;
  publisher?: string;
  publishYear?: number;
  isbn13?: string[];
  coverId?: number;
  format?: string;
  language?: string;
}

export interface SearchOptions {
  limit?: number;
  signal?: AbortSignal;
}

export interface BookProvider {
  readonly id: ProviderId;
  search(query: string, options?: SearchOptions): Promise<WorkResult[]>;
  getEditions(externalWorkId: string, options?: SearchOptions): Promise<EditionResult[]>;
}

export function coverUrl(coverId: number, size: 'S' | 'M' | 'L' = 'M'): string {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}
