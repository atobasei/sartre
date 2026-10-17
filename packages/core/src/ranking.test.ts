import { describe, expect, it } from 'vitest';
import {
  answer,
  applyInsertion,
  emptyRankings,
  maxComparisons,
  rankOf,
  scoreAt,
  startInsertion,
  topRanked,
  type InsertionStep,
} from './ranking';
import type { Bucket, Rankings } from './types';

/** Drive the state machine with an oracle that knows the true order. */
function insertWithOracle(rankings: Rankings, bucket: Bucket, item: string, truth: string[]) {
  let step: InsertionStep = startInsertion(rankings, bucket, item);
  while (step.kind === 'compare') {
    step = answer(step, truth.indexOf(item) < truth.indexOf(step.pivot) ? 'new' : 'existing');
  }
  return { rankings: applyInsertion(rankings, step), comparisons: step.comparisons };
}

function shuffled<T>(xs: T[], seed: number): T[] {
  const out = [...xs];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2 ** 31;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

describe('binary insertion', () => {
  it('needs no questions for an empty bucket', () => {
    const step = startInsertion(emptyRankings(), 'loved', 'a');
    expect(step).toMatchObject({ kind: 'done', index: 0, comparisons: 0 });
  });

  it('asks exactly one question against a single book', () => {
    const r = { ...emptyRankings(), liked: ['a'] };
    const step = startInsertion(r, 'liked', 'b');
    if (step.kind !== 'compare') throw new Error('expected compare');
    expect(step.pivot).toBe('a');
    expect(answer(step, 'new')).toMatchObject({ kind: 'done', index: 0, comparisons: 1 });
    expect(answer(step, 'existing')).toMatchObject({ kind: 'done', index: 1, comparisons: 1 });
  });

  it('reproduces any hidden order within the comparison bound', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const n = 1 + (seed % 40);
      const truth = Array.from({ length: n }, (_, i) => `b${i}`);
      let rankings = emptyRankings();
      for (const [k, item] of shuffled(truth, seed).entries()) {
        const res = insertWithOracle(rankings, 'loved', item, truth);
        expect(res.comparisons).toBeLessThanOrEqual(maxComparisons(k));
        rankings = res.rankings;
      }
      expect(rankings.loved).toEqual(truth);
    }
  });

  it('places a too-close book directly below the pivot', () => {
    const r = { ...emptyRankings(), loved: ['a', 'b', 'c'] };
    const step = startInsertion(r, 'loved', 'x');
    if (step.kind !== 'compare') throw new Error('expected compare');
    expect(step.pivot).toBe('b');
    const done = answer(step, 'tooClose');
    if (done.kind !== 'done') throw new Error('expected done');
    expect(applyInsertion(r, done).loved).toEqual(['a', 'b', 'x', 'c']);
  });

  it('re-ranks by removing the book first, including across buckets', () => {
    const r: Rankings = { loved: ['a', 'b'], liked: ['c'], meh: [] };
    const step = startInsertion(r, 'meh', 'a');
    if (step.kind !== 'done') throw new Error('expected done');
    expect(step.index).toBe(0);
    expect(applyInsertion(r, step)).toEqual({ loved: ['b'], liked: ['c'], meh: ['a'] });
  });

  it('never duplicates an item re-inserted into the same bucket', () => {
    const truth = ['a', 'b', 'c', 'd'];
    const r = { ...emptyRankings(), liked: ['b', 'a', 'c', 'd'] };
    expect(insertWithOracle(r, 'liked', 'b', truth).rankings.liked).toEqual(truth);
  });
});

describe('rank info and score', () => {
  const r: Rankings = { loved: ['a', 'b', 'c'], liked: ['d'], meh: ['e', 'f'] };

  it('reports overall and in-bucket position', () => {
    expect(rankOf(r, 'd')).toMatchObject({ bucket: 'liked', position: 4, total: 6, bucketPosition: 1, bucketSize: 1 });
    expect(rankOf(r, 'zzz')).toBeUndefined();
  });

  it('spreads scores across bucket bands, lone books mid-band', () => {
    expect(scoreAt('loved', 0, 3)).toBe(10);
    expect(scoreAt('loved', 2, 3)).toBe(6.8);
    expect(scoreAt('liked', 0, 1)).toBe(5.1);
    expect(rankOf(r, 'f')?.score).toBe(0);
  });

  it('takes the top four across buckets', () => {
    expect(topRanked(r)).toEqual(['a', 'b', 'c', 'd']);
  });
});
