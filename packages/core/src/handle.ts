// Handles are the profile URL (/@handle) and the `handles/{handle}` uniqueness key.
// Lowercase only, so "Mara" and "mara" can't both exist. Keep HANDLE_PATTERN in
// sync with firestore.rules, which enforces the same shape server-side.

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 20;
export const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;

/** What the user typed → the stored form: trimmed, no leading "@", lowercase. */
export function normalizeHandle(input: string): string {
  return input.trim().replace(/^@/, '').toLowerCase();
}

export type HandleProblem = 'short' | 'long' | 'chars';

export function handleProblem(handle: string): HandleProblem | undefined {
  if (handle.length < HANDLE_MIN) return 'short';
  if (handle.length > HANDLE_MAX) return 'long';
  if (!HANDLE_PATTERN.test(handle)) return 'chars';
  return undefined;
}

/** A starting suggestion from a display name or email: "Mara Lindqvist" → "maralindqvist". */
export function suggestHandle(source: string): string {
  const base = source.split('@')[0]!.toLowerCase().replace(/[^a-z0-9_]/g, '');
  return base.slice(0, HANDLE_MAX);
}
