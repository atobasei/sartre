import type { FirebaseOptions } from 'firebase/app';

/**
 * A `demo-` project needs no Firebase console setup: the emulators accept it and
 * the SDK never reaches production. Used whenever an app has no real config.
 */
export const DEMO_OPTIONS: FirebaseOptions = {
  apiKey: 'demo-key',
  authDomain: 'demo-sartre.firebaseapp.com',
  projectId: 'demo-sartre',
  storageBucket: 'demo-sartre.appspot.com',
};

// Must match firebase.json at the repo root.
export const EMULATOR_PORTS = { auth: 9099, firestore: 8080, storage: 9199 } as const;
