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
      const res = await pool.query(
        "SELECT id, full_name, email, specialty FROM users WHERE id = $1 AND role = 'teacher';",
        [userId]
      );
      if (res.rows.length > 0) {
        teacher = res.rows[0];
      }
    } else {
      const res = await pool.query(
        "SELECT id, full_name, email, specialty FROM users WHERE role = 'teacher' LIMIT 1;"
      );
      if (res.rows.length > 0) teacher = res.rows[0];
    }
  } catch (err) {
    console.error('Error fetching teacher session in layout:', err);
  }

  return (
    <div className="min-h-screen bg-[#F9DDBB] text-[#341D17] flex">
      {/* SIDEBAR KIRI */}
      <aside className="hidden lg:block lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 z-30">
        <TeacherSidebar teacher={teacher} />
      </aside>

      {/* WRAPPER KONTEN UTAMA */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* HEADER ATAS */}
        <TeacherHeader teacher={teacher} />

        {/* KONTEN HALAMAN */}
        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}