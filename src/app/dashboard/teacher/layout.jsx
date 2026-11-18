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
      // Fallback jika cookie belum ada, ambil guru pertama
      const res = await pool.query("SELECT id, full_name, email FROM users WHERE role = 'teacher' LIMIT 1;");
      if (res.rows.length > 0) teacher = res.rows[0];
    }
  } catch (err) {
    console.error('Error fetching teacher session in layout:', err);
  }

  return (
    <div className="min-h-screen bg-[#F9DDBB]/20 flex flex-col md:flex-row">
      <TeacherSidebar teacher={teacher} />
      <div className="flex-1 flex flex-col min-w-0">
        <TeacherHeader teacher={teacher} />
        <main className="flex-1 p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}