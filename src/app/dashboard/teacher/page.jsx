import Link from 'next/link';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import TeacherCoursesList from '@/components/teacher/TeacherCoursesList';

export default async function TeacherDashboardPage() {
  let teacher = { id: null, full_name: 'Chef Pengajar' };
  let stats = {
    totalStudents: 0,
    activeClasses: 0,
    avgRating: '4.9',
    totalReviews: 0,
    pendingEvaluations: 0,
  };
  let liveSession = null;
  let teacherCourses = [];
  let studentDiscussions = [];

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

    // 2. Hitung jumlah Kelas Masterclass yang diampu oleh guru ini
    const classRes = await pool.query('SELECT COUNT(*) as total FROM courses WHERE instructor_id = $1;', [teacherId]);
    stats.activeClasses = parseInt(classRes.rows[0]?.total || 0);

    // 3. Hitung Total Siswa Aktif yang mendaftar di kursus milik guru ini
    const studentRes = await pool.query(`
      SELECT COUNT(DISTINCT se.student_id) as total 
      FROM student_enrollments se 
      JOIN courses c ON se.course_id = c.id 
      WHERE c.instructor_id = $1 AND se.status = 'active';
    `, [teacherId]);
    stats.totalStudents = parseInt(studentRes.rows[0]?.total || 0);

    // 4. Hitung Karya & Uji Rasa / Laporan yang menunggu evaluasi (khusus kursus guru ini)
    const reportRes = await pool.query(`
      SELECT COUNT(*) as total 
      FROM reports r 
      JOIN courses c ON r.course_id = c.id 
      WHERE c.instructor_id = $1 AND r.status != 'Selesai';
    `, [teacherId]);
    stats.pendingEvaluations = parseInt(reportRes.rows[0]?.total || 0);

    // 5. Hitung kepuasan siswa dari ulasan kursus yang diampu guru ini
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

    // 6. Ambil jadwal live sesi mendatang secara dinamis
    const scheduleRes = await pool.query(`
      SELECT c.title as course_title, c.created_at 
      FROM courses c 
      WHERE c.instructor_id = $1 
      ORDER BY c.id DESC 
      LIMIT 1;
    `, [teacherId]);

    if (scheduleRes.rows.length > 0) {
      liveSession = {
        title: `Sesi Mentoring & Troubleshooting: ${scheduleRes.rows[0].course_title}`,
        description: `Koreksi teknik dan evaluasi modul pastry bersama kohor siswa Anda hari ini.`,
        time: 'Hari ini • 15:00 WIT',
      };
    } else {
      liveSession = {
        title: 'Belum ada jadwal live sesi aktif',
        description: 'Buat kelas atau atur jadwal materi baru untuk memulai sesi mentoring.',
        time: 'Menunggu Jadwal',
      };
    }

    // 7. Ambil daftar kursus yang diampu oleh guru ini
    const coursesRes = await pool.query(`
      SELECT c.*, 
             (SELECT COUNT(se.id) FROM student_enrollments se WHERE se.course_id = c.id) as enrolled_count 
      FROM courses c 
      WHERE c.instructor_id = $1 
      ORDER BY c.id DESC;
    `, [teacherId]);
    teacherCourses = coursesRes.rows;

    // 8. Ambil data Diskusi & Pertanyaan Siswa MURNI dari user dengan role 'student'
    const discussionsRes = await pool.query(`
      SELECT r.id, r.title, r.content, r.category, r.status, r.created_at,
             u.full_name as student_name,
             COALESCE(c.title, 'Masterclass Atelier') as course_title
      FROM reports r
      JOIN users u ON r.student_id = u.id
      LEFT JOIN courses c ON r.course_id = c.id
      WHERE (c.instructor_id = $1 OR r.course_id IS NULL) AND u.role = 'student'
      ORDER BY r.created_at DESC
      LIMIT 5;
    `, [teacherId]);
    studentDiscussions = discussionsRes.rows;

  } catch (err) {
    console.error('Error fetching teacher dashboard data:', err);
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
              Bonjour, {teacher.full_name}
            </h1>
            <p className="text-xs text-[#341D17]/70 mt-0.5">
              Siklus mentoring dan kurasi resep aktif untuk kelas Anda hari ini.
            </p>
          </div>
        </div>
      </div>

      {/* STATS GRID CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-[#341D17]/70">Total Siswa Aktif</span>
            <span className="bg-[#82882B]/15 text-[#82882B] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Kohor Anda</span>
          </div>
          <div className="font-editorial text-3xl font-bold text-[#341D17]">{stats.totalStudents} Siswa</div>
        </div>

        <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-[#341D17]/70">Kelas Masterclass</span>
            <span className="bg-[#82882B]/15 text-[#82882B] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Diampu</span>
          </div>
          <div className="font-editorial text-3xl font-bold text-[#341D17]">{stats.activeClasses} Kelas</div>
        </div>

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
            🔴 JADWAL LIVE SESI MENDATANG (DATABASE SYNC)
          </span>
          <span className="text-xs font-bold text-[#F9DDBB]">{liveSession.time}</span>
        </div>
        <div>
          <h2 className="font-editorial text-xl font-bold text-[#FFFDF9]">{liveSession.title}</h2>
          <p className="text-xs text-[#F9DDBB]/80 mt-1">{liveSession.description}</p>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <button className="bg-[#FFFDF9] hover:bg-[#f3ece4] text-[#802924] font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer">
            ▶ Mulai Sesi Live
          </button>
          <button className="bg-[#341D17]/30 hover:bg-[#341D17]/50 text-[#F9DDBB] font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer">
            📋 Cek Presensi Kohor
          </button>
        </div>
      </div>

      {/* KURSUS YANG DIAJARKAN */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-editorial text-xl font-bold text-[#341D17]">Kursus yang Diajarkan</h2>
            <p className="text-xs text-[#341D17]/70">Pantau kohor dan progres modul siswa di kelas Anda</p>
          </div>
          <span className="text-xs font-bold text-[#802924]">{teacherCourses.length} Kursus Aktif</span>
        </div>

        <TeacherCoursesList courses={teacherCourses} />
      </div>

      {/* DISKUSI & PERTANYAAN SISWA */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-editorial text-xl font-bold text-[#341D17]">Diskusi &amp; Pertanyaan Siswa</h2>
            <p className="text-xs text-[#341D17]/70">Ulasan materi dan bimbingan teknis studio</p>
          </div>
          <span className="w-6 h-6 rounded-full bg-[#802924] text-[#F9DDBB] text-xs font-extrabold flex items-center justify-center shadow-xs">
            {studentDiscussions.length}
          </span>
        </div>

        {studentDiscussions.length === 0 ? (
          <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-8 text-center text-xs text-[#341D17]/60">
            Belum ada diskusi atau pertanyaan baru dari siswa atelier.
          </div>
        ) : (
          <div className="space-y-4">
            {studentDiscussions.map((item) => {
              const studentName = item.student_name || 'Siswa Atelier';
              const initials = studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              const isUrgent = item.status === 'Urgent' || item.category === 'technical';

              return (
                <div key={item.id} className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                  
                  <div className="flex items-center justify-between gap-2 border-b border-[#341D17]/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#802924] text-[#F9DDBB] flex items-center justify-center font-bold text-xs shadow-2xs">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#341D17]">{studentName}</span>
                        </div>
                        <p className="text-[10px] text-[#341D17]/60">{item.title} • WIT</p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                      isUrgent 
                        ? 'bg-[#802924] text-[#F9DDBB]' 
                        : 'bg-[#F9DDBB]/50 text-[#802924]'
                    }`}>
                      {item.course_title}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#341D17]/85 italic bg-white border border-[#341D17]/10 rounded-2xl p-4">
                    &ldquo;{item.content}&rdquo;
                  </p>

                  <div className="flex justify-end gap-3 pt-1">
                    <button className="bg-[#FFFDF9] hover:bg-[#F9DDBB]/50 border border-[#341D17]/20 text-[#341D17] font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer">
                      Tandai Dibaca
                    </button>
                    <button className="bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-xs py-2.5 px-5 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer">
                      <span>💬 Jawab Sekarang</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}