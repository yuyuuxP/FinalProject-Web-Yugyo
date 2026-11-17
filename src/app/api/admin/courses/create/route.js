import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    const title = formData.get('title');
    const description = formData.get('description');
    
    const catRaw = formData.get('category_id');
    const instRaw = formData.get('instructor_id');

    const category_id = catRaw && catRaw !== '' ? parseInt(catRaw, 10) : null;
    const instructor_id = instRaw && instRaw !== '' ? parseInt(instRaw, 10) : null;
    
    const start_date = formData.get('start_date') || null;
    const end_date = formData.get('end_date') || null;
    const status = formData.get('status') || 'active';

    await pool.query(
      `INSERT INTO courses (title, description, category_id, instructor_id, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, NULLIF($5, '')::DATE, NULLIF($6, '')::DATE, $7);`,
      [title, description, category_id, instructor_id, start_date, end_date, status]
    );

    return NextResponse.redirect(new URL('/dashboard/admin/courses', request.url), 303);
  } catch (err) {
    console.error('API Create Course Error:', err);
    return NextResponse.json({ error: 'Gagal menambahkan kursus baru' }, { status: 500 });
  }
}