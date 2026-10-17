import {
  completionsInMonth,
  completionsInYear,
  currentlyReading,
  flattenRankings,
  monthlyTimeline,
  pageEvents,
  pagesByMonth,
  rankOf,
  type Book,
  type Completion,
  type Id,
} from '@sartre/core';
import { useMemo } from 'react';
import { useLibrary } from './store';

export interface Overview {
  now: Date;
  year: number;
  thisYear: Completion[];
  thisMonth: Completion[];
  pagesThisYear: number;
  pagesThisMonth: number;
  pagesByMonth: number[];
  timeline: ReturnType<typeof monthlyTimeline>;
  reading: ReturnType<typeof currentlyReading>;
  ranked: Id[];
  latest?: Completion;
  totalFinished: number;
  book: (id: Id) => Book;
}

export function useOverview(): Overview {
  const { library } = useLibrary();
  return useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const events = pageEvents(library.checkins, library.completions);
    const months = pagesByMonth(events, year);
    const sorted = [...library.completions].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
    return {
      now,
      year,
      thisYear: completionsInYear(library.completions, year),
      thisMonth: completionsInMonth(library.completions, { year, month: now.getMonth() }),
      pagesThisYear: months.reduce((a, b) => a + b, 0),
      pagesThisMonth: months[now.getMonth()] ?? 0,
      pagesByMonth: months,
      timeline: monthlyTimeline(library.completions, events, now, 1),
      reading: currentlyReading(library.library, library.editions),
      ranked: flattenRankings(library.rankings),
      latest: sorted[0],
      totalFinished: library.completions.length,
      book: (id: Id) => library.books.get(id)!,
    };
  }, [library]);
}

export function useRank(bookId: Id) {
  const { library } = useLibrary();
  return rankOf(library.rankings, bookId);
}
