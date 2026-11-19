import Link from 'next/link';
import pool from '@/lib/db';
import DeleteCategoryButton from '@/components/DeleteCategoryButton';

export const dynamic = 'force-dynamic';

const CATEGORY_IMAGE_MAP = [
  {
    file: '/pictures/categories/bread&yeast_goods.png',
    keywords: ['bread', 'yeast', 'roti', 'ragi'],
  },
  {
    file: '/pictures/categories/indonesian_cakes.png',
    keywords: ['indonesian', 'indonesia', 'nusantara', 'tradisional', 'indo'],
  },
  {
    file: '/pictures/categories/cakes_decorating.png',
    keywords: ['cake', 'decor', 'dekor', 'frosting', 'buttercream'],
  },
  {
    file: '/pictures/categories/cookies.png',
    keywords: ['cookie', 'cookies', 'kukis', 'small bites', 'biskuit'],
  },
  {
    file: '/pictures/categories/french_patisserie.png',
    keywords: ['french', 'patisserie', 'pastry', 'prancis'],
  },
];

function resolveCategoryImage(category, idx = 0) {
  if (category?.image_url && String(category.image_url).startsWith('/pictures/categories/')) {
    return category.image_url;
  }

  const nameLower = (category?.name || '').toLowerCase();
  const matched = CATEGORY_IMAGE_MAP.find((item) =>
    item.keywords.some((kw) => nameLower.includes(kw))
  );
  if (matched) {
    return matched.file;
  }

  const fallbackList = [
    '/pictures/categories/bread&yeast_goods.png',
    '/pictures/categories/indonesian_cakes.png',
    '/pictures/categories/cakes_decorating.png',
    '/pictures/categories/cookies.png',
    '/pictures/categories/french_patisserie.png',
  ];
  return fallbackList[idx % fallbackList.length];
}

export default async function AdminCategoriesPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const searchQuery = (resolvedSearchParams?.q || '').toLowerCase().trim();

  let allCategories = [];
  let categories = [];
  let totalCoursesCount = 0;

  try {
    const [catRes, courseCountRes] = await Promise.all([
      pool.query(`
        SELECT
          cat.id,
          cat.name,
          cat.description,
          cat.image_url,
          COUNT(c.id)::int AS course_count,
          COUNT(c.id) FILTER (WHERE LOWER(COALESCE(c.status, 'active')) = 'active')::int AS active_course_count
        FROM categories cat
        LEFT JOIN courses c ON c.category_id = cat.id
        GROUP BY cat.id, cat.name, cat.description, cat.image_url
        ORDER BY cat.id ASC;
      `),
      pool.query('SELECT COUNT(*)::int AS total FROM courses;'),
    ]);

    allCategories = catRes.rows;
    totalCoursesCount = Number(courseCountRes.rows?.[0]?.total || 0);

    categories = allCategories.filter((cat) => {
      if (!searchQuery) return true;
      const matchName = cat.name?.toLowerCase().includes(searchQuery);
      const matchDesc = cat.description?.toLowerCase().includes(searchQuery);
      return matchName || matchDesc;
    });
  } catch (err) {
    console.error('Admin Categories DB Error:', err);
  }

  const activeCategoriesCount = allCategories.length;
  const draftCategoriesCount = 0;

  return (
    <div className="space-y-7">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#802924]">
            ATELIER TAXONOMY
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
            Kelola Kategori &amp; Taksonomi
          </h1>
          <p className="text-xs sm:text-sm text-[#341D17]/75">
            Atur kurikulum induk pastry, taksonomi materi, dan pengelompokan kelas pada silabus Yugyo Academy.
          </p>
        </div>

        <span className="self-start sm:self-center bg-[#802924] text-[#F9DDBB] px-4 py-1.5 rounded-full text-xs font-bold shadow-xs">
          {allCategories.length} Master Kategori
        </span>
      </div>

      {/* 2. SEARCH & TOMBOL TAMBAH KATEGORI */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <form method="GET" className="flex-1">
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Cari kategori pastry..."
            className="w-full bg-[#FFFDF9] border border-[#341D17]/15 rounded-2xl px-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
          />
        </form>

        <Link
          href="/dashboard/admin/categories/create"
          className="bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-xs sm:text-sm py-3 px-5 rounded-2xl shadow-md transition flex items-center justify-center gap-2 shrink-0"
        >
          <span>+</span>
          <span>Kategori</span>
        </Link>
      </div>

      {/* STATISTIK KARTU */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-2xs">
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

      {/* 4. DAFTAR KATEGORI KURSUS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-base sm:text-lg font-bold text-[#341D17]">
            Daftar Kategori Kursus
          </h2>
          <span className="text-[11px] font-semibold text-[#341D17]/60">
            Auto-sync
          </span>
        </div>

        <div className="space-y-3.5">
          {categories.map((cat, idx) => {
            const imgSrc = resolveCategoryImage(cat, idx);
            const courseCount = Number(cat.course_count || 0);

            return (
              <div
                key={cat.id}
                className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={imgSrc}
                    alt={cat.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-[#341D17]/15 shrink-0 bg-[#F9DDBB]/30"
                  />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-editorial text-sm sm:text-base font-bold text-[#341D17] truncate">
                        {cat.name}
                      </h3>
                      <span className="bg-[#82882B]/15 text-[#82882B] px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                        AKTIF
                      </span>
                    </div>

                    <p className="text-xs text-[#341D17]/70 mt-0.5 line-clamp-1">
                      {cat.description || 'Kurikulum kategori pastry Yugyo Academy.'}
                    </p>

                    <p className="text-[11px] text-[#341D17]/60 mt-1 font-medium">
                      {courseCount} Kursus Terdaftar • Index #{idx + 1}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#341D17]/10">
                  <span className="hidden md:inline-flex items-center px-3 py-1 rounded-xl bg-[#F9DDBB]/40 text-[11px] font-semibold text-[#341D17]/75">
                    Dipakai di Course Builder
                  </span>

                  <Link
                    href={`/dashboard/admin/categories/${cat.id}/edit`}
                    className="px-3.5 py-1.5 rounded-xl bg-[#F9DDBB]/60 hover:bg-[#F9DDBB] text-[#341D17] text-xs font-bold transition"
                  >
                    Ubah
                  </Link>

                  <DeleteCategoryButton categoryId={cat.id} categoryName={cat.name} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}