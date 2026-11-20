import pool from '@/lib/db';

export async function getUnansweredChatCount() {
  try {
    const res = await pool.query(
      "SELECT COUNT(*)::int AS cnt FROM chat_threads WHERE review_status <> 'answered';"
    );
    return Number(res.rows[0]?.cnt ?? 0);
  } catch (err) {
    console.error('Error fetching unanswered chat count:', err);
    return 0;
  }
}