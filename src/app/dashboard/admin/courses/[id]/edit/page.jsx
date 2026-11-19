import Link from 'next/link';
import pool from '@/lib/db';
import { notFound } from 'next/navigation';

export default async function EditCoursePage({ params }) {
  const { id } = await params;

  let course = null;
  let categories = [];
  let instructors = [];

  try {
    const [courseRes, catRes, instRes] = await Promise.all([
      pool.query('SELECT * FROM courses WHERE id = $1;', [id]),
      pool.query('SELECT id, name FROM categories ORDER BY name ASC;'),
      pool.query('SELECT id, full_name FROM users ORDER BY full_name ASC;'),
    ]);

    if (courseRes.rows.length === 0) {
      notFound();
    }

    course = courseRes.rows[0];
    categories = catRes.rows;
    instructors = instRes.rows;
  } catch (err) {
    console.error('Error fetching edit course data:', err);
  }

  const formatDateForInput = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    return !isNaN(d) ? d.toISOString().split('T')[0] : '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#341D17]/45 backdrop-blur-xs overflow-y-auto flex items-start justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-3xl bg-[#FFFDF9] rounded-3xl shadow-2xl border border-[#341D17]/20 overflow-hidden my-auto">
        
        {/* HEADER MODAL */}
        <div className="px-6 py-4 bg-[#FFFDF9] border-b border-[#341D17]/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#802924]">
              ATELIER OPERATIONS • EDIT MODUL
            </span>
            <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
              Edit Kursus: {course?.title}
            </h2>
          </div>

          <Link
            href="/dashboard/admin/courses"
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] flex items-center justify-center text-xs font-bold transition shadow-xs"
          >
            ✕
          </Link>
        </div>

        {/* BODY FORM EDIT */}
        <form 
          action={`/api/admin/courses/${course?.id}`} 
          method="POST" 
          className="p-6 sm:p-8 space-y-5 max-h-[78vh] overflow-y-auto bg-[#FFFDF9]"
        >
          <input type="hidden" name="_method" value="PUT" />

          {/* Judul Kursus */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase text-[#341D17]">
              Judul Kursus / Modul
            </label>
            <input
              type="text"
              name="title"
              defaultValue={course?.title || ''}
              required
              className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
            />
          </div>

          {/* Kategori & Instruktur */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase text-[#341D17]">
                Kategori Atelier
              </label>
              <select
                name="category_id"
                defaultValue={course?.category_id || ''}
                required
                className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
              >
                <option value="">Pilih Kategori...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase text-[#341D17]">
                Master Chef / Instruktur
              </label>
              <select
                name="instructor_id"
                defaultValue={course?.instructor_id || ''}
                required
                className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
              >
                <option value="">Pilih Instruktur...</option>
                {instructors.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase text-[#341D17]">
                Tanggal Mulai
              </label>
              <input
                type="date"
                name="start_date"
                defaultValue={formatDateForInput(course?.start_date)}
                className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase text-[#341D17]">
                Tanggal Selesai
              </label>
              <input
                type="date"
                name="end_date"
                defaultValue={formatDateForInput(course?.end_date)}
                className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
              />
            </div>
          </div>

          {/* Status & Thumbnail */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase text-[#341D17]">
                Status Kurasi
              </label>
              <select
                name="status"
                defaultValue={course?.status || 'active'}
                className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
              >
                <option value="active">Aktif (Published)</option>
                <option value="pending">Menunggu Approval</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase text-[#341D17]">
                Path Thumbnail Kursus
              </label>
              <input
                type="text"
                name="thumbnail_url"
                defaultValue={course?.thumbnail_url || ''}
                placeholder="/pictures/courses/..."
                className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase text-[#341D17]">
              Deskripsi &amp; Silabus Modul
            </label>
            <textarea
              name="description"
              rows="3"
              defaultValue={course?.description || ''}
              className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs resize-none"
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-sm py-3.5 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Simpan Perubahan Kursus</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}