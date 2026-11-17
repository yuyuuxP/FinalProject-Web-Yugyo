import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    
    const title = formData.get('title');
    const description = formData.get('description');
    const category_id = formData.get('category_id');
    const instructor_id = formData.get('instructor_id');
    const status = formData.get('status') || 'active';
    const start_date = formData.get('start_date');
    const video_url = formData.get('video_url');

    if (!title || !category_id || !instructor_id) {
      return NextResponse.json({ error: 'Judul, kategori, dan instruktur wajib diisi' }, { status: 400 });
    }

    await pool.query(
      `UPDATE courses 
       SET title = $1, description = $2, category_id = $3, instructor_id = $4, status = $5, start_date = $6, video_url = $7
       WHERE id = $8;`,
      [title, description, category_id, instructor_id, status, start_date || null, video_url, id]
    );

    return NextResponse.redirect(new URL('/dashboard/admin/schedule', request.url), 303);
  } catch (err) {
    console.error('API Update Schedule Error:', err);
    return NextResponse.json({ error: 'Gagal memperbarui jadwal sesi' }, { status: 500 });
  }
}