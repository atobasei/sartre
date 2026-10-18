import type { Profile, ProfilePatch } from '@sartre/core';

/** The signed-in Firebase user, reduced to what the app reads. */
export interface SessionUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

/** 'needsEmail': the link was opened on a different device, so we must ask which address it was sent to. */
export type EmailLinkResult = 'none' | 'needsEmail' | 'done';

/**
 * Everything the app does with Firebase, behind one object the platform adapters
 * build. Shared screens only see this interface, never the SDK.
 */
export interface Backend {
  /** True when talking to the local emulators (sign-in emails are printed, not sent). */
  usingEmulators: boolean;
  onUser(listener: (user: SessionUser | null) => void): () => void;
  signInWithGoogle(): Promise<void>;
  sendEmailLink(email: string): Promise<void>;
  /** Finishes an email-link sign-in if the current URL is one. */
  completeEmailLink(email?: string): Promise<EmailLinkResult>;
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
