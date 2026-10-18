import { ulid } from '@sartre/core';
import { getDownloadURL, ref, uploadBytes, type FirebaseStorage } from 'firebase/storage';

export type ProfileImageKind = 'avatar' | 'banner';

/** Picked images arrive as data: URLs (web) or file: URIs (native); hosted ones start with http. */
export const isLocalImage = (uri: string) => !/^https?:/i.test(uri);

/**
 * Uploads to users/{uid}/{kind}-{ulid}.jpg and returns the download URL. A fresh
 * name per upload means caches never serve the previous picture.
 */
export async function uploadProfileImage(storage: FirebaseStorage, uid: string, kind: ProfileImageKind, uri: string): Promise<string> {
  // fetch() reads both data: and file: URIs into a Blob, on web and in React Native.
  const blob = await (await fetch(uri)).blob();
  const target = ref(storage, `users/${uid}/${kind}-${ulid()}.jpg`);
  await uploadBytes(target, blob, { contentType: blob.type || 'image/jpeg' });
  return getDownloadURL(target);
}
