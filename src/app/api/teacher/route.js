import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import pool from '@/lib/db';
import { saveUploadedImage } from '@/lib/mediaStorage';
import { requireActiveTeacher } from '@/lib/teacher-access';

export async function POST(request) {
  try {
    const access = await requireActiveTeacher();
    if (access.response) return access.response;
    const instructorId = access.account.id;

    const contentType = request.headers.get('content-type') || '';
    let body = {};
    let uploadedFile = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
      uploadedFile =
        formData.get('image_file') ||
        formData.get('thumbnail') ||
        formData.get('image') ||
        formData.get('file') ||
        null;
    } else {
      body = await request.json();
    }

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';

    if (!title) {
      return NextResponse.json(
        { message: 'Field "title" (Judul Kursus) kosong.', error: 'Judul kursus wajib diisi.' },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { message: 'Field "description" kosong.', error: 'Deskripsi kursus wajib diisi.' },
        { status: 400 }
      );
    }

    let categoryId =
      body.category_id !== undefined &&
      body.category_id !== null &&
      String(body.category_id).trim() !== '' &&
      Number.isInteger(Number(body.category_id)) &&
      Number(body.category_id) > 0
        ? Number(body.category_id)
        : null;

    if (!categoryId) {
      const fallbackCat = await pool.query('SELECT id FROM categories ORDER BY id ASC LIMIT 1;');
      if (fallbackCat.rows.length > 0) {
        categoryId = Number(fallbackCat.rows[0].id);
      }
    }

    if (!categoryId) {
      return NextResponse.json(
        {
          message: 'Tidak ada data kategori di tabel categories.',
          error: 'Kategori atelier tidak ditemukan di database.',
        },
        { status: 400 }
      );
    }

    const startDate =
      body.start_date && String(body.start_date).trim() !== ''
        ? String(body.start_date).trim()
        : null;
    const endDate =
      body.end_date && String(body.end_date).trim() !== ''
        ? String(body.end_date).trim()
        : null;

    let thumbnailUrl = null;
    if (uploadedFile && typeof uploadedFile === 'object' && uploadedFile.size > 0) {
      try {
        thumbnailUrl = await saveUploadedImage(uploadedFile, 'course');
      } catch (fileErr) {
        return NextResponse.json(
          {
            message: `Gagal menulis file ke public/pictures/courses: ${fileErr?.message || 'I/O error'}`,
            error: fileErr?.message || 'Gagal menyimpan file gambar.',
          },
          { status: 500 }
        );
      }
    }

    let newCourse;
    try {
      newCourse = await pool.query(
        `INSERT INTO courses (
          title,
          description,
          category_id,
          instructor_id,
          status,
          thumbnail_url,
          start_date,
          end_date
        )
        VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7)
        RETURNING *;`,
        [title, description, categoryId, instructorId, thumbnailUrl, startDate, endDate]
      );
    } catch (dbErr) {
      if (String(dbErr?.message || '').includes('thumbnail_url')) {
        newCourse = await pool.query(
          `INSERT INTO courses (
            title,
            description,
            category_id,
            instructor_id,
            status,
            video_url,
            start_date,
            end_date
          )
          VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7)
          RETURNING *;`,
          [title, description, categoryId, instructorId, thumbnailUrl, startDate, endDate]
        );
      } else {
        throw dbErr;
      }
    }

    revalidatePath('/dashboard/teacher');
    revalidatePath('/dashboard/teacher/courses');
    revalidatePath('/dashboard/admin/courses');

    return NextResponse.json({ success: true, course: newCourse.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Error creating course:', err);
    const pgCode = err?.code ? `PG ${err.code}` : 'DB Error';
    const detail = err?.detail ? ` — ${err.detail}` : '';
    const msg = `${pgCode}: ${err?.message || 'Gagal insert ke tabel courses'}${detail}`;
    return NextResponse.json({ message: msg, error: msg }, { status: 500 });
  }
}