import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import pool from '@/lib/db';
import { saveUploadedImage } from '@/lib/mediaStorage';

export async function GET() {
  try {
    const res = await pool.query('SELECT * FROM categories ORDER BY id ASC;');
    return NextResponse.json({ categories: res.rows }, { status: 200 });
  } catch (err) {
    console.error('GET /api/admin/categories Error:', err);
    return NextResponse.json({ error: 'Gagal mengambil kategori' }, { status: 500 });
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
        formData.get('image') ||
        formData.get('thumbnail') ||
        formData.get('file') ||
        null;
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 });
    }

    const description = typeof body.description === 'string' ? body.description.trim() : '';

    let imageUrl =
      typeof body.image_url === 'string' && body.image_url.trim() !== ''
        ? body.image_url.trim()
        : null;

    if (uploadedFile && typeof uploadedFile === 'object' && uploadedFile.size > 0) {
      const savedPath = await saveUploadedImage(uploadedFile, 'category');
      if (savedPath) {
        imageUrl = savedPath;
      }
    }

    const insertRes = await pool.query(
      `
      INSERT INTO categories (name, description, image_url)
      VALUES ($1, $2, $3)
      RETURNING *;
      `,
      [name, description, imageUrl]
    );

    revalidatePath('/dashboard/admin/categories');

    if (!isJson) {
      return NextResponse.redirect(new URL('/dashboard/admin/categories', request.url), 303);
    }

    return NextResponse.json(
      { message: 'Kategori berhasil ditambahkan', category: insertRes.rows[0] },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/admin/categories Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Gagal menambahkan kategori' },
      { status: 500 }
    );
  }
}