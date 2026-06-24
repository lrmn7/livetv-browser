import { NextRequest, NextResponse } from 'next/server';
import { getChannels, normalizeSource } from '@/lib/playlist-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const source = normalizeSource(request.nextUrl.searchParams.get('source'));
  const refresh = request.nextUrl.searchParams.get('refresh') === '1';
  const data = await getChannels(source, refresh);

  return NextResponse.json(data, {
    status: data.cacheStatus === 'error' && data.total === 0 ? 502 : 200,
  });
}
