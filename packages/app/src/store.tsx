import {
  rankOf,
  ulid,
  type Book,
  type Bucket,
  type Completion,
  type Edition,
  type Id,
  type LibraryEntry,
  type Rankings,
} from '@sartre/core';
import type { BookProvider, EditionResult, WorkResult } from '@sartre/data';
import { buildDataset, type MockDataset, type VolumeState } from '@sartre/mock';
import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

// In-memory stand-in for the Firebase repositories. Shapes match the Firestore
// model (books / editions / library / rankings / completions), so screens won't
// change when the backend arrives. State resets when the volume state changes.

export interface Library extends MockDataset {
  /** externalKeys: "ol:work:OL123W" → our book ID. Mirrors the dedupe collection. */
  externalKeys: Map<string, Id>;
}

type Action =
  | { type: 'add'; book: Book; edition: Edition; entry: LibraryEntry }
  | { type: 'rank'; bookId: Id; bucket: Bucket; rankings: Rankings; now: string }
  | { type: 'finish'; bookId: Id; now: string }
  | { type: 'checkin'; bookId: Id; page: number; now: string };

function reducer(state: Library, action: Action): Library {
  switch (action.type) {
    case 'add': {
      const books = new Map(state.books).set(action.book.id, action.book);
      const editions = new Map(state.editions).set(action.edition.id, action.edition);
      const externalKeys = new Map(state.externalKeys);
      if (action.book.external.olWorkId) externalKeys.set(`ol:work:${action.book.external.olWorkId}`, action.book.id);
      const library = [...state.library.filter((e) => e.bookId !== action.book.id), action.entry];
      return { ...state, books, editions, externalKeys, library };
    }
    case 'finish': {
      const library = state.library.map((e): LibraryEntry => {
        if (e.bookId !== action.bookId) return e;
        const reads = [...e.reads];
        const open = reads.findLastIndex((r) => !r.finishedAt);
        if (open >= 0) reads[open] = { ...reads[open]!, finishedAt: action.now };
        else reads.push({ readId: ulid(), editionId: e.editionId, finishedAt: action.now });
        const pageCount = state.editions.get(e.editionId)?.pageCount;
        return { ...e, status: 'finished', reads, currentPage: pageCount ?? e.currentPage, updatedAt: action.now };
      });
      return { ...state, library };
    }
    case 'rank': {
      const entry = state.library.find((e) => e.bookId === action.bookId);
      const library = state.library.map((e) => (e.bookId === action.bookId ? { ...e, bucket: action.bucket } : e));
      // The first ranking after a finish snapshots a completion; a re-rank only moves the book.
      const lastRead = entry?.reads.findLast((r) => r.finishedAt);
      let completions = state.completions;
      if (lastRead?.finishedAt && !completions.some((c) => c.readId === lastRead.readId)) {
        const rank = rankOf(action.rankings, action.bookId)!;
        const completion: Completion = {
          readId: lastRead.readId,
          bookId: action.bookId,
          editionId: lastRead.editionId,
          finishedAt: lastRead.finishedAt,
          pages: state.editions.get(lastRead.editionId)?.pageCount,
          bucketAtTime: action.bucket,
          rankAtTime: rank.position,
          rankTotalAtTime: rank.total,
        };
        completions = [...completions, completion];
      }
      return { ...state, library, rankings: action.rankings, completions };
    }
    case 'checkin': {
      const checkins = [...state.checkins, { id: ulid(), bookId: action.bookId, page: action.page, at: action.now }];
      const library = state.library.map((e) =>
        e.bookId === action.bookId ? { ...e, currentPage: action.page, updatedAt: action.now } : e,
      );
      return { ...state, checkins, library };
    }
  }
}

function initial(volume: VolumeState): Library {
  const ds = buildDataset(volume);
  const externalKeys = new Map<string, Id>();
  for (const b of ds.books.values()) if (b.external.olWorkId) externalKeys.set(`ol:work:${b.external.olWorkId}`, b.id);
  return { ...ds, externalKeys };
}

export interface LibraryApi {
  library: Library;
  provider: BookProvider;
  /** Add (or re-add) a work from search. Returns our book ID. */
  logBook(work: WorkResult, edition: EditionResult | undefined, status: 'reading' | 'finished'): Id;
  finishBook(bookId: Id): void;
  commitRanking(bookId: Id, bucket: Bucket, rankings: Rankings): void;
  checkIn(bookId: Id, page: number): void;
}

const LibraryContext = createContext<LibraryApi | null>(null);

export function LibraryProvider({
  volume,
  provider,
  children,
}: {
  volume: VolumeState;
  provider: BookProvider;
  children: ReactNode;
}) {
  // Keyed by volume in the caller, so switching states starts fresh.
  const [library, dispatch] = useReducer(reducer, volume, initial);

  const api = useMemo<LibraryApi>(
    () => ({
      library,
      provider,
      logBook(work, edition, status) {
        const now = new Date().toISOString();
        const existingId = library.externalKeys.get(`ol:work:${work.externalWorkId}`);
        const bookId = existingId ?? `bk-${ulid()}`;
        const book: Book = library.books.get(bookId) ?? {
          id: bookId,
          title: work.title,
          authors: work.authors.map((name) => ({ name })),
          firstPublishYear: work.firstPublishYear,
          coverId: work.coverId,
          external: { olWorkId: work.externalWorkId },
        };
        const editionRecord: Edition = {
          id: `ed-${ulid()}`,
          bookId,
          pageCount: edition?.pageCount ?? work.pagesMedian,
          publisher: edition?.publisher,
          publishYear: edition?.publishYear,
          isbn13: edition?.isbn13,
          coverId: edition?.coverId ?? work.coverId,
          external: { olEditionId: edition?.externalEditionId },
        };
        const prev = library.library.find((e) => e.bookId === bookId);
        const read = { readId: ulid(), editionId: editionRecord.id, startedAt: now, ...(status === 'finished' && { finishedAt: now }) };
        const entry: LibraryEntry = {
          bookId,
          status,
          editionId: editionRecord.id,
          currentPage: status === 'finished' ? editionRecord.pageCount : 0,
          reads: [...(prev?.reads ?? []), read],
          bucket: prev?.bucket,
          updatedAt: now,
        };
        dispatch({ type: 'add', book, edition: editionRecord, entry });
        return bookId;
      },
      finishBook: (bookId) => dispatch({ type: 'finish', bookId, now: new Date().toISOString() }),
      commitRanking: (bookId, bucket, rankings) =>
        dispatch({ type: 'rank', bookId, bucket, rankings, now: new Date().toISOString() }),
      checkIn: (bookId, page) => dispatch({ type: 'checkin', bookId, page, now: new Date().toISOString() }),
    }),
    [library, provider],
  );

  return <LibraryContext.Provider value={api}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryApi {
  const api = useContext(LibraryContext);
  if (!api) throw new Error('useLibrary must be used inside <LibraryProvider>');
  return api;
}
