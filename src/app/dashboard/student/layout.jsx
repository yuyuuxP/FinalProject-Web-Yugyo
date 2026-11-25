import { cookies } from 'next/headers';
import pool from '@/lib/db';
import StudentPortalShell from '@/components/student/StudentPortalShell';

export const dynamic = 'force-dynamic';

async function getStudentProfile() {
  const cookieStore = await cookies();
  const rawId = cookieStore.get('yugyo_user_id')?.value;

  if (rawId && Number.isInteger(Number(rawId)) && Number(rawId) > 0) {
    const res = await pool.query(
      "SELECT id, full_name, email, role, status, specialty FROM users WHERE id = $1 AND role = 'student' LIMIT 1;",
      [Number(rawId)]
    );
    if (res.rows.length > 0) return res.rows[0];
  }

  const fallback = await pool.query(
    "SELECT id, full_name, email, role, status, specialty FROM users WHERE role = 'student' ORDER BY id ASC LIMIT 1;"
  );
  return fallback.rows[0] || null;
}

export default async function StudentLayout({ children }) {
  const student = await getStudentProfile();

  let unreadChatCount = 0;
  if (student?.id) {
    const chatRes = await pool.query(
      `SELECT COALESCE(SUM(unread_count), 0)::int AS total_unread
       FROM chat_threads
       WHERE student_id = $1;`,
      [student.id]
    );
    unreadChatCount = Number(chatRes.rows[0]?.total_unread ?? 0);
  }

  return (
    <StudentPortalShell
      student={student}
      studentName={student?.full_name || 'Student'}
      unreadChatCount={unreadChatCount}
    >
      {children}
    </StudentPortalShell>
  );
}