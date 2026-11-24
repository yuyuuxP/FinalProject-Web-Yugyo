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

    return null;
  }

  const directId = parseIntOrNull(explicitId);
  if (directId) return directId;

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

async function ensureCompletionTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_content_completions (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      content_key VARCHAR(150) NOT NULL,
      completed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (student_id, course_id, content_key)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_student_content_completions_student_id
    ON student_content_completions (student_id);
  `);
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

    await ensureCompletionTable(pool);

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
        completedKeys: [],
        progressByCourse: {},
      });
    }

    const completionsRes = await pool.query(
      `SELECT scc.course_id, scc.content_key
       FROM student_content_completions scc
       INNER JOIN student_enrollments se
         ON se.student_id = scc.student_id AND se.course_id = scc.course_id
       WHERE scc.student_id = $1
         AND LOWER(COALESCE(se.status, 'active')) != 'dropped'
       ORDER BY scc.id ASC`,
      [studentId]
    );

    const enrollmentsRes = await pool.query(
      `SELECT course_id, progress_percentage
       FROM student_enrollments
       WHERE student_id = $1
         AND LOWER(COALESCE(status, 'active')) != 'dropped'`,
      [studentId]
    );

    const completedKeys = (completionsRes.rows || []).map(
      (row) => `${row.course_id}:${row.content_key}`
    );

    const progressByCourse = {};
    for (const row of enrollmentsRes.rows || []) {
      progressByCourse[String(row.course_id)] = Number(
        row.progress_percentage ?? 0
      );
    }

    return NextResponse.json({
      studentId,
      completedKeys,
      progressByCourse,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Gagal memuat progres modul' },
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

    await ensureCompletionTable(pool);

    const body = await request.json().catch(() => ({}));
    const courseId = parseIntOrNull(body?.courseId ?? body?.course_id);
    const contentKey = String(
      body?.contentKey ?? body?.content_key ?? ''
    ).trim();
    const totalModulesInput = Number(body?.totalModules ?? 0);

    if (!courseId || !contentKey) {
      return NextResponse.json(
        { error: 'courseId dan contentKey wajib diisi' },
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

    const existingRes = await pool.query(
      `SELECT id FROM student_content_completions
       WHERE student_id = $1 AND course_id = $2 AND content_key = $3
       LIMIT 1`,
      [studentId, courseId, contentKey]
    );

    const currentlyDone = existingRes.rows.length > 0;
    const nextDone =
      typeof body?.completed === 'boolean' ? body.completed : !currentlyDone;

    if (nextDone && !currentlyDone) {
      await pool.query(
        `INSERT INTO student_content_completions (student_id, course_id, content_key)
         VALUES ($1, $2, $3)
         ON CONFLICT (student_id, course_id, content_key) DO NOTHING`,
        [studentId, courseId, contentKey]
      );
    } else if (!nextDone && currentlyDone) {
      await pool.query(
        `DELETE FROM student_content_completions
         WHERE student_id = $1 AND course_id = $2 AND content_key = $3`,
        [studentId, courseId, contentKey]
      );
    }

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS completed_count
       FROM student_content_completions
       WHERE student_id = $1 AND course_id = $2`,
      [studentId, courseId]
    );

    const completedCount = Number(countRes.rows[0]?.completed_count ?? 0);
    const totalCount = Math.max(
      Number.isFinite(totalModulesInput) && totalModulesInput > 0
        ? Math.floor(totalModulesInput)
        : 0,
      completedCount
    );

    const progressPercentage =
      totalCount > 0
        ? Math.min(100, Math.round((completedCount / totalCount) * 100))
        : 0;

    await pool.query(
      `UPDATE student_enrollments
       SET progress_percentage = $1
       WHERE student_id = $2 AND course_id = $3`,
      [progressPercentage, studentId, courseId]
    );

    const allCompletionsRes = await pool.query(
      `SELECT scc.course_id, scc.content_key
       FROM student_content_completions scc
       INNER JOIN student_enrollments se
         ON se.student_id = scc.student_id AND se.course_id = scc.course_id
       WHERE scc.student_id = $1
         AND LOWER(COALESCE(se.status, 'active')) != 'dropped'
       ORDER BY scc.id ASC`,
      [studentId]
    );

    const completedKeys = (allCompletionsRes.rows || []).map(
      (row) => `${row.course_id}:${row.content_key}`
    );

    return NextResponse.json({
      studentId,
      courseId,
      contentKey,
      isCompleted: nextDone,
      completedCount,
      totalCount,
      progressPercentage,
      completedKeys,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Gagal memperbarui progres modul' },
      { status: 500 }
    );
  }
}