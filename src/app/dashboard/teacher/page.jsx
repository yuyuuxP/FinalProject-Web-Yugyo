import { cookies } from 'next/headers';
import pool from '@/lib/db';
import TeacherDashboardClient from '@/components/teacher/TeacherDashboardClient';

export const dynamic = 'force-dynamic';

async function getAuthenticatedTeacher() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('yugyo_user_id')?.value;

  if (userId) {
    const res = await pool.query(
      "SELECT id, full_name, email, role, status, specialty FROM users WHERE id = $1 AND role = 'teacher' LIMIT 1;",
      [userId]
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

export default async function TeacherDashboardPage() {
  const teacher = await getAuthenticatedTeacher();

  let courses = [];
  let discussions = [];
  let upcomingSession = null;
  let stats = {
    totalStudents: 0,
    totalCourses: 0,
    avgRating: '4.9',
    totalReviews: 0,
    pendingWorks: 0,
  };

  if (teacher) {
    const coursesRes = await pool.query(
      `SELECT
        c.id,
        c.title,
        c.description,
        c.status,
        c.thumbnail_url,
        c.video_url,
        cat.name AS category_name,
        COALESCE(se_stats.enrolled_count, 0)::int AS enrolled_students,
        COALESCE(se_stats.avg_progress, 80)::int AS completion_percent
      FROM courses c
      LEFT JOIN categories cat ON cat.id = c.category_id
      LEFT JOIN (
        SELECT
          course_id,
          COUNT(DISTINCT student_id)::int AS enrolled_count,
          COALESCE(ROUND(AVG(progress_percentage))::int, 80) AS avg_progress
        FROM student_enrollments
        WHERE status IS DISTINCT FROM 'dropped'
        GROUP BY course_id
      ) se_stats ON se_stats.course_id = c.id
      WHERE c.instructor_id = $1
      ORDER BY c.id ASC;`,
      [teacher.id]
    );
    courses = coursesRes.rows || [];

    const studentCountRes = await pool.query(
      `SELECT COUNT(DISTINCT se.student_id)::int AS total_students
       FROM student_enrollments se
       INNER JOIN courses c ON c.id = se.course_id
       WHERE c.instructor_id = $1 AND se.status IS DISTINCT FROM 'dropped';`,
      [teacher.id]
    );

    const reviewStatsRes = await pool.query(
      `SELECT
        COUNT(r.id)::int AS total_reviews,
        COALESCE(ROUND(AVG(r.rating)::numeric, 1), 4.9) AS avg_rating
       FROM reviews r
       LEFT JOIN courses c ON c.id = r.course_id
       WHERE c.instructor_id = $1 OR c.instructor_id IS NULL;`
      ,
      [teacher.id]
    );

    const worksRes = await pool.query(
      `SELECT COUNT(r.id)::int AS pending_works
       FROM reports r
       LEFT JOIN courses c ON c.id = r.course_id
       WHERE (c.instructor_id = $1 OR c.instructor_id IS NULL)
         AND LOWER(COALESCE(r.status, '')) <> 'selesai';`,
      [teacher.id]
    );

    const sessionRes = await pool.query(
      `SELECT
        cs.id,
        cs.title,
        cs.notes,
        cs.session_date,
        cs.session_time,
        cs.location_label,
        c.title AS course_title
       FROM course_sessions cs
       INNER JOIN courses c ON c.id = cs.course_id
       WHERE c.instructor_id = $1
         AND COALESCE(cs.status, 'scheduled') = 'scheduled'
         AND COALESCE(cs.is_done, FALSE) = FALSE
       ORDER BY cs.session_date ASC, cs.id ASC
       LIMIT 1;`,
      [teacher.id]
    );
    upcomingSession = sessionRes.rows[0] || null;

    const discussionsRes = await pool.query(
      `SELECT
        ct.id,
        ct.category,
        ct.student_name,
        ct.course_title,
        ct.review_status,
        ct.unread_count,
        ct.last_preview,
        ct.last_time_label,
        COALESCE(
          (
            SELECT cm.body
            FROM chat_messages cm
            WHERE cm.thread_id = ct.id AND cm.sender_role = 'student'
            ORDER BY cm.id DESC
            LIMIT 1
          ),
          ct.last_preview,
          'Pertanyaan teknis baking dari siswa'
        ) AS question_text
      FROM chat_threads ct
      ORDER BY ct.updated_at DESC, ct.id DESC;`
    );
    discussions = discussionsRes.rows || [];

    stats = {
      totalStudents: Number(studentCountRes.rows[0]?.total_students ?? 0),
      totalCourses: courses.length,
      avgRating: String(reviewStatsRes.rows[0]?.avg_rating ?? '4.9'),
      totalReviews: Number(reviewStatsRes.rows[0]?.total_reviews ?? 0),
      pendingWorks: Number(worksRes.rows[0]?.pending_works ?? 0),
    };
  }

  return (
    <TeacherDashboardClient
      teacher={teacher}
      stats={stats}
      upcomingSession={upcomingSession}
      courses={courses}
      discussions={discussions}
    />
  );
}