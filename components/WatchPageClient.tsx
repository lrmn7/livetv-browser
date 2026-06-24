'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Channel, ChannelSource, ChannelsResponse } from '@/types';
import { CHANNEL_SOURCES, SOURCE_LABELS, getStoredFavorites, setStoredFavorites, sortChannels } from '@/lib/channel-utils';
import ChannelLogo from '@/components/ChannelLogo';
import VideoPlayer from '@/components/VideoPlayer';

interface Props {
  channelId: string;
  initialSource: ChannelSource;
}

export default function WatchPageClient({ channelId, initialSource }: Props) {
  const [source, setSource] = useState<ChannelSource>(initialSource);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentId, setCurrentId] = useState(channelId);
  const [favorites, setFavorites] = useState<string[]>(() => getStoredFavorites());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/channels?source=${source}`)
      .then((res) => res.json() as Promise<ChannelsResponse>)
      .then((data) => setChannels(data.channels))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Playlist gagal dimuat.');
        setChannels([]);
      })
      .finally(() => setIsLoading(false));
  }, [source]);

  const currentChannel = useMemo(() => {
    return channels.find((channel) => channel.id === currentId) || channels[0] || null;
  }, [channels, currentId]);

  const related = useMemo(() => {
    if (!currentChannel) return [];
    return sortChannels(channels.filter((channel) => channel.group === currentChannel.group && channel.id !== currentChannel.id)).slice(0, 18);
  }, [channels, currentChannel]);

  const toggleFavorite = () => {
    if (!currentChannel) return;
    const next = favorites.includes(currentChannel.id)
      ? favorites.filter((id) => id !== currentChannel.id)
      : [...favorites, currentChannel.id];
    setFavorites(next);
    setStoredFavorites(next);
  };

  const changeSource = (nextSource: ChannelSource) => {
    setSource(nextSource);
    setCurrentId('');
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] pt-24">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/channels" className="text-sm text-white/40 hover:text-white">Kembali ke channel</Link>
            <h1 className="mt-2 text-2xl font-bold text-white">{currentChannel?.name || 'Memuat channel'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
              {CHANNEL_SOURCES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => changeSource(item)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${source === item ? 'bg-red-600 text-white' : 'text-white/45 hover:text-white'}`}
                >
                  {SOURCE_LABELS[item]}
                </button>
              ))}
            </div>
            {currentChannel && (
              <button
                type="button"
                onClick={toggleFavorite}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"
              >
                {favorites.includes(currentChannel.id) ? 'Tersimpan' : 'Simpan'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            <VideoPlayer channel={currentChannel} />

            {currentChannel && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center gap-4">
                  <ChannelLogo src={currentChannel.logo} name={currentChannel.name} size="lg" />
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-white">{currentChannel.name}</h2>
                    <p className="mt-1 text-sm text-white/40">{currentChannel.group || 'Tanpa Kategori'}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-white/45">{SOURCE_LABELS[currentChannel.source]}</span>
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-white/45">{currentChannel.streamType.toUpperCase()}</span>
                      <span className={`rounded-full px-2.5 py-1 ${currentChannel.isPlayable ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
                        {currentChannel.isPlayable ? 'Playable' : 'Tidak didukung'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:max-h-[720px] lg:overflow-y-auto">
            <div className="mb-3">
              <h2 className="text-sm font-bold text-white">Channel terkait</h2>
              <p className="mt-1 text-xs text-white/35">Dari kategori yang sama.</p>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-xl bg-white/5" />
                ))}
              </div>
            ) : related.length === 0 ? (
              <div className="rounded-xl bg-white/5 p-4 text-sm text-white/40">Tidak ada channel terkait.</div>
            ) : (
              <div className="space-y-2">
                {related.map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => setCurrentId(channel.id)}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/5"
                  >
                    <ChannelLogo src={channel.logo} name={channel.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">{channel.name}</div>
                      <div className="truncate text-xs text-white/30">{channel.streamType.toUpperCase()}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
