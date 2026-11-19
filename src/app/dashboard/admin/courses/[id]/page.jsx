import pool from '@/lib/db';
import { notFound } from 'next/navigation';
import AdminCourseDetailModal from '@/components/AdminCourseDetailModal';

export default async function AdminCourseDetailPage({ params }) {
  const { id } = await params;

  let course = null;

  try {
    const res = await pool.query(
      `SELECT
         c.id,
         c.title,
         c.description,
         c.status,
         c.thumbnail_url,
         c.start_date,
         c.end_date,
         cat.name AS category_name,
         u.full_name AS instructor_name,
         COALESCE(e.student_count, 0)::int AS student_count
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.id
       LEFT JOIN users u ON c.instructor_id = u.id
       LEFT JOIN (
         SELECT course_id, COUNT(*)::int AS student_count
         FROM student_enrollments
         GROUP BY course_id
       ) e ON e.course_id = c.id
       WHERE c.id = $1;`,
      [id]
    );

    if (res.rows.length === 0) {
      notFound();
    }

    course = res.rows[0];
  } catch (err) {
    console.error('Error fetching course detail:', err);
    notFound();
  }

  return <AdminCourseDetailModal course={course} />;
}