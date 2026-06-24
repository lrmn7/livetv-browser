import type { Channel, ChannelSource } from '@/types';

export const SOURCE_LABELS: Record<ChannelSource, string> = {
  server1: 'Server1',
  server2: 'Server2',
};

export const CHANNEL_SOURCES: ChannelSource[] = ['server1', 'server2'];

export function getPlayableLabel(channel: Channel): string {
  if (!channel.isPlayable) return 'Tidak didukung';
  if (channel.streamType === 'hls') return 'HLS';
  if (channel.streamType === 'direct') return 'Direct';
  return channel.streamType.toUpperCase();
}

export function sortChannels(channels: Channel[]): Channel[] {
  return [...channels].sort((a, b) => {
    if (a.isPlayable !== b.isPlayable) return a.isPlayable ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function filterChannels(channels: Channel[], query: string, group: string): Channel[] {
  const q = query.trim().toLowerCase();
  const selectedGroup = group.trim().toLowerCase();

  return channels.filter((channel) => {
    if (selectedGroup && selectedGroup !== 'all') {
      if ((channel.group || 'Tanpa Kategori').toLowerCase() !== selectedGroup) return false;
    }

    if (!q) return true;

    return [channel.name, channel.group, channel.tvgId, channel.tvgName, channel.streamType]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q);
  });
}

export function getStoredFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('live-tv-favorites');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function setStoredFavorites(ids: string[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('live-tv-favorites', JSON.stringify(Array.from(new Set(ids))));
}
