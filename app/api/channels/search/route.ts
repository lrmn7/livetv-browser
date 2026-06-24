import { NextRequest, NextResponse } from 'next/server';
import { getChannels, normalizeSource, searchChannels } from '@/lib/playlist-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const source = normalizeSource(request.nextUrl.searchParams.get('source'));
  const query = request.nextUrl.searchParams.get('q') || '';
  const group = request.nextUrl.searchParams.get('group') || undefined;
  const data = await getChannels(source);
  const channels = searchChannels(data.channels, query, group);

  return NextResponse.json({
    ...data,
    total: channels.length,
    channels,
    query,
    group: group || 'all',
  });
}
