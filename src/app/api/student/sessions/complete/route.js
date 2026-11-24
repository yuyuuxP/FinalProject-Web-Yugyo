import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const SESSION_XP_REWARD = 25;

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
    const exactRes = await pool
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

    const exactId = parseIntOrNull(exactRes?.rows?.[0]?.id);
    if (exactId) return exactId;

    const prefixRes = await pool
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

    const prefixId = parseIntOrNull(prefixRes?.rows?.[0]?.id);
    if (prefixId) return prefixId;

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

async function ensureColumns(pool) {
  await pool
    .query(
      `ALTER TABLE session_student_completions
       ADD COLUMN IF NOT EXISTS xp_earned INTEGER NOT NULL DEFAULT 0,
       ADD COLUMN IF NOT EXISTS notes TEXT;`
    )
    .catch(() => null);
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

    await ensureColumns(pool);

    const { searchParams } = new URL(request.url);
    const studentId = await resolveStudentId(
      pool,
      searchParams.get('studentId') ?? searchParams.get('student_id'),
      searchParams.get('studentName') ?? searchParams.get('student_name')
    );

    if (!studentId) {
      return NextResponse.json({
        studentId: null,
        completedSessionIds: [],
        totalSessionXp: 0,
      });
    }

    const res = await pool.query(
      `SELECT session_id, COALESCE(xp_earned, 0)::int AS xp_earned, notes, marked_done_at
       FROM session_student_completions
       WHERE student_id = $1
       ORDER BY marked_done_at DESC, id DESC`,
      [studentId]
    );

    const rows = res.rows || [];
    const completedSessionIds = rows.map((r) => Number(r.session_id));
    const totalSessionXp = rows.reduce(
      (sum, r) => sum + Number(r.xp_earned ?? 0),
      0
    );

    return NextResponse.json({
      studentId,
      completedSessionIds,
      totalSessionXp,
      completions: rows,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Gagal mengambil status penyelesaian sesi' },
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

    await ensureColumns(pool);

    const body = await request.json().catch(() => ({}));
    const sessionId = parseIntOrNull(body?.sessionId ?? body?.session_id);
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId tidak valid' },
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

    const sessionRes = await pool.query(
      `SELECT
         id,
         (
           COALESCE(is_done, FALSE)
           OR LOWER(COALESCE(status, '')) IN ('done', 'completed', 'selesai')
         ) AS is_teacher_done
       FROM course_sessions
       WHERE id = $1
       LIMIT 1`,
      [sessionId]
    );

    if (sessionRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Jadwal sesi tidak ditemukan' },
        { status: 404 }
      );
    }

    const isTeacherDone = Boolean(sessionRes.rows[0].is_teacher_done);

    const existingRes = await pool.query(
      `SELECT id, COALESCE(xp_earned, 0)::int AS xp_earned
       FROM session_student_completions
       WHERE session_id = $1 AND student_id = $2
       LIMIT 1`,
      [sessionId, studentId]
    );

    const existingRow = existingRes.rows[0] || null;
    const action = String(body?.action || '').trim().toLowerCase();

    if (action === 'claim_xp') {
      if (!existingRow) {
        return NextResponse.json(
          {
            error:
              'Kamu tidak menyelesaikan kelas ini sebelum instruktur menutup sesi, sehingga tidak mendapatkan EXP.',
          },
          { status: 403 }
        );
      }

      const nextXp =
        Number(existingRow.xp_earned) > 0
          ? Number(existingRow.xp_earned)
          : SESSION_XP_REWARD;

      await pool.query(
        `UPDATE session_student_completions
         SET xp_earned = $1
         WHERE session_id = $2 AND student_id = $3`,
        [nextXp, sessionId, studentId]
      );

      const summaryRes = await pool.query(
        `SELECT
           COUNT(*)::int AS completed_count,
           COALESCE(SUM(xp_earned), 0)::int AS total_session_xp
         FROM session_student_completions
         WHERE student_id = $1`,
        [studentId]
      );

      return NextResponse.json({
        studentId,
        sessionId,
        isCompleted: true,
        xpEarned: nextXp,
        isXpClaimed: true,
        completedSessionsCount: Number(
          summaryRes.rows[0]?.completed_count ?? 0
        ),
        totalSessionXp: Number(summaryRes.rows[0]?.total_session_xp ?? 0),
      });
    }

    // Aksi menandai selesai sebelum kelas ditutup instruktur
    if (!existingRow && isTeacherDone) {
      return NextResponse.json(
        {
          error:
            'Kelas ini sudah selesai oleh instruktur. Kamu tidak dapat lagi mengikuti kelas atau mendapatkan EXP.',
        },
        { status: 403 }
      );
    }

    if (!existingRow) {
      await pool.query(
        `INSERT INTO session_student_completions (session_id, student_id, xp_earned)
         VALUES ($1, $2, 0)
         ON CONFLICT (session_id, student_id) DO NOTHING`,
        [sessionId, studentId]
      );
    }

    const updatedRowRes = await pool.query(
      `SELECT COALESCE(xp_earned, 0)::int AS xp_earned
       FROM session_student_completions
       WHERE session_id = $1 AND student_id = $2
       LIMIT 1`,
      [sessionId, studentId]
    );

    const currentXp = Number(updatedRowRes.rows[0]?.xp_earned ?? 0);

    const summaryRes = await pool.query(
      `SELECT
         COUNT(*)::int AS completed_count,
         COALESCE(SUM(xp_earned), 0)::int AS total_session_xp
       FROM session_student_completions
       WHERE student_id = $1`,
      [studentId]
    );

    return NextResponse.json({
      studentId,
      sessionId,
      isCompleted: true,
      xpEarned: currentXp,
      isXpClaimed: currentXp > 0,
      completedSessionsCount: Number(
        summaryRes.rows[0]?.completed_count ?? 0
      ),
      totalSessionXp: Number(summaryRes.rows[0]?.total_session_xp ?? 0),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Gagal memperbarui status sesi' },
      { status: 500 }
    );
  }
}