import { catalog } from '@sartre/mock';
import type { BookProvider, EditionResult, SearchOptions, WorkResult } from './provider';

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/** Offline provider over the fixture catalog, with a small artificial delay. */
export class MockBookProvider implements BookProvider {
  readonly id = 'mock' as const;

  constructor(private readonly delayMs = 250) {}

  async search(query: string, { limit = 12, signal }: SearchOptions = {}): Promise<WorkResult[]> {
    await this.wait(signal);
    const q = normalize(query.trim());
    if (!q) return [];
    return Object.values(catalog)
      .filter(({ book }) => normalize(`${book.title} ${book.authors.map((a) => a.name).join(' ')}`).includes(q))
      .slice(0, limit)
      .map(({ book, edition }) => ({
        provider: this.id,
        externalWorkId: book.external.olWorkId ?? book.id,
        title: book.title,
        authors: book.authors.map((a) => a.name),
        firstPublishYear: book.firstPublishYear,
        coverId: book.coverId,
        pagesMedian: edition.pageCount,
        editionCount: 1,
      }));
  }

  async getEditions(externalWorkId: string, { signal }: SearchOptions = {}): Promise<EditionResult[]> {
    await this.wait(signal);
    const hit = Object.values(catalog).find(({ book }) => book.external.olWorkId === externalWorkId);
    if (!hit) return [];
    const { book, edition } = hit;
    return [
      {
        provider: this.id,
        externalEditionId: edition.external.olEditionId ?? edition.id,
        title: book.title,
        pageCount: edition.pageCount,
        coverId: edition.coverId,
        format: 'Paperback',
        language: 'eng',
      },
    ];
  }

  private wait(signal?: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, this.delayMs);
      signal?.addEventListener('abort', () => {
        clearTimeout(t);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  }
}
