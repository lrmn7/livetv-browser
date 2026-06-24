'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Channel, ChannelsResponse } from '@/types';
import { getStoredFavorites, setStoredFavorites, sortChannels } from '@/lib/channel-utils';
import ChannelCard from '@/components/ChannelCard';

export default function FavoritesClient() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => getStoredFavorites());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/channels?source=server1').then((res) => res.json() as Promise<ChannelsResponse>),
      fetch('/api/channels?source=server2').then((res) => res.json() as Promise<ChannelsResponse>),
    ])
      .then(([server1, server2]) => setChannels([...server1.channels, ...server2.channels]))
      .finally(() => setIsLoading(false));
  }, []);

  const favorites = useMemo(() => {
    const idSet = new Set(favoriteIds);
    return sortChannels(channels.filter((channel) => idSet.has(channel.id)));
  }, [channels, favoriteIds]);

  const toggleFavorite = (channel: Channel) => {
    const next = favoriteIds.filter((id) => id !== channel.id);
    setFavoriteIds(next);
    setStoredFavorites(next);
  };

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-white">Favorit</h1>
        <p className="mt-2 text-sm text-white/40">Disimpan lokal di browser ini tanpa akun atau database.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <h2 className="text-lg font-semibold text-white">Belum ada favorit</h2>
          <p className="mt-2 text-sm text-white/40">Simpan channel dari halaman channel atau watch.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {favorites.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              isFavorite
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </section>
  );
}
