import pool from '@/lib/db';
import { notFound } from 'next/navigation';
import EditCourseClient from '@/components/teacher/EditCourseClient';

export default async function EditCoursePage({ params }) {
  const { id } = await params;
  let course = null;
  let categories = [];

  try {
    const courseRes = await pool.query('SELECT * FROM courses WHERE id = $1;', [id]);
    if (courseRes.rows.length === 0) {
      notFound();
    }
    course = courseRes.rows[0];

    const catRes = await pool.query('SELECT id, name FROM categories ORDER BY name ASC;');
    categories = catRes.rows;
  } catch (err) {
    console.error('Error loading edit course page:', err);
    notFound();
  }

  return <EditCourseClient course={course} categories={categories} />;
}