import pool from '@/lib/db';
import { isTeacherPending } from '@/lib/teacher-status';
import { belongsToCurrentTeacher } from '@/lib/teacher-chat-filter';

export { belongsToCurrentTeacher };

export async function getLoggedInTeacherForChat(cookieStore) {
  const rawId = cookieStore?.get?.('yugyo_user_id')?.value;

  if (rawId && Number.isInteger(Number(rawId)) && Number(rawId) > 0) {
    const res = await pool.query(
      "SELECT id, full_name, email, role, status, specialty FROM users WHERE id = $1 AND role = 'teacher' LIMIT 1;",
      [Number(rawId)]
    );
    if (res.rows.length > 0) {
      return res.rows[0];
    }
  }

  const fallback = await pool.query(
    "SELECT id, full_name, email, role, status, specialty FROM users WHERE role = 'teacher' ORDER BY id ASC LIMIT 1;"
  );
  return fallback.rows[0] || null;
}

export async function fetchScopedThreadsForTeacher(teacher) {
  if (!teacher?.id || isTeacherPending(teacher.status)) {
    return [];
  }

  const teacherId = Number(teacher.id);
  const teacherName = String(teacher.full_name || '').trim();

  const res = await pool.query(
    `SELECT
      t.*,
      u_student.full_name AS student_name,
      u_student.email AS student_email,
      c.title AS course_title,
      COALESCE(u_inst.full_name, u_course.full_name, $2) AS instructor_name,
      COALESCE(t.instructor_id, c.instructor_id) AS resolved_instructor_id,
      (
        SELECT m.message
        FROM chat_messages m
        WHERE m.thread_id = t.id
        ORDER BY m.id ASC
        LIMIT 1
      ) AS first_message
     FROM chat_threads t
     LEFT JOIN users u_student ON u_student.id = t.student_id
     LEFT JOIN courses c ON c.id = t.course_id
     LEFT JOIN users u_inst ON u_inst.id = t.instructor_id
     LEFT JOIN users u_course ON u_course.id = c.instructor_id
     WHERE
       COALESCE(u_inst.status, u_course.status, $3) IS DISTINCT FROM 'pending'
       AND (
         (t.instructor_id IS NOT NULL AND t.instructor_id = $1)
         OR (
           t.instructor_id IS NULL
           AND (
             c.instructor_id = $1
             OR (
               $2 <> ''
               AND LOWER(TRIM(COALESCE(u_course.full_name, ''))) = LOWER(TRIM($2))
             )
           )
         )
       )
     ORDER BY t.updated_at DESC NULLS LAST, t.id DESC;`,
    [teacherId, teacherName, teacher.status || 'active']
  );

  return (res.rows || []).filter((item) => belongsToCurrentTeacher(item, teacher, false));
}