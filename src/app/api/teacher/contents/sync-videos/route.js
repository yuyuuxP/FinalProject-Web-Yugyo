import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireActiveTeacher } from '@/lib/teacher-access';
import { findMatchedVideosForCourse } from '@/lib/mediaMatcher';

export async function POST(request) {
  try {
    const access = await requireActiveTeacher();
    if (access.response) return access.response;

    const body = await request.json();
    const courseId = Number(body?.course_id);
    const courseTitle = String(body?.course_title || '').trim();

    if (!courseId || !courseTitle) {
      return NextResponse.json(
        { success: false, error: 'course_id dan course_title wajib diisi.' },
        { status: 400 }
      );
    }

    const matchedVideos = await findMatchedVideosForCourse(courseTitle);

    const existingRes = await pool.query(
      'SELECT media_url, sort_order FROM course_contents WHERE course_id = $1;',
      [courseId]
    );

    const existingUrls = new Set(
      (existingRes.rows || []).map((r) => String(r.media_url || '').trim())
    );
    let nextOrder = Math.max(
      0,
      ...(existingRes.rows || []).map((r) => Number(r.sort_order) || 0)
    );

    let insertedCount = 0;
    for (const vid of matchedVideos) {
      if (existingUrls.has(vid.mediaUrl)) continue;
      nextOrder += 1;
      await pool.query(
        `INSERT INTO course_contents
          (course_id, title, content_type, duration_label, media_url, summary, sort_order)
         VALUES ($1, $2, 'video', '20 Menit', $3, $4, $5);`,
        [
          courseId,
          vid.title,
          vid.mediaUrl,
          `Video pembelajaran terhubung dari folder untuk kursus ${courseTitle}.`,
          nextOrder,
        ]
      );
      existingUrls.add(vid.mediaUrl);
      insertedCount += 1;
    }

    return NextResponse.json({
      success: true,
      insertedCount,
      matchedCount: matchedVideos.length,
    });
  } catch (error) {
    console.error('Error syncing videos to course_contents:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan video ke materi kursus.' },
      { status: 500 }
    );
  }
}