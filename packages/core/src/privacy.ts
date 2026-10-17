import { PRIVACY_LEVELS, type PrivacyLevel } from './types';

// The privacy dial. Each level includes everything below it:
//   private      → profile shell only (name, avatar)
//   completions  → finished books, rankings, timeline, share links
//   reports      → + long-form book reports
//   open         → + reading activity (currently reading, pages, check-ins)
// The same rules drive the public `profiles/{uid}` projection and security rules.

export interface Visibility {
  completions: boolean;
  reports: boolean;
  activity: boolean;
}

export function atLeast(level: PrivacyLevel, min: PrivacyLevel): boolean {
  return PRIVACY_LEVELS.indexOf(level) >= PRIVACY_LEVELS.indexOf(min);
}

export function visibilityFor(level: PrivacyLevel, viewer: 'owner' | 'public'): Visibility {
  if (viewer === 'owner') return { completions: true, reports: true, activity: true };
  return {
    completions: atLeast(level, 'completions'),
    reports: atLeast(level, 'reports'),
    activity: atLeast(level, 'open'),
  };
}

export const PRIVACY_LABELS: Record<PrivacyLevel, string> = {
  private: 'Private',
  completions: 'Completions',
  reports: 'Reports',
  open: 'Open',
};
