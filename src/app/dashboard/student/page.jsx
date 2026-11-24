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
          "SELECT id, full_name, email, role, status, specialty FROM users WHERE id = $1 AND role = 'student' LIMIT 1;",
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
      "SELECT id, full_name, email, role, status, specialty FROM users WHERE id = $1 AND role = 'student' LIMIT 1;",
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

  let enrollments = [];
  let sessions = [];
  let contentsCount = 0;
  let sessionXpTotal = 0;
  let completedModulesTotal = 0;

  if (student) {
    const enrollmentsRes = await pool.query(
      `SELECT
        se.id AS enrollment_id,
        se.progress_percentage,
        se.status AS enrollment_status,
        se.enrolled_at,
        c.id AS course_id,
        c.title,
        c.description,
        c.thumbnail_url,
        c.video_url,
        c.status AS course_status,
        cat.name AS category_name,
        COALESCE(u_inst.full_name, 'Instruktur Atelier') AS instructor_name,
        COALESCE(u_inst.specialty, cat.name, 'Master Baker Atelier') AS instructor_specialty
      FROM student_enrollments se
      INNER JOIN courses c ON c.id = se.course_id
      LEFT JOIN categories cat ON cat.id = c.category_id
      LEFT JOIN users u_inst ON u_inst.id = c.instructor_id
      WHERE se.student_id = $1
        AND LOWER(COALESCE(se.status, 'active')) <> 'dropped'
      ORDER BY se.id DESC;`,
      [student.id]
    );
    enrollments = enrollmentsRes.rows || [];

    const sessionsRes = await pool.query(
      `SELECT
        cs.id,
        cs.course_id,
        cs.title,
        cs.notes,
        ssc.notes AS student_notes,
        cs.session_date,
        cs.session_time,
        cs.location_label,
        cs.status,
        c.title AS course_title,
        COALESCE(u_inst.full_name, 'Instruktur Atelier') AS instructor_name,
        COALESCE(ssc.session_id IS NOT NULL, FALSE) AS is_completed,
        ssc.marked_done_at,
        COALESCE(ssc.xp_earned, 25) AS xp_earned
      FROM course_sessions cs
      INNER JOIN student_enrollments se
        ON se.course_id = cs.course_id
        AND se.student_id = $1
        AND LOWER(COALESCE(se.status, 'active')) <> 'dropped'
      INNER JOIN courses c ON c.id = cs.course_id
      LEFT JOIN users u_inst ON u_inst.id = c.instructor_id
      LEFT JOIN session_student_completions ssc
        ON ssc.session_id = cs.id AND ssc.student_id = $1
      WHERE COALESCE(cs.status, 'scheduled') <> 'canceled'
      ORDER BY cs.session_date ASC, cs.id ASC
      LIMIT 6;`,
      [student.id]
    );
    sessions = sessionsRes.rows || [];

    const contentsRes = await pool
      .query(
        `SELECT COUNT(*)::int AS total_contents
         FROM course_contents cc
         INNER JOIN student_enrollments se
           ON se.course_id = cc.course_id
           AND se.student_id = $1
           AND LOWER(COALESCE(se.status, 'active')) <> 'dropped';`,
        [student.id]
      )
      .catch(() => ({ rows: [{ total_contents: 0 }] }));
    contentsCount = Number(contentsRes.rows[0]?.total_contents ?? 0);

    const sessionXpRes = await pool
      .query(
        `SELECT COALESCE(SUM(xp_earned), 0)::int AS total_xp
         FROM session_student_completions
         WHERE student_id = $1;`,
        [student.id]
      )
      .catch(() => ({ rows: [{ total_xp: 0 }] }));
    sessionXpTotal = Number(sessionXpRes.rows[0]?.total_xp ?? 0);

    const moduleDoneRes = await pool
      .query(
        `SELECT COUNT(*)::int AS completed_modules
         FROM student_content_completions scc
         INNER JOIN student_enrollments se
           ON se.student_id = scc.student_id
           AND se.course_id = scc.course_id
           AND LOWER(COALESCE(se.status, 'active')) <> 'dropped'
         WHERE scc.student_id = $1;`,
        [student.id]
      )
      .catch(() => ({ rows: [{ completed_modules: 0 }] }));
    completedModulesTotal = Number(
      moduleDoneRes.rows[0]?.completed_modules ?? 0
    );
  }

  const activeCoursesCount = enrollments.length;
  const completedSessionsCount = sessions.filter((s) =>
    Boolean(s.is_completed)
  ).length;
  const totalSessionsCount = sessions.length;
  const indexPercent =
    totalSessionsCount > 0
      ? Math.round((completedSessionsCount / totalSessionsCount) * 100)
      : 0;

  const avgProgress =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce(
            (sum, item) => sum + Number(item.progress_percentage || 0),
            0
          ) / enrollments.length
        )
      : 0;

  const xpCurrent = Math.min(
    2000,
    sessionXpTotal + completedModulesTotal * 50
  );
  const xpTarget = 2000;
  const focusHours =
    enrollments.length > 0
      ? Number(
          (
            (avgProgress / 100) * 4.5 +
            completedSessionsCount * 0.25 +
            completedModulesTotal * 0.5
          ).toFixed(1)
        )
      : 0;
  const readyCertificates = enrollments.filter(
    (e) => Number(e.progress_percentage || 0) >= 75
  ).length;

  const stats = {
    activeCourses: activeCoursesCount,
    completedSessions: completedSessionsCount,
    totalSessions: totalSessionsCount,
    indexPercent,
    focusHours,
    readyCertificates,
    xpCurrent,
    xpTarget,
    contentsCount,
  };

  return (
    <StudentDashboardClient
      student={student}
      stats={stats}
      enrollments={enrollments}
      sessions={sessions}
    />
  );
}