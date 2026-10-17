import { redirect } from 'next/navigation';
import { MOCK_PROFILE } from '@sartre/mock';

export default async function Home({ searchParams }: PageProps<'/'>) {
  const query = new URLSearchParams(Object.entries(await searchParams).flatMap(([k, v]) => (typeof v === 'string' ? [[k, v]] : []))).toString();
  redirect(`/@${MOCK_PROFILE.handle}${query ? `?${query}` : ''}`);
}
