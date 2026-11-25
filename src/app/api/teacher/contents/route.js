import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireActiveTeacher } from '@/lib/teacher-access';

export async function POST(request) {
  try {
    const access = await requireActiveTeacher();
    if (access.response) return access.response;

    const body = await request.json();
    const { course_id, title, description, video_url, cover_image_url, order_index, status } = body;

    if (!course_id || !title) {
      return NextResponse.json({ message: 'Course ID dan judul materi wajib diisi.' }, { status: 400 });
    }

    const newContent = await pool.query(
      `INSERT INTO course_contents (course_id, title, description, video_url, cover_image_url, order_index, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *;`,
      [
        course_id, 
        title, 
        description || '', 
        video_url || null, 
        cover_image_url || null, 
        order_index || 1, 
        status || 'published'
      ]
    );

    return NextResponse.json({ success: true, content: newContent.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Error creating content:', err);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server database.' }, { status: 500 });
  }
}