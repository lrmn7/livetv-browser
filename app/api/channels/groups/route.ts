import { NextRequest, NextResponse } from 'next/server';
import { getChannels, normalizeSource } from '@/lib/playlist-service';
import type { ChannelGroup } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const source = normalizeSource(request.nextUrl.searchParams.get('source'));
  const channelData = await getChannels(source);
  const groupMap = new Map<string, ChannelGroup>();

  for (const channel of channelData.channels) {
    const name = channel.group || 'Tanpa Kategori';
    const current = groupMap.get(name) || { name, total: 0, playable: 0 };
    current.total += 1;
    if (channel.isPlayable) current.playable += 1;
    groupMap.set(name, current);
  }

  const groups = Array.from(groupMap.values()).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({
    source,
    sourceUrl: channelData.sourceUrl,
    lastUpdated: channelData.lastUpdated,
    total: groups.length,
    groups,
  });
}
