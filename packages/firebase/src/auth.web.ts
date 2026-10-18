import type { FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signInWithRedirect,
  type Auth,
} from 'firebase/auth';
import type { EmailLinkResult } from './types';

// Web: popup sign-in, and email links that come back to the page they were sent from.

const EMAIL_KEY = 'sartre.signInEmail';
const LINK_PARAMS = ['apiKey', 'oobCode', 'mode', 'lang', 'continueUrl', 'tenantId'];

/** getAuth is idempotent on web, so hot reloads don't need the `fresh` flag native uses. */
export function createAuth(app: FirebaseApp, _fresh: boolean): Auth {
  return getAuth(app);
}

export async function signInWithGoogle(auth: Auth): Promise<void> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    const code = (e as { code?: string }).code;
    // Closing the popup is a choice, not an error.
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
    if (code === 'auth/popup-blocked') return signInWithRedirect(auth, provider);
    throw e;
  }
}

export async function sendEmailLink(auth: Auth, email: string): Promise<void> {
  await sendSignInLinkToEmail(auth, email, { url: window.location.href, handleCodeInApp: true });
  remember(email);
}

export async function completeEmailLink(auth: Auth, email?: string): Promise<EmailLinkResult> {
  const href = window.location.href;
  if (!isSignInWithEmailLink(auth, href)) return 'none';
  const address = email ?? recall();
  if (!address) return 'needsEmail';
  await signInWithEmailLink(auth, address, href);
  remember(undefined);
  // The one-time code shouldn't stay in the address bar or history.
  const url = new URL(href);
  for (const key of LINK_PARAMS) url.searchParams.delete(key);
  window.history.replaceState(window.history.state, '', url);
  return 'done';
}

function remember(email: string | undefined) {
  try {
    if (email) window.localStorage.setItem(EMAIL_KEY, email);
    else window.localStorage.removeItem(EMAIL_KEY);
  } catch {
    // Storage blocked: the link then asks for the address again, which still works.
  }
}

function recall(): string | undefined {
  try {
    return window.localStorage.getItem(EMAIL_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}
