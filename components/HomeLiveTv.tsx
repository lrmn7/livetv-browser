'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Channel, ChannelsResponse } from '@/types';
import ChannelCard from '@/components/ChannelCard';

export default function HomeLiveTv() {
  const [data, setData] = useState<ChannelsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/channels?source=server1')
      .then((res) => res.json())
      .then((payload: ChannelsResponse) => setData(payload))
      .finally(() => setIsLoading(false));
  }, []);

  const featured = useMemo(() => {
    const channels = data?.channels || [];
    return channels.filter((channel) => channel.isPlayable).slice(0, 8);
  }, [data]);

  const groups = useMemo(() => {
    const counts = new Map<string, number>();
    for (const channel of data?.channels || []) {
      const group = channel.group || 'Tanpa Kategori';
      counts.set(group, (counts.get(group) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [data]);

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Channel pilihan</h2>
            <p className="mt-1 text-sm text-white/40">Default dari source Server1. Source Server2 bisa dipilih di halaman channel.</p>
          </div>
          <Link href="/channels" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">
            Lihat semua
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-44 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((channel: Channel) => (
              <ChannelCard key={channel.id} channel={channel} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Kategori populer</h2>
            <p className="mt-1 text-sm text-white/40">Jelajahi channel berdasarkan `group-title` dari playlist.</p>
          </div>
          <Link href="/categories" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">
            Semua kategori
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map(([group, total]) => (
            <Link
              key={group}
              href={`/categories/${encodeURIComponent(group)}`}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="text-sm font-semibold text-white">{group}</div>
              <div className="mt-1 text-xs text-white/35">{total} channel</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
