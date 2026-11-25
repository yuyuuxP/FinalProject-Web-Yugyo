'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FaComments,
  FaChevronRight,
  FaCheck,
  FaCheckDouble,
  FaChartLine,
  FaBookOpen,
  FaEllipsisVertical,
  FaImage,
  FaPaperclip,
  FaPaperPlane,
  FaXmark,
  FaMagnifyingGlassPlus,
} from 'react-icons/fa6';

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

function isThreadForActiveTeacher(thread, currentUser, isPendingAccount) {
  if (isPendingAccount || !currentUser?.id) return false;
  if (String(currentUser.status || '').trim().toLowerCase() === 'pending') return false;

  const teacherId = Number(currentUser.id);
  const teacherName = String(currentUser.full_name || '').trim().toLowerCase();
  const firstName = teacherName.split(/\s+/).filter(Boolean)[0] || '';

  const rawInstructorId =
    thread?.instructor_id ?? thread?.teacher_id ?? thread?.recipient_id ?? null;
  const hasInstructorId =
    rawInstructorId != null &&
    String(rawInstructorId).trim() !== '' &&
    Number.isFinite(Number(rawInstructorId)) &&
    Number(rawInstructorId) > 0;

  if (hasInstructorId) {
    return Number(rawInstructorId) === teacherId;
  }

  const combinedText = `${thread?.last_preview || ''} ${thread?.last_message || ''} ${
    thread?.first_message || ''
  } ${thread?.course_title || ''}`.toLowerCase();

  const matches = [
    ...combinedText.matchAll(/\b(?:chef|guru|kak|ustadz(?:ah)?)\s+([a-z]+)/gi),
  ];

  if (matches.length > 0 && teacherName) {
    return matches.some((m) => {
      const mentioned = String(m[1] || '').trim().toLowerCase();
      return (
        mentioned === firstName ||
        (mentioned.length >= 2 && teacherName.includes(mentioned)) ||
        (firstName.length >= 2 && mentioned.includes(firstName))
      );
    });
  }

  return false;
}

function classifyThreadCategory(thread) {
  const raw = String(thread?.category || '').trim().toLowerCase();
  if (raw === 'recipe' || raw.includes('resep')) return 'recipe';
  if (raw === 'assignment' || raw === 'task' || raw.includes('tugas')) return 'task';
  if (raw === 'dm' || raw.includes('pribadi')) return 'dm';

  const text = `${thread?.course_title || ''} ${thread?.last_preview || ''} ${
    thread?.last_message || ''
  }`.toLowerCase();
  if (text.includes('tugas') || text.includes('evaluasi') || text.includes('ronde')) {
    return 'task';
  }
  if (
    text.includes('resep') ||
    text.includes('formula') ||
    text.includes('laminasi') ||
    text.includes('adonan') ||
    text.includes('chiller')
  ) {
    return 'recipe';
  }
  return 'dm';
}

function getInitials(name) {
  const parts = String(name || 'Siswa')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'S';
  return parts
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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

  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [threadOverrides, setThreadOverrides] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [messagesByThread, setMessagesByThread] = useState(() => {
    if (isPendingAccount) return {};
    const firstId = initialThreads?.[0]?.id;
    return firstId && Array.isArray(initialMessages)
      ? { [firstId]: initialMessages }
      : {};
  });
  const [draftText, setDraftText] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [notesByThread, setNotesByThread] = useState({});
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [showMenuPopover, setShowMenuPopover] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const scopedThreads = useMemo(() => {
    if (isPendingAccount) return [];
    const list = Array.isArray(initialThreads) ? initialThreads : [];
    const base =
      role === 'teacher'
        ? list.filter((t) => isThreadForActiveTeacher(t, currentUser, false))
        : list;

    return base.map((t) =>
      threadOverrides[t.id] ? { ...t, ...threadOverrides[t.id] } : t
    );
  }, [initialThreads, currentUser, role, isPendingAccount, threadOverrides]);

  const filteredThreads = useMemo(() => {
    if (isPendingAccount) return [];
    if (activeTab === 'all') return scopedThreads;
    return scopedThreads.filter((t) => classifyThreadCategory(t) === activeTab);
  }, [scopedThreads, activeTab, isPendingAccount]);

  const selectedThread = useMemo(() => {
    if (isPendingAccount || filteredThreads.length === 0) return null;
    if (selectedThreadId != null) {
      const matched = filteredThreads.find(
        (t) => Number(t.id) === Number(selectedThreadId)
      );
      if (matched) return matched;
    }
    return filteredThreads[0];
  }, [filteredThreads, selectedThreadId, isPendingAccount]);

  const currentMessages = useMemo(() => {
    if (!selectedThread?.id) return [];
    return messagesByThread[selectedThread.id] || [];
  }, [messagesByThread, selectedThread]);

  const currentNotesValue = selectedThread
    ? notesByThread[selectedThread.id] ?? selectedThread.teacher_notes ?? ''
    : '';

  const pendingReviewCount = useMemo(
    () =>
      filteredThreads.filter(
        (t) => String(t?.review_status || t?.status || '').toLowerCase() !== 'answered'
      ).length,
    [filteredThreads]
  );

  const handleSelectThread = async (thread) => {
    if (isPendingAccount || !thread?.id) return;
    setSelectedThreadId(thread.id);
    setShowMenuPopover(false);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/teacher/chats?thread_id=${thread.id}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.messages)) {
        setMessagesByThread((prev) => ({
          ...prev,
          [thread.id]: data.messages,
        }));
      }
    } catch (err) {
      console.warn('Failed to load thread messages:', err?.message);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Silakan pilih file gambar yang valid (JPG, PNG, WEBP, dll.).');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran gambar maksimal 5 MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage({
        name: file.name,
        size: file.size,
        dataUrl: typeof reader.result === 'string' ? reader.result : '',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal 10 MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl: typeof reader.result === 'string' ? reader.result : '',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (isPendingAccount || !selectedThread?.id || sending) return;

    const trimmed = draftText.trim();
    if (!trimmed && !attachedImage && !attachedFile) return;

    const threadId = selectedThread.id;
    const summaryPreview =
      trimmed ||
      (attachedImage ? `Gambar: ${attachedImage.name}` : '') ||
      (attachedFile ? `File: ${attachedFile.name}` : '');

    setSending(true);
    setErrorMsg('');
    setFeedbackMsg('');

    try {
      const res = await fetch('/api/teacher/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: threadId,
          sender_role: role,
          sender_name: currentUser?.full_name || 'Guru',
          message: summaryPreview,
          body: summaryPreview,
          image_url: attachedImage?.dataUrl || null,
          image_caption: attachedImage?.name || null,
          file_name: attachedFile?.name || null,
          file_size: attachedFile?.size || null,
          file_url: attachedFile?.dataUrl || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Gagal mengirim pesan.');
      }

      const createdMsg = {
        ...(data.message || {}),
        id: data.message?.id || Date.now(),
        thread_id: threadId,
        sender_role: role,
        sender_name: currentUser?.full_name || 'Guru',
        time_label: 'Baru saja',
        body: data.message?.body || summaryPreview,
        message: data.message?.message || summaryPreview,
        image_url: data.message?.image_url || attachedImage?.dataUrl || null,
        image_caption: data.message?.image_caption || attachedImage?.name || null,
        file_name: data.message?.file_name || attachedFile?.name || null,
        file_size: data.message?.file_size || attachedFile?.size || null,
        file_url: data.message?.file_url || attachedFile?.dataUrl || null,
        created_at: new Date().toISOString(),
      };

      setMessagesByThread((prev) => ({
        ...prev,
        [threadId]: [...(prev[threadId] || []), createdMsg],
      }));

      setThreadOverrides((prev) => ({
        ...prev,
        [threadId]: {
          ...(prev[threadId] || {}),
          last_preview: summaryPreview,
          last_time_label: 'Baru saja',
          review_status: role === 'teacher' ? 'answered' : selectedThread.review_status,
          unread_count: role === 'teacher' ? 0 : selectedThread.unread_count,
        },
      }));

      setDraftText('');
      setAttachedImage(null);
      setAttachedFile(null);
      setFeedbackMsg('Pesan dan lampiran terkirim.');

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal mengirim pesan.');
    } finally {
      setSending(false);
    }
  };

  const canSubmit = Boolean(
    !sending && (draftText.trim() || attachedImage || attachedFile)
  );

  return (
    <div className="space-y-5">
      {/* BAR FILTER KATEGORI & STATUS REVIEW */}
      <div className="rounded-3xl border border-[#341D17]/12 bg-[#FFFDF9] p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              const count = isPendingAccount
                ? 0
                : tab.key === 'all'
                ? scopedThreads.length
                : scopedThreads.filter((t) => classifyThreadCategory(t) === tab.key)
                    .length;

              return (
                <button
                  key={tab.key}
                  type="button"
                  disabled={isPendingAccount}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 ${
                    active
                      ? 'bg-[#802924] text-[#FFFDF9] shadow-xs'
                      : 'bg-[#F3ECE4] text-[#341D17] hover:bg-[#F9DDBB]/65'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      active
                        ? 'bg-[#FFFDF9]/20 text-[#FFFDF9]'
                        : 'bg-[#FFFDF9] text-[#802924]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#802924]">
            {isPendingAccount
              ? 'AKUN PENDING'
              : `${pendingReviewCount} MENUNGGU REVIEW`}
          </span>
        </div>

        {/* ANTREAN KONSULTASI */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#341D17] inline-flex items-center gap-2">
              <FaComments className="w-3.5 h-3.5 text-[#802924] shrink-0" />
              <span>Antrean Konsultasi</span>
            </h2>
            {currentUser?.full_name && !isPendingAccount && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#341D17]/60">
                Khusus {currentUser.full_name}
              </span>
            )}
          </div>

          {isPendingAccount ? (
            <div className="rounded-2xl border border-amber-700/25 bg-[#F9DDBB]/70 px-4 py-4 text-xs font-bold text-[#802924]">
              Akun pengajar Anda masih berstatus PENDING. Anda belum dapat menerima atau membalas chat dari siswa hingga disetujui Admin.
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="rounded-2xl border border-[#341D17]/12 bg-[#FAF6F0] px-4 py-5 text-center text-xs text-[#341D17]/70">
              Belum ada diskusi atau pertanyaan siswa yang ditujukan ke akun{' '}
              <strong>{currentUser?.full_name || 'Anda'}</strong>.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {filteredThreads.map((thread) => {
                const isSelected =
                  selectedThread && Number(thread.id) === Number(selectedThread.id);
                const studentName = thread.student_name || 'Siswa';
                const unread = Number(thread.unread_count || 0);
                const isAnswered =
                  String(thread.review_status || '').toLowerCase() === 'answered';
                const hasAttachment = Boolean(thread.student_avatar || thread.image_url);

                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => handleSelectThread(thread)}
                    className={`rounded-2xl border p-3.5 text-left transition cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'border-[#802924] bg-[#FFFDF9] ring-2 ring-[#802924]/25 shadow-xs'
                        : 'border-[#341D17]/12 bg-[#FAF6F0]/70 hover:bg-[#FFFDF9]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {thread.student_avatar ? (
                          <img
                            src={thread.student_avatar}
                            alt={studentName}
                            className="h-9 w-9 shrink-0 rounded-full object-cover border border-[#341D17]/15"
                          />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#802924] text-xs font-extrabold text-[#FFFDF9]">
                            {getInitials(studentName)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#341D17] truncate">
                            {studentName}
                          </p>
                          <p className="text-[11px] text-[#341D17]/65 truncate">
                            {thread.course_title || 'Kelas Atelier'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#341D17]/55 shrink-0">
                        {thread.last_time_label || 'Baru saja'}
                      </span>
                    </div>

                    <p className="text-xs italic text-[#341D17]/80 line-clamp-1">
                      &ldquo;{thread.last_preview || thread.last_message || 'Pertanyaan siswa'}&rdquo;
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      {unread > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FDECEC] px-2.5 py-0.5 text-[10px] font-bold text-[#B42318]">
                          <FaComments className="w-2.5 h-2.5 shrink-0" />
                          <span>{unread} Pesan Baru</span>
                        </span>
                      ) : hasAttachment ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F9DDBB]/70 px-2.5 py-0.5 text-[10px] font-bold text-[#802924]">
                          <FaImage className="w-2.5 h-2.5 shrink-0" />
                          <span>Lampiran Foto</span>
                        </span>
                      ) : isAnswered ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2.5 py-0.5 text-[10px] font-bold text-[#027A48]">
                          <FaCheck className="w-2.5 h-2.5 shrink-0" />
                          <span>Terjawab</span>
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#F3ECE4] px-2.5 py-0.5 text-[10px] font-bold text-[#341D17]/75">
                          Menunggu Review
                        </span>
                      )}

                      {isSelected ? (
                        <span className="text-[11px] font-extrabold text-[#802924]">
                          Sedang Aktif
                        </span>
                      ) : (
                        <FaChevronRight className="w-3 h-3 text-[#341D17]/45 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {feedbackMsg && (
        <div className="rounded-2xl border border-[#341D17]/15 bg-[#F9DDBB]/60 px-4 py-2.5 text-xs font-bold text-[#341D17]">
          {feedbackMsg} {isPending ? '• Menyinkronkan...' : ''}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-medium text-red-800">
          {errorMsg}
        </div>
      )}

      {/* PANEL RUANG DISKUSI AKTIF */}
      {!isPendingAccount && selectedThread && (
        <div className="rounded-3xl border border-[#341D17]/12 bg-[#FFFDF9] p-4 sm:p-6 shadow-2xs space-y-4">
          {/* HEADER SISWA AKTIF */}
          <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-[#341D17]/10 pb-4">
            <div className="flex items-center gap-3">
              {selectedThread.student_avatar ? (
                <img
                  src={selectedThread.student_avatar}
                  alt={selectedThread.student_name || 'Siswa'}
                  className="h-11 w-11 rounded-full object-cover border border-[#341D17]/15"
                />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#802924] text-sm font-extrabold text-[#FFFDF9]">
                  {getInitials(selectedThread.student_name)}
                </span>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-[#341D17]">
                    {selectedThread.student_name || 'Siswa'}
                  </h3>
                  {selectedThread.is_online !== false && (
                    <span className="rounded-full bg-[#ECFDF3] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#027A48]">
                      ONLINE
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#341D17]/65">
                  {selectedThread.course_title || 'Kelas Atelier'} &bull; Ditujukan ke{' '}
                  <strong>{currentUser?.full_name || 'Guru'}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMenuPopover((prev) => !prev)}
              aria-label="Opsi diskusi"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#341D17]/12 bg-[#FAF6F0] hover:bg-[#F9DDBB]/50 text-[#341D17] cursor-pointer"
            >
              <FaEllipsisVertical className="w-3.5 h-3.5" />
            </button>

            {showMenuPopover && (
              <div className="absolute right-0 top-12 z-20 w-52 rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] p-2 shadow-md text-xs space-y-1">
                <p className="px-3 py-1.5 text-[11px] text-[#341D17]/75">
                  Progres Siswa:{' '}
                  <strong>{selectedThread.student_progress ?? 65}%</strong>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotesPanel(true);
                    setShowMenuPopover(false);
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left font-semibold text-[#341D17] hover:bg-[#F9DDBB]/40 cursor-pointer"
                >
                  Buka Catatan Belajar
                </button>
              </div>
            )}
          </div>

          {/* TOMBOL AKSI: LIHAT PROGRES SISWA & CATATAN BELAJAR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href={
                selectedThread.student_id
                  ? `/dashboard/teacher/students/${selectedThread.student_id}`
                  : '/dashboard/teacher/courses'
              }
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#341D17]/15 bg-[#FAF6F0]/70 hover:bg-[#F9DDBB]/45 py-2.5 px-4 text-xs font-bold text-[#341D17] transition"
            >
              <FaChartLine className="w-3.5 h-3.5 text-[#802924] shrink-0" />
              <span>Lihat Progres Siswa</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowNotesPanel((prev) => !prev)}
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#341D17]/15 bg-[#FAF6F0]/70 hover:bg-[#F9DDBB]/45 py-2.5 px-4 text-xs font-bold text-[#341D17] transition cursor-pointer"
            >
              <FaBookOpen className="w-3.5 h-3.5 text-[#802924] shrink-0" />
              <span>Catatan Belajar</span>
            </button>
          </div>

          {showNotesPanel && (
            <div className="rounded-2xl border border-[#341D17]/15 bg-[#FAF6F0] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#341D17]">
                  Catatan Bimbingan ({selectedThread.student_name})
                </p>
                <button
                  type="button"
                  onClick={() => setShowNotesPanel(false)}
                  className="text-[11px] font-bold text-[#802924] cursor-pointer"
                >
                  Tutup
                </button>
              </div>
              <textarea
                rows={2}
                value={currentNotesValue}
                onChange={(e) =>
                  setNotesByThread((prev) => ({
                    ...prev,
                    [selectedThread.id]: e.target.value,
                  }))
                }
                placeholder="Catatan teknik baking untuk siswa..."
                className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] p-2.5 text-xs text-[#341D17]"
              />
            </div>
          )}

          {/* DIVIDER SESI */}
          <div className="flex items-center justify-center py-1">
            <span className="rounded-full bg-[#F3ECE4] px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/75">
              HARI INI &bull; SESI BIMBINGAN ADONAN
            </span>
          </div>

          {/* RIWAYAT PESAN */}
          <div className="space-y-4 max-h-[420px] overflow-y-auto px-1">
            {currentMessages.length > 0 ? (
              currentMessages.map((msg) => {
                const isTeacherMsg =
                  String(msg.sender_role || '').toLowerCase() === 'teacher';
                const textContent = msg.body || msg.message || '';

                if (isTeacherMsg) {
                  return (
                    <div key={msg.id} className="space-y-1">
                      <div className="flex items-center justify-end gap-2 text-[11px] text-[#341D17]/60">
                        <span>{msg.time_label || 'Baru saja'}</span>
                        <span className="font-bold text-[#341D17]">
                          {msg.sender_name || currentUser?.full_name || 'Guru'} (Anda)
                        </span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F9DDBB] text-[10px] font-extrabold text-[#802924]">
                          {getInitials(currentUser?.full_name || 'G')}
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <div className="max-w-[82%] rounded-2xl rounded-tr-xs bg-[#802924] px-4 py-3 text-xs sm:text-sm text-[#FFFDF9] shadow-2xs space-y-2.5">
                          {textContent && <p>{textContent}</p>}

                          {msg.image_url && (
                            <div className="overflow-hidden rounded-xl border border-[#FFFDF9]/25 bg-black/15">
                              <img
                                src={msg.image_url}
                                alt={msg.image_caption || 'Lampiran Gambar'}
                                className="max-h-56 w-auto object-cover"
                              />
                              {msg.image_caption && (
                                <p className="px-2.5 py-1 text-[10px] text-[#F9DDBB] inline-flex items-center gap-1.5">
                                  <FaImage className="w-2.5 h-2.5 shrink-0" />
                                  <span>{msg.image_caption}</span>
                                </p>
                              )}
                            </div>
                          )}

                          {msg.file_name && (
                            <a
                              href={msg.file_url || '#'}
                              download={msg.file_name}
                              className="flex items-center justify-between gap-3 rounded-xl border border-[#FFFDF9]/25 bg-black/15 px-3 py-2 text-xs text-[#FFFDF9] hover:bg-black/25 transition"
                            >
                              <span className="truncate inline-flex items-center gap-1.5">
                                <FaPaperclip className="w-3 h-3 shrink-0" />
                                <strong className="truncate">{msg.file_name}</strong>
                                {msg.file_size ? ` (${formatFileSize(msg.file_size)})` : ''}
                              </span>
                              <span className="shrink-0 text-[10px] font-extrabold uppercase underline">
                                Unduh
                              </span>
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end items-center gap-1 text-[10px] text-[#341D17]/55 pr-1">
                        <FaCheckDouble className="w-3 h-3 shrink-0 text-[#82882B]" />
                        <span>Dibaca oleh murid</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] text-[#341D17]/65">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#802924] text-[10px] font-extrabold text-[#FFFDF9]">
                        {getInitials(msg.sender_name || selectedThread.student_name)}
                      </span>
                      <span className="font-bold text-[#341D17]">
                        {msg.sender_name || selectedThread.student_name || 'Siswa'}
                      </span>
                      <span>{msg.time_label || 'Baru saja'}</span>
                    </div>

                    <div className="max-w-[85%] rounded-2xl rounded-tl-xs border border-[#341D17]/10 bg-[#FAF6F0] p-4 text-xs sm:text-sm text-[#341D17] space-y-3">
                      {textContent && <p>{textContent}</p>}

                      {msg.image_url && (
                        <div className="relative inline-block overflow-hidden rounded-xl border border-[#341D17]/15">
                          <img
                            src={msg.image_url}
                            alt={msg.image_caption || 'Lampiran Foto'}
                            className="max-h-52 w-auto object-cover"
                          />
                          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-md bg-black/75 px-2.5 py-1 text-[10px] font-bold text-white">
                            <FaMagnifyingGlassPlus className="w-2.5 h-2.5 shrink-0" />
                            <span>{msg.image_caption || 'Foto Uji Tourage'}</span>
                          </span>
                        </div>
                      )}

                      {msg.file_name && (
                        <a
                          href={msg.file_url || '#'}
                          download={msg.file_name}
                          className="flex items-center justify-between gap-3 rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#341D17] hover:bg-[#F9DDBB]/35 transition"
                        >
                          <span className="truncate inline-flex items-center gap-1.5">
                            <FaPaperclip className="w-3 h-3 text-[#802924] shrink-0" />
                            <strong className="truncate">{msg.file_name}</strong>
                            {msg.file_size ? ` (${formatFileSize(msg.file_size)})` : ''}
                          </span>
                          <span className="shrink-0 text-[10px] font-extrabold uppercase text-[#802924]">
                            Unduh
                          </span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] text-[#341D17]/65">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#802924] text-[10px] font-extrabold text-[#FFFDF9]">
                    {getInitials(selectedThread.student_name)}
                  </span>
                  <span className="font-bold text-[#341D17]">
                    {selectedThread.student_name || 'Siswa'}
                  </span>
                  <span>{selectedThread.last_time_label || 'Baru saja'}</span>
                </div>

                <div className="max-w-[85%] rounded-2xl rounded-tl-xs border border-[#341D17]/10 bg-[#FAF6F0] p-4 text-xs sm:text-sm text-[#341D17]">
                  <p>
                    {selectedThread.last_preview ||
                      selectedThread.last_message ||
                      'Pertanyaan diskusi siswa'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* PREVIEW LAMPIRAN GAMBAR & FILE SEBELUM DIKIRIM */}
          {(attachedImage || attachedFile) && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#341D17]/15 bg-[#FAF6F0] p-3">
              {attachedImage && (
                <div className="flex items-center gap-2.5 rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] p-2">
                  <img
                    src={attachedImage.dataUrl}
                    alt={attachedImage.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="text-xs max-w-[180px]">
                    <p className="font-bold text-[#341D17] truncate">
                      {attachedImage.name}
                    </p>
                    <p className="text-[10px] text-[#341D17]/60">
                      {formatFileSize(attachedImage.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Hapus lampiran gambar"
                    onClick={() => setAttachedImage(null)}
                    className="rounded-lg p-1.5 text-[#802924] hover:bg-[#F9DDBB]/50 cursor-pointer"
                  >
                    <FaXmark className="w-3 h-3" />
                  </button>
                </div>
              )}

              {attachedFile && (
                <div className="flex items-center gap-2.5 rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3 py-2">
                  <FaPaperclip className="w-3.5 h-3.5 text-[#802924] shrink-0" />
                  <div className="text-xs max-w-[200px]">
                    <p className="font-bold text-[#341D17] truncate">
                      {attachedFile.name}
                    </p>
                    <p className="text-[10px] text-[#341D17]/60">
                      {formatFileSize(attachedFile.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Hapus lampiran file"
                    onClick={() => setAttachedFile(null)}
                    className="rounded-lg p-1.5 text-[#802924] hover:bg-[#F9DDBB]/50 cursor-pointer"
                  >
                    <FaXmark className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* QUICK CHIPS */}
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() =>
                  setDraftText((prev) => (prev ? `${prev} ${chip}` : chip))
                }
                className="rounded-xl border border-[#341D17]/15 bg-[#FAF6F0] hover:bg-[#F9DDBB]/50 px-3 py-1.5 text-[11px] font-semibold text-[#341D17] cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* FORM INPUT + UPLOAD GAMBAR + UPLOAD FILE */}
          <form onSubmit={handleSendMessage} className="flex flex-wrap items-center gap-2 pt-1">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx,.zip,.rar"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              disabled={sending}
              onClick={() => imageInputRef.current?.click()}
              title="Upload Gambar"
              className="rounded-2xl border border-[#341D17]/20 bg-[#FAF6F0] hover:bg-[#F9DDBB]/55 px-3.5 py-2.5 text-xs font-bold text-[#341D17] transition cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <FaImage className="w-3.5 h-3.5 text-[#802924] shrink-0" />
              <span className="hidden sm:inline">Upload Gambar</span>
            </button>

            <button
              type="button"
              disabled={sending}
              onClick={() => fileInputRef.current?.click()}
              title="Upload File"
              className="rounded-2xl border border-[#341D17]/20 bg-[#FAF6F0] hover:bg-[#F9DDBB]/55 px-3.5 py-2.5 text-xs font-bold text-[#341D17] transition cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <FaPaperclip className="w-3.5 h-3.5 text-[#802924] shrink-0" />
              <span className="hidden sm:inline">Upload File</span>
            </button>

            <input
              type="text"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="Ketik pesan atau saran teknik baking..."
              className="flex-1 min-w-[200px] rounded-2xl border border-[#341D17]/20 bg-[#FFFDF9] px-4 py-2.5 text-xs sm:text-sm text-[#341D17]"
            />

            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-2xl bg-[#802924] hover:bg-[#661F1B] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#FFFDF9] cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
            >
              <FaPaperPlane className="w-3.5 h-3.5 shrink-0" />
              <span>{sending ? 'Mengirim...' : 'Kirim'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}