import type { Book, Id, TimelineMonth } from '@sartre/core';
import { space } from '@sartre/tokens';
import { Cover, Text, useTheme } from '@sartre/ui';
import { useRef, type ComponentRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { formatNumber, monthShort } from '../format';
import { routes, useNav } from '../nav';
import type { MonthView } from '../settings';

const COLUMN = 60;
const COVER = 40;
const BAR_MAX = 96;

/**
 * Finished covers placed by month: monthly, never daily. Empty months keep the
 * rhythm as a quiet dot, never a zero. Pages per month can be shown as bars
 * (alone or under the covers), which is one of the open design questions.
 */
export function MonthlyTimeline({
  months,
  book,
  view,
}: {
  months: TimelineMonth[];
  book: (id: Id) => Book;
  view: MonthView;
}) {
  const { colors } = useTheme();
  const nav = useNav();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const maxPages = Math.max(1, ...months.map((m) => m.pages));
  const maxStack = Math.max(1, ...months.map((m) => m.completions.length));
  const showCovers = view !== 'bars';
  const showBars = view !== 'covers';
  const coverArea = showCovers ? maxStack * (COVER * 1.5) + (maxStack - 1) * 6 : 0;

  return (
    <ScrollView
      ref={scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
      contentContainerStyle={{ gap: 4, paddingRight: 4 }}
    >
      {months.map((m, i) => {
        const yearStart = i === 0 || m.month === 0;
        const empty = m.completions.length === 0;
        return (
          <View key={`${m.year}-${m.month}`} style={{ width: COLUMN, alignItems: 'center' }}>
            <View style={{ height: 16, alignSelf: 'flex-start', paddingLeft: 10 }}>
              {yearStart ? (
                <Text variant="mono" tone="faint" style={{ fontSize: 11 }}>
                  {m.year}
                </Text>
              ) : null}
            </View>
            {showCovers ? (
              <View style={{ height: coverArea, justifyContent: 'flex-end', gap: 6, alignItems: 'center' }}>
                {empty ? (
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 8 }} />
                ) : (
                  [...m.completions].reverse().map((c) => (
                    <Pressable key={c.readId} onPress={() => nav.push(routes.card(c.readId))} accessibilityRole="link">
                      <Cover book={book(c.bookId)} width={COVER} shadow={false} />
                    </Pressable>
                  ))
                )}
              </View>
            ) : null}
            {showBars ? (
              <View style={{ height: showCovers ? 40 : BAR_MAX, justifyContent: 'flex-end', alignItems: 'center', marginTop: showCovers ? 8 : 0 }}>
                {m.pages > 0 ? (
                  <View
                    style={{
                      width: showCovers ? 24 : 28,
                      height: Math.max(3, ((showCovers ? 40 : BAR_MAX) - 2) * (m.pages / maxPages)),
                      borderRadius: 3,
                      backgroundColor: colors.accent,
                      opacity: showCovers ? 0.4 : 0.85,
                    }}
                  />
                ) : (
                  !showCovers && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
                )}
              </View>
            ) : null}
            <View style={{ marginTop: space[2], alignItems: 'center' }}>
              <Text variant="label" tone={empty ? 'faint' : 'muted'} style={{ letterSpacing: 0.6 }}>
                {monthShort(m.month)}
              </Text>
              {showBars && m.pages > 0 ? (
                <Text variant="mono" tone="faint" style={{ fontSize: 10, lineHeight: 14 }}>
                  {formatNumber(m.pages)}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
