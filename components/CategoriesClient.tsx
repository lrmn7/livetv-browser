'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ChannelGroup, ChannelSource } from '@/types';
import { CHANNEL_SOURCES, SOURCE_LABELS } from '@/lib/channel-utils';

export default function CategoriesClient() {
  const [source, setSource] = useState<ChannelSource>('server1');
  const [groups, setGroups] = useState<ChannelGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadGroups(nextSource: ChannelSource) {
    setIsLoading(true);
    const res = await fetch(`/api/channels/groups?source=${nextSource}`);
    const data = await res.json();
    setGroups(data.groups || []);
    setIsLoading(false);
  }

  useEffect(() => {
    fetch('/api/channels/groups?source=server1')
      .then((res) => res.json())
      .then((data) => setGroups(data.groups || []))
      .finally(() => setIsLoading(false));
  }, []);

  const changeSource = (nextSource: ChannelSource) => {
    setSource(nextSource);
    loadGroups(nextSource);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Kategori</h1>
          <p className="mt-2 text-sm text-white/40">Kategori berasal dari atribut `group-title` playlist.</p>
        </div>
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
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-white/40">
          Tidak ada kategori ditemukan.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Link
              key={group.name}
              href={`/categories/${encodeURIComponent(group.name)}?source=${source}`}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="text-base font-semibold text-white">{group.name}</div>
              <div className="mt-2 text-sm text-white/40">{group.total} channel, {group.playable} playable</div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
