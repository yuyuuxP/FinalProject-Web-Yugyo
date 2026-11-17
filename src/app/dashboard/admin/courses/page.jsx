import Link from 'next/link';
import pool from '@/lib/db';
import CourseFilterDropdown from '@/components/CourseFilterDropdown';

const COURSE_THUMBS = [
  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1612203985729-70726954388c?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
];

export default async function AdminCoursesPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const filterTab = resolvedSearchParams?.tab || 'semua';
  const selectedCategory = resolvedSearchParams?.cat || 'all';
  const searchQuery = (resolvedSearchParams?.q || '').toLowerCase();

  let courses = [];
  let categories = [];
  let totalCount = 0;
  let pendingCount = 0;
  let activeCount = 0;
  let draftCount = 0;

  try {
    const [coursesRes, categoriesRes] = await Promise.all([
      pool.query(`
        SELECT
          c.id,
          c.title,
          c.description,
          c.status,
          c.start_date,
          c.end_date,
          cat.id AS category_id,
          cat.name AS category_name,
          u.full_name AS instructor_name
        FROM courses c
        LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN users u ON c.instructor_id = u.id
        ORDER BY c.id DESC;
      `),
      pool.query('SELECT id, name FROM categories ORDER BY id ASC;'),
    ]);

    const allCourses = coursesRes.rows;
    categories = categoriesRes.rows;

    totalCount = allCourses.length;
    pendingCount = allCourses.filter((item) => (item.status || 'active').toLowerCase() === 'pending').length;
    activeCount = allCourses.filter((item) => (item.status || 'active').toLowerCase() === 'active').length;
    draftCount = allCourses.filter((item) => (item.status || 'active').toLowerCase() === 'draft').length;

    courses = allCourses.filter((item) => {
      const status = (item.status || 'active').toLowerCase();
      if (filterTab === 'pending' && status !== 'pending') return false;
      if (filterTab === 'active' && status !== 'active') return false;
      if (filterTab === 'draft' && status !== 'draft') return false;

      if (selectedCategory !== 'all' && String(item.category_id) !== String(selectedCategory)) {
        return false;
      }

      if (searchQuery) {
        const matchTitle = item.title?.toLowerCase().includes(searchQuery);
        const matchChef = item.instructor_name?.toLowerCase().includes(searchQuery);
        const matchCat = item.category_name?.toLowerCase().includes(searchQuery);
        if (!matchTitle && !matchChef && !matchCat) return false;
      }

      return true;
    });
  } catch (err) {
    console.error('Admin Courses DB Error:', err);
  }

  const pendingList = courses.filter((item) => (item.status || 'active').toLowerCase() === 'pending');
  const generalList = courses.filter((item) => (item.status || 'active').toLowerCase() !== 'pending');

  return (
    <div className="space-y-7">
      
      {/* 1. HEADER & BREADCRUMB */}
      <div className="space-y-1.5">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#802924]">
          <span>🥐</span> KURASI KURIKULUM
        </span>
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
          Course Management
        </h1>
        <p className="text-xs sm:text-sm text-[#341D17]/75">
          Kelola, verifikasi, dan pantau kurikulum pastry terbaik dari master chef atelier.
        </p>
      </div>

      {/* 2. TOMBOL BUAT KURSUS BARU */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/admin/courses/new"
          className="flex-1 bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-xs sm:text-sm py-3.5 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>⊕</span>
          <span>Buat Kursus Baru</span>
        </Link>
        <button
          type="button"
          aria-label="Filter"
          className="w-12 h-12 bg-[#FFFDF9] hover:bg-[#F9DDBB]/40 border border-[#341D17]/15 rounded-2xl flex items-center justify-center text-[#341D17] transition cursor-pointer shadow-2xs"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
      </div>

      {/* 3. SEARCH & TAB FILTER PILLS */}
      <div className="space-y-3.5">
        <div className="relative">
          <span className="absolute inset-y-0 left-4 flex items-center text-[#341D17]/45 text-xs">
            🔍
          </span>
          <form method="GET">
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Cari nama kursus, chef, atau kategori..."
              className="w-full bg-[#FFFDF9] border border-[#341D17]/15 rounded-2xl pl-11 pr-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
            />
            {filterTab !== 'semua' && <input type="hidden" name="tab" value={filterTab} />}
            {selectedCategory !== 'all' && <input type="hidden" name="cat" value={selectedCategory} />}
          </form>
        </div>

        {/* Filter Pills & Dropdown Kategori */}
        <div className="flex flex-wrap items-center gap-2">
          <CourseFilterDropdown
            categories={categories}
            selectedCat={selectedCategory}
            currentTab={filterTab}
            searchQuery={searchQuery}
            totalCount={totalCount}
          />

          <Link
            href={`/dashboard/admin/courses?tab=pending${selectedCategory !== 'all' ? `&cat=${selectedCategory}` : ''}${searchQuery ? `&q=${searchQuery}` : ''}`}
            className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              filterTab === 'pending'
                ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/40'
            }`}
          >
            <span>Menunggu Approval</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterTab === 'pending' ? 'bg-[#FFFDF9] text-[#802924]' : 'bg-[#F9DDBB] text-[#802924]'}`}>
              {pendingCount}
            </span>
          </Link>

          <Link
            href={`/dashboard/admin/courses?tab=active${selectedCategory !== 'all' ? `&cat=${selectedCategory}` : ''}${searchQuery ? `&q=${searchQuery}` : ''}`}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              filterTab === 'active'
                ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/40'
            }`}
          >
            Aktif {activeCount}
          </Link>

          <Link
            href={`/dashboard/admin/courses?tab=draft${selectedCategory !== 'all' ? `&cat=${selectedCategory}` : ''}${searchQuery ? `&q=${searchQuery}` : ''}`}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              filterTab === 'draft'
                ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/40'
            }`}
          >
            Draft {draftCount}
          </Link>
        </div>
      </div>

      {/* 4. SECTION A: PERSETUJUAN KURIKULUM (PENDING) */}
      {(filterTab === 'semua' || filterTab === 'pending') && pendingList.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-editorial text-base sm:text-lg font-bold text-[#341D17] flex items-center gap-2">
              <span>⏳</span> Persetujuan Kurikulum
            </h3>
            <span className="bg-[#802924] text-[#F9DDBB] px-3 py-1 rounded-full text-[10px] font-extrabold uppercase">
              {pendingList.length} Menunggu
            </span>
          </div>

          <div className="space-y-4">
            {pendingList.map((course, idx) => (
              <div
                key={course.id}
                className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={COURSE_THUMBS[idx % COURSE_THUMBS.length]}
                      alt={course.title}
                      className="w-16 h-16 rounded-2xl object-cover border border-[#341D17]/15 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-[#F9DDBB] text-[#802924] px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                          {course.category_name || 'PASTRI'}
                        </span>
                        <span className="text-[10px] text-[#341D17]/60">• Diajukan baru-baru ini</span>
                      </div>
                      <h4 className="font-editorial text-base sm:text-lg font-bold text-[#341D17]">
                        {course.title}
                      </h4>
                      <p className="text-xs text-[#341D17]/75 mt-0.5">
                        Oleh {course.instructor_name || 'Chef Atelier'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[#F9DDBB]/30 border border-[#341D17]/10 rounded-2xl p-3 text-center text-xs">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#341D17]/50">Durasi</p>
                    <p className="font-extrabold text-[#341D17] mt-0.5">3.5 Jam</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#341D17]/50">Level</p>
                    <p className="font-extrabold text-[#341D17] mt-0.5">Lanjutan</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#341D17]/50">Harga Rencana</p>
                    <p className="font-extrabold text-[#802924] mt-0.5">Rp 480rb</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    className="bg-[#354F33] hover:bg-[#2b4029] text-[#F9DDBB] font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>✓</span> Setujui
                  </button>
                  <button
                    type="button"
                    className="bg-[#F8D7DA] hover:bg-[#f5c6cb] text-[#802924] font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>✕</span> Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. SECTION B: SEMUA KURIKULUM KURSUS (TANPA TOMBOL HAPUS) */}
      {(filterTab !== 'pending') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-editorial text-base sm:text-lg font-bold text-[#341D17]">
              Semua Kurikulum Kursus
            </h3>
            <span className="text-xs text-[#341D17]/65 font-semibold">
              Menampilkan {generalList.length} dari {totalCount} kursus
            </span>
          </div>

          <div className="space-y-4">
            {generalList.map((course, idx) => {
              const status = (course.status || 'active').toLowerCase();
              const isActive = status === 'active';
              const isDraft = status === 'draft';

              return (
                <div
                  key={course.id}
                  className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={COURSE_THUMBS[(idx + 1) % COURSE_THUMBS.length]}
                        alt={course.title}
                        className="w-14 h-14 rounded-2xl object-cover border border-[#341D17]/15 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="bg-[#F9DDBB] text-[#802924] px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                            {course.category_name || 'ATELIER'}
                          </span>
                          <span className={`text-[10px] font-extrabold ${isActive ? 'text-[#82882B]' : isDraft ? 'text-[#341D17]/60' : 'text-[#802924]'}`}>
                            • {isActive ? 'Aktif' : isDraft ? 'Draft' : 'Pending'}
                          </span>
                        </div>
                        <h4 className="font-editorial text-sm sm:text-base font-bold text-[#341D17]">
                          {course.title}
                        </h4>
                        <p className="text-[11px] text-[#341D17]/70 mt-0.5">
                          Oleh {course.instructor_name || 'Chef Atelier'} • Rp 450.000
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#341D17]/10">
                      <span className="text-[11px] font-bold text-[#341D17]/75">
                        {isActive ? '👥 320 Siswa' : '⏳ Belum Rilis'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/dashboard/admin/courses/${course.id}`}
                          className="px-3 py-1.5 rounded-xl bg-[#F9DDBB]/50 hover:bg-[#F9DDBB] text-[#341D17] text-xs font-bold transition"
                        >
                          Detail
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}