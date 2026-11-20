'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const DAY_NAMES = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function formatDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateKeyLocal(dateKey) {
  const parts = String(dateKey || '').split('-').map(Number);
  if (parts.length === 3 && parts.every((n) => Number.isFinite(n) && n > 0)) {
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }
  return new Date(2026, 10, 20, 12, 0, 0);
}

function normalizeSessionStatus(item) {
  if (item?.status === 'canceled') return 'canceled';
  if (item?.status === 'completed' || item?.is_done) return 'completed';
  return 'scheduled';
}

export default function TeacherScheduleClient({
  teacher,
  courses = [],
  initialSessions = [],
  initialParticipants = [],
  initialToday = '2026-11-20',
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const todayStr = initialToday;

  const [sessions, setSessions] = useState(
    (Array.isArray(initialSessions) ? initialSessions : []).map((s) => ({
      ...s,
      status: normalizeSessionStatus(s),
    }))
  );
  const [participants, setParticipants] = useState(
    Array.isArray(initialParticipants) ? initialParticipants : []
  );
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [weekOffset, setWeekOffset] = useState(0);
  const [filterByDate, setFilterByDate] = useState(true);

  const [busyId, setBusyId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    course_id: courses[0]?.id || '',
    title: '',
    notes: '',
    session_date: todayStr,
    session_time: '15:00 WITA',
    location_label: 'Atelier Live',
    is_popup: false,
  });

  const weekDays = useMemo(() => {
    const base = parseDateKeyLocal(todayStr);
    base.setDate(base.getDate() + weekOffset * 7);
    const currentDay = base.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(base);
    monday.setDate(base.getDate() + diffToMonday);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = formatDateKey(d);
      const hasSession = sessions.some((s) => s.session_date === key);
      return {
        key,
        dayLabel: DAY_NAMES[d.getDay()],
        dateNum: d.getDate(),
        monthName: MONTH_NAMES[d.getMonth()],
        year: d.getFullYear(),
        hasSession,
      };
    });
  }, [todayStr, weekOffset, sessions]);

  const activeMonthTitle = useMemo(() => {
    const mid = weekDays[3] || weekDays[0];
    return mid ? `${mid.monthName} ${mid.year}` : 'November 2026';
  }, [weekDays]);

  const activeDate = filterByDate ? selectedDate : todayStr;

  const visibleSessions = useMemo(() => {
    if (!filterByDate) return sessions;
    return sessions.filter((s) => s.session_date === selectedDate);
  }, [sessions, filterByDate, selectedDate]);

  const stats = useMemo(() => {
    const dateSessions = filterByDate
      ? sessions.filter((s) => s.session_date === selectedDate)
      : sessions;

    const scheduledCourseIds = new Set(
      dateSessions.map((s) => Number(s.course_id)).filter(Boolean)
    );

    const matchingParticipants = filterByDate
      ? participants.filter((p) => scheduledCourseIds.has(Number(p.course_id)))
      : participants;

    const uniqueStudentIds = new Set(matchingParticipants.map((p) => p.student_id));
    const activeStudentsCount = matchingParticipants.filter(
      (p) => Number(p.done_classes_count || 0) > 0
    ).length;

    const completedStudentsOnDateCount = matchingParticipants.filter((p) => {
      const dates = Array.isArray(p.completed_dates) ? p.completed_dates : [];
      return filterByDate
        ? dates.includes(selectedDate)
        : Number(p.done_classes_count || 0) > 0;
    }).length;

    const pendingValidationCount = dateSessions.filter(
      (s) => normalizeSessionStatus(s) === 'scheduled'
    ).length;

    const completedCount = dateSessions.filter(
      (s) => normalizeSessionStatus(s) === 'completed'
    ).length;

    return {
      dateSessionsCount: dateSessions.length,
      totalAllSessionsCount: sessions.length,
      totalParticipants: uniqueStudentIds.size || matchingParticipants.length,
      activeStudentsCount,
      completedStudentsOnDateCount,
      pendingValidationCount,
      completedCount,
    };
  }, [sessions, participants, filterByDate, selectedDate]);

  const openCreateModal = (popupMode = false) => {
    setErrorMsg('');
    setFormData((prev) => ({
      ...prev,
      course_id: prev.course_id || courses[0]?.id || '',
      title: popupMode ? 'Sesi Dadakan / Troubleshooting Kelas' : '',
      session_date: selectedDate || todayStr,
      is_popup: popupMode,
    }));
    setIsModalOpen(true);
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setFeedbackMsg('');

    try {
      const res = await fetch('/api/teacher/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Gagal menyimpan jadwal sesi.');
      }

      const matchedCourse = courses.find((c) => String(c.id) === String(formData.course_id));
      const created = {
        ...(data.session || {}),
        id: data.session?.id || Date.now(),
        course_id: Number(formData.course_id),
        title: formData.title,
        notes: formData.notes,
        session_date: formData.session_date,
        session_time: formData.session_time,
        location_label: formData.location_label,
        is_popup: Boolean(formData.is_popup),
        is_done: false,
        status: 'scheduled',
        course_title: matchedCourse?.title || 'Kursus Atelier',
      };

      setSessions((prev) => [created, ...prev]);
      setSelectedDate(formData.session_date);
      setFilterByDate(true);
      setIsModalOpen(false);
      setFeedbackMsg(
        formData.is_popup
          ? 'Kelas dadakan berhasil ditambahkan ke jadwal.'
          : 'Jadwal sesi kelas baru berhasil disimpan.'
      );
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat membuat sesi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSession = async (sessionItem) => {
    const currentStatus = normalizeSessionStatus(sessionItem);
    if (!sessionItem?.id || busyId || currentStatus !== 'scheduled') return;

    const confirmed = window.confirm(
      `Batalkan kelas "${sessionItem.title}"? Status akan berubah menjadi Dibatalkan (canceled) dan tidak bisa di-Mark as Done.`
    );
    if (!confirmed) return;

    setBusyId(sessionItem.id);
    setErrorMsg('');
    setFeedbackMsg('');

    try {
      const res = await fetch('/api/teacher/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionItem.id, action: 'cancel' }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Gagal membatalkan kelas.');
      }

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionItem.id ? { ...s, status: 'canceled', is_done: false } : s
        )
      );
      setFeedbackMsg(`Kelas "${sessionItem.title}" telah diubah menjadi Dibatalkan.`);
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal membatalkan kelas.');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleMarkAsDone = async (sessionItem) => {
    const currentStatus = normalizeSessionStatus(sessionItem);
    if (!sessionItem?.id || busyId || currentStatus === 'canceled') return;

    const isCurrentlyCompleted = currentStatus === 'completed';
    const nextAction = isCurrentlyCompleted ? 'unmark_done' : 'mark_done';

    setBusyId(sessionItem.id);
    setErrorMsg('');
    setFeedbackMsg('');

    try {
      const res = await fetch('/api/teacher/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionItem.id, action: nextAction }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Gagal memperbarui status Mark as Done.');
      }

      if (isCurrentlyCompleted) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionItem.id ? { ...s, status: 'scheduled', is_done: false } : s
          )
        );

        setParticipants((prev) =>
          prev.map((p) => {
            if (Number(p.course_id) !== Number(sessionItem.course_id)) return p;
            const nextDone = Math.max(0, Number(p.done_classes_count || 0) - 1);
            const total = Math.max(Number(p.total_classes_count || 1), 1);
            const nextDates = (Array.isArray(p.completed_dates) ? p.completed_dates : []).filter(
              (d) => d !== sessionItem.session_date
            );
            return {
              ...p,
              done_classes_count: nextDone,
              progress_percent: Math.min(100, Math.round((nextDone / total) * 100)),
              completed_dates: nextDates,
            };
          })
        );

        setFeedbackMsg(
          `Mark as Done untuk "${sessionItem.title}" dibatalkan. Jumlah selesai berkurang dan tombol Mark as Done aktif kembali.`
        );
      } else {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionItem.id ? { ...s, status: 'completed', is_done: true } : s
          )
        );

        setParticipants((prev) =>
          prev.map((p) => {
            if (Number(p.course_id) !== Number(sessionItem.course_id)) return p;
            const nextDone = Math.min(
              Number(p.total_classes_count || 1),
              Number(p.done_classes_count || 0) + 1
            );
            const total = Math.max(Number(p.total_classes_count || 1), 1);
            const prevDates = Array.isArray(p.completed_dates) ? p.completed_dates : [];
            const nextDates = prevDates.includes(sessionItem.session_date)
              ? prevDates
              : [...prevDates, sessionItem.session_date];
            return {
              ...p,
              done_classes_count: nextDone,
              progress_percent: Math.min(100, Math.round((nextDone / total) * 100)),
              completed_dates: nextDates,
            };
          })
        );

        setFeedbackMsg(
          `Sesi "${sessionItem.title}" ditandai selesai (Mark as Done). Jumlah selesai bertambah.`
        );
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal memperbarui status Mark as Done.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteCanceledSession = async (sessionItem) => {
    const currentStatus = normalizeSessionStatus(sessionItem);
    if (!sessionItem?.id || busyId || currentStatus !== 'canceled') return;

    const confirmed = window.confirm(
      `Hapus permanen kelas yang dibatalkan "${sessionItem.title}"?`
    );
    if (!confirmed) return;

    setBusyId(sessionItem.id);
    setErrorMsg('');
    setFeedbackMsg('');

    try {
      const res = await fetch(`/api/teacher/schedule?session_id=${sessionItem.id}`, {
        method: 'DELETE',
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Gagal menghapus kelas.');
      }

      setSessions((prev) => prev.filter((s) => s.id !== sessionItem.id));
      setFeedbackMsg(`Kelas "${sessionItem.title}" berhasil dihapus.`);
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal menghapus kelas.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER ATELIER SCHEDULE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="block text-[10px] font-extrabold tracking-[0.2em] uppercase text-[#802924]">
            ATELIER SCHEDULE &amp; APPRENTICES • {teacher?.full_name || 'Ayu'}
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
            Jadwal &amp; Siswa
          </h1>
          <p className="text-xs sm:text-sm text-[#341D17]/75">
            Kelola sesi mentoring langsung, validasi kelas tuntas (Mark as Done), dan pantau progres keaktifan partisipan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreateModal(false)}
          className="self-start sm:self-auto rounded-2xl bg-[#802924] hover:bg-[#661F1B] px-5 py-3 text-xs sm:text-sm font-bold text-[#F9DDBB] shadow-md transition inline-flex items-center gap-2 cursor-pointer"
        >
          <span>+</span>
          <span>Buat</span>
        </button>
      </div>

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

      {/* 3 KARTU RINGKASAN DISESUAIKAN DENGAN TANGGAL AKTIF */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/65">
              {filterByDate ? `TANGGAL ${activeDate}` : 'SEMUA TANGGAL'}
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-[#802924]" />
          </div>
          <p className="font-editorial text-2xl font-bold text-[#341D17]">
            {stats.dateSessionsCount}
          </p>
          <p className="text-xs text-[#341D17]/75">
            {filterByDate
              ? `Total Sesi Terjadwal (${stats.totalAllSessionsCount} Semua Tanggal)`
              : 'Total Sesi Terjadwal di Database'}
          </p>
        </div>

        <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/65">
              PARTISIPAN
            </span>
            <span className="rounded-full bg-[#F9DDBB] px-2.5 py-0.5 text-[10px] font-bold text-[#802924]">
              {stats.activeStudentsCount} Aktif
            </span>
          </div>
          <p className="font-editorial text-2xl font-bold text-[#341D17]">
            {stats.totalParticipants}
          </p>
          <p className="text-xs text-[#341D17]/75">
            {filterByDate
              ? `Siswa Terdaftar • ${stats.completedStudentsOnDateCount} Tuntas di Tanggal Ini`
              : 'Siswa Terdaftar di Kelas'}
          </p>
        </div>

        <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/65">
              MARK AS DONE
            </span>
            <span className="text-xs font-extrabold text-[#802924]">✓</span>
          </div>
          <p className="font-editorial text-2xl font-bold text-[#341D17]">
            {stats.completedCount}
          </p>
          <p className="text-xs text-[#341D17]/75">
            Kursus/Sesi Selesai • {stats.pendingValidationCount} Menunggu Validasi
          </p>
        </div>
      </div>

      {/* KALENDER MINGGUAN & TOMBOL KELAS DADAKAN (+ POP-UP SESI) */}
      <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
              {activeMonthTitle}
            </h2>
            <p className="text-xs text-[#341D17]/70">
              Pilih tanggal untuk mengatur jadwal atau menyaring sesi kelas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterByDate((prev) => !prev)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                filterByDate
                  ? 'bg-[#802924] text-[#F9DDBB]'
                  : 'border border-[#341D17]/20 bg-[#FFFDF9] text-[#341D17] hover:bg-[#F9DDBB]/50'
              }`}
            >
              {filterByDate ? `Tanggal: ${selectedDate}` : 'Semua Tanggal'}
            </button>

            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="h-8 w-8 rounded-xl border border-[#341D17]/20 bg-[#FFFDF9] hover:bg-[#F9DDBB]/50 text-xs font-bold text-[#341D17] cursor-pointer"
              aria-label="Pekan sebelumnya"
            >
              &lt;
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="h-8 w-8 rounded-xl border border-[#341D17]/20 bg-[#FFFDF9] hover:bg-[#F9DDBB]/50 text-xs font-bold text-[#341D17] cursor-pointer"
              aria-label="Pekan berikutnya"
            >
              &gt;
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {weekDays.map((day) => {
            const isSelected = filterByDate && day.key === selectedDate;
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => {
                  setSelectedDate(day.key);
                  setFilterByDate(true);
                }}
                className={`rounded-2xl p-3 text-center transition border cursor-pointer flex flex-col items-center justify-between gap-1 ${
                  isSelected
                    ? 'bg-[#802924] text-[#F9DDBB] border-[#802924] shadow-sm'
                    : 'bg-[#FFFDF9] text-[#341D17] border-[#341D17]/15 hover:bg-[#F9DDBB]/40'
                }`}
              >
                <span
                  className={`text-[10px] font-extrabold tracking-wider ${
                    isSelected ? 'text-[#F9DDBB]/90' : 'text-[#341D17]/60'
                  }`}
                >
                  {day.dayLabel}
                </span>
                <span className="font-editorial text-lg font-bold">{day.dateNum}</span>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-[#F9DDBB]/45 border border-[#341D17]/10 px-4 py-3">
          <p className="text-xs text-[#341D17]/85">
            Butuh membuka sesi mentoring atau kelas dadakan di luar jadwal reguler?
          </p>
          <button
            type="button"
            onClick={() => openCreateModal(true)}
            className="self-start sm:self-auto text-xs font-extrabold text-[#802924] hover:underline cursor-pointer whitespace-nowrap"
          >
            + Pop-up Sesi
          </button>
        </div>
      </div>

      {/* SESI KELAS TERJADWAL & MARK AS DONE */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17]">
              Sesi Kelas Terjadwal
            </h2>
            <p className="text-xs text-[#341D17]/70">
              Tandai kelas yang telah selesai dengan Mark as Done untuk memperbarui progres keaktifan siswa.
            </p>
          </div>
          <span className="rounded-full bg-[#F9DDBB] px-3.5 py-1 text-xs font-extrabold text-[#802924]">
            {visibleSessions.length} Sesi Terdata
          </span>
        </div>

        {visibleSessions.length === 0 ? (
          <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-6 text-center text-xs text-[#341D17]/70">
            Belum ada sesi kelas untuk pilihan tanggal ini. Klik <strong>+ Buat</strong> atau <strong>+ Pop-up Sesi</strong> untuk menambahkan.
          </div>
        ) : (
          <div className="space-y-3.5">
            {visibleSessions.map((item) => {
              const status = normalizeSessionStatus(item);
              const isBusy = busyId === item.id;

              const badgeStyle =
                status === 'canceled'
                  ? 'bg-red-500/15 text-red-800'
                  : status === 'completed'
                  ? 'bg-[#341D17] text-[#F9DDBB]'
                  : 'bg-[#F9DDBB] text-[#802924]';

              const badgeLabel =
                status === 'canceled'
                  ? 'DIBATALKAN'
                  : status === 'completed'
                  ? 'SELESAI (DONE)'
                  : 'TERJADWAL';

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 shadow-2xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${badgeStyle}`}
                      >
                        {badgeLabel}
                      </span>

                      {item.is_popup && (
                        <span className="rounded-full bg-[#802924]/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#802924]">
                          KELAS DADAKAN
                        </span>
                      )}

                      <span className="text-xs font-semibold text-[#341D17]/75">
                        {item.session_date} • {item.session_time || '14:00 WITA'}
                      </span>
                    </div>

                    <span className="rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3 py-1 text-[11px] font-bold text-[#341D17]">
                      {item.location_label || 'Atelier Live'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                      {item.course_title}
                      {item.instructor_name ? ` • CHEF ${String(item.instructor_name).toUpperCase()}` : ''}
                    </p>
                    <h3
                      className={`font-editorial text-lg sm:text-xl font-bold ${
                        status === 'canceled' ? 'text-[#341D17]/55 line-through' : 'text-[#341D17]'
                      }`}
                    >
                      {item.title}
                    </h3>
                    {item.notes && (
                      <p className="text-xs sm:text-sm text-[#341D17]/75">{item.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#341D17]/10 pt-3">
                    <span className="text-xs text-[#341D17]/70">
                      {status === 'canceled'
                        ? 'Kelas berstatus Dibatalkan. Tidak dapat ditandai Mark as Done dan kini dapat dihapus.'
                        : status === 'completed'
                        ? 'Kelas telah divalidasi tuntas. Klik tombol untuk membatalkan Mark as Done dan mengaktifkan kembali.'
                        : 'Kelas sudah selesai dilaksanakan? Validasi agar progres siswa bertambah.'}
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      {status === 'scheduled' && (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleCancelSession(item)}
                            className="rounded-xl border border-[#341D17]/25 bg-[#FFFDF9] hover:bg-[#F9DDBB]/60 px-4 py-2 text-xs font-bold text-[#341D17] transition cursor-pointer disabled:opacity-50"
                          >
                            {isBusy ? 'Memproses...' : 'Batalkan'}
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleToggleMarkAsDone(item)}
                            className="rounded-xl bg-[#802924] hover:bg-[#661F1B] px-4 py-2 text-xs font-bold text-[#F9DDBB] shadow-xs transition cursor-pointer disabled:opacity-50"
                          >
                            {isBusy ? 'Menyimpan...' : 'Mark as Done'}
                          </button>
                        </>
                      )}

                      {status === 'completed' && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleMarkAsDone(item)}
                          className="rounded-xl border border-[#802924] bg-[#F9DDBB] hover:bg-[#802924] hover:text-[#F9DDBB] px-4 py-2 text-xs font-bold text-[#802924] transition cursor-pointer disabled:opacity-50"
                        >
                          {isBusy ? 'Membatalkan...' : '✓ Marked as Done • Batal'}
                        </button>
                      )}

                      {status === 'canceled' && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDeleteCanceledSession(item)}
                          className="rounded-xl bg-[#802924] hover:bg-[#661F1B] px-4 py-2 text-xs font-bold text-[#F9DDBB] shadow-xs transition cursor-pointer disabled:opacity-50"
                        >
                          {isBusy ? 'Menghapus...' : 'Hapus'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DAFTAR PARTISIPAN SISWA & PROGRES KEAKTIFAN */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17]">
              Daftar Partisipan Siswa
            </h2>
            <p className="text-xs text-[#341D17]/70">
              Progres keaktifan dihitung dari jumlah kelas/sesi yang telah di-mark as done.
            </p>
          </div>
          <span className="rounded-full border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-1 text-xs font-bold text-[#341D17]">
            {participants.length} Partisipan
          </span>
        </div>

        {participants.length === 0 ? (
          <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-6 text-center text-xs text-[#341D17]/70">
            Belum ada partisipan siswa yang terdaftar pada kursus Anda.
          </div>
        ) : (
          <div className="space-y-3.5">
            {participants.map((student, index) => {
              const initials = String(student.full_name || 'SW')
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={`${student.student_id}-${student.course_id}-${index}`}
                  className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 shadow-2xs space-y-3.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#802924] text-xs font-extrabold text-[#F9DDBB]">
                        {initials}
                      </span>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-[#341D17]">
                          {student.full_name}
                        </h3>
                        <p className="text-xs text-[#341D17]/65">{student.email}</p>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#802924] mt-0.5">
                          {student.course_title}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`self-start sm:self-auto rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                        student.progress_percent >= 100
                          ? 'bg-[#341D17] text-[#F9DDBB]'
                          : student.done_classes_count > 0
                          ? 'bg-[#F9DDBB] text-[#802924]'
                          : 'bg-[#341D17]/10 text-[#341D17]/70'
                      }`}
                    >
                      {student.progress_percent >= 100
                        ? 'Tuntas 100%'
                        : student.done_classes_count > 0
                        ? 'Aktif Mengikuti'
                        : 'Menunggu Mark as Done'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#341D17]">
                      <span>Keaktifan Kelas (Mark as Done)</span>
                      <span>
                        {student.done_classes_count}/{student.total_classes_count} Kelas ({student.progress_percent}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#341D17]/10">
                      <div
                        style={{ width: `${student.progress_percent}%` }}
                        className="h-full rounded-full bg-[#802924] transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL BUAT SESI / KELAS DADAKAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[#341D17]/20 bg-[#FFFDF9] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#341D17]/10 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#802924]">
                  {formData.is_popup ? 'KELAS DADAKAN / POP-UP' : 'JADWAL BARU'}
                </span>
                <h3 className="font-editorial text-xl font-bold text-[#341D17]">
                  {formData.is_popup ? 'Buat Pop-up Sesi Kelas' : 'Tambah Jadwal Sesi'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full bg-[#802924] text-xs font-bold text-[#F9DDBB] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/75">
                  KURSUS
                </label>
                <select
                  required
                  value={formData.course_id}
                  onChange={(e) => setFormData((p) => ({ ...p, course_id: e.target.value }))}
                  className="w-full rounded-2xl border border-[#341D17]/20 bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#341D17]"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/75">
                  JUDUL SESI / KELAS
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Contoh: Sesi Evaluasi Adonan & Tanya Jawab"
                  className="w-full rounded-2xl border border-[#341D17]/20 bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#341D17]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/75">
                    TANGGAL
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.session_date}
                    onChange={(e) => setFormData((p) => ({ ...p, session_date: e.target.value }))}
                    className="w-full rounded-2xl border border-[#341D17]/20 bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#341D17]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/75">
                    WAKTU
                  </label>
                  <input
                    type="text"
                    value={formData.session_time}
                    onChange={(e) => setFormData((p) => ({ ...p, session_time: e.target.value }))}
                    placeholder="15:00 WITA"
                    className="w-full rounded-2xl border border-[#341D17]/20 bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#341D17]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/75">
                  CATATAN SESI (OPSIONAL)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Ringkasan topik atau keperluan kelas dadakan..."
                  className="w-full rounded-2xl border border-[#341D17]/20 bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#341D17]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#341D17]/20 px-4 py-2.5 text-xs font-bold text-[#341D17] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#802924] hover:bg-[#661F1B] px-5 py-2.5 text-xs font-bold text-[#F9DDBB] cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}