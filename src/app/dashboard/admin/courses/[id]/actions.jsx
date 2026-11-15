// =====================================================================
// YUGYO - Admin Course Actions
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