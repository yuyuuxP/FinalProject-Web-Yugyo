import pool from '@/lib/db';
import AdminScheduleClient from '@/components/admin/AdminScheduleClient';

export const dynamic = 'force-dynamic';

export default async function AdminSchedulePage() {
  let sessions = [];

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
             s.is_popup,
             s.is_done,
             COALESCE(s.status, CASE WHEN s.is_done THEN 'completed' ELSE 'scheduled' END) AS status,
             c.title AS course_title,
             u.full_name AS instructor_name
      FROM course_sessions s
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN users u ON COALESCE(s.instructor_id, c.instructor_id) = u.id
      ORDER BY s.session_date ASC, s.id DESC;
    `);

    sessions = sessRes.rows;
  } catch (err) {
    console.error('Error loading admin schedule page:', err);
  }

  return <AdminScheduleClient initialSessions={sessions} />;
}