import { CardScreen } from '@sartre/app';
import { useLocalSearchParams } from 'expo-router';

export default function Card() {
  const { readId } = useLocalSearchParams<{ readId: string }>();
  return <CardScreen readId={readId} />;
}
