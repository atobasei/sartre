import { COVER_ASPECT, coverSize, fonts, radius, type CoverSize } from '@sartre/tokens';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from './theme';

export interface CoverBook {
  title: string;
  authors?: readonly { name: string }[] | readonly string[];
  coverId?: number;
}

export interface CoverProps {
  book: CoverBook;
  size?: CoverSize;
  /** Overrides `size` with an explicit width in px. */
  width?: number;
  shadow?: boolean;
  style?: StyleProp<ViewStyle>;
}

const authorName = (book: CoverBook) => {
  const first = book.authors?.[0];
  return typeof first === 'string' ? first : first?.name;
};

/** Stable per-title pick so the same book always gets the same fallback tint. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * A book cover at 2:3. Loads the Open Library cover by cover ID (`?default=false`
 * makes OL 404 instead of serving a blank 1×1, so missing covers fail fast) and
 * falls back to a typeset cover in the theme's palette.
 */
export function Cover({ book, size = 'md', width, shadow = true, style }: CoverProps) {
  const { colors, scheme } = useTheme();
  const w = width ?? coverSize[size];
  const h = Math.round(w * COVER_ASPECT);
  // No "loaded" state on purpose: with SSR an image can finish loading before
  // hydration and its onLoad never reaches React. The skeleton color sits behind
  // the image instead, so a slow cover simply appears when it arrives.
  const [failed, setFailed] = useState(!book.coverId);
  useEffect(() => setFailed(!book.coverId), [book.coverId]);
  const imageSize = w > 150 ? 'L' : 'M';
  const author = authorName(book);
  const tint = colors.coverTints[hash(book.title) % colors.coverTints.length];

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${book.title}${author ? ` by ${author}` : ''}`}
      style={[
        styles.frame,
        { width: w, height: h, backgroundColor: failed ? tint : colors.surfaceAlt },
        shadow && {
          boxShadow:
            scheme === 'light'
              ? '0 1px 2px rgba(40,30,20,0.18), 0 6px 16px -6px rgba(40,30,20,0.25)'
              : '0 1px 2px rgba(0,0,0,0.5), 0 8px 20px -8px rgba(0,0,0,0.6)',
        },
        style,
      ]}
    >
      {failed ? (
        <View style={[styles.fallback, { padding: Math.max(4, w * 0.1) }]}>
          <View style={[styles.rule, { backgroundColor: colors.coverInk, width: w * 0.22 }]} />
          <Text
            numberOfLines={w < 60 ? 3 : 5}
            style={{
              fontFamily: fonts.display,
              color: colors.coverInk,
              fontSize: Math.max(7, w * 0.12),
              lineHeight: Math.max(8, w * 0.14),
              fontWeight: '500',
            }}
          >
            {book.title}
          </Text>
          {author && w >= 56 ? (
            <Text
              numberOfLines={2}
              style={{ fontFamily: fonts.sans, color: colors.coverInk, opacity: 0.7, fontSize: Math.max(7, w * 0.07), marginTop: 'auto' }}
            >
              {author}
            </Text>
          ) : null}
        </View>
      ) : (
        <Image
          source={{ uri: `https://covers.openlibrary.org/b/id/${book.coverId}-${imageSize}.jpg?default=false` }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      )}
      {/* Hairline inner edge: makes pale covers read as objects on pale themes. */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.edge]} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.cover, overflow: 'hidden' },
  fallback: { flex: 1, gap: 6 },
  rule: { height: 2, opacity: 0.6, marginBottom: 2 },
  edge: { borderRadius: radius.cover, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.12)' },
});
