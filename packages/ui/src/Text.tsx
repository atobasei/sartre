import type { Bucket } from '@sartre/core';
import { type as typeScale, type ThemeColors, type TypeVariant } from '@sartre/tokens';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useTheme } from './theme';

export type Tone = 'default' | 'muted' | 'faint' | 'accent' | 'onAccent' | Bucket;

const toneColor = (c: ThemeColors, tone: Tone): string =>
  ({
    default: c.text,
    muted: c.textMuted,
    faint: c.textFaint,
    accent: c.accent,
    onAccent: c.onAccent,
    loved: c.loved,
    liked: c.liked,
    meh: c.meh,
  })[tone];

const NUMERIC: ReadonlySet<TypeVariant> = new Set(['statXL', 'stat', 'mono']);

export interface TextProps extends RNTextProps {
  variant?: TypeVariant;
  tone?: Tone;
  align?: 'left' | 'center' | 'right';
}

export function Text({ variant = 'body', tone = 'default', align, style, ...rest }: TextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        typeScale[variant],
        { color: toneColor(colors, tone) },
        NUMERIC.has(variant) && { fontVariant: ['tabular-nums'] },
        align && { textAlign: align },
        style,
      ]}
    />
  );
}
