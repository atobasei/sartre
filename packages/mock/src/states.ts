import {
  answer,
  applyInsertion,
  emptyRankings,
  flattenRankings,
  rankOf,
  startInsertion,
  type Book,
  type Bucket,
  type CheckIn,
  type Completion,
  type Edition,
  type Id,
  type LibraryEntry,
  type Profile,
  type Rankings,
} from '@sartre/core';
import { catalog, type CatalogKey } from './catalog';

// Three volume states for judging "good at small numbers". Dates are relative to
// `now` so "this month" is always populated whenever the prototype is opened.

export type VolumeState = 'one' | 'four' | 'thirty';
export const VOLUME_STATES: readonly VolumeState[] = ['one', 'four', 'thirty'];
export const VOLUME_LABELS: Record<VolumeState, string> = { one: '1 book', four: '4 books', thirty: '30 books' };

export interface MockDataset {
  state: VolumeState;
  profile: Profile;
  books: Map<Id, Book>;
  editions: Map<Id, Edition>;
  library: LibraryEntry[];
  rankings: Rankings;
  checkins: CheckIn[];
  completions: Completion[];
}

interface Finish {
  key: CatalogKey;
  monthsAgo: number;
  day: number;
}

interface Reading {
  key: CatalogKey;
  checkins: { monthsAgo: number; day: number; page: number }[];
}

interface Spec {
  /** Oldest first. */
  finished: Finish[];
  reading: Reading[];
  /** Final ranking, best → worst per bucket. Must contain every finished book. */
  ranking: Record<Bucket, CatalogKey[]>;
  joinedMonthsAgo: number;
}

const SPECS: Record<VolumeState, Spec> = {
  one: {
    finished: [{ key: 'tomorrow', monthsAgo: 0, day: 9 }],
    reading: [],
    ranking: { loved: ['tomorrow'], liked: [], meh: [] },
    joinedMonthsAgo: 0,
  },
  four: {
    finished: [
      { key: 'remains', monthsAgo: 2, day: 14 },
      { key: 'piranesi', monthsAgo: 1, day: 3 },
      { key: 'tomorrow', monthsAgo: 0, day: 9 },
    ],
    reading: [
      {
        key: 'copperhead',
        checkins: [
          { monthsAgo: 1, day: 22, page: 120 },
          { monthsAgo: 0, day: 12, page: 212 },
        ],
      },
    ],
    ranking: { loved: ['piranesi', 'tomorrow'], liked: ['remains'], meh: [] },
    joinedMonthsAgo: 2,
  },
  thirty: {
    finished: [
      { key: 'stoner', monthsAgo: 15, day: 4 },
      { key: 'remains', monthsAgo: 15, day: 21 },
      { key: 'neverLetMeGo', monthsAgo: 14, day: 11 },
      { key: 'secretHistory', monthsAgo: 12, day: 2 },
      { key: 'road', monthsAgo: 12, day: 15 },
      { key: 'normalPeople', monthsAgo: 12, day: 27 },
      { key: 'gilead', monthsAgo: 11, day: 8 },
      { key: 'housekeeping', monthsAgo: 11, day: 19 },
      { key: 'middlemarch', monthsAgo: 10, day: 24 },
      { key: 'bardo', monthsAgo: 8, day: 3 },
      { key: 'stationEleven', monthsAgo: 8, day: 13 },
      { key: 'hailMary', monthsAgo: 8, day: 26 },
      { key: 'lonesomeDove', monthsAgo: 7, day: 20 },
      { key: 'pachinko', monthsAgo: 6, day: 5 },
      { key: 'educated', monthsAgo: 6, day: 16 },
      { key: 'stranger', monthsAgo: 6, day: 18 },
      { key: 'overstory', monthsAgo: 5, day: 22 },
      { key: 'eastOfEden', monthsAgo: 4, day: 6 },
      { key: 'bellJar', monthsAgo: 4, day: 14 },
      { key: 'nausea', monthsAgo: 4, day: 25 },
      { key: 'solitude', monthsAgo: 3, day: 10 },
      { key: 'annaKarenina', monthsAgo: 3, day: 28 },
      { key: 'leftHand', monthsAgo: 2, day: 4 },
      { key: 'nameOfTheRose', monthsAgo: 2, day: 17 },
      { key: 'klara', monthsAgo: 2, day: 23 },
      { key: 'gentleman', monthsAgo: 1, day: 2 },
      { key: 'copperhead', monthsAgo: 1, day: 15 },
      { key: 'babel', monthsAgo: 1, day: 27 },
      { key: 'tomorrow', monthsAgo: 0, day: 4 },
      { key: 'piranesi', monthsAgo: 0, day: 11 },
    ],
    reading: [
      {
        key: 'karamazov',
        checkins: [
          { monthsAgo: 1, day: 20, page: 180 },
          { monthsAgo: 0, day: 8, page: 340 },
        ],
      },
      { key: 'intermezzo', checkins: [{ monthsAgo: 0, day: 13, page: 96 }] },
    ],
    ranking: {
      loved: ['piranesi', 'remains', 'stoner', 'gilead', 'tomorrow', 'secretHistory', 'lonesomeDove', 'middlemarch', 'neverLetMeGo', 'bardo'],
      liked: ['pachinko', 'eastOfEden', 'overstory', 'klara', 'solitude', 'leftHand', 'stationEleven', 'housekeeping', 'road', 'nausea', 'stranger', 'gentleman', 'babel'],
      meh: ['copperhead', 'normalPeople', 'hailMary', 'educated', 'bellJar', 'nameOfTheRose', 'annaKarenina'],
    },
    joinedMonthsAgo: 15,
  },
};

/** Local date `monthsAgo` months before `now`, clamped so it never lands in the future. */
function dateAt(now: Date, monthsAgo: number, day: number): string {
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1, 20, 0, 0);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const maxDay = monthsAgo === 0 ? Math.max(1, now.getDate() - 1) : lastDay;
  d.setDate(Math.min(day, maxDay));
  return d.toISOString();
}

export const MOCK_PROFILE: Omit<Profile, 'joinedAt'> = {
  uid: 'u-mara',
  handle: 'mara',
  displayName: 'Mara Lindqvist',
  bio: 'Long novels, slowly. Ishiguro completist in progress.',
  banner: { type: 'topFour' },
  theme: 'paper',
  privacy: 'open',
};

export function buildDataset(state: VolumeState, now = new Date()): MockDataset {
  const spec = SPECS[state];
  const books = new Map<Id, Book>();
  const editions = new Map<Id, Edition>();
  const use = (key: CatalogKey) => {
    const { book, edition } = catalog[key];
    books.set(book.id, book);
    editions.set(edition.id, edition);
    return catalog[key];
  };

  // Replay finishes in order, inserting each into the ranking with an oracle that
  // knows the final order, so rank-at-time is what the user would have seen.
  const truth = flattenRankings({
    loved: spec.ranking.loved.map((k) => catalog[k].book.id),
    liked: spec.ranking.liked.map((k) => catalog[k].book.id),
    meh: spec.ranking.meh.map((k) => catalog[k].book.id),
  });
  const bucketOf = (key: CatalogKey): Bucket =>
    (['loved', 'liked', 'meh'] as const).find((b) => spec.ranking[b].includes(key)) ?? 'liked';

  let rankings = emptyRankings();
  const completions: Completion[] = [];
  const library: LibraryEntry[] = [];

  for (const f of spec.finished) {
    const { book, edition } = use(f.key);
    const bucket = bucketOf(f.key);
    let step = startInsertion(rankings, bucket, book.id);
    while (step.kind === 'compare') {
      step = answer(step, truth.indexOf(book.id) < truth.indexOf(step.pivot) ? 'new' : 'existing');
    }
    rankings = applyInsertion(rankings, step);
    const rank = rankOf(rankings, book.id)!;
    const finishedAt = dateAt(now, f.monthsAgo, f.day);
    const readId = `rd-${f.key}`;
    completions.push({
      readId,
      bookId: book.id,
      editionId: edition.id,
      finishedAt,
      pages: edition.pageCount,
      bucketAtTime: bucket,
      rankAtTime: rank.position,
      rankTotalAtTime: rank.total,
    });
    library.push({
      bookId: book.id,
      status: 'finished',
      editionId: edition.id,
      currentPage: edition.pageCount,
      reads: [{ readId, editionId: edition.id, finishedAt }],
      bucket,
      updatedAt: finishedAt,
    });
  }

  const checkins: CheckIn[] = [];
  for (const r of spec.reading) {
    const { book, edition } = use(r.key);
    for (const [i, c] of r.checkins.entries()) {
      checkins.push({ id: `ck-${r.key}-${i}`, bookId: book.id, page: c.page, at: dateAt(now, c.monthsAgo, c.day) });
    }
    const last = checkins.filter((c) => c.bookId === book.id).at(-1);
    library.push({
      bookId: book.id,
      status: 'reading',
      editionId: edition.id,
      currentPage: last?.page ?? 0,
      reads: [{ readId: `rd-${r.key}`, editionId: edition.id }],
      updatedAt: last?.at ?? now.toISOString(),
    });
  }

  return {
    state,
    profile: { ...MOCK_PROFILE, joinedAt: dateAt(now, spec.joinedMonthsAgo, 1) },
    books,
    editions,
    library,
    rankings,
    checkins,
    completions,
  };
}
