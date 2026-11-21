import { cookies } from 'next/headers';
import pool from '@/lib/db';
import StudentCoursesClient from '@/components/student/StudentCoursesClient';

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

export default async function StudentCoursesPage() {
  const student = await getAuthenticatedStudent();

  let courses = [];
  let contents = [];

  if (student?.id) {
    const coursesRes = await pool.query(
      `SELECT
        c.id,
        c.title,
        c.description,
        c.thumbnail_url,
        c.video_url,
        c.status,
        cat.name AS category_name,
        COALESCE(u_inst.full_name, 'Instruktur Atelier') AS instructor_name,
        COALESCE(u_inst.specialty, cat.name, 'Master Baker Atelier') AS instructor_specialty,
        COALESCE(se.progress_percentage, 75) AS progress_percentage,
        COALESCE(se.status, 'active') AS enrollment_status
      FROM courses c
      LEFT JOIN categories cat ON cat.id = c.category_id
      LEFT JOIN users u_inst ON u_inst.id = c.instructor_id
      LEFT JOIN student_enrollments se
        ON se.course_id = c.id AND se.student_id = $1 AND se.status IS DISTINCT FROM 'dropped'
      WHERE c.status = 'active'
      ORDER BY (se.id IS NOT NULL) DESC, c.id ASC;`,
      [student.id]
    );
    courses = coursesRes.rows || [];

    const contentsRes = await pool.query(
      `SELECT
        cc.id,
        cc.course_id,
        cc.title,
        COALESCE(cc.content_type, 'video') AS content_type,
        COALESCE(cc.duration_label, '20 Menit') AS duration_label,
        cc.media_url,
        cc.summary,
        COALESCE(cc.sort_order, cc.id) AS sort_order,
        c.title AS course_title
      FROM course_contents cc
      INNER JOIN courses c ON c.id = cc.course_id
      WHERE c.status = 'active'
      ORDER BY COALESCE(cc.sort_order, cc.id) ASC, cc.id ASC;`
    );
    contents = contentsRes.rows || [];
  }

  return (
    <StudentCoursesClient
      student={student}
      courses={courses}
      contents={contents}
    />
  );
}