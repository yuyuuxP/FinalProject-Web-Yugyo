import Link from 'next/link';
import pool from '@/lib/db';
import CourseFilterDropdown from '@/components/CourseFilterDropdown';

const COURSE_IMAGE_RULES = [
  // Bread & Yeast Goods (/pictures/courses/bread/...)
  { folder: 'bread', file: 'bagel.png', keywords: ['bagel'] },
  { folder: 'bread', file: 'brioche.png', keywords: ['brioche'] },
  { folder: 'bread', file: 'ciabatta.png', keywords: ['ciabatta'] },
  { folder: 'bread', file: 'focaccia.png', keywords: ['focaccia'] },
  { folder: 'bread', file: 'milk_bread.png', keywords: ['milk bread', 'shokupan', 'roti susu'] },
  { folder: 'bread', file: 'Pain_de_Campagne.png', keywords: ['pain de campagne', 'campagne', 'country bread'] },
  { folder: 'bread', file: 'pretzel.png', keywords: ['pretzel'] },
  { folder: 'bread', file: 'ragi_roti.png', keywords: ['ragi', 'yeast', 'fermentasi'] },
  { folder: 'bread', file: 'roti_tawar.png', keywords: ['roti tawar', 'sandwich bread'] },
  { folder: 'bread', file: 'sourdough.png', keywords: ['sourdough', 'levain', 'starter'] },

  // Cakes Decorating (/pictures/courses/cakes_decor/...)
  { folder: 'cakes_decor', file: 'cake_piping.png', keywords: ['piping', 'spuit', 'buttercream'] },
  { folder: 'cakes_decor', file: 'floral_painting.png', keywords: ['floral', 'bunga', 'painting', 'lukis'] },
  { folder: 'cakes_decor', file: 'fondan_sugar.png', keywords: ['fondan', 'fondant', 'sugar', 'gula'] },
  { folder: 'cakes_decor', file: 'ganache_drip.png', keywords: ['ganache', 'drip'] },
  { folder: 'cakes_decor', file: 'geomatric_metallic.png', keywords: ['geomatric', 'geometric', 'metallic', 'metalik'] },
  { folder: 'cakes_decor', file: 'ice_cream.png', keywords: ['ice cream', 'es krim', 'gelato'] },
  { folder: 'cakes_decor', file: 'mirror_glaze.png', keywords: ['mirror glaze', 'glaze', 'cermin'] },
  { folder: 'cakes_decor', file: 'ombre_shadding.png', keywords: ['ombre', 'shadding', 'shading', 'gradasi'] },
  { folder: 'cakes_decor', file: 'smoothing_kue.png', keywords: ['smoothing', 'poles', 'rata'] },
  { folder: 'cakes_decor', file: 'wafer_paper.png', keywords: ['wafer paper', 'wafer'] },

  // Cookies (/pictures/courses/cookies/...)
  { folder: 'cookies', file: 'biscotti.png', keywords: ['biscotti'] },
  { folder: 'cookies', file: 'crinckle.png', keywords: ['crinckle', 'crinkle'] },
  { folder: 'cookies', file: 'florentines.png', keywords: ['florentine', 'florentines'] },
  { folder: 'cookies', file: 'kastengel.png', keywords: ['kastengel', 'keju'] },
  { folder: 'cookies', file: 'matcha_sable.png', keywords: ['matcha', 'sable', 'sablé'] },
  { folder: 'cookies', file: 'nastar.png', keywords: ['nastar', 'nanas'] },
  { folder: 'cookies', file: 'peanut_cookie.png', keywords: ['peanut', 'kacang tanah'] },
  { folder: 'cookies', file: 'putri_salju.png', keywords: ['putri salju', 'snowball'] },
  { folder: 'cookies', file: 'thumbprint_jam.png', keywords: ['thumbprint', 'selai'] },
  { folder: 'cookies', file: 'cookie.png', keywords: ['cookie', 'cookies', 'kukis'] },

  // French Pastry (/pictures/courses/french_pastry/...)
  { folder: 'french_pastry', file: 'Choux_à_la_Crème_&Craquelin.png', keywords: ['choux', 'craquelin', 'soes'] },
  { folder: 'french_pastry', file: 'croissant.png', keywords: ['croissant', 'lamination', 'laminasi'] },
  { folder: 'french_pastry', file: 'eclair.png', keywords: ['eclair', 'éclair'] },
  { folder: 'french_pastry', file: 'Fruits_tartle.png', keywords: ['tart', 'tartle', 'tarte', 'buah'] },
  { folder: 'french_pastry', file: 'Kouign-Amann_Bretons.png', keywords: ['kouign', 'amann', 'breton'] },
  { folder: 'french_pastry', file: 'macaron.png', keywords: ['macaron', 'macarons'] },
  { folder: 'french_pastry', file: 'Madeleines.png', keywords: ['madeleine', 'madeleines'] },
  { folder: 'french_pastry', file: 'Mille-Feuille.png', keywords: ['mille-feuille', 'mille feuille', 'napoleon'] },
  { folder: 'french_pastry', file: 'opera_cake.png', keywords: ['opera'] },
  { folder: 'french_pastry', file: 'Pain_au_Chocolat.png', keywords: ['pain au chocolat', 'chocolatine'] },

  // Indonesian Cakes (/pictures/courses/Indo_cakes/...)
  { folder: 'Indo_cakes', file: 'bolu_kukus.png', keywords: ['bolu kukus', 'bolu'] },
  { folder: 'Indo_cakes', file: 'dadar.png', keywords: ['dadar', 'dadar gulung'] },
  { folder: 'Indo_cakes', file: 'getuk_lindri.png', keywords: ['getuk', 'singkong'] },
  { folder: 'Indo_cakes', file: 'klepon.png', keywords: ['klepon'] },
  { folder: 'Indo_cakes', file: 'kue_lapis.png', keywords: ['lapis', 'kue lapis', 'lapis legit'] },
  { folder: 'Indo_cakes', file: 'kue_talam.png', keywords: ['talam', 'kue talam'] },
  { folder: 'Indo_cakes', file: 'nagasari.png', keywords: ['nagasari', 'pisang'] },
  { folder: 'Indo_cakes', file: 'onde_onde.png', keywords: ['onde-onde', 'onde onde', 'wijen'] },
  { folder: 'Indo_cakes', file: 'putu_ayu.png', keywords: ['putu ayu', 'putu'] },
  { folder: 'Indo_cakes', file: 'serabi.png', keywords: ['serabi', 'surabi'] },
];

const FALLBACK_THUMBS = [
  '/pictures/courses/french_pastry/croissant.png',
  '/pictures/courses/french_pastry/Madeleines.png',
  '/pictures/courses/bread/sourdough.png',
  '/pictures/courses/cakes_decor/cake_piping.png',
];

function resolveCourseImage(course, idx = 0) {
  if (course?.thumbnail_url && course.thumbnail_url.startsWith('/pictures/')) {
    return course.thumbnail_url;
  }

  const titleLower = (course?.title || '').toLowerCase();
  const catLower = (course?.category_name || '').toLowerCase();

  const matched = COURSE_IMAGE_RULES.find((rule) =>
    rule.keywords.some((kw) => titleLower.includes(kw))
  );
  if (matched) {
    return `/pictures/courses/${matched.folder}/${matched.file}`;
  }

  if (catLower.includes('bread') || catLower.includes('yeast') || catLower.includes('roti')) {
    return '/pictures/categories/bread&yeast_goods.png';
  }
  if (catLower.includes('cake') || catLower.includes('decor') || catLower.includes('dekor')) {
    return '/pictures/categories/cakes_decorating.png';
  }
  if (catLower.includes('cookie') || catLower.includes('kukis')) {
    return '/pictures/categories/cookies.png';
  }
  if (catLower.includes('indo') || catLower.includes('nusantara')) {
    return '/pictures/categories/indonesian_cakes.png';
  }
  if (catLower.includes('french') || catLower.includes('patisserie') || catLower.includes('pastry')) {
    return '/pictures/categories/french_patisserie.png';
  }

  return FALLBACK_THUMBS[idx % FALLBACK_THUMBS.length];
}

async function fetchCoursesWithEnrollments() {
  const res = await pool.query(`
    SELECT
      c.id,
      c.title,
      c.description,
      c.status,
      c.thumbnail_url,
      c.start_date,
      c.end_date,
      cat.id AS category_id,
      cat.name AS category_name,
      u.full_name AS instructor_name,
      COALESCE(e.student_count, 0)::int AS student_count
    FROM courses c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN users u ON c.instructor_id = u.id
    LEFT JOIN (
      SELECT course_id, COUNT(*)::int AS student_count
      FROM student_enrollments
      GROUP BY course_id
    ) e ON e.course_id = c.id
    ORDER BY c.id DESC;
  `);
  return res.rows;
}

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
    const [allCourses, categoriesRes] = await Promise.all([
      fetchCoursesWithEnrollments(),
      pool.query('SELECT id, name FROM categories ORDER BY id ASC;'),
    ]);

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
          KURASI KURIKULUM
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
          href="/dashboard/admin/courses/create"
          className="flex-1 bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-xs sm:text-sm py-3.5 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>+</span>
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
          <form method="GET">
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Cari nama kursus, chef, atau kategori..."
              className="w-full bg-[#FFFDF9] border border-[#341D17]/15 rounded-2xl px-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
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
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                filterTab === 'pending' ? 'bg-[#FFFDF9] text-[#802924]' : 'bg-[#F9DDBB] text-[#802924]'
              }`}
            >
              {pendingCount}
            </span>
          </Link>

          <Link
            href={`/dashboard/admin/courses?tab=active${selectedCategory !== 'all' ? `&cat=${selectedCategory}` : ''}${searchQuery ? `&q=${searchQuery}` : ''}`}
            className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              filterTab === 'active'
                ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/40'
            }`}
          >
            <span>Aktif</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                filterTab === 'active' ? 'bg-[#FFFDF9] text-[#802924]' : 'bg-[#F9DDBB] text-[#802924]'
              }`}
            >
              {activeCount}
            </span>
          </Link>

          <Link
            href={`/dashboard/admin/courses?tab=draft${selectedCategory !== 'all' ? `&cat=${selectedCategory}` : ''}${searchQuery ? `&q=${searchQuery}` : ''}`}
            className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              filterTab === 'draft'
                ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/40'
            }`}
          >
            <span>Draft</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                filterTab === 'draft' ? 'bg-[#FFFDF9] text-[#802924]' : 'bg-[#F9DDBB] text-[#802924]'
              }`}
            >
              {draftCount}
            </span>
          </Link>
        </div>
      </div>

      {/* 4. SECTION A: PERSETUJUAN KURIKULUM (PENDING) */}
      {(filterTab === 'semua' || filterTab === 'pending') && pendingList.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-editorial text-base sm:text-lg font-bold text-[#341D17]">
              Persetujuan Kurikulum
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
                      src={resolveCourseImage(course, idx)}
                      alt={course.title}
                      className="w-16 h-16 rounded-2xl object-cover border border-[#341D17]/15 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-[#F9DDBB] text-[#802924] px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                          {course.category_name || 'PASTRI'}
                        </span>
                        <span className="text-[10px] font-extrabold text-[#802924]">• Pending</span>
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

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <Link
                    href={`/dashboard/admin/courses/${course.id}`}
                    className="col-span-2 bg-[#F9DDBB]/50 hover:bg-[#F9DDBB] text-[#341D17] font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    Review Detail &amp; Kurasi
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. SECTION B: DAFTAR KURIKULUM (SEMUA STATUS SAAT TAB SEMUA, ATAU ACTIVE/DRAFT) */}
      {filterTab !== 'pending' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-editorial text-base sm:text-lg font-bold text-[#341D17]">
              {filterTab === 'active'
                ? 'Kurikulum Aktif'
                : filterTab === 'draft'
                ? 'Kurikulum Draft'
                : 'Semua Kurikulum Kursus'}
            </h3>
            <span className="text-xs text-[#341D17]/65 font-semibold">
              Menampilkan {filterTab === 'semua' ? courses.length : generalList.length} dari {totalCount} kursus
            </span>
          </div>

          <div className="space-y-4">
            {(filterTab === 'semua' ? courses : generalList).map((course, idx) => {
              const status = (course.status || 'active').toLowerCase();
              const isActive = status === 'active';
              const isDraft = status === 'draft';
              const isPending = status === 'pending';
              const studentCount = Number(course.student_count || 0);

              return (
                <div
                  key={course.id}
                  className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={resolveCourseImage(course, idx + 1)}
                        alt={course.title}
                        className="w-14 h-14 rounded-2xl object-cover border border-[#341D17]/15 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="bg-[#F9DDBB] text-[#802924] px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                            {course.category_name || 'ATELIER'}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold ${
                              isActive
                                ? 'text-[#82882B]'
                                : isDraft
                                ? 'text-[#341D17]/60'
                                : 'text-[#802924]'
                            }`}
                          >
                            • {isActive ? 'Aktif' : isDraft ? 'Draft' : isPending ? 'Pending' : status}
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
                        {isActive ? `${studentCount} Siswa` : studentCount > 0 ? `${studentCount} Siswa` : 'Belum Rilis'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/dashboard/admin/courses/${course.id}`}
                          className="px-3.5 py-1.5 rounded-xl bg-[#F9DDBB]/50 hover:bg-[#F9DDBB] text-[#341D17] text-xs font-bold transition"
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