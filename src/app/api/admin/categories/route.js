import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const description = formData.get('description');

    if (!name) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO categories (name, description) VALUES ($1, $2);`,
      [name, description || '']
    );

    return NextResponse.redirect(new URL('/dashboard/admin/categories', request.url), 303);
  } catch (err) {
    console.error('API Create Category Error:', err);
    return NextResponse.json({ error: 'Gagal menambah kategori' }, { status: 500 });
  }
}