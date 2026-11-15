// =====================================================================
// YUGYO - Admin Create Course Modal with Transparent Main Page Background
// File: src/app/dashboard/admin/courses/create/page.jsx
// =====================================================================

import Link from 'next/link';
import pool from '@/lib/db';
import { redirect } from 'next/navigation';

async function createCourseAction(formData) {
  'use server';

  const title = formData.get('title')?.toString().trim();
  const description = formData.get('description')?.toString().trim();
  const categoryId = formData.get('category_id');
  const instructorId = formData.get('instructor_id');
  const startDate = formData.get('start_date') || null;
  const endDate = formData.get('end_date') || null;

  if (!title || !categoryId || !instructorId) return;

  try {
    await pool.query(
      `INSERT INTO courses (title, description, category_id, instructor_id, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active');`,
      [title, description, categoryId, instructorId, startDate, endDate]
    );
  } catch (err) {
    console.error('Error creating course:', err);
  }

  redirect('/dashboard/admin/courses');
}

export default async function AdminCreateCoursePage() {
  let categories = [];
  let teachers = [];
  let coursesList = [];

  try {
    const catRes = await pool.query('SELECT id, name FROM categories ORDER BY name ASC;');
    categories = catRes.rows;

    const teacherRes = await pool.query(
      `SELECT id, full_name, email FROM users WHERE LOWER(role) IN ('teacher', 'instructor') ORDER BY full_name ASC;`
    );
    teachers = teacherRes.rows;

    // Ambil daftar kursus utama untuk ditampilkan transparan di latar belakang
    const listResult = await pool.query(
      `SELECT c.id, c.title, c.status, cat.name AS category_name, u.full_name AS instructor_name 
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.id
       LEFT JOIN users u ON c.instructor_id = u.id
       ORDER BY c.id DESC LIMIT 8;`
    );
    coursesList = listResult.rows;
  } catch (err) {
    console.error('Error loading form options:', err);
  }

  return (
    <div className="relative min-h-screen bg-[var(--color-light-silver)] flex overflow-hidden select-none">
      
      {/* ================= BACKGROUND: HALAMAN DAFTAR KURSUS UTAMA (TRANSPARAN) ================= */}
      <div className="flex-1 flex opacity-70 pointer-events-none select-none">
        <aside className="w-64 bg-[var(--color-prussian)] text-white p-6 flex flex-col justify-between hidden md:flex shadow-xl">
          <div>
            <div className="flex items-center gap-3 mb-10 px-2">
              <div className="w-9 h-9 rounded-2xl bg-[var(--color-mughal)] flex items-center justify-center text-white font-extrabold text-base">
                Y
              </div>
              <div>
                <h1 className="text-base font-bold tracking-wider">YUGYO</h1>
                <p className="text-[10px] text-[var(--color-pastel-blue)] uppercase">E-Learning</p>
              </div>
            </div>
            <nav className="space-y-1.5 text-xs font-semibold">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--color-pastel-blue)]">
                <span>🗂️</span> Dashboard
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--color-teal-blue)]/30 text-white">
                <span>📚</span> Courses
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--color-pastel-blue)]">
                <span>👥</span> Students & Instructors
              </div>
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
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
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

      {/* ================= FOREGROUND: KARTU POPUP TAMBAH COURSE ================= */}
      <div className="absolute inset-0 z-50 bg-[var(--color-prussian)]/20 backdrop-blur-[1px] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
        <div className="w-full max-w-2xl bg-[var(--color-light-silver)] rounded-3xl shadow-2xl p-6 md:p-8 border border-[var(--color-pastel-blue)] text-[var(--color-prussian)] relative select-auto">
          
          <div className="mb-5 pb-4 border-b border-[var(--color-pastel-blue)]/40">
            <Link href="/dashboard/admin/courses" className="text-xs font-bold text-[var(--color-teal-blue)] hover:underline">
              ← Kembali ke Daftar Kursus
            </Link>
            <h1 className="text-xl md:text-2xl font-extrabold mt-2">Tambah Course Baru</h1>
            <p className="text-xs text-[var(--color-teal-blue)]">
              Lengkapi informasi kelas, pilih instruktur pengajar, dan atur jadwal akses.
            </p>
          </div>

          <form action={createCourseAction} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold mb-1.5">Nama Course *</label>
              <input
                type="text"
                name="title"
                required
                placeholder="Contoh: Pemrograman Web Modern dengan Next.js"
                className="w-full bg-white border border-[var(--color-pastel-blue)] rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-blue)]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1.5">Kategori Mata Pelajaran *</label>
                <select
                  name="category_id"
                  required
                  className="w-full bg-white border border-[var(--color-pastel-blue)] rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-blue)]"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1.5">Nama Teacher / Instruktur *</label>
                <select
                  name="instructor_id"
                  required
                  className="w-full bg-white border border-[var(--color-pastel-blue)] rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-blue)]"
                >
                  <option value="">-- Pilih Instruktur --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1.5">Deskripsi Course *</label>
              <textarea
                name="description"
                rows="3"
                required
                placeholder="Tuliskan ringkasan materi dan tujuan pembelajaran kelas ini..."
                className="w-full bg-white border border-[var(--color-pastel-blue)] rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-blue)]"
              ></textarea>
            </div>

            <div className="bg-white/70 p-4 rounded-2xl border border-[var(--color-pastel-blue)]/40">
              <p className="font-bold mb-1">Rentang Waktu Kelas (Opsional)</p>
              <p className="text-[11px] text-[var(--color-teal-blue)] mb-3">
                Kosongkan kedua tanggal di bawah ini jika kelas bersifat <strong>Lifetime Access</strong> (tanpa batas waktu).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    name="start_date"
                    className="w-full bg-white border border-[var(--color-pastel-blue)] rounded-xl px-3.5 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    name="end_date"
                    className="w-full bg-white border border-[var(--color-pastel-blue)] rounded-xl px-3.5 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-pastel-blue)]/40">
              <Link
                href="/dashboard/admin/courses"
                className="px-5 py-2.5 rounded-xl font-semibold bg-white border border-[var(--color-pastel-blue)] hover:bg-white/80 transition"
              >
                Batal
              </Link>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl font-bold bg-[var(--color-mughal)] text-white hover:bg-[#2b5421] transition shadow-md"
              >
                ✓ Simpan Course
              </button>
            </div>
          </form>

        </div>
      </div>

    </div>
  );
}