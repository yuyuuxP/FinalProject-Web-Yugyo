import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import TeacherHeader from '@/components/teacher/TeacherHeader';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FaLock } from 'react-icons/fa6';

export default async function TeacherLayout({ children }) {
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get('yugyo_user_id')?.value);

  if (!Number.isInteger(userId) || userId <= 0) {
    redirect('/login');
  }

  const result = await pool.query(
    `SELECT id, full_name, email, specialty, status
     FROM users
     WHERE id = $1 AND LOWER(COALESCE(role, '')) = 'teacher'
     LIMIT 1;`,
    [userId]
  );
  const teacher = result.rows[0];

  if (!teacher) {
    redirect('/login');
  }

  const isPending = String(teacher.status || '').trim().toLowerCase() === 'pending';

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
          {isPending && (
            <div
              role="status"
              className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-700/25 bg-[#FFFDF9] px-4 py-3.5 text-sm text-[#341D17] shadow-sm"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                <FaLock aria-hidden="true" />
              </span>
              <div>
                <p className="font-extrabold">Akun menunggu persetujuan admin</p>
                <p className="mt-0.5 text-xs text-[#341D17]/70">
                  Anda dapat melihat menu, tetapi seluruh aksi instruktur terkunci sampai akun disetujui.
                </p>
              </div>
            </div>
          )}
          <div
            inert={isPending}
            aria-disabled={isPending}
            className={isPending ? 'pointer-events-none select-none opacity-50' : ''}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}