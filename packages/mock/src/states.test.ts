import { flattenRankings, monthlyTimeline, pageEvents } from '@sartre/core';
import { describe, expect, it } from 'vitest';
import { buildDataset, VOLUME_STATES } from './states';

const now = new Date(2026, 9, 16, 12);

describe('mock datasets', () => {
  it.each(VOLUME_STATES)('%s: every finished book is ranked exactly once', (state) => {
    const ds = buildDataset(state, now);
    const ranked = flattenRankings(ds.rankings);
    expect(new Set(ranked).size).toBe(ranked.length);
    expect(ranked.sort()).toEqual(ds.completions.map((c) => c.bookId).sort());
  });

  it.each(VOLUME_STATES)('%s: no dates in the future', (state) => {
    const ds = buildDataset(state, now);
    for (const c of ds.completions) expect(new Date(c.finishedAt) <= now).toBe(true);
    for (const c of ds.checkins) expect(new Date(c.at) <= now).toBe(true);
  });

  it('has 1, 3+1 and 30+2 books', () => {
    expect(buildDataset('one', now).library).toHaveLength(1);
    expect(buildDataset('four', now).library).toHaveLength(4);
    const thirty = buildDataset('thirty', now);
    expect(thirty.completions).toHaveLength(30);
    expect(thirty.library.filter((e) => e.status === 'reading')).toHaveLength(2);
  });

  it('puts the single book in the current month', () => {
    const ds = buildDataset('one', now);
    const months = monthlyTimeline(ds.completions, pageEvents(ds.checkins, ds.completions), now);
    expect(months.at(-1)?.completions).toHaveLength(1);
  });

  it('final rank-at-time of the last finish matches the final ranking', () => {
    const ds = buildDataset('thirty', now);
    const last = ds.completions.at(-1)!;
    expect(last.rankTotalAtTime).toBe(30);
    expect(flattenRankings(ds.rankings).indexOf(last.bookId) + 1).toBe(last.rankAtTime);
  });
});
