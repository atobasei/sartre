import type { FirebaseApp } from 'firebase/app';
import { getAuth, inMemoryPersistence, initializeAuth, type Auth } from 'firebase/auth';
import { UnsupportedError } from './types';

// Native. Email + password works through the shared backend. Google needs
// @react-native-google-signin (a dev build, not Expo Go) and lands in the native
// auth slice, along with AsyncStorage persistence so sessions survive restarts.

export function createAuth(app: FirebaseApp, fresh: boolean): Auth {
  return fresh ? initializeAuth(app, { persistence: inMemoryPersistence }) : getAuth(app);
}

export async function signInWithGoogle(_auth: Auth): Promise<void> {
  throw new UnsupportedError('Google sign-in on mobile arrives with the dev build. Use email for now.');
}
