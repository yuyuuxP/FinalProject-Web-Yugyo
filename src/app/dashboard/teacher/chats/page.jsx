import { cookies } from 'next/headers';
import pool from '@/lib/db';
import AtelierChatSupportClient from '@/components/chat/AtelierChatSupportClient';

export const dynamic = 'force-dynamic';

async function getAuthenticatedTeacher() {
  const cookieStore = await cookies();
  const rawId = cookieStore.get('yugyo_user_id')?.value;

  if (rawId && Number.isInteger(Number(rawId)) && Number(rawId) > 0) {
    const res = await pool.query(
      "SELECT id, full_name, email, role, status, specialty FROM users WHERE id = $1 AND role = 'teacher' LIMIT 1;",
      [Number(rawId)]
    );
    if (res.rows.length > 0) {
      return res.rows[0];
    }
  }

  return null;
}

export function isThreadAddressedToTeacher(thread, teacher) {
  if (!teacher?.id) return false;
  if (String(teacher.status || '').trim().toLowerCase() === 'pending') return false;

  const teacherId = Number(teacher.id);
  const teacherName = String(teacher.full_name || '').trim().toLowerCase();
  const firstName = teacherName.split(/\s+/).filter(Boolean)[0] || '';

  const rawInstructorId = thread?.instructor_id ?? null;
  const hasInstructorId =
    rawInstructorId != null &&
    String(rawInstructorId).trim() !== '' &&
    Number.isFinite(Number(rawInstructorId)) &&
    Number(rawInstructorId) > 0;

  if (hasInstructorId) {
    return Number(rawInstructorId) === teacherId;
  }

  const text = `${thread?.last_preview || ''} ${thread?.course_title || ''} ${
    thread?.first_message || ''
  }`.toLowerCase();

  const matches = [
    ...text.matchAll(/\b(?:chef|guru|kak|ustadz(?:ah)?)\s+([a-z]+)/gi),
  ];

  if (matches.length > 0 && teacherName) {
    return matches.some((m) => {
      const mentioned = String(m[1] || '').trim().toLowerCase();
      return (
        mentioned === firstName ||
        (mentioned.length >= 2 && teacherName.includes(mentioned)) ||
        (firstName.length >= 2 && mentioned.includes(firstName))
      );
    });
  }

  return false;
}

export default async function TeacherChatsPage() {
  const teacher = await getAuthenticatedTeacher();
  const pendingAccount = teacher
    ? String(teacher.status || '').trim().toLowerCase() === 'pending'
    : false;

  let threads = [];

  if (teacher && !pendingAccount) {
    const res = await pool.query(
      `SELECT
        t.*,
        COALESCE(u_student.full_name, t.student_name, 'Siswa') AS student_name,
        u_student.email AS student_email,
        COALESCE(u_inst.full_name, $2) AS instructor_name,
        COALESCE(t.last_preview, '') AS last_message,
        (
          SELECT COALESCE(m.message, m.body, '')
          FROM chat_messages m
          WHERE m.thread_id = t.id
          ORDER BY m.id ASC
          LIMIT 1
        ) AS first_message
       FROM chat_threads t
       LEFT JOIN users u_student ON u_student.id = t.student_id
       LEFT JOIN users u_inst ON u_inst.id = t.instructor_id
       WHERE COALESCE(u_inst.status, $1::text) IS DISTINCT FROM 'pending'
       ORDER BY t.updated_at DESC, t.id DESC;`,
      [String(teacher.status || 'active'), String(teacher.full_name || '')]
    );

    threads = (res.rows || []).filter((row) =>
      isThreadAddressedToTeacher(row, teacher)
    );
  }

  return (
    <AtelierChatSupportClient
      key={`${teacher?.id || 'teacher-chat'}-${pendingAccount ? 'pending' : 'active'}`}
      currentUser={teacher}
      role="teacher"
      isPendingAccount={pendingAccount}
      initialThreads={threads}
    />
  );
}