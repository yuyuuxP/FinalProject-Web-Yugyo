import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import pool from '@/lib/db';
import { rejectPendingTeacherAction } from '@/lib/teacher-access';

function formatTimeLabel(date = new Date()) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export async function POST(request) {
  try {
    const pendingResponse = await rejectPendingTeacherAction();
    if (pendingResponse) return pendingResponse;

    const reqBody = await request.json();
    const threadId = Number(reqBody?.thread_id);
    const senderRole = reqBody?.sender_role === 'student' ? 'student' : 'teacher';
    const rawBody = typeof reqBody?.body === 'string' ? reqBody.body.trim() : '';
    const imageUrl = typeof reqBody?.image_url === 'string' && reqBody.image_url.trim()
      ? reqBody.image_url.trim()
      : null;
    const imageCaption = typeof reqBody?.image_caption === 'string' && reqBody.image_caption.trim()
      ? reqBody.image_caption.trim()
      : null;
    const isFormulaCard = Boolean(reqBody?.is_formula_card);
    const formulaTitle = typeof reqBody?.formula_title === 'string'
      ? reqBody.formula_title.trim()
      : null;
    const formulaSubtitle = typeof reqBody?.formula_subtitle === 'string'
      ? reqBody.formula_subtitle.trim()
      : null;

    if (!threadId) {
      return NextResponse.json({ message: 'thread_id wajib diisi.' }, { status: 400 });
    }

    if (!rawBody && !imageUrl && !isFormulaCard) {
      return NextResponse.json({ message: 'Isi pesan tidak boleh kosong.' }, { status: 400 });
    }

    const threadRes = await pool.query('SELECT * FROM chat_threads WHERE id = $1;', [threadId]);
    if (threadRes.rows.length === 0) {
      return NextResponse.json({ message: 'Thread chat tidak ditemukan.' }, { status: 404 });
    }

    const currentThread = threadRes.rows[0];
    const senderName =
      typeof reqBody?.sender_name === 'string' && reqBody.sender_name.trim()
        ? reqBody.sender_name.trim()
        : senderRole === 'student'
        ? currentThread.student_name
        : 'Chef Ayu (Anda)';

    const finalBody =
      rawBody ||
      (isFormulaCard ? formulaTitle || 'Formula Baking' : imageCaption || 'Lampiran foto');
    const timeLabel = formatTimeLabel();

    const insertRes = await pool.query(
      `INSERT INTO chat_messages (
        thread_id, sender_role, sender_name, time_label, body,
        image_url, image_caption, is_formula_card, formula_title, formula_subtitle, is_read
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;`,
      [
        threadId,
        senderRole,
        senderName,
        timeLabel,
        finalBody,
        imageUrl,
        imageCaption,
        isFormulaCard,
        formulaTitle,
        formulaSubtitle,
        senderRole === 'teacher',
      ]
    );

    const previewText = `"${finalBody.slice(0, 46)}${finalBody.length > 46 ? '...' : ''}"`;

    const updatedThreadRes =
      senderRole === 'student'
        ? await pool.query(
            `UPDATE chat_threads
             SET review_status = 'pending_review',
                 unread_count = unread_count + 1,
                 last_preview = $1,
                 last_time_label = 'Baru saja',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *;`,
            [previewText, threadId]
          )
        : await pool.query(
            `UPDATE chat_threads
             SET review_status = 'answered',
                 unread_count = 0,
                 last_preview = $1,
                 last_time_label = 'Baru saja',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *;`,
            [previewText, threadId]
          );

    revalidatePath('/dashboard/teacher/chats');
    revalidatePath('/dashboard/admin/chats');

    return NextResponse.json({
      success: true,
      message: insertRes.rows[0],
      thread: updatedThreadRes.rows[0],
    });
  } catch (err) {
    console.error('POST /api/chat/messages error:', err);
    return NextResponse.json(
      { message: `Gagal menyimpan pesan: ${err?.message || 'Kesalahan server.'}` },
      { status: 500 }
    );
  }
}