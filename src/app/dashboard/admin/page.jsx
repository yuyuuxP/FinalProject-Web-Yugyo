import Link from 'next/link';
import pool from '@/lib/db';

const COURSE_THUMBS = [
  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1612203985729-70726954388c?auto=format&fit=crop&w=400&q=80',
];

export default async function AdminOverviewPage() {
  let totalCourses = 0;
  let pendingCourses = [];
  let totalTeachers = 0;
  let totalStudents = 0;
  let popularCourses = [];

  try {
    const [courseCountRes, pendingRes, userStatsRes, popularRes] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total FROM courses;'),
      pool.query(`
        SELECT c.id, c.title, u.full_name AS instructor_name
        FROM courses c
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE LOWER(c.status) = 'pending'
        ORDER BY c.id DESC
        LIMIT 3;
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE LOWER(role) IN ('teacher', 'instructor'))::int AS teachers,
          COUNT(*) FILTER (WHERE LOWER(role) = 'student')::int AS students
        FROM users;
      `),
      pool.query(`
        SELECT
          c.id,
          c.title,
          c.status,
          cat.name AS category_name,
          u.full_name AS instructor_name
        FROM courses c
        LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE LOWER(c.status) = 'active'
        ORDER BY c.id ASC
        LIMIT 3;
      `),
    ]);

    totalCourses = courseCountRes.rows[0]?.total || 0;
    pendingCourses = pendingRes.rows;
    totalTeachers = userStatsRes.rows[0]?.teachers || 0;
    totalStudents = userStatsRes.rows[0]?.students || 0;
    popularCourses = popularRes.rows;
  } catch (err) {
    console.error('Admin Overview DB Error:', err);
  }

  const pendingTotal = pendingCourses.length;

  return (
    <div className="space-y-7">
      
      {/* 1. STATUS BAR & TANGGAL */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 bg-[#82882B]/20 text-[#341D17] border border-[#82882B]/40 px-3 py-1 rounded-full text-[11px] font-extrabold">
          <span className="w-2 h-2 rounded-full bg-[#82882B]" />
          Atelier Engine Online • Sync 100%
        </span>

        <span className="text-[11px] font-extrabold tracking-wider uppercase text-[#341D17]/70">
          SELASA, 17 NOVEMBER 2026
        </span>
      </div>

      {/* 2. GREETING HEADER */}
      <div>
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
          <span className="italic font-normal">Bonjour,</span>{' '}
          <span className="text-[#802924]">Admin Atelier</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#341D17]/75 mt-1">
          Harmonie et précision culinaire. Berikut ringkasan operasional akademi YUGYO hari ini.
        </p>
      </div>

      {/* 3. BANNER UTAMA: PENGAJUAN MENUNGGU PERSETUJUAN (#802924 Cocoa Red) */}
      <section className="bg-[#802924] text-[#F9DDBB] rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#F9DDBB]/90">
            <span className="w-6 h-6 rounded-lg bg-[#341D17]/45 flex items-center justify-center">🔔</span>
            VÉRIFICATION REQUISE
          </span>

          <span className="bg-[#341D17] text-[#F9DDBB] px-3 py-1 rounded-full text-[10px] font-bold">
            {pendingTotal > 0 ? `${pendingTotal} En Attente` : 'Semua Terkurasi'}
          </span>
        </div>

        <div>
          <h2 className="font-editorial text-xl sm:text-2xl font-bold">
            {pendingTotal > 0
              ? `${pendingTotal} Pengajuan Menunggu Persetujuan`
              : 'Kurikulum & Pengajar Terverifikasi'}
          </h2>
          <p className="text-xs text-[#F9DDBB]/80 mt-1">
            {pendingTotal > 0
              ? 'Kurikulum dan pengajar baru siap dikurasi sebelum publikasi resmi ke katalog siswa.'
              : 'Seluruh kurikulum aktif telah disetujui dan siap diakses oleh peserta YUGYO Atelier.'}
          </p>
        </div>

        {/* List Item Pending / Highlight */}
        <div className="space-y-2">
          {pendingCourses.length > 0 ? (
            pendingCourses.map((item) => (
              <div
                key={item.id}
                className="bg-[#341D17]/40 border border-[#F9DDBB]/15 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs"
              >
                <span className="font-bold flex items-center gap-2">
                  <span>🥐</span> {item.title}
                </span>
                <span className="text-[#F9DDBB]/80 font-medium">
                  {item.instructor_name || 'Chef Atelier'}
                </span>
              </div>
            ))
          ) : (
            <>
              <div className="bg-[#341D17]/40 border border-[#F9DDBB]/15 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-2">
                  <span>🥐</span> Kurikulum 5 Kategori Utama
                </span>
                <span className="text-[#F9DDBB]/80 font-medium">{totalCourses} Kelas Aktif</span>
              </div>
              <div className="bg-[#341D17]/40 border border-[#F9DDBB]/15 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-2">
                  <span>👨‍🍳</span> Fakultas Master Baker YUGYO
                </span>
                <span className="text-[#F9DDBB]/80 font-medium">{totalTeachers} Chef Terdaftar</span>
              </div>
            </>
          )}
        </div>

        {/* Action Row */}
        <div className="flex items-center gap-2.5 pt-1">
          <Link
            href="/dashboard/admin/courses"
            className="flex-1 bg-[#FFFDF9] hover:bg-white text-[#802924] font-extrabold text-xs sm:text-sm py-3 px-5 rounded-xl text-center shadow-sm transition"
          >
            Tinjau Sekarang →
          </Link>
          <Link
            href="/dashboard/admin/courses"
            aria-label="Setujui Cepat"
            className="w-11 h-11 rounded-xl bg-[#341D17]/50 hover:bg-[#341D17] text-[#F9DDBB] flex items-center justify-center font-bold transition shrink-0"
          >
            ✓
          </Link>
        </div>
      </section>

      {/* 4. INDIKATOR KINERJA ATELIER (2x2 GRID) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-editorial text-lg font-bold text-[#341D17]">
            Indikator Kinerja Atelier
          </h3>
          <span className="text-xs font-semibold text-[#341D17]/65">Bulan Berjalan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Total Kursus */}
          <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="w-9 h-9 rounded-xl bg-[#F9DDBB] text-[#802924] flex items-center justify-center text-sm">
                🎓
              </span>
              <span className="bg-[#82882B]/20 text-[#341D17] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                +5 Kategori
              </span>
            </div>
            <div>
              <p className="font-editorial text-3xl font-bold text-[#341D17]">{totalCourses}</p>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/65 mt-1">
                TOTAL KURSUS
              </p>
              <p className="text-[11px] font-bold text-[#82882B] mt-0.5">↗ Aktif di Katalog</p>
            </div>
          </div>

          {/* Card 2: Persetujuan */}
          <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="w-9 h-9 rounded-xl bg-[#F9DDBB] text-[#802924] flex items-center justify-center text-sm">
                ⏳
              </span>
              <span className="bg-[#802924] text-[#F9DDBB] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                {pendingTotal > 0 ? 'Penting' : 'Aman'}
              </span>
            </div>
            <div>
              <p className="font-editorial text-3xl font-bold text-[#341D17]">
                {String(pendingTotal).padStart(2, '0')}
              </p>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/65 mt-1">
                PERSETUJUAN
              </p>
              <p className="text-[11px] text-[#341D17]/65 mt-0.5">
                {totalTeachers} Guru • {totalCourses} Kursus
              </p>
            </div>
          </div>

          {/* Card 3: Pengguna Terdaftar */}
          <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="w-9 h-9 rounded-xl bg-[#F9DDBB] text-[#802924] flex items-center justify-center text-sm">
                👥
              </span>
              <span className="bg-[#F9DDBB] text-[#341D17] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                98% Retensi
              </span>
            </div>
            <div>
              <p className="font-editorial text-3xl font-bold text-[#341D17]">
                {totalTeachers + totalStudents}
              </p>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/65 mt-1">
                PENGGUNA AKTIF
              </p>
              <p className="text-[11px] font-bold text-[#82882B] mt-0.5">
                ↗ {totalTeachers} Chef &amp; {totalStudents} Siswa
              </p>
            </div>
          </div>

          {/* Card 4: Kepuasan Atelier */}
          <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="w-9 h-9 rounded-xl bg-[#F9DDBB] text-[#802924] flex items-center justify-center text-sm">
                ⭐
              </span>
              <span className="text-[11px] font-semibold text-[#341D17]/60">320 Ulasan</span>
            </div>
            <div>
              <p className="font-editorial text-3xl font-bold text-[#341D17]">
                4.9 <span className="text-sm font-normal text-[#341D17]/50">/ 5.0</span>
              </p>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/65 mt-1">
                KEPUASAN ATELIER
              </p>
              <p className="text-xs text-[#802924] mt-0.5">★★★★★</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. KURSUS TERPOPULER & AKTIVITAS */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="font-editorial text-lg font-bold text-[#341D17]">
              Kursus Terpopuler &amp; Aktivitas
            </h3>
            <p className="text-xs text-[#341D17]/65">
              Paling banyak dipelajari dan diselesaikan pekan ini
            </p>
          </div>

          <Link
            href="/dashboard/admin/courses"
            className="text-xs font-extrabold text-[#802924] hover:underline"
          >
            SEMUA &gt;
          </Link>
        </div>

        <div className="space-y-3">
          {popularCourses.map((course, idx) => {
            const batchPercent = [88, 72, 64][idx % 3];
            const ratingVal = ['4.95', '4.88', '4.92'][idx % 3];
            const studentNum = [418, 390, 320][idx % 3];

            return (
              <div
                key={course.id}
                className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={COURSE_THUMBS[idx % COURSE_THUMBS.length]}
                      alt={course.title}
                      className="w-16 h-16 rounded-xl object-cover border border-[#341D17]/15 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-[#F9DDBB] text-[#802924] px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                          {course.category_name || 'BAKERY'}
                        </span>
                        <span className="text-[10px] font-bold text-[#82882B]">• Aktif</span>
                      </div>
                      <h4 className="font-editorial text-sm sm:text-base font-bold text-[#341D17]">
                        {course.title}
                      </h4>
                      <p className="text-[11px] text-[#341D17]/70 mt-0.5">
                        Oleh {course.instructor_name || 'Chef YUGYO'} • {studentNum} Siswa Terdaftar
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold text-[#802924] shrink-0">
                    ★ {ratingVal}
                  </span>
                </div>

                {/* Progress Bar Kapasitas Batch */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#341D17]/70">Kapasitas Batch Atelier</span>
                    <span className="font-extrabold text-[#802924]">{batchPercent}% Penuh</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F9DDBB] overflow-hidden">
                    <div
                      style={{ width: `${batchPercent}%` }}
                      className="h-full rounded-full bg-[#802924]"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. MODUL UTAMA ATELIER (AKSES PINTAS 2x2) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-editorial text-lg font-bold text-[#341D17]">
            Modul Utama Atelier
          </h3>
          <span className="text-[10px] font-extrabold tracking-widest uppercase text-[#341D17]/55">
            AKSES PINTAS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/dashboard/admin/courses"
            className="bg-[#FFFDF9] hover:bg-white border border-[#341D17]/15 rounded-2xl p-5 shadow-2xs transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#802924] text-[#F9DDBB] flex items-center justify-center mb-3 text-base">
              🎓
            </div>
            <h4 className="font-editorial text-base font-bold text-[#341D17]">Course Atelier</h4>
            <p className="text-xs text-[#341D17]/70 mt-0.5 mb-3">Kelola kurikulum &amp; silabus</p>
            <span className="text-xs font-extrabold text-[#802924] group-hover:translate-x-1 inline-block transition">
              Akses Kursus →
            </span>
          </Link>

          <Link
            href="/dashboard/admin/categories"
            className="bg-[#FFFDF9] hover:bg-white border border-[#341D17]/15 rounded-2xl p-5 shadow-2xs transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F9DDBB] text-[#341D17] flex items-center justify-center mb-3 text-base">
              🗂️
            </div>
            <h4 className="font-editorial text-base font-bold text-[#341D17]">Kategori Roti</h4>
            <p className="text-xs text-[#341D17]/70 mt-0.5 mb-3">Bread, Pastry, Cake &amp; Nusantara</p>
            <span className="text-xs font-extrabold text-[#82882B] group-hover:translate-x-1 inline-block transition">
              Kelola Taksonomi →
            </span>
          </Link>

          <Link
            href="/dashboard/admin/users"
            className="bg-[#FFFDF9] hover:bg-white border border-[#341D17]/15 rounded-2xl p-5 shadow-2xs transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#341D17] text-[#F9DDBB] flex items-center justify-center mb-3 text-base">
              👥
            </div>
            <h4 className="font-editorial text-base font-bold text-[#341D17]">Chefs &amp; Siswa</h4>
            <p className="text-xs text-[#341D17]/70 mt-0.5 mb-3">Hak akses &amp; instruktur</p>
            <span className="text-xs font-extrabold text-[#802924] group-hover:translate-x-1 inline-block transition">
              Kelola Pengguna →
            </span>
          </Link>

          <Link
            href="/dashboard/admin/reports"
            className="bg-[#FFFDF9] hover:bg-white border border-[#341D17]/15 rounded-2xl p-5 shadow-2xs transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#82882B] text-white flex items-center justify-center mb-3 text-base">
              📊
            </div>
            <h4 className="font-editorial text-base font-bold text-[#341D17]">Evaluasi &amp; Kritik</h4>
            <p className="text-xs text-[#341D17]/70 mt-0.5 mb-3">Analisis kelas &amp; modul</p>
            <span className="text-xs font-extrabold text-[#82882B] group-hover:translate-x-1 inline-block transition">
              Buka Laporan →
            </span>
          </Link>
        </div>
      </section>

      {/* 7. QUOTE FOOTER */}
      <footer className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-full bg-[#F9DDBB] text-[#802924] flex items-center justify-center text-base shrink-0">
          🥐
        </div>
        <div>
          <p className="font-editorial italic text-xs sm:text-sm text-[#341D17]">
            “Suhu adonan adalah kompas seorang artisan baker.”
          </p>
          <p className="text-[10px] font-extrabold tracking-widest uppercase text-[#802924] mt-0.5">
            FALSAFAH YUGYO ATELIER #04
          </p>
        </div>
      </footer>

    </div>
  );
}