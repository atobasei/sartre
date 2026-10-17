import { PRIVACY_LEVELS, type PrivacyLevel } from '@sartre/core';
import { VOLUME_STATES, type VolumeState } from '@sartre/mock';
import { defaultTheme, isThemeName, type ThemeName } from '@sartre/tokens';
import { createContext, useContext, type ReactNode } from 'react';

// Prototype-only knobs, driven by the dev toolbar. Several of these exist to settle
// open product questions by looking (monthly view, rank display).

export type Viewer = 'owner' | 'public';
export type MonthView = 'covers' | 'bars' | 'both';
export type RankDisplay = 'position' | 'score' | 'both';
export type SearchSource = 'live' | 'mock';
export type BannerStyle = 'topFour' | 'collage';

export interface PrototypeSettings {
  volume: VolumeState;
  theme: ThemeName;
  viewer: Viewer;
  privacy: PrivacyLevel;
  monthView: MonthView;
  rankDisplay: RankDisplay;
  banner: BannerStyle;
  search: SearchSource;
}

export const DEFAULT_SETTINGS: PrototypeSettings = {
  volume: 'one',
  theme: defaultTheme,
  viewer: 'owner',
  privacy: 'open',
  monthView: 'covers',
  rankDisplay: 'position',
  banner: 'topFour',
  search: 'live',
};

const pick = <T extends string>(value: string | null | undefined, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

/** Short query keys so prototype URLs stay readable and shareable. */
const KEYS = {
  volume: 'n',
  theme: 'theme',
  viewer: 'as',
  privacy: 'privacy',
  monthView: 'months',
  rankDisplay: 'rank',
  banner: 'banner',
  search: 'src',
} as const;
const VOLUME_PARAM: Record<VolumeState, string> = { one: '1', four: '4', thirty: '30' };

export function settingsFromParams(get: (key: string) => string | null | undefined): PrototypeSettings {
  const volumeParam = get(KEYS.volume);
  const volume = VOLUME_STATES.find((v) => VOLUME_PARAM[v] === volumeParam) ?? DEFAULT_SETTINGS.volume;
  const theme = get(KEYS.theme);
  return {
    volume,
    theme: isThemeName(theme) ? theme : DEFAULT_SETTINGS.theme,
    viewer: pick(get(KEYS.viewer), ['owner', 'public'], DEFAULT_SETTINGS.viewer),
    privacy: pick(get(KEYS.privacy), PRIVACY_LEVELS, DEFAULT_SETTINGS.privacy),
    monthView: pick(get(KEYS.monthView), ['covers', 'bars', 'both'], DEFAULT_SETTINGS.monthView),
    rankDisplay: pick(get(KEYS.rankDisplay), ['position', 'score', 'both'], DEFAULT_SETTINGS.rankDisplay),
    banner: pick(get(KEYS.banner), ['topFour', 'collage'], DEFAULT_SETTINGS.banner),
    search: pick(get(KEYS.search), ['live', 'mock'], DEFAULT_SETTINGS.search),
  };
}

/** Only non-default values are written, so a default URL stays clean. */
export function settingsToParams(s: PrototypeSettings): URLSearchParams {
  const p = new URLSearchParams();
  if (s.volume !== DEFAULT_SETTINGS.volume) p.set(KEYS.volume, VOLUME_PARAM[s.volume]);
  for (const key of ['theme', 'viewer', 'privacy', 'monthView', 'rankDisplay', 'banner', 'search'] as const) {
    if (s[key] !== DEFAULT_SETTINGS[key]) p.set(KEYS[key], s[key]);
  }
  return p;
}

interface SettingsContextValue {
  settings: PrototypeSettings;
  update: (patch: Partial<PrototypeSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue>({ settings: DEFAULT_SETTINGS, update: () => {} });

export function SettingsProvider({ value, children }: { value: SettingsContextValue; children: ReactNode }) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
