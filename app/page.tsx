import Link from 'next/link';
import HomeLiveTv from '@/components/HomeLiveTv';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] pt-16">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_28%)]" />
        <div className="relative mx-auto flex min-h-[58vh] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/55">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Channel Indonesia
            </div>
            <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              Siaran Langsung Live TV
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/50">
              Browse, cari, filter, dan tonton channel TV dari playlist M3U. Pilih Server1 atau Server2, dan aplikasi hanya menampilkan stream HLS yang didukung web player.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/channels" className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-500">
                Jelajahi Channel
              </Link>
              <Link href="/categories" className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                Lihat Kategori
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <HomeLiveTv />
      </section>

      <section className="border-t border-white/10 py-8">
        <div className="mx-auto max-w-7xl px-4 text-sm text-white/35 sm:px-6 lg:px-8">
          Streams are loaded from external playlist sources. Availability and playback depend on the original source.
        </div>
      </section>
    </main>
  );
}
