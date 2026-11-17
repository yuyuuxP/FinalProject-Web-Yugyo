import Link from 'next/link';
import pool from '@/lib/db';
import ScheduleCalendar from '@/components/ScheduleCalendar';

export default async function AdminSchedulePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const filterTab = resolvedSearchParams?.tab || 'semua';
  const searchQuery = (resolvedSearchParams?.q || '').toLowerCase();

  let schedules = [];
  let totalSessions = 18;
  let liveMasterclassCount = 4;
  let actionNeededCount = 2;
  let attendanceRate = '98%';

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
        u.full_name AS instructor_name
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      ORDER BY c.id DESC;
    `);

    const allCourses = res.rows.map((item, idx) => ({
      ...item,
      schedule_status: idx === 0 ? 'SEDANG BERLANGSUNG' : idx === 1 ? 'SIAP DIMULAI' : idx === 2 ? 'TERJADWAL' : 'KONFIRMASI STUDIO',
      time_info: idx === 0 ? '01:15:30 tersisa' : idx === 1 ? 'Hari ini, 14:00 - 16:30 WIT' : 'Besok, 10:00 - 12:30 WIT',
      room: idx === 2 ? 'Atelier Kitchen Lab 2' : 'Streaming Studio A & B',
      students_count: Math.floor(Math.random() * 15) + 15,
    }));

    totalSessions = allCourses.length;
    schedules = allCourses.filter(item => {
      if (filterTab === 'live' && item.status !== 'active') return false;
      if (filterTab === 'lab' && item.status !== 'pending') return false;
      if (filterTab === 'completed' && item.status !== 'draft') return false;

      if (searchQuery) {
        const matchTitle = item.title?.toLowerCase().includes(searchQuery);
        const matchChef = item.instructor_name?.toLowerCase().includes(searchQuery);
        if (!matchTitle && !matchChef) return false;
      }

      return true;
    });
  } catch (err) {
    console.error('Database Error fetching schedules:', err);
  }

  return (
    <div className="space-y-7">
      
      {/* 1. HEADER & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#802924]">
            <span>📅</span> ATELIER KALENDER
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
            Manajemen Jadwal
          </h1>
        </div>

        <div className="shrink-0">
          <span className="inline-flex items-center gap-1.5 bg-[#F9DDBB] text-[#802924] px-4 py-2 rounded-2xl text-xs font-extrabold shadow-2xs">
            <span>🕒</span> WIT (GMT+9)
          </span>
        </div>
      </div>

      {/* 2. STATISTIK KARTU (4 GRID) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#802924]">
            <p className="text-[10px] font-extrabold tracking-wider uppercase text-[#341D17]/50">SESI PEKAN INI</p>
            <span>📅</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-editorial text-2xl font-bold text-[#341D17]">{totalSessions}</span>
            <span className="text-[11px] text-[#82882B] font-bold">+3 baru</span>
          </div>
          <p className="text-[11px] text-[#341D17]/60">Semua batch terverifikasi</p>
        </div>

        <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#802924]">
            <p className="text-[10px] font-extrabold tracking-wider uppercase text-[#341D17]/50">LIVE MASTERCLASS</p>
            <span>📡</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-editorial text-2xl font-bold text-[#341D17]">{liveMasterclassCount}</span>
            <span className="text-[11px] text-[#341D17]/70">interaktif</span>
          </div>
          <p className="text-[11px] text-[#341D17]/60">Streaming Studio A & B</p>
        </div>

        <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#802924]">
            <p className="text-[10px] font-extrabold tracking-wider uppercase text-[#341D17]/50">BUTUH MODERATOR</p>
            <span>👨‍🍳</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-editorial text-2xl font-bold text-[#802924]">{actionNeededCount}</span>
            <span className="text-[11px] text-[#802924] font-bold">Tindakan</span>
          </div>
          <p className="text-[11px] text-[#341D17]/60">Sesi sore & besok pagi</p>
        </div>

        <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#82882B]">
            <p className="text-[10px] font-extrabold tracking-wider uppercase text-[#341D17]/50">TINGKAT KEHADIRAN</p>
            <span>✓</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-editorial text-2xl font-bold text-[#341D17]">{attendanceRate}</span>
            <span className="text-[11px] text-[#82882B] font-bold">Optimum</span>
          </div>
          <p className="text-[11px] text-[#341D17]/60">Rata-rata 30 hari</p>
        </div>
      </div>

      {/* 3. MINI KALENDER INTERAKTIF TAHUN 2026 */}
      <ScheduleCalendar />

      {/* 4. PENCARIAN & TAB FILTER */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-4 flex items-center text-[#341D17]/45 text-xs">
              🔍
            </span>
            <form method="GET">
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="Cari jadwal kelas, chef, studio..."
                className="w-full bg-[#FFFDF9] border border-[#341D17]/15 rounded-2xl pl-11 pr-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition shadow-2xs"
              />
              {filterTab !== 'semua' && <input type="hidden" name="tab" value={filterTab} />}
            </form>
          </div>

          <Link
            href="/dashboard/admin/schedule/create"
            className="bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-xs sm:text-sm py-3 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>＋</span>
            <span>Buat Jadwal</span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/admin/schedule?tab=semua${searchQuery ? `&q=${searchQuery}` : ''}`}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              filterTab === 'semua'
                ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/40'
            }`}
          >
            Semua Sesi ({totalSessions})
          </Link>
          <Link
            href={`/dashboard/admin/schedule?tab=live${searchQuery ? `&q=${searchQuery}` : ''}`}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              filterTab === 'live'
                ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/40'
            }`}
          >
            Live Masterclass
          </Link>
          <Link
            href={`/dashboard/admin/schedule?tab=lab${searchQuery ? `&q=${searchQuery}` : ''}`}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              filterTab === 'lab'
                ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/40'
            }`}
          >
            Baking Lab Praktik
          </Link>
          <Link
            href={`/dashboard/admin/schedule?tab=completed${searchQuery ? `&q=${searchQuery}` : ''}`}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              filterTab === 'completed'
                ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/40'
            }`}
          >
            Selesai
          </Link>
        </div>
      </div>

      {/* 5. DAFTAR KARTU SESI JADWAL */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-editorial text-base sm:text-lg font-bold text-[#341D17]">
            Daftar Jadwal Kelas Atelier
          </h3>
          <span className="text-xs text-[#341D17]/60 font-semibold">Urut: Waktu Terdekat</span>
        </div>

        <div className="space-y-4">
          {schedules.map((item, idx) => (
            <div key={item.id} className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                      idx === 0 ? 'bg-[#802924] text-[#F9DDBB]' : idx === 1 ? 'bg-[#82882B]/15 text-[#82882B]' : 'bg-[#F9DDBB]/50 text-[#802924]'
                    }`}>
                      {item.schedule_status}
                    </span>
                    <span className="text-[11px] text-[#341D17]/60 font-medium">📍 {item.room}</span>
                  </div>
                  <h4 className="font-editorial text-lg font-bold text-[#341D17]">{item.title}</h4>
                </div>
                <span className="text-xs text-[#802924] font-bold bg-[#802924]/10 px-3 py-1 rounded-xl w-fit">
                  🕒 {item.time_info}
                </span>
              </div>

              <div className="bg-[#F9DDBB]/20 rounded-2xl p-4 space-y-2 border border-[#341D17]/10">
                <div className="flex items-center justify-between text-xs font-semibold text-[#341D17]/80">
                  <span>👨‍🍳 Chef: {item.instructor_name || 'Chef Atelier Master'}</span>
                  <span>👥 {item.students_count} / 30 Siswa Bergabung</span>
                </div>
                <div className="w-full bg-[#341D17]/10 rounded-full h-2 overflow-hidden">
                  <div className="bg-[#802924] h-full rounded-full" style={{ width: `${(item.students_count / 30) * 100}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#341D17]/10">
                <span className="text-[11px] text-[#341D17]/60 font-medium">
                  ID Sesi: #YGY-{100 + item.id} • Sinkronisasi Studio Aktif
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/admin/schedule/${item.id}`}
                    className="px-4 py-2 rounded-xl bg-[#F9DDBB]/50 hover:bg-[#F9DDBB] text-[#341D17] text-xs font-bold transition shadow-2xs"
                  >
                    Detail Sesi
                  </Link>
                  <Link
                    href={`/dashboard/admin/schedule/${item.id}/edit`}
                    className="w-8 h-8 rounded-xl bg-[#802924]/10 hover:bg-[#802924] text-[#802924] hover:text-[#F9DDBB] flex items-center justify-center text-xs transition cursor-pointer shadow-2xs"
                    title="Pengaturan Jadwal"
                  >
                    ⚙️
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {schedules.length === 0 && (
            <div className="text-center py-12 bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl">
              <p className="text-xs text-[#341D17]/60">Belum ada jadwal sesi kelas terdaftar di dalam sistem.</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}