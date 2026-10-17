import { catalog } from '@sartre/mock';
import { coverSize, radius, space, themeNames, type, type CoverSize, type ThemeColors, type TypeVariant } from '@sartre/tokens';
import { BucketTag, Button, Card, Cover, ProgressBar, Segmented, Text, ThemeProvider, useTheme } from '@sartre/ui';
import { useState } from 'react';
import { View } from 'react-native';

/** /design — tokens and components rendered in every theme, for tuning by eye. */
export function DesignScreen() {
  return (
    <View style={{ gap: space[7], paddingTop: space[4] }}>
      <View style={{ gap: space[1] }}>
        <Text variant="label" tone="muted">
          Design system
        </Text>
        <Text variant="title">Tokens, type, covers</Text>
      </View>
      {themeNames.map((name) => (
        <ThemeProvider key={name} name={name}>
          <ThemePanel />
        </ThemeProvider>
      ))}
    </View>
  );
}

const SWATCHES: (keyof ThemeColors)[] = ['bg', 'surface', 'surfaceAlt', 'border', 'text', 'textMuted', 'textFaint', 'accent', 'loved', 'liked', 'meh'];
const TYPE_ROWS: TypeVariant[] = ['hero', 'display', 'title', 'heading', 'body', 'small', 'label', 'statXL', 'stat', 'mono'];

function ThemePanel() {
  const theme = useTheme();
  const c = theme.colors;
  const [seg, setSeg] = useState<'a' | 'b'>('a');
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: radius.lg, padding: space[5], gap: space[6], borderWidth: 1, borderColor: c.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space[3] }}>
        <Text variant="title">{theme.label}</Text>
        <Text variant="mono" tone="faint">
          {theme.scheme}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[3] }}>
        {SWATCHES.map((k) => (
          <View key={k} style={{ width: 84, gap: 6 }}>
            <View style={{ height: 44, borderRadius: radius.sm, backgroundColor: c[k] as string, borderWidth: 1, borderColor: c.border }} />
            <Text variant="mono" tone="muted" style={{ fontSize: 11 }}>
              {k}
            </Text>
            <Text variant="mono" tone="faint" style={{ fontSize: 10 }}>
              {c[k] as string}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ gap: space[3] }}>
        {TYPE_ROWS.map((v) => (
          <View key={v} style={{ flexDirection: 'row', alignItems: 'baseline', gap: space[4] }}>
            <Text variant="mono" tone="faint" style={{ width: 64 }}>
              {v}
            </Text>
            <Text variant={v} numberOfLines={1} style={{ flex: 1 }}>
              {v.startsWith('stat') ? '1,284' : v === 'mono' ? 'p. 212 of 560 · 38%' : 'The Remains of the Day'}
            </Text>
            <Text variant="mono" tone="faint" style={{ fontSize: 10 }}>
              {type[v].fontSize}/{type[v].lineHeight}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ gap: space[3] }}>
        <Text variant="label" tone="muted">
          Covers · xs → xl, with fallbacks
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space[4], flexWrap: 'wrap' }}>
          {(Object.keys(coverSize) as CoverSize[]).map((s) => (
            <Cover key={s} book={catalog.piranesi.book} size={s} />
          ))}
          <Cover book={catalog.annaKarenina.book} size="lg" />
          <Cover book={{ title: 'A Book With No Cover On File', authors: ['Unknown Author'] }} size="md" />
          <Cover book={{ title: 'Broken cover ID', authors: ['Fallback on 404'], coverId: 999999999 }} size="sm" />
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[5], alignItems: 'center' }}>
        <Button label="Finish & rank" />
        <Button label="Share card" kind="secondary" />
        <Button label="Re-rank" kind="ghost" />
        <Segmented
          options={[
            { key: 'a', label: 'Ranked' },
            { key: 'b', label: 'Recent' },
          ]}
          value={seg}
          onChange={setSeg}
        />
        <BucketTag bucket="loved" size="md" />
        <BucketTag bucket="liked" size="md" />
        <BucketTag bucket="meh" size="md" />
      </View>

      <Card style={{ gap: space[3], maxWidth: 420 }}>
        <Text variant="bodyStrong">Demon Copperhead</Text>
        <ProgressBar value={212 / 560} />
        <Text variant="mono" tone="muted">
          p. 212 of 560 · 38%
        </Text>
      </Card>
    </View>
  );
}
