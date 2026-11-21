import pool from '@/lib/db';
import { isTeacherPending } from '@/lib/teacher-status';

export async function checkTargetTeacherPending({ teacherId = null, courseId = null } = {}) {
  const numericTeacherId = Number(teacherId);
  const numericCourseId = Number(courseId);

  const hasTeacherId = Number.isInteger(numericTeacherId) && numericTeacherId > 0;
  const hasCourseId = Number.isInteger(numericCourseId) && numericCourseId > 0;

  if (!hasTeacherId && !hasCourseId) {
    return { isPending: false, teacher: null };
  }

  const res = await pool.query(
    `SELECT u.id, u.full_name, u.status
     FROM users u
     LEFT JOIN courses c ON c.instructor_id = u.id
     WHERE (u.role = 'teacher' AND $1::int IS NOT NULL AND u.id = $1::int)
        OR (u.role = 'teacher' AND $2::int IS NOT NULL AND c.id = $2::int)
     ORDER BY CASE WHEN u.id = $1::int THEN 0 ELSE 1 END
     LIMIT 1;`,
    [hasTeacherId ? numericTeacherId : null, hasCourseId ? numericCourseId : null]
  );

  const row = res.rows[0] || null;
  if (!row) {
    return { isPending: false, teacher: null };
  }

  return {
    isPending: isTeacherPending(row.status),
    teacher: row,
  };
}

export async function filterActiveTeachersOnly(teachers = []) {
  if (!Array.isArray(teachers) || teachers.length === 0) return [];
  return teachers.filter((t) => !isTeacherPending(t?.status));
}