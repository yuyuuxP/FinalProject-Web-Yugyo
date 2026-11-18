import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const deleted = await pool.query('DELETE FROM course_contents WHERE id = $1 RETURNING *;', [id]);

    if (deleted.rows.length === 0) {
      return NextResponse.json({ message: 'Materi tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Materi berhasil dihapus.' });
  } catch (err) {
    console.error('Error deleting course content:', err);
    return NextResponse.json({ message: 'Gagal menghapus materi.' }, { status: 500 });
  }
}