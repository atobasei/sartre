import { PRIVACY_LABELS, PRIVACY_LEVELS } from '@sartre/core';
import { VOLUME_LABELS, VOLUME_STATES } from '@sartre/mock';
import { radius, space, themeNames, themes } from '@sartre/tokens';
import { Segmented, Text, useTheme, useViewport } from '@sartre/ui';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { routes, useNav } from './nav';
import { useSettings, type PrototypeSettings } from './settings';
import { useLibrary } from './store';

/**
 * Prototype-only control panel: volume state, theme, viewer/privacy, and the
 * open design questions. Everything here lives in the URL on web, so a given
 * combination can be linked and screenshotted.
 */
export function DevToolbar() {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();
  const { settings, update } = useSettings();
  const { library } = useLibrary();
  const nav = useNav();
  const { width, height } = useViewport();

  const set = <K extends keyof PrototypeSettings>(key: K) => (value: PrototypeSettings[K]) => update({ [key]: value } as Partial<PrototypeSettings>);
  const sample = library.completions.at(-1);

  return (
    <View style={{ position: 'absolute', right: 16, bottom: 16, alignItems: 'flex-end', gap: space[2], maxWidth: width - 32 }}>
      {open ? (
        <View
          style={{
            width: 340,
            maxWidth: width - 32,
            maxHeight: height - 100,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            boxShadow: '0 16px 48px -12px rgba(0,0,0,0.35)',
          }}
        >
          <ScrollView contentContainerStyle={{ padding: space[4], gap: space[4] }}>
            <Row label="Data">
              <Segmented
                options={[
                  { key: 'mock', label: 'Mock' },
                  { key: 'firebase', label: 'Firebase' },
                ]}
                value={settings.data}
                onChange={set('data')}
              />
            </Row>
            {settings.data === 'mock' ? (
              <Row label="Volume">
                <Segmented options={VOLUME_STATES.map((v) => ({ key: v, label: VOLUME_LABELS[v] }))} value={settings.volume} onChange={set('volume')} />
              </Row>
            ) : null}
            <Row label="Theme">
              <View style={{ flexDirection: 'row', gap: space[2], flexWrap: 'wrap' }}>
                {themeNames.map((name) => {
                  const t = themes[name];
                  const active = settings.theme === name;
                  return (
                    <Pressable
                      key={name}
                      onPress={() => update({ theme: name })}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: radius.pill,
                        backgroundColor: t.colors.bg,
                        borderWidth: 1.5,
                        borderColor: active ? colors.accent : t.colors.border,
                      }}
                    >
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.accent }} />
                      <Text variant="small" style={{ color: t.colors.text, fontSize: 13 }}>
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Row>
            <Row label="View as">
              <Segmented
                options={[
                  { key: 'owner', label: 'Owner' },
                  { key: 'public', label: 'Visitor' },
                ]}
                value={settings.viewer}
                onChange={set('viewer')}
              />
            </Row>
            {settings.viewer === 'public' ? (
              <Row label="Privacy dial">
                <Segmented options={PRIVACY_LEVELS.map((p) => ({ key: p, label: PRIVACY_LABELS[p] }))} value={settings.privacy} onChange={set('privacy')} />
              </Row>
            ) : null}
            <Row label="Monthly view">
              <Segmented
                options={[
                  { key: 'covers', label: 'Covers' },
                  { key: 'bars', label: 'Bars' },
                  { key: 'both', label: 'Both' },
                ]}
                value={settings.monthView}
                onChange={set('monthView')}
              />
            </Row>
            <Row label="Rank shown as">
              <Segmented
                options={[
                  { key: 'position', label: 'Position' },
                  { key: 'score', label: 'Score' },
                  { key: 'both', label: 'Both' },
                ]}
                value={settings.rankDisplay}
                onChange={set('rankDisplay')}
              />
            </Row>
            <Row label="Banner">
              <Segmented
                options={[
                  { key: 'topFour', label: 'Top four' },
                  { key: 'collage', label: 'Collage' },
                ]}
                value={settings.banner}
                onChange={set('banner')}
              />
            </Row>
            <Row label="Search source">
              <Segmented
                options={[
                  { key: 'live', label: 'Open Library' },
                  { key: 'mock', label: 'Mock' },
                ]}
                value={settings.search}
                onChange={set('search')}
              />
            </Row>
            <Row label="Jump to">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[3] }}>
                <JumpLink label="Profile" onPress={() => nav.push(routes.profile(library.profile.handle))} />
                <JumpLink label="Log" onPress={() => nav.push(routes.log())} />
                {sample ? <JumpLink label="Rank flow" onPress={() => nav.push(routes.rank(sample.bookId, true))} /> : null}
                {sample ? <JumpLink label="Share card" onPress={() => nav.push(routes.card(sample.readId))} /> : null}
                <JumpLink label="Design system" onPress={() => nav.push(routes.design())} />
              </View>
            </Row>
          </ScrollView>
        </View>
      ) : null}
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel="Prototype controls"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderRadius: radius.pill,
          backgroundColor: colors.text,
          boxShadow: '0 8px 24px -8px rgba(0,0,0,0.4)',
        }}
      >
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent }} />
        <Text variant="small" style={{ color: colors.bg, fontWeight: '600', fontSize: 13 }}>
          {open ? 'Close' : `Prototype · ${settings.data === 'firebase' ? 'Firebase' : VOLUME_LABELS[settings.volume]}`}
        </Text>
      </Pressable>
    </View>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label" tone="faint" style={{ fontSize: 11 }}>
        {label}
      </Text>
      <View style={{ alignItems: 'flex-start' }}>{children}</View>
    </View>
  );
}

function JumpLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link">
      <Text variant="small" tone="accent" style={{ fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}
