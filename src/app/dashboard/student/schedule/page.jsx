import { cookies } from 'next/headers';
import pool from '@/lib/db';
import StudentScheduleClient from '@/components/student/StudentScheduleClient';

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

export default async function StudentSchedulePage() {
  const student = await getAuthenticatedStudent();

  let sessions = [];

  if (student?.id) {
    try {
      const sessRes = await pool.query(
        `SELECT
          cs.id,
          cs.course_id,
          cs.title,
          cs.notes,
          cs.session_date,
          cs.session_time,
          cs.location_label,
          cs.status,
          c.title AS course_title,
          c.thumbnail_url,
          COALESCE(u_inst.full_name, 'Instruktur Atelier') AS instructor_name,
          COALESCE(ssc.session_id IS NOT NULL OR cs.is_done = TRUE, FALSE) AS is_completed
        FROM course_sessions cs
        INNER JOIN courses c ON c.id = cs.course_id
        LEFT JOIN users u_inst ON u_inst.id = c.instructor_id
        LEFT JOIN session_student_completions ssc
          ON ssc.session_id = cs.id AND ssc.student_id = $1
        WHERE COALESCE(cs.status, 'scheduled') <> 'canceled'
        ORDER BY cs.session_date ASC NULLS LAST, cs.id ASC;`,
        [student.id]
      );
      sessions = sessRes.rows || [];
    } catch (err) {
      console.warn('Schedule query fallback warning:', err?.message);
      const basicRes = await pool.query(
        `SELECT
          cs.id,
          cs.course_id,
          cs.title,
          cs.notes,
          cs.session_date,
          cs.session_time,
          cs.location_label,
          cs.status,
          c.title AS course_title,
          c.thumbnail_url,
          COALESCE(u_inst.full_name, 'Instruktur Atelier') AS instructor_name,
          FALSE AS is_completed
        FROM course_sessions cs
        INNER JOIN courses c ON c.id = cs.course_id
        LEFT JOIN users u_inst ON u_inst.id = c.instructor_id
        WHERE COALESCE(cs.status, 'scheduled') <> 'canceled'
        ORDER BY cs.id ASC;`
      );
      sessions = basicRes.rows || [];
    }
  }

  return <StudentScheduleClient student={student} sessions={sessions} />;
}