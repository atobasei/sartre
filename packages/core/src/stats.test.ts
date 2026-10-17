import { describe, expect, it } from 'vitest';
import { currentlyReading, monthlyTimeline, pageEvents, pagesByMonth } from './stats';
import type { CheckIn, Completion, Edition, LibraryEntry } from './types';

const completion = (bookId: string, finishedAt: string, pages?: number): Completion => ({
  readId: `r-${bookId}-${finishedAt}`,
  bookId,
  editionId: `e-${bookId}`,
  finishedAt,
  pages,
  bucketAtTime: 'liked',
  rankAtTime: 1,
  rankTotalAtTime: 1,
});

describe('page events', () => {
  it('counts check-in deltas and the remainder at finish', () => {
    const checkins: CheckIn[] = [
      { id: '1', bookId: 'a', page: 100, at: '2026-01-20T12:00:00' },
      { id: '2', bookId: 'a', page: 250, at: '2026-02-03T12:00:00' },
    ];
    const months = pagesByMonth(pageEvents(checkins, [completion('a', '2026-02-10T12:00:00', 300)]), 2026);
    expect(months[0]).toBe(100);
    expect(months[1]).toBe(200);
  });

  it('attributes a finish without check-ins to the finish month', () => {
    const months = pagesByMonth(pageEvents([], [completion('b', '2026-03-05T12:00:00', 412)]), 2026);
    expect(months[2]).toBe(412);
    expect(months.reduce((a, b) => a + b)).toBe(412);
  });

  it('starts a reread from page zero', () => {
    const events = pageEvents(
      [{ id: '1', bookId: 'a', page: 50, at: '2026-05-02T12:00:00' }],
      [completion('a', '2026-01-10T12:00:00', 200), completion('a', '2026-05-20T12:00:00', 200)],
    );
    expect(events.map((e) => e.pages)).toEqual([200, 50, 150]);
  });
});

describe('monthly timeline', () => {
  it('covers at least minMonths and includes empty months', () => {
    const months = monthlyTimeline([completion('a', '2026-10-02T12:00:00', 300)], [], new Date('2026-10-16T12:00:00'));
    expect(months).toHaveLength(6);
    expect(months.at(-1)).toMatchObject({ year: 2026, month: 9 });
    expect(months.at(-1)?.completions).toHaveLength(1);
    expect(months[0]?.completions).toHaveLength(0);
  });

  it('extends back to the first completion across years', () => {
    const months = monthlyTimeline([completion('a', '2025-03-15T12:00:00')], [], new Date('2026-10-16T12:00:00'));
    expect(months[0]).toMatchObject({ year: 2025, month: 2 });
    expect(months).toHaveLength(20);
  });
});

describe('currently reading', () => {
  it('computes progress from the chosen edition', () => {
    const library: LibraryEntry[] = [
      { bookId: 'a', status: 'reading', editionId: 'ea', currentPage: 120, reads: [], updatedAt: '2026-10-01' },
      { bookId: 'b', status: 'finished', editionId: 'eb', reads: [], updatedAt: '2026-10-02' },
    ];
    const editions = new Map<string, Edition>([['ea', { id: 'ea', bookId: 'a', pageCount: 480, external: {} }]]);
    const [only, ...rest] = currentlyReading(library, editions);
    expect(rest).toHaveLength(0);
    expect(only?.progress).toBe(0.25);
  });
});
