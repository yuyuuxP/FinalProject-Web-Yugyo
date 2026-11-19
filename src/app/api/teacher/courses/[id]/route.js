import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import pool from '@/lib/db';
import { deleteLocalPictureFile } from '@/lib/mediaStorage';

const SHARED_STATIC_IMAGES = new Set([
  '/pictures/courses/french_patisserie/Madeleines.png',
  '/pictures/courses/french_patisserie/macaron.png',
  '/pictures/categories/french_patisserie.png',
  '/pictures/categories/cakes_decorating.png',
  '/pictures/categories/cookies.png',
  '/pictures/categories/bread&yeast_goods.png',
  '/pictures/categories/indonesian_cakes.png',
]);

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const courseId = Number(id);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return NextResponse.json({ message: 'ID kursus tidak valid.' }, { status: 400 });
    }

    const body = await request.json();
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const description = typeof body?.description === 'string' ? body.description.trim() : '';
    const categoryId = body?.category_id ? Number(body.category_id) : null;
    const videoUrl = body?.video_url ? String(body.video_url).trim() : null;
    const startDate = body?.start_date ? String(body.start_date).trim() : null;
    const endDate = body?.end_date ? String(body.end_date).trim() : null;

    if (!title || !description) {
      return NextResponse.json({ message: 'Judul dan deskripsi wajib diisi.' }, { status: 400 });
    }

    const updated = await pool.query(
      `UPDATE courses 
       SET title = $1, description = $2, category_id = $3, video_url = $4, start_date = $5, end_date = $6 
       WHERE id = $7 
       RETURNING *;`,
      [title, description, categoryId, videoUrl, startDate, endDate, courseId]
    );

    if (updated.rows.length === 0) {
      return NextResponse.json({ message: 'Kursus tidak ditemukan.' }, { status: 404 });
    }

    revalidatePath('/dashboard/teacher');
    revalidatePath('/dashboard/teacher/courses');
    revalidatePath('/dashboard/admin/courses');

    return NextResponse.json({ success: true, course: updated.rows[0] });
  } catch (err) {
    console.error('Error updating course:', err);
    return NextResponse.json(
      { message: `Gagal memperbarui kursus: ${err?.message || 'Kesalahan server.'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const courseId = Number(id);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return NextResponse.json({ message: 'ID kursus tidak valid.' }, { status: 400 });
    }

    const existing = await pool.query('SELECT * FROM courses WHERE id = $1;', [courseId]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ message: 'Kursus tidak ditemukan.' }, { status: 404 });
    }

    const row = existing.rows[0];
    const imageToDelete = row?.thumbnail_url || row?.video_url || null;

    await pool.query('DELETE FROM courses WHERE id = $1;', [courseId]);

    if (
      typeof imageToDelete === 'string' &&
      imageToDelete.startsWith('/pictures/') &&
      !SHARED_STATIC_IMAGES.has(imageToDelete)
    ) {
      await deleteLocalPictureFile(imageToDelete, 'courses');
    }

    revalidatePath('/dashboard/teacher');
    revalidatePath('/dashboard/teacher/courses');
    revalidatePath('/dashboard/admin/courses');

    return NextResponse.json({ success: true, message: 'Kursus dan file gambar berhasil dihapus.' });
  } catch (err) {
    console.error('Error deleting course:', err);
    return NextResponse.json(
      { message: `Gagal menghapus kursus: ${err?.message || 'Kesalahan server.'}` },
      { status: 500 }
    );
  }
}