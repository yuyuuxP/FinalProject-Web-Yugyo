import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import pool from '@/lib/db';

async function ensureChatTablesAndSeed() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_threads (
      id SERIAL PRIMARY KEY,
      category VARCHAR(40) NOT NULL DEFAULT 'recipe',
      student_id INTEGER,
      student_name VARCHAR(120) NOT NULL,
      student_avatar TEXT,
      course_title VARCHAR(160) NOT NULL DEFAULT 'French Patisserie & Pastry',
      is_online BOOLEAN NOT NULL DEFAULT TRUE,
      review_status VARCHAR(30) NOT NULL DEFAULT 'pending_review',
      unread_count INTEGER NOT NULL DEFAULT 0,
      last_preview TEXT,
      last_time_label VARCHAR(40) DEFAULT '5 mnt',
      student_progress INTEGER NOT NULL DEFAULT 65,
      teacher_notes TEXT DEFAULT 'Perhatikan suhu chiller dan elastisitas adonan saat sheeting.',
      formula_title VARCHAR(160) DEFAULT 'Formula: Suhu Laminasi Ideal (14–16°C)',
      formula_subtitle VARCHAR(220) DEFAULT 'Kartu acuan cepat kelembapan & elastisitas lemak',
      formula_body TEXT DEFAULT 'Gunakan butter 82–84% butterfat pada 14–16°C, rest di chiller 20 menit antar lipatan.',
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      thread_id INTEGER NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
      sender_role VARCHAR(20) NOT NULL DEFAULT 'student',
      sender_name VARCHAR(120) NOT NULL,
      time_label VARCHAR(30) NOT NULL DEFAULT '10:42 AM',
      body TEXT NOT NULL,
      image_url TEXT,
      image_caption VARCHAR(120),
      is_formula_card BOOLEAN NOT NULL DEFAULT FALSE,
      formula_title VARCHAR(160),
      formula_subtitle VARCHAR(220),
      is_read BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_chat_threads_updated_at
      ON chat_threads (updated_at DESC, id DESC);
    CREATE INDEX IF NOT EXISTS idx_chat_threads_category_updated
      ON chat_threads (category, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_chat_threads_review_status
      ON chat_threads (review_status, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_chat_threads_student_id
      ON chat_threads (student_id)
      WHERE student_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id_id
      ON chat_messages (thread_id, id ASC);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created_at
      ON chat_messages (thread_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_unread
      ON chat_messages (thread_id, is_read)
      WHERE is_read = FALSE;
  `);

  const countRes = await pool.query('SELECT COUNT(*)::int AS cnt FROM chat_threads;');
  if (countRes.rows[0]?.cnt === 0) {
    await pool.query(`
      INSERT INTO chat_threads (
        category, student_id, student_name, course_title, is_online, review_status,
        unread_count, last_preview, last_time_label, student_progress, teacher_notes
      )
      SELECT 'recipe', id, full_name, 'Croissant & Lamination', TRUE, 'answered',
             0, '"Suhu chiller untuk istirahat adonan..."', '5 mnt', 74,
             'Adonan sudah cukup lentur; pastikan butter tidak pecah saat lipatan kedua.'
      FROM users WHERE email = 'afdhol@gmail.com'
      UNION ALL
      SELECT 'assignment', id, full_name, 'Sourdough & Yeast Goods', TRUE, 'pending_review',
             1, '"Evaluasi rongga sarang lebah..."', '20 mnt', 85,
             'Fermentasi bulk cukup baik, cek kematangan crust pada 10 menit terakhir.'
      FROM users WHERE email = 'mawaddah@gmail.com'
      UNION ALL
      SELECT 'dm', id, full_name, 'French Macarons & Patisserie', FALSE, 'pending_review',
             1, '"Tanya resep Macarons - Suhu oven..."', '10 mnt', 90,
             'Menunggu evaluasi suhu deck oven dan konsistensi adonan macaron.'
      FROM users WHERE email = 'naufal@gmail.com'
      UNION ALL
      SELECT 'recipe', id, full_name, 'Traditional Indonesian Cakes', TRUE, 'answered',
             0, '"Takaran santan & kukusan lapis..."', '2 jam', 68,
             'Gunakan api sedang agar lapisan tidak bergelombang.'
      FROM users WHERE email = 'rahel@gmail.com'
      UNION ALL
      SELECT 'assignment', id, full_name, 'Cake Decorating & Buttercream', TRUE, 'answered',
             0, '"Hasil piping bunga mawar Swiss..."', '3 jam', 88,
             'Konsistensi Swiss meringue buttercream sudah halus dan stabil.'
      FROM users WHERE email = 'salwa@gmail.com';
    `);

    const seededThreads = await pool.query(
      'SELECT id, student_name FROM chat_threads ORDER BY id ASC;'
    );

    for (let i = 0; i < seededThreads.rows.length; i += 1) {
      const th = seededThreads.rows[i];
      if (i === 0) {
        await pool.query(
          `INSERT INTO chat_messages (thread_id, sender_role, sender_name, time_label, body, image_caption, is_read)
           VALUES
             ($1, 'student', $2, '10:42 AM',
              'Halo Chef Ayu! Saya sedang di langkah lipatan kedua, menteganya sedikit retak saat di-roll. Apakah adonan terlalu dingin atau mentega saya yang kurang pliable?',
              'Foto Uji Tourage', TRUE),
             ($1, 'teacher', 'Chef Ayu (Anda)', '10:46 AM',
              'Halo ' || $2 || '. Itu tanda mentega terlalu dingin (< 14°C) dibanding elastisitas adonan détrempe. Biarkan di meja suhu ruang 5–7 menit sebelum di-roll kembali agar mentega plastis dan menyatu sempurna saat sheeting.',
              NULL, TRUE);`,
          [th.id, th.student_name]
        );
      } else if (i === 1) {
        await pool.query(
          `INSERT INTO chat_messages (thread_id, sender_role, sender_name, time_label, body, image_caption, is_read)
           VALUES ($1, 'student', $2, '09:15 AM',
                   'Chef, saya upload hasil potongan roti sourdough pagi ini untuk evaluasi rongga sarang lebah dan kelembapan crumb.',
                   'Foto Crumb Roti', TRUE);`,
          [th.id, th.student_name]
        );
      } else {
        await pool.query(
          `INSERT INTO chat_messages (thread_id, sender_role, sender_name, time_label, body, is_read)
           VALUES ($1, 'student', $2, '08:05 AM',
                   'Halo Chef, saya ingin memastikan suhu oven dan waktu istirahat adonan sebelum masuk tahap berikutnya.',
                   TRUE);`,
          [th.id, th.student_name]
        );
      }
    }
  }
}

export async function GET() {
  try {
    await ensureChatTablesAndSeed();

    const threadsRes = await pool.query(
      'SELECT * FROM chat_threads ORDER BY updated_at DESC, id ASC;'
    );
    const messagesRes = await pool.query(
      'SELECT * FROM chat_messages ORDER BY id ASC;'
    );

    const messagesByThread = {};
    for (const msg of messagesRes.rows) {
      if (!messagesByThread[msg.thread_id]) {
        messagesByThread[msg.thread_id] = [];
      }
      messagesByThread[msg.thread_id].push(msg);
    }

    return NextResponse.json({
      success: true,
      threads: threadsRes.rows,
      messagesByThread,
    });
  } catch (err) {
    console.error('GET /api/chat error:', err);
    return NextResponse.json(
      { message: `Gagal memuat data chat: ${err?.message || 'Kesalahan server.'}` },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    await ensureChatTablesAndSeed();
    const body = await request.json();
    const threadId = Number(body?.thread_id);

    if (!threadId) {
      return NextResponse.json({ message: 'thread_id wajib diisi.' }, { status: 400 });
    }

    const updates = [];
    const values = [];

    if (typeof body?.teacher_notes === 'string') {
      values.push(body.teacher_notes.trim());
      updates.push(`teacher_notes = $${values.length}`);
    }

    if (body?.mark_read === true) {
      values.push(0);
      updates.push(`unread_count = $${values.length}`);
    }

    if (typeof body?.review_status === 'string') {
      values.push(body.review_status);
      updates.push(`review_status = $${values.length}`);
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: 'Tidak ada perubahan.' }, { status: 400 });
    }

    values.push(threadId);
    const res = await pool.query(
      `UPDATE chat_threads SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *;`,
      values
    );

    revalidatePath('/dashboard/teacher/chats');
    revalidatePath('/dashboard/admin/chats');

    return NextResponse.json({ success: true, thread: res.rows[0] });
  } catch (err) {
    console.error('PATCH /api/chat error:', err);
    return NextResponse.json(
      { message: `Gagal memperbarui thread chat: ${err?.message || 'Kesalahan server.'}` },
      { status: 500 }
    );
  }
}