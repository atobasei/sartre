import { rankEditions, type EditionResult, type WorkResult } from '@sartre/data';
import { radius, space } from '@sartre/tokens';
import { Button, Card, Cover, Segmented, Text, useTheme } from '@sartre/ui';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { formatNumber } from '../format';
import { routes, useNav } from '../nav';
import { useLibrary } from '../store';

// Search, tap, done. One input, results as you type, pick an edition only when
// it matters (page counts), then reading or finished.

export function LogScreen() {
  const { provider } = useLibrary();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WorkResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [picked, setPicked] = useState<WorkResult | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setStatus('idle');
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setStatus('loading');
      provider
        .search(q, { signal: ctrl.signal, limit: 10 })
        .then((r) => {
          setResults(r);
          setStatus('idle');
        })
        .catch((e: unknown) => {
          if ((e as Error).name !== 'AbortError') setStatus('error');
        });
    }, 280);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, provider]);

  if (picked) return <LogDetail work={picked} onBack={() => setPicked(null)} />;

  return (
    <View style={{ gap: space[5], paddingTop: space[4] }}>
      <Text variant="title">Log a book</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[2],
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.lg,
          paddingHorizontal: space[4],
        }}
      >
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Title or author"
          placeholderTextColor={colors.textFaint}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search books"
          style={{ flex: 1, paddingVertical: 14, fontSize: 18, color: colors.text, outlineStyle: 'none' } as object}
        />
        {status === 'loading' ? <ActivityIndicator color={colors.textMuted} /> : null}
      </View>

      {status === 'error' ? (
        <Text variant="small" tone="muted">
          Search is unavailable right now. Try again in a moment.
        </Text>
      ) : null}
      {status === 'idle' && query.trim().length >= 2 && results.length === 0 ? (
        <Text variant="small" tone="muted">
          No matches for “{query.trim()}”.
        </Text>
      ) : null}

      <View style={{ gap: 2 }}>
        {results.map((r) => (
          <Pressable
            key={`${r.provider}:${r.externalWorkId}`}
            onPress={() => setPicked(r)}
            accessibilityRole="button"
            style={(s) => [
              { flexDirection: 'row', gap: space[4], alignItems: 'center', padding: space[2], borderRadius: radius.md },
              ((s as { hovered?: boolean }).hovered || s.pressed) && { backgroundColor: colors.surface },
            ]}
          >
            <Cover book={{ title: r.title, authors: r.authors, coverId: r.coverId }} size="sm" shadow={false} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong" numberOfLines={2}>
                {r.title}
              </Text>
              <Text variant="small" tone="muted" numberOfLines={1}>
                {[r.authors.slice(0, 2).join(', '), r.firstPublishYear].filter(Boolean).join(' · ')}
              </Text>
            </View>
            {r.editionCount && r.editionCount > 1 ? (
              <Text variant="mono" tone="faint">
                {r.editionCount} eds
              </Text>
            ) : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function LogDetail({ work, onBack }: { work: WorkResult; onBack: () => void }) {
  const { provider, logBook } = useLibrary();
  const nav = useNav();
  const { library } = useLibrary();
  const { colors } = useTheme();
  const [editions, setEditions] = useState<EditionResult[] | null>(null);
  const [editionId, setEditionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'finished' | 'reading'>('finished');
  const [showAll, setShowAll] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const ctrl = new AbortController();
    provider
      .getEditions(work.externalWorkId, { signal: ctrl.signal })
      .then((eds) => {
        if (!mounted.current) return;
        const ranked = rankEditions(eds).filter((e) => e.pageCount);
        setEditions(ranked);
        setEditionId(ranked[0]?.externalEditionId ?? null);
      })
      .catch(() => mounted.current && setEditions([]));
    return () => {
      mounted.current = false;
      ctrl.abort();
    };
  }, [provider, work.externalWorkId]);

  const edition = editions?.find((e) => e.externalEditionId === editionId);
  const visible = showAll ? editions : editions?.slice(0, 4);

  const submit = () => {
    const bookId = logBook(work, edition, status);
    nav.push(status === 'finished' ? routes.rank(bookId) : routes.profile(library.profile.handle));
  };

  return (
    <View style={{ gap: space[5], paddingTop: space[4] }}>
      <View style={{ flexDirection: 'row', gap: space[5], alignItems: 'flex-end' }}>
        <Cover book={{ title: work.title, authors: work.authors, coverId: edition?.coverId ?? work.coverId }} size="lg" />
        <View style={{ flex: 1, gap: space[1] }}>
          <Text variant="title">{work.title}</Text>
          <Text variant="body" tone="muted">
            {[work.authors.slice(0, 2).join(', '), work.firstPublishYear].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </View>

      <Card style={{ gap: space[4] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: space[3] }}>
          <Text variant="label" tone="muted">
            Edition
          </Text>
          {editions === null ? <ActivityIndicator color={colors.textMuted} /> : null}
        </View>
        {editions && editions.length === 0 ? (
          <Text variant="small" tone="muted">
            {work.pagesMedian
              ? `No edition details. We'll use ${formatNumber(work.pagesMedian)} pages, the typical length.`
              : 'No edition details for this one.'}
          </Text>
        ) : null}
        <View style={{ gap: 4 }}>
          {visible?.map((e) => {
            const active = e.externalEditionId === editionId;
            return (
              <Pressable
                key={e.externalEditionId}
                onPress={() => setEditionId(e.externalEditionId)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space[3],
                  padding: space[3],
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: active ? colors.accent : colors.border,
                  backgroundColor: active ? colors.bg : 'transparent',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="small" numberOfLines={1} style={{ fontWeight: active ? '600' : '400' }}>
                    {[e.publisher, e.publishYear].filter(Boolean).join(', ') || e.title}
                  </Text>
                  {e.format ? (
                    <Text variant="small" tone="faint" numberOfLines={1}>
                      {e.format}
                    </Text>
                  ) : null}
                </View>
                <Text variant="mono" tone={active ? 'default' : 'muted'}>
                  {e.pageCount} pp
                </Text>
              </Pressable>
            );
          })}
        </View>
        {editions && editions.length > 4 ? (
          <Pressable onPress={() => setShowAll((v) => !v)} accessibilityRole="button">
            <Text variant="small" tone="muted">
              {showAll ? 'Fewer editions' : `All ${editions.length} editions`}
            </Text>
          </Pressable>
        ) : null}
      </Card>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[3], flexWrap: 'wrap' }}>
        <Segmented
          options={[
            { key: 'finished', label: 'Finished' },
            { key: 'reading', label: 'Reading' },
          ]}
          value={status}
          onChange={setStatus}
        />
        <View style={{ flexDirection: 'row', gap: space[2] }}>
          <Button label="Back" kind="ghost" onPress={onBack} />
          <Button label={status === 'finished' ? 'Finish & rank' : 'Start reading'} size="lg" onPress={submit} />
        </View>
      </View>
    </View>
  );
}
