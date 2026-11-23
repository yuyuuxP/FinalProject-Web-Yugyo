import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import pool from '@/lib/db';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'videos', 'upload');

async function removeUploadedVideoIfNeeded(videoUrl) {
  const raw = String(videoUrl || '').trim();
  if (!raw.startsWith('/videos/upload/')) return;

  const fileName = path.basename(raw);
  if (!fileName || fileName === '.' || fileName === '..') return;

  const resolvedUploadDir = path.resolve(UPLOAD_DIR);
  const targetPath = path.resolve(resolvedUploadDir, fileName);

  if (!targetPath.startsWith(resolvedUploadDir + path.sep)) return;

  await fs.unlink(targetPath).catch(() => {});
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return NextResponse.json(
        { success: false, message: 'ID materi tidak valid.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      summary,
      video_url,
      media_url,
      order_index,
      sort_order,
      status,
    } = body;

    const existingRes = await pool.query(
      'SELECT * FROM course_contents WHERE id = $1 LIMIT 1;',
      [numericId]
    );

    if (existingRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Materi tidak ditemukan.' },
        { status: 404 }
      );
    }

    const current = existingRes.rows[0];
    const nextTitle =
      title !== undefined && String(title).trim() !== ''
        ? String(title).trim()
        : current.title;

    const rawDesc = description !== undefined ? description : summary;
    const nextDescription =
      rawDesc !== undefined ? String(rawDesc) : current.description ?? '';

    const rawVideo = video_url !== undefined ? video_url : media_url;
    const nextVideoUrl =
      rawVideo !== undefined
        ? String(rawVideo).trim() || null
        : current.video_url ?? null;

    if (
      current.video_url &&
      String(current.video_url).startsWith('/videos/upload/') &&
      String(current.video_url) !== String(nextVideoUrl || '')
    ) {
      await removeUploadedVideoIfNeeded(current.video_url);
    }

    const rawOrder = order_index !== undefined ? order_index : sort_order;
    const parsedOrder = Number.parseInt(rawOrder, 10);
    const nextOrderIndex =
      Number.isInteger(parsedOrder) && parsedOrder > 0
        ? parsedOrder
        : current.order_index ?? 1;

    const nextStatus =
      status !== undefined && String(status).trim() !== ''
        ? String(status).trim()
        : current.status ?? 'published';

    const updated = await pool.query(
      `UPDATE course_contents
       SET title = $1,
           description = $2,
           video_url = $3,
           order_index = $4,
           status = $5
       WHERE id = $6
       RETURNING *;`,
      [
        nextTitle,
        nextDescription,
        nextVideoUrl,
        nextOrderIndex,
        nextStatus,
        numericId,
      ]
    );

    return NextResponse.json(
      { success: true, content: updated.rows[0] },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error updating course content:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui materi di database.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const deleted = await pool.query(
      'DELETE FROM course_contents WHERE id = $1 RETURNING *;',
      [id]
    );

    if (deleted.rows.length === 0) {
      return NextResponse.json(
        { message: 'Materi tidak ditemukan.' },
        { status: 404 }
      );
    }

    await removeUploadedVideoIfNeeded(deleted.rows[0]?.video_url);

    return NextResponse.json({
      success: true,
      message: 'Materi dan file video terupload berhasil dihapus.',
    });
  } catch (err) {
    console.error('Error deleting course content:', err);
    return NextResponse.json(
      { message: 'Gagal menghapus materi.' },
      { status: 500 }
    );
  }
}