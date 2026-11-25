import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { POST as createTeacherCourse } from '../route';

export const dynamic = 'force-dynamic';

async function getTeacherId() {
  const cookieStore = await cookies();
  const rawUserId = cookieStore.get('yugyo_user_id')?.value;
  const userId = Number(rawUserId);

  if (!Number.isInteger(userId) || userId <= 0) return null;

  const result = await pool.query(
    `SELECT id
     FROM users
     WHERE id = $1 AND LOWER(COALESCE(role, '')) = 'teacher'
     LIMIT 1`,
    [userId]
  );
  return result.rows[0]?.id ?? null;
}

export async function GET() {
  try {
    const teacherId = await getTeacherId();
    if (!teacherId) {
      return NextResponse.json({ error: 'Sesi pengajar tidak ditemukan.' }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT c.*, cat.name AS category_name,
              COUNT(DISTINCT se.id)::int AS enrolled_count
       FROM courses c
       LEFT JOIN categories cat ON cat.id = c.category_id
       LEFT JOIN student_enrollments se
         ON se.course_id = c.id
        AND LOWER(COALESCE(se.status, 'active')) <> 'dropped'
       WHERE c.instructor_id = $1
       GROUP BY c.id, cat.name
       ORDER BY c.id DESC`,
      [teacherId]
    );

    return NextResponse.json({ courses: result.rows });
  } catch (err) {
    console.error('GET /api/teacher/courses error:', err);
    return NextResponse.json(
      { error: err?.message || 'Gagal memuat kursus pengajar.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  return createTeacherCourse(request);
}
