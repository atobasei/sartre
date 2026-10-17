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

export async function generateMetadata({ params }: PageProps<'/[handle]'>): Promise<Metadata> {
  const handle = handleFrom((await params).handle);
  return { title: handle ? `${MOCK_PROFILE.displayName} (@${handle})` : undefined };
}

export default async function ProfilePage({ params }: PageProps<'/[handle]'>) {
  const handle = handleFrom((await params).handle);
  if (handle !== MOCK_PROFILE.handle) notFound();
  return <ProfileScreen />;
}
