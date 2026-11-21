import { cookies } from 'next/headers';
import pool from '@/lib/db';
import StudentChatsClient from '@/components/student/StudentChatsClient';

export const dynamic = 'force-dynamic';

async function getAuthenticatedStudent() {
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

export default async function StudentChatsPage() {
  const student = await getAuthenticatedStudent();

  let instructors = [];
  let initialMessages = [];

  if (student?.id) {
    const instRes = await pool.query(
      `SELECT
        u.id,
        u.full_name,
        COALESCE(u.specialty, cat.name, 'Master Baker Atelier') AS specialty,
        COALESCE(
          (SELECT c.title FROM courses c WHERE c.instructor_id = u.id ORDER BY c.id ASC LIMIT 1),
          'Atelier Pastry & Baking'
        ) AS course_title
      FROM users u
      LEFT JOIN courses c_ref ON c_ref.instructor_id = u.id
      LEFT JOIN categories cat ON cat.id = c_ref.category_id
      WHERE u.role IN ('instructor', 'teacher', 'admin')
      GROUP BY u.id, u.full_name, u.specialty, cat.name
      ORDER BY u.id ASC;`
    );
    instructors = instRes.rows || [];

    try {
      const msgRes = await pool.query(
        `SELECT
          id,
          sender_id,
          receiver_id,
          message_text,
          attachment_url,
          created_at
        FROM messages
        WHERE sender_id = $1 OR receiver_id = $1
        ORDER BY created_at ASC NULLS LAST, id ASC
        LIMIT 200;`,
        [student.id]
      );
      initialMessages = msgRes.rows || [];
    } catch (err) {
      console.warn('Messages query fallback warning:', err?.message);
      initialMessages = [];
    }
  }

  return (
    <StudentChatsClient
      student={student}
      instructors={instructors}
      initialMessages={initialMessages}
    />
  );
}