import { completionsInYear, visibilityFor } from '@sartre/core';
import { layout, space } from '@sartre/tokens';
import { Button, Card, Segmented, Text, useTheme, useViewport } from '@sartre/ui';
import { useRef, useState, type ComponentRef } from 'react';
import { Platform, View } from 'react-native';
import { CARD_DIRECTIONS, CARD_SIZE, ShareCard, type CardData, type CardDirection, type CardFormat } from '../components/ShareCard';
import { canExportCard, exportCard } from '../exportCard';
import { useSettings } from '../settings';
import { useLibrary } from '../store';

/** /c/:readId — the completion's own link, with the card in every direction to compare. */
export function CardScreen({ readId }: { readId: string }) {
  const { library } = useLibrary();
  const { settings } = useSettings();
  const theme = useTheme();
  const { width } = useViewport();
  const [format, setFormat] = useState<CardFormat>('story');
  const [direction, setDirection] = useState<CardDirection>('cover');

  const completion = library.completions.find((c) => c.readId === readId);
  const vis = visibilityFor(settings.privacy, settings.viewer === 'owner' ? 'owner' : 'public');

  if (!completion || !vis.completions) {
    return (
      <Card style={{ marginTop: space[6] }}>
        <Text variant="heading">{completion ? 'This completion is private.' : 'Nothing here.'}</Text>
      </Card>
    );
  }

  const book = library.books.get(completion.bookId)!;
  const year = new Date(completion.finishedAt).getFullYear();
  const ofYear = completionsInYear(library.completions, year).reverse();
  const data: CardData = {
    book,
    completion,
    handle: library.profile.handle,
    yearIndex: ofYear.findIndex((c) => c.readId === readId) + 1,
    theme,
  };

  const content = Math.min(width, layout.maxWidth) - 2 * layout.gutter;
  const { width: cw } = CARD_SIZE[format];
  const sideBySide = content >= (format === 'story' ? 3 * 240 : 2 * 380);
  const perRow = sideBySide ? (format === 'story' ? 3 : 2) : 1;
  const scale = Math.min(1, (content - (perRow - 1) * space[5]) / perRow / cw);
  const shown = sideBySide ? CARD_DIRECTIONS : CARD_DIRECTIONS.filter((d) => d.key === direction);

  return (
    <View style={{ gap: space[5], paddingTop: space[4] }}>
      <View style={{ gap: space[1] }}>
        <Text variant="label" tone="muted">
          Completion
        </Text>
        <Text variant="title">{book.title}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: space[3], flexWrap: 'wrap', alignItems: 'center' }}>
        <Segmented
          options={[
            { key: 'story', label: 'Story 9:16' },
            { key: 'og', label: 'Link preview' },
          ]}
          value={format}
          onChange={setFormat}
        />
        {!sideBySide ? (
          <Segmented options={CARD_DIRECTIONS.map((d) => ({ key: d.key, label: d.label.split(' · ')[1]! }))} value={direction} onChange={setDirection} />
        ) : null}
        {Platform.OS === 'web' ? <CopyLink /> : null}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[5] }}>
        {shown.map((d) => (
          <CardPreview key={`${d.key}-${format}`} data={data} direction={d.key} label={d.label} format={format} scale={scale} />
        ))}
      </View>
    </View>
  );
}

function CardPreview({
  data,
  direction,
  format,
  label,
  scale,
}: {
  data: CardData;
  direction: CardDirection;
  format: CardFormat;
  label: string;
  scale: number;
}) {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [busy, setBusy] = useState(false);
  const { width, height, pixelRatio } = CARD_SIZE[format];
  const slug = data.book.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <View style={{ gap: space[3] }}>
      <View style={{ width: width * scale, height: height * scale, borderRadius: 12, overflow: 'hidden', boxShadow: '0 12px 40px -12px rgba(0,0,0,0.35)' }}>
        {/* The scaler carries the transform so the exported node itself stays at full size. */}
        <View style={{ width, height, transform: [{ scale }], transformOrigin: 'top left' }}>
          <ShareCard ref={ref} {...data} direction={direction} format={format} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: width * scale }}>
        <Text variant="small" tone="muted">
          {label}
        </Text>
        {canExportCard ? (
          <Button
            label={busy ? 'Rendering…' : 'Download PNG'}
            kind="secondary"
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              try {
                await exportCard(ref.current, `${slug}-${direction}-${format}.png`, pixelRatio);
              } finally {
                setBusy(false);
              }
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

function CopyLink() {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      label={copied ? 'Link copied' : 'Copy link'}
      kind="ghost"
      onPress={() => {
        void navigator.clipboard?.writeText(window.location.href.split('?')[0]!).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        });
      }}
    />
  );
}
