import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function getDbPool() {
  const dbModule = await import('@/lib/db').catch(() => null);
  return dbModule?.default?.query
    ? dbModule.default
    : dbModule?.pool?.query
      ? dbModule.pool
      : null;
}

function parseIntOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

function isPlaceholderName(name) {
  const clean = String(name || '').trim().toLowerCase();
  return (
    !clean ||
    clean === 'student' ||
    clean === 'st' ||
    clean === 'student baker atelier' ||
    clean === 'student portal' ||
    clean === 'user'
  );
}

async function readYugyoUserCookie() {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('yugyo_user')?.value;
    if (!raw) return null;
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

async function resolveStudentId(pool, explicitId, studentName) {
  const cleanName = !isPlaceholderName(studentName)
    ? String(studentName).trim()
    : '';

  // 1. Cocokkan nama aktif dari header/sidebar ke kolom full_name atau email pada tabel users
  if (cleanName && pool) {
    const exactStudentRes = await pool
      .query(
        `SELECT id FROM users
         WHERE LOWER(COALESCE(role, '')) = 'student'
           AND (
             LOWER(TRIM(COALESCE(full_name, ''))) = LOWER($1)
             OR LOWER(TRIM(COALESCE(email, ''))) = LOWER($1)
           )
         ORDER BY id ASC LIMIT 1`,
        [cleanName]
      )
      .catch(() => null);

    const exactStudentId = parseIntOrNull(exactStudentRes?.rows?.[0]?.id);
    if (exactStudentId) return exactStudentId;

    // Cocokkan nama depan jika di header/sidebar tampil nama panggilan (mis. "Salwa" untuk "Salwa Ainiyah")
    const prefixStudentRes = await pool
      .query(
        `SELECT id FROM users
         WHERE LOWER(COALESCE(role, '')) = 'student'
           AND (
             SPLIT_PART(LOWER(TRIM(COALESCE(full_name, ''))), ' ', 1) = LOWER($1)
             OR LOWER(TRIM(COALESCE(full_name, ''))) LIKE LOWER($1 || ' %')
           )
         ORDER BY id ASC LIMIT 1`,
        [cleanName]
      )
      .catch(() => null);

    const prefixStudentId = parseIntOrNull(prefixStudentRes?.rows?.[0]?.id);
    if (prefixStudentId) return prefixStudentId;

    const anyRoleRes = await pool
      .query(
        `SELECT id FROM users
         WHERE LOWER(TRIM(COALESCE(full_name, ''))) = LOWER($1)
            OR LOWER(TRIM(COALESCE(email, ''))) = LOWER($1)
            OR SPLIT_PART(LOWER(TRIM(COALESCE(full_name, ''))), ' ', 1) = LOWER($1)
         ORDER BY id ASC LIMIT 1`,
        [cleanName]
      )
      .catch(() => null);

    const anyMatchedId = parseIntOrNull(anyRoleRes?.rows?.[0]?.id);
    if (anyMatchedId) return anyMatchedId;

    return null;
  }

  // 2. Jika studentName kosong, cek explicitId
  const directId = parseIntOrNull(explicitId);
  if (directId) return directId;

  // 3. Fallback terakhir: cookie yugyo_user khusus role student
  const cookieUser = await readYugyoUserCookie();
  const cookieRole = String(cookieUser?.role || '').trim().toLowerCase();
  if (cookieRole === 'student') {
    const cookieId = parseIntOrNull(
      cookieUser?.id ?? cookieUser?.userId ?? cookieUser?.user_id
    );
    if (cookieId) return cookieId;
  }

  return null;
}

export async function GET(request) {
  try {
    const pool = await getDbPool();
    if (!pool) {
      return NextResponse.json(
        { error: 'Koneksi database tidak tersedia' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryStudentId =
      searchParams.get('studentId') ?? searchParams.get('student_id');
    const queryStudentName =
      searchParams.get('studentName') ?? searchParams.get('student_name');

    const studentId = await resolveStudentId(
      pool,
      queryStudentId,
      queryStudentName
    );

    if (!studentId) {
      return NextResponse.json({
        studentId: null,
        enrollments: [],
      });
    }

    const rowsRes = await pool.query(
      `SELECT id, student_id, course_id, progress_percentage, status, enrolled_at
       FROM student_enrollments
       WHERE student_id = $1 AND LOWER(COALESCE(status, 'active')) != 'dropped'
       ORDER BY enrolled_at DESC, id DESC`,
      [studentId]
    );

    return NextResponse.json({
      studentId,
      enrollments: rowsRes.rows || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Gagal mengambil data pendaftaran kursus' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const pool = await getDbPool();
    if (!pool) {
      return NextResponse.json(
        { error: 'Koneksi database tidak tersedia' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const courseId = parseIntOrNull(body?.courseId ?? body?.course_id);
    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId tidak valid atau tidak ditemukan' },
        { status: 400 }
      );
    }

    const studentId = await resolveStudentId(
      pool,
      body?.studentId ?? body?.student_id,
      body?.studentName ?? body?.student_name
    );
    if (!studentId) {
      return NextResponse.json(
        { error: 'Akun student tidak terdeteksi. Silakan login ulang.' },
        { status: 401 }
      );
    }

    const courseCheck = await pool.query(
      'SELECT id FROM courses WHERE id = $1 LIMIT 1',
      [courseId]
    );
    if (!courseCheck.rows || courseCheck.rows.length === 0) {
      return NextResponse.json(
        {
          error: `Kursus dengan id ${courseId} tidak ditemukan di tabel courses`,
        },
        { status: 404 }
      );
    }

    const existing = await pool.query(
      `SELECT id, student_id, course_id, progress_percentage, status, enrolled_at
       FROM student_enrollments
       WHERE student_id = $1 AND course_id = $2
       ORDER BY id ASC LIMIT 1`,
      [studentId, courseId]
    );

    if (existing.rows && existing.rows.length > 0) {
      return NextResponse.json({
        studentId,
        alreadyEnrolled: true,
        enrollment: existing.rows[0],
      });
    }

    const inserted = await pool.query(
      `INSERT INTO student_enrollments (student_id, course_id, progress_percentage, status)
       VALUES ($1, $2, 0, 'active')
       RETURNING id, student_id, course_id, progress_percentage, status, enrolled_at`,
      [studentId, courseId]
    );

    return NextResponse.json(
      {
        studentId,
        alreadyEnrolled: false,
        enrollment: inserted.rows[0],
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Gagal menyimpan pendaftaran kursus' },
      { status: 500 }
    );
  }
}