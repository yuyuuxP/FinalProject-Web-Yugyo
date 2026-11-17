import Link from 'next/link';
import pool from '@/lib/db';

export default async function CreateSchedulePage() {
  let categories = [];
  let teachers = [];

  try {
    const catRes = await pool.query('SELECT id, name FROM categories ORDER BY name ASC;');
    categories = catRes.rows;

    const teacherRes = await pool.query("SELECT id, full_name FROM users WHERE role = 'teacher' ORDER BY full_name ASC;");
    teachers = teacherRes.rows;
  } catch (err) {
    console.error('Error fetching data for schedule create:', err);
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#341D17]/45 backdrop-blur-xs overflow-y-auto flex items-start justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-xl bg-[#FFFDF9] rounded-3xl shadow-2xl border border-[#341D17]/20 overflow-hidden my-auto">
        
        {/* HEADER MODAL */}
        <div className="px-6 py-4 bg-[#FFFDF9] border-b border-[#341D17]/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#802924]">
              🥐 ATELIER KALENDER • BUAT JADWAL SESI
            </span>
            <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
              Jadwalkan Sesi Masterclass & Lab Baru
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

        {/* BODY FORM (Menggunakan enctype multipart/form-data untuk upload file) */}
        <form 
          action="/api/admin/schedule" 
          method="POST" 
          encType="multipart/form-data"
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
              required
              placeholder="Contoh: Mastering French Viennoiserie & Lamination"
              className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
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
                required
                defaultValue=""
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
                required
                defaultValue=""
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
                defaultValue="2026-11-18"
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
                defaultValue="active"
                className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
              >
                <option value="active">Aktif / Siap Dimulai (Active)</option>
                <option value="pending">Konfirmasi Studio (Pending)</option>
                <option value="draft">Draft Sesi (Draft)</option>
              </select>
            </div>
          </div>

          {/* PILIHAN VIDEO: Tautan YouTube ATAU Upload File Langsung */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase text-[#341D17]">
                Tautan YouTube (Opsional)
              </label>
              <input
                type="text"
                name="video_url"
                placeholder="https://youtube.com/watch?v=..."
                className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase text-[#341D17]">
                Atau Upload File Video (MP4)
              </label>
              <input
                type="file"
                name="video_file"
                accept="video/*"
                className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-3 py-2 text-xs text-[#341D17] file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#802924] file:text-[#F9DDBB] hover:file:bg-[#661F1B] transition shadow-2xs cursor-pointer"
              />
            </div>
          </div>
          <p className="text-[11px] text-[#341D17]/60 pl-1">
            <span className='text-red-600 text-[13px]'>*</span>Pilih salah satu: masukkan tautan YouTube atau unggah file video langsung.
          </p>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase text-[#341D17]">
              Deskripsi Singkat Sesi
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Jelaskan ringkasan materi, kebutuhan alat, atau tautan studio..."
              className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-sm py-3.5 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>＋</span>
              <span>Simpan & Publikasikan Jadwal</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}