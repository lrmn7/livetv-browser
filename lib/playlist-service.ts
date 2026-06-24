import type { Channel, ChannelGroup, ChannelSource, ChannelsResponse, PlaylistCacheEntry, StreamType } from '@/types';

const PLAYLISTS: Record<ChannelSource, string> = {
  server1: 'https://raw.githubusercontent.com/windozalmi/Playlist-IPTV-Indonesia-online-Aktif-2025/refs/heads/m3u/IPTV%20Indonesia%20by%20WINDO%20ZALMI',
  server2: 'https://raw.githubusercontent.com/dhasap/dhanytv/main/dhanytv-ott.m3u',
};

const CACHE_TTL_MS = 5 * 60 * 1000;

const cache = new Map<ChannelSource, PlaylistCacheEntry>();

interface PendingMetadata {
  referrer?: string;
  userAgent?: string;
  kodiProps: string[];
}

interface CurrentEntry {
  name: string;
  attrs: Record<string, string>;
  extinf: string;
  metadata: PendingMetadata;
}

export function normalizeSource(value: string | null): ChannelSource {
  if (value === 'server2') return 'server2';
  return 'server1';
}

export function getPlaylistUrl(source: ChannelSource): string {
  return PLAYLISTS[source];
}

export async function getChannels(source: ChannelSource, refresh = false): Promise<ChannelsResponse> {
  const cached = cache.get(source);
  const now = Date.now();
  const isFresh = cached && now - Date.parse(cached.lastUpdated) < CACHE_TTL_MS;

  if (cached && isFresh && !refresh) {
    return { ...cached, total: cached.channels.length, cacheStatus: 'hit' };
  }

  try {
    const sourceUrl = getPlaylistUrl(source);
    const res = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LiveTV/1.0)' },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) throw new Error(`Playlist fetch failed: ${res.status}`);

    const text = await res.text();
    const parsed = parseM3U(text, source);
    const hlsChannels = parsed.channels.filter((channel) => channel.streamType === 'hls' && channel.isPlayable);
    const skippedUnsupported = parsed.channels.length - hlsChannels.length;
    const parseErrors = [
      ...parsed.parseErrors,
      ...(skippedUnsupported > 0 ? [`${skippedUnsupported} non-HLS or unsupported channels were hidden from the web player list.`] : []),
    ];

    const entry: PlaylistCacheEntry = {
      channels: hlsChannels,
      lastUpdated: new Date().toISOString(),
      source,
      sourceUrl,
      parseErrors,
    };

    cache.set(source, entry);
    return {
      ...entry,
      total: entry.channels.length,
      cacheStatus: cached || refresh ? 'refresh' : 'miss',
    };
  } catch (error) {
    if (cached) {
      return {
        ...cached,
        total: cached.channels.length,
        cacheStatus: 'error',
        parseErrors: [...cached.parseErrors, String(error)],
      };
    }

    return {
      channels: [],
      total: 0,
      lastUpdated: new Date().toISOString(),
      source,
      sourceUrl: getPlaylistUrl(source),
      cacheStatus: 'error',
      parseErrors: [String(error)],
    };
  }
}

export async function getChannelById(source: ChannelSource, id: string): Promise<Channel | undefined> {
  const data = await getChannels(source);
  return data.channels.find((channel) => channel.id === id);
}

export async function getGroups(source: ChannelSource): Promise<ChannelGroup[]> {
  const data = await getChannels(source);
  const groupMap = new Map<string, ChannelGroup>();

  for (const channel of data.channels) {
    const name = channel.group || 'Tanpa Kategori';
    const current = groupMap.get(name) || { name, total: 0, playable: 0 };
    current.total += 1;
    if (channel.isPlayable) current.playable += 1;
    groupMap.set(name, current);
  }

  return Array.from(groupMap.values()).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.name.localeCompare(b.name);
  });
}

export function searchChannels(channels: Channel[], query: string, group?: string): Channel[] {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedGroup = group?.trim().toLowerCase();

  return channels.filter((channel) => {
    if (normalizedGroup && normalizedGroup !== 'all') {
      if ((channel.group || 'Tanpa Kategori').toLowerCase() !== normalizedGroup) return false;
    }

    if (!normalizedQuery) return true;

    const haystack = [
      channel.name,
      channel.group,
      channel.country,
      channel.tvgId,
      channel.tvgName,
      channel.streamType,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function parseM3U(content: string, source: ChannelSource): { channels: Channel[]; parseErrors: string[] } {
  const lines = content.replace(/\r/g, '').split('\n');
  const channels: Channel[] = [];
  const parseErrors: string[] = [];
  let pending: PendingMetadata = { kodiProps: [] };
  let current: CurrentEntry | null = null;

  if (!lines.some((line) => line.trim().startsWith('#EXTM3U'))) {
    parseErrors.push('Playlist does not start with #EXTM3U.');
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) continue;

    if (line.startsWith('#EXTVLCOPT:')) {
      if (current) {
        const activeEntry: CurrentEntry = current;
        current = {
          name: activeEntry.name,
          attrs: activeEntry.attrs,
          extinf: activeEntry.extinf,
          metadata: readVlcOption(line, activeEntry.metadata),
        };
      } else {
        pending = readVlcOption(line, pending);
      }
      continue;
    }

    if (line.startsWith('#KODIPROP:')) {
      if (current) {
        const activeEntry: CurrentEntry = current;
        current = {
          name: activeEntry.name,
          attrs: activeEntry.attrs,
          extinf: activeEntry.extinf,
          metadata: { ...activeEntry.metadata, kodiProps: [...activeEntry.metadata.kodiProps, line] },
        };
      } else {
        pending = { ...pending, kodiProps: [...pending.kodiProps, line] };
      }
      continue;
    }

    if (line.startsWith('#EXTINF:')) {
      current = parseExtInf(line, pending);
      pending = { kodiProps: [] };
      continue;
    }

    if (line.startsWith('#')) continue;

    if (!line.startsWith('http://') && !line.startsWith('https://')) {
      if (current) parseErrors.push(`Skipped invalid stream URL near line ${i + 1}: ${line}`);
      current = null;
      pending = { kodiProps: [] };
      continue;
    }

    if (!current) {
      parseErrors.push(`Skipped URL without #EXTINF near line ${i + 1}: ${line}`);
      continue;
    }

    channels.push(normalizeChannel(current, line, source));
  }

  return { channels: dedupeChannels(channels), parseErrors };
}

function readVlcOption(line: string, pending: PendingMetadata): PendingMetadata {
  const value = line.replace('#EXTVLCOPT:', '');
  const [key, ...rest] = value.split('=');
  const optionValue = rest.join('=').trim();

  if (key === 'http-referrer') return { ...pending, referrer: optionValue };
  if (key === 'http-user-agent') return { ...pending, userAgent: optionValue };
  return pending;
}

function parseExtInf(line: string, metadata: PendingMetadata): CurrentEntry {
  const commaIndex = line.lastIndexOf(',');
  const header = commaIndex >= 0 ? line.slice(0, commaIndex) : line;
  const name = commaIndex >= 0 ? line.slice(commaIndex + 1).trim() : 'Unknown Channel';
  const attrs: Record<string, string> = {};
  const attrRegex = /([\w-]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(header)) !== null) {
    attrs[match[1]] = match[2];
  }

  return { name: name || attrs['tvg-name'] || 'Unknown Channel', attrs, extinf: line, metadata };
}

function normalizeChannel(entry: CurrentEntry, streamUrl: string, source: ChannelSource): Channel {
  const raw = [entry.metadata.referrer, entry.metadata.userAgent, ...entry.metadata.kodiProps, entry.extinf, streamUrl]
    .filter(Boolean)
    .join('\n');
  const streamType = detectStreamType(streamUrl, raw);
  const isPlayable = streamType === 'hls' || streamType === 'direct';
  const name = entry.name || entry.attrs['tvg-name'] || entry.attrs['tvg-id'] || 'Unknown Channel';

  return {
    id: makeChannelId(source, name, streamUrl),
    name,
    logo: cleanValue(entry.attrs['tvg-logo']),
    group: cleanValue(entry.attrs['group-title']) || 'Tanpa Kategori',
    country: cleanValue(entry.attrs['tvg-country']),
    streamUrl,
    streamType,
    isPlayable,
    source,
    tvgId: cleanValue(entry.attrs['tvg-id']),
    tvgName: cleanValue(entry.attrs['tvg-name']),
    referrer: entry.metadata.referrer,
    userAgent: entry.metadata.userAgent,
    raw,
  };
}

function cleanValue(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function detectStreamType(streamUrl: string, raw: string): StreamType {
  const lowerUrl = streamUrl.toLowerCase().split('?')[0];
  const lowerRaw = raw.toLowerCase();
  const isHls = lowerUrl.endsWith('.m3u8') || lowerUrl.endsWith('.m3u');
  const isDirect = lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.mov');
  const hasUnsafeMarker =
    lowerRaw.includes('license') ||
    lowerRaw.includes('clearkey') ||
    lowerRaw.includes('widevine') ||
    lowerRaw.includes('drm') ||
    lowerRaw.includes('inputstream.adaptive');

  if (isHls) return 'hls';
  if (isDirect) return 'direct';
  if (hasUnsafeMarker) return 'unsupported';
  if (lowerUrl.endsWith('.mpd') || lowerRaw.includes('manifest_type=mpd')) return 'dash';
  return 'unsupported';
}

function makeChannelId(source: ChannelSource, name: string, streamUrl: string): string {
  const input = `${source}:${name}:${streamUrl}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${source}-${safeName || 'channel'}-${Math.abs(hash).toString(36)}`;
}

function dedupeChannels(channels: Channel[]): Channel[] {
  const seen = new Set<string>();
  const result: Channel[] = [];

  for (const channel of channels) {
    const key = `${channel.source}:${channel.streamUrl}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(channel);
  }

  return result;
}
