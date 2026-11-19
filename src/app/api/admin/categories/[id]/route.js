import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import pool from '@/lib/db';
import { deleteLocalPictureFile } from '@/lib/mediaStorage';

function extractImageUrl(row) {
  if (!row || typeof row !== 'object') return null;
  return row.image_url || row.thumbnail_url || row.image || row.icon_url || null;
}

export async function POST(request, context) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const methodOverride = formData.get('_method');

    if (methodOverride === 'DELETE') {
      const existingRes = await pool.query('SELECT * FROM categories WHERE id = $1;', [id]);
      const imagePath = existingRes.rowCount > 0 ? extractImageUrl(existingRes.rows[0]) : null;

      await pool.query('DELETE FROM categories WHERE id = $1;', [id]);

      if (imagePath) {
        await deleteLocalPictureFile(imagePath, 'categories');
      }

      revalidatePath('/dashboard/admin/categories');
      return NextResponse.redirect(new URL('/dashboard/admin/categories', request.url), 303);
    }

    if (methodOverride === 'PUT') {
      const name = formData.get('name');
      const description = formData.get('description');

      await pool.query(
        `UPDATE categories SET name = $1, description = $2 WHERE id = $3;`,
        [name, description || '', id]
      );

      revalidatePath('/dashboard/admin/categories');
      return NextResponse.redirect(new URL('/dashboard/admin/categories', request.url), 303);
    }

    return NextResponse.json({ error: 'Method not supported' }, { status: 400 });
  } catch (err) {
    console.error('API Category Action Error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function DELETE(_request, context) {
  try {
    const { id } = await context.params;

    const existingRes = await pool.query('SELECT * FROM categories WHERE id = $1;', [id]);
    const imagePath = existingRes.rowCount > 0 ? extractImageUrl(existingRes.rows[0]) : null;

    await pool.query('DELETE FROM categories WHERE id = $1;', [id]);

    if (imagePath) {
      await deleteLocalPictureFile(imagePath, 'categories');
    }

    revalidatePath('/dashboard/admin/categories');
    return NextResponse.json({ message: 'Kategori berhasil dihapus' });
  } catch (err) {
    console.error('API Delete Category Error:', err);
    return NextResponse.json({ error: 'Gagal menghapus kategori' }, { status: 500 });
  }
}