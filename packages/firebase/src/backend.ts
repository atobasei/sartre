import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { connectAuthEmulator, onAuthStateChanged, signOut } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, initializeFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { completeEmailLink, createAuth, sendEmailLink, signInWithGoogle } from './auth';
import { EMULATOR_PORTS } from './config';
import { isLocalImage, uploadProfileImage } from './repos/images';
import { claimHandle, getProfile, updateProfile } from './repos/users';
import type { Backend } from './types';

export interface BackendConfig {
  options: FirebaseOptions;
  /** Set to talk to the local emulators (e.g. "127.0.0.1", or a LAN IP from a phone). */
  emulatorHost?: string;
}

export function createBackend({ options, emulatorHost }: BackendConfig): Backend {
  // Hot reloads re-run the caller; the SDK only allows initialize/connect once per app.
  const existing = getApps()[0];
  const fresh = !existing;
  const app = existing ?? initializeApp(options);
  const db = fresh ? initializeFirestore(app, { ignoreUndefinedProperties: true }) : getFirestore(app);
  const auth = createAuth(app, fresh);
  const storage = getStorage(app);
  if (fresh && emulatorHost) {
    connectAuthEmulator(auth, `http://${emulatorHost}:${EMULATOR_PORTS.auth}`, { disableWarnings: true });
    connectFirestoreEmulator(db, emulatorHost, EMULATOR_PORTS.firestore);
    connectStorageEmulator(storage, emulatorHost, EMULATOR_PORTS.storage);
  }

  return {
    usingEmulators: Boolean(emulatorHost),
    onUser: (listener) =>
      onAuthStateChanged(auth, (user) =>
        listener(
          user && {
            uid: user.uid,
            email: user.email ?? undefined,
            displayName: user.displayName ?? undefined,
            photoURL: user.photoURL ?? undefined,
          },
        ),
      ),
    signInWithGoogle: () => signInWithGoogle(auth),
    sendEmailLink: (email) => sendEmailLink(auth, email),
    completeEmailLink: (email) => completeEmailLink(auth, email),
    signOut: () => signOut(auth),
    getProfile: (uid) => getProfile(db, uid),
    claimHandle: (profile) => claimHandle(db, profile),
    async saveProfile(uid, patch) {
      const saved = { ...patch };
      if (patch.avatarUrl && isLocalImage(patch.avatarUrl)) {
        saved.avatarUrl = await uploadProfileImage(storage, uid, 'avatar', patch.avatarUrl);
      }
      if (patch.banner?.type === 'image' && isLocalImage(patch.banner.uri)) {
        saved.banner = { type: 'image', uri: await uploadProfileImage(storage, uid, 'banner', patch.banner.uri) };
      }
      await updateProfile(db, uid, saved);
      return saved;
    },
  };
}
