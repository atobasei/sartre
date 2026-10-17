import { CACHE_HEADERS, cached, openLibrary } from '../../../../lib/books';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const limit = Math.min(20, Math.max(1, Number(searchParams.get('limit')) || 10));
  if (q.length < 2 || q.length > 200) return Response.json([]);

  try {
    const results = await cached(`search:${limit}:${q.toLowerCase()}`, () => openLibrary.search(q, { limit }));
    return Response.json(results, { headers: CACHE_HEADERS });
  } catch {
    return Response.json({ error: 'upstream' }, { status: 502 });
  }
}
