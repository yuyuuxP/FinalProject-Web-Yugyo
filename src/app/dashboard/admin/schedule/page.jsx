import pool from '@/lib/db';
import AdminScheduleClient from '@/components/admin/AdminScheduleClient';

export const dynamic = 'force-dynamic';

export default async function AdminSchedulePage() {
  const admin = {
    id: null,
    full_name: 'Admin Yugyo',
    role_label: 'Head Atelier Director',
  };

  let courses = [];
  let instructors = [];
  let sessions = [];

  try {
    const coursesRes = await pool.query(
      'SELECT id, title FROM courses ORDER BY title ASC;'
    );
    courses = coursesRes.rows;
  } catch (err) {
    console.error('Error loading courses for admin schedule:', err);
  }

  try {
    const instRes = await pool.query(
      "SELECT id, full_name FROM users WHERE role = 'teacher' ORDER BY full_name ASC;"
    );
    instructors = instRes.rows;
  } catch (err) {
    console.error('Error loading instructors for admin schedule:', err);
  }

  try {
    const sessRes = await pool.query(`
      SELECT s.id,
             s.course_id,
             s.instructor_id,
             s.title,
             s.notes,
             TO_CHAR(s.session_date, 'YYYY-MM-DD') AS session_date,
             s.session_time,
             s.location_label,
             COALESCE(s.is_popup, FALSE) AS is_popup,
             CASE
               WHEN LOWER(COALESCE(s.status, '')) = 'canceled' THEN FALSE
               WHEN LOWER(COALESCE(s.status, '')) = 'completed' OR COALESCE(s.is_done, FALSE) = TRUE THEN TRUE
               ELSE FALSE
             END AS is_done,
             CASE
               WHEN LOWER(COALESCE(s.status, '')) = 'canceled' THEN 'canceled'
               WHEN LOWER(COALESCE(s.status, '')) = 'completed' OR COALESCE(s.is_done, FALSE) = TRUE THEN 'completed'
               ELSE 'scheduled'
             END AS status,
             c.title AS course_title,
             COALESCE(u.full_name, inst.full_name, 'Instruktur Atelier') AS instructor_name
      FROM course_sessions s
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN users u ON s.instructor_id = u.id
      LEFT JOIN users inst ON c.instructor_id = inst.id
      ORDER BY s.session_date DESC, s.id DESC;
    `);
    sessions = sessRes.rows;
  } catch (err) {
    console.error('Error loading course_sessions for admin schedule:', err);
  }

  const sessionsKey = sessions
    .map(
      (s) =>
        `${s.id}:${s.status}:${s.is_done ? 1 : 0}:${s.is_popup ? 1 : 0}:${s.session_date}:${s.title}`
    )
    .join('|');

  return (
    <AdminScheduleClient
      key={sessionsKey || 'empty-sessions'}
      admin={admin}
      courses={courses}
      instructors={instructors}
      initialSessions={sessions}
    />
  );
}