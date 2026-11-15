// =====================================================================
// YUGYO - Admin Course Actions (Approve, Reject, Delete, & Update)
// File: src/app/dashboard/admin/courses/[id]/actions.jsx
// =====================================================================

'use server';

import pool from '@/lib/db';
import { redirect } from 'next/navigation';

export async function approveCourse(courseId) {
  try {
    await pool.query(`UPDATE courses SET status = 'active' WHERE id = $1;`, [courseId]);
  } catch (err) {
    console.error('Error approving course:', err);
  }
  redirect('/dashboard/admin/courses');
}

export async function rejectCourse(courseId) {
  try {
    await pool.query(`UPDATE courses SET status = 'rejected' WHERE id = $1;`, [courseId]);
  } catch (err) {
    console.error('Error rejecting course:', err);
  }
  redirect('/dashboard/admin/courses');
}

export async function deleteCourse(courseId) {
  try {
    await pool.query(`DELETE FROM courses WHERE id = $1;`, [courseId]);
  } catch (err) {
    console.error('Error deleting course:', err);
  }
  redirect('/dashboard/admin/courses');
}

export async function updateCourse(courseId, formData) {
  const title = formData.get('title')?.toString().trim();
  const description = formData.get('description')?.toString().trim();
  const categoryId = formData.get('category_id');
  const instructorId = formData.get('instructor_id');
  const startDate = formData.get('start_date') || null;
  const endDate = formData.get('end_date') || null;

  try {
    await pool.query(
      `UPDATE courses 
       SET title = $1, description = $2, category_id = $3, instructor_id = $4, start_date = $5, end_date = $6
       WHERE id = $7;`,
      [title, description, categoryId, instructorId, startDate, endDate, courseId]
    );
  } catch (err) {
    console.error('Error updating course:', err);
  }

  redirect(`/dashboard/admin/courses/${courseId}`);
}