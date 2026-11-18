import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import TeacherHeader from '@/components/teacher/TeacherHeader';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

export default async function TeacherLayout({ children }) {
  let teacher = { full_name: 'Chef Pengajar' };

  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('yugyo_user_id')?.value;

    if (userId) {
      const res = await pool.query("SELECT id, full_name, email FROM users WHERE id = $1 AND role = 'teacher';", [userId]);
      if (res.rows.length > 0) {
        teacher = res.rows[0];
      }
    } else {
      const res = await pool.query("SELECT id, full_name, email FROM users WHERE role = 'teacher' LIMIT 1;");
      if (res.rows.length > 0) teacher = res.rows[0];
    }
  } catch (err) {
    console.error('Error fetching teacher session in layout:', err);
  }

  return (
    // Pastikan tinggi layar penuh dan non-scrollable di tingkat paling luar
    <div className="h-screen bg-[#F9DDBB]/20 flex overflow-hidden">
      
      {/* SIDEBAR KIRI (Fixed / Diam di tempat, memiliki scroll sendiri jika menu panjang) */}
      <div className="h-full shrink-0 overflow-y-auto">
        <TeacherSidebar teacher={teacher} />
      </div>

      {/* WRAPPER KONTEN UTAMA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* HEADER ATAS (Sticky / Tetap di atas saat konten digulir) */}
        <div className="shrink-0 z-30">
          <TeacherHeader teacher={teacher} />
        </div>

        {/* KONTEN HALAMAN (Hanya bagian inilah yang bisa di-scroll) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {children}
        </main>

      </div>
    </div>
  );
}