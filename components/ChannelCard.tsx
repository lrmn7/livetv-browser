'use client';

import Link from 'next/link';
import type { Channel } from '@/types';
import { SOURCE_LABELS, getPlayableLabel } from '@/lib/channel-utils';
import ChannelLogo from '@/components/ChannelLogo';

interface Props {
  channel: Channel;
  isFavorite?: boolean;
  onToggleFavorite?: (channel: Channel) => void;
}

export default function ChannelCard({ channel, isFavorite = false, onToggleFavorite }: Props) {
  return (
    <article className="group flex h-full flex-col justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.06]">
      <div>
        <div className="mb-4 flex items-start justify-between gap-3">
          <ChannelLogo src={channel.logo} name={channel.name} />
          <button
            type="button"
            onClick={() => onToggleFavorite?.(channel)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              isFavorite ? 'bg-amber-400/15 text-amber-200' : 'bg-white/5 text-white/35 hover:text-white'
            }`}
            title={isFavorite ? 'Hapus dari favorit' : 'Simpan favorit'}
          >
            {isFavorite ? 'Saved' : 'Save'}
          </button>
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-white">{channel.name}</h3>
        <p className="mt-1 truncate text-xs text-white/35">{channel.group || 'Tanpa Kategori'}</p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${
            channel.isPlayable ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
          }`}>
            {getPlayableLabel(channel)}
          </span>
          <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] font-medium text-white/40">
            {SOURCE_LABELS[channel.source]}
          </span>
        </div>

        <Link
          href={`/watch/${encodeURIComponent(channel.id)}?source=${channel.source}`}
          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500"
        >
          Tonton
        </Link>
      </div>
    </article>
  );
}
