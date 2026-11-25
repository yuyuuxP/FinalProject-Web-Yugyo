import pool from '@/lib/db';
import StudentCoursesClient from '@/components/student/StudentCoursesClient';
import {
  scanAllCategoryVideos,
  findMatchedVideosForCourse,
} from '@/lib/mediaMatcher';

export const dynamic = 'force-dynamic';

export default async function StudentCoursesPage({ searchParams }) {
  const resolvedParams = (await searchParams) || {};
  const initialCourseId = String(
    resolvedParams.courseId ?? resolvedParams.course ?? ''
  ).trim();
  const initialCategory = String(resolvedParams.category ?? '').trim();

  const [coursesRes, contentsRes, allVideos] = await Promise.all([
    pool
      .query(
        `SELECT
           c.*,
           COALESCE(cat.name, 'Bread & Yeast Goods') AS category,
           COALESCE(u.full_name, 'Chef Yugyo') AS instructor
         FROM public.courses c
         LEFT JOIN public.categories cat ON cat.id = c.category_id
         LEFT JOIN public.users u ON u.id = c.instructor_id
         ORDER BY c.id ASC;`
      )
      .catch(() => ({ rows: [] })),
    pool
      .query(
        `SELECT *
         FROM public.course_contents
         ORDER BY course_id ASC, order_index ASC NULLS LAST, id ASC;`
      )
      .catch(() => ({ rows: [] })),
    scanAllCategoryVideos(),
  ]);

  const courses = coursesRes.rows || [];
  const rawDbContents = (contentsRes.rows || []).filter(
    (row) => String(row?.status || 'published').toLowerCase() !== 'draft'
  );

  const unifiedContents = [];

  for (const course of courses) {
    const courseIdNum = Number(course.id);
    const dbForCourse = rawDbContents.filter(
      (row) => Number(row.course_id) === courseIdNum
    );

    const seenIds = new Set();
    const seenSignature = new Set();
    const courseItems = [];

    for (let i = 0; i < dbForCourse.length; i += 1) {
      const row = dbForCourse[i];
      const idStr = row?.id !== undefined && row?.id !== null ? String(row.id) : '';
      const vidUrl = String(row?.video_url ?? row?.media_url ?? '').trim();
      const normTitle = String(row?.title || '').trim().toLowerCase();
      const sig = `${normTitle}::${vidUrl.toLowerCase()}`;

      if (idStr && seenIds.has(idStr)) continue;
      if (normTitle && seenSignature.has(sig)) continue;

      if (idStr) seenIds.add(idStr);
      if (normTitle) seenSignature.add(sig);

      courseItems.push({
        ...row,
        course_id: courseIdNum,
        course_title: course.title,
        description: row.description ?? row.summary ?? '',
        video_url: vidUrl || null,
        media_url: vidUrl || null,
        order_index: Number(row.order_index ?? row.sort_order ?? i + 1) || i + 1,
      });
    }

    const matchedVideos = await findMatchedVideosForCourse(course.title, allVideos);
    for (let j = 0; j < matchedVideos.length; j += 1) {
      const vid = matchedVideos[j];
      const vidUrl = String(vid.mediaUrl || '').trim();
      const sig = `${String(vid.title || '').trim().toLowerCase()}::${vidUrl.toLowerCase()}`;
      if (seenSignature.has(sig)) continue;
      seenSignature.add(sig);

      courseItems.push({
        id: `folder-${courseIdNum}-${vid.fileName}-${j}`,
        course_id: courseIdNum,
        course_title: course.title,
        title: vid.title,
        description: '',
        video_url: vidUrl || null,
        media_url: vidUrl || null,
        status: 'published',
        order_index: courseItems.length + 1,
      });
    }

    courseItems.sort(
      (a, b) => (Number(a.order_index) || 999) - (Number(b.order_index) || 999)
    );
    unifiedContents.push(...courseItems);
  }

  return (
    <StudentCoursesClient
      initialCourses={courses}
      initialContents={unifiedContents}
      localVideos={allVideos}
      initialCourseId={initialCourseId}
      initialCategory={initialCategory}
    />
  );
}