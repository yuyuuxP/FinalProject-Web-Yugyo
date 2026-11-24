import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

async function ensureCourseContentsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.course_contents (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      content_type VARCHAR(50) NOT NULL DEFAULT 'VIDEO',
      content_text TEXT,
      media_url TEXT,
      order_index INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function normalizeRow(row) {
  const rawType = String(row.content_type ?? row.type ?? 'VIDEO').toUpperCase();
  const isVideo = rawType.includes('VIDEO');
  return {
    ...row,
    id: row.id,
    courseId: row.course_id,
    course_id: row.course_id,
    title: row.title ?? '',
    type: isVideo ? 'VIDEO' : 'TEKS',
    content_type: isVideo ? 'VIDEO' : 'TEKS',
    textContent: row.content_text ?? row.text_content ?? row.body ?? '',
    content_text: row.content_text ?? row.text_content ?? row.body ?? '',
    mediaUrl: row.media_url ?? row.video_url ?? '',
    media_url: row.media_url ?? row.video_url ?? '',
    orderIndex: Number(row.order_index ?? 1),
    order_index: Number(row.order_index ?? 1),
  };
}

export async function GET(request) {
  try {
    await ensureCourseContentsTable();
    const { searchParams } = new URL(request.url);
    const courseId = String(
      searchParams.get('courseId') ?? searchParams.get('course_id') ?? ''
    ).trim();

    const queryText = courseId
      ? `SELECT cc.*, c.title AS course_title
         FROM public.course_contents cc
         LEFT JOIN public.courses c ON c.id = cc.course_id
         WHERE cc.course_id = $1
         ORDER BY cc.order_index ASC, cc.id ASC;`
      : `SELECT cc.*, c.title AS course_title
         FROM public.course_contents cc
         LEFT JOIN public.courses c ON c.id = cc.course_id
         ORDER BY cc.course_id ASC, cc.order_index ASC, cc.id ASC;`;

    const res = courseId
      ? await pool.query(queryText, [Number(courseId)])
      : await pool.query(queryText);

    const contents = (res.rows || []).map(normalizeRow);
    return NextResponse.json({ contents });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Gagal memuat konten kursus' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await ensureCourseContentsTable();
    const body = await request.json();

    const courseId = Number(body.courseId ?? body.course_id);
    const title = String(body.title ?? '').trim();
    const rawType = String(
      body.content_type ?? body.type ?? 'VIDEO'
    ).toUpperCase();
    const contentType = rawType.includes('TEKS') || rawType === 'TEXT' ? 'TEKS' : 'VIDEO';
    const contentText = String(
      body.content_text ?? body.textContent ?? body.body ?? ''
    ).trim();
    const mediaUrl = String(
      body.media_url ?? body.mediaUrl ?? body.video_url ?? ''
    ).trim();
    const orderIndex = Number(body.order_index ?? body.orderIndex ?? 1) || 1;

    if (!Number.isInteger(courseId) || courseId <= 0 || !title) {
      return NextResponse.json(
        { error: 'courseId dan judul materi wajib diisi' },
        { status: 400 }
      );
    }

    const insertRes = await pool.query(
      `INSERT INTO public.course_contents
         (course_id, title, content_type, content_text, media_url, order_index)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [courseId, title, contentType, contentText || null, mediaUrl || null, orderIndex]
    );

    const saved = normalizeRow(insertRes.rows[0]);
    return NextResponse.json({ content: saved, item: saved }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Gagal menyimpan materi kursus' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await ensureCourseContentsTable();
    const body = await request.json();
    const id = Number(body.id ?? body.contentId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID materi tidak valid' }, { status: 400 });
    }

    const title = String(body.title ?? '').trim();
    const rawType = String(
      body.content_type ?? body.type ?? 'VIDEO'
    ).toUpperCase();
    const contentType = rawType.includes('TEKS') || rawType === 'TEXT' ? 'TEKS' : 'VIDEO';
    const contentText = String(
      body.content_text ?? body.textContent ?? body.body ?? ''
    ).trim();
    const mediaUrl = String(
      body.media_url ?? body.mediaUrl ?? body.video_url ?? ''
    ).trim();
    const orderIndex = Number(body.order_index ?? body.orderIndex ?? 1) || 1;

    const updateRes = await pool.query(
      `UPDATE public.course_contents
       SET title = $1,
           content_type = $2,
           content_text = $3,
           media_url = $4,
           order_index = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *;`,
      [title, contentType, contentText || null, mediaUrl || null, orderIndex, id]
    );

    if (updateRes.rows.length === 0) {
      return NextResponse.json({ error: 'Materi tidak ditemukan' }, { status: 404 });
    }

    const updated = normalizeRow(updateRes.rows[0]);
    return NextResponse.json({ content: updated, item: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Gagal memperbarui materi' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await ensureCourseContentsTable();
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID materi tidak valid' }, { status: 400 });
    }

    await pool.query('DELETE FROM public.course_contents WHERE id = $1;', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Gagal menghapus materi' },
      { status: 500 }
    );
  }
}