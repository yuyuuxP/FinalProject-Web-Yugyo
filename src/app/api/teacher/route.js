import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('yugyo_user_id')?.value;

    let instructorId = userId;

    if (!instructorId) {
      const fallbackRes = await pool.query("SELECT id FROM users WHERE role = 'teacher' LIMIT 1;");
      if (fallbackRes.rows.length > 0) {
        instructorId = fallbackRes.rows[0].id;
      }
    }

    const body = await request.json();
    const { title, description, category_id, video_url, start_date, end_date, thumbnail_url } = body;

    if (!title || !description || !category_id) {
      return NextResponse.json({ message: 'Judul, deskripsi, dan kategori wajib diisi.' }, { status: 400 });
    }

    // Masukkan ke database dengan status awal 'pending'
    const newCourse = await pool.query(
      `INSERT INTO courses (title, description, category_id, instructor_id, status, video_url, start_date, end_date) 
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7) 
       RETURNING *;`,
      [
        title, 
        description, 
        category_id, 
        instructorId, 
        video_url || thumbnail_url || null, 
        start_date || null, 
        end_date || null
      ]
    );

    return NextResponse.json({ success: true, course: newCourse.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Error creating course:', err);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server database.' }, { status: 500 });
  }
}