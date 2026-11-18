import Link from 'next/link';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

export default async function TeacherDashboardPage() {
  let teacher = { id: null, full_name: 'Chef Pengajar' };
  let stats = {
    totalStudents: 0,
    activeClasses: 0,
    avgRating: '4.9',
    totalReviews: 0,
    pendingEvaluations: 0,
  };

  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('yugyo_user_id')?.value;

    // 1. Ambil data profil guru yang sedang aktif login
    if (userId) {
      const teacherRes = await pool.query("SELECT id, full_name FROM users WHERE id = $1 AND role = 'teacher';", [userId]);
      if (teacherRes.rows.length > 0) {
        teacher = teacherRes.rows[0];
      }
    } else {
      const teacherRes = await pool.query("SELECT id, full_name FROM users WHERE role = 'teacher' LIMIT 1;");
      if (teacherRes.rows.length > 0) teacher = teacherRes.rows[0];
    }

    const teacherId = teacher.id;

    // 2. Hitung jumlah Kelas Masterclass yang diajar oleh guru ini
    const classRes = await pool.query('SELECT COUNT(*) as total FROM courses WHERE instructor_id = $1;', [teacherId]);
    stats.activeClasses = parseInt(classRes.rows[0]?.total || 0);

    // 3. Hitung Total Siswa Aktif yang mendaftar di kursus-kursus milik guru ini via tabel student_enrollments
    const studentRes = await pool.query(`
      SELECT COUNT(DISTINCT se.student_id) as total 
      FROM student_enrollments se 
      JOIN courses c ON se.course_id = c.id 
      WHERE c.instructor_id = $1 AND se.status = 'active';
    `, [teacherId]);
    stats.totalStudents = parseInt(studentRes.rows[0]?.total || 0);

    // 4. Hitung Karya & Uji Rasa / Laporan yang menunggu evaluasi terkait kursus guru ini
    const reportRes = await pool.query(`
      SELECT COUNT(*) as total 
      FROM reports r 
      JOIN courses c ON r.course_id = c.id 
      WHERE c.instructor_id = $1 AND r.status != 'Selesai';
    `, [teacherId]);
    stats.pendingEvaluations = parseInt(reportRes.rows[0]?.total || 0);

    // 5. Hitung kepuasan siswa dari ulasan kursus guru ini
    const reviewRes = await pool.query(`
      SELECT COUNT(rev.id) as total, AVG(rev.rating) as avg_rating 
      FROM reviews rev 
      JOIN courses c ON rev.course_id = c.id 
      WHERE c.instructor_id = $1;
    `, [teacherId]);
    
    stats.totalReviews = parseInt(reviewRes.rows[0]?.total || 0);
    if (reviewRes.rows[0]?.avg_rating) {
      stats.avgRating = parseFloat(reviewRes.rows[0].avg_rating).toFixed(1);
    }

  } catch (err) {
    console.error('Error fetching teacher specific metrics:', err);
  }

  const getInitials = (name) => {
    if (!name) return 'CH';
    const parts = name.replace('Chef ', '').trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 3).toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* WELCOME BANNER */}
      <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#802924] text-[#F9DDBB] flex items-center justify-center font-editorial font-bold text-lg shrink-0 shadow-sm">
            {getInitials(teacher.full_name)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#82882B]/15 text-[#82882B] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                Master Baker Terverifikasi
              </span>
            </div>
            <h1 className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17]">
              Bonjour, Chef {teacher.full_name}
            </h1>
            <p className="text-xs text-[#341D17]/70 mt-0.5">
              Siklus mentoring dan kurasi resep aktif untuk kelas Anda hari ini.
            </p>
          </div>
        </div>
      </div>

      {/* STATS GRID CARDS (SPESIFIK MILIK GURU YANG LOGIN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Siswa Aktif di Kursus Pengajar */}
        <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-[#341D17]/70">Total Siswa Aktif</span>
            <span className="bg-[#82882B]/15 text-[#82882B] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Kohor Anda</span>
          </div>
          <div className="font-editorial text-3xl font-bold text-[#341D17]">{stats.totalStudents} Siswa</div>
        </div>

        {/* Kelas Masterclass Pengajar */}
        <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-[#341D17]/70">Kelas Masterclass</span>
            <span className="bg-[#82882B]/15 text-[#82882B] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Diampu</span>
          </div>
          <div className="font-editorial text-3xl font-bold text-[#341D17]">{stats.activeClasses} Kelas</div>
        </div>

        {/* Kepuasan Siswa */}
        <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-[#341D17]/70">Kepuasan Siswa</span>
            <span className="text-amber-600 font-bold">★</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-editorial text-3xl font-bold text-[#341D17]">{stats.avgRating}</span>
            <span className="text-xs text-[#341D17]/50">/ 5.0</span>
          </div>
          <p className="text-[10px] text-[#341D17]/60 mt-1">{stats.totalReviews} ulasan kursus</p>
        </div>

        {/* Karya & Uji Rasa */}
        <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-[#341D17]/70">Karya &amp; Uji Rasa</span>
            <span className="bg-[#802924] text-[#F9DDBB] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Urgent</span>
          </div>
          <div className="font-editorial text-3xl font-bold text-[#802924]">{stats.pendingEvaluations} Karya</div>
          <p className="text-[10px] text-[#802924] font-medium mt-1">Menunggu Evaluasi</p>
        </div>

      </div>

      {/* JADWAL LIVE SESI MENDATANG */}
      <div className="bg-[#802924] text-[#F9DDBB] rounded-3xl p-6 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="bg-[#FFFDF9]/20 text-[#FFFDF9] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            🔴 JADWAL LIVE SESI MENDATANG
          </span>
          <span className="text-xs font-bold text-[#F9DDBB]">Hari ini • 15:00 WIB</span>
        </div>
        <div>
          <h2 className="font-editorial text-xl font-bold text-[#FFFDF9]">Croissant Honeycomb Troubleshooting</h2>
          <p className="text-xs text-[#F9DDBB]/80 mt-1">Koreksi teknik laminasi mentega suhu 16°C &amp; proofing akhir untuk rongga sempurna.</p>
        </div>
      </div>

    </div>
  );
}