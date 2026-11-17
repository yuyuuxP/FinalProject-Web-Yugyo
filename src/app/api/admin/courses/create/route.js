import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const category_id = formData.get('category_id');
    const instructor_id = formData.get('instructor_id');
    const status = formData.get('status') || 'active';
    const start_date = formData.get('start_date');
    const end_date = formData.get('end_date');
    const imageFile = formData.get('image_file');

    if (!title || !category_id || !instructor_id) {
      return NextResponse.json({ error: 'Judul, kategori, dan instruktur wajib diisi' }, { status: 400 });
    }

    let imageUrl = '/pictures/content/default-course.jpg'; // Gambar default jika tidak diupload

    // Jika admin mengunggah file gambar foto profil kursus
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
      const uploadDir = path.join(process.cwd(), 'public', 'pictures', 'content');

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      fs.writeFileSync(path.join(uploadDir, fileName), buffer);
      imageUrl = `/pictures/content/${fileName}`;
    }

    // Masukkan data ke database courses (termasuk kolom image_url/cover jika ada, atau disesuaikan dengan skema tabelmu)
    await pool.query(
      `INSERT INTO courses (title, description, category_id, instructor_id, status, start_date, end_date, video_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
      [title, description, category_id, instructor_id, status, start_date || null, end_date || null, imageUrl]
    );

    return NextResponse.redirect(new URL('/dashboard/admin/courses', request.url), 303);
  } catch (err) {
    console.error('API Create Course Error:', err);
    return NextResponse.json({ error: 'Gagal membuat kursus baru' }, { status: 500 });
  }
}