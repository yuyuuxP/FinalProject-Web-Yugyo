'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const TABS = [
  { key: 'all', label: 'Semua Diskusi' },
  { key: 'recipe', label: 'Konsultasi Resep' },
  { key: 'dm', label: 'Pribadi / DM' },
  { key: 'task', label: 'Tugas Siswa' },
];

const QUICK_PROMPTS = [
  'Tips Meja Marmer',
  'Durasi Chiller (20 mnt)',
  'Minta Foto Proofing',
];

function isStrictThreadForTeacher(thread, currentUser, isPendingAccount) {
  if (isPendingAccount || !currentUser?.id) return false;
  if (String(currentUser.status || '').trim().toLowerCase() === 'pending') return false;

  const teacherId = Number(currentUser.id);
  const teacherName = String(currentUser.full_name || '').trim().toLowerCase();
  const firstName = teacherName.split(/\s+/).filter(Boolean)[0] || '';

  const targetIdRaw =
    thread?.instructor_id ?? thread?.teacher_id ?? thread?.recipient_id ?? null;
  const hasTargetId =
    targetIdRaw != null &&
    String(targetIdRaw).trim() !== '' &&
    Number.isFinite(Number(targetIdRaw)) &&
    Number(targetIdRaw) > 0;

  if (hasTargetId && Number(targetIdRaw) !== teacherId) {
    return false;
  }

  const text = `${thread?.subject || ''} ${thread?.last_message || ''} ${
    thread?.first_message || ''
  }`.toLowerCase();

  const matches = [...text.matchAll(/\b(?:chef|guru|kak|ustadz(?:ah)?)\s+([a-z]+)/gi)];
  if (matches.length > 0 && teacherName) {
    const mentionsCurrentTeacher = matches.some((m) => {
      const name = String(m[1] || '').trim().toLowerCase();
      return (
        name === firstName ||
        (name.length >= 2 && teacherName.includes(name)) ||
        (firstName.length >= 2 && name.includes(firstName))
      );
    });
    if (!mentionsCurrentTeacher) {
      return false;
    }
  }

  if (hasTargetId && Number(targetIdRaw) === teacherId) {
    return true;
  }

  const targetName = String(
    thread?.instructor_name ?? thread?.teacher_name ?? ''
  )
    .trim()
    .toLowerCase();

  if (targetName && teacherName) {
    const targetFirst = targetName.split(/\s+/).filter(Boolean)[0] || '';
    if (targetName === teacherName || (firstName && targetFirst === firstName)) {
      return true;
    }
    return false;
  }

  if (matches.length > 0 && teacherName) {
    return matches.some((m) => {
      const name = String(m[1] || '').trim().toLowerCase();
      return name === firstName || (name.length >= 2 && teacherName.includes(name));
    });
  }

  return false;
}

function classifyThreadCategory(thread) {
  const raw = `${thread?.category || ''} ${thread?.subject || ''} ${
    thread?.last_message || ''
  }`.toLowerCase();
  if (raw.includes('tugas') || raw.includes('task') || raw.includes('evaluasi')) {
    return 'task';
  }
  if (
    raw.includes('resep') ||
    raw.includes('formula') ||
    raw.includes('lapis') ||
    raw.includes('adonan')
  ) {
    return 'recipe';
  }
  return 'dm';
}

export default function AtelierChatSupportClient({
  currentUser,
  role = 'teacher',
  isPendingAccount = false,
  initialThreads = [],
  initialMessages = [],
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const scopedInitialThreads = useMemo(() => {
    if (isPendingAccount) return [];
    if (role === 'teacher') {
      return (Array.isArray(initialThreads) ? initialThreads : []).filter((t) =>
        isStrictThreadForTeacher(t, currentUser, false)
      );
    }
    return Array.isArray(initialThreads) ? initialThreads : [];
  }, [initialThreads, currentUser, role, isPendingAccount]);

  const [threads, setThreads] = useState(scopedInitialThreads);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedThreadId, setSelectedThreadId] = useState(
    scopedInitialThreads[0]?.id || null
  );
  const [messages, setMessages] = useState(() =>
    isPendingAccount ? [] : Array.isArray(initialMessages) ? initialMessages : []
  );
  const [draftText, setDraftText] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const filteredThreads = useMemo(() => {
    if (isPendingAccount) return [];
    const base =
      role === 'teacher'
        ? threads.filter((t) => isStrictThreadForTeacher(t, currentUser, false))
        : threads;

    if (activeTab === 'all') return base;
    return base.filter((t) => classifyThreadCategory(t) === activeTab);
  }, [threads, activeTab, role, currentUser, isPendingAccount]);

  const selectedThread = useMemo(() => {
    if (isPendingAccount || filteredThreads.length === 0) return null;
    return (
      filteredThreads.find((t) => Number(t.id) === Number(selectedThreadId)) ||
      filteredThreads[0]
    );
  }, [filteredThreads, selectedThreadId, isPendingAccount]);

  const handleSelectThread = async (thread) => {
    if (isPendingAccount || !thread?.id) return;
    setSelectedThreadId(thread.id);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/teacher/chats?thread_id=${thread.id}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.warn('Failed to load thread messages:', err?.message);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (isPendingAccount || !selectedThread?.id || sending) return;

    const trimmed = draftText.trim();
    if (!trimmed) return;

    setSending(true);
    setErrorMsg('');
    setFeedbackMsg('');

    try {
      const res = await fetch('/api/teacher/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: selectedThread.id,
          sender_role: role,
          message: trimmed,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Gagal mengirim pesan.');
      }

      const createdMsg = data.message || {
        id: Date.now(),
        thread_id: selectedThread.id,
        sender_id: currentUser?.id,
        sender_role: role,
        message: trimmed,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, createdMsg]);
      setThreads((prev) =>
        prev.map((t) =>
          Number(t.id) === Number(selectedThread.id) ? { ...t, last_message: trimmed } : t
        )
      );
      setDraftText('');
      setFeedbackMsg('Pesan terkirim.');

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal mengirim pesan.');
    } finally {
      setSending(false);
    }
  };

  const pendingReviewCount = useMemo(
    () =>
      filteredThreads.filter((t) => String(t?.status || '').toLowerCase() !== 'answered')
        .length,
    [filteredThreads]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="block text-[10px] font-extrabold tracking-[0.2em] uppercase text-[#802924]">
              YUGYO ATELIER • INSTRUCTOR PORTAL • CHAT &amp; SUPPORT
            </span>
            <h1 className="font-editorial text-2xl font-bold text-[#341D17] mt-1">
              {currentUser?.full_name ? `Diskusi ${currentUser.full_name}` : 'Chat & Support'}
            </h1>
          </div>

          <span className="rounded-full bg-[#F9DDBB] px-3.5 py-1 text-xs font-extrabold text-[#802924]">
            {isPendingAccount ? 'Akun Pending' : `${pendingReviewCount} Menunggu Review`}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            const count =
              tab.key === 'all'
                ? filteredThreads.length
                : filteredThreads.filter((t) => classifyThreadCategory(t) === tab.key).length;

            return (
              <button
                key={tab.key}
                type="button"
                disabled={isPendingAccount}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-2xl px-4 py-2 text-xs font-bold transition cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 ${
                  active
                    ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                    : 'border border-[#341D17]/15 bg-[#FFFDF9] text-[#341D17] hover:bg-[#F9DDBB]/40'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                    active ? 'bg-[#F9DDBB]/20 text-[#F9DDBB]' : 'bg-[#F9DDBB] text-[#802924]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {isPendingAccount && (
        <div className="rounded-2xl border border-amber-700/30 bg-[#F9DDBB]/80 px-4 py-3 text-xs font-bold text-[#802924]">
          Akun pengajar Anda masih berstatus PENDING. Anda belum dapat menerima atau membalas chat/diskusi dari siswa sampai disetujui oleh Admin.
        </div>
      )}

      {feedbackMsg && (
        <div className="rounded-2xl border border-[#341D17]/20 bg-[#F9DDBB]/60 px-4 py-3 text-xs font-bold text-[#341D17]">
          {feedbackMsg} {isPending ? '• Menyinkronkan...' : ''}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-800">
          {errorMsg}
        </div>
      )}

      {isPendingAccount ? (
        <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-6 text-center text-xs text-[#341D17]/75">
          Tidak ada diskusi/chat yang ditampilkan karena status akun guru masih PENDING.
        </div>
      ) : filteredThreads.length === 0 ? (
        <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-6 text-center text-xs text-[#341D17]/75">
          Belum ada diskusi atau pertanyaan siswa yang ditujukan ke akun{' '}
          <strong>{currentUser?.full_name || 'Anda'}</strong>.
        </div>
      ) : (
        <>
          <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-editorial text-lg font-bold text-[#341D17]">
                Antrean Konsultasi
              </h2>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                {filteredThreads.length} DISKUSI UNTUK {String(currentUser?.full_name || 'GURU').toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {filteredThreads.map((thread) => {
                const isSelected =
                  selectedThread && Number(thread.id) === Number(selectedThread.id);
                const studentName = thread.student_name || 'Siswa';
                const initials = studentName
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => handleSelectThread(thread)}
                    className={`rounded-2xl border p-4 text-left transition cursor-pointer space-y-2 ${
                      isSelected
                        ? 'border-[#802924] bg-[#F9DDBB]/35 shadow-xs'
                        : 'border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#F9DDBB]/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#802924] text-xs font-extrabold text-[#F9DDBB]">
                          {initials}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#341D17] truncate">
                            {studentName}
                          </p>
                          <p className="text-[10px] text-[#341D17]/65 truncate">
                            {thread.course_title || 'Kelas Atelier'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#341D17]/60 shrink-0">
                        {isSelected ? 'Sedang Aktif' : 'Buka'}
                      </span>
                    </div>

                    <p className="text-xs text-[#341D17]/80 line-clamp-2 italic">
                      &ldquo;{thread.last_message || thread.subject || 'Pertanyaan siswa'}&rdquo;
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedThread && (
            <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#341D17]/10 pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#341D17]">
                    {selectedThread.student_name || 'Siswa'}
                  </h3>
                  <p className="text-xs text-[#341D17]/65">
                    {selectedThread.course_title || 'Kelas Atelier'} • Ditujukan ke{' '}
                    <strong>{currentUser?.full_name || 'Guru'}</strong>
                  </p>
                </div>

                <span className="rounded-full bg-[#F9DDBB] px-3 py-1 text-[10px] font-extrabold uppercase text-[#802924]">
                  {selectedThread.status === 'answered' ? 'Terjawab' : 'Menunggu Balasan'}
                </span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto py-1">
                {messages.length > 0 ? (
                  messages.map((msg) => {
                    const isTeacherMsg = String(msg.sender_role).toLowerCase() === 'teacher';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isTeacherMsg ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs sm:text-sm ${
                            isTeacherMsg
                              ? 'bg-[#802924] text-[#F9DDBB]'
                              : 'border border-[#341D17]/15 bg-[#F9DDBB]/35 text-[#341D17]'
                          }`}
                        >
                          <p className="text-[10px] font-extrabold uppercase opacity-80 mb-1">
                            {isTeacherMsg
                              ? `${currentUser?.full_name || 'Guru'} (Anda)`
                              : selectedThread.student_name || 'Siswa'}
                          </p>
                          <p>{msg.message}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-[#341D17]/15 bg-[#F9DDBB]/30 p-4 text-xs sm:text-sm text-[#341D17]">
                    <p className="text-[10px] font-extrabold uppercase text-[#802924] mb-1">
                      {selectedThread.student_name || 'Siswa'}
                    </p>
                    <p>{selectedThread.last_message || selectedThread.subject || 'Pesan diskusi'}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setDraftText((prev) => (prev ? `${prev} ${chip}` : chip))}
                    className="rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#F9DDBB]/50 px-3 py-1.5 text-[11px] font-semibold text-[#341D17] cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder="Ketik pesan atau saran teknik baking..."
                  className="flex-1 rounded-2xl border border-[#341D17]/20 bg-[#FFFDF9] px-4 py-2.5 text-xs sm:text-sm text-[#341D17]"
                />
                <button
                  type="submit"
                  disabled={sending || !draftText.trim()}
                  className="rounded-2xl bg-[#802924] hover:bg-[#661F1B] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#F9DDBB] cursor-pointer disabled:opacity-50"
                >
                  {sending ? 'Mengirim...' : 'Kirim'}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}