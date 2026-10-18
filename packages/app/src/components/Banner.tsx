import type { Book } from '@sartre/core';
import { Cover, useTheme } from '@sartre/ui';
import { Image, StyleSheet, View } from 'react-native';

/**
 * The profile banner is a taste signal, built from covers by default:
 *   - one book: its cover, blurred into a color field (no lonely single slot)
 *   - top four: the best-ranked covers standing on a shelf
 *   - collage: a full-bleed mosaic of covers the user picks
 * An uploaded image (`imageUri`) overrides all of these.
 */
export function Banner({
  books,
  style,
  height,
  compact,
  imageUri,
}: {
  books: Book[];
  style: 'topFour' | 'collage';
  height: number;
  compact: boolean;
  imageUri?: string;
}) {
  const { colors, scheme } = useTheme();

  if (imageUri) {
    return (
      <View style={[styles.frame, { height, backgroundColor: colors.surfaceAlt }]}>
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </View>
    );
  }

  const withCovers = books.filter((b) => b.coverId);
  const wash = scheme === 'light' ? 'rgba(243,238,228,0.35)' : 'rgba(0,0,0,0.35)';

  if (style === 'collage' && withCovers.length >= 3) {
    const tiles = withCovers.slice(0, compact ? 4 : 6);
    return (
      <View style={[styles.frame, { height, backgroundColor: colors.surfaceAlt, flexDirection: 'row' }]}>
        {tiles.map((b) => (
          <Image
            key={b.id}
            source={{ uri: `https://covers.openlibrary.org/b/id/${b.coverId}-M.jpg` }}
            style={{ flex: 1, height: '100%' }}
            resizeMode="cover"
          />
        ))}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: wash }]} />
      </View>
    );
  }

  const lead = withCovers[0];
  if (books.length <= 1 || style === 'collage') {
    return (
      <View style={[styles.frame, { height, backgroundColor: colors.surfaceAlt }]}>
        {lead ? (
          <Image
            source={{ uri: `https://covers.openlibrary.org/b/id/${lead.coverId}-M.jpg` }}
            blurRadius={48}
            style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.4 }], opacity: 0.85 }]}
            resizeMode="cover"
          />
        ) : null}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: wash }]} />
      </View>
    );
  }

  const shelf = books.slice(0, 4);
  const coverWidth = Math.min(compact ? 64 : 92, (height - 40) / 1.5);
  return (
    <View style={[styles.frame, { height, backgroundColor: colors.surfaceAlt }]}>
      {lead ? (
        <Image
          source={{ uri: `https://covers.openlibrary.org/b/id/${lead.coverId}-M.jpg` }}
          blurRadius={60}
          style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.6 }], opacity: 0.45 }]}
          resizeMode="cover"
        />
      ) : null}
      <View
        style={{
          position: 'absolute',
          right: compact ? 16 : 32,
          bottom: 20,
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: compact ? 8 : 12,
        }}
      >
        {shelf.map((b, i) => (
          <Cover key={b.id} book={b} width={i === 0 ? coverWidth * 1.08 : coverWidth} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', overflow: 'hidden', borderRadius: 16 },
});
