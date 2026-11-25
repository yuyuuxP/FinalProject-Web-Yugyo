import { cookies } from 'next/headers';
import pool from '@/lib/db';
import TeacherScheduleClient from '@/components/teacher/TeacherScheduleClient';

export const dynamic = 'force-dynamic';

async function getAuthenticatedTeacher() {
  const cookieStore = await cookies();

  const rawUserCookie = cookieStore.get('yugyo_user')?.value;
  if (rawUserCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(rawUserCookie));
      const parsedId = Number(parsed?.id ?? parsed?.userId ?? parsed?.user_id);
      if (Number.isInteger(parsedId) && parsedId > 0) {
        const res = await pool.query(
          `SELECT id, full_name, email, role, specialty
           FROM users
           WHERE id = $1
             AND LOWER(COALESCE(role, '')) IN ('teacher', 'instructor')
           LIMIT 1;`,
          [parsedId]
        );
        if (res.rows.length > 0) {
          return res.rows[0];
        }
      }
    } catch {
      // Lanjut cek cookie fallback
    }
  }

  const rawId = cookieStore.get('yugyo_user_id')?.value;
  if (rawId && Number.isInteger(Number(rawId)) && Number(rawId) > 0) {
    const res = await pool.query(
      `SELECT id, full_name, email, role, specialty
       FROM users
       WHERE id = $1
         AND LOWER(COALESCE(role, '')) IN ('teacher', 'instructor')
       LIMIT 1;`,
      [Number(rawId)]
    );
    if (res.rows.length > 0) {
      return res.rows[0];
    }
  }

  return null;
}

export default async function TeacherSchedulePage() {
  const teacher = await getAuthenticatedTeacher();

  let courses = [];
  let sessions = [];
  let participants = [];

  if (teacher) {
    const coursesRes = await pool.query(
      `SELECT
         c.id,
         c.title,
         COALESCE(cat.name, '') AS category_name
       FROM courses c
       LEFT JOIN categories cat ON cat.id = c.category_id
       WHERE c.instructor_id = $1
         AND (
           NULLIF(TRIM(COALESCE($2, '')), '') IS NULL
           OR LOWER(TRIM(COALESCE(cat.name, ''))) = LOWER(TRIM($2))
         )
       ORDER BY c.id ASC;`,
      [teacher.id, teacher.specialty || '']
    );
    courses = coursesRes.rows || [];

    const sessionsRes = await pool.query(
      `SELECT
         cs.id,
         cs.course_id,
         cs.title,
         cs.notes,
         TO_CHAR(cs.session_date, 'YYYY-MM-DD') AS session_date,
         cs.session_time,
         cs.location_label,
         COALESCE(cs.is_popup, FALSE) AS is_popup,
         cs.status,
         COALESCE(cs.is_done, FALSE) AS is_done,
         c.title AS course_title,
         COALESCE(cat.name, '') AS category_name
       FROM course_sessions cs
       INNER JOIN courses c ON c.id = cs.course_id
       LEFT JOIN categories cat ON cat.id = c.category_id
       WHERE c.instructor_id = $1
         AND (
           NULLIF(TRIM(COALESCE($2, '')), '') IS NULL
           OR LOWER(TRIM(COALESCE(cat.name, ''))) = LOWER(TRIM($2))
         )
         AND LOWER(COALESCE(cs.status, 'scheduled')) <> 'canceled'
       ORDER BY cs.session_date ASC, cs.session_time ASC, cs.id ASC;`,
      [teacher.id, teacher.specialty || '']
    );
    sessions = sessionsRes.rows || [];

    const participantsRes = await pool.query(
      `SELECT
         u.id AS student_id,
         u.full_name AS student_name,
         u.email AS student_email,
         COALESCE(SUM(course_stats.total_sessions), 0)::int AS total_sessions,
         COALESCE(SUM(course_stats.done_sessions), 0)::int AS completed_sessions
       FROM student_enrollments se
       INNER JOIN users u
         ON u.id = se.student_id
         AND LOWER(COALESCE(u.role, '')) = 'student'
       INNER JOIN courses c
         ON c.id = se.course_id
         AND c.instructor_id = $1
       LEFT JOIN categories cat ON cat.id = c.category_id
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*)::int AS total_sessions,
           COUNT(*) FILTER (
             WHERE COALESCE(cs.is_done, FALSE)
                OR LOWER(COALESCE(cs.status, '')) IN ('done', 'completed', 'selesai')
                OR EXISTS (
                  SELECT 1 FROM session_student_completions ssc
                  WHERE ssc.session_id = cs.id AND ssc.student_id = u.id
                )
           )::int AS done_sessions
         FROM course_sessions cs
         WHERE cs.course_id = c.id
           AND LOWER(COALESCE(cs.status, 'scheduled')) <> 'canceled'
       ) course_stats ON TRUE
       WHERE LOWER(COALESCE(se.status, 'active')) <> 'dropped'
         AND (
           NULLIF(TRIM(COALESCE($2, '')), '') IS NULL
           OR LOWER(TRIM(COALESCE(cat.name, ''))) = LOWER(TRIM($2))
         )
       GROUP BY u.id, u.full_name, u.email
       ORDER BY u.full_name ASC;`,
      [teacher.id, teacher.specialty || '']
    );
    participants = participantsRes.rows || [];
  }

  return (
    <TeacherScheduleClient
      teacher={teacher}
      initialCourses={courses}
      initialSessions={sessions}
      initialParticipants={participants}
    />
  );
}