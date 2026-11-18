import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, category_id, video_url, start_date, end_date } = body;

    if (!title || !description) {
      return NextResponse.json({ message: 'Judul dan deskripsi wajib diisi.' }, { status: 400 });
    }

    // Update data kursus di database
    const updated = await pool.query(
      `UPDATE courses 
       SET title = $1, description = $2, category_id = $3, video_url = $4, start_date = $5, end_date = $6 
       WHERE id = $7 
       RETURNING *;`,
      [title, description, category_id, video_url || null, start_date || null, end_date || null, id]
    );

    if (updated.rows.length === 0) {
      return NextResponse.json({ message: 'Kursus tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, course: updated.rows[0] });
  } catch (err) {
    console.error('Error updating course:', err);
    return NextResponse.json({ message: 'Gagal memperbarui kursus.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const deleted = await pool.query('DELETE FROM courses WHERE id = $1 RETURNING *;', [id]);

    if (deleted.rows.length === 0) {
      return NextResponse.json({ message: 'Kursus tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Kursus berhasil dihapus.' });
  } catch (err) {
    console.error('Error deleting course:', err);
    return NextResponse.json({ message: 'Gagal menghapus kursus.' }, { status: 500 });
  }
}