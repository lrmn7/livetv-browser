import type { ChannelSource } from '@/types';
import WatchPageClient from '@/components/WatchPageClient';

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ channelId: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const [{ channelId }, query] = await Promise.all([params, searchParams]);
  const source: ChannelSource = query.source === 'server2' ? 'server2' : 'server1';

  return <WatchPageClient channelId={decodeURIComponent(channelId)} initialSource={source} />;
}
