// =====================================================================
// YUGYO - Admin Course Detail & Inline Edit Modal
// File: src/app/dashboard/admin/courses/[id]/page.jsx
// =====================================================================

import Link from 'next/link';
import pool from '@/lib/db';
import { approveCourse, rejectCourse, deleteCourse, updateCourse } from './actions';

function formatDateID(dateVal) {
  if (!dateVal) return null;
  return new Date(dateVal).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const formatInputDate = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');

export default async function AdminCourseDetailPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const courseId = resolvedParams.id;
  const isEditMode = resolvedSearchParams?.mode === 'edit';

  let course = null;
  let coursesList = [];
  let categories = [];
  let teachers = [];

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

    if (isEditMode) {
      const catRes = await pool.query('SELECT id, name FROM categories ORDER BY name ASC;');
      categories = catRes.rows;

      const teacherRes = await pool.query(
        `SELECT id, full_name, email FROM users WHERE LOWER(role) IN ('teacher', 'instructor') ORDER BY full_name ASC;`
      );
      teachers = teacherRes.rows;
    }
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
  const startFmt = formatDateID(course.start_date);
  const endFmt = formatDateID(course.end_date);
  const isLifetime = !startFmt && !endFmt;

  const handleApprove = approveCourse.bind(null, courseId);
  const handleReject = rejectCourse.bind(null, courseId);
  const handleDelete = deleteCourse.bind(null, courseId);
  const handleUpdate = updateCourse.bind(null, courseId);

  return (
    <div className="relative min-h-screen bg-[var(--color-light-silver)] flex overflow-hidden select-none">
      
      {/* BACKGROUND: DAFTAR KURSUS UTAMA (TRANSPARAN) */}
      <div className="flex-1 flex opacity-45 pointer-events-none select-none">
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

        <main className="flex-1 p-6 md:p-8 overflow-hidden">
          <header className="flex items-center justify-between mb-6 bg-white p-4 rounded-3xl shadow-sm border border-[var(--color-pastel-blue)]/30">
            <div>
              <h1 className="text-xl font-extrabold text-[var(--color-prussian)]">Moderasi Kursus Platform</h1>
              <p className="text-xs text-[var(--color-teal-blue)]">Kelola daftar kelas, jadwal akses, dan moderasi materi PostgreSQL.</p>
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

      {/* FOREGROUND: MODAL DETAIL ATAU FORM EDIT */}
      <div className="absolute inset-0 z-50 bg-[var(--color-prussian)]/20 backdrop-blur-[1px] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
        <div className="w-full max-w-2xl bg-[var(--color-light-silver)] rounded-3xl shadow-2xl p-6 md:p-8 border border-[var(--color-pastel-blue)] text-[var(--color-prussian)] relative">
          
          {isEditMode ? (
            /* ================= TAMPILAN FORM EDIT ================= */
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--color-pastel-blue)]/40">
                <div>
                  <h2 className="text-xl font-extrabold">Edit Data Course</h2>
                  <p className="text-xs text-[var(--color-teal-blue)]">Perubahan akan langsung disimpan melalui actions.jsx</p>
                </div>
                <Link
                  href={`/dashboard/admin/courses/${courseId}`}
                  className="text-xs font-bold text-[var(--color-teal-blue)] hover:underline"
                >
                  ✕ Batal Edit
                </Link>
              </div>

              <form action={handleUpdate} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold mb-1">Nama Course *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={course.title}
                    className="w-full bg-white border border-[var(--color-pastel-blue)] rounded-2xl px-4 py-2.5"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Kategori *</label>
                    <select
                      name="category_id"
                      required
                      defaultValue={course.category_id || ''}
                      className="w-full bg-white border border-[var(--color-pastel-blue)] rounded-2xl px-4 py-2.5"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Nama Teacher *</label>
                    <select
                      name="instructor_id"
                      required
                      defaultValue={course.instructor_id || ''}
                      className="w-full bg-white border border-[var(--color-pastel-blue)] rounded-2xl px-4 py-2.5"
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>{t.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Deskripsi *</label>
                  <textarea
                    name="description"
                    rows="3"
                    required
                    defaultValue={course.description || ''}
                    className="w-full bg-white border border-[var(--color-pastel-blue)] rounded-2xl px-4 py-2.5"
                  ></textarea>
                </div>

                <div className="bg-white/70 p-3.5 rounded-2xl border border-[var(--color-pastel-blue)]/40">
                  <p className="font-bold mb-1">Rentang Waktu (Opsional - Kosongkan untuk Lifetime Access)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="block font-semibold mb-1">Tanggal Mulai</label>
                      <input
                        type="date"
                        name="start_date"
                        defaultValue={formatInputDate(course.start_date)}
                        className="w-full bg-white border border-[var(--color-pastel-blue)] rounded-xl px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Tanggal Selesai</label>
                      <input
                        type="date"
                        name="end_date"
                        defaultValue={formatInputDate(course.end_date)}
                        className="w-full bg-white border border-[var(--color-pastel-blue)] rounded-xl px-3 py-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-pastel-blue)]/40">
                  <Link
                    href={`/dashboard/admin/courses/${courseId}`}
                    className="px-4 py-2.5 rounded-xl font-semibold bg-white border border-[var(--color-pastel-blue)]"
                  >
                    Batal
                  </Link>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl font-bold bg-[var(--color-mughal)] text-white hover:bg-[#2b5421] shadow-md"
                  >
                    ✓ Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* ================= TAMPILAN DETAIL MODERASI ================= */
            <div>
              <div className="flex items-center justify-between mb-4">
                <Link href="/dashboard/admin/courses" className="text-xs font-bold text-[var(--color-teal-blue)] hover:underline flex items-center gap-1">
                  ← Kembali ke Daftar Kursus
                </Link>
                <Link
                  href={`/dashboard/admin/courses/${courseId}?mode=edit`}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition border border-amber-300"
                >
                  ✏️ Edit Course
                </Link>
              </div>

              <div className="pb-4 border-b border-[var(--color-pastel-blue)]/40">
                <span className="bg-[var(--color-mughal)] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {course.category_name || 'Umum'}
                </span>
                <h1 className="text-xl md:text-2xl font-extrabold text-[var(--color-prussian)] mt-2">
                  {course.title}
                </h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-5 text-xs">
                <div className="bg-white/90 p-3.5 rounded-2xl border border-[var(--color-pastel-blue)]/30 shadow-sm">
                  <p className="text-[var(--color-teal-blue)] font-semibold mb-1">Instruktur</p>
                  <p className="font-bold text-sm text-[var(--color-prussian)]">{course.instructor_name || 'Tidak diketahui'}</p>
                  <p className="text-[11px] text-[var(--color-teal-blue)] truncate">{course.instructor_email || '-'}</p>
                </div>

                <div className="bg-white/90 p-3.5 rounded-2xl border border-[var(--color-pastel-blue)]/30 shadow-sm">
                  <p className="text-[var(--color-teal-blue)] font-semibold mb-1">Rentang Waktu</p>
                  {isLifetime ? (
                    <p className="font-extrabold text-sky-700 text-xs mt-1">∞ Lifetime Access</p>
                  ) : (
                    <p className="font-bold text-purple-800 text-[11px] mt-1">
                      {startFmt || '?'} – {endFmt || '?'}
                    </p>
                  )}
                </div>

                <div className="bg-white/90 p-3.5 rounded-2xl border border-[var(--color-pastel-blue)]/30 shadow-sm">
                  <p className="text-[var(--color-teal-blue)] font-semibold mb-1">Status Publikasi</p>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-[10px] font-bold ${
                    isActive 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : isRejected 
                      ? 'bg-rose-100 text-rose-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {course.status}
                  </span>
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

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--color-pastel-blue)]/40">
                <form action={handleDelete} className="w-full sm:w-auto">
                  <button 
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition border border-rose-200 shadow-sm"
                  >
                    🗑️ Hapus Kursus
                  </button>
                </form>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                  <Link 
                    href="/dashboard/admin/courses"
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--color-prussian)] bg-white hover:bg-white/90 transition border border-[var(--color-pastel-blue)] shadow-sm"
                  >
                    Kembali
                  </Link>

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
          )}

        </div>
      </div>

    </div>
  );
}