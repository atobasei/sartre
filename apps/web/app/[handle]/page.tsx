import { MOCK_PROFILE } from '@sartre/mock';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfileScreen } from '../screens';

// Profiles live at /@handle. Folder names can't start with "@" (that's Next's
// parallel-route syntax), so this segment matches /%40handle and strips the "@".
const handleFrom = (segment: string) => {
  const s = decodeURIComponent(segment);
  return s.startsWith('@') ? s.slice(1) : null;
};

// With data=firebase the server can't see who's signed in (auth is client-side
// for now), so the screen checks the handle instead.
const usesFirebase = async (searchParams: PageProps<'/[handle]'>['searchParams']) => (await searchParams).data === 'firebase';

export async function generateMetadata({ params, searchParams }: PageProps<'/[handle]'>): Promise<Metadata> {
  const handle = handleFrom((await params).handle);
  if (!handle) return {};
  return { title: (await usesFirebase(searchParams)) ? `@${handle}` : `${MOCK_PROFILE.displayName} (@${handle})` };
}

export default async function ProfilePage({ params, searchParams }: PageProps<'/[handle]'>) {
  const handle = handleFrom((await params).handle);
  if (!handle) notFound();
  if (!(await usesFirebase(searchParams)) && handle !== MOCK_PROFILE.handle) notFound();
  return <ProfileScreen handle={handle} />;
}
