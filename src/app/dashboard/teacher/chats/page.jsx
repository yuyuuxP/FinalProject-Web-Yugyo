import pool from '@/lib/db';
import AtelierChatSupportClient from '@/components/chat/AtelierChatSupportClient';

export const dynamic = 'force-dynamic';

export default async function TeacherChatsPage() {
  let threads = [];
  const messagesByThread = {};
  let unansweredChatCount = 0;

  try {
    const tRes = await pool.query(
      'SELECT * FROM chat_threads ORDER BY updated_at DESC, id ASC;'
    );
    threads = tRes.rows;

    unansweredChatCount = threads.filter(
      (t) => t.review_status !== 'answered'
    ).length;

    const mRes = await pool.query('SELECT * FROM chat_messages ORDER BY id ASC;');
    for (const msg of mRes.rows) {
      if (!messagesByThread[msg.thread_id]) {
        messagesByThread[msg.thread_id] = [];
      }
      messagesByThread[msg.thread_id].push(msg);
    }
  } catch (err) {
    console.error('Error loading teacher chats:', err);
  }

  return (
    <AtelierChatSupportClient
      currentUserName="Chef Ayu"
      portalLabel="INSTRUCTOR PORTAL"
      initialThreads={threads}
      initialMessagesByThread={messagesByThread}
      unansweredChatCount={unansweredChatCount}
    />
  );
}