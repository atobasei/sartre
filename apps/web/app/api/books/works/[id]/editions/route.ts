import { CACHE_HEADERS, cached, openLibrary } from '../../../../../../lib/books';

export async function GET(_request: Request, { params }: RouteContext<'/api/books/works/[id]/editions'>) {
  const { id } = await params;
  if (!/^OL\d+W$/.test(id)) return Response.json({ error: 'bad id' }, { status: 400 });

  try {
    const editions = await cached(`editions:${id}`, () => openLibrary.getEditions(id));
    return Response.json(editions, { headers: CACHE_HEADERS });
  } catch {
    return Response.json({ error: 'upstream' }, { status: 502 });
  }
}
