'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/channels', label: 'Channel' },
  { href: '/categories', label: 'Kategori' },
  { href: '/favorites', label: 'Favorit' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/20">
            <span className="text-xs font-black text-white">TV</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Live<span className="text-red-400">TV</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          {links.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-white/10 text-white' : 'text-white/45 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <Link
          href="/channels"
          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500 sm:hidden"
        >
          Cari TV
        </Link>
      </div>
    </nav>
  );
}
