import CategoriesClient from '@/components/CategoriesClient';

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] pt-24">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <CategoriesClient />
      </div>
    </main>
  );
}
