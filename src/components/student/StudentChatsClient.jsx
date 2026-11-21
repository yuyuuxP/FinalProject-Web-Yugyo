'use client';

import { useMemo, useRef, useState } from 'react';

const QUICK_TOPICS = [
  'Tips Meja Marmer',
  'Evaluasi Proofing',
  'Konsultasi Ragi Alami',
];

const FALLBACK_INSTRUCTORS = [
  {
    id: 'inst-1',
    full_name: 'Ayu',
    specialty: 'Master Baker Atelier • Viennoiserie & Laminasi',
    course_title: 'French Croissant & Lamination Masterclass',
  },
  {
    id: 'inst-2',
    full_name: 'Firah',
    specialty: 'Artisan Bread & Sourdough Specialist',
    course_title: 'Mastering Sourdough Starter',
  },
  {
    id: 'inst-3',
    full_name: 'Atelier Pastry',
    specialty: 'Patisserie & Sensory Evaluation',
    course_title: 'Macaron Prancis Anti Gagal',
  },
];

function getInitials(name) {
  const parts = String(name || 'CH')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'CH';
  return parts
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatTimeLabel(dateVal) {
  if (!dateVal) return '10:18';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '10:18';
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StudentChatsClient({
  student,
  instructors = [],
  initialMessages = [],
}) {
  const instructorList = useMemo(
    () =>
      Array.isArray(instructors) && instructors.length > 0
        ? instructors
        : FALLBACK_INSTRUCTORS,
    [instructors]
  );

  const [selectedInstructorId, setSelectedInstructorId] = useState(
    () => instructorList[0]?.id ?? null
  );

  const selectedInstructor = useMemo(() => {
    if (instructorList.length === 0) return null;
    if (selectedInstructorId != null) {
      return (
        instructorList.find((i) => String(i.id) === String(selectedInstructorId)) ||
        instructorList[0]
      );
    }
    return instructorList[0];
  }, [instructorList, selectedInstructorId]);

  const studentName = student?.full_name || 'Siswa Atelier';

  const defaultThreadByInstructor = useMemo(() => {
    const map = {};
    instructorList.forEach((inst, idx) => {
      const key = String(inst.id);
      const firstName = String(inst.full_name || 'Chef').split(' ')[0];
      map[key] = [
        {
          id: `seed-${key}-1`,
          senderRole: 'student',
          senderName: studentName,
          timeLabel: '10:14',
          text: `Halo Chef ${firstName}! Saya sedang di tahap praktik laminasi & fermentasi untuk ${
            inst.course_title || 'kelas atelier'
          }. Apakah suhu adonan dan mentega sudah sesuai jika sedikit kaku saat di-roll?`,
          attachmentUrl:
            idx === 0 ? '/pictures/courses/french_pastry/croissant.png' : '',
          attachmentName: idx === 0 ? 'butter_layer_test.jpg' : '',
          statusLabel: 'Terkirim',
        },
        {
          id: `seed-${key}-2`,
          senderRole: 'instructor',
          senderName: `Chef ${inst.full_name}`,
          timeLabel: '10:18',
          text: `Halo ${studentName}! Itu tanda classic butter shattering — mentega berada di bawah 14°C sementara adonan dinginnya terlalu kaku. Diamkan di meja kerja selama 4–5 menit di suhu ruang sebelum di-roll kembali agar mentega menyatu sempurna tanpa memecah lapisan lemak.`,
          showParameterCard: true,
        },
        {
          id: `seed-${key}-3`,
          senderRole: 'student',
          senderName: studentName,
          timeLabel: '10:20',
          text: `Baik Chef, terima kasih banyak sarannya! Saya coba istirahatkan sebentar lalu roll perlahan dengan tekanan bertahap.`,
          statusLabel: 'Terkirim',
        },
      ];
    });
    return map;
  }, [instructorList, studentName]);

  const [extraMessagesByInstructor, setExtraMessagesByInstructor] = useState(() => {
    const grouped = {};
    if (!Array.isArray(initialMessages) || initialMessages.length === 0) {
      return grouped;
    }

    for (const row of initialMessages) {
      const isFromStudent = Number(row.sender_id) === Number(student?.id);
      const partnerId = String(isFromStudent ? row.receiver_id : row.sender_id);
      if (!partnerId) continue;

      if (!grouped[partnerId]) grouped[partnerId] = [];
      grouped[partnerId].push({
        id: row.id || `db-${Math.random()}`,
        senderRole: isFromStudent ? 'student' : 'instructor',
        senderName: isFromStudent ? studentName : 'Chef Instruktur',
        timeLabel: formatTimeLabel(row.created_at),
        text: row.message_text || '',
        attachmentUrl: row.attachment_url || '',
        attachmentName: row.attachment_url ? 'lampiran-adonan.jpg' : '',
        showParameterCard: false,
        statusLabel: 'Terkirim',
      });
    }
    return grouped;
  });

  const [draftText, setDraftText] = useState('');
  const [attachedPreview, setAttachedPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  const activeKey = String(selectedInstructor?.id ?? 'default');

  const threadMessages = useMemo(() => {
    const base = defaultThreadByInstructor[activeKey] || [];
    const extras = extraMessagesByInstructor[activeKey] || [];
    return [...base, ...extras];
  }, [defaultThreadByInstructor, extraMessagesByInstructor, activeKey]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAttachedPreview({
      url,
      name: file.name,
    });
  };

  const handleSendMessage = async (customText) => {
    const textToSend = String(
      typeof customText === 'string' ? customText : draftText
    ).trim();
    if ((!textToSend && !attachedPreview) || sending || !selectedInstructor) {
      return;
    }

    setSending(true);
    const nowTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newMsg = {
      id: `local-${Date.now()}`,
      senderRole: 'student',
      senderName: studentName,
      timeLabel: nowTime,
      text: textToSend || `Lampiran foto: ${attachedPreview?.name || 'adonan.jpg'}`,
      attachmentUrl: attachedPreview?.url || '',
      attachmentName: attachedPreview?.name || '',
      statusLabel: 'Terkirim',
    };

    setExtraMessagesByInstructor((prev) => ({
      ...prev,
      [activeKey]: [...(prev[activeKey] || []), newMsg],
    }));

    if (typeof customText !== 'string') {
      setDraftText('');
    }
    setAttachedPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      if (Number.isInteger(Number(selectedInstructor.id))) {
        await fetch('/api/student/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiver_id: Number(selectedInstructor.id),
            message_text: newMsg.text,
            attachment_url: newMsg.attachmentUrl || null,
          }),
        });
      }
    } catch (err) {
      console.warn('Send chat message warning:', err?.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-4">
      {/* TOMBOL PILIH INSTRUKTUR YANG INGIN DI-CHAT */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/65">
            PILIH INSTRUKTUR ATELIER
          </span>
          <span className="text-[10px] font-semibold text-[#802924]">
            {instructorList.length} Instruktur Tersedia
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {instructorList.map((inst) => {
            const isActive =
              selectedInstructor &&
              String(inst.id) === String(selectedInstructor.id);
            return (
              <button
                key={inst.id}
                type="button"
                onClick={() => setSelectedInstructorId(inst.id)}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-[#802924] text-[#FFFDF9] shadow-2xs'
                    : 'border border-[#341D17]/15 bg-[#FFFDF9] text-[#341D17] hover:bg-[#FAF6F0]'
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-extrabold ${
                    isActive
                      ? 'bg-[#F9DDBB] text-[#802924]'
                      : 'bg-[#802924] text-[#FFFDF9]'
                  }`}
                >
                  {getInitials(inst.full_name)}
                </span>
                <span>Chef {inst.full_name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* KARTU HEADER INSTRUKTUR AKTIF */}
      {selectedInstructor && (
        <section className="rounded-2xl border border-[#341D17]/12 bg-[#FFFDF9] p-3.5 sm:p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#802924] text-xs font-extrabold text-[#FFFDF9]">
                <span>{getInitials(selectedInstructor.full_name)}</span>
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#FFFDF9] bg-[#12B76A]"
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-editorial text-base sm:text-lg font-bold text-[#341D17] truncate">
                    Chef {selectedInstructor.full_name}
                  </h1>
                  <span className="rounded-full bg-[#ECFDF3] px-2.5 py-0.5 text-[10px] font-bold text-[#027A48]">
                    &bull; Online
                  </span>
                </div>
                <p className="text-[11px] text-[#341D17]/65 truncate">
                  {selectedInstructor.specialty}
                </p>
              </div>
            </div>

            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FAF6F0] border border-[#341D17]/10 text-sm text-[#341D17]">
              &#127891;
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#341D17]/8 text-[11px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[#802924] font-bold">&#128202;</span>
              <span className="font-extrabold uppercase tracking-wider text-[#341D17]/60">
                KONSULTASI AKTIF
              </span>
              <span className="font-bold text-[#341D17] truncate">
                {selectedInstructor.course_title}
              </span>
            </div>
            <span className="text-[#341D17]/55 font-semibold shrink-0">
              Modul 04
            </span>
          </div>
        </section>
      )}

      {/* AREA PERCAKAPAN */}
      <section className="rounded-3xl border border-[#341D17]/12 bg-[#FFFDF9] p-4 sm:p-6 shadow-2xs space-y-5">
        <div className="flex justify-center">
          <span className="rounded-full border border-[#341D17]/10 bg-[#FAF6F0] px-3.5 py-1 text-[10px] font-semibold text-[#341D17]/65">
            Hari Ini &bull; Sesi Bimbingan Teknis Atelier
          </span>
        </div>

        <div className="space-y-4">
          {threadMessages.map((msg) => {
            const isStudent = msg.senderRole === 'student';

            if (isStudent) {
              return (
                <div key={msg.id} className="flex flex-col items-end space-y-1">
                  <span className="text-[10px] font-semibold text-[#341D17]/55 pr-1">
                    {msg.senderName} &bull; {msg.timeLabel}
                  </span>

                  <div className="max-w-[88%] sm:max-w-[75%] rounded-2xl rounded-tr-sm bg-[#802924] px-4 py-3 text-xs sm:text-sm text-[#FFFDF9] shadow-2xs leading-relaxed">
                    {msg.text}
                  </div>

                  {msg.attachmentUrl && (
                    <div className="max-w-[260px] space-y-1 pt-1">
                      <div className="relative overflow-hidden rounded-2xl border border-[#341D17]/12 bg-[#FAF6F0]">
                        <img
                          src={msg.attachmentUrl}
                          alt={msg.attachmentName || 'Lampiran adonan'}
                          className="h-32 w-full object-cover"
                        />
                        <span className="absolute bottom-2 left-2 rounded-md bg-[#341D17]/80 px-2 py-0.5 text-[9px] font-bold text-[#FFFDF9]">
                          Foto Uji Lipatan &bull; 0.8 MB
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-1 text-[10px] text-[#341D17]/55">
                        <span>{msg.attachmentName || 'butter_layer_test.jpg'}</span>
                        <span className="text-[#802924] font-bold">&#10003;&#10003;</span>
                      </div>
                    </div>
                  )}

                  {!msg.attachmentUrl && msg.statusLabel && (
                    <span className="text-[10px] text-[#341D17]/50 pr-1">
                      &#10003;&#10003; {msg.statusLabel}
                    </span>
                  )}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className="flex flex-col items-start space-y-1"
              >
                <span className="text-[10px] font-semibold text-[#341D17]/55 pl-1">
                  {msg.senderName} &bull; {msg.timeLabel}
                </span>

                <div className="max-w-[92%] sm:max-w-[80%] rounded-2xl rounded-tl-sm border border-[#341D17]/12 bg-[#FAF6F0]/80 p-4 text-xs sm:text-sm text-[#341D17] shadow-2xs space-y-3 leading-relaxed">
                  <p>{msg.text}</p>

                  {msg.showParameterCard && (
                    <div className="rounded-xl border border-[#341D17]/10 bg-[#FFFDF9] p-3 flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F9DDBB]/75 text-sm text-[#802924]">
                        &#127777;
                      </span>
                      <div className="space-y-0.5 text-xs">
                        <span className="block text-[9px] font-extrabold uppercase tracking-wider text-[#802924]">
                          PARAMETER PRESISI ATELIER
                        </span>
                        <p className="font-bold text-[#341D17]">
                          Suhu Optimal: 14&deg;C &ndash; 16&deg;C
                        </p>
                        <p className="text-[11px] text-[#341D17]/65">
                          &#128336; Resting Chiller: 45 Menit
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* TOPIK CEPAT & INPUT PESAN */}
      <section className="space-y-3">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/65">
            <span>&#10024;</span>
            <span>TOPIK CEPAT SESI INI</span>
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => handleSendMessage(topic)}
                className="rounded-full border border-[#341D17]/12 bg-[#FFFDF9] hover:bg-[#F9DDBB]/50 px-3.5 py-1.5 text-xs font-semibold text-[#341D17] transition cursor-pointer"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#341D17]/12 bg-[#FFFDF9] p-3.5 sm:p-4 shadow-2xs space-y-3">
          {attachedPreview && (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-[#FAF6F0] px-3 py-2 text-xs">
              <span className="truncate font-semibold text-[#341D17]">
                Lampiran: {attachedPreview.name}
              </span>
              <button
                type="button"
                onClick={() => setAttachedPreview(null)}
                className="text-xs font-bold text-[#802924] cursor-pointer"
              >
                Hapus
              </button>
            </div>
          )}

          <textarea
            rows={2}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ketik pesan atau konsultasi resep ke Chef ${
              selectedInstructor?.full_name || 'Instruktur'
            }...`}
            className="w-full resize-none bg-transparent text-xs sm:text-sm text-[#341D17] placeholder:text-[#341D17]/45 focus:outline-none"
          />

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#341D17]/8">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Lampirkan foto adonan"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-[#341D17]/70 hover:bg-[#FAF6F0] transition cursor-pointer"
              >
                &#128247;
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Mohon evaluasi formula resep sesi ini ya Chef.')}
                aria-label="Sisipkan catatan formula"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-[#341D17]/70 hover:bg-[#FAF6F0] transition cursor-pointer"
              >
                &#128196;
              </button>
            </div>

            <button
              type="button"
              disabled={sending}
              onClick={() => handleSendMessage()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#802924] hover:bg-[#661F1B] px-4 py-2 text-xs font-bold text-[#FFFDF9] transition cursor-pointer disabled:opacity-60"
            >
              <span>Kirim</span>
              <span>&#10148;</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}