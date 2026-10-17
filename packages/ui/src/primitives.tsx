import type { Bucket } from '@sartre/core';
import { radius, space } from '@sartre/tokens';
import type { ReactNode } from 'react';
import {
  Image,
  Pressable,
  View,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Text } from './Text';
import { makeStyles, useTheme } from './theme';

/** react-native-web adds `hovered` to the pressable state. */
type WebPressState = PressableStateCallbackType & { hovered?: boolean };

// ─── Buttons ────────────────────────────────────────────────────────────────

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  kind?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, kind = 'primary', size = 'md', icon, style, ...rest }: ButtonProps) {
  const s = useButtonStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      style={(state) => {
        const { pressed, hovered } = state as WebPressState;
        return [
          s.base,
          size === 'lg' && s.lg,
          s[kind],
          hovered && kind !== 'primary' && { backgroundColor: colors.surfaceAlt },
          (pressed || hovered) && kind === 'primary' && { opacity: 0.88 },
          rest.disabled && { opacity: 0.4 },
          style,
        ];
      }}
    >
      {icon}
      <Text variant="bodyStrong" tone={kind === 'primary' ? 'onAccent' : 'default'} style={size === 'md' && { fontSize: 15 }}>
        {label}
      </Text>
    </Pressable>
  );
}

const useButtonStyles = makeStyles((t) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    paddingHorizontal: space[4],
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  lg: { paddingVertical: 14, paddingHorizontal: space[5] },
  primary: { backgroundColor: t.colors.accent },
  secondary: { backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border },
  ghost: { backgroundColor: 'transparent' },
}));

// ─── Bucket tag ─────────────────────────────────────────────────────────────

export const BUCKET_LABELS: Record<Bucket, string> = { loved: 'Loved', liked: 'Liked', meh: 'Meh' };

export function BucketTag({ bucket, size = 'sm' }: { bucket: Bucket; size?: 'sm' | 'md' }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: size === 'md' ? 8 : 6, height: size === 'md' ? 8 : 6, borderRadius: 4, backgroundColor: colors[bucket] }} />
      <Text variant={size === 'md' ? 'small' : 'label'} tone={bucket} style={size === 'sm' && { letterSpacing: 0.8 }}>
        {BUCKET_LABELS[bucket]}
      </Text>
    </View>
  );
}

// ─── Progress ───────────────────────────────────────────────────────────────

export function ProgressBar({ value, height = 4 }: { value: number; height?: number }) {
  const { colors } = useTheme();
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 1000) / 10;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      style={{ height, borderRadius: height, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}
    >
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: height, backgroundColor: colors.accent }} />
    </View>
  );
}

// ─── Avatar ─────────────────────────────────────────────────────────────────

export function Avatar({ name, uri, size = 72 }: { name: string; uri?: string; size?: number }) {
  const { colors } = useTheme();
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.surfaceAlt,
        borderWidth: 3,
        borderColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
      ) : (
        <Text variant="heading" tone="muted" style={{ fontSize: size * 0.34, lineHeight: size * 0.4 }}>
          {initials}
        </Text>
      )}
    </View>
  );
}

// ─── Tabs ───────────────────────────────────────────────────────────────────

export interface TabsProps<K extends string> {
  tabs: readonly { key: K; label: string; count?: number }[];
  value: K;
  onChange: (key: K) => void;
}

export function Tabs<K extends string>({ tabs, value, onChange }: TabsProps<K>) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: space[5], borderBottomWidth: 1, borderBottomColor: colors.border }}>
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(tab.key)}
            style={{
              paddingVertical: space[3],
              marginBottom: -1,
              borderBottomWidth: 2,
              borderBottomColor: active ? colors.text : 'transparent',
              flexDirection: 'row',
              gap: 6,
              alignItems: 'baseline',
            }}
          >
            <Text variant={active ? 'bodyStrong' : 'body'} tone={active ? 'default' : 'muted'} style={{ fontSize: 15 }}>
              {tab.label}
            </Text>
            {tab.count ? (
              <Text variant="mono" tone="faint">
                {tab.count}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Layout helpers ─────────────────────────────────────────────────────────

export function SectionLabel({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: space[3] }}>
      <Text variant="label" tone="muted">
        {children}
      </Text>
      {right}
    </View>
  );
}

export function Card({ children, style, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
        padded && { padding: space[5] },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Segmented<K extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, padding: 3 }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: radius.pill,
              backgroundColor: active ? colors.surface : 'transparent',
            }}
          >
            <Text variant="small" tone={active ? 'default' : 'muted'} style={{ fontWeight: active ? '600' : '400', fontSize: 13 }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
