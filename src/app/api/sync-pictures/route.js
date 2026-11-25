import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getCategoryImage, getCourseImage } from '@/lib/mediaHelper';

export async function POST() {
  try {
    const categoriesRes = await pool.query('SELECT id, name FROM categories;');
    const categoryById = new Map();

    for (const cat of categoriesRes.rows) {
      const catImg = getCategoryImage(cat.name);
      categoryById.set(cat.id, { name: cat.name, image: catImg });

      // Sesuaikan nama kolom gambar kategori jika berbeda (misal: image_url / thumbnail_url)
      await pool.query(
        'UPDATE categories SET image_url = $1 WHERE id = $2;',
        [catImg, cat.id]
      );
    }

    const coursesRes = await pool.query('SELECT id, title, category_id FROM courses;');
    let updatedCourses = 0;

    for (const course of coursesRes.rows) {
      const catInfo = categoryById.get(course.category_id);
      const courseImg = getCourseImage(course.title, catInfo?.name || '');

      // Sesuaikan nama kolom gambar kursus jika berbeda (misal: thumbnail_url / cover_image_url)
      await pool.query(
        'UPDATE courses SET thumbnail_url = $1 WHERE id = $2;',
        [courseImg, course.id]
      );
      updatedCourses += 1;
    }

    return NextResponse.json({
      success: true,
      updatedCategories: categoriesRes.rows.length,
      updatedCourses,
    });
  } catch (err) {
    console.error('Error syncing pictures:', err);
    return NextResponse.json(
      { message: 'Gagal menyinkronkan gambar kategori dan kursus.' },
      { status: 500 }
    );
  }
}