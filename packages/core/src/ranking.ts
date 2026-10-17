import { BUCKETS, type Bucket, type Id, type Rankings } from './types';

// Head-to-head ranking: the user picks a gut bucket, then we binary-search the
// book's position inside that bucket with "which did you like more?" questions.
// Buckets are strictly ordered (every loved book outranks every liked book).
//
// The flow is a pure state machine so any UI (web, native, terminal) can drive it:
//   let step = startInsertion(rankings, 'loved', bookId);
//   while (step.kind === 'compare') step = answer(step, await ask(step.pivot));
//   rankings = applyInsertion(rankings, step);

export type Answer =
  /** The new book is better than the pivot. */
  | 'new'
  /** The pivot is better than the new book. */
  | 'existing'
  /** Can't separate them: place the new book directly below the pivot. */
  | 'tooClose';

interface Search {
  bucket: Bucket;
  item: Id;
  /** The bucket's list without `item`, ordered best → worst. */
  list: readonly Id[];
  /** Candidate insertion slots are lo..hi inclusive (slot i = before list[i]). */
  lo: number;
  hi: number;
  comparisons: number;
}

export interface CompareStep extends Search {
  kind: 'compare';
  pivot: Id;
  pivotIndex: number;
}

export interface DoneStep {
  kind: 'done';
  bucket: Bucket;
  item: Id;
  index: number;
  comparisons: number;
}

export type InsertionStep = CompareStep | DoneStep;

export function emptyRankings(): Rankings {
  return { loved: [], liked: [], meh: [] };
}

/** Worst-case number of questions when inserting into a bucket of `n` books. */
export function maxComparisons(n: number): number {
  return n <= 0 ? 0 : Math.ceil(Math.log2(n + 1));
}

export function removeFromRankings(rankings: Rankings, item: Id): Rankings {
  const next = emptyRankings();
  for (const b of BUCKETS) next[b] = rankings[b].filter((id) => id !== item);
  return next;
}

/**
 * Begin placing `item` in `bucket`. If the item is already ranked anywhere it is
 * treated as a re-rank: it's removed first, so a bucket change is allowed.
 */
export function startInsertion(rankings: Rankings, bucket: Bucket, item: Id): InsertionStep {
  const list = removeFromRankings(rankings, item)[bucket];
  return next({ bucket, item, list, lo: 0, hi: list.length, comparisons: 0 });
}

export function answer(step: CompareStep, choice: Answer): InsertionStep {
  const { pivotIndex, comparisons } = step;
  const base = { bucket: step.bucket, item: step.item, list: step.list, comparisons: comparisons + 1 };
  switch (choice) {
    case 'new':
      return next({ ...base, lo: step.lo, hi: pivotIndex });
    case 'existing':
      return next({ ...base, lo: pivotIndex + 1, hi: step.hi });
    case 'tooClose':
      return { kind: 'done', bucket: step.bucket, item: step.item, index: pivotIndex + 1, comparisons: base.comparisons };
  }
}

function next(s: Search): InsertionStep {
  if (s.lo >= s.hi) {
    return { kind: 'done', bucket: s.bucket, item: s.item, index: s.lo, comparisons: s.comparisons };
  }
  const pivotIndex = Math.floor((s.lo + s.hi) / 2);
  return { ...s, kind: 'compare', pivotIndex, pivot: s.list[pivotIndex]! };
}

export function applyInsertion(rankings: Rankings, done: DoneStep): Rankings {
  const next = removeFromRankings(rankings, done.item);
  const list = next[done.bucket];
  next[done.bucket] = [...list.slice(0, done.index), done.item, ...list.slice(done.index)];
  return next;
}

/** All ranked books, best → worst, across buckets. */
export function flattenRankings(rankings: Rankings): Id[] {
  return BUCKETS.flatMap((b) => rankings[b]);
}

export function topRanked(rankings: Rankings, count = 4): Id[] {
  return flattenRankings(rankings).slice(0, count);
}

// Derived score (Beli-style): each bucket owns a band on a 0–10 scale and books
// are spread evenly across it by position. A lone book sits mid-band.
export const SCORE_BANDS: Record<Bucket, readonly [low: number, high: number]> = {
  loved: [6.8, 10],
  liked: [3.4, 6.7],
  meh: [0, 3.3],
};

export interface RankInfo {
  bucket: Bucket;
  /** 1-based position across all buckets. */
  position: number;
  total: number;
  /** 1-based position inside the bucket. */
  bucketPosition: number;
  bucketSize: number;
  score: number;
}

export function rankOf(rankings: Rankings, item: Id): RankInfo | undefined {
  let offset = 0;
  const total = flattenRankings(rankings).length;
  for (const bucket of BUCKETS) {
    const list = rankings[bucket];
    const i = list.indexOf(item);
    if (i >= 0) {
      return {
        bucket,
        position: offset + i + 1,
        total,
        bucketPosition: i + 1,
        bucketSize: list.length,
        score: scoreAt(bucket, i, list.length),
      };
    }
    offset += list.length;
  }
  return undefined;
}

export function scoreAt(bucket: Bucket, index: number, size: number): number {
  const [low, high] = SCORE_BANDS[bucket];
  const raw = size <= 1 ? (low + high) / 2 : high - (index / (size - 1)) * (high - low);
  return Math.round(raw * 10) / 10;
}
