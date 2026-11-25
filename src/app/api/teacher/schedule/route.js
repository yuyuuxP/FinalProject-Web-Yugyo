import { NextResponse } from 'next/server';
import pool from '@/lib/db';

function parseIntOrNull(value) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = parseIntOrNull(searchParams.get('teacherId'));
    const teacherName = searchParams.get('teacherName')?.trim() || '';

    let teacherFilter = null;
    if (teacherId) {
      teacherFilter = teacherId;
    } else if (teacherName) {
      const teacherRes = await pool.query(
        `SELECT id FROM users
         WHERE LOWER(TRIM(full_name)) = LOWER(TRIM($1))
           AND LOWER(TRIM(role)) = 'teacher'
         LIMIT 1`,
        [teacherName]
      );
      teacherFilter = teacherRes.rows[0]?.id ?? null;
    }

    const coursesRes = teacherFilter
      ? await pool.query(
          `SELECT c.id, c.title, COALESCE(cat.name, '') AS category_name
           FROM courses c
           LEFT JOIN categories cat ON cat.id = c.category_id
           WHERE c.instructor_id = $1
           ORDER BY c.id ASC`,
          [teacherFilter]
        )
      : await pool.query(
          `SELECT c.id, c.title, COALESCE(cat.name, '') AS category_name
           FROM courses c
           LEFT JOIN categories cat ON cat.id = c.category_id
           ORDER BY c.id ASC`
        );

    const sessionsRes = teacherFilter
      ? await pool.query(
          `SELECT cs.id, cs.course_id, cs.instructor_id, cs.title, cs.notes,
                  TO_CHAR(cs.session_date, 'YYYY-MM-DD') AS session_date,
                  cs.session_time, cs.location_label, cs.is_popup,
                  COALESCE(cs.status, CASE WHEN cs.is_done THEN 'completed' ELSE 'scheduled' END) AS status,
                  COALESCE(cs.is_done, FALSE) AS is_done,
                  c.title AS course_title
           FROM course_sessions cs
           INNER JOIN courses c ON c.id = cs.course_id
           WHERE c.instructor_id = $1
           ORDER BY cs.session_date ASC, cs.session_time ASC, cs.id ASC`,
          [teacherFilter]
        )
      : await pool.query(
          `SELECT cs.id, cs.course_id, cs.instructor_id, cs.title, cs.notes,
                  TO_CHAR(cs.session_date, 'YYYY-MM-DD') AS session_date,
                  cs.session_time, cs.location_label, cs.is_popup,
                  COALESCE(cs.status, CASE WHEN cs.is_done THEN 'completed' ELSE 'scheduled' END) AS status,
                  COALESCE(cs.is_done, FALSE) AS is_done,
                  c.title AS course_title
           FROM course_sessions cs
           INNER JOIN courses c ON c.id = cs.course_id
           ORDER BY cs.session_date ASC, cs.session_time ASC, cs.id ASC`
        );

    const participantsRes = teacherFilter
      ? await pool.query(
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
            LEFT JOIN LATERAL (
              SELECT
                COUNT(*)::int AS total_sessions,
                COUNT(*) FILTER (
                  WHERE COALESCE(cs.is_done, FALSE)
                     OR LOWER(COALESCE(cs.status, '')) IN ('done', 'completed', 'selesai')
                     OR EXISTS (
                       SELECT 1
                       FROM session_student_completions ssc
                       WHERE ssc.session_id = cs.id
                         AND ssc.student_id = u.id
                     )
                )::int AS done_sessions
              FROM course_sessions cs
              WHERE cs.course_id = c.id
                AND LOWER(COALESCE(cs.status, 'scheduled')) <> 'canceled'
            ) course_stats ON TRUE
            WHERE LOWER(COALESCE(se.status, 'active')) <> 'dropped'
            GROUP BY u.id, u.full_name, u.email
            ORDER BY u.full_name ASC`,
           [teacherFilter]
        )
      : { rows: [] };

    return NextResponse.json({
      courses: coursesRes.rows,
      sessions: sessionsRes.rows,
      participants: participantsRes.rows,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Gagal memuat jadwal sesi' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const courseId = parseIntOrNull(body?.courseId ?? body?.course_id);
    const instructorId = parseIntOrNull(body?.instructorId ?? body?.instructor_id);
    const title = String(body?.title || '').trim();
    const sessionDate = String(body?.sessionDate ?? body?.session_date ?? '').trim().slice(0, 10);
    const sessionTime = String(body?.sessionTime ?? body?.session_time ?? '').trim() || '15:00 WITA';
    const locationLabel = String(body?.locationLabel ?? body?.location_label ?? '').trim() || 'Atelier Live';
    const notes = String(body?.notes || '').trim();
    const isPopup = Boolean(body?.is_popup ?? body?.isPopup);

    if (!courseId || !title || !sessionDate) {
      return NextResponse.json(
        { error: 'Kursus, judul, dan tanggal sesi wajib diisi' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO course_sessions
         (course_id, instructor_id, title, notes, session_date, session_time, location_label, is_popup, is_done, status)
       VALUES ($1, $2, $3, NULLIF($4, ''), $5::date, $6, $7, $8, FALSE, 'scheduled')
       RETURNING id, course_id, instructor_id, title, notes,
                 TO_CHAR(session_date, 'YYYY-MM-DD') AS session_date,
                 session_time, location_label, is_popup, is_done, status`,
      [courseId, instructorId, title, notes, sessionDate, sessionTime, locationLabel, isPopup]
    );

    return NextResponse.json(
      { session: result.rows[0], message: 'Jadwal sesi berhasil ditambahkan' },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Gagal membuat jadwal sesi' },
      { status: 500 }
    );
  }
}

async function updateSession(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const sessionId = parseIntOrNull(body?.sessionId ?? body?.session_id ?? body?.id);
    const courseId = parseIntOrNull(body?.courseId ?? body?.course_id);
    const title = body?.title !== undefined ? String(body.title || '').trim() : null;
    const sessionDate =
      body?.sessionDate !== undefined || body?.session_date !== undefined
        ? String(body?.sessionDate ?? body?.session_date ?? '').slice(0, 10)
        : null;
    const sessionTime =
      body?.sessionTime !== undefined || body?.session_time !== undefined
        ? String(body?.sessionTime ?? body?.session_time ?? '').trim()
        : null;
    const locationLabel =
      body?.locationLabel !== undefined || body?.location_label !== undefined
        ? String(body?.locationLabel ?? body?.location_label ?? '').trim()
        : null;
    const notes =
      body?.notes !== undefined ? String(body.notes || '').trim() : null;
    const instructorId = parseIntOrNull(body?.instructorId ?? body?.instructor_id);
    const isPopup =
      body?.is_popup !== undefined || body?.isPopup !== undefined
        ? Boolean(body?.is_popup ?? body?.isPopup)
        : null;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId tidak valid' },
        { status: 400 }
      );
    }

    if (body?.action) {
      const action = String(body.action);
      let status = null;
      let isDone = null;

      if (action === 'cancel') {
        status = 'canceled';
        isDone = false;
      } else if (action === 'unmark_done') {
        status = 'scheduled';
        isDone = false;
      } else if (action === 'mark_done' || action === 'complete') {
        status = 'completed';
        isDone = true;
      }

      if (status) {
        const actionResult = await pool.query(
          `UPDATE course_sessions
           SET status = $1, is_done = $2, completed_at = CASE WHEN $2 THEN CURRENT_TIMESTAMP ELSE NULL END
           WHERE id = $3
           RETURNING id, course_id, instructor_id, title, notes,
                     TO_CHAR(session_date, 'YYYY-MM-DD') AS session_date,
                     session_time, location_label, is_popup, is_done, status`,
          [status, isDone, sessionId]
        );
        if (actionResult.rows.length === 0) {
          return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 });
        }
        return NextResponse.json({ session: actionResult.rows[0], message: 'Status sesi berhasil diperbarui' });
      }
    }

    if (body?.isDone !== undefined || body?.is_done !== undefined) {
      const isDone = Boolean(body?.isDone ?? body?.is_done);
      const statusResult = await pool.query(
        `UPDATE course_sessions
         SET is_done = $1,
             status = $2,
             completed_at = CASE WHEN $1 THEN CURRENT_TIMESTAMP ELSE NULL END
         WHERE id = $3
         RETURNING id, course_id, instructor_id, title, notes,
                   TO_CHAR(session_date, 'YYYY-MM-DD') AS session_date,
                   session_time, location_label, is_popup, is_done, status`,
        [isDone, isDone ? 'completed' : 'scheduled', sessionId]
      );
      if (statusResult.rows.length === 0) {
        return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 });
      }
      return NextResponse.json({ session: statusResult.rows[0], message: 'Status sesi berhasil diperbarui' });
    }

    const existingRes = await pool.query(
      `SELECT id, course_id, instructor_id, title, notes,
              TO_CHAR(session_date, 'YYYY-MM-DD') AS session_date,
              session_time, location_label, is_popup
       FROM course_sessions
       WHERE id = $1
       LIMIT 1`,
      [sessionId]
    );

    if (existingRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Sesi tidak ditemukan' },
        { status: 404 }
      );
    }

    const current = existingRes.rows[0];
    const nextCourseId = courseId ?? current.course_id;
    const nextTitle = title !== null && title !== '' ? title : current.title;
    const nextSessionDate =
      sessionDate !== null && sessionDate !== ''
        ? sessionDate
        : current.session_date;
    const nextSessionTime =
      sessionTime !== null && sessionTime !== ''
        ? sessionTime
        : current.session_time;
    const nextLocationLabel =
      locationLabel !== null && locationLabel !== ''
        ? locationLabel
        : current.location_label;
    const nextNotes = notes !== null ? notes || null : current.notes;
    const nextInstructorId = instructorId ?? current.instructor_id;
    const nextIsPopup = isPopup !== null ? isPopup : Boolean(current.is_popup);

    const updatedRes = await pool.query(
      `UPDATE course_sessions
       SET course_id = $1,
           title = $2,
           notes = $3,
           session_date = $4::date,
           session_time = $5,
           location_label = $6,
           instructor_id = $7,
           is_popup = $8
       WHERE id = $9
       RETURNING id, course_id, instructor_id, title, notes,
                 TO_CHAR(session_date, 'YYYY-MM-DD') AS session_date,
                 session_time, location_label, is_popup, is_done, status`,
      [
        nextCourseId,
        nextTitle,
        nextNotes,
        nextSessionDate,
        nextSessionTime,
        nextLocationLabel,
        nextInstructorId,
        nextIsPopup,
        sessionId,
      ]
    );

    return NextResponse.json({
      session: updatedRes.rows[0],
      message: 'Sesi berhasil diperbarui',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Gagal memperbarui sesi' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  return updateSession(request);
}

export async function PUT(request) {
  return updateSession(request);
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = parseIntOrNull(
      searchParams.get('sessionId') ?? searchParams.get('session_id')
    );

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId tidak valid' }, { status: 400 });
    }

    const deleted = await pool.query(
      `DELETE FROM course_sessions WHERE id = $1
       RETURNING id`,
      [sessionId]
    );
    if (deleted.rows.length === 0) {
      return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Sesi berhasil dihapus' });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Gagal menghapus sesi' },
      { status: 500 }
    );
  }
}