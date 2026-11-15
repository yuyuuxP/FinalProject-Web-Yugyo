// =====================================================================
// YUGYO - Admin Course Detail Modal with Crisp Background
// File: src/app/dashboard/admin/courses/[id]/page.jsx
// =====================================================================

import Link from 'next/link';
import pool from '@/lib/db';
import { approveCourse, rejectCourse, deleteCourse } from './actions';

export default async function AdminCourseDetailPage({ params }) {
  const resolvedParams = await params;
  const courseId = resolvedParams.id;

  let course = null;
  let coursesList = [];

  try {
    const result = await pool.query(
      `SELECT c.*, cat.name AS category_name, u.full_name AS instructor_name, u.email AS instructor_email
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.id
       LEFT JOIN users u ON c.instructor_id = u.id
       WHERE c.id = $1 LIMIT 1;`,
      [courseId]
    );
    course = result.rows[0];

    const listResult = await pool.query(
      `SELECT c.id, c.title, c.status, cat.name AS category_name, u.full_name AS instructor_name 
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.id
       LEFT JOIN users u ON c.instructor_id = u.id
       ORDER BY c.id DESC LIMIT 8;`
    );
    coursesList = listResult.rows;
  } catch (err) {
    console.error('Database Error:', err);
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[var(--color-light-silver)] flex items-center justify-center text-[var(--color-prussian)] font-bold">
        Kursus tidak ditemukan atau ID tidak valid ({courseId}).
      </div>
    );
  }

  const isActive = course.status?.toLowerCase() === 'active';
  const isRejected = course.status?.toLowerCase() === 'rejected';

  const handleApprove = approveCourse.bind(null, courseId);
  const handleReject = rejectCourse.bind(null, courseId);
  const handleDelete = deleteCourse.bind(null, courseId);

  return (
    <div className="relative min-h-screen bg-[var(--color-light-silver)] flex overflow-hidden select-none">
      
      {/* ================= BACKGROUND: HALAMAN DAFTAR KURSUS UTAMA (JELAS & TANPA BLUR BERLEBIH) ================= */}
      <div className="flex-1 flex opacity-65 pointer-events-none select-none">
        
        {/* Sidebar Utama */}
        <aside className="w-64 bg-[var(--color-prussian)] text-white p-6 flex flex-col justify-between hidden md:flex shadow-xl">
          <div>
            <div className="flex items-center gap-3 mb-10 px-2">
              <div className="w-9 h-9 rounded-2xl bg-[var(--color-mughal)] flex items-center justify-center text-white font-extrabold text-base">Y</div>
              <div>
                <h1 className="text-base font-bold tracking-wider">YUGYO</h1>
                <p className="text-[10px] text-[var(--color-pastel-blue)] uppercase">E-Learning</p>
              </div>
            </div>
            <nav className="space-y-1.5 text-xs font-semibold">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--color-pastel-blue)]"><span>🗂️</span> Dashboard</div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--color-teal-blue)]/30 text-white"><span>📚</span> Courses</div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--color-pastel-blue)]"><span>👥</span> Students & Instructors</div>
            </nav>
          </div>
        </aside>

        {/* Konten Tabel di Belakang */}
        <main className="flex-1 p-6 md:p-8 overflow-hidden">
          <header className="flex items-center justify-between mb-6 bg-white p-4 rounded-3xl shadow-sm border border-[var(--color-pastel-blue)]/30">
            <div>
              <h1 className="text-xl font-extrabold text-[var(--color-prussian)]">Moderasi Kursus Platform</h1>
              <p className="text-xs text-[var(--color-teal-blue)]">Kelola dan tinjau modul kursus berdasarkan data PostgreSQL.</p>
            </div>
          </header>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[var(--color-pastel-blue)]/30">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--color-pastel-blue)]/30 text-[var(--color-teal-blue)]">
                  <th className="pb-3 font-semibold">Judul Materi / Kursus</th>
                  <th className="pb-3 font-semibold">Kategori</th>
                  <th className="pb-3 font-semibold">Instruktur</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-pastel-blue)]/20 text-[var(--color-prussian)]">
                {coursesList.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4 font-bold">{item.title}</td>
                    <td className="py-4">{item.category_name || 'Umum'}</td>
                    <td className="py-4">{item.instructor_name || 'Nurhayu'}</td>
                    <td className="py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* ================= FOREGROUND: KARTU POPUP DETAIL (DI TENGAH ATAS OVERLAY) ================= */}
      <div className="absolute inset-0 z-50 bg-[var(--color-prussian)]/20 backdrop-blur-[1px] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
        
        <div className="w-full max-w-2xl bg-[var(--color-light-silver)] rounded-3xl shadow-2xl p-6 md:p-8 border border-[var(--color-pastel-blue)] text-[var(--color-prussian)] relative">
          
          <div className="mb-4">
            <Link href="/dashboard/admin/courses" className="text-xs font-bold text-[var(--color-teal-blue)] hover:underline flex items-center gap-1">
              ← Kembali ke Daftar Kursus
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--color-pastel-blue)]/40">
            <div>
              <span className="bg-[var(--color-mughal)] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {course.category_name || 'Umum'}
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold text-[var(--color-prussian)] mt-2">
                {course.title}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5 text-xs">
            <div className="bg-white/90 p-3.5 rounded-2xl border border-[var(--color-pastel-blue)]/30 shadow-sm">
              <p className="text-[var(--color-teal-blue)] font-semibold mb-1">Informasi Instruktur</p>
              <p className="font-bold text-sm text-[var(--color-prussian)]">{course.instructor_name || 'Tidak diketahui'}</p>
              <p className="text-[var(--color-teal-blue)]">{course.instructor_email || '-'}</p>
            </div>
            <div className="bg-white/90 p-3.5 rounded-2xl border border-[var(--color-pastel-blue)]/30 shadow-sm">
              <p className="text-[var(--color-teal-blue)] font-semibold mb-1">Status Publikasi</p>
              <p className="font-bold text-sm">
                <span className={`px-3 py-1 rounded-full text-[10px] ${
                  isActive 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : isRejected 
                    ? 'bg-rose-100 text-rose-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {course.status}
                </span>
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-teal-blue)] mb-2">
              Deskripsi Modul Pembelajaran
            </h3>
            <p className="text-xs md:text-sm text-[var(--color-prussian)] leading-relaxed bg-white/80 p-4 rounded-2xl border border-[var(--color-pastel-blue)]/30 shadow-sm">
              {course.description || 'Tidak ada deskripsi yang disediakan untuk kursus ini.'}
            </p>
          </div>

          {/* KELOMPOK TOMBOL AKSI TERPISAH */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--color-pastel-blue)]/40">
            
            {/* Tombol Hapus */}
            <form action={handleDelete} className="w-full sm:w-auto">
              <button 
                type="submit"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition border border-rose-200 shadow-sm"
              >
                🗑️ Hapus Kursus
              </button>
            </form>

            {/* Tombol Aksi Moderasi */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
              <Link 
                href="/dashboard/admin/courses"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--color-prussian)] bg-white hover:bg-white/90 transition border border-[var(--color-pastel-blue)] shadow-sm"
              >
                Kembali
              </Link>

              {/* Tombol Tolak */}
              <form action={isActive || isRejected ? undefined : handleReject}>
                <button 
                  type="submit"
                  disabled={isActive || isRejected}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive || isRejected 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                      : 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm'
                  }`}
                >
                  {isRejected ? '✕ Ditolak' : isActive ? '✕ Tolak (Terkunci)' : '✕ Tolak Course'}
                </button>
              </form>

              {/* Tombol Setuju */}
              <form action={isActive ? undefined : handleApprove}>
                <button 
                  type="submit"
                  disabled={isActive}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition ${
                    isActive 
                      ? 'bg-emerald-400/70 cursor-not-allowed shadow-none' 
                      : 'bg-[var(--color-mughal)] hover:bg-[#2b5421] transform hover:-translate-y-0.5'
                  }`}
                >
                  {isActive ? '✓ Telah Aktif' : '✓ Setuju (Approve)'}
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}