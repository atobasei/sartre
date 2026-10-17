import {
  answer,
  applyInsertion,
  BUCKETS,
  flattenRankings,
  maxComparisons,
  rankOf,
  startInsertion,
  type Answer,
  type Book,
  type Bucket,
  type CompareStep,
  type InsertionStep,
  type Rankings,
} from '@sartre/core';
import { radius, space } from '@sartre/tokens';
import { BUCKET_LABELS, BucketTag, Button, Cover, Text, useTheme, useViewport } from '@sartre/ui';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, View } from 'react-native';
import { RankBadge } from '../components/RankBadge';
import { authorLine } from '../format';
import { routes, useNav } from '../nav';
import { useLibrary } from '../store';

type Phase = { kind: 'bucket' } | { kind: 'compare'; step: CompareStep; history: CompareStep[] } | { kind: 'result'; rankings: Rankings };

const BUCKET_COPY: Record<Bucket, string> = {
  loved: 'Stays with you',
  liked: 'Glad you read it',
  meh: 'It was fine',
};

export function RankScreen({ bookId, rerank = false }: { bookId: string; rerank?: boolean }) {
  const { library, commitRanking } = useLibrary();
  const book = library.books.get(bookId);
  const [phase, setPhase] = useState<Phase>({ kind: 'bucket' });
  // Position before this flow started, for "was #N" after a re-rank.
  const [previous] = useState(() => rankOf(library.rankings, bookId)?.position);

  if (!book) {
    return (
      <View style={{ paddingVertical: space[8], alignItems: 'center' }}>
        <Text variant="heading">That book isn't in your library.</Text>
      </View>
    );
  }

  const advance = (step: InsertionStep, history: CompareStep[]) => {
    if (step.kind === 'compare') {
      setPhase({ kind: 'compare', step, history });
    } else {
      const rankings = applyInsertion(library.rankings, step);
      commitRanking(bookId, step.bucket, rankings);
      setPhase({ kind: 'result', rankings });
    }
  };

  switch (phase.kind) {
    case 'bucket':
      return <BucketStep book={book} rerank={rerank} onPick={(b) => advance(startInsertion(library.rankings, b, bookId), [])} />;
    case 'compare':
      return (
        <CompareView
          book={book}
          step={phase.step}
          pivot={library.books.get(phase.step.pivot)!}
          onAnswer={(a) => advance(answer(phase.step, a), [...phase.history, phase.step])}
          onBack={() => {
            const prev = phase.history.at(-1);
            setPhase(prev ? { kind: 'compare', step: prev, history: phase.history.slice(0, -1) } : { kind: 'bucket' });
          }}
        />
      );
    case 'result':
      return <ResultView book={book} rankings={phase.rankings} previous={previous} />;
  }
}

function BucketStep({ book, rerank, onPick }: { book: Book; rerank: boolean; onPick: (b: Bucket) => void }) {
  const { colors } = useTheme();
  const { width } = useViewport();
  const compact = width < 720;
  return (
    <View style={{ alignItems: 'center', gap: space[6], paddingVertical: space[6] }}>
      <Cover book={book} size={compact ? 'lg' : 'xl'} />
      <View style={{ alignItems: 'center', gap: space[1] }}>
        <Text variant="label" tone="muted">
          {rerank ? 'Re-rank' : 'Finished'}
        </Text>
        <Text variant={compact ? 'title' : 'display'} align="center">
          {book.title}
        </Text>
        <Text variant="body" tone="muted">
          {authorLine(book.authors)}
        </Text>
      </View>
      <View style={{ width: '100%', maxWidth: 520, gap: space[3] }}>
        {BUCKETS.map((b, i) => (
          <Pressable
            key={b}
            onPress={() => onPick(b)}
            accessibilityRole="button"
            accessibilityLabel={BUCKET_LABELS[b]}
            style={(s) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: space[4],
                padding: space[4],
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
              (s.pressed || (s as { hovered?: boolean }).hovered) && { borderColor: colors[b] },
            ]}
          >
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors[b] }} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{BUCKET_LABELS[b]}</Text>
              <Text variant="small" tone="muted">
                {BUCKET_COPY[b]}
              </Text>
            </View>
            {Platform.OS === 'web' ? (
              <Text variant="mono" tone="faint">
                {i + 1}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </View>
      <KeyHandler keys={{ '1': () => onPick('loved'), '2': () => onPick('liked'), '3': () => onPick('meh') }} />
    </View>
  );
}

function CompareView({
  book,
  pivot,
  step,
  onAnswer,
  onBack,
}: {
  book: Book;
  pivot: Book;
  step: CompareStep;
  onAnswer: (a: Answer) => void;
  onBack: () => void;
}) {
  const { width } = useViewport();
  const compact = width < 720;
  const coverWidth = compact ? Math.min(140, (width - 80) / 2) : 180;
  const bound = maxComparisons(step.list.length);
  return (
    <View style={{ alignItems: 'center', gap: space[6], paddingVertical: space[6] }}>
      <View style={{ alignItems: 'center', gap: space[2] }}>
        <BucketTag bucket={step.bucket} />
        <Text variant={compact ? 'title' : 'display'} align="center">
          Which did you like more?
        </Text>
        <Text variant="mono" tone="faint">
          {step.comparisons + 1} / {bound}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: compact ? space[4] : space[7], alignItems: 'flex-start' }}>
        <Choice book={book} width={coverWidth} hint="←" onPress={() => onAnswer('new')} />
        <View style={{ alignSelf: 'center', paddingTop: space[4] }}>
          <Text variant="label" tone="faint">
            or
          </Text>
        </View>
        <Choice book={pivot} width={coverWidth} hint="→" onPress={() => onAnswer('existing')} />
      </View>
      <View style={{ flexDirection: 'row', gap: space[2] }}>
        <Button label="Back" kind="ghost" onPress={onBack} />
        <Button label="Too close to call" kind="secondary" onPress={() => onAnswer('tooClose')} />
      </View>
      <KeyHandler
        keys={{
          ArrowLeft: () => onAnswer('new'),
          ArrowRight: () => onAnswer('existing'),
          ' ': () => onAnswer('tooClose'),
          Backspace: onBack,
        }}
      />
    </View>
  );
}

function Choice({ book, width, hint, onPress }: { book: Book; width: number; hint: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`I liked ${book.title} more`}
      style={(s) => [
        { width: width + 24, padding: 12, borderRadius: radius.lg, gap: space[3], borderWidth: 2, borderColor: 'transparent' },
        (s as { hovered?: boolean }).hovered && { borderColor: colors.border, backgroundColor: colors.surface },
        s.pressed && { borderColor: colors.accent },
      ]}
    >
      <Cover book={book} width={width} />
      <View style={{ gap: 2 }}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {book.title}
        </Text>
        <Text variant="small" tone="muted" numberOfLines={1}>
          {authorLine(book.authors)}
        </Text>
        {Platform.OS === 'web' ? (
          <Text variant="mono" tone="faint" style={{ marginTop: 4 }}>
            {hint}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function ResultView({ book, rankings, previous }: { book: Book; rankings: Rankings; previous?: number }) {
  const { library } = useLibrary();
  const { colors } = useTheme();
  const nav = useNav();
  const rank = rankOf(rankings, book.id)!;
  const list = flattenRankings(rankings);
  const at = rank.position - 1;
  const from = Math.max(0, Math.min(at - 2, list.length - 5));
  const nearby = list.slice(from, from + 5);
  const completion = library.completions.findLast((c) => c.bookId === book.id);

  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(slide, { toValue: 1, useNativeDriver: Platform.OS !== 'web', friction: 7, tension: 60 }).start();
  }, [slide]);

  return (
    <View style={{ alignItems: 'center', gap: space[6], paddingVertical: space[6] }}>
      <View style={{ alignItems: 'center', gap: space[3] }}>
        <BucketTag bucket={rank.bucket} size="md" />
        <RankBadge rank={rank} showTotal size="lg" />
        <Text variant="body" tone="muted" align="center">
          {rank.total === 1
            ? 'The first book in your rankings.'
            : `${book.title} is ranked ${ordinal(rank.position)} of ${rank.total}.`}
        </Text>
        {previous && previous !== rank.position ? (
          <Text variant="mono" tone="faint">
            was #{previous}
          </Text>
        ) : null}
      </View>

      {rank.total > 1 ? (
        <View style={{ width: '100%', maxWidth: 520, gap: 2 }}>
          {nearby.map((id) => {
            const isNew = id === book.id;
            const b = library.books.get(id)!;
            const pos = list.indexOf(id) + 1;
            const row = (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space[3],
                  padding: space[2],
                  borderRadius: radius.md,
                  backgroundColor: isNew ? colors.surface : 'transparent',
                  borderWidth: 1,
                  borderColor: isNew ? colors.accent : 'transparent',
                }}
              >
                <Text variant="mono" tone={isNew ? 'accent' : 'faint'} style={{ width: 28, textAlign: 'right' }}>
                  {pos}
                </Text>
                <Cover book={b} size="xs" shadow={false} />
                <Text variant={isNew ? 'bodyStrong' : 'body'} tone={isNew ? 'default' : 'muted'} style={{ flex: 1 }} numberOfLines={1}>
                  {b.title}
                </Text>
              </View>
            );
            return isNew ? (
              <Animated.View
                key={id}
                style={{ opacity: slide, transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}
              >
                {row}
              </Animated.View>
            ) : (
              <View key={id}>{row}</View>
            );
          })}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: space[2] }}>
        {completion ? <Button label="See the card" onPress={() => nav.push(routes.card(completion.readId))} /> : null}
        <Button label="Done" kind="secondary" onPress={() => nav.push(routes.profile(library.profile.handle))} />
      </View>
    </View>
  );
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]!);
}

/** Web-only keyboard shortcuts (Monkeytype-style speed). No-op on native. */
function KeyHandler({ keys }: { keys: Record<string, () => void> }) {
  const ref = useRef(keys);
  ref.current = keys;
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      const fn = ref.current[e.key];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return null;
}
