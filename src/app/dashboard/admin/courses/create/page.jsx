// =====================================================================
// YUGYO - Admin Create Course Page
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

  try {
    const catRes = await pool.query('SELECT id, name FROM categories ORDER BY name ASC;');
    categories = catRes.rows;

    const teacherRes = await pool.query(
      `SELECT id, full_name, email FROM users WHERE LOWER(role) IN ('teacher', 'instructor') ORDER BY full_name ASC;`
    );
    teachers = teacherRes.rows;
  } catch (err) {
    console.error('Error loading form options:', err);
  }

  return (
    <div className="min-h-screen bg-[var(--color-light-silver)] p-6 md:p-10 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-8 border border-[var(--color-pastel-blue)]/40 text-[var(--color-prussian)]">
        
        <div className="mb-6">
          <Link href="/dashboard/admin/courses" className="text-xs font-bold text-[var(--color-teal-blue)] hover:underline">
            ← Kembali ke Daftar Kursus
          </Link>
          <h1 className="text-2xl font-extrabold mt-2">Tambah Course Baru</h1>
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
              className="w-full bg-[var(--color-light-silver)]/50 border border-[var(--color-pastel-blue)] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-blue)]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1.5">Kategori Mata Pelajaran *</label>
              <select
                name="category_id"
                required
                className="w-full bg-[var(--color-light-silver)]/50 border border-[var(--color-pastel-blue)] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-blue)]"
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
                className="w-full bg-[var(--color-light-silver)]/50 border border-[var(--color-pastel-blue)] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-blue)]"
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
              rows="4"
              required
              placeholder="Tuliskan ringkasan materi dan tujuan pembelajaran kelas ini..."
              className="w-full bg-[var(--color-light-silver)]/50 border border-[var(--color-pastel-blue)] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-blue)]"
            ></textarea>
          </div>

          <div className="bg-[var(--color-light-silver)]/40 p-4 rounded-2xl border border-[var(--color-pastel-blue)]/40">
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
                  className="w-full bg-white border border-[var(--color-pastel-blue)] rounded-xl px-3.5 py-2.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Tanggal Selesai</label>
                <input
                  type="date"
                  name="end_date"
                  className="w-full bg-white border border-[var(--color-pastel-blue)] rounded-xl px-3.5 py-2.5"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-pastel-blue)]/30">
            <Link
              href="/dashboard/admin/courses"
              className="px-5 py-3 rounded-2xl font-semibold bg-[var(--color-light-silver)] hover:bg-slate-200 transition"
            >
              Batal
            </Link>
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl font-bold bg-[var(--color-mughal)] text-white hover:bg-[#2b5421] transition shadow-md"
            >
              ✓ Simpan Course
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}