import Link from 'next/link';
import pool from '@/lib/db';

const CATEGORY_THUMBS = [
  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1612203985729-70726954388c?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
];

export default async function AdminCategoriesPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const searchQuery = (resolvedSearchParams?.q || '').toLowerCase();

  let categories = [];
  let totalCoursesCount = 0;
  let activeCategoriesCount = 0;
  let draftCategoriesCount = 0;

  try {
    // Ambil data kategori dari database beserta hitungan jumlah kursus terkait
    const catRes = await pool.query(`
      SELECT 
        c.id, 
        c.name, 
        c.description, 
        COUNT(crs.id) AS course_count
      FROM categories c
      LEFT JOIN courses crs ON c.id = crs.category_id
      GROUP BY c.id, c.name, c.description
      ORDER BY c.id ASC;
    `);

    const allCategories = catRes.rows;

    totalCoursesCount = allCategories.reduce((acc, curr) => acc + parseInt(curr.course_count || 0, 0), 0);
    activeCategoriesCount = allCategories.length;
    draftCategoriesCount = 0; // atau sesuaikan jika ada kolom status

    // Filter pencarian
    categories = allCategories.filter((item) => {
      if (!searchQuery) return true;
      const matchName = item.name?.toLowerCase().includes(searchQuery);
      const matchDesc = item.description?.toLowerCase().includes(searchQuery);
      return matchName || matchDesc;
    });
  } catch (err) {
    console.error('Database Error fetching categories:', err);
  }

  return (
    <div className="space-y-7">
      
      {/* 1. HEADER & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#802924]">
            <span>🥐</span> ATELIER TAXONOMY
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
            Kelola Kategori & Taksonomi
          </h1>
          <p className="text-xs sm:text-sm text-[#341D17]/75">
            Atur kurikulum induk pastry, taksonomi materi, dan pengelompokan kelas pada silabus Yugyo Academy.
          </p>
        </div>

        <div className="shrink-0">
          <span className="inline-flex items-center gap-1.5 bg-[#802924] text-[#F9DDBB] px-4 py-2 rounded-2xl text-xs font-extrabold shadow-2xs">
            <span>📚</span> {activeCategoriesCount} Master Kategori
          </span>
        </div>
      </div>

      {/* 2. SEARCH BAR & TOMBOL TAMBAH KATEGORI */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-4 flex items-center text-[#341D17]/45 text-xs">
            🔍
          </span>
          <form method="GET">
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Cari kategori pastry..."
              className="w-full bg-[#FFFDF9] border border-[#341D17]/15 rounded-2xl pl-11 pr-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
            />
          </form>
        </div>

        <Link
          href="/dashboard/admin/categories/create"
          className="bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-xs sm:text-sm py-3 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <span>＋</span>
          <span>Kategori</span>
        </Link>
      </div>

      {/* 3. STATISTIK KARTU (TOTAL, STATUS, ATELIER) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-2xs">
        
        {/* Total Kursus */}
        <div className="flex items-center gap-4 p-2">
          <div className="w-10 h-10 rounded-xl bg-[#F9DDBB]/50 text-[#802924] flex items-center justify-center font-bold text-sm">
            📖
          </div>
          <div>
            <p className="text-[10px] font-extrabold tracking-wider uppercase text-[#341D17]/50">TOTAL</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-editorial text-xl font-bold text-[#341D17]">{totalCoursesCount}</span>
              <span className="text-[11px] text-[#341D17]/70 font-medium">Kursus Terdaftar</span>
            </div>
          </div>
        </div>

        {/* Status Aktif */}
        <div className="flex items-center gap-4 p-2 sm:border-x border-[#341D17]/10">
          <div className="w-10 h-10 rounded-xl bg-[#82882B]/15 text-[#82882B] flex items-center justify-center font-bold text-sm">
            ✓
          </div>
          <div>
            <p className="text-[10px] font-extrabold tracking-wider uppercase text-[#341D17]/50">STATUS</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-editorial text-xl font-bold text-[#341D17]">{activeCategoriesCount}</span>
              <span className="text-[11px] text-[#341D17]/70 font-medium">Aktif di Katalog</span>
            </div>
          </div>
        </div>

        {/* Arsip / Draft */}
        <div className="flex items-center gap-4 p-2">
          <div className="w-10 h-10 rounded-xl bg-[#802924]/10 text-[#802924] flex items-center justify-center font-bold text-sm">
            🗂️
          </div>
          <div>
            <p className="text-[10px] font-extrabold tracking-wider uppercase text-[#341D17]/50">ATELIER</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-editorial text-xl font-bold text-[#341D17]">{draftCategoriesCount}</span>
              <span className="text-[11px] text-[#341D17]/70 font-medium">Arsip / Draft</span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. DAFTAR KATEGORI KURSUS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-editorial text-base sm:text-lg font-bold text-[#341D17] flex items-center gap-2">
            <span>📋</span> Daftar Kategori Kursus
          </h3>
          <span className="text-xs text-[#341D17]/60 font-semibold bg-[#F9DDBB]/30 px-3 py-1 rounded-full">
            Auto-sync
          </span>
        </div>

        {/* List Items */}
        <div className="space-y-4">
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3 transition hover:border-[#802924]/30"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Info Kategori & Thumbnail */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <img
                    src={CATEGORY_THUMBS[idx % CATEGORY_THUMBS.length]}
                    alt={cat.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-[#341D17]/15 shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-editorial text-base sm:text-lg font-bold text-[#341D17]">
                        {cat.name}
                      </h4>
                      <span className="bg-[#82882B]/15 text-[#82882B] px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                        Aktif
                      </span>
                    </div>
                    <p className="text-xs text-[#341D17]/75 line-clamp-1">
                      {cat.description || 'Taksonomi materi dan pengelompokan kelas akademi pastry.'}
                    </p>
                    <p className="text-[11px] text-[#341D17]/60 font-semibold">
                      🍞 {cat.course_count} Kursus Aktif • Index #{idx + 1}
                    </p>
                  </div>
                </div>

                {/* Actions & Drag Handle */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#341D17]/10">
                  <span className="text-[10px] font-extrabold text-[#341D17]/50 bg-[#F9DDBB]/40 px-2.5 py-1 rounded-lg hidden md:inline-block">
                    ✓ Dipakai di Course Builder
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/admin/categories/${cat.id}/edit`}
                      className="px-3 py-1.5 rounded-xl bg-[#F9DDBB]/50 hover:bg-[#F9DDBB] text-[#341D17] text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                    >
                      <span>✏️</span> Ubah
                    </Link>

                    <form action={`/api/admin/categories/${cat.id}`} method="POST">
                      <input type="hidden" name="_method" value="DELETE" />
                      <button
                        type="submit"
                        aria-label="Hapus Kategori"
                        className="w-8 h-8 rounded-xl bg-[#802924]/10 hover:bg-[#802924] text-[#802924] hover:text-[#F9DDBB] flex items-center justify-center text-xs transition cursor-pointer shadow-2xs"
                        title="Hapus Kategori"
                      >
                        🗑️
                      </button>
                    </form>

                    <span className="text-[#341D17]/30 px-1 cursor-grab" title="Drag to reorder">
                      ⋮⋮
                    </span>
                  </div>
                </div>

              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="text-center py-12 bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl">
              <p className="text-xs text-[#341D17]/60">Belum ada kategori terdaftar di dalam database.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}