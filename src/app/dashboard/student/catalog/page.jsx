import Link from 'next/link';

export const dynamic = 'force-dynamic';

const CATEGORIES = [
  'Semua Kategori',
  'Bread & Yeast Goods',
  'Cake Decorating',
  'Cookies & Small Bites',
  'French Patisserie & Pastry',
  'Traditional Indonesian Cakes',
];

export default function StudentCourseCatalogPage() {
  return (
    <div className="space-y-6 text-[#341D17] pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F9DDBB]/80 border border-[#802924]/15 px-3 py-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#802924]">
            <span>&#127856;</span>
            <span>YUGYO ATELIER CATALOG</span>
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
            Course Catalog
          </h1>
          <p className="text-xs sm:text-sm text-[#341D17]/65">
            Jelajahi seluruh kategori kelas baking dan pastry yang tersedia di Yugyo Atelier.
          </p>
        </div>

        <Link
          href="/dashboard/student/courses"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#802924] hover:bg-[#661F1B] px-4 py-2 text-xs font-bold text-[#FFFDF9] transition"
        >
          <span>Kursus Saya</span>
          <span>&rarr;</span>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat, idx) => (
          <span
            key={cat}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              idx === 0
                ? 'bg-[#802924] text-[#FFFDF9]'
                : 'bg-[#FFFDF9] border border-[#341D17]/12 text-[#341D17]/75'
            }`}
          >
            {cat}
          </span>
        ))}
      </div>

      <div className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 p-6 text-xs sm:text-sm text-[#341D17]/70">
        Pilih kategori atau buka menu <strong className="text-[#341D17]">Course</strong> untuk melihat materi dan modul aktif.
      </div>
    </div>
  );
}