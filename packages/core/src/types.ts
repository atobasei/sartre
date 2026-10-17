// Domain types shared by web, mobile and (later) the Firebase layer.
// Every ID here is ours. External catalog IDs (Open Library, Google Books)
// live only on Book/Edition `external` fields and never in user data.
// Dates are ISO-8601 strings; repositories convert to/from Firestore Timestamps.

export type Id = string;
export type IsoDate = string;

export type Bucket = 'loved' | 'liked' | 'meh';
export const BUCKETS: readonly Bucket[] = ['loved', 'liked', 'meh'];

export type ReadingStatus = 'want' | 'reading' | 'finished' | 'dnf';

/** Ordered from most to least private. */
export type PrivacyLevel = 'private' | 'completions' | 'reports' | 'open';
export const PRIVACY_LEVELS: readonly PrivacyLevel[] = ['private', 'completions', 'reports', 'open'];

export interface Author {
  name: string;
  olAuthorId?: string;
}

/** A work: what rankings and completions attach to. */
export interface Book {
  id: Id;
  title: string;
  subtitle?: string;
  authors: Author[];
  firstPublishYear?: number;
  /** Open Library cover ID (covers.openlibrary.org/b/id/{coverId}-L.jpg). */
  coverId?: number;
  external: {
    olWorkId?: string;
    googleVolumeIds?: string[];
  };
}

/** A specific edition: where page counts come from. */
export interface Edition {
  id: Id;
  bookId: Id;
  pageCount?: number;
  isbn13?: string[];
  publisher?: string;
  publishYear?: number;
  coverId?: number;
  format?: 'hardcover' | 'paperback' | 'ebook' | 'audiobook';
  external: {
    olEditionId?: string;
    googleVolumeId?: string;
  };
}

/** One pass through a book. Rereads add another Read to the same LibraryEntry. */
export interface Read {
  readId: Id;
  editionId: Id;
  startedAt?: IsoDate;
  finishedAt?: IsoDate;
}

/** A user's relationship to one work. Firestore: users/{uid}/library/{bookId}. */
export interface LibraryEntry {
  bookId: Id;
  status: ReadingStatus;
  editionId: Id;
  currentPage?: number;
  reads: Read[];
  bucket?: Bucket;
  updatedAt: IsoDate;
}

/** Firestore: users/{uid}/rankings/main. Each array is ordered best → worst. */
export type Rankings = Record<Bucket, Id[]>;

/** Firestore: users/{uid}/checkins/{id}. */
export interface CheckIn {
  id: Id;
  bookId: Id;
  page: number;
  at: IsoDate;
}

/** Snapshot taken when a read finishes; backs the share card (/c/:readId). */
export interface Completion {
  readId: Id;
  bookId: Id;
  editionId: Id;
  finishedAt: IsoDate;
  pages?: number;
  bucketAtTime: Bucket;
  /** 1-based overall position at the moment of finishing. Shares don't silently change later. */
  rankAtTime: number;
  rankTotalAtTime: number;
}

export type Banner = { type: 'topFour' } | { type: 'collage'; bookIds: Id[] };

export interface Profile {
  uid: Id;
  handle: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  banner: Banner;
  theme: string;
  privacy: PrivacyLevel;
  joinedAt: IsoDate;
}
