import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import pool from '@/lib/db';

async function getAuthenticatedTeacher() {
  const cookieStore = await cookies();
  const rawId = cookieStore.get('yugyo_user_id')?.value;

  if (rawId && Number.isInteger(Number(rawId)) && Number(rawId) > 0) {
    const res = await pool.query(
      "SELECT id, full_name, email, role, status, specialty FROM users WHERE id = $1 AND role = 'teacher' LIMIT 1;",
      [Number(rawId)]
    );
    if (res.rows.length > 0) {
      return res.rows[0];
    }
  }

  const fallback = await pool.query(
    "SELECT id, full_name, email, role, status, specialty FROM users WHERE role = 'teacher' ORDER BY id ASC LIMIT 1;"
  );
  return fallback.rows[0] || null;
}

function isPendingStatus(status) {
  return String(status || '').trim().toLowerCase() === 'pending';
}

function isThreadForTeacher(thread, teacher) {
  if (!teacher?.id || isPendingStatus(teacher.status)) return false;

  const teacherId = Number(teacher.id);
  const teacherName = String(teacher.full_name || '').trim().toLowerCase();
  const firstName = teacherName.split(/\s+/).filter(Boolean)[0] || '';

  const targetIdRaw =
    thread?.instructor_id ?? thread?.teacher_id ?? thread?.recipient_id ?? null;
  if (targetIdRaw != null && Number(targetIdRaw) > 0) {
    return Number(targetIdRaw) === teacherId;
  }

  const targetName = String(
    thread?.instructor_name ?? thread?.teacher_name ?? ''
  )
    .trim()
    .toLowerCase();
  if (targetName && teacherName) {
    const targetFirst = targetName.split(/\s+/).filter(Boolean)[0] || '';
    if (targetName !== teacherName && (!firstName || targetFirst !== firstName)) {
      return false;
    }
  }

  const text = `${thread?.subject || ''} ${thread?.last_message || ''} ${
    thread?.first_message || ''
  }`.toLowerCase();
  const match = text.match(/\b(?:chef|guru|kak|ustadz(?:ah)?)\s+([a-z]+)/i);
  if (match && match[1] && teacherName) {
    const mentioned = match[1].trim().toLowerCase();
    if (
      mentioned !== firstName &&
      !teacherName.includes(mentioned) &&
      !mentioned.includes(firstName)
    ) {
      return false;
    }
  }

  return true;
}

export async function GET(request) {
  try {
    const teacher = await getAuthenticatedTeacher();
    if (!teacher) {
      return NextResponse.json({ success: true, threads: [], messages: [] });
    }

    if (isPendingStatus(teacher.status)) {
      return NextResponse.json({
        success: true,
        threads: [],
        messages: [],
        blockedByPending: true,
        message: 'Akun guru masih berstatus pending sehingga tidak dapat menerima chat dari siswa.',
      });
    }

    const res = await pool.query(
      `SELECT
        t.*,
        to_jsonb(t)->>'instructor_id' AS instructor_id,
        to_jsonb(t)->>'teacher_id' AS teacher_id,
        to_jsonb(t)->>'recipient_id' AS recipient_id,
        COALESCE(
          to_jsonb(t)->>'instructor_name',
          to_jsonb(t)->>'teacher_name',
          u_inst.full_name,
          $1
        ) AS instructor_name,
        COALESCE(to_jsonb(t)->>'course_title', 'Kelas Atelier') AS course_title,
        u_student.full_name AS student_name,
        u_student.email AS student_email
       FROM chat_threads t
       LEFT JOIN users u_student
         ON u_student.id = NULLIF(to_jsonb(t)->>'student_id', '')::int
       LEFT JOIN users u_inst
         ON u_inst.id = COALESCE(
           NULLIF(to_jsonb(t)->>'instructor_id', '')::int,
           NULLIF(to_jsonb(t)->>'teacher_id', '')::int
         )
       ORDER BY t.id DESC;`,
      [teacher.full_name || '']
    );

    const threads = (res.rows || []).filter((row) => isThreadForTeacher(row, teacher));
    const { searchParams } = new URL(request.url);
    const requestedThreadId = Number(searchParams.get('thread_id'));
    const activeThread =
      threads.find((t) => Number(t.id) === requestedThreadId) || threads[0] || null;

    let messages = [];
    if (activeThread?.id) {
      const msgRes = await pool.query(
        'SELECT * FROM chat_messages WHERE thread_id = $1 ORDER BY id ASC;',
        [activeThread.id]
      );
      messages = msgRes.rows || [];
    }

    return NextResponse.json({
      success: true,
      teacher: { id: teacher.id, full_name: teacher.full_name },
      threads,
      activeThread,
      messages,
    });
  } catch (err) {
    console.error('Error GET /api/teacher/chats:', err);
    return NextResponse.json(
      { message: `Gagal memuat chat guru: ${err?.message || 'Kesalahan server.'}` },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const senderRole = String(body?.sender_role || '').trim().toLowerCase();
    const threadId = body?.thread_id ? Number(body.thread_id) : null;
    const messageText =
      typeof body?.message === 'string'
        ? body.message.trim()
        : typeof body?.text === 'string'
        ? body.text.trim()
        : '';

    if (!messageText) {
      return NextResponse.json(
        { message: 'Pesan tidak boleh kosong.' },
        { status: 400 }
      );
    }

    if (senderRole === 'teacher') {
      const teacher = await getAuthenticatedTeacher();
      if (!teacher || isPendingStatus(teacher.status)) {
        return NextResponse.json(
          {
            message:
              'Akun guru masih berstatus pending sehingga belum dapat menerima atau membalas chat.',
          },
          { status: 403 }
        );
      }

      if (!threadId) {
        return NextResponse.json(
          { message: 'ID diskusi tidak valid.' },
          { status: 400 }
        );
      }

      const threadRes = await pool.query(
        `SELECT
          t.*,
          to_jsonb(t)->>'instructor_id' AS instructor_id,
          to_jsonb(t)->>'teacher_id' AS teacher_id,
          COALESCE(to_jsonb(t)->>'instructor_name', to_jsonb(t)->>'teacher_name', u_inst.full_name) AS instructor_name
         FROM chat_threads t
         LEFT JOIN users u_inst
           ON u_inst.id = COALESCE(
             NULLIF(to_jsonb(t)->>'instructor_id', '')::int,
             NULLIF(to_jsonb(t)->>'teacher_id', '')::int
           )
         WHERE t.id = $1
         LIMIT 1;`,
        [threadId]
      );

      const threadRow = threadRes.rows[0];
      if (!threadRow || !isThreadForTeacher(threadRow, teacher)) {
        return NextResponse.json(
          { message: 'Diskusi ini bukan ditujukan untuk akun guru yang sedang login.' },
          { status: 403 }
        );
      }

      const insertedMsg = await pool.query(
        `INSERT INTO chat_messages (thread_id, sender_id, sender_role, message)
         VALUES ($1, $2, 'teacher', $3)
         RETURNING *;`,
        [threadId, teacher.id, messageText]
      );

      await pool.query(
        'UPDATE chat_threads SET last_message = $1 WHERE id = $2;',
        [messageText, threadId]
      );

      revalidatePath('/dashboard/teacher/chats');
      return NextResponse.json(
        { success: true, message: insertedMsg.rows[0] },
        { status: 201 }
      );
    }

    // Siswa mengirim pertanyaan ke guru tujuan
    const studentId = body?.student_id ? Number(body.student_id) : null;
    const requestedTeacherId =
      body?.instructor_id || body?.teacher_id || body?.recipient_id || null;

    if (!requestedTeacherId) {
      return NextResponse.json(
        { message: 'Guru tujuan pertanyaan wajib dipilih.' },
        { status: 400 }
      );
    }

    const teacherRes = await pool.query(
      "SELECT id, full_name, status FROM users WHERE id = $1 AND role = 'teacher' LIMIT 1;",
      [Number(requestedTeacherId)]
    );
    const targetTeacher = teacherRes.rows[0];

    if (!targetTeacher) {
      return NextResponse.json(
        { message: 'Akun guru tujuan tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (isPendingStatus(targetTeacher.status)) {
      return NextResponse.json(
        {
          message: `Guru ${targetTeacher.full_name} masih berstatus pending sehingga belum dapat menerima chat dari siswa.`,
        },
        { status: 403 }
      );
    }

    let activeThreadId = threadId;
    if (!activeThreadId) {
      const insertedThread = await pool.query(
        `INSERT INTO chat_threads (student_id, instructor_id, subject, last_message, status)
         VALUES ($1, $2, $3, $4, 'open')
         RETURNING *;`,
        [
          studentId,
          targetTeacher.id,
          body?.subject?.trim() || `Pertanyaan untuk ${targetTeacher.full_name}`,
          messageText,
        ]
      );
      activeThreadId = insertedThread.rows[0].id;
    } else {
      await pool.query(
        'UPDATE chat_threads SET last_message = $1 WHERE id = $2;',
        [messageText, activeThreadId]
      );
    }

    const insertedStudentMsg = await pool.query(
      `INSERT INTO chat_messages (thread_id, sender_id, sender_role, message)
       VALUES ($1, $2, 'student', $3)
       RETURNING *;`,
      [activeThreadId, studentId, messageText]
    );

    revalidatePath('/dashboard/teacher/chats');

    return NextResponse.json(
      {
        success: true,
        thread_id: activeThreadId,
        target_teacher: {
          id: targetTeacher.id,
          full_name: targetTeacher.full_name,
        },
        message: insertedStudentMsg.rows[0],
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error POST /api/teacher/chats:', err);
    return NextResponse.json(
      { message: `Gagal mengirim pesan: ${err?.message || 'Kesalahan server.'}` },
      { status: 500 }
    );
  }
}