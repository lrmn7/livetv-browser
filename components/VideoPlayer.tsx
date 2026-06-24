'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import type { Channel } from '@/types';

interface Props {
  channel: Channel | null;
  className?: string;
}

type PlayerState = 'idle' | 'loading' | 'playing' | 'reconnecting' | 'unsupported' | 'error';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

function getStreamUrl(channel: Channel): string {
  const params = new URLSearchParams({ url: channel.streamUrl });
  if (channel.referrer) params.set('referrer', channel.referrer);
  if (channel.userAgent) params.set('userAgent', channel.userAgent);
  return `/api/proxy?${params.toString()}`;
}

export default function VideoPlayer({ channel, className = '' }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef(0);
  const urlRef = useRef('');
  const [state, setState] = useState<PlayerState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
  }, []);

  function startPlayback(nextChannel: Channel) {
    const video = videoRef.current;
    if (!video) return;

    if (!nextChannel.isPlayable || nextChannel.streamType === 'dash' || nextChannel.streamType === 'unsupported') {
      cleanup();
      setState('unsupported');
      setErrorMsg('this stream is not supported in the web player.');
      return;
    }

    const url = getStreamUrl(nextChannel);
    urlRef.current = url;
    setState('loading');
    setErrorMsg(null);

    const retry = () => {
      retryRef.current += 1;
      setRetryCount(retryRef.current);
      if (retryRef.current > MAX_RETRIES) {
        setErrorMsg('Stream gagal dimuat. Sumber mungkin offline, diblokir CORS, geo-blocked, atau URL sudah kedaluwarsa.');
        setState('error');
        return;
      }

      setState('reconnecting');
      cleanup();
      setTimeout(() => {
        startPlayback(nextChannel);
      }, RETRY_DELAY);
    };

    timeoutRef.current = setTimeout(retry, 30000);

    if (nextChannel.streamType === 'hls' && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        liveDurationInfinity: true,
        backBufferLength: 90,
        maxBufferLength: 45,
        maxMaxBufferLength: 90,
        maxBufferSize: 120 * 1000 * 1000,
      });

      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      video.addEventListener(
        'playing',
        () => {
          retryRef.current = 0;
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          setState('playing');
        },
        { once: true },
      );

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          setErrorMsg('Klik tombol play pada player untuk memulai stream.');
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) retry();
      });
      return;
    }

    if (nextChannel.streamType === 'hls' && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => video.play().catch(() => {}), { once: true });
      video.addEventListener('playing', () => setState('playing'), { once: true });
      video.addEventListener('error', retry, { once: true });
      return;
    }

    if (nextChannel.streamType === 'direct') {
      video.src = url;
      video.addEventListener('loadedmetadata', () => video.play().catch(() => {}), { once: true });
      video.addEventListener('playing', () => setState('playing'), { once: true });
      video.addEventListener('error', retry, { once: true });
      return;
    }

    setState('unsupported');
    setErrorMsg('this stream is not supported in the web player.');
  }

  useEffect(() => {
    cleanup();
    retryRef.current = 0;
    queueMicrotask(() => setRetryCount(0));

    if (!channel) {
      queueMicrotask(() => setState('idle'));
      return cleanup;
    }

    queueMicrotask(() => startPlayback(channel));
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, cleanup]);

  const retryCurrent = () => {
    if (!channel) return;
    cleanup();
    retryRef.current = 0;
    startPlayback(channel);
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/40 ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-xs font-bold text-red-200">
            TV
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{channel?.name || 'Pilih channel'}</div>
            <div className="truncate text-xs text-white/35">{channel?.group || 'Belum ada channel aktif'}</div>
          </div>
        </div>
        {channel && (
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
            channel.isPlayable ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
          }`}>
            {channel.streamType.toUpperCase()}
          </span>
        )}
      </div>

      <div className="relative aspect-video bg-black">
        {(state === 'loading' || state === 'reconnecting') && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-red-500/30 border-t-red-500" />
              <span className="text-sm text-white/45">
                {state === 'reconnecting' ? 'Menyambungkan ulang...' : 'Memuat stream...'}
              </span>
              {state === 'reconnecting' && (
                <span className="text-xs text-white/25">Percobaan {retryCount}/{MAX_RETRIES}</span>
              )}
            </div>
          </div>
        )}

        {(state === 'error' || state === 'unsupported') && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black px-5 text-center">
            <div className="flex max-w-md flex-col items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-300">
                !
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {state === 'unsupported' ? 'Stream tidak didukung' : 'Stream gagal diputar'}
                </div>
                <p className="mt-1 text-sm text-white/45">{errorMsg}</p>
              </div>
              {state === 'error' && (
                <button
                  onClick={retryCurrent}
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500"
                >
                  Coba Lagi
                </button>
              )}
            </div>
          </div>
        )}

        {state === 'idle' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black text-sm text-white/40">
            Pilih channel untuk mulai menonton.
          </div>
        )}

        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          playsInline
          autoPlay
          muted
          controls
          preload="auto"
        />
      </div>
    </div>
  );
}
