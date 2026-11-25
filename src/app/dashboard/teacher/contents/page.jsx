import { cookies } from 'next/headers';
import pool from '@/lib/db';
import ContentManagementClient from '@/components/teacher/ContentManagementClient';
import { findMatchedVideosForCourse } from '@/lib/mediaMatcher';

export const dynamic = 'force-dynamic';

async function getAuthenticatedTeacher() {
  const cookieStore = await cookies();
  const rawId = cookieStore.get('yugyo_user_id')?.value;

  if (rawId && Number.isInteger(Number(rawId)) && Number(rawId) > 0) {
    const res = await pool.query(
      "SELECT id, full_name, email, role, status, specialty FROM users WHERE id = $1 AND role IN ('instructor', 'teacher') LIMIT 1;",
      [Number(rawId)]
    );
    if (res.rows.length > 0) return res.rows[0];
  }

  return null;
}

export default async function TeacherContentsPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const requestedCourseId = Number(resolvedParams?.courseId);

  const teacher = await getAuthenticatedTeacher();

  let courses = [];
  let selectedCourse = null;
  let courseContents = [];
  let matchedVideos = [];

  if (teacher?.id) {
    const coursesRes = await pool.query(
      `SELECT
        c.id,
        c.title,
        c.description,
        c.thumbnail_url,
        c.status,
        COALESCE(cat.name, 'Atelier Baking') AS category_name
      FROM courses c
      LEFT JOIN categories cat ON cat.id = c.category_id
      WHERE c.instructor_id = $1
      ORDER BY c.id ASC;`,
      [teacher.id]
    );

    courses = coursesRes.rows || [];

    if (courses.length > 0) {
      selectedCourse =
        courses.find((c) => Number(c.id) === requestedCourseId) || courses[0];

      const contentsRes = await pool.query(
        `SELECT *
         FROM course_contents
         WHERE course_id = $1
         ORDER BY order_index ASC NULLS LAST, id ASC;`,
        [selectedCourse.id]
      );

      courseContents = (contentsRes.rows || []).map((row, idx) => ({
        ...row,
        description: row.description ?? row.summary ?? '',
        summary: row.description ?? row.summary ?? '',
        video_url: row.video_url ?? row.media_url ?? null,
        media_url: row.video_url ?? row.media_url ?? null,
        order_index: row.order_index ?? row.sort_order ?? idx + 1,
        sort_order: row.order_index ?? row.sort_order ?? idx + 1,
        status: row.status ?? 'published',
      }));

      matchedVideos = await findMatchedVideosForCourse(selectedCourse.title);
    }
  }

  return (
    <ContentManagementClient
      teacher={teacher}
      courses={courses}
      selectedCourse={selectedCourse}
      initialContents={courseContents}
      matchedVideos={matchedVideos}
    />
  );
}