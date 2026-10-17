import { RankScreen } from '@sartre/app';
import { useLocalSearchParams } from 'expo-router';

export default function Rank() {
  const { bookId, rerank } = useLocalSearchParams<{ bookId: string; rerank?: string }>();
  return <RankScreen key={bookId} bookId={bookId} rerank={rerank === '1'} />;
}
