# Live TV 

Live TV adalah project Next.js untuk belajar membuat website streaming live TV berbasis playlist M3U/HLS.

## Fitur

- Browse channel live TV dari playlist M3U.
- Pilihan source playlist: `Server1` dan `Server2`.
- Search channel dan filter kategori.
- Watch page dengan HLS video player.
- Favorites lokal menggunakan `localStorage`.
- API proxy untuk membantu pemutaran HLS di browser.
- Hanya stream HLS yang ditampilkan di UI.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- hls.js
- npm

## Playlist Source

Source playlist didefinisikan di `lib/playlist-service.ts`.

```text
Server1: WINDO ZALMI IPTV Indonesia playlist
https://raw.githubusercontent.com/windozalmi/Playlist-IPTV-Indonesia-online-Aktif-2025/refs/heads/m3u/IPTV%20Indonesia%20by%20WINDO%20ZALMI

Server2: dhanytv OTT playlist
https://raw.githubusercontent.com/dhasap/dhanytv/main/dhanytv-ott.m3u
```

## Cara Menjalankan

Install dependency:

```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Buka:

```text
http://localhost:3000
```

Build production:

```bash
npm run build
```

Start production:

```bash
npm start
```

Lint:

```bash
npm run lint
```

## Routes

- `/` - Home page
- `/channels` - Daftar channel
- `/watch/[channelId]` - Halaman menonton
- `/categories` - Daftar kategori
- `/categories/[group]` - Channel berdasarkan kategori
- `/favorites` - Channel favorit

## API

- `GET /api/channels?source=server1|server2`
- `GET /api/channels/groups?source=server1|server2`
- `GET /api/channels/search?q=&source=server1|server2`
- `GET /api/channels/source/[source]`
- `GET /api/proxy?url=`

## Disclaimer

Project ini dibuat untuk learning. Semua stream berasal dari pihak ketiga
