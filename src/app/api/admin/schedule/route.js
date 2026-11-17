import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { writeFile } from 'fs/promises';
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
    const videoUrlInput = formData.get('video_url');
    const videoFile = formData.get('video_file');

    if (!title || !category_id || !instructor_id) {
      return NextResponse.json({ error: 'Judul, kategori, dan instruktur wajib diisi' }, { status: 400 });
    }

    let finalVideoUrl = videoUrlInput || 'https://youtube.com/watch?v=sample';

    // Jika admin mengunggah file video secara langsung
    if (videoFile && videoFile.size > 0) {
      const bytes = await videoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Bersihkan nama file dari spasi
      const originalName = videoFile.name.replace(/\s+/g, '-');
      const fileName = `${Date.now()}-${originalName}`;
      
      // Simpan ke folder public/videos sesuai struktur Yugyo
      const uploadDir = path.join(process.cwd(), 'public', 'videos');
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);
      finalVideoUrl = `/videos/${fileName}`;
    }

    await pool.query(
      `INSERT INTO courses (title, description, category_id, instructor_id, status, start_date, video_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [title, description, category_id, instructor_id, status, start_date || null, finalVideoUrl]
    );

    return NextResponse.redirect(new URL('/dashboard/admin/schedule', request.url), 303);
  } catch (err) {
    console.error('API Create Schedule Error:', err);
    return NextResponse.json({ error: 'Gagal membuat jadwal sesi baru' }, { status: 500 });
  }
}