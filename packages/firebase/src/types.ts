import type { Profile, ProfilePatch } from '@sartre/core';

/** The signed-in Firebase user, reduced to what the app reads. */
export interface SessionUser {
  uid: string;
  email?: string;
  /** Google accounts arrive verified; password accounts verify by email link. */
  emailVerified: boolean;
  /** Sign-in methods on the account, e.g. ['password'] or ['google.com']. */
  providers: string[];
}

/**
 * Everything the app does with Firebase, behind one object the platform adapters
 * build. Shared screens only see this interface, never the SDK.
 */
export interface Backend {
  /** True when talking to the local emulators (emails are captured, not sent). */
  usingEmulators: boolean;
  /** Profile photos and image banners need Cloud Storage, which needs the Blaze plan. */
  imageUploads: boolean;
  onUser(listener: (user: SessionUser | null) => void): () => void;
  signInWithGoogle(): Promise<void>;
  /** Creates the account and sends the verification email. */
  signUpWithPassword(email: string, password: string): Promise<void>;
  signInWithPassword(email: string, password: string): Promise<void>;
  /** Resolves the same way whether or not the account exists. */
  sendPasswordReset(email: string): Promise<void>;
  resendVerification(): Promise<void>;
  /** Re-reads the user (and forces a fresh token) so a just-verified email counts. */
  refreshUser(): Promise<SessionUser | null>;
  signOut(): Promise<void>;

  getProfile(uid: string): Promise<Profile | null>;
  /** Creates the profile and claims `handles/{handle}` atomically. Throws HandleTakenError. */
  claimHandle(profile: Profile): Promise<void>;
  /** Uploads any local images in the patch, writes it, and returns it with hosted URLs. */
  saveProfile(uid: string, patch: ProfilePatch): Promise<ProfilePatch>;
}

export class HandleTakenError extends Error {
  constructor(readonly handle: string) {
    super(`@${handle} is taken`);
    this.name = 'HandleTakenError';
  }
}

/** Platforms report "not here yet" with this, so screens can show it plainly. */
export class UnsupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedError';
  }
}
