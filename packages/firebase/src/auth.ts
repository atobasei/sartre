import type { FirebaseApp } from 'firebase/app';
import { getAuth, inMemoryPersistence, initializeAuth, type Auth } from 'firebase/auth';
import { UnsupportedError, type EmailLinkResult } from './types';

// Native. Google sign-in needs @react-native-google-signin (a dev build, not Expo
// Go) and email links need deep-link handling; both land in the native auth slice,
// along with AsyncStorage persistence so sessions survive restarts.

const NOT_YET = 'Sign-in on mobile arrives with the dev build. Use the web app for now.';

export function createAuth(app: FirebaseApp, fresh: boolean): Auth {
  return fresh ? initializeAuth(app, { persistence: inMemoryPersistence }) : getAuth(app);
}

export async function signInWithGoogle(_auth: Auth): Promise<void> {
  throw new UnsupportedError(NOT_YET);
}

export async function sendEmailLink(_auth: Auth, _email: string): Promise<void> {
  throw new UnsupportedError(NOT_YET);
}

export async function completeEmailLink(_auth: Auth, _email?: string): Promise<EmailLinkResult> {
  return 'none';
}
