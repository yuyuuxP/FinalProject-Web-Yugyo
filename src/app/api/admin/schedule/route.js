import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const category_id = formData.get('category_id');
    const instructor_id = formData.get('instructor_id');
    const status = formData.get('status') || 'active';
    const start_date = formData.get('start_date');
    const video_url = formData.get('video_url') || 'https://youtube.com/watch?v=sample';

    if (!title || !category_id || !instructor_id) {
      return NextResponse.json({ error: 'Judul, kategori, dan instruktur wajib diisi' }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO courses (title, description, category_id, instructor_id, status, start_date, video_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [title, description, category_id, instructor_id, status, start_date || null, video_url]
    );

    return NextResponse.redirect(new URL('/dashboard/admin/schedule', request.url), 303);
  } catch (err) {
    console.error('API Create Schedule Error:', err);
    return NextResponse.json({ error: 'Gagal membuat jadwal sesi baru' }, { status: 500 });
  }
}