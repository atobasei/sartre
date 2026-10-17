import type { Book, Bucket, Completion } from '@sartre/core';
import { APP_NAME, fonts, type Theme } from '@sartre/tokens';
import { BUCKET_LABELS, Cover } from '@sartre/ui';
import type { ComponentRef, Ref } from 'react';
import { Image, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { formatNumber, monthName } from '../format';

// Completion share cards. Rendered at a fixed logical size and exported at 3×
// (story → 1080×1920) or 2× (link preview → 1200×630). Layout is flexbox-only on
// purpose: the chosen direction gets ported to next/og (Satori) for server
// rendering, and Satori supports only a subset of CSS.

export type CardFormat = 'story' | 'og';
export type CardDirection = 'cover' | 'stats' | 'editorial';

export const CARD_SIZE: Record<CardFormat, { width: number; height: number; pixelRatio: number }> = {
  story: { width: 360, height: 640, pixelRatio: 3 },
  og: { width: 600, height: 315, pixelRatio: 2 },
};

export const CARD_DIRECTIONS: readonly { key: CardDirection; label: string }[] = [
  { key: 'cover', label: 'A · Cover' },
  { key: 'stats', label: 'B · Stats' },
  { key: 'editorial', label: 'C · Editorial' },
];

export interface CardData {
  book: Book;
  completion: Completion;
  handle: string;
  /** "Book 20 of 2026": nth finish of that year. */
  yearIndex: number;
  theme: Theme;
}

interface Props extends CardData {
  direction: CardDirection;
  format: CardFormat;
}

export function ShareCard({ ref, ...props }: Props & { ref?: Ref<ComponentRef<typeof View>> }) {
  const { width, height } = CARD_SIZE[props.format];
  const Body = { cover: CoverDirection, stats: StatsDirection, editorial: EditorialDirection }[props.direction];
  return (
    <View ref={ref} collapsable={false} style={{ width, height, overflow: 'hidden', borderRadius: 0 }}>
      <Body {...props} />
    </View>
  );
}

const finishedLine = (c: Completion) => {
  const d = new Date(c.finishedAt);
  return `${monthName(d.getMonth())} ${d.getDate()}, ${d.getFullYear()}`;
};

const author = (b: Book) => b.authors.map((a) => a.name).join(', ');

const bucketColor = (theme: Theme, bucket: Bucket) => theme.colors[bucket];

const t = (s: TextStyle) => s;

// ─── A · Cover ──────────────────────────────────────────────────────────────
// The cover is the hero; its own colors become the background.

function CoverDirection({ book, completion, handle, format, theme }: Props) {
  const story = format === 'story';
  const ink = '#FFFFFF';
  const meta = t({ fontFamily: fonts.sans, fontSize: story ? 11 : 10, letterSpacing: 1.6, color: 'rgba(255,255,255,0.72)', fontWeight: '600' });
  return (
    <View style={{ flex: 1, backgroundColor: '#1a1816' }}>
      {book.coverId ? (
        <Image
          source={{ uri: `https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg` }}
          blurRadius={40}
          resizeMode="cover"
          style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.5 }] }]}
        />
      ) : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(12,10,8,0.45)' }]} />
      <View
        style={{
          flex: 1,
          flexDirection: story ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: story ? 'center' : 'flex-start',
          padding: story ? 32 : 36,
          gap: story ? 28 : 32,
        }}
      >
        <Cover book={book} width={story ? 188 : 150} />
        <View style={{ alignItems: story ? 'center' : 'flex-start', gap: 8, flex: story ? undefined : 1 }}>
          <Text style={meta}>FINISHED {finishedLine(completion).toUpperCase()}</Text>
          <Text
            style={{ fontFamily: fonts.display, fontSize: story ? 30 : 28, lineHeight: story ? 34 : 32, color: ink, textAlign: story ? 'center' : 'left', fontWeight: '500' }}
            numberOfLines={3}
          >
            {book.title}
          </Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{author(book)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)' }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: bucketColor(theme, completion.bucketAtTime) }} />
              <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: ink, fontWeight: '600' }}>{BUCKET_LABELS[completion.bucketAtTime]}</Text>
            </View>
            {completion.rankTotalAtTime >= 3 ? (
              <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                #{completion.rankAtTime} of {completion.rankTotalAtTime}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
      {story ? (
        <View style={{ paddingHorizontal: 28, paddingBottom: 22 }}>
          <Footer handle={handle} color="rgba(255,255,255,0.7)" format={format} />
        </View>
      ) : (
        <Footer handle={handle} color="rgba(255,255,255,0.7)" format={format} />
      )}
    </View>
  );
}

// ─── B · Stats ──────────────────────────────────────────────────────────────
// Monkeytype energy: theme colors, mono numerals, the rank as the headline.

function StatsDirection({ book, completion, handle, format, theme, yearIndex }: Props) {
  const story = format === 'story';
  const c = theme.colors;
  const year = new Date(completion.finishedAt).getFullYear();
  const showRank = completion.rankTotalAtTime >= 3;
  const label = t({ fontFamily: fonts.mono, fontSize: 11, color: c.textFaint, letterSpacing: 0.4 });
  const value = t({ fontFamily: fonts.mono, fontSize: story ? 22 : 18, color: c.text, fontVariant: ['tabular-nums'] });
  const stats: [string, string][] = [
    ['finished', finishedLine(completion).toLowerCase()],
    ...(completion.pages ? [['pages', formatNumber(completion.pages)] as [string, string]] : []),
    [`${year}`, `book ${yearIndex}`],
  ];

  const headline = (
    <View style={{ gap: 4 }}>
      <Text style={label}>{showRank ? 'ranked' : 'verdict'}</Text>
      {showRank ? (
        <Text style={{ fontFamily: fonts.mono, fontSize: story ? 112 : 84, lineHeight: story ? 116 : 88, color: c.accent, letterSpacing: -4, fontVariant: ['tabular-nums'] }}>
          #{completion.rankAtTime}
        </Text>
      ) : (
        <Text style={{ fontFamily: fonts.mono, fontSize: story ? 64 : 52, lineHeight: story ? 70 : 56, color: bucketColor(theme, completion.bucketAtTime), letterSpacing: -2 }}>
          {BUCKET_LABELS[completion.bucketAtTime].toLowerCase()}
        </Text>
      )}
      {showRank ? (
        <Text style={{ fontFamily: fonts.mono, fontSize: 14, color: c.textMuted }}>
          of {completion.rankTotalAtTime} · {BUCKET_LABELS[completion.bucketAtTime].toLowerCase()}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, padding: story ? 32 : 30, gap: story ? 28 : 0, flexDirection: story ? 'column' : 'row' }}>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', flex: story ? undefined : 1, alignSelf: story ? 'stretch' : 'flex-start' }}>
        <Cover book={book} width={story ? 64 : 72} shadow={false} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: story ? 20 : 20, lineHeight: 24, color: c.text, fontWeight: '500' }} numberOfLines={3}>
            {book.title}
          </Text>
          <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: c.textMuted }}>{author(book).toLowerCase()}</Text>
        </View>
      </View>
      {story ? <View style={{ flex: 1, justifyContent: 'center' }}>{headline}</View> : null}
      <View style={{ gap: story ? 16 : 10, flex: story ? undefined : 1, justifyContent: 'center', paddingLeft: story ? 0 : 24 }}>
        {!story ? headline : null}
        <View style={{ flexDirection: story ? 'column' : 'row', gap: story ? 14 : 18, flexWrap: 'wrap' }}>
          {stats.map(([k, v]) => (
            <View key={k} style={{ gap: 2 }}>
              <Text style={label}>{k}</Text>
              <Text style={[value, !story && { fontSize: 13 }]}>{v}</Text>
            </View>
          ))}
        </View>
      </View>
      {story ? <View style={{ height: 1, backgroundColor: c.border }} /> : null}
      <Footer handle={handle} color={c.textFaint} format={format} mono />
    </View>
  );
}

// ─── C · Editorial ──────────────────────────────────────────────────────────
// A magazine page: the title set big, the cover as an inset, an issue line.

function EditorialDirection({ book, completion, handle, format, theme, yearIndex }: Props) {
  const story = format === 'story';
  const paper = theme.scheme === 'light' ? theme.colors.surface : '#F4EFE6';
  const ink = '#1E1A15';
  const accent = theme.scheme === 'light' ? theme.colors.accent : '#A8432A';
  const year = new Date(completion.finishedAt).getFullYear();
  const titleSize = book.title.length > 28 ? (story ? 40 : 30) : story ? 54 : 38;
  return (
    <View style={{ flex: 1, backgroundColor: paper, padding: story ? 30 : 28, gap: story ? 20 : 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1.5, borderBottomColor: ink, paddingBottom: 8 }}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 10, letterSpacing: 2, color: ink, fontWeight: '700' }}>FINISHED</Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 10, letterSpacing: 2, color: ink, fontWeight: '700' }}>
          NO. {yearIndex} · {year}
        </Text>
      </View>
      <View style={{ flex: 1, flexDirection: story ? 'column' : 'row', gap: story ? 20 : 24 }}>
        <View style={{ flex: 1, gap: 12, justifyContent: story ? 'flex-start' : 'center' }}>
          <Text style={{ fontFamily: fonts.display, fontSize: titleSize, lineHeight: titleSize * 1.02, color: ink, letterSpacing: -1, fontWeight: '500' }} numberOfLines={story ? 5 : 3}>
            {book.title}
          </Text>
          <Text style={{ fontFamily: fonts.display, fontSize: story ? 18 : 15, color: ink, fontStyle: 'italic', opacity: 0.75 }}>by {author(book)}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <View style={{ gap: 6, flex: story ? 1 : undefined, display: story ? 'flex' : 'none' }}>
            <Text style={{ fontFamily: fonts.sans, fontSize: 11, letterSpacing: 1.6, color: accent, fontWeight: '700' }}>
              {BUCKET_LABELS[completion.bucketAtTime].toUpperCase()}
              {completion.rankTotalAtTime >= 3 ? `  ·  #${completion.rankAtTime} OF ${completion.rankTotalAtTime}` : ''}
            </Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: ink, opacity: 0.7 }}>{finishedLine(completion)}</Text>
          </View>
          <Cover book={book} width={story ? 120 : 110} />
        </View>
      </View>
      <Footer handle={handle} color={ink} format={format} faded />
    </View>
  );
}

function Footer({ handle, color, format, mono, faded }: { handle: string; color: string; format: CardFormat; mono?: boolean; faded?: boolean }) {
  if (format === 'og') {
    return (
      <View style={{ position: 'absolute', right: 20, bottom: 14, flexDirection: 'row', gap: 10 }}>
        <Text style={{ fontFamily: mono ? fonts.mono : fonts.sans, fontSize: 11, color, opacity: faded ? 0.6 : 1 }}>@{handle}</Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 12, color, opacity: faded ? 0.6 : 1, fontWeight: '600' }}>{APP_NAME.toLowerCase()}</Text>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', opacity: faded ? 0.6 : 1 }}>
      <Text style={{ fontFamily: mono ? fonts.mono : fonts.sans, fontSize: 12, color }}>@{handle}</Text>
      <Text style={{ fontFamily: fonts.display, fontSize: 15, color, fontWeight: '600' }}>{APP_NAME.toLowerCase()}</Text>
    </View>
  );
}
