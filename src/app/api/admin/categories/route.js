import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const description = formData.get('description');
    const imageFile = formData.get('image_file');

    if (!name) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 });
    }

    let imageUrl = '/pictures/category/default-category.jpg';

    // Jika admin mengunggah file foto profil kategori
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
      const uploadDir = path.join(process.cwd(), 'public', 'pictures', 'category');

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      fs.writeFileSync(path.join(uploadDir, fileName), buffer);
      imageUrl = `/pictures/category/${fileName}`;
    }

    await pool.query(
      `INSERT INTO categories (name, description, image_url) VALUES ($1, $2, $3);`,
      [name, description, imageUrl]
    );

    return NextResponse.redirect(new URL('/dashboard/admin/categories', request.url), 303);
  } catch (err) {
    console.error('API Create Category Error:', err);
    return NextResponse.json({ error: 'Gagal membuat kategori baru' }, { status: 500 });
  }
}