import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import pool from '@/lib/db';
import { saveUploadedImage } from '@/lib/mediaStorage';

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

export async function GET() {
  try {
    const result = await pool.query(`
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
      ORDER BY c.id DESC
    `);

    return NextResponse.json({ courses: result.rows }, { status: 200 });
  } catch (err) {
    console.error('GET /api/admin/courses Error:', err);
    return NextResponse.json({ error: 'Gagal mengambil data kursus' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    let body = {};
    let uploadedFile = null;

    if (isJson) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
      uploadedFile =
        formData.get('image_file') ||
        formData.get('thumbnail') ||
        formData.get('image') ||
        formData.get('file') ||
        null;
    }

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return NextResponse.json({ error: 'Judul kursus wajib diisi' }, { status: 400 });
    }

    const description = typeof body.description === 'string' ? body.description.trim() : '';

    const rawCategoryId = body.category_id ?? body.categoryId;
    const categoryId =
      rawCategoryId !== undefined && rawCategoryId !== null && String(rawCategoryId).trim() !== ''
        ? Number(rawCategoryId)
        : null;

    const rawInstructorId = body.instructor_id ?? body.instructorId;
    const instructorId =
      rawInstructorId !== undefined && rawInstructorId !== null && String(rawInstructorId).trim() !== ''
        ? Number(rawInstructorId)
        : null;

    const status = normalizeStatus(body.status);
    const startDate = normalizeNullableDate(body.start_date ?? body.startDate);
    const endDate = normalizeNullableDate(body.end_date ?? body.endDate);

    let thumbnailUrl =
      typeof body.thumbnail_url === 'string' && body.thumbnail_url.trim() !== ''
        ? body.thumbnail_url.trim()
        : null;

    if (uploadedFile && typeof uploadedFile === 'object' && uploadedFile.size > 0) {
      const savedPath = await saveUploadedImage(uploadedFile, 'course');
      if (savedPath) {
        thumbnailUrl = savedPath;
      }
    }

    const insertRes = await pool.query(
      `
      INSERT INTO courses (
        title,
        description,
        category_id,
        instructor_id,
        status,
        start_date,
        end_date,
        thumbnail_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
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
      ]
    );

    revalidatePath('/dashboard/admin/courses');

    if (!isJson) {
      return NextResponse.redirect(new URL('/dashboard/admin/courses', request.url), 303);
    }

    return NextResponse.json(
      {
        message: 'Kursus baru berhasil ditambahkan',
        course: insertRes.rows[0],
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/admin/courses Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Gagal menambahkan kursus baru' },
      { status: 500 }
    );
  }
}