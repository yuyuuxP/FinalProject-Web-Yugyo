import { cookies } from 'next/headers';
import pool from '@/lib/db';
import StudentDashboardClient from '@/components/student/StudentDashboardClient';

export const dynamic = 'force-dynamic';

async function getAuthenticatedStudent() {
  const cookieStore = await cookies();

  const rawUserCookie = cookieStore.get('yugyo_user')?.value;
  if (rawUserCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(rawUserCookie));
      const parsedId = Number(parsed?.id ?? parsed?.userId ?? parsed?.user_id);
      if (Number.isInteger(parsedId) && parsedId > 0) {
        const res = await pool.query(
          "SELECT id, full_name, email, role FROM users WHERE id = $1 AND LOWER(COALESCE(role, '')) = 'student' LIMIT 1;",
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
      "SELECT id, full_name, email, role FROM users WHERE id = $1 AND LOWER(COALESCE(role, '')) = 'student' LIMIT 1;",
      [Number(rawId)]
    );
    if (res.rows.length > 0) {
      return res.rows[0];
    }
  }

  return null;
}

export default async function StudentDashboardPage() {
  const student = await getAuthenticatedStudent();

  let allCourses = [];
  let enrolledCourses = [];
  let sessions = [];
  let completedContentKeys = [];
  let totalSessionXp = 0;

  const allCoursesRes = await pool
    .query(
      `SELECT
         c.id,
         c.title,
         c.description,
         c.thumbnail_url,
         c.video_url,
         COALESCE(cat.name, 'Bread & Yeast Goods') AS category,
         COALESCE(u.full_name, 'Chef Yugyo') AS instructor,
         (
           SELECT COUNT(*)::int
           FROM course_contents cc
           WHERE cc.course_id = c.id
         ) AS total_modules
       FROM courses c
       LEFT JOIN categories cat ON cat.id = c.category_id
       LEFT JOIN users u ON u.id = c.instructor_id
       ORDER BY c.id ASC;`
    )
    .catch(() => ({ rows: [] }));

  allCourses = allCoursesRes.rows || [];

  if (student) {
    const enrolledRes = await pool
      .query(
        `SELECT
           c.id,
           c.title,
           c.description,
           c.thumbnail_url,
           c.video_url,
           COALESCE(cat.name, 'Bread & Yeast Goods') AS category,
           COALESCE(u.full_name, 'Chef Yugyo') AS instructor,
           COALESCE(se.progress_percentage, 0)::int AS progress_percentage,
           (
             SELECT COUNT(*)::int
             FROM course_contents cc
             WHERE cc.course_id = c.id
           ) AS total_modules,
           (
             SELECT COUNT(*)::int
             FROM student_content_completions scc
             WHERE scc.student_id = $1 AND scc.course_id = c.id
           ) AS completed_modules
         FROM student_enrollments se
         INNER JOIN courses c ON c.id = se.course_id
         LEFT JOIN categories cat ON cat.id = c.category_id
         LEFT JOIN users u ON u.id = c.instructor_id
         WHERE se.student_id = $1
           AND LOWER(COALESCE(se.status, 'active')) <> 'dropped'
         ORDER BY se.id DESC;`,
        [student.id]
      )
      .catch(() => ({ rows: [] }));

    enrolledCourses = enrolledRes.rows || [];

    const completionsRes = await pool
      .query(
        `SELECT course_id, content_key
         FROM student_content_completions
         WHERE student_id = $1
         ORDER BY id ASC;`,
        [student.id]
      )
      .catch(() => ({ rows: [] }));

    completedContentKeys = (completionsRes.rows || []).map(
      (r) => `${r.course_id}:${r.content_key}`
    );

    const xpRes = await pool
      .query(
        `SELECT COALESCE(SUM(xp_earned), 0)::int AS total_xp
         FROM session_student_completions
         WHERE student_id = $1;`,
        [student.id]
      )
      .catch(() => ({ rows: [{ total_xp: 0 }] }));

    totalSessionXp = Number(xpRes.rows?.[0]?.total_xp ?? 0);

    const sessionsRes = await pool
      .query(
        `WITH ranked_sessions AS (
           SELECT
             cs.id,
             cs.course_id,
             cs.title,
             cs.notes,
             TO_CHAR(cs.session_date, 'YYYY-MM-DD') AS session_date,
             COALESCE(NULLIF(TRIM(cs.session_time), ''), '14:00 WITA') AS session_time,
             COALESCE(NULLIF(TRIM(cs.location_label), ''), 'Atelier Live') AS location_label,
             COALESCE(cs.status, 'scheduled') AS status,
             (
               COALESCE(cs.is_done, FALSE)
               OR LOWER(COALESCE(cs.status, '')) IN ('done', 'completed', 'selesai')
             ) AS is_teacher_done,
             ROW_NUMBER() OVER (
               PARTITION BY cs.course_id
               ORDER BY cs.session_date ASC, cs.session_time ASC, cs.id ASC
             )::int AS session_number
           FROM course_sessions cs
           WHERE LOWER(COALESCE(cs.status, 'scheduled')) <> 'canceled'
         )
         SELECT
           rs.id,
           rs.course_id,
           rs.title,
           rs.notes,
           rs.session_date,
           rs.session_time,
           rs.location_label,
           rs.is_teacher_done,
           rs.session_number,
           c.title AS course_title,
           COALESCE(cat.name, 'Atelier Class') AS category_name,
           COALESCE(u_inst.full_name, 'Instruktur Atelier') AS instructor_name,
           COALESCE(ssc.session_id IS NOT NULL, FALSE) AS is_completed,
           COALESCE(ssc.xp_earned, 0)::int AS xp_earned
         FROM ranked_sessions rs
         INNER JOIN student_enrollments se
           ON se.course_id = rs.course_id
           AND se.student_id = $1
           AND LOWER(COALESCE(se.status, 'active')) <> 'dropped'
         INNER JOIN courses c ON c.id = rs.course_id
         LEFT JOIN categories cat ON cat.id = c.category_id
         LEFT JOIN users u_inst ON u_inst.id = c.instructor_id
         LEFT JOIN session_student_completions ssc
           ON ssc.session_id = rs.id AND ssc.student_id = $1
         ORDER BY rs.session_date ASC, rs.session_time ASC, rs.id ASC;`,
        [student.id]
      )
      .catch(() => ({ rows: [] }));

    sessions = sessionsRes.rows || [];
  }

  return (
    <StudentDashboardClient
      student={student}
      initialAllCourses={allCourses}
      initialEnrolledCourses={enrolledCourses}
      initialSessions={sessions}
      initialCompletedKeys={completedContentKeys}
      initialSessionXp={totalSessionXp}
    />
  );
}