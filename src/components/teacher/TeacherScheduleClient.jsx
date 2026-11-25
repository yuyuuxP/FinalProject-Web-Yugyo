'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const DAY_NAMES_ID = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];

function parseIsoDateLocal(isoStr) {
  const clean = String(isoStr || '').slice(0, 10);
  const parts = clean.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    return new Date();
  }
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatDateIso(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMondayOfWeek(dateObj) {
  const copy = new Date(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate()
  );
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function addDays(dateObj, days) {
  const copy = new Date(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate()
  );
  copy.setDate(copy.getDate() + days);
  return copy;
}

function normalizeSession(row, idx = 0) {
  const rawStatus = String(row?.status ?? 'scheduled')
    .trim()
    .toLowerCase();
  const isDone = Boolean(
    row?.is_done ??
      row?.isDone ??
      ['done', 'completed', 'selesai'].includes(rawStatus)
  );

  return {
    id: Number(row?.id ?? idx + 1),
    courseId: Number(row?.course_id ?? row?.courseId ?? 0),
    courseTitle: String(
      row?.course_title ?? row?.courseTitle ?? 'Kelas Atelier'
    ).trim(),
    title: String(row?.title ?? `Sesi #${idx + 1}`).trim(),
    notes: String(row?.notes ?? '').trim(),
    sessionDate: String(row?.session_date ?? row?.sessionDate ?? '').slice(
      0,
      10
    ),
    sessionTime: String(
      row?.session_time ?? row?.sessionTime ?? '15:00 WITA'
    ).trim(),
    locationLabel: String(
      row?.location_label ?? row?.locationLabel ?? 'Atelier Live'
    ).trim(),
    isDone,
  };
}

function normalizeParticipant(row, idx = 0) {
  const studentName = String(
    row?.student_name ??
      row?.studentName ??
      row?.full_name ??
      row?.name ??
      `Siswa #${idx + 1}`
  ).trim();
  const studentEmail = String(
    row?.student_email ?? row?.studentEmail ?? row?.email ?? ''
  ).trim();
  const totalSessions = Math.max(
    0,
    Number(row?.total_sessions ?? row?.totalSessions ?? 0)
  );
  const completedSessions = Math.min(
    totalSessions,
    Math.max(
      0,
      Number(
        row?.completed_sessions ??
          row?.completedSessions ??
          row?.done_sessions ??
          0
      )
    )
  );
  const percent =
    totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0;

  return {
    studentId: Number(row?.student_id ?? row?.studentId ?? row?.id ?? idx + 1),
    studentName,
    studentEmail,
    initial: studentName.charAt(0).toUpperCase() || 'S',
    totalSessions,
    completedSessions,
    percent,
  };
}

export default function TeacherScheduleClient({
  teacher = null,
  initialCourses = [],
  initialSessions = [],
  initialParticipants = [],
}) {
  const [courses, setCourses] = useState(
    Array.isArray(initialCourses) ? initialCourses : []
  );
  const [sessions, setSessions] = useState(() =>
    Array.isArray(initialSessions)
      ? initialSessions.map((r, i) => normalizeSession(r, i))
      : []
  );
  const [participants, setParticipants] = useState(() =>
    Array.isArray(initialParticipants)
      ? initialParticipants.map((r, i) => normalizeParticipant(r, i))
      : []
  );

  const initialAnchor = useMemo(() => {
    if (Array.isArray(initialSessions) && initialSessions.length > 0) {
      const first = String(initialSessions[0]?.session_date ?? '').slice(0, 10);
      if (first) return parseIsoDateLocal(first);
    }
    return new Date();
  }, [initialSessions]);

  const [weekStart, setWeekStart] = useState(() =>
    getMondayOfWeek(initialAnchor)
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    formatDateIso(initialAnchor)
  );
  const [busySessionId, setBusySessionId] = useState(null);

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [formCourseId, setFormCourseId] = useState(() =>
    initialCourses?.[0]?.id ? String(initialCourses[0].id) : ''
  );
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(() => formatDateIso(initialAnchor));
  const [formTime, setFormTime] = useState('15:00 WITA');
  const [formLocation, setFormLocation] = useState('Atelier Live');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshScheduleData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (teacher?.id) params.set('teacherId', String(teacher.id));
      if (teacher?.full_name) params.set('teacherName', teacher.full_name);

      const res = await fetch(`/api/teacher/schedule?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      if (!data) return;

      if (Array.isArray(data.courses)) {
        setCourses(data.courses);
        const firstCourseId = data.courses[0]?.id;
        if (firstCourseId) {
          setFormCourseId((prev) => prev || String(firstCourseId));
        }
      }
      if (Array.isArray(data.sessions)) {
        setSessions(data.sessions.map((r, i) => normalizeSession(r, i)));
      }
      if (Array.isArray(data.participants)) {
        setParticipants(
          data.participants.map((r, i) => normalizeParticipant(r, i))
        );
      }
    } catch {
      // Abaikan gangguan jaringan sementara
    }
  }, [teacher]);

  useEffect(() => {
    let active = true;

    async function syncScheduleOnMount() {
      try {
        const params = new URLSearchParams();
        if (teacher?.id) params.set('teacherId', String(teacher.id));
        if (teacher?.full_name) params.set('teacherName', teacher.full_name);

        const res = await fetch(`/api/teacher/schedule?${params.toString()}`, {
          cache: 'no-store',
        });
        if (!active || !res.ok) return;

        const data = await res.json().catch(() => null);
        if (!active || !data) return;

        if (Array.isArray(data.courses)) {
          setCourses(data.courses);
          const firstCourseId = data.courses[0]?.id;
          if (firstCourseId) {
            setFormCourseId((prev) => prev || String(firstCourseId));
          }
        }
        if (Array.isArray(data.sessions)) {
          setSessions(data.sessions.map((r, i) => normalizeSession(r, i)));
        }
        if (Array.isArray(data.participants)) {
          setParticipants(
            data.participants.map((r, i) => normalizeParticipant(r, i))
          );
        }
      } catch {
        // Abaikan gangguan jaringan sementara
      }
    }

    syncScheduleOnMount();

    return () => {
      active = false;
    };
  }, [teacher]);

  const datesWithSessions = useMemo(() => {
    const set = new Set();
    for (const s of sessions) {
      if (s.sessionDate) set.add(s.sessionDate);
    }
    return set;
  }, [sessions]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, idx) => {
      const dt = addDays(weekStart, idx);
      const iso = formatDateIso(dt);
      return {
        iso,
        dayName: DAY_NAMES_ID[idx],
        dayNumber: String(dt.getDate()).padStart(2, '0'),
        hasSession: datesWithSessions.has(iso),
      };
    });
  }, [weekStart, datesWithSessions]);

  const daySessions = useMemo(
    () => sessions.filter((s) => s.sessionDate === selectedDate),
    [sessions, selectedDate]
  );

  const handleShiftWeek = (delta) => {
    const nextStart = addDays(weekStart, delta * 7);
    setWeekStart(nextStart);
    const nextIso = formatDateIso(nextStart);
    setSelectedDate(nextIso);
    setFormDate(nextIso);
  };

  const handleToggleDone = async (sessionItem) => {
    if (busySessionId === sessionItem.id) return;
    setBusySessionId(sessionItem.id);

    try {
      const res = await fetch('/api/teacher/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionItem.id,
          isDone: !sessionItem.isDone,
        }),
      });
      if (res.ok) {
        await refreshScheduleData();
      }
    } finally {
      setBusySessionId(null);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (busySessionId === sessionId) return;
    setBusySessionId(sessionId);

    try {
      const res = await fetch(`/api/teacher/schedule?sessionId=${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await refreshScheduleData();
      }
    } finally {
      setBusySessionId(null);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!formCourseId || !formTitle.trim() || !formDate || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/teacher/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: Number(formCourseId),
          title: formTitle.trim(),
          sessionDate: formDate,
          sessionTime: formTime.trim() || '15:00 WITA',
          locationLabel: formLocation.trim() || 'Atelier Live',
          notes: formNotes.trim(),
        }),
      });
      if (res.ok) {
        setFormTitle('');
        setFormNotes('');
        setIsPopupOpen(false);
        setSelectedDate(formDate);
        setWeekStart(getMondayOfWeek(parseIsoDateLocal(formDate)));
        await refreshScheduleData();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-[#341D17] pb-12">
      {/* Kalender Mingguan & Tombol Pop-up Sesi */}
      <section className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#802924]">
            Kalender Kelas &amp; Sesi Atelier
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleShiftWeek(-1)}
              aria-label="Minggu sebelumnya"
              className="w-8 h-8 rounded-xl border border-[#341D17]/15 bg-[#FAF6F0] hover:bg-[#F9DDBB]/65 text-xs font-bold cursor-pointer"
            >
              &lsaquo;
            </button>
            <button
              type="button"
              onClick={() => handleShiftWeek(1)}
              aria-label="Minggu berikutnya"
              className="w-8 h-8 rounded-xl border border-[#341D17]/15 bg-[#FAF6F0] hover:bg-[#F9DDBB]/65 text-xs font-bold cursor-pointer"
            >
              &rsaquo;
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5">
          {weekDays.map((day) => {
            const isSelected = selectedDate === day.iso;
            return (
              <button
                key={day.iso}
                type="button"
                onClick={() => {
                  setSelectedDate(day.iso);
                  setFormDate(day.iso);
                }}
                className={`rounded-2xl py-3 px-2 border text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? 'bg-[#802924] text-[#FFFDF9] border-[#802924] shadow-xs'
                    : 'bg-[#FAF6F0]/75 hover:bg-[#F9DDBB]/45 text-[#341D17] border-[#341D17]/10'
                }`}
              >
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider ${
                    isSelected ? 'text-[#F9DDBB]' : 'text-[#341D17]/55'
                  }`}
                >
                  {day.dayName}
                </span>
                <span className="text-lg font-extrabold leading-tight">
                  {day.dayNumber}
                </span>
                <span
                  className={`mt-1 h-1.5 w-1.5 rounded-full ${
                    day.hasSession
                      ? isSelected
                        ? 'bg-[#F9DDBB]'
                        : 'bg-[#802924]'
                      : 'bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#341D17]/8">
          <p className="text-xs text-[#341D17]/65">
            Butuh membuka sesi mentoring atau kelas dadakan di luar jadwal reguler?
          </p>
          <button
            type="button"
            onClick={() => setIsPopupOpen((prev) => !prev)}
            className="rounded-xl bg-[#802924] hover:bg-[#661F1B] px-4 py-2 text-xs font-bold text-[#FFFDF9] transition cursor-pointer"
          >
            + Pop-up Sesi
          </button>
        </div>

        {isPopupOpen && (
          <form
            onSubmit={handleCreateSession}
            className="rounded-2xl bg-[#FAF6F0] border border-[#341D17]/12 p-4 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#341D17]/75 mb-1">
                  Kursus Terkait
                </label>
                <select
                  value={formCourseId}
                  onChange={(e) => setFormCourseId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3 py-2 text-xs text-[#341D17]"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#341D17]/75 mb-1">
                  Judul Sesi
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Praktik Adonan Lumer"
                  required
                  className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3 py-2 text-xs text-[#341D17]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#341D17]/75 mb-1">
                  Tanggal Sesi
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3 py-2 text-xs text-[#341D17]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#341D17]/75 mb-1">
                  Waktu &amp; Ruangan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="15:00 WITA"
                    className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3 py-2 text-xs text-[#341D17]"
                  />
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Atelier Live"
                    className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3 py-2 text-xs text-[#341D17]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#341D17]/75 mb-1">
                Catatan Sesi
              </label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Ringkasan materi atau alat yang perlu disiapkan..."
                className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3 py-2 text-xs text-[#341D17]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPopupOpen(false)}
                className="rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2 text-xs font-bold text-[#341D17] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-[#802924] hover:bg-[#661F1B] px-4 py-2 text-xs font-bold text-[#FFFDF9] cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Sesi'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Sesi Kelas Terjadwal */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-editorial text-xl font-bold text-[#341D17]">
              Sesi Kelas Terjadwal
            </h2>
            <p className="text-xs text-[#341D17]/60">
              Tandai kelas yang telah selesai dengan Mark as Done untuk memperbarui progres keaktifan siswa.
            </p>
          </div>
          <span className="rounded-full bg-[#F9DDBB]/80 border border-[#802924]/15 px-3 py-1 text-[11px] font-extrabold text-[#802924]">
            {daySessions.length} Sesi Terdata
          </span>
        </div>

        {daySessions.length === 0 ? (
          <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 p-5 text-center text-xs text-[#341D17]/60">
            Belum ada sesi kelas untuk pilihan tanggal ini. Klik{' '}
            <span className="font-bold text-[#802924]">+ Pop-up Sesi</span>{' '}
            untuk menambahkan.
          </div>
        ) : (
          <div className="space-y-3">
            {daySessions.map((item) => {
              const isBusy = busySessionId === item.id;
              return (
                <article
                  key={item.id}
                  className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 p-5 space-y-3 shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-extrabold uppercase ${
                          item.isDone
                            ? 'bg-[#341D17] text-[#FFFDF9]'
                            : 'bg-[#F9DDBB] text-[#802924]'
                        }`}
                      >
                        {item.isDone ? 'SELESAI (DONE)' : 'TERJADWAL'}
                      </span>
                      <span className="font-semibold text-[#341D17]/65">
                        {item.sessionDate} &bull; {item.sessionTime}
                      </span>
                    </div>
                    <span className="rounded-full border border-[#341D17]/12 bg-[#FAF6F0] px-3 py-0.5 font-semibold text-[#341D17]/75">
                      {item.locationLabel}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                      {item.courseTitle}
                    </p>
                    <h3 className="font-editorial text-lg font-bold text-[#341D17]">
                      {item.title}
                    </h3>
                    {item.notes && (
                      <p className="text-xs text-[#341D17]/65">{item.notes}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#341D17]/8 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[11px] text-[#341D17]/60">
                      {item.isDone
                        ? 'Kelas telah divalidasi tuntas. Klik tombol untuk membatalkan Mark as Done dan mengaktifkan kembali.'
                        : 'Kelas sudah selesai dilaksanakan? Validasi agar progres siswa bertambah.'}
                    </p>

                    <div className="flex items-center gap-2">
                      {!item.isDone && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDeleteSession(item.id)}
                          className="rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#FAF6F0] px-3.5 py-2 text-xs font-bold text-[#341D17] transition cursor-pointer disabled:opacity-60"
                        >
                          Batalkan
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleToggleDone(item)}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer disabled:opacity-60 ${
                          item.isDone
                            ? 'bg-[#F9DDBB]/80 border border-[#802924]/25 text-[#802924]'
                            : 'bg-[#802924] hover:bg-[#661F1B] text-[#FFFDF9]'
                        }`}
                      >
                        {item.isDone
                          ? '✓ Marked as Done • Batal'
                          : 'Mark as Done'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Daftar Partisipan Siswa */}
      <section id="participants" className="space-y-3 scroll-mt-24">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-editorial text-xl font-bold text-[#341D17]">
              Daftar Partisipan Siswa
            </h2>
            <p className="text-xs text-[#341D17]/60">
              Progres keaktifan dihitung dari jumlah kelas/sesi yang telah diikuti dan di-mark as done.
            </p>
          </div>
          <span className="rounded-full bg-[#F9DDBB]/80 border border-[#802924]/15 px-3 py-1 text-[11px] font-extrabold text-[#802924]">
            {participants.length} Partisipan
          </span>
        </div>

        {participants.length === 0 ? (
          <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 p-5 text-center text-xs text-[#341D17]/60">
            Belum ada siswa yang mendaftar pada kursus yang Anda ampu.
          </div>
        ) : (
          <div className="space-y-3">
            {participants.map((student) => (
              <div
                key={student.studentId}
                className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 p-5 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#802924] text-[#FFFDF9] font-extrabold text-sm flex items-center justify-center shrink-0">
                      {student.initial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#341D17] truncate">
                        {student.studentName}
                      </p>
                      {student.studentEmail && (
                        <p className="text-xs text-[#341D17]/60 truncate">
                          {student.studentEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                      student.completedSessions > 0
                        ? 'bg-[#F9DDBB] text-[#802924]'
                        : 'bg-[#FAF6F0] border border-[#341D17]/12 text-[#341D17]/65'
                    }`}
                  >
                    {student.completedSessions > 0
                      ? 'AKTIF MENGIKUTI'
                      : 'MENUNGGU MARK AS DONE'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#341D17]/75">
                      Keaktifan Kelas (Mark as Done)
                    </span>
                    <span className="font-bold text-[#341D17]">
                      {student.completedSessions}/{student.totalSessions} Kelas (
                      {student.percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#F9DDBB]/70 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#802924] transition-all duration-300"
                      style={{ width: `${student.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}