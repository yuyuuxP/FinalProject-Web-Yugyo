import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { isTeacherPending } from '@/lib/teacher-status';

async function resolveTeacherId() {
  const cookieStore = await cookies();
  const rawId = cookieStore.get('yugyo_user_id')?.value;
  if (rawId && Number.isInteger(Number(rawId)) && Number(rawId) > 0) {
    return Number(rawId);
  }
  const res = await pool.query(
    "SELECT id FROM users WHERE role = 'teacher' ORDER BY id ASC LIMIT 1;"
  );
  return res.rows[0]?.id ? Number(res.rows[0].id) : null;
}

async function getTeacherRecord(teacherId) {
  if (!teacherId) return null;
  const res = await pool.query(
    "SELECT id, full_name, status FROM users WHERE id = $1 AND role = 'teacher' LIMIT 1;",
    [teacherId]
  );
  return res.rows[0] || null;
}

function revalidateSchedulePaths() {
  revalidatePath('/dashboard/teacher/schedule');
  revalidatePath('/dashboard/teacher');
  revalidatePath('/dashboard/admin/schedule');
  revalidatePath('/dashboard/admin');
}

export async function GET() {
  try {
    const teacherId = await resolveTeacherId();
    if (!teacherId) {
      return NextResponse.json({ success: true, sessions: [] });
    }

    const teacherRecord = await getTeacherRecord(teacherId);
    if (!teacherRecord || isTeacherPending(teacherRecord.status)) {
      return NextResponse.json({
        success: true,
        sessions: [],
        blockedByPending: true,
        message: 'Akun guru masih berstatus pending sehingga tidak dapat menerima schedule.',
      });
    }

    const res = await pool.query(
      `SELECT
        cs.*,
        c.title AS course_title,
        COALESCE(inst.full_name, u.full_name) AS instructor_name
       FROM course_sessions cs
       LEFT JOIN courses c ON c.id = cs.course_id
       LEFT JOIN users inst ON inst.id = cs.instructor_id
       LEFT JOIN users u ON u.id = c.instructor_id
       WHERE COALESCE(cs.instructor_id, c.instructor_id) = $1
       ORDER BY cs.session_date ASC, cs.id ASC;`,
      [teacherId]
    );

    return NextResponse.json({ success: true, sessions: res.rows || [] });
  } catch (err) {
    console.error('Error fetching teacher sessions:', err);
    return NextResponse.json(
      { message: `Gagal memuat jadwal sesi: ${err?.message || 'Kesalahan server.'}` },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const teacherId = await resolveTeacherId();
    const teacherRecord = await getTeacherRecord(teacherId);
    if (!teacherRecord || isTeacherPending(teacherRecord.status)) {
      return NextResponse.json(
        {
          message:
            'Akun guru masih berstatus pending. Tidak dapat membuat atau menerima schedule sebelum diaktifkan admin.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const courseId = Number(body?.course_id);
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const notes = typeof body?.notes === 'string' ? body.notes.trim() : '';
    const sessionDate = typeof body?.session_date === 'string' ? body.session_date.trim() : '';
    const sessionTime =
      typeof body?.session_time === 'string' && body.session_time.trim()
        ? body.session_time.trim()
        : '14:00 WITA';
    const locationLabel =
      typeof body?.location_label === 'string' && body.location_label.trim()
        ? body.location_label.trim()
        : 'Atelier Live';
    const isPopup = Boolean(body?.is_popup);

    if (!courseId || Number.isNaN(courseId)) {
      return NextResponse.json(
        { message: 'Pilih kursus terlebih dahulu.' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { message: 'Judul sesi kelas wajib diisi.' },
        { status: 400 }
      );
    }

    if (!sessionDate) {
      return NextResponse.json(
        { message: 'Tanggal sesi kelas wajib diisi.' },
        { status: 400 }
      );
    }

    const courseOwnerRes = await pool.query(
      'SELECT id FROM courses WHERE id = $1 AND instructor_id = $2 LIMIT 1;',
      [courseId, teacherId]
    );
    if (courseOwnerRes.rows.length === 0) {
      return NextResponse.json(
        { message: 'Kursus tidak ditemukan atau bukan milik pengajar yang sedang login.' },
        { status: 403 }
      );
    }

    const inserted = await pool.query(
      `INSERT INTO course_sessions (
        course_id,
        instructor_id,
        title,
        notes,
        session_date,
        session_time,
        location_label,
        is_popup,
        is_done,
        status
      )
      VALUES ($1, $2, $3, $4, $5::date, $6, $7, $8, FALSE, 'scheduled')
      RETURNING *;`,
      [courseId, teacherId, title, notes || null, sessionDate, sessionTime, locationLabel, isPopup]
    );

    revalidateSchedulePaths();

    return NextResponse.json({ success: true, session: inserted.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Error creating teacher session:', err);
    return NextResponse.json(
      { message: `Gagal membuat jadwal sesi: ${err?.message || 'Kesalahan server.'}` },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const teacherId = await resolveTeacherId();
    const teacherRecord = await getTeacherRecord(teacherId);
    if (!teacherRecord || isTeacherPending(teacherRecord.status)) {
      return NextResponse.json(
        { message: 'Akun guru masih berstatus pending sehingga tidak dapat mengubah schedule.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const sessionId = Number(body?.session_id);
    const action =
      body?.action === 'cancel'
        ? 'cancel'
        : body?.action === 'unmark_done'
        ? 'unmark_done'
        : 'mark_done';

    if (!sessionId || Number.isNaN(sessionId)) {
      return NextResponse.json(
        { message: 'ID sesi tidak valid.' },
        { status: 400 }
      );
    }

    const sessionRes = await pool.query(
      'SELECT id, course_id, is_done, status FROM course_sessions WHERE id = $1;',
      [sessionId]
    );

    if (sessionRes.rows.length === 0) {
      return NextResponse.json(
        { message: 'Sesi kelas tidak ditemukan.' },
        { status: 404 }
      );
    }

    const sessionRow = sessionRes.rows[0];
    const currentStatus =
      sessionRow.status || (sessionRow.is_done ? 'completed' : 'scheduled');

    if (action === 'cancel') {
      if (currentStatus === 'completed' || sessionRow.is_done) {
        return NextResponse.json(
          { message: 'Kelas yang sudah ditandai selesai (Mark as Done) tidak dapat dibatalkan.' },
          { status: 400 }
        );
      }

      const updatedCancel = await pool.query(
        `UPDATE course_sessions
         SET status = 'canceled', is_done = FALSE, completed_at = NULL
         WHERE id = $1
         RETURNING *;`,
        [sessionId]
      );

      revalidateSchedulePaths();

      return NextResponse.json({
        success: true,
        status: 'canceled',
        session: updatedCancel.rows[0],
        message: 'Kelas berhasil diubah menjadi berstatus Dibatalkan (canceled).',
      });
    }

    if (action === 'unmark_done') {
      const updatedReopen = await pool.query(
        `UPDATE course_sessions
         SET is_done = FALSE,
             status = 'scheduled',
             completed_at = NULL
         WHERE id = $1
         RETURNING *;`,
        [sessionId]
      );

      try {
        await pool.query(
          'DELETE FROM session_student_completions WHERE session_id = $1;',
          [sessionId]
        );
      } catch (compErr) {
        console.warn('Completion cleanup skipped:', compErr?.message);
      }

      try {
        if (sessionRow.course_id) {
          await pool.query(
            `UPDATE courses
             SET status = 'active'
             WHERE id = $1 AND LOWER(COALESCE(status, '')) = 'completed';`,
            [sessionRow.course_id]
          );
        }
      } catch (courseErr) {
        console.warn('Course active status sync skipped:', courseErr?.message);
      }

      revalidateSchedulePaths();

      return NextResponse.json({
        success: true,
        status: 'scheduled',
        course_status: 'active',
        session: updatedReopen.rows[0],
        message: 'Status Mark as Done dibatalkan dan sesi kembali aktif (scheduled).',
      });
    }

    if (currentStatus === 'canceled') {
      return NextResponse.json(
        { message: 'Kelas yang berstatus Dibatalkan tidak dapat ditandai Mark as Done.' },
        { status: 400 }
      );
    }

    const updatedDone = await pool.query(
      `UPDATE course_sessions
       SET is_done = TRUE,
           status = 'completed',
           completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)
       WHERE id = $1
       RETURNING *;`,
      [sessionId]
    );

    try {
      const enrollments = await pool.query(
        'SELECT student_id FROM student_enrollments WHERE course_id = $1;',
        [sessionRow.course_id]
      );

      for (const row of enrollments.rows) {
        if (row?.student_id) {
          await pool.query(
            `INSERT INTO session_student_completions (session_id, student_id)
             VALUES ($1, $2)
             ON CONFLICT (session_id, student_id) DO NOTHING;`,
            [sessionId, row.student_id]
          );
        }
      }
    } catch (enrollErr) {
      console.warn('Enrollment completion sync skipped:', enrollErr?.message);
    }

    revalidateSchedulePaths();

    return NextResponse.json({
      success: true,
      status: 'completed',
      session: updatedDone.rows[0],
      message: 'Sesi ditandai selesai (Mark as Done) dan progres keaktifan siswa diperbarui.',
    });
  } catch (err) {
    console.error('Error updating session status:', err);
    return NextResponse.json(
      { message: `Gagal memperbarui status sesi: ${err?.message || 'Kesalahan server.'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const teacherId = await resolveTeacherId();
    const teacherRecord = await getTeacherRecord(teacherId);
    if (!teacherRecord || isTeacherPending(teacherRecord.status)) {
      return NextResponse.json(
        { message: 'Akun guru masih berstatus pending sehingga tidak dapat menghapus schedule.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    let sessionId = Number(searchParams.get('session_id'));

    if (!sessionId || Number.isNaN(sessionId)) {
      const body = await request.json().catch(() => ({}));
      sessionId = Number(body?.session_id);
    }

    if (!sessionId || Number.isNaN(sessionId)) {
      return NextResponse.json(
        { message: 'ID sesi tidak valid.' },
        { status: 400 }
      );
    }

    const existingRes = await pool.query(
      'SELECT id, status, is_done FROM course_sessions WHERE id = $1;',
      [sessionId]
    );

    if (existingRes.rows.length === 0) {
      return NextResponse.json(
        { message: 'Sesi kelas tidak ditemukan.' },
        { status: 404 }
      );
    }

    const row = existingRes.rows[0];
    const currentStatus = row.status || (row.is_done ? 'completed' : 'scheduled');

    if (currentStatus !== 'canceled') {
      return NextResponse.json(
        { message: 'Fitur hapus hanya tersedia untuk kelas yang berstatus Dibatalkan (canceled).' },
        { status: 400 }
      );
    }

    await pool.query('DELETE FROM course_sessions WHERE id = $1;', [sessionId]);

    revalidateSchedulePaths();

    return NextResponse.json({
      success: true,
      message: 'Kelas yang dibatalkan berhasil dihapus dari database.',
    });
  } catch (err) {
    console.error('Error deleting canceled session:', err);
    return NextResponse.json(
      { message: `Gagal menghapus kelas: ${err?.message || 'Kesalahan server.'}` },
      { status: 500 }
    );
  }
}