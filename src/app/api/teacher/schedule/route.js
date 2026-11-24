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

function isPlaceholderTeacherName(name) {
  const clean = String(name || '').trim().toLowerCase();
  return (
    !clean ||
    clean === 'instructor' ||
    clean === 'in' ||
    clean === 'teacher' ||
    clean === 'instructor baker atelier' ||
    clean === 'master baker atelier'
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

async function resolveTeacher(pool, explicitId, teacherName) {
  const cleanName = !isPlaceholderTeacherName(teacherName)
    ? String(teacherName).trim()
    : '';

  if (cleanName && pool) {
    const exactRes = await pool
      .query(
        `SELECT id, full_name, email, specialty
         FROM users
         WHERE LOWER(COALESCE(role, '')) IN ('teacher', 'instructor')
           AND (
             LOWER(TRIM(COALESCE(full_name, ''))) = LOWER($1)
             OR LOWER(TRIM(COALESCE(email, ''))) = LOWER($1)
           )
         ORDER BY id ASC LIMIT 1`,
        [cleanName]
      )
      .catch(() => null);

    if (exactRes?.rows?.[0]) return exactRes.rows[0];

    const prefixRes = await pool
      .query(
        `SELECT id, full_name, email, specialty
         FROM users
         WHERE LOWER(COALESCE(role, '')) IN ('teacher', 'instructor')
           AND (
             SPLIT_PART(LOWER(TRIM(COALESCE(full_name, ''))), ' ', 1) = LOWER($1)
             OR LOWER(TRIM(COALESCE(full_name, ''))) LIKE LOWER($1 || ' %')
           )
         ORDER BY id ASC LIMIT 1`,
        [cleanName]
      )
      .catch(() => null);

    if (prefixRes?.rows?.[0]) return prefixRes.rows[0];
  }

  const directId = parseIntOrNull(explicitId);
  if (directId && pool) {
    const idRes = await pool
      .query(
        `SELECT id, full_name, email, specialty
         FROM users
         WHERE id = $1
           AND LOWER(COALESCE(role, '')) IN ('teacher', 'instructor')
         LIMIT 1`,
        [directId]
      )
      .catch(() => null);
    if (idRes?.rows?.[0]) return idRes.rows[0];
  }

  const cookieUser = await readYugyoUserCookie();
  const cookieRole = String(cookieUser?.role || '').trim().toLowerCase();
  if (cookieRole === 'teacher' || cookieRole === 'instructor') {
    const cookieId = parseIntOrNull(
      cookieUser?.id ?? cookieUser?.userId ?? cookieUser?.user_id
    );
    if (cookieId && pool) {
      const cRes = await pool
        .query(
          `SELECT id, full_name, email, specialty
           FROM users
           WHERE id = $1
             AND LOWER(COALESCE(role, '')) IN ('teacher', 'instructor')
           LIMIT 1`,
          [cookieId]
        )
        .catch(() => null);
      if (cRes?.rows?.[0]) return cRes.rows[0];
    }
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
    const teacher = await resolveTeacher(
      pool,
      searchParams.get('teacherId') ?? searchParams.get('instructorId'),
      searchParams.get('teacherName') ?? searchParams.get('instructorName')
    );

    if (!teacher) {
      return NextResponse.json({
        teacher: null,
        courses: [],
        sessions: [],
        participants: [],
      });
    }

    const coursesRes = await pool.query(
      `SELECT
         c.id,
         c.title,
         COALESCE(cat.name, '') AS category_name
       FROM courses c
       LEFT JOIN categories cat ON cat.id = c.category_id
       WHERE c.instructor_id = $1
         AND (
           NULLIF(TRIM(COALESCE($2, '')), '') IS NULL
           OR LOWER(TRIM(COALESCE(cat.name, ''))) = LOWER(TRIM($2))
         )
       ORDER BY c.id ASC`,
      [teacher.id, teacher.specialty || '']
    );

    const sessionsRes = await pool.query(
      `SELECT
         cs.id,
         cs.course_id,
         cs.title,
         cs.notes,
         TO_CHAR(cs.session_date, 'YYYY-MM-DD') AS session_date,
         cs.session_time,
         cs.location_label,
         cs.status,
         COALESCE(cs.is_done, FALSE) AS is_done,
         c.title AS course_title,
         COALESCE(cat.name, '') AS category_name
       FROM course_sessions cs
       INNER JOIN courses c ON c.id = cs.course_id
       LEFT JOIN categories cat ON cat.id = c.category_id
       WHERE c.instructor_id = $1
         AND (
           NULLIF(TRIM(COALESCE($2, '')), '') IS NULL
           OR LOWER(TRIM(COALESCE(cat.name, ''))) = LOWER(TRIM($2))
         )
         AND LOWER(COALESCE(cs.status, 'scheduled')) <> 'canceled'
       ORDER BY cs.session_date ASC, cs.session_time ASC, cs.id ASC`,
      [teacher.id, teacher.specialty || '']
    );

    // Dikelompokkan per siswa unik tanpa nama kursus, menghitung total progres kelas/sesi
    const participantsRes = await pool.query(
      `SELECT
         u.id AS student_id,
         u.full_name AS student_name,
         u.email AS student_email,
         COALESCE(SUM(course_stats.total_sessions), 0)::int AS total_sessions,
         COALESCE(SUM(course_stats.done_sessions), 0)::int AS completed_sessions
       FROM student_enrollments se
       INNER JOIN users u
         ON u.id = se.student_id
         AND LOWER(COALESCE(u.role, '')) = 'student'
       INNER JOIN courses c
         ON c.id = se.course_id
         AND c.instructor_id = $1
       LEFT JOIN categories cat ON cat.id = c.category_id
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*)::int AS total_sessions,
           COUNT(*) FILTER (
             WHERE COALESCE(cs.is_done, FALSE)
                OR LOWER(COALESCE(cs.status, '')) IN ('done', 'completed', 'selesai')
                OR EXISTS (
                  SELECT 1 FROM session_student_completions ssc
                  WHERE ssc.session_id = cs.id AND ssc.student_id = u.id
                )
           )::int AS done_sessions
         FROM course_sessions cs
         WHERE cs.course_id = c.id
           AND LOWER(COALESCE(cs.status, 'scheduled')) <> 'canceled'
       ) course_stats ON TRUE
       WHERE LOWER(COALESCE(se.status, 'active')) <> 'dropped'
         AND (
           NULLIF(TRIM(COALESCE($2, '')), '') IS NULL
           OR LOWER(TRIM(COALESCE(cat.name, ''))) = LOWER(TRIM($2))
         )
       GROUP BY u.id, u.full_name, u.email
       ORDER BY u.full_name ASC`,
      [teacher.id, teacher.specialty || '']
    );

    return NextResponse.json({
      teacher,
      courses: coursesRes.rows || [],
      sessions: sessionsRes.rows || [],
      participants: participantsRes.rows || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Gagal memuat jadwal dan partisipan instruktur' },
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
    const title = String(body?.title || '').trim();
    const sessionDate = String(
      body?.sessionDate ?? body?.session_date ?? ''
    ).slice(0, 10);
    const sessionTime = String(
      body?.sessionTime ?? body?.session_time ?? '15:00 WITA'
    ).trim();
    const locationLabel = String(
      body?.locationLabel ?? body?.location_label ?? 'Atelier Live'
    ).trim();
    const notes = String(body?.notes || '').trim();

    if (!courseId || !title || !sessionDate) {
      return NextResponse.json(
        { error: 'Kursus, judul sesi, dan tanggal wajib diisi' },
        { status: 400 }
      );
    }

    const insertRes = await pool.query(
      `INSERT INTO course_sessions
         (course_id, title, notes, session_date, session_time, location_label, status, is_done)
       VALUES ($1, $2, $3, $4::date, $5, $6, 'scheduled', FALSE)
       RETURNING id`,
      [courseId, title, notes || null, sessionDate, sessionTime, locationLabel]
    );

    return NextResponse.json({
      id: insertRes.rows[0]?.id,
      message: 'Sesi berhasil ditambahkan',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Gagal menambahkan sesi baru' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const pool = await getDbPool();
    if (!pool) {
      return NextResponse.json(
        { error: 'Koneksi database tidak tersedia' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const sessionId = parseIntOrNull(body?.sessionId ?? body?.id);
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId tidak valid' },
        { status: 400 }
      );
    }

    const currentRes = await pool.query(
      `SELECT COALESCE(is_done, FALSE) AS is_done
       FROM course_sessions
       WHERE id = $1
       LIMIT 1`,
      [sessionId]
    );

    if (currentRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Sesi tidak ditemukan' },
        { status: 404 }
      );
    }

    const nextDone =
      typeof body?.isDone === 'boolean'
        ? body.isDone
        : !Boolean(currentRes.rows[0].is_done);

    await pool.query(
      `UPDATE course_sessions
       SET is_done = $1,
           status = $2,
           completed_at = CASE WHEN $1 THEN CURRENT_TIMESTAMP ELSE NULL END
       WHERE id = $3`,
      [nextDone, nextDone ? 'done' : 'scheduled', sessionId]
    );

    return NextResponse.json({
      sessionId,
      isDone: nextDone,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Gagal memperbarui status sesi' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const pool = await getDbPool();
    if (!pool) {
      return NextResponse.json(
        { error: 'Koneksi database tidak tersedia' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = parseIntOrNull(
      searchParams.get('sessionId') ?? searchParams.get('id')
    );

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId tidak valid' },
        { status: 400 }
      );
    }

    await pool.query(`DELETE FROM course_sessions WHERE id = $1`, [sessionId]);

    return NextResponse.json({ deletedId: sessionId });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Gagal menghapus sesi' },
      { status: 500 }
    );
  }
}