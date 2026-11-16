// =====================================================================
// YUGYO - Guest Homepage & Baking Course Catalog (Strict 4-Color Palette)
// File: src/app/(public)/courses/page.jsx
// Palette: #F9DDBB (Cream), #802924 (Cocoa Red), #341D17 (Dark Choc), #82882B (Pistachio)
// =====================================================================

import Link from 'next/link';
import pool from '@/lib/db';

const BAKERY_COVERS = [
  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1612203985729-70726954388c?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1400&q=85',
];

const BADGE_LABELS = [
  '🏆 Terpopuler #1',
  '🔥 Hot #2',
  '✨ #3 Pilihan Mentor',
  '💫 #4 Favorit Praktik',
  '🥐 #5 Kurasi Atelier',
];

function formatScheduleBadge(startVal, endVal) {
  if (!startVal && !endVal) return '∞ Lifetime Access';
  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '?';
  return `🗓️ ${fmt(startVal)} – ${fmt(endVal)}`;
}

export default async function GuestHomepageCatalog({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const selectedCategory = resolvedSearchParams?.category || 'all';
  const searchQuery = resolvedSearchParams?.q?.trim() || '';

  let categoriesList = [];
  let coursesList = [];

  try {
    const catRes = await pool.query('SELECT id, name FROM categories ORDER BY name ASC;');
    categoriesList = catRes.rows;

    let query = `
      SELECT 
        c.id,
        c.title,
        c.description,
        c.start_date,
        c.end_date,
        cat.name AS category_name,
        u.full_name AS instructor_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE LOWER(c.status) = 'active'
    `;
    const params = [];

    if (selectedCategory !== 'all') {
      params.push(selectedCategory);
      query += ` AND cat.name = $${params.length}`;
    }

    if (searchQuery) {
      params.push(`%${searchQuery}%`);
      query += ` AND (LOWER(c.title) LIKE LOWER($${params.length}) OR LOWER(c.description) LIKE LOWER($${params.length}) OR LOWER(u.full_name) LIKE LOWER($${params.length}))`;
    }

    query += ` ORDER BY c.id DESC;`;

    const courseRes = await pool.query(query, params);
    coursesList = courseRes.rows;
  } catch (err) {
    console.error('Database Error on Guest Homepage:', err);
  }

  return (
    <div className="min-h-screen bg-[#F9DDBB] text-[#341D17] pb-24 selection:bg-[#802924] selection:text-[#F9DDBB]">
      
      {/* ================= TOP NAVBAR ================= */}
      <header className="sticky top-0 z-40 bg-[#F9DDBB]/95 backdrop-blur-md border-b border-[#341D17]/15">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-[#341D17] text-[#F9DDBB] flex items-center justify-center shadow-xs group-hover:bg-[#802924] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16c0-4.418 3.582-8 8-8s8 3.582 8 8H4zm4-6v3m4-4v4m4-3v3" />
              </svg>
            </div>
            <div>
              <span className="font-editorial font-bold text-base sm:text-lg text-[#341D17] block leading-none">
                YUGYO
              </span>
              <span className="text-[9px] font-bold tracking-[0.22em] uppercase text-[#802924]">
                ATELIER BELAJAR
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              aria-label="Notifikasi"
              className="w-9 h-9 rounded-full bg-[#FFFDF9] hover:bg-[#82882B] hover:text-white border border-[#341D17]/15 flex items-center justify-center text-[#341D17] transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </Link>
            <Link
              href="/login"
              aria-label="Masuk Akun"
              className="w-9 h-9 rounded-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] flex items-center justify-center shadow-sm transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        
        {/* ================= BANNER MODE TAMU ================= */}
        <section className="bg-[#341D17] text-[#F9DDBB] rounded-2xl p-3.5 sm:px-5 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#82882B] text-white flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#F9DDBB]/80">
                MODE TAMU (GUEST)
              </p>
              <p className="text-xs text-[#F9DDBB] font-medium">
                Masuk untuk simpan progres belajar &amp; sertifikat atelier
              </p>
            </div>
          </div>

          <Link
            href="/register/student"
            className="bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition shrink-0"
          >
            Daftar
          </Link>
        </section>

        {/* ================= HERO PROMO CARD ================= */}
        <section className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="max-w-xl relative z-10">
            <span className="inline-flex items-center gap-1.5 bg-[#82882B] text-white px-3 py-1 rounded-full text-[11px] font-bold mb-4">
              <span>✨</span> Atelier Musim Gugur
            </span>

            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17] leading-snug mb-3">
              Seni Patisserie &amp; Boulangerie di Tangan Anda
            </h1>

            <p className="text-xs sm:text-sm text-[#341D17]/75 leading-relaxed mb-6">
              Belajar teknik laminasi otentik, ragi liar, dan glazing dari maestro pastry YUGYO berstandar internasional.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#katalog-kursus"
                className="inline-flex items-center gap-2 bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] px-5 py-3 rounded-xl text-xs font-bold shadow-md transition"
              >
                <span>Jelajahi Masterclass</span>
                <span>→</span>
              </a>

              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#82882B]">
                <span>🏅</span> Akreditasi CAP Paris
              </span>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="hidden md:block absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-[#F9DDBB]/60 blur-2xl"
          />
        </section>

        {/* ================= SEARCH BAR & FILTER KATEGORI ================= */}
        <section id="katalog-kursus" className="space-y-3.5 scroll-mt-20">
          <form method="GET" action="/courses" className="flex items-center gap-2.5">
            {selectedCategory !== 'all' && (
              <input type="hidden" name="category" value={selectedCategory} />
            )}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-4 flex items-center text-[#341D17]/50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                </svg>
              </span>
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="Cari teknik pastry, chef, croissant, sourdough..."
                className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl pl-11 pr-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/45 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
              />
            </div>

            <button
              type="submit"
              aria-label="Cari Kursus"
              className="w-11 h-11 rounded-2xl bg-[#341D17] hover:bg-[#802924] text-[#F9DDBB] flex items-center justify-center shrink-0 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </form>

          {/* Horizontal Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <Link
              href={searchQuery ? `/courses?q=${encodeURIComponent(searchQuery)}` : '/courses'}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition border ${
                selectedCategory === 'all'
                  ? 'bg-[#802924] text-[#F9DDBB] border-[#802924] shadow-xs'
                  : 'bg-[#FFFDF9] text-[#341D17] border-[#341D17]/15 hover:border-[#802924]'
              }`}
            >
              ⊞ Semua Kategori
            </Link>

            {categoriesList.map((cat) => {
              const isActive = selectedCategory === cat.name;
              const href = `/courses?category=${encodeURIComponent(cat.name)}${
                searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''
              }`;

              return (
                <Link
                  key={cat.id}
                  href={href}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                    isActive
                      ? 'bg-[#802924] text-[#F9DDBB] border-[#802924] shadow-xs'
                      : 'bg-[#FFFDF9] text-[#341D17] border-[#341D17]/15 hover:border-[#802924]'
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </section>

        {/* ================= SECTION DAFTAR KURSUS ================= */}
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#802924]">
                KURIKULUM UNGGULAN
              </p>
              <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17]">
                {coursesList.length} Kursus Tersedia
              </h2>
            </div>

            {(selectedCategory !== 'all' || searchQuery) && (
              <Link
                href="/courses"
                className="text-xs font-bold text-[#802924] hover:underline"
              >
                Reset Filter ×
              </Link>
            )}
          </div>

          {coursesList.length === 0 ? (
            <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-10 text-center">
              <p className="font-editorial text-lg font-bold text-[#341D17] mb-1">
                Belum ada kelas pada filter ini
              </p>
              <p className="text-xs text-[#341D17]/70 mb-4">
                Coba pilih kategori lain atau reset pencarian untuk melihat seluruh katalog baking YUGYO.
              </p>
              <Link
                href="/courses"
                className="inline-block bg-[#802924] text-[#F9DDBB] px-5 py-2.5 rounded-xl text-xs font-bold"
              >
                Tampilkan Semua Kelas
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {coursesList.map((course, idx) => {
                const coverImg = BAKERY_COVERS[idx % BAKERY_COVERS.length];
                const topBadge = BADGE_LABELS[idx % BADGE_LABELS.length];
                const scheduleText = formatScheduleBadge(course.start_date, course.end_date);

                return (
                  <article
                    key={course.id}
                    className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition"
                  >
                    {/* Banner Gambar Kursus */}
                    <div className="relative h-48 sm:h-60 w-full bg-[#341D17]">
                      <img
                        src={coverImg}
                        alt={course.title}
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#341D17]/80 via-transparent to-[#341D17]/20" />

                      {/* Badge Kiri Atas */}
                      <span className="absolute top-3.5 left-3.5 bg-[#F9DDBB] text-[#341D17] px-3 py-1 rounded-full text-[11px] font-extrabold shadow-sm">
                        {topBadge}
                      </span>

                      {/* Badge Kategori Kanan Atas (Pistachio Olive #82882B) */}
                      <span className="absolute top-3.5 right-3.5 bg-[#82882B] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        {course.category_name || 'Baking'}
                      </span>

                      {/* Info Bawah Gambar */}
                      <div className="absolute bottom-3.5 inset-x-3.5 flex items-center justify-between text-[#F9DDBB] text-xs">
                        <span className="font-semibold flex items-center gap-1.5">
                          <span className="text-[#F9DDBB]">★</span> 4.9{' '}
                          <span className="opacity-85">({180 + idx * 45} Siswa)</span>
                        </span>

                        <span className="bg-[#341D17]/85 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-[#F9DDBB]">
                          {scheduleText}
                        </span>
                      </div>
                    </div>

                    {/* Isi Kartu Kursus */}
                    <div className="p-5 sm:p-6">
                      <h3 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17] mb-2">
                        {course.title}
                      </h3>

                      {course.description && (
                        <p className="text-xs text-[#341D17]/75 line-clamp-2 mb-3.5 leading-relaxed">
                          {course.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2 text-xs text-[#341D17]/85 font-semibold">
                          <span className="w-6 h-6 rounded-full bg-[#F9DDBB] text-[#802924] flex items-center justify-center text-[11px]">
                            👨‍🍳
                          </span>
                          <span>{course.instructor_name || 'Chef YUGYO Atelier'}</span>
                        </div>

                        <span className="text-xs sm:text-sm font-extrabold text-[#82882B]">
                          Akses Terbuka
                        </span>
                      </div>

                      {/* Tombol Aksi Guest */}
                      <div className="flex items-center gap-2.5">
                        <Link
                          href="/login"
                          className="flex-1 bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-xs py-3 px-4 rounded-xl text-center shadow-sm transition"
                        >
                          Daftar Kursus
                        </Link>
                        <Link
                          href="/login"
                          aria-label="Simpan Kursus"
                          title="Masuk untuk menyimpan kursus"
                          className="w-11 h-11 rounded-xl bg-[#F9DDBB]/55 hover:bg-[#82882B] hover:text-white border border-[#341D17]/15 flex items-center justify-center text-[#341D17] transition shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ================= CHEF OF THE MONTH CARD ================= */}
        <section className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#802924] mb-2">
                CHEF OF THE MONTH
              </p>
              <div className="flex items-center gap-3.5">
                <img
                  src="https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=300&q=80"
                  alt="Chef Jean-Luc Pierre"
                  className="w-14 h-14 rounded-2xl object-cover border border-[#341D17]/20 shrink-0"
                />
                <div>
                  <h3 className="font-editorial text-base sm:text-lg font-bold text-[#341D17]">
                    Chef Jean-Luc Pierre
                  </h3>
                  <p className="text-xs text-[#341D17]/75">
                    Kepala Boulangerie, YUGYO Atelier
                  </p>
                  <p className="text-[11px] text-[#802924] font-bold mt-0.5">
                    ⏱️ 22 Tahun Eksplorasi Fermentasi
                  </p>
                </div>
              </div>
            </div>

            <span className="bg-[#82882B] text-white px-3 py-1 rounded-full text-[10px] font-bold shrink-0">
              Artisan Boulanger
            </span>
          </div>

          <p className="font-editorial italic text-xs text-[#341D17]/80 leading-relaxed">
            “Roti yang sempurna tidak pernah diburu-buru. Fermentasi dingin 36 jam adalah percakapan sunyi antara ragi liar, gandum murni, dan kesabaran seorang baker.”
          </p>

          <Link
            href="/login"
            className="w-full bg-[#F9DDBB]/55 hover:bg-[#341D17] hover:text-[#F9DDBB] border border-[#341D17]/15 text-[#341D17] font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition"
          >
            <span>📖</span>
            <span>Lihat Silabus Lengkap</span>
          </Link>
        </section>

        {/* ================= BOTTOM CTA BANNER (DAFTAR GRATIS) ================= */}
        <section className="bg-[#802924] text-[#F9DDBB] rounded-3xl p-6 sm:p-8 shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#341D17]/40 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>

          <h2 className="font-editorial text-xl sm:text-2xl font-bold mb-2 text-[#F9DDBB]">
            Daftar Gratis untuk Sertifikat Atelier
          </h2>

          <p className="text-xs sm:text-sm text-[#F9DDBB]/85 max-w-lg leading-relaxed mb-5">
            Uji pemahaman dasar, kumpulkan lencana keahlian, dan dapatkan sertifikasi digital terverifikasi dari YUGYO Pastry Academy.
          </p>

          <Link
            href="/register/student"
            className="inline-flex items-center gap-2 bg-[#F9DDBB] hover:bg-white text-[#341D17] font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition"
          >
            <span>Mulai Akun Siswa</span>
            <span>→</span>
          </Link>
        </section>
      </main>
    </div>
  );
}