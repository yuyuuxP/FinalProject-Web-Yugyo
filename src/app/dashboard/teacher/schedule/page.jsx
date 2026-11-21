import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { isTeacherPending } from '@/lib/teacher-status';
import TeacherScheduleClient from '@/components/teacher/TeacherScheduleClient';

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

  const fallback = await pool.query(
    "SELECT id, full_name, email, role, status, specialty FROM users WHERE role = 'teacher' ORDER BY id ASC LIMIT 1;"
  );
  return fallback.rows[0] || null;
}

export default async function TeacherSchedulePage() {
  const teacher = await getAuthenticatedTeacher();
  const pendingAccount = teacher ? isTeacherPending(teacher.status) : false;

  let courses = [];
  let sessions = [];
  let participants = [];

  if (teacher && !pendingAccount) {
    const coursesRes = await pool.query(
      `SELECT id, title, status
       FROM courses
       WHERE instructor_id = $1
       ORDER BY id ASC;`,
      [teacher.id]
    );
    courses = coursesRes.rows || [];

    const sessionsRes = await pool.query(
      `SELECT
        cs.id,
        cs.course_id,
        cs.instructor_id,
        cs.title,
        cs.notes,
        TO_CHAR(cs.session_date, 'YYYY-MM-DD') AS session_date,
        cs.session_time,
        cs.location_label,
        cs.is_popup,
        cs.is_done,
        cs.status,
        cs.completed_at,
        cs.created_at,
        c.title AS course_title,
        COALESCE(inst.full_name, u.full_name, $2) AS instructor_name
       FROM course_sessions cs
       LEFT JOIN courses c ON c.id = cs.course_id
       LEFT JOIN users inst ON inst.id = cs.instructor_id
       LEFT JOIN users u ON u.id = c.instructor_id
       WHERE
         cs.instructor_id = $1
         OR c.instructor_id = $1
         OR LOWER(TRIM(COALESCE(inst.full_name, u.full_name, ''))) = LOWER(TRIM($2))
       ORDER BY cs.session_date ASC, cs.id ASC;`,
      [teacher.id, teacher.full_name || '']
    );
    sessions = sessionsRes.rows || [];

    const courseIds = Array.from(
      new Set(
        [
          ...courses.map((c) => Number(c.id)),
          ...sessions.map((s) => Number(s.course_id)),
        ].filter((id) => Number.isInteger(id) && id > 0)
      )
    );

    if (courseIds.length > 0) {
      const participantsRes = await pool.query(
        `SELECT
          se.student_id,
          se.course_id,
          u.full_name,
          u.email,
          c.title AS course_title,
          COALESCE(comp.done_classes_count, 0)::int AS done_classes_count,
          GREATEST(COALESCE(tot.total_classes_count, 1), 1)::int AS total_classes_count,
          COALESCE(comp.completed_dates, ARRAY[]::text[]) AS completed_dates
         FROM student_enrollments se
         INNER JOIN users u ON u.id = se.student_id
         INNER JOIN courses c ON c.id = se.course_id
         LEFT JOIN (
           SELECT
             course_id,
             COUNT(id)::int AS total_classes_count
           FROM course_sessions
           WHERE course_id = ANY($1::int[])
             AND COALESCE(status, 'scheduled') <> 'canceled'
           GROUP BY course_id
         ) tot ON tot.course_id = se.course_id
         LEFT JOIN (
           SELECT
             ssc.student_id,
             cs.course_id,
             COUNT(DISTINCT ssc.session_id)::int AS done_classes_count,
             ARRAY_AGG(DISTINCT TO_CHAR(cs.session_date, 'YYYY-MM-DD'))
               FILTER (WHERE cs.session_date IS NOT NULL) AS completed_dates
           FROM session_student_completions ssc
           INNER JOIN course_sessions cs ON cs.id = ssc.session_id
           WHERE cs.course_id = ANY($1::int[])
           GROUP BY ssc.student_id, cs.course_id
         ) comp ON comp.student_id = se.student_id AND comp.course_id = se.course_id
         WHERE se.course_id = ANY($1::int[])
           AND se.status IS DISTINCT FROM 'dropped'
         ORDER BY u.full_name ASC, c.title ASC;`,
        [courseIds]
      );

      participants = (participantsRes.rows || []).map((row) => {
        const doneCount = Number(row.done_classes_count || 0);
        const totalCount = Math.max(Number(row.total_classes_count || 1), 1);
        return {
          ...row,
          done_classes_count: doneCount,
          total_classes_count: totalCount,
          progress_percent: Math.min(100, Math.round((doneCount / totalCount) * 100)),
        };
      });
    }
  }

  const todayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  return (
    <TeacherScheduleClient
      key={teacher?.id || 'teacher-schedule'}
      teacher={teacher}
      isPendingAccount={pendingAccount}
      courses={courses}
      initialSessions={sessions}
      initialParticipants={participants}
      initialToday={todayKey}
      initialFilterByDate={false}
    />
  );
}