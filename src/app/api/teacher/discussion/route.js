import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { isTeacherPending } from '@/lib/teacher-status';
import {
  getLoggedInTeacherAccount,
  fetchDiscussionsForTeacher,
} from '@/lib/teacher-chat-scope';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const teacher = await getLoggedInTeacherAccount(cookieStore);

    if (!teacher) {
      return NextResponse.json({ success: true, discussions: [] });
    }

    if (isTeacherPending(teacher.status)) {
      return NextResponse.json({
        success: true,
        discussions: [],
        blockedByPending: true,
        message: 'Akun guru masih berstatus pending sehingga tidak dapat menerima diskusi/chat.',
      });
    }

    const discussions = await fetchDiscussionsForTeacher(teacher);
    return NextResponse.json({
      success: true,
      teacher: { id: teacher.id, full_name: teacher.full_name },
      discussions,
    });
  } catch (err) {
    console.error('Error fetching teacher discussions:', err);
    return NextResponse.json(
      { message: `Gagal memuat diskusi guru: ${err?.message || 'Kesalahan server.'}` },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const studentId = body?.student_id ? Number(body.student_id) : null;
    const courseId = body?.course_id ? Number(body.course_id) : null;
    const requestedTeacherId =
      body?.instructor_id || body?.teacher_id || body?.recipient_id || null;
    const subject =
      typeof body?.subject === 'string' && body.subject.trim()
        ? body.subject.trim()
        : 'Pertanyaan Kelas';
    const messageText =
      typeof body?.message === 'string'
        ? body.message.trim()
        : typeof body?.question === 'string'
        ? body.question.trim()
        : '';

    if (!messageText) {
      return NextResponse.json(
        { message: 'Pertanyaan atau pesan tidak boleh kosong.' },
        { status: 400 }
      );
    }

    let resolvedTeacherId =
      requestedTeacherId &&
      Number.isInteger(Number(requestedTeacherId)) &&
      Number(requestedTeacherId) > 0
        ? Number(requestedTeacherId)
        : null;

    if (!resolvedTeacherId && courseId) {
      const courseRes = await pool.query(
        'SELECT instructor_id FROM courses WHERE id = $1 LIMIT 1;',
        [courseId]
      );
      if (courseRes.rows[0]?.instructor_id) {
        resolvedTeacherId = Number(courseRes.rows[0].instructor_id);
      }
    }

    if (!resolvedTeacherId) {
      return NextResponse.json(
        { message: 'Guru tujuan pertanyaan wajib dipilih.' },
        { status: 400 }
      );
    }

    const teacherRes = await pool.query(
      "SELECT id, full_name, status FROM users WHERE id = $1 AND role = 'teacher' LIMIT 1;",
      [resolvedTeacherId]
    );

    const targetTeacher = teacherRes.rows[0];
    if (!targetTeacher) {
      return NextResponse.json(
        { message: 'Akun guru tujuan tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (isTeacherPending(targetTeacher.status)) {
      return NextResponse.json(
        {
          message: `Guru ${targetTeacher.full_name} masih berstatus pending sehingga belum dapat menerima diskusi atau chat dari siswa.`,
        },
        { status: 403 }
      );
    }

    const insertedThread = await pool.query(
      `INSERT INTO chat_threads (student_id, course_id, instructor_id, subject, last_message, status, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'open', CURRENT_TIMESTAMP)
       RETURNING *;`,
      [studentId, courseId, targetTeacher.id, subject, messageText]
    );

    const createdThread = insertedThread.rows[0];

    try {
      await pool.query(
        `INSERT INTO chat_messages (thread_id, sender_id, sender_role, message)
         VALUES ($1, $2, 'student', $3);`,
        [createdThread.id, studentId, messageText]
      );
    } catch (msgErr) {
      console.warn('Initial chat_messages insert skipped:', msgErr?.message);
    }

    revalidatePath('/dashboard/teacher');
    revalidatePath('/dashboard/teacher/chat');

    return NextResponse.json(
      {
        success: true,
        thread: createdThread,
        target_teacher: {
          id: targetTeacher.id,
          full_name: targetTeacher.full_name,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating student discussion:', err);
    return NextResponse.json(
      { message: `Gagal mengirim pertanyaan: ${err?.message || 'Kesalahan server.'}` },
      { status: 500 }
    );
  }
}