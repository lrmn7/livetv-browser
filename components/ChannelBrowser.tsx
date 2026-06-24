'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Channel, ChannelSource, ChannelsResponse } from '@/types';
import { CHANNEL_SOURCES, SOURCE_LABELS, filterChannels, getStoredFavorites, setStoredFavorites, sortChannels } from '@/lib/channel-utils';
import ChannelCard from '@/components/ChannelCard';

interface Props {
  initialSource?: ChannelSource;
  initialGroup?: string;
  compact?: boolean;
}

export default function ChannelBrowser({ initialSource = 'server1', initialGroup = 'all', compact = false }: Props) {
  const [source, setSource] = useState<ChannelSource>(initialSource);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState(initialGroup);
  const [favorites, setFavorites] = useState<string[]>(() => getStoredFavorites());
  const [meta, setMeta] = useState<ChannelsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadChannels(nextSource = source, refresh = false) {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ source: nextSource });
      if (refresh) params.set('refresh', '1');
      const res = await fetch(`/api/channels?${params.toString()}`);
      const data = (await res.json()) as ChannelsResponse;
      if (!res.ok) throw new Error(data.parseErrors?.[0] || 'Playlist gagal dimuat.');
      setChannels(data.channels);
      setMeta(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Playlist gagal dimuat.');
      setChannels([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetch(`/api/channels?source=${initialSource}`)
      .then((res) => res.json() as Promise<ChannelsResponse>)
      .then((data) => {
        setChannels(data.channels);
        setMeta(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Playlist gagal dimuat.');
        setChannels([]);
        setMeta(null);
      })
      .finally(() => setIsLoading(false));
  }, [initialSource]);

  const groups = useMemo(() => {
    return Array.from(new Set(channels.map((channel) => channel.group || 'Tanpa Kategori'))).sort((a, b) => a.localeCompare(b));
  }, [channels]);

  const visibleChannels = useMemo(() => {
    return sortChannels(filterChannels(channels, query, group));
  }, [channels, query, group]);

  const toggleFavorite = (channel: Channel) => {
    const next = favorites.includes(channel.id)
      ? favorites.filter((id) => id !== channel.id)
      : [...favorites, channel.id];
    setFavorites(next);
    setStoredFavorites(next);
  };

  const changeSource = (nextSource: ChannelSource) => {
    setSource(nextSource);
    setGroup(initialGroup);
    loadChannels(nextSource);
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari channel, kategori, atau tvg-id..."
            className="min-h-11 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-red-400/60"
          />

          <select
            value={group}
            onChange={(event) => setGroup(event.target.value)}
            className="min-h-11 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none focus:border-red-400/60"
          >
            <option value="all">Semua kategori</option>
            {groups.map((groupName) => (
              <option key={groupName} value={groupName}>{groupName}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-black/30 p-1">
            {CHANNEL_SOURCES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => changeSource(item)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  source === item ? 'bg-red-600 text-white' : 'text-white/45 hover:text-white'
                }`}
              >
                {SOURCE_LABELS[item]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => loadChannels(source, true)}
            className="min-h-11 rounded-xl border border-white/10 px-4 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            Refresh
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/35">
          <span>{visibleChannels.length} dari {channels.length} channel</span>
          {meta && <span>Update: {new Date(meta.lastUpdated).toLocaleString()}</span>}
          {meta && <span>Cache: {meta.cacheStatus}</span>}
          {meta?.parseErrors?.length ? <span className="text-amber-300">{meta.parseErrors.length} catatan parse</span> : null}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-100">
          Playlist gagal dimuat: {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: compact ? 4 : 12 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      ) : visibleChannels.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <h3 className="text-lg font-semibold text-white">Tidak ada channel ditemukan</h3>
          <p className="mt-2 text-sm text-white/40">Coba kata kunci lain, pilih kategori berbeda, atau refresh playlist.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(compact ? visibleChannels.slice(0, 8) : visibleChannels).map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              isFavorite={favorites.includes(channel.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </section>
  );
}
