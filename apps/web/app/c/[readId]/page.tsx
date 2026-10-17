import { CardScreen } from '../../screens';

export const metadata = { title: 'Completion' };

export default async function CardPage({ params }: PageProps<'/c/[readId]'>) {
  const { readId } = await params;
  return <CardScreen readId={readId} />;
}
