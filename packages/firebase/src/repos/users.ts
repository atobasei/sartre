import type { Profile, ProfilePatch } from '@sartre/core';
import { deleteField, doc, getDoc, runTransaction, Timestamp, updateDoc, type Firestore } from 'firebase/firestore';
import { HandleTakenError } from '../types';

// users/{uid} holds the private profile (uid is the doc ID, not a field).
// handles/{handle} → { uid } is the uniqueness claim; firestore.rules only allow
// a users doc to be created in the same write as its handle claim.

type ProfileDoc = Omit<Profile, 'uid' | 'joinedAt'> & { joinedAt: Timestamp };

export async function getProfile(db: Firestore, uid: string): Promise<Profile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const { joinedAt, ...rest } = snap.data() as ProfileDoc;
  return { ...rest, uid, joinedAt: joinedAt.toDate().toISOString() };
}

export async function claimHandle(db: Firestore, profile: Profile): Promise<void> {
  const { uid, joinedAt, ...rest } = profile;
  const handleRef = doc(db, 'handles', profile.handle);
  await runTransaction(db, async (tx) => {
    if ((await tx.get(handleRef)).exists()) throw new HandleTakenError(profile.handle);
    tx.set(handleRef, { uid });
    tx.set(doc(db, 'users', uid), { ...rest, joinedAt: Timestamp.fromDate(new Date(joinedAt)) } satisfies ProfileDoc);
  });
}

export async function updateProfile(db: Firestore, uid: string, patch: ProfilePatch): Promise<void> {
  // An explicit `undefined` in the patch means "clear it" (e.g. an emptied bio).
  const data = Object.fromEntries(Object.entries(patch).map(([key, value]) => [key, value === undefined ? deleteField() : value]));
  await updateDoc(doc(db, 'users', uid), data);
}
