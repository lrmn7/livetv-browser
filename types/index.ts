export type ChannelSource = 'server1' | 'server2';

export type StreamType = 'hls' | 'dash' | 'direct' | 'unsupported';

export interface Channel {
  id: string;
  name: string;
  logo?: string;
  group?: string;
  country?: string;
  streamUrl: string;
  streamType: StreamType;
  isPlayable: boolean;
  source: ChannelSource;
  tvgId?: string;
  tvgName?: string;
  referrer?: string;
  userAgent?: string;
  raw?: string;
}

export interface PlaylistCacheEntry {
  channels: Channel[];
  lastUpdated: string;
  source: ChannelSource;
  sourceUrl: string;
  parseErrors: string[];
}

export interface ChannelsResponse extends PlaylistCacheEntry {
  total: number;
  cacheStatus: 'hit' | 'miss' | 'refresh' | 'error';
}

export interface ChannelGroup {
  name: string;
  total: number;
  playable: number;
}
