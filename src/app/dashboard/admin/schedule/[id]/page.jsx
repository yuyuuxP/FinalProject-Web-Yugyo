import Link from 'next/link';
import pool from '@/lib/db';

export default async function DetailSchedulePage({ params }) {
  const { id } = await params;

  let session = null;

  try {
    const res = await pool.query(`
      SELECT 
        c.id, 
        c.title, 
        c.description, 
        c.status, 
        c.video_url, 
        c.start_date, 
        c.end_date,
        cat.name AS category_name,
        u.full_name AS instructor_name,
        u.email AS instructor_email
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE c.id = $1;
    `, [id]);

    session = res.rows[0];
  } catch (err) {
    console.error('Error fetching schedule detail:', err);
  }

  if (!session) {
    return (
      <div className="fixed inset-0 z-50 bg-[#341D17]/45 backdrop-blur-xs flex items-center justify-center px-4">
        <div className="bg-[#FFFDF9] rounded-3xl p-8 max-w-md w-full text-center space-y-3 shadow-2xl border border-[#341D17]/20">
          <p className="text-sm font-bold text-[#802924]">Sesi jadwal tidak ditemukan di dalam database.</p>
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

  return (
    <div className="fixed inset-0 z-50 bg-[#341D17]/45 backdrop-blur-xs overflow-y-auto flex items-start justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-2xl bg-[#FFFDF9] rounded-3xl shadow-2xl border border-[#341D17]/20 overflow-hidden my-auto">
        
        {/* HEADER MODAL */}
        <div className="px-6 py-4 bg-[#FFFDF9] border-b border-[#341D17]/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#802924]">
              🥐 ATELIER KALENDER • DETAIL SESI KELAS
            </span>
            <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
              #{session.title}
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

        {/* BODY DETAIL SESI */}
        <div className="p-6 sm:p-8 space-y-6 bg-[#FFFDF9]">
          
          {/* Status & Kategori Badge */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#802924] text-[#F9DDBB] px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
              {session.status === 'active' ? 'Aktif / Siap Dimulai' : session.status}
            </span>
            <span className="bg-[#F9DDBB] text-[#802924] px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
              {session.category_name || 'Master Pastry & Bakery'}
            </span>
            <span className="text-xs text-[#341D17]/60 font-semibold ml-auto">
              ID Sesi: #YGY-{100 + session.id}
            </span>
          </div>

          {/* Info Utama: Chef & Jadwal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F9DDBB]/20 border border-[#341D17]/10 rounded-2xl p-5">
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold tracking-wider uppercase text-[#341D17]/50">CHEF INSTRUKTUR</p>
              <h4 className="font-editorial text-base font-bold text-[#341D17]">
                Chef {session.instructor_name || 'Atelier Master'}
              </h4>
              <p className="text-xs text-[#341D17]/70">{session.instructor_email || 'chef@yugyo.com'}</p>
            </div>

            <div className="space-y-1 sm:border-l sm:border-[#341D17]/10 sm:pl-4">
              <p className="text-[10px] font-extrabold tracking-wider uppercase text-[#341D17]/50">WAKTU & STUDIO</p>
              <h4 className="font-editorial text-base font-bold text-[#341D17]">
                {session.start_date ? new Date(session.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Jadwal Fleksibel'}
              </h4>
              <p className="text-xs text-[#341D17]/70">Streaming Studio A & B • WIT (GMT+9)</p>
            </div>
          </div>

          {/* Deskripsi Materi */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase text-[#341D17]">
              Deskripsi Kurikulum Sesi
            </h4>
            <p className="text-xs sm:text-sm text-[#341D17]/80 leading-relaxed bg-[#FFFDF9] border border-[#341D17]/10 rounded-2xl p-4">
              {session.description || 'Sesi pembelajaran intensif teknik pastry profesional dengan standar kurikulum Yugyo Atelier, menekankan presisi suhu, proporsi adonan, dan estetika akhir.'}
            </p>
          </div>

          {/* Tautan Video Pembelajaran / Studio */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase text-[#341D17]">
              Tautan Studio & Video Pembelajaran
            </h4>
            <div className="flex items-center justify-between bg-[#FFFDF9] border border-[#341D17]/15 rounded-2xl px-4 py-3">
              <span className="text-xs text-[#341D17]/70 font-mono truncate max-w-[320px]">
                {session.video_url || 'https://youtube.com/watch?v=sample'}
              </span>
              <a
                href={session.video_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] text-xs font-bold px-4 py-2 rounded-xl transition shrink-0"
              >
                Buka Studio ↗
              </a>
            </div>
          </div>

          {/* Tombol Aksi Bawah */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <Link
              href="/dashboard/admin/schedule"
              className="px-6 py-3 rounded-2xl bg-[#F9DDBB]/50 hover:bg-[#F9DDBB] text-[#341D17] text-xs font-bold transition shadow-2xs"
            >
              Kembali ke Kalender
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}