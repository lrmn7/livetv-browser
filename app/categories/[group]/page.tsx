import type { ChannelSource } from '@/types';
import ChannelBrowser from '@/components/ChannelBrowser';

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ group: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const [{ group }, query] = await Promise.all([params, searchParams]);
  const source: ChannelSource = query.source === 'server2' ? 'server2' : 'server1';
  const groupName = decodeURIComponent(group);

  return (
    <main className="min-h-screen bg-[#0a0a0f] pt-24">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-white">{groupName}</h1>
          <p className="mt-2 text-sm text-white/40">Channel dalam kategori ini.</p>
        </div>
        <ChannelBrowser initialSource={source} initialGroup={groupName} />
      </div>
    </main>
  );
}
