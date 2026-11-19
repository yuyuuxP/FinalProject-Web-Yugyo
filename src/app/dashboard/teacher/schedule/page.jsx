import { cookies } from 'next/headers';
import pool from '@/lib/db';
import TeacherScheduleClient from '@/components/teacher/TeacherScheduleClient';

export const dynamic = 'force-dynamic';

export default async function TeacherSchedulePage() {
  const cookieStore = await cookies();
  const cookieUserId = cookieStore.get('yugyo_user_id')?.value;

  let teacher = { id: null, full_name: 'Ayu', specialty: 'French Patisserie & Pastry' };
  let courses = [];
  let sessions = [];
  let participants = [];

  try {
    if (cookieUserId && Number.isInteger(Number(cookieUserId))) {
      const tRes = await pool.query(
        "SELECT id, full_name, specialty FROM users WHERE id = $1 AND role = 'teacher' LIMIT 1;",
        [Number(cookieUserId)]
      );
      if (tRes.rows.length > 0) teacher = tRes.rows[0];
    }

    if (!teacher.id) {
      const tFallback = await pool.query(
        "SELECT id, full_name, specialty FROM users WHERE role = 'teacher' ORDER BY id ASC LIMIT 1;"
      );
      if (tFallback.rows.length > 0) teacher = tFallback.rows[0];
    }

    const coursesRes = await pool.query(
      `SELECT c.id, c.title, c.description, c.status, c.start_date, c.end_date,
              cat.name AS category_name
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.id
       ORDER BY c.id DESC;`
    );

    courses = coursesRes.rows;

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
               COALESCE(u.full_name, inst.full_name) AS instructor_name
        FROM course_sessions s
        LEFT JOIN courses c ON s.course_id = c.id
        LEFT JOIN users u ON s.instructor_id = u.id
        LEFT JOIN users inst ON c.instructor_id = inst.id
        ORDER BY s.session_date DESC, s.id DESC;
      `);

      sessions = sessRes.rows;
    } catch {
      sessions = courses.map((c, idx) => ({
        id: c.id,
        course_id: c.id,
        title: c.title,
        notes: c.description || 'Sesi mentoring & praktik kelas.',
        session_date: c.start_date
          ? String(c.start_date).slice(0, 10)
          : new Date(Date.now() + idx * 86400000).toISOString().slice(0, 10),
        session_time: '14:00 WITA',
        location_label: c.category_name || 'Atelier Studio',
        is_popup: false,
        is_done: false,
        status: 'scheduled',
        course_title: c.title,
        instructor_name: teacher.full_name || 'Ayu',
      }));
    }

    try {
      const studRes = await pool.query(`
        SELECT u.id AS student_id,
               u.full_name,
               u.email,
               c.id AS course_id,
               c.title AS course_title,
               COALESCE((
                 SELECT COUNT(*)
                 FROM session_student_completions ssc
                 JOIN course_sessions cs ON ssc.session_id = cs.id
                 WHERE ssc.student_id = u.id AND cs.course_id = c.id
               ), 0)::int AS done_classes_count,
               GREATEST((
                 SELECT COUNT(*)
                 FROM course_sessions cs2
                 WHERE cs2.course_id = c.id
               ), 1)::int AS total_classes_count
        FROM student_enrollments e
        JOIN users u ON e.student_id = u.id
        JOIN courses c ON e.course_id = c.id
        ORDER BY u.full_name ASC;
      `);

      participants = studRes.rows.map((p) => {
        const doneCount = Number(p.done_classes_count || 0);
        const totalCount = Math.max(Number(p.total_classes_count || 1), 1);
        const progressPercent = Math.min(100, Math.round((doneCount / totalCount) * 100));
        return {
          ...p,
          done_classes_count: doneCount,
          total_classes_count: totalCount,
          progress_percent: progressPercent,
        };
      });
    } catch {
      participants = [];
    }
  } catch (err) {
    console.error('Error loading teacher schedule page:', err);
  }

  return (
    <TeacherScheduleClient
      teacher={teacher}
      courses={courses}
      initialSessions={sessions}
      initialParticipants={participants}
    />
  );
}