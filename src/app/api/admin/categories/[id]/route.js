import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const methodOverride = formData.get('_method');

    if (methodOverride === 'DELETE') {
      await pool.query('DELETE FROM categories WHERE id = $1;', [id]);
      return NextResponse.redirect(new URL('/dashboard/admin/categories', request.url), 303);
    }

    if (methodOverride === 'PUT') {
      const name = formData.get('name');
      const description = formData.get('description');

      await pool.query(
        `UPDATE categories SET name = $1, description = $2 WHERE id = $3;`,
        [name, description || '', id]
      );
      return NextResponse.redirect(new URL('/dashboard/admin/categories', request.url), 303);
    }

    return NextResponse.json({ error: 'Method not supported' }, { status: 400 });
  } catch (err) {
    console.error('API Category Action Error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await pool.query('DELETE FROM categories WHERE id = $1;', [id]);
    return NextResponse.json({ message: 'Kategori berhasil dihapus' });
  } catch (err) {
    console.error('API Delete Category Error:', err);
    return NextResponse.json({ error: 'Gagal menghapus kategori' }, { status: 500 });
  }
}