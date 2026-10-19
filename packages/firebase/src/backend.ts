import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, initializeFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { createAuth, signInWithGoogle } from './auth';
import { EMULATOR_PORTS } from './config';
import { isLocalImage, uploadProfileImage } from './repos/images';
import { claimHandle, getProfile, updateProfile } from './repos/users';
import { UnsupportedError, type Backend, type SessionUser } from './types';

export interface BackendConfig {
  options: FirebaseOptions;
  /** Set to talk to the local emulators (e.g. "127.0.0.1", or a LAN IP from a phone). */
  emulatorHost?: string;
}

const toSessionUser = (user: User): SessionUser => ({
  uid: user.uid,
  email: user.email ?? undefined,
  emailVerified: user.emailVerified,
  providers: user.providerData.map((p) => p.providerId),
});

export function createBackend({ options, emulatorHost }: BackendConfig): Backend {
  // Hot reloads re-run the caller; the SDK only allows initialize/connect once per app.
  const existing = getApps()[0];
  const fresh = !existing;
  const app = existing ?? initializeApp(options);
  const db = fresh ? initializeFirestore(app, { ignoreUndefinedProperties: true }) : getFirestore(app);
  const auth = createAuth(app, fresh);
  // No bucket configured = no Storage on this project (free Spark plan), so uploads are off.
  const storage = options.storageBucket ? getStorage(app) : undefined;
  if (fresh && emulatorHost) {
    connectAuthEmulator(auth, `http://${emulatorHost}:${EMULATOR_PORTS.auth}`, { disableWarnings: true });
    connectFirestoreEmulator(db, emulatorHost, EMULATOR_PORTS.firestore);
    if (storage) connectStorageEmulator(storage, emulatorHost, EMULATOR_PORTS.storage);
  }

  return {
    usingEmulators: Boolean(emulatorHost),
    imageUploads: Boolean(storage),
    onUser: (listener) => onAuthStateChanged(auth, (user) => listener(user && toSessionUser(user))),
    signInWithGoogle: () => signInWithGoogle(auth),
    async signUpWithPassword(email, password) {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(user);
    },
    async signInWithPassword(email, password) {
      await signInWithEmailAndPassword(auth, email, password);
    },
    async sendPasswordReset(email) {
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (e) {
        // Same outcome either way, so the form can't reveal who has an account.
        if ((e as { code?: string }).code !== 'auth/user-not-found') throw e;
      }
    },
    async resendVerification() {
      if (auth.currentUser) await sendEmailVerification(auth.currentUser);
    },
    async refreshUser() {
      const user = auth.currentUser;
      if (!user) return null;
      await user.reload();
      // Rules read email_verified from the ID token, so mint one that includes it.
      await user.getIdToken(true);
      return toSessionUser(user);
    },
    signOut: () => signOut(auth),
    getProfile: (uid) => getProfile(db, uid),
    claimHandle: (profile) => claimHandle(db, profile),
    async saveProfile(uid, patch) {
      const saved = { ...patch };
      const avatar = patch.avatarUrl && isLocalImage(patch.avatarUrl) ? patch.avatarUrl : undefined;
      const banner = patch.banner?.type === 'image' && isLocalImage(patch.banner.uri) ? patch.banner.uri : undefined;
      if ((avatar || banner) && !storage) throw new UnsupportedError('Photo uploads aren’t available yet.');
      if (avatar) saved.avatarUrl = await uploadProfileImage(storage!, uid, 'avatar', avatar);
      if (banner) saved.banner = { type: 'image', uri: await uploadProfileImage(storage!, uid, 'banner', banner) };
      await updateProfile(db, uid, saved);
      return saved;
    },
  };
}
