import FavoritesClient from '@/components/FavoritesClient';

export default function FavoritesPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] pt-24">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <FavoritesClient />
      </div>
    </main>
  );
}
