import Link from 'next/link';
import pool from '@/lib/db';

export default async function EditSchedulePage({ params }) {
  const { id } = await params;

  let session = null;
  let categories = [];
  let teachers = [];

  try {
    // Ambil data sesi berdasarkan ID
    const sessionRes = await pool.query('SELECT * FROM courses WHERE id = $1;', [id]);
    session = sessionRes.rows[0];

    // Ambil kategori
    const catRes = await pool.query('SELECT id, name FROM categories ORDER BY name ASC;');
    categories = catRes.rows;

    // Ambil daftar guru/instruktur
    const teacherRes = await pool.query("SELECT id, full_name FROM users WHERE role = 'teacher' ORDER BY full_name ASC;");
    teachers = teacherRes.rows;
  } catch (err) {
    console.error('Error fetching data for schedule edit:', err);
  }

  if (!session) {
    return (
      <div className="fixed inset-0 z-50 bg-[#341D17]/45 backdrop-blur-xs flex items-center justify-center px-4">
        <div className="bg-[#FFFDF9] rounded-3xl p-8 max-w-md w-full text-center space-y-3 shadow-2xl border border-[#341D17]/20">
          <p className="text-sm font-bold text-[#802924]">Sesi jadwal tidak ditemukan.</p>
          <Link
            href="/dashboard/admin/schedule"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#802924] text-[#F9DDBB] text-xs font-bold transition"
          >
            Kembali ke Manajemen Jadwal
          </Link>
        </div>
      </div>
    );
  }

  // Format tanggal untuk input type="date" (YYYY-MM-DD)
  const formattedDate = session.start_date ? new Date(session.start_date).toISOString().split('T')[0] : '2026-11-18';

  return (
    <div className="fixed inset-0 z-50 bg-[#341D17]/45 backdrop-blur-xs overflow-y-auto flex items-start justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-xl bg-[#FFFDF9] rounded-3xl shadow-2xl border border-[#341D17]/20 overflow-hidden my-auto">
        
        {/* HEADER MODAL */}
        <div className="px-6 py-4 bg-[#FFFDF9] border-b border-[#341D17]/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#802924]">
              🥐 ATELIER KALENDER • PENGATURAN JADWAL
            </span>
            <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
              Ubah Sesi: {session.title}
            </h2>
          </div>

          <Link
            href="/dashboard/admin/schedule"
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] flex items-center justify-center text-xs font-bold transition shadow-xs"
          >
            ✕
          </Link>
        </div>

        {/* BODY FORM EDIT */}
        <form 
          action={`/api/admin/schedule/${session.id}`} 
          method="POST" 
          className="p-6 sm:p-8 space-y-5 bg-[#FFFDF9]"
        >
          {/* Judul Sesi */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase text-[#341D17]">
              Judul Sesi Kelas / Materi
            </label>
            <input
              type="text"
              name="title"
              defaultValue={session.title}
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
                defaultValue={session.category_id || ''}
                required
                className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
              >
                <option value="" disabled>Pilih Kategori...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase text-[#341D17]">
                Chef / Instruktur Pengajar
              </label>
              <select
                name="instructor_id"
                defaultValue={session.instructor_id || ''}
                required
                className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
              >
                <option value="" disabled>Pilih Chef Pengajar...</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    Chef {t.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tanggal & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase text-[#341D17]">
                Tanggal Pelaksanaan (Tahun 2026)
              </label>
              <input
                type="date"
                name="start_date"
                defaultValue={formattedDate}
                required
                className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase text-[#341D17]">
                Status Sesi
              </label>
              <select
                name="status"
                defaultValue={session.status || 'active'}
                className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
              >
                <option value="active">Aktif / Siap Dimulai (Active)</option>
                <option value="pending">Konfirmasi Studio (Pending)</option>
                <option value="draft">Draft Sesi (Draft)</option>
              </select>
            </div>
          </div>

          {/* Input Tautan YouTube / Video */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase text-[#341D17]">
              Tautan YouTube / File Video Pembelajaran
            </label>
            <input
              type="text"
              name="video_url"
              defaultValue={session.video_url || ''}
              placeholder="Contoh: https://youtube.com/watch?v=... atau /videos/croissant.mp4"
              className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
            />
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase text-[#341D17]">
              Deskripsi Singkat Sesi
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={session.description || ''}
              className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-sm py-3.5 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>💾</span>
              <span>Simpan Perubahan Jadwal</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}