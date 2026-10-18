import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestContext, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, Timestamp, updateDoc, writeBatch, type Firestore } from 'firebase/firestore';
import { getBytes, ref, uploadBytes, type FirebaseStorage } from 'firebase/storage';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { EMULATOR_PORTS } from '../src/config';

// Runs against the emulators: `pnpm test:rules` from the repo root starts them.

const root = resolve(import.meta.dirname, '../../..');
let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-sartre-rules',
    firestore: { rules: readFileSync(resolve(root, 'firestore.rules'), 'utf8'), host: '127.0.0.1', port: EMULATOR_PORTS.firestore },
    storage: { rules: readFileSync(resolve(root, 'storage.rules'), 'utf8'), host: '127.0.0.1', port: EMULATOR_PORTS.storage },
  });
});
afterAll(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
});

const profile = (handle: string, extra: Record<string, unknown> = {}) => ({
  handle,
  displayName: 'Mara',
  banner: { type: 'topFour' },
  theme: 'paper',
  privacy: 'completions',
  joinedAt: Timestamp.now(),
  ...extra,
});

/** The same two writes claimHandle makes, as one atomic batch. */
const claim = (db: Firestore, uid: string, handle: string, extra?: Record<string, unknown>) => {
  const batch = writeBatch(db);
  batch.set(doc(db, 'handles', handle), { uid });
  batch.set(doc(db, 'users', uid), profile(handle, extra));
  return batch.commit();
};

// The test contexts hand out compat instances; the modular functions unwrap them at runtime.
const db = (ctx: RulesTestContext) => ctx.firestore() as unknown as Firestore;
const bucket = (ctx: RulesTestContext) => ctx.storage() as unknown as FirebaseStorage;
const as = (uid: string) => db(env.authenticatedContext(uid));
const anon = () => db(env.unauthenticatedContext());

describe('handles and profiles', () => {
  it('lets a user claim a free handle with their profile', async () => {
    await assertSucceeds(claim(as('alice'), 'alice', 'alice'));
  });

  it('refuses a handle someone already holds', async () => {
    await claim(as('bob'), 'bob', 'shared');
    await assertFails(claim(as('alice'), 'alice', 'shared'));
  });

  it('refuses a handle without the matching profile, or for someone else', async () => {
    await assertFails(setDoc(doc(as('alice'), 'handles', 'alice'), { uid: 'alice' }));
    await assertFails(claim(as('alice'), 'bob', 'bobby'));
  });

  it('refuses malformed handles and profiles', async () => {
    await assertFails(claim(as('alice'), 'alice', 'Alice'));
    await assertFails(claim(as('alice'), 'alice', 'al'));
    await assertFails(claim(as('alice'), 'alice', 'alice', { bio: 'x'.repeat(161) }));
    await assertFails(claim(as('alice'), 'alice', 'alice', { isAdmin: true }));
  });

  it('allows one handle per user', async () => {
    await claim(as('alice'), 'alice', 'alice');
    await assertFails(setDoc(doc(as('alice'), 'handles', 'alice2'), { uid: 'alice' }));
  });

  it('lets the owner edit their profile but not change handle', async () => {
    const alice = as('alice');
    await claim(alice, 'alice', 'alice');
    await assertSucceeds(updateDoc(doc(alice, 'users', 'alice'), { bio: 'Long novels.' }));
    await assertFails(updateDoc(doc(alice, 'users', 'alice'), { handle: 'alicia' }));
  });

  it('keeps users/{uid} private; handles can be checked but not listed', async () => {
    await claim(as('alice'), 'alice', 'alice');
    await assertSucceeds(getDoc(doc(as('alice'), 'users', 'alice')));
    await assertFails(getDoc(doc(as('bob'), 'users', 'alice')));
    await assertFails(getDoc(doc(anon(), 'users', 'alice')));
    await assertSucceeds(getDoc(doc(anon(), 'handles', 'alice')));
    await assertFails(getDocs(collection(anon(), 'handles')));
  });

  it('keeps subcollections owner-only', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'users/alice/rankings/main'), { loved: [] }));
    await assertFails(getDoc(doc(as('bob'), 'users/alice/rankings/main')));
  });

  it('never lets clients write public profiles', async () => {
    await assertFails(setDoc(doc(as('alice'), 'profiles', 'alice'), { handle: 'alice' }));
  });
});

describe('profile images', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  const upload = (uid: string, path: string, contentType = 'image/jpeg') =>
    uploadBytes(ref(bucket(env.authenticatedContext(uid)), path), jpeg, { contentType });

  it('lets the owner upload avatars and banners, readable by anyone', async () => {
    await assertSucceeds(upload('alice', 'users/alice/avatar-01HZX3.jpg'));
    await assertSucceeds(upload('alice', 'users/alice/banner-01HZX4.jpg'));
    await assertSucceeds(getBytes(ref(bucket(env.unauthenticatedContext()), 'users/alice/avatar-01HZX3.jpg')));
  });

  it('refuses uploads to someone else, other names, or non-images', async () => {
    await assertFails(upload('bob', 'users/alice/avatar-01HZX3.jpg'));
    await assertFails(upload('alice', 'users/alice/notes.txt'));
    await assertFails(upload('alice', 'users/alice/avatar-01HZX3.jpg', 'text/plain'));
  });
});
