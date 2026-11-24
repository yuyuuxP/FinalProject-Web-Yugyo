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
    const studentId = await resolveStudentId(
      pool,
      searchParams.get('studentId') ?? searchParams.get('student_id'),
      searchParams.get('studentName') ?? searchParams.get('student_name')
    );

    if (!studentId) {
      return NextResponse.json({
        studentId: null,
        sessions: [],
      });
    }

    const sessionsRes = await pool.query(
      `WITH ranked_sessions AS (
         SELECT
           cs.id,
           cs.course_id,
           cs.title,
           cs.notes,
           TO_CHAR(cs.session_date, 'YYYY-MM-DD') AS session_date,
           COALESCE(NULLIF(TRIM(cs.session_time), ''), '14:00 WITA') AS session_time,
           COALESCE(NULLIF(TRIM(cs.location_label), ''), 'Atelier Live') AS location_label,
           COALESCE(cs.status, 'scheduled') AS status,
           (
             COALESCE(cs.is_done, FALSE)
             OR LOWER(COALESCE(cs.status, '')) IN ('done', 'completed', 'selesai')
           ) AS is_teacher_done,
           TO_CHAR(cs.completed_at, 'DD-MM-YYYY HH24:MI') AS teacher_completed_at,
           ROW_NUMBER() OVER (
             PARTITION BY cs.course_id
             ORDER BY cs.session_date ASC, cs.session_time ASC, cs.id ASC
           )::int AS session_number
         FROM course_sessions cs
         WHERE LOWER(COALESCE(cs.status, 'scheduled')) <> 'canceled'
       )
       SELECT
         rs.id,
         rs.course_id,
         rs.title,
         rs.notes,
         rs.session_date,
         rs.session_time,
         rs.location_label,
         rs.status,
         rs.is_teacher_done,
         rs.teacher_completed_at,
         rs.session_number,
         c.title AS course_title,
         c.thumbnail_url,
         c.video_url,
         COALESCE(cat.name, 'Atelier Class') AS category_name,
         COALESCE(u_inst.full_name, 'Instruktur Atelier') AS instructor_name,
         COALESCE(ssc.session_id IS NOT NULL, FALSE) AS is_completed,
         COALESCE(ssc.xp_earned, 0)::int AS xp_earned,
         (ssc.session_id IS NOT NULL AND COALESCE(ssc.xp_earned, 0) > 0) AS is_xp_claimed,
         ssc.notes AS student_notes,
         ssc.marked_done_at
       FROM ranked_sessions rs
       INNER JOIN student_enrollments se
         ON se.course_id = rs.course_id
         AND se.student_id = $1
         AND LOWER(COALESCE(se.status, 'active')) <> 'dropped'
       INNER JOIN courses c ON c.id = rs.course_id
       LEFT JOIN categories cat ON cat.id = c.category_id
       LEFT JOIN users u_inst ON u_inst.id = c.instructor_id
       LEFT JOIN session_student_completions ssc
         ON ssc.session_id = rs.id AND ssc.student_id = $1
       ORDER BY rs.session_date ASC, rs.session_time ASC, rs.id ASC;`,
      [studentId]
    );

    return NextResponse.json({
      studentId,
      sessions: sessionsRes.rows || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Gagal memuat jadwal sesi student' },
      { status: 500 }
    );
  }
}