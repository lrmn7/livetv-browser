import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

function isM3uUrl(url: string): boolean {
  const ext = url.split('?')[0].toLowerCase();
  return ext.endsWith('.m3u8') || ext.endsWith('.m3u');
}

async function resolveRedirect(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (location) {
        try { return new URL(location, url).href; } catch { return location; }
      }
    }
  } catch {}
  return url;
}

async function fetchUpstream(
  targetUrl: string,
  userAgent: string,
  referrer: string | undefined,
  clientCookies: string | null,
): Promise<Response> {
  const buildHeaders = (activeReferrer?: string) => ({
    'User-Agent': userAgent,
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    ...(activeReferrer ? { 'Referer': activeReferrer } : {}),
    ...(clientCookies ? { 'Cookie': clientCookies } : {}),
  });

  const response = await fetch(targetUrl, {
    headers: buildHeaders(referrer),
    signal: AbortSignal.timeout(30000),
  });

  if (response.status === 403 && referrer) {
    return fetch(targetUrl, {
      headers: buildHeaders(),
      signal: AbortSignal.timeout(30000),
    });
  }

  return response;
}

export async function OPTIONS() {
  const h = new Headers();
  h.set('Access-Control-Allow-Origin', '*');
  h.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  h.set('Access-Control-Allow-Headers', '*');
  h.set('Access-Control-Max-Age', '86400');
  return new NextResponse(null, { status: 204, headers: h });
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url');
  if (!urlParam) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const decodedUrl = urlParam;
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(decodedUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid url parameter' }, { status: 400 });
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'Only http and https stream URLs are supported' }, { status: 400 });
    }

    const resolveOnly = request.nextUrl.searchParams.get('resolve') === '1';
    const upstreamReferrer = request.nextUrl.searchParams.get('referrer') || undefined;
    const upstreamUserAgent = request.nextUrl.searchParams.get('userAgent') || DEFAULT_USER_AGENT;

    const needsRedirectCheck = resolveOnly || isM3uUrl(decodedUrl);
    const finalUrl = needsRedirectCheck ? await resolveRedirect(decodedUrl) : decodedUrl;

    if (resolveOnly) {
      return NextResponse.json({ url: finalUrl, redirected: finalUrl !== decodedUrl });
    }

    const targetUrl = finalUrl !== decodedUrl ? finalUrl : decodedUrl;
    const clientCookies = request.headers.get('cookie');

    const response = await fetchUpstream(targetUrl, upstreamUserAgent, upstreamReferrer, clientCookies);

    if (!response.ok) {
      return NextResponse.json({ error: `Stream fetch failed: ${response.status}` }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const isM3u = isM3uUrl(decodedUrl) || contentType.toLowerCase().includes('mpegurl') || contentType.toLowerCase().includes('x-mpegurl');

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', isM3u ? 'application/vnd.apple.mpegurl' : contentType);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) responseHeaders.set('Set-Cookie', setCookie);

    if (isM3u) {
      const text = await response.text();
      const baseForRelative = targetUrl;
      const proxyWrap = (u: string) => {
        const params = new URLSearchParams({ url: u });
        if (upstreamReferrer) params.set('referrer', upstreamReferrer);
        if (upstreamUserAgent) params.set('userAgent', upstreamUserAgent);
        return `/api/proxy?${params.toString()}`;
      };
      const isAbsolute = (s: string) => s.startsWith('https://') || s.startsWith('http://') || s.startsWith('//');
      const rewritten = text.split('\n').map((line) => {
        const trimmed = line.trim();
        if (trimmed === '') return line;

        if (trimmed.startsWith('#')) {
          return trimmed.replace(/URI="([^"]+)"/g, (_, url) => {
            try { return `URI="${proxyWrap(new URL(url, baseForRelative).href)}"`; }
            catch { return `URI="${proxyWrap(url)}"`; }
          });
        }

        try {
          const absoluteUrl = isAbsolute(trimmed) ? new URL(trimmed, baseForRelative).href : new URL(trimmed, baseForRelative).href;
          const indent = line.match(/^\s*/)?.[0] || '';
          return `${indent}${proxyWrap(absoluteUrl)}`;
        } catch { return line; }
      }).join('\n');
      return new NextResponse(rewritten, { status: 200, headers: responseHeaders });
    }

    if (response.body) return new NextResponse(response.body, { status: 200, headers: responseHeaders });
    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, { status: 200, headers: responseHeaders });
  } catch (error) {
    return NextResponse.json({ error: 'Proxy error', details: String(error) }, { status: 500 });
  }
}
