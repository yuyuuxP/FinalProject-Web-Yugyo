import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  scanAllCategoryVideos,
  findMatchedVideosForCourse,
} from '@/lib/mediaMatcher';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseIdFilter = Number(
      searchParams.get('courseId') ?? searchParams.get('course_id') ?? ''
    );

    const [coursesRes, contentsRes, allVideos] = await Promise.all([
      pool
        .query('SELECT id, title FROM public.courses ORDER BY id ASC;')
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

    const courses = (coursesRes.rows || []).filter((c) =>
      Number.isInteger(courseIdFilter) && courseIdFilter > 0
        ? Number(c.id) === courseIdFilter
        : true
    );

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

    return NextResponse.json({ contents: unifiedContents });
  } catch (err) {
    return NextResponse.json(
      { contents: [], error: err?.message || 'Gagal memuat modul kursus' },
      { status: 200 }
    );
  }
}