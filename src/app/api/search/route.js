import { NextResponse } from 'next/server';
import { search as tursoSearch } from '@/lib/turso';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], count: 0 });
  }

  try {
    const results = await tursoSearch(query);
    return NextResponse.json({ results, count: results.length });
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json(
      { error: 'Search failed', details: err.message },
      { status: 500 }
    );
  }
}
