import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import pool from '@/lib/db';
import { deleteLocalPictureFile } from '@/lib/mediaStorage';

const ALLOWED_STATUSES = ['active', 'pending', 'draft', 'published'];

function normalizeStatus(rawStatus) {
  if (!rawStatus) return 'active';
  const val = String(rawStatus).toLowerCase().trim();
  if (val.includes('aktif') || val.includes('publish') || val === 'active') return 'active';
  if (val.includes('pending') || val.includes('menunggu')) return 'pending';
  if (val.includes('draft')) return 'draft';
  return ALLOWED_STATUSES.includes(val) ? val : 'active';
}

function normalizeNullableDate(value) {
  if (!value || String(value).trim() === '') return null;
  return String(value).trim();
}

export async function GET(_request, context) {
  try {
    const { id } = await context.params;
    const courseId = Number(id);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return NextResponse.json({ error: 'ID kursus tidak valid' }, { status: 400 });
    }

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.title,
        c.description,
        c.status,
        c.thumbnail_url,
        c.start_date,
        c.end_date,
        c.category_id,
        c.instructor_id,
        cat.name AS category_name,
        u.full_name AS instructor_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE c.id = $1
      `,
      [courseId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Kursus tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ course: result.rows[0] }, { status: 200 });
  } catch (err) {
    console.error('GET /api/admin/courses/[id] Error:', err);
    return NextResponse.json({ error: 'Gagal mengambil data kursus' }, { status: 500 });
  }
}

async function handleUpdateCourse(request, context) {
  try {
    const { id } = await context.params;
    const courseId = Number(id);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return NextResponse.json({ error: 'ID kursus tidak valid' }, { status: 400 });
    }

    const contentType = request.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    let body = {};

    if (isJson) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    }

    const existingRes = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (existingRes.rowCount === 0) {
      return NextResponse.json({ error: 'Kursus tidak ditemukan' }, { status: 404 });
    }

    const current = existingRes.rows[0];

    const title =
      typeof body.title === 'string' && body.title.trim() !== ''
        ? body.title.trim()
        : current.title;

    const description =
      typeof body.description === 'string'
        ? body.description.trim()
        : current.description;

    const rawCategoryId = body.category_id ?? body.categoryId;
    const categoryId =
      rawCategoryId !== undefined && rawCategoryId !== null && String(rawCategoryId).trim() !== ''
        ? Number(rawCategoryId)
        : current.category_id;

    const rawInstructorId = body.instructor_id ?? body.instructorId;
    const instructorId =
      rawInstructorId !== undefined && rawInstructorId !== null && String(rawInstructorId).trim() !== ''
        ? Number(rawInstructorId)
        : current.instructor_id;

    const status =
      body.status !== undefined && String(body.status).trim() !== ''
        ? normalizeStatus(body.status)
        : current.status || 'active';

    const startDate =
      body.start_date !== undefined || body.startDate !== undefined
        ? normalizeNullableDate(body.start_date ?? body.startDate)
        : current.start_date;

    const endDate =
      body.end_date !== undefined || body.endDate !== undefined
        ? normalizeNullableDate(body.end_date ?? body.endDate)
        : current.end_date;

    const thumbnailUrl =
      typeof body.thumbnail_url === 'string' && body.thumbnail_url.trim() !== ''
        ? body.thumbnail_url.trim()
        : current.thumbnail_url;

    const updateRes = await pool.query(
      `
      UPDATE courses
      SET
        title = $1,
        description = $2,
        category_id = $3,
        instructor_id = $4,
        status = $5,
        start_date = $6,
        end_date = $7,
        thumbnail_url = $8
      WHERE id = $9
      RETURNING *
      `,
      [
        title,
        description,
        Number.isInteger(categoryId) && categoryId > 0 ? categoryId : null,
        Number.isInteger(instructorId) && instructorId > 0 ? instructorId : null,
        status,
        startDate,
        endDate,
        thumbnailUrl,
        courseId,
      ]
    );

    revalidatePath('/dashboard/admin/courses');
    revalidatePath(`/dashboard/admin/courses/${courseId}`);
    revalidatePath(`/dashboard/admin/courses/${courseId}/edit`);

    if (!isJson) {
      return NextResponse.redirect(new URL('/dashboard/admin/courses', request.url), 303);
    }

    return NextResponse.json(
      {
        message: 'Perubahan kursus berhasil disimpan',
        course: updateRes.rows[0],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('UPDATE /api/admin/courses/[id] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Gagal menyimpan perubahan kursus' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, context) {
  try {
    const { id } = await context.params;
    const courseId = Number(id);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return NextResponse.json({ error: 'ID kursus tidak valid' }, { status: 400 });
    }

    const deletedRes = await pool.query(
      'DELETE FROM courses WHERE id = $1 RETURNING id, thumbnail_url;',
      [courseId]
    );

    if (deletedRes.rowCount === 0) {
      return NextResponse.json({ error: 'Kursus tidak ditemukan' }, { status: 404 });
    }

    const thumbPath = deletedRes.rows[0]?.thumbnail_url;
    if (thumbPath) {
      await deleteLocalPictureFile(thumbPath, 'courses');
    }

    revalidatePath('/dashboard/admin/courses');
    return NextResponse.json({ message: 'Kursus dan gambar berhasil dihapus' }, { status: 200 });
  } catch (err) {
    console.error('DELETE /api/admin/courses/[id] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Gagal menghapus kursus' },
      { status: 500 }
    );
  }
}

export async function POST(request, context) {
  return handleUpdateCourse(request, context);
}

export async function PUT(request, context) {
  return handleUpdateCourse(request, context);
}

export async function PATCH(request, context) {
  return handleUpdateCourse(request, context);
}