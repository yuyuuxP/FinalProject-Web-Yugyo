import pool from '@/lib/db';
import AdminCourseDetailModal from '@/components/admin/AdminCourseDetailModal';
import { findMatchedVideosForCourse } from '@/lib/mediaMatcher';

export const dynamic = 'force-dynamic';

export default async function AdminCourseDetailPage({ params }) {
  const { id } = await params;
  const courseId = Number(id);

  let course = null;
  let contents = [];

  if (Number.isInteger(courseId) && courseId > 0) {
    const courseRes = await pool.query(
      `SELECT
        c.id,
        c.title,
        c.description,
        c.thumbnail_url,
        c.status,
        c.instructor_id,
        COALESCE(cat.name, 'Atelier Baking') AS category_name,
        u.full_name AS instructor_name,
        u.specialty AS instructor_specialty
      FROM courses c
      LEFT JOIN categories cat ON cat.id = c.category_id
      LEFT JOIN users u ON u.id = c.instructor_id
      WHERE c.id = $1
      LIMIT 1;`,
      [courseId]
    );

    course = courseRes.rows[0] || null;

    const contentsRes = await pool.query(
      `SELECT
        id,
        course_id,
        title,
        description,
        video_url,
        order_index,
        status
      FROM course_contents
      WHERE course_id = $1
      ORDER BY order_index ASC NULLS LAST, id ASC;`,
      [courseId]
    );

    const dbRows = (contentsRes.rows || []).map((row, idx) => ({
      ...row,
      description: row.description ?? '',
      video_url: row.video_url ?? null,
      order_index: row.order_index ?? idx + 1,
      status: row.status ?? 'published',
    }));

    const matchedVideos = course?.title
      ? await findMatchedVideosForCourse(course.title)
      : [];

    const seenSig = new Set(
      dbRows.map(
        (r) =>
          `${String(r.title || '').trim().toLowerCase()}::${String(
            r.video_url || ''
          )
            .trim()
            .toLowerCase()}`
      )
    );

    const mergedList = [...dbRows];
    for (let j = 0; j < matchedVideos.length; j += 1) {
      const vid = matchedVideos[j];
      const sig = `${String(vid.title || '').trim().toLowerCase()}::${String(
        vid.mediaUrl || ''
      )
        .trim()
        .toLowerCase()}`;
      if (seenSig.has(sig)) continue;
      seenSig.add(sig);

      mergedList.push({
        id: `folder-${courseId}-${vid.fileName}-${j}`,
        course_id: courseId,
        title: vid.title,
        description: '',
        video_url: vid.mediaUrl,
        order_index: mergedList.length + 1,
        status: 'published',
      });
    }

    contents = mergedList;
  }

  return (
    <AdminCourseDetailModal
      course={course}
      contents={contents}
      courseId={courseId}
    />
  );
}