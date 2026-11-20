'use client';

import { useMemo, useRef, useState } from 'react';

const BAKER_TIPS = [
  'Pastikan mentega laminasi berada di suhu 14–16°C agar plastis dan tidak patah saat di-roll.',
  'Gunakan timbangan digital presisi gram untuk ragi, garam, dan cairan agar hidrasi adonan konsisten.',
  'Istirahatkan adonan di chiller 20–30 menit bila gluten mulai menegang dan memantul saat digiling.',
];

const QUICK_CHIPS = [
  {
    label: 'Tips Meja Marmer',
    text: 'Gunakan meja marmer dingin atau bersihkan permukaan agar suhu adonan tidak cepat naik saat di-roll.',
  },
  {
    label: 'Durasi Chiller (20 mnt)',
    text: 'Masukkan adonan ke chiller selama 20 menit sebelum tahap berikutnya agar gluten relaks dan mentega tetap kokoh.',
  },
  {
    label: 'Minta Foto Proofing',
    text: 'Silakan kirim foto close-up adonan setelah proofing agar bisa saya evaluasi tingkat kembang dan elastisitasnya.',
  },
];

export default function AtelierChatSupportClient({
  currentUserName = 'Chef Ayu',
  portalLabel = 'INSTRUCTOR PORTAL',
  initialThreads = [],
  initialMessagesByThread = {},
}) {
  const [threads, setThreads] = useState(Array.isArray(initialThreads) ? initialThreads : []);
  const [messagesByThread, setMessagesByThread] = useState(initialMessagesByThread || {});
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'recipe' | 'dm' | 'assignment'
  const [selectedThreadId, setSelectedThreadId] = useState(
    Array.isArray(initialThreads) && initialThreads[0] ? initialThreads[0].id : null
  );

  // Tambahan jumlah pesan masuk per kategori ('recipe' | 'dm' | 'assignment')
  const [incomingByCategory, setIncomingByCategory] = useState({
    recipe: 0,
    dm: 0,
    assignment: 0,
  });

  const [draftText, setDraftText] = useState('');
  const [draftImageUrl, setDraftImageUrl] = useState('');
  const [draftImageCaption, setDraftImageCaption] = useState('Foto Uji Tourage');
  const [showPhotoInput, setShowPhotoInput] = useState(false);

  const [panelMode, setPanelMode] = useState(null); // null | 'progress' | 'notes'
  const [notesDraft, setNotesDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  const counts = useMemo(() => {
    const baseRecipe = threads.filter((t) => t.category === 'recipe').length;
    const baseDm = threads.filter((t) => t.category === 'dm').length;
    const baseAssignment = threads.filter((t) => t.category === 'assignment').length;

    const recipe = baseRecipe + (Number(incomingByCategory.recipe) || 0);
    const dm = baseDm + (Number(incomingByCategory.dm) || 0);
    const assignment = baseAssignment + (Number(incomingByCategory.assignment) || 0);
    const all = recipe + dm + assignment;
    const pendingReview = threads.filter((t) => t.review_status !== 'answered').length;

    return { all, recipe, dm, assignment, pendingReview };
  }, [threads, incomingByCategory]);

  const filteredThreads = useMemo(() => {
    if (activeTab === 'all') return threads;
    return threads.filter((t) => t.category === activeTab);
  }, [threads, activeTab]);

  const activeThread = useMemo(() => {
    return (
      filteredThreads.find((t) => t.id === selectedThreadId) ||
      threads.find((t) => t.id === selectedThreadId) ||
      filteredThreads[0] ||
      threads[0] ||
      null
    );
  }, [filteredThreads, threads, selectedThreadId]);

  const displayedMessages = useMemo(() => {
    if (!activeThread) return [];
    const list = messagesByThread[activeThread.id] || [];
    const isRahel = String(activeThread.student_name || '')
      .toLowerCase()
      .includes('rahel');

    let formulaKe = 0;
    return list.filter((msg) => {
      if (!msg.is_formula_card) return true;
      formulaKe += 1;
      return isRahel && formulaKe === 1;
    });
  }, [activeThread, messagesByThread]);

  const clearPhotoDraft = () => {
    setDraftImageUrl('');
    setDraftImageCaption('Foto Uji Tourage');
    setShowPhotoInput(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectThread = async (thread) => {
    setSelectedThreadId(thread.id);
    setPanelMode(null);
    clearPhotoDraft();
    setNotesDraft(thread.teacher_notes || '');
    setErrorMsg('');

    if (Number(thread.unread_count) > 0) {
      setThreads((prev) =>
        prev.map((item) => (item.id === thread.id ? { ...item, unread_count: 0 } : item))
      );
      await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: thread.id, mark_read: true }),
      }).catch(() => {});
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Pilih berkas gambar (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Ukuran foto maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDraftImageUrl(String(reader.result || ''));
      setDraftImageCaption(file.name.slice(0, 40) || 'Foto Lampiran');
      setShowPhotoInput(true);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e, extraPayload = {}) => {
    if (e) e.preventDefault();
    if (!activeThread || sending) return;

    const senderRole = extraPayload.sender_role === 'student' ? 'student' : 'teacher';
    const senderName =
      extraPayload.sender_name ||
      (senderRole === 'student' ? activeThread.student_name : `${currentUserName} (Anda)`);

    const payload = {
      thread_id: activeThread.id,
      sender_role: senderRole,
      sender_name: senderName,
      body: extraPayload.body ?? draftText,
      image_url: extraPayload.image_url ?? (draftImageUrl || null),
      image_caption: extraPayload.image_caption ?? draftImageCaption,
      is_formula_card: false,
    };

    if (!payload.body.trim() && !payload.image_url) {
      return;
    }

    setSending(true);
    setErrorMsg('');
    setFeedback('');

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Gagal mengirim pesan.');
      }

      const createdMsg = data.message;
      setMessagesByThread((prev) => ({
        ...prev,
        [activeThread.id]: [...(prev[activeThread.id] || []), createdMsg],
      }));

      const catKey = activeThread.category || 'recipe';
      setIncomingByCategory((prev) => ({
        ...prev,
        [catKey]: (Number(prev[catKey]) || 0) + 1,
      }));

      setThreads((prev) =>
        prev.map((t) => {
          if (t.id !== activeThread.id) return t;
          if (senderRole === 'student') {
            return {
              ...t,
              review_status: 'pending_review',
              unread_count: (Number(t.unread_count) || 0) + 1,
              last_time_label: 'Baru saja',
              last_preview: `"${String(createdMsg.body).slice(0, 46)}${
                String(createdMsg.body).length > 46 ? '...' : ''
              }"`,
            };
          }
          return {
            ...t,
            review_status: 'answered',
            last_time_label: 'Baru saja',
            last_preview: `"${String(createdMsg.body).slice(0, 46)}${
              String(createdMsg.body).length > 46 ? '...' : ''
            }"`,
          };
        })
      );

      if (extraPayload.body === undefined) {
        setDraftText('');
        clearPhotoDraft();
      }

      setFeedback('Pesan tersimpan & angka filter kategori bertambah.');
    } catch (err) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat mengirim pesan.');
    } finally {
      setSending(false);
    }
  };

  const handleSaveNotes = async (e) => {
    e.preventDefault();
    if (!activeThread) return;

    try {
      const res = await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: activeThread.id, teacher_notes: notesDraft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Gagal menyimpan catatan.');

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id ? { ...t, teacher_notes: notesDraft } : t
        )
      );
      setFeedback('Catatan belajar siswa berhasil diperbarui.');
      setPanelMode(null);
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal menyimpan catatan.');
    }
  };

  const tabs = [
    { key: 'all', label: 'Semua Diskusi', badge: counts.all },
    { key: 'recipe', label: 'Konsultasi Resep', badge: counts.recipe },
    { key: 'dm', label: 'Pribadi / DM', badge: counts.dm },
    { key: 'assignment', label: 'Tugas Siswa', badge: counts.assignment },
  ];

  return (
    <div className="min-h-screen bg-[#F9E8D6] text-[#341D17] pb-10">
      <div className="mx-auto max-w-6xl px-3 sm:px-6 pt-4 sm:pt-6 space-y-4 sm:space-y-5">
        {/* TOP BAR ATELIER */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] px-4 py-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#802924] font-editorial text-lg font-bold text-[#F9DDBB]">
              Y
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-editorial text-base sm:text-lg font-bold text-[#341D17]">
                  Yugyo
                </span>
                <span className="rounded-md bg-[#F9DDBB] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                  ATELIER
                </span>
              </div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#341D17]/65">
                {portalLabel} • CHAT &amp; SUPPORT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="rounded-full bg-[#F9DDBB] px-3 py-1 text-[11px] font-bold text-[#802924]">
              {counts.pendingReview} Menunggu Review
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#802924] text-xs font-extrabold text-[#F9DDBB]">
              {String(currentUserName || 'A').slice(0, 1).toUpperCase()}
            </span>
          </div>
        </div>

        {/* FILTER PILLS ATAS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-[#802924] text-[#F9DDBB] shadow-sm'
                    : 'border border-[#341D17]/15 bg-[#FFFDF9] text-[#341D17] hover:bg-[#F9DDBB]/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-[#341D17]/30 text-[#F9DDBB]'
                      : 'bg-[#F9DDBB] text-[#802924]'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* ANTREAN KONSULTASI */}
        <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#802924]">💬</span>
              <h2 className="text-xs sm:text-sm font-extrabold text-[#341D17]">
                Antrean Konsultasi
              </h2>
            </div>
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-[#802924]">
              {counts.pendingReview} MENUNGGU REVIEW
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredThreads.map((item) => {
              const selected = activeThread?.id === item.id;
              const isAnswered = item.review_status === 'answered';
              const initials = String(item.student_name || 'S')
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectThread(item)}
                  className={`text-left rounded-2xl p-3.5 transition border cursor-pointer flex flex-col justify-between gap-2.5 ${
                    selected
                      ? 'border-[#802924] bg-[#F9DDBB]/45 shadow-xs'
                      : 'border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#F9DDBB]/25'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#802924] text-xs font-extrabold text-[#F9DDBB]">
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs sm:text-sm font-bold text-[#341D17]">
                          {item.student_name}
                        </p>
                        <p className="truncate text-[11px] text-[#341D17]/65">
                          {item.course_title}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold text-[#341D17]/55">
                      {item.last_time_label || '5 mnt'}
                    </span>
                  </div>

                  <p className="line-clamp-1 text-xs italic text-[#341D17]/80">
                    {item.last_preview || '"Konsultasi teknik baking..."'}
                  </p>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    {isAnswered ? (
                      <span className="rounded-full bg-[#341D17]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#341D17]">
                        ✓ Terjawab
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#F9DDBB] px-2.5 py-0.5 text-[10px] font-extrabold text-[#802924]">
                        • {Math.max(1, Number(item.unread_count) || 1)} Pesan Baru
                      </span>
                    )}

                    <span className="text-[11px] font-extrabold text-[#341D17]">
                      {selected ? 'Sedang Aktif' : '›'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {feedback && (
          <div className="rounded-2xl border border-[#802924]/25 bg-[#F9DDBB]/70 px-4 py-2.5 text-xs font-bold text-[#341D17]">
            {feedback}
          </div>
        )}
        {errorMsg && (
          <div className="rounded-2xl border border-red-600/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-800">
            {errorMsg}
          </div>
        )}

        {/* DETAIL SISWA AKTIF + PROGRES / CATATAN */}
        {activeThread && (
          <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#802924] text-sm font-extrabold text-[#F9DDBB]">
                  {String(activeThread.student_name || 'S')
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-editorial text-base sm:text-lg font-bold text-[#341D17] truncate">
                      {activeThread.student_name}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        activeThread.is_online
                          ? 'bg-[#802924]/15 text-[#802924]'
                          : 'bg-[#341D17]/10 text-[#341D17]/70'
                      }`}
                    >
                      {activeThread.is_online ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  <p className="text-xs text-[#341D17]/70 truncate">
                    {activeThread.course_title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPanelMode((m) => (m ? null : 'notes'))}
                className="h-9 w-9 rounded-full border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#F9DDBB]/50 text-xs font-bold text-[#341D17] cursor-pointer"
                aria-label="Opsi siswa"
              >
                ⋮
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPanelMode((m) => (m === 'progress' ? null : 'progress'))}
                className="rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#F9DDBB]/40 px-4 py-2.5 text-xs font-bold text-[#341D17] transition cursor-pointer"
              >
                📈 Lihat Progres Siswa
              </button>
              <button
                type="button"
                onClick={() => {
                  setNotesDraft(activeThread.teacher_notes || '');
                  setPanelMode((m) => (m === 'notes' ? null : 'notes'));
                }}
                className="rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#F9DDBB]/40 px-4 py-2.5 text-xs font-bold text-[#341D17] transition cursor-pointer"
              >
                📝 Catatan Belajar
              </button>
            </div>

            {panelMode === 'progress' && (
              <div className="rounded-2xl bg-[#F9DDBB]/45 border border-[#341D17]/15 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#341D17]">
                  <span>Progres Modul &amp; Praktik Atelier</span>
                  <span>{activeThread.student_progress || 72}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#341D17]/15">
                  <div
                    style={{ width: `${activeThread.student_progress || 72}%` }}
                    className="h-full rounded-full bg-[#802924]"
                  />
                </div>
              </div>
            )}

            {panelMode === 'notes' && (
              <form
                onSubmit={handleSaveNotes}
                className="rounded-2xl bg-[#F9DDBB]/45 border border-[#341D17]/15 p-4 space-y-2.5"
              >
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                  CATATAN MENTORING INSTRUCTOR
                </label>
                <textarea
                  rows={2}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  className="w-full rounded-xl border border-[#341D17]/20 bg-[#FFFDF9] px-3 py-2 text-xs text-[#341D17]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPanelMode(null)}
                    className="rounded-xl border border-[#341D17]/20 px-3 py-1.5 text-xs font-bold text-[#341D17] cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#802924] px-4 py-1.5 text-xs font-bold text-[#F9DDBB] cursor-pointer"
                  >
                    Simpan Catatan
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* AREA PERCAKAPAN */}
        {activeThread && (
          <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex justify-center">
              <span className="rounded-full bg-[#F9DDBB] px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/75">
                HARI INI • SESI BIMBINGAN ADONAN
              </span>
            </div>

            <div className="space-y-4">
              {displayedMessages.map((msg) => {
                const isTeacher = msg.sender_role === 'teacher';
                const initials = String(msg.sender_name || 'S')
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                if (msg.is_formula_card) {
                  return (
                    <div
                      key={msg.id}
                      className="rounded-2xl border border-[#802924]/25 bg-[#F9DDBB]/55 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#802924] text-xs font-extrabold text-[#F9DDBB]">
                          🍮
                        </span>
                        <div>
                          <p className="text-xs sm:text-sm font-extrabold text-[#341D17]">
                            {msg.formula_title || activeThread.formula_title}
                          </p>
                          <p className="text-xs text-[#341D17]/75">
                            {msg.formula_subtitle || activeThread.formula_subtitle}
                          </p>
                        </div>
                      </div>
                      <span className="self-start sm:self-center rounded-full bg-[#802924]/15 px-3 py-1 text-[10px] font-extrabold text-[#802924]">
                        Terkirim • {msg.time_label}
                      </span>
                    </div>
                  );
                }

                if (isTeacher) {
                  return (
                    <div key={msg.id} className="space-y-1">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[11px] font-semibold text-[#341D17]/60">
                          {msg.time_label}
                        </span>
                        <span className="text-xs font-bold text-[#341D17]">
                          {msg.sender_name}
                        </span>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#802924] text-[10px] font-extrabold text-[#F9DDBB]">
                          {initials}
                        </span>
                      </div>

                      <div className="flex justify-end">
                        <div className="max-w-full sm:max-w-[78%] rounded-2xl rounded-tr-xs bg-[#802924] px-4 py-3 text-xs sm:text-sm leading-relaxed text-[#F9DDBB] shadow-xs space-y-2">
                          <p>{msg.body}</p>
                          {msg.image_url && (
                            <img
                              src={msg.image_url}
                              alt={msg.image_caption || 'Lampiran'}
                              className="max-h-56 rounded-xl object-cover border border-[#F9DDBB]/25"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <span className="text-[10px] font-semibold text-[#341D17]/60">
                          ✓✓ Dibaca oleh murid
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#341D17] text-[10px] font-extrabold text-[#F9DDBB]">
                        {initials}
                      </span>
                      <span className="text-xs font-bold text-[#341D17]">
                        {msg.sender_name}
                      </span>
                      <span className="text-[11px] font-semibold text-[#341D17]/60">
                        {msg.time_label}
                      </span>
                    </div>

                    <div className="max-w-full sm:max-w-[78%] rounded-2xl rounded-tl-xs border border-[#341D17]/10 bg-[#F9DDBB]/40 p-3.5 sm:p-4 space-y-3">
                      <p className="text-xs sm:text-sm leading-relaxed text-[#341D17]">
                        {msg.body}
                      </p>

                      {msg.image_url ? (
                        <div className="relative overflow-hidden rounded-xl border border-[#341D17]/15">
                          <img
                            src={msg.image_url}
                            alt={msg.image_caption || 'Foto Evaluasi'}
                            className="max-h-56 w-full sm:w-72 object-cover"
                          />
                          <span className="absolute bottom-2 left-2 rounded-lg bg-[#341D17]/80 px-2.5 py-1 text-[10px] font-bold text-[#F9DDBB]">
                            🔍 {msg.image_caption || 'Foto Uji Tourage'}
                          </span>
                        </div>
                      ) : (
                        msg.image_caption && (
                          <div className="inline-flex items-center gap-2 rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3 py-2 text-[11px] font-bold text-[#341D17]">
                            <span>📷</span>
                            <span>{msg.image_caption}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* QUICK CHIPS + INPUT BAR BAWAH */}
        {activeThread && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setDraftText(chip.text)}
                  className="shrink-0 rounded-full border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#F9DDBB]/60 px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-[#341D17] transition cursor-pointer"
                >
                  ✨ {chip.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => handleSendMessage(e)}
              className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-3.5 sm:p-4 shadow-sm space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#F9DDBB]/50 px-3 py-1.5 text-xs font-bold text-[#341D17] cursor-pointer"
                  >
                    🖼️ Foto
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const randomTip =
                        BAKER_TIPS[Math.floor(Math.random() * BAKER_TIPS.length)];
                      setDraftText(randomTip);
                    }}
                    className="rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#F9DDBB]/50 px-3 py-1.5 text-xs font-bold text-[#341D17] cursor-pointer"
                  >
                    📖 Sisipkan Tips Baker
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPhotoInput((prev) => !prev)}
                    className="rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#F9DDBB]/50 px-2.5 py-1.5 text-xs font-bold text-[#341D17] cursor-pointer"
                    aria-label="Lampiran tambahan"
                  >
                    📎
                  </button>
                </div>

                <span className="text-[11px] font-semibold text-[#341D17]/55">
                  Yugyo Atelier Mentorship Support
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {showPhotoInput && (
                <div className="rounded-2xl bg-[#F9DDBB]/40 border border-[#341D17]/15 p-3 space-y-2">
                  <input
                    type="text"
                    value={draftImageCaption}
                    onChange={(e) => setDraftImageCaption(e.target.value)}
                    placeholder="Keterangan foto (contoh: Foto Uji Tourage)"
                    className="w-full rounded-xl border border-[#341D17]/20 bg-[#FFFDF9] px-3 py-1.5 text-xs text-[#341D17]"
                  />
                  {draftImageUrl && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-[#802924]">
                        ✓ Foto siap dikirim
                      </span>
                      <button
                        type="button"
                        onClick={clearPhotoDraft}
                        className="text-[11px] font-bold text-red-700 hover:underline cursor-pointer"
                      >
                        Hapus Foto
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-end gap-2.5">
                <textarea
                  rows={2}
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Ketik pesan atau saran teknik baking..."
                  className="flex-1 rounded-2xl border border-[#341D17]/15 bg-[#F9DDBB]/25 px-4 py-2.5 text-xs sm:text-sm text-[#341D17] placeholder:text-[#341D17]/45 focus:outline-none focus:border-[#802924]"
                />

                <button
                  type="submit"
                  disabled={sending}
                  className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-[#802924] hover:bg-[#661F1B] text-base font-bold text-[#F9DDBB] shadow-sm transition cursor-pointer disabled:opacity-50"
                  aria-label="Kirim pesan"
                >
                  ➤
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}