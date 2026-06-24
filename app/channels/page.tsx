import ChannelBrowser from '@/components/ChannelBrowser';

export default function ChannelsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] pt-24">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-white">Semua Channel</h1>
          <p className="mt-2 text-sm text-white/40">
            Cari channel, filter kategori, dan pilih source Server1 atau Server2.
          </p>
        </div>
        <ChannelBrowser />
      </div>
    </main>
  );
}
