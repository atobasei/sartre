import type { CheckIn, Completion, Edition, Id, IsoDate, LibraryEntry } from './types';

// Overview stats. All derived on the client from completions + check-ins:
// per-user volume is small, and nothing here needs weeks of data to mean something.
// Months are 0-based (Date#getMonth) and computed in the viewer's local time.

export interface YearMonth {
  year: number;
  month: number;
}

const ym = (iso: IsoDate): YearMonth => {
  const d = new Date(iso);
  return { year: d.getFullYear(), month: d.getMonth() };
};

const byFinishedDesc = (a: Completion, b: Completion) => b.finishedAt.localeCompare(a.finishedAt);

export function completionsInYear(completions: readonly Completion[], year: number): Completion[] {
  return completions.filter((c) => ym(c.finishedAt).year === year).sort(byFinishedDesc);
}

export function completionsInMonth(completions: readonly Completion[], at: YearMonth): Completion[] {
  return completions
    .filter((c) => {
      const d = ym(c.finishedAt);
      return d.year === at.year && d.month === at.month;
    })
    .sort(byFinishedDesc);
}

export interface PageEvent {
  bookId: Id;
  at: IsoDate;
  pages: number;
}

/**
 * Turns check-ins and completions into "pages read" events.
 * A check-in counts the pages since the previous check-in for that book; a
 * completion counts whatever is left. A book finished with no check-ins
 * counts all its pages in the month it was finished.
 */
export function pageEvents(checkins: readonly CheckIn[], completions: readonly Completion[]): PageEvent[] {
  const events: PageEvent[] = [];
  const lastPage = new Map<Id, number>();
  const timeline = [
    ...checkins.map((c) => ({ kind: 'checkin' as const, at: c.at, bookId: c.bookId, page: c.page })),
    ...completions.map((c) => ({ kind: 'finish' as const, at: c.finishedAt, bookId: c.bookId, page: c.pages ?? 0 })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  for (const e of timeline) {
    const prev = lastPage.get(e.bookId) ?? 0;
    const pages = Math.max(0, e.page - prev);
    if (pages > 0) events.push({ bookId: e.bookId, at: e.at, pages });
    // A finish resets the counter so a reread starts from page 0 again.
    lastPage.set(e.bookId, e.kind === 'finish' ? 0 : Math.max(prev, e.page));
  }
  return events;
}

/** Pages per month for a year: a 12-slot array. */
export function pagesByMonth(events: readonly PageEvent[], year: number): number[] {
  const months = Array.from({ length: 12 }, () => 0);
  for (const e of events) {
    const d = ym(e.at);
    if (d.year === year) months[d.month]! += e.pages;
  }
  return months;
}

export function sumPages(events: readonly PageEvent[], filter: (d: YearMonth) => boolean): number {
  return events.reduce((total, e) => (filter(ym(e.at)) ? total + e.pages : total), 0);
}

export interface TimelineMonth extends YearMonth {
  completions: Completion[];
  pages: number;
}

/**
 * Months from the first completion (or `minMonths` back, whichever is longer)
 * through `now`, oldest first. Empty months are included so the timeline keeps
 * its rhythm; the UI renders them quietly rather than as zeros.
 */
export function monthlyTimeline(
  completions: readonly Completion[],
  events: readonly PageEvent[],
  now: Date,
  minMonths = 6,
): TimelineMonth[] {
  const end: YearMonth = { year: now.getFullYear(), month: now.getMonth() };
  const earliest = completions.reduce<YearMonth | undefined>((min, c) => {
    const d = ym(c.finishedAt);
    return !min || d.year * 12 + d.month < min.year * 12 + min.month ? d : min;
  }, undefined);
  const endIndex = end.year * 12 + end.month;
  const startIndex = Math.min(endIndex - (minMonths - 1), earliest ? earliest.year * 12 + earliest.month : endIndex);

  const months: TimelineMonth[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    const at = { year: Math.floor(i / 12), month: i % 12 };
    months.push({
      ...at,
      completions: completionsInMonth(completions, at),
      pages: sumPages(events, (d) => d.year === at.year && d.month === at.month),
    });
  }
  return months;
}

export interface CurrentlyReading {
  entry: LibraryEntry;
  page: number;
  pageCount?: number;
  /** 0..1, undefined when the edition has no page count. */
  progress?: number;
}

export function currentlyReading(
  library: readonly LibraryEntry[],
  editions: ReadonlyMap<Id, Edition>,
): CurrentlyReading[] {
  return library
    .filter((e) => e.status === 'reading')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((entry) => {
      const pageCount = editions.get(entry.editionId)?.pageCount;
      const page = entry.currentPage ?? 0;
      return {
        entry,
        page,
        pageCount,
        progress: pageCount ? Math.min(1, page / pageCount) : undefined,
      };
    });
}
