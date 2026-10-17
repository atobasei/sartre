import { RankScreen } from '../../screens';

export const metadata = { title: 'Rank' };

export default async function RankPage({ params, searchParams }: PageProps<'/rank/[bookId]'>) {
  const { bookId } = await params;
  const { rerank } = await searchParams;
  return <RankScreen key={bookId} bookId={bookId} rerank={rerank === '1'} />;
}
