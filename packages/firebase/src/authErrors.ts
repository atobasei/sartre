// Firebase auth error codes → copy for people. Wrong email and wrong password
// read the same, so the form can't be used to find out who has an account.

const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/invalid-email': 'That doesn’t look like an email address.',
  'auth/missing-password': 'Enter your password.',
  'auth/weak-password': 'Use at least 8 characters.',
  'auth/password-does-not-meet-requirements': 'Use at least 8 characters.',
  'auth/email-already-in-use': 'There’s already an account with this email. Sign in instead.',
  'auth/account-exists-with-different-credential': 'This email signs in with Google.',
  'auth/too-many-requests': 'Too many attempts. Try again later, or reset your password.',
  'auth/popup-blocked': 'The browser blocked the Google window. Allow popups for this site and try again.',
  'auth/network-request-failed': 'Can’t reach the server. Check your connection.',
  'auth/user-disabled': 'This account has been disabled.',
};

/** Expected failures (wrong password, taken email…) aren't bugs and needn't be logged. */
export function isExpectedAuthError(error: unknown): boolean {
  const e = error as { name?: string; code?: string };
  return e?.name === 'UnsupportedError' || Boolean(e?.code && e.code in MESSAGES);
}

export function authErrorMessage(error: unknown): string {
  const e = error as { name?: string; code?: string; message?: string };
  if (e?.name === 'UnsupportedError' && e.message) return e.message;
  return (e?.code && MESSAGES[e.code]) || 'That didn’t work. Try again.';
}
