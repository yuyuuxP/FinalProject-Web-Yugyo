import Link from 'next/link';
import pool from '@/lib/db';

export default async function ReportsManagementPage() {
  let reports = [];
  let reviews = [];
  let stats = {
    avgRating: '4.9',
    totalReviews: 320,
    openTickets: 3,
    resolutionRate: '96.4%',
    newReviewsCount: 18,
  };

  try {
    // 1. Ambil data laporan/keluhan dari database PostgreSQL
    const reportsRes = await pool.query(`
      SELECT r.*, u.full_name as student_name 
      FROM reports r 
      LEFT JOIN users u ON r.student_id = u.id 
      ORDER BY r.created_at DESC;
    `);
    reports = reportsRes.rows;

    // 2. Ambil data ulasan/rating dari database PostgreSQL
    const reviewsRes = await pool.query(`
      SELECT rev.*, u.full_name as student_name 
      FROM reviews rev 
      LEFT JOIN users u ON rev.student_id = u.id 
      ORDER BY rev.created_at DESC;
    `);
    reviews = reviewsRes.rows;

    // Hitung jumlah keluhan terbuka yang belum selesai
    const openCount = reports.filter(r => r.status !== 'Selesai').length;
    if (reports.length > 0) {
      stats.openTickets = openCount;
    }
  } catch (err) {
    console.error('Error fetching database reports & reviews:', err);
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* HEADER SECTION */}
      <div>
        <span className="text-[10px] font-extrabold tracking-[0.2em] uppercase text-[#802924]">
          🥐 ATELIER QUALITY ASSURANCE
        </span>
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17] mt-1">
          Laporan &amp; Ulasan
        </h1>
        <p className="text-xs sm:text-sm text-[#341D17]/75 mt-1">
          Pantau suara murid atelier, tindak lanjuti kendala resep, dan kurasi ulasan panggang terbaik.
        </p>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Kepuasan Siswa */}
        <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#341D17]/70">Kepuasan Siswa</span>
            <span className="text-amber-600">★</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-editorial text-3xl font-bold text-[#341D17]">{stats.avgRating}</span>
            <span className="text-xs text-[#341D17]/60">/ 5.0</span>
          </div>
          <p className="text-[11px] text-[#341D17]/60 mt-1">★ {stats.totalReviews} ulasan atelier</p>
          <div className="w-full bg-[#F9DDBB]/50 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#802924] h-full w-[98%]" />
          </div>
        </div>

        {/* Keluhan Terbuka */}
        <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#341D17]/70">Keluhan Terbuka</span>
            <span className="bg-[#802924]/15 text-[#802924] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Urgent</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-editorial text-3xl font-bold text-[#802924]">{stats.openTickets}</span>
            <span className="text-xs text-[#802924]/80 font-bold">Tiket</span>
          </div>
          <p className="text-[11px] text-[#341D17]/60 mt-1">Investigasi segera</p>
          <p className="text-[10px] text-[#802924] font-bold mt-2">⏱ Respons &lt; 2 jam</p>
        </div>

        {/* Penyelesaian */}
        <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#341D17]/70">Penyelesaian</span>
            <span className="text-emerald-700">✓</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-editorial text-3xl font-bold text-[#341D17]">{stats.resolutionRate}</span>
          </div>
          <p className="text-[11px] text-[#341D17]/60 mt-1">Masalah tuntas</p>
          <div className="w-full bg-[#F9DDBB]/50 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#82882B] h-full w-[96%]" />
          </div>
        </div>

        {/* Ulasan Baru */}
        <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#341D17]/70">Ulasan Baru</span>
            <span className="text-[#802924]">📈</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-editorial text-3xl font-bold text-[#341D17]">+{stats.newReviewsCount}</span>
          </div>
          <p className="text-[11px] text-[#341D17]/60 mt-1">Pekan ini</p>
          <p className="text-[10px] text-[#82882B] font-bold mt-2">✨ Aktivitas hangat</p>
        </div>

      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-4 flex items-center text-[#341D17]/40">🔍</span>
          <input
            type="text"
            placeholder="Cari ulasan siswa, kendala resep, atau tiket..."
            className="w-full bg-[#F9DDBB]/25 border border-[#341D17]/15 rounded-2xl pl-11 pr-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <button className="bg-[#802924] text-[#F9DDBB] px-4 py-2 rounded-xl shadow-xs transition">
            Semua ({reports.length + reviews.length})
          </button>
          <button className="bg-[#F9DDBB]/40 hover:bg-[#F9DDBB] text-[#341D17] px-4 py-2 rounded-xl transition">
            Ulasan ({reviews.length})
          </button>
          <button className="bg-[#F9DDBB]/40 hover:bg-[#F9DDBB] text-[#341D17] px-4 py-2 rounded-xl transition flex items-center gap-1.5">
            <span>Keluhan</span>
            <span className="w-2 h-2 rounded-full bg-[#802924]" />
          </button>
        </div>
      </div>

      {/* LIST KELUHAN & LAPORAN DARI DATABASE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-lg font-bold text-[#341D17]">Tindakan Mendesak (Keluhan Siswa)</h2>
          <span className="text-xs font-bold text-[#802924]">{stats.openTickets} Menunggu Tanggapan</span>
        </div>

        {reports.length === 0 ? (
          <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-8 text-center text-xs text-[#341D17]/60">
            Belum ada laporan atau keluhan masuk di dalam database.
          </div>
        ) : (
          reports.map((item) => (
            <div key={item.id} className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              
              {/* Top Info User */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#341D17]/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#802924] text-[#F9DDBB] flex items-center justify-center font-bold text-xs shadow-2xs">
                    {(item.student_name || 'Siswa Atelier').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#341D17]">{item.student_name || 'Murid Atelier'}</span>
                      <span className="text-[10px] text-[#341D17]/50 font-mono">#STU-{1000 + item.id}</span>
                    </div>
                    <p className="text-[11px] font-bold text-[#802924]">{item.title}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-[#802924]/15 text-[#802924] px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                    {item.status}
                  </span>
                  <span className="text-[10px] text-[#341D17]/50">Baru saja</span>
                </div>
              </div>

              {/* Message Content */}
              <p className="text-xs sm:text-sm text-[#341D17]/85 italic bg-white border border-[#341D17]/10 rounded-2xl p-4">
                &ldquo;{item.content}&rdquo;
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button className="bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer">
                  <span>💬 Tanggapi Siswa</span>
                </button>
                <button className="bg-[#F9DDBB]/50 hover:bg-[#F9DDBB] text-[#341D17] font-bold text-xs py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer">
                  <span>🛠 Tim Teknis</span>
                </button>
              </div>

            </div>
          ))
        )}

      </div>

      {/* SECTION ULASAN & RATING TERKINI */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-lg font-bold text-[#341D17]">Ulasan &amp; Rating Terkini</h2>
          <Link href="#" className="text-xs font-bold text-[#802924] hover:underline">Lihat Semua</Link>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-6 text-center text-xs text-[#341D17]/60">
            Belum ada ulasan kursus dari siswa.
          </div>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#82882B] text-[#FFFDF9] flex items-center justify-center font-bold text-xs">
                    {(rev.student_name || 'Murid').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#341D17]">{rev.student_name || 'Murid Atelier'}</span>
                    <p className="text-[10px] text-[#341D17]/60">Siswa Terverifikasi Atelier</p>
                  </div>
                </div>
                <div className="text-amber-600 text-xs font-bold">
                  {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                </div>
              </div>

              <p className="text-xs text-[#341D17]/85 italic bg-white border border-[#341D17]/10 rounded-xl p-3">
                &ldquo;{rev.content}&rdquo;
              </p>
            </div>
          ))
        )}
      </div>

    </div>
  );
}