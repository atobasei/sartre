import type { FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, type Auth } from 'firebase/auth';

// Web: Google's own account chooser in a popup. `select_account` makes it list
// every Google account signed into the browser instead of reusing the last one.

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
    // Closing the chooser is a choice, not an error.
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
    if (code === 'auth/popup-blocked') return signInWithRedirect(auth, provider);
    throw e;
  }
}
