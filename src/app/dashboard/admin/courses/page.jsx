// =====================================================================
// YUGYO - Admin Courses Management (List, Filter, Schedule & Create)
// File: src/app/dashboard/admin/courses/page.jsx
// =====================================================================

import Link from 'next/link';
import pool from '@/lib/db';

function formatDateID(dateVal) {
  if (!dateVal) return null;
  return new Date(dateVal).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default async function AdminCoursesPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const selectedCategory = resolvedSearchParams?.category || 'all';

  let query = `
    SELECT 
      c.id, 
      c.title, 
      c.description, 
      c.status,
      c.start_date,
      c.end_date,
      cat.name AS category_name, 
      u.full_name AS instructor_name 
    FROM courses c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN users u ON c.instructor_id = u.id
  `;

  let queryParams = [];

  if (selectedCategory !== 'all') {
    query += ` WHERE cat.name = $1`;
    queryParams.push(selectedCategory);
  }

  query += ` ORDER BY c.id DESC;`;

  let coursesList = [];
  let categoriesList = [];

  try {
    const courseResult = await pool.query(query, queryParams);
    coursesList = courseResult.rows;

    const catResult = await pool.query('SELECT name FROM categories ORDER BY name ASC;');
    categoriesList = catResult.rows;
  } catch (err) {
    console.error('Database Error:', err);
  }

  return (
    <div className="min-h-screen bg-[var(--color-light-silver)] flex">
      
      {/* SIDEBAR UTAMA */}
      <aside className="w-64 bg-[var(--color-prussian)] text-white p-6 flex flex-col justify-between hidden md:flex shadow-xl">
        <div>
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-9 h-9 rounded-2xl bg-[var(--color-mughal)] flex items-center justify-center text-white font-extrabold text-base shadow-md">
              Y
            </div>
            <div>
              <h1 className="text-base font-bold tracking-wider">YUGYO</h1>
              <p className="text-[10px] text-[var(--color-pastel-blue)] uppercase tracking-widest">E-Learning</p>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-semibold">
            <Link href="/dashboard/admin" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--color-pastel-blue)] hover:bg-white/10 transition">
              <span>🗂️</span> Dashboard
            </Link>
            <Link href="/dashboard/admin/courses" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--color-teal-blue)]/30 text-white shadow-sm transition">
              <span>📚</span> Courses
            </Link>
            <Link href="/dashboard/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--color-pastel-blue)] hover:bg-white/10 transition">
              <span>👥</span> Students & Instructors
            </Link>
            <Link href="/dashboard/admin/reports" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--color-pastel-blue)] hover:bg-white/10 transition">
              <span>💳</span> Transactions
            </Link>
            <Link href="/dashboard/admin/chat" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--color-pastel-blue)] hover:bg-white/10 transition">
              <span>💬</span> Chat & Support
            </Link>
            <Link href="/dashboard/admin/schedule" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--color-pastel-blue)] hover:bg-white/10 transition">
              <span>📅</span> Schedule
            </Link>
            <Link href="/dashboard/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--color-pastel-blue)] hover:bg-white/10 transition">
              <span>⚙️</span> Settings
            </Link>
          </nav>
        </div>

        <div className="pt-4 border-t border-white/10 px-2">
          <Link href="/login" className="text-xs font-semibold text-rose-300 hover:text-white flex items-center gap-2 transition">
            <span>🚪</span> Keluar Sesi
          </Link>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 bg-white p-5 rounded-3xl shadow-sm border border-[var(--color-pastel-blue)]/30">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[var(--color-prussian)]">
              Moderasi Kursus Platform
            </h1>
            <p className="text-xs text-[var(--color-teal-blue)]">
              Kelola daftar kelas, jadwal akses, dan moderasi materi PostgreSQL.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-[var(--color-light-silver)] px-4 py-2.5 rounded-2xl text-xs font-semibold text-[var(--color-prussian)]">
              Total: {coursesList.length} Materi
            </div>
            <Link
              href="/dashboard/admin/courses/create"
              className="bg-[var(--color-mughal)] hover:bg-[#2b5421] text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
            >
              <span>+</span> Tambah Course
            </Link>
          </div>
        </header>

        {/* FILTER KATEGORI */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-[var(--color-pastel-blue)]/30 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold text-[var(--color-prussian)] uppercase tracking-wider mb-0.5">
              Filter Kategori Course
            </h3>
            <p className="text-xs text-[var(--color-teal-blue)]">Pilih mata pelajaran lalu klik Filter</p>
          </div>

          <div className="w-full md:w-auto">
            <form method="GET" action="/dashboard/admin/courses" className="flex items-center gap-2">
              <select
                name="category"
                defaultValue={selectedCategory}
                className="bg-[var(--color-light-silver)]/70 border border-[var(--color-pastel-blue)] text-[var(--color-prussian)] text-xs font-semibold rounded-2xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-blue)] transition cursor-pointer shadow-sm w-full md:w-64"
              >
                <option value="all">📂 Semua Kategori (Tampilkan Semua)</option>
                {categoriesList.map((cat, idx) => (
                  <option key={idx} value={cat.name}>
                    📚 {cat.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="bg-[var(--color-prussian)] text-white px-5 py-2.5 rounded-2xl text-xs font-bold hover:bg-[#152a3a] transition shadow-sm shrink-0"
              >
                Filter
              </button>
            </form>
          </div>
        </div>

        {/* TABEL KURSUS */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[var(--color-pastel-blue)]/30">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--color-pastel-blue)]/30 text-[var(--color-teal-blue)]">
                  <th className="pb-3 font-semibold">Judul Materi / Kursus</th>
                  <th className="pb-3 font-semibold">Kategori</th>
                  <th className="pb-3 font-semibold">Instruktur</th>
                  <th className="pb-3 font-semibold">Rentang Waktu</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-pastel-blue)]/20 text-[var(--color-prussian)]">
                {coursesList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-[var(--color-teal-blue)] font-medium">
                      Belum ada data materi dalam kategori ini.
                    </td>
                  </tr>
                ) : (
                  coursesList.map((course) => {
                    const startFmt = formatDateID(course.start_date);
                    const endFmt = formatDateID(course.end_date);
                    const isLifetime = !startFmt && !endFmt;

                    return (
                      <tr key={course.id} className="hover:bg-[var(--color-light-silver)]/30 transition">
                        <td className="py-4 font-bold text-[var(--color-prussian)]">
                          {course.title}
                        </td>
                        <td className="py-4 text-[var(--color-teal-blue)] font-medium">
                          {course.category_name || 'Umum'}
                        </td>
                        <td className="py-4 font-medium">
                          {course.instructor_name || 'Nurhayu Fiantika'}
                        </td>
                        <td className="py-4">
                          {isLifetime ? (
                            <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                              ∞ Lifetime Access
                            </span>
                          ) : (
                            <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full text-[10px] font-semibold">
                              🗓️ {startFmt || '?'} – {endFmt || '?'}
                            </span>
                          )}
                        </td>
                        <td className="py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            course.status?.toLowerCase() === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : course.status?.toLowerCase() === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {course.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link 
                              href={`/dashboard/admin/courses/${course.id}`}
                              className="bg-[var(--color-prussian)] text-white px-3.5 py-1.5 rounded-xl text-[11px] font-semibold hover:bg-[#152a3a] transition shadow-sm"
                            >
                              Tinjau →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}