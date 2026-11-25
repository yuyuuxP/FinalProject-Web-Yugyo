'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FaCalendarDays,
  FaChevronLeft,
  FaChevronRight,
  FaExclamation,
  FaXmark,
  FaCheck,
  FaCircleInfo,
  FaClock,
  FaPlay,
  FaWandSparkles,
} from 'react-icons/fa6';
import {
  getActiveStudentIdentity,
  saveActiveStudentId,
} from '@/lib/studentSessionClient';

function ChefHatIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.5 6a4.5 4.5 0 0 0-8.66-1.73A3.5 3.5 0 0 0 4.5 7.5c0 1.48.92 2.75 2.22 3.26L7.5 16.5h9l.78-5.74A3.5 3.5 0 0 0 19.5 7.5 1.5 1.5 0 0 0 17.5 6ZM8 18h8v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2Z" />
    </svg>
  );
}

const DAY_NAMES_ID = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];
const SESSION_XP_REWARD = 25;

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

function formatDateDisplay(isoStr) {
  const clean = String(isoStr || '').slice(0, 10);
  const [y, m, d] = clean.split('-');
  if (!y || !m || !d) return clean;
  return `${d}-${m}-${y}`;
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

function normalizeSessionRow(row, idx = 0) {
  const id = Number(row?.id ?? idx + 1);
  const rawDate = String(row?.session_date ?? row?.sessionDate ?? '').slice(
    0,
    10
  );
  const rawTime = String(
    row?.session_time ?? row?.sessionTime ?? '14:00 WITA'
  ).trim();
  const rawStatus = String(row?.status ?? 'scheduled')
    .trim()
    .toLowerCase();

  const isCompleted = Boolean(row?.is_completed ?? row?.isCompleted);
  const xpEarned = Number(row?.xp_earned ?? row?.xpEarned ?? 0);

  return {
    id,
    courseId: Number(row?.course_id ?? row?.courseId ?? 0),
    courseTitle: String(
      row?.course_title ?? row?.courseTitle ?? 'Kelas Atelier'
    ).trim(),
    sessionNumber: Number(row?.session_number ?? row?.sessionNumber ?? 1),
    title: String(row?.title ?? `Sesi Praktek #${idx + 1}`).trim(),
    notes: String(row?.notes ?? '').trim(),
    sessionDate: rawDate,
    sessionTime: rawTime.toUpperCase().includes('WITA')
      ? rawTime
      : `${rawTime} WITA`,
    locationLabel: String(
      row?.location_label ?? row?.locationLabel ?? 'Atelier Live'
    ).trim(),
    instructorName: String(
      row?.instructor_name ?? row?.instructorName ?? 'Instruktur Atelier'
    ).trim(),
    thumbnailUrl: String(
      row?.thumbnail_url ?? row?.thumbnailUrl ?? ''
    ).trim(),
    categoryName: String(
      row?.category_name ?? row?.categoryName ?? 'Atelier Class'
    ).trim(),
    isTeacherDone: Boolean(
      row?.is_teacher_done ??
        row?.isTeacherDone ??
        row?.is_done ??
        ['done', 'completed', 'selesai'].includes(rawStatus)
    ),
    teacherCompletedAt: String(
      row?.teacher_completed_at ?? row?.teacherCompletedAt ?? ''
    ).trim(),
    isCompleted,
    xpEarned,
    isXpClaimed: Boolean(
      row?.is_xp_claimed ?? row?.isXpClaimed ?? (isCompleted && xpEarned > 0)
    ),
  };
}

export default function StudentScheduleClient({ initialSessions = [] }) {
  const [sessions, setSessions] = useState(() =>
    Array.isArray(initialSessions)
      ? initialSessions.map((r, i) => normalizeSessionRow(r, i))
      : []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [busySessionId, setBusySessionId] = useState(null);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'date'
  const [dismissedNotice, setDismissedNotice] = useState(false);

  const initialAnchorDate = useMemo(() => {
    if (Array.isArray(initialSessions) && initialSessions.length > 0) {
      const firstDate = String(
        initialSessions[0]?.session_date ?? ''
      ).slice(0, 10);
      if (firstDate) return parseIsoDateLocal(firstDate);
    }
    return new Date();
  }, [initialSessions]);

  const [weekStart, setWeekStart] = useState(() =>
    getMondayOfWeek(initialAnchorDate)
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    formatDateIso(initialAnchorDate)
  );

  useEffect(() => {
    let active = true;

    async function loadEnrolledSchedule() {
      try {
        const identity = await getActiveStudentIdentity();
        if (!active) return;

        const params = new URLSearchParams();
        if (identity.studentId) {
          params.set('studentId', String(identity.studentId));
        }
        if (identity.studentName) {
          params.set('studentName', identity.studentName);
        }

        if (!identity.studentId && !identity.studentName) {
          setSessions([]);
          setIsLoading(false);
          return;
        }

        const res = await fetch(`/api/student/schedule?${params.toString()}`, {
          cache: 'no-store',
        });
        if (!active) return;

        const data = res.ok ? await res.json().catch(() => null) : null;
        if (!active) return;

        if (data?.studentId) {
          saveActiveStudentId(data.studentId, identity.studentName || '');
        }

        const list = Array.isArray(data?.sessions)
          ? data.sessions.map((r, i) => normalizeSessionRow(r, i))
          : [];

        setSessions(list);

        if (list.length > 0) {
          const hasCurrentSelected = list.some(
            (s) => s.sessionDate === selectedDate
          );
          if (!hasCurrentSelected && list[0].sessionDate) {
            const firstDt = parseIsoDateLocal(list[0].sessionDate);
            setSelectedDate(list[0].sessionDate);
            setWeekStart(getMondayOfWeek(firstDt));
          }
        }
      } catch {
        if (active) setSessions([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadEnrolledSchedule();
    const timer = setTimeout(loadEnrolledSchedule, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  const datesWithSessionsSet = useMemo(() => {
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
        displayDate: formatDateDisplay(iso),
        hasSession: datesWithSessionsSet.has(iso),
      };
    });
  }, [weekStart, datesWithSessionsSet]);

  const visibleSessions = useMemo(() => {
    if (filterMode === 'date') {
      return sessions.filter((s) => s.sessionDate === selectedDate);
    }
    return sessions;
  }, [sessions, filterMode, selectedDate]);

  const completedCount = useMemo(
    () => sessions.filter((s) => s.isCompleted).length,
    [sessions]
  );

  const missedSessions = useMemo(
    () => sessions.filter((s) => s.isTeacherDone && !s.isCompleted),
    [sessions]
  );

  const handleSelectDay = (isoDate) => {
    setSelectedDate(isoDate);
    setFilterMode('date');
  };

  const handleShiftWeek = (deltaWeeks) => {
    const nextStart = addDays(weekStart, deltaWeeks * 7);
    setWeekStart(nextStart);
    setSelectedDate(formatDateIso(nextStart));
  };

  const handleMarkSessionDone = async (sessionItem) => {
    const sessionId = Number(sessionItem.id);
    if (
      !sessionId ||
      busySessionId === sessionId ||
      sessionItem.isTeacherDone ||
      sessionItem.isCompleted
    ) {
      return;
    }

    setBusySessionId(sessionId);

    setSessions((prev) =>
      prev.map((item) =>
        item.id === sessionId
          ? { ...item, isCompleted: true, xpEarned: 0, isXpClaimed: false }
          : item
      )
    );

    try {
      const identity = await getActiveStudentIdentity();
      const res = await fetch('/api/student/sessions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: identity.studentId,
          studentName: identity.studentName,
          sessionId,
          action: 'complete',
        }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        if (data.studentId) {
          saveActiveStudentId(data.studentId, identity.studentName || '');
        }
        setSessions((prev) =>
          prev.map((item) =>
            item.id === sessionId
              ? {
                  ...item,
                  isCompleted: Boolean(data.isCompleted),
                  xpEarned: Number(data.xpEarned ?? 0),
                  isXpClaimed: Boolean(data.isXpClaimed),
                }
              : item
          )
        );
      } else if (!res.ok) {
        setSessions((prev) =>
          prev.map((item) =>
            item.id === sessionId
              ? { ...item, isCompleted: false, isTeacherDone: true }
              : item
          )
        );
      }
    } catch {
      // Abaikan jika sinkronisasi jaringan gagal
    } finally {
      setBusySessionId(null);
    }
  };

  const handleClaimSessionXp = async (sessionItem) => {
    const sessionId = Number(sessionItem.id);
    if (
      !sessionId ||
      busySessionId === sessionId ||
      !sessionItem.isCompleted ||
      sessionItem.isXpClaimed
    ) {
      return;
    }

    setBusySessionId(sessionId);

    setSessions((prev) =>
      prev.map((item) =>
        item.id === sessionId
          ? {
              ...item,
              xpEarned: SESSION_XP_REWARD,
              isXpClaimed: true,
            }
          : item
      )
    );

    try {
      const identity = await getActiveStudentIdentity();
      const res = await fetch('/api/student/sessions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: identity.studentId,
          studentName: identity.studentName,
          sessionId,
          action: 'claim_xp',
        }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        if (data.studentId) {
          saveActiveStudentId(data.studentId, identity.studentName || '');
        }
        setSessions((prev) =>
          prev.map((item) =>
            item.id === sessionId
              ? {
                  ...item,
                  xpEarned: Number(data.xpEarned ?? SESSION_XP_REWARD),
                  isXpClaimed: Boolean(data.isXpClaimed),
                }
              : item
          )
        );
      }
    } catch {
      // Abaikan jika sinkronisasi jaringan gagal
    } finally {
      setBusySessionId(null);
    }
  };

  return (
    <div className="space-y-6 text-[#341D17] pb-12">
      {/* Agenda Sesi Atelier (Kalender Mingguan) */}
      <section className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FaCalendarDays className="w-4 h-4 text-[#802924] shrink-0" />
            <h1 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
              Agenda Sesi Atelier
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-[#802924] text-[#FFFDF9] border-[#802924]'
                  : 'bg-[#FAF6F0] text-[#341D17]/80 hover:bg-[#F9DDBB]/55 border-[#341D17]/15'
              }`}
            >
              Semua Jadwal ({sessions.length})
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Minggu sebelumnya"
                onClick={() => handleShiftWeek(-1)}
                className="w-8 h-8 rounded-xl border border-[#341D17]/15 bg-[#FAF6F0] hover:bg-[#F9DDBB]/65 text-xs font-bold text-[#341D17] transition cursor-pointer inline-flex items-center justify-center"
              >
                <FaChevronLeft className="w-3 h-3 shrink-0" />
              </button>
              <button
                type="button"
                aria-label="Minggu berikutnya"
                onClick={() => handleShiftWeek(1)}
                className="w-8 h-8 rounded-xl border border-[#341D17]/15 bg-[#FAF6F0] hover:bg-[#F9DDBB]/65 text-xs font-bold text-[#341D17] transition cursor-pointer inline-flex items-center justify-center"
              >
                <FaChevronRight className="w-3 h-3 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5">
          {weekDays.map((day) => {
            const isSelected =
              filterMode === 'date' && selectedDate === day.iso;
            return (
              <button
                key={day.iso}
                type="button"
                onClick={() => handleSelectDay(day.iso)}
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
                  className={`text-[10px] ${
                    isSelected ? 'text-[#FFFDF9]/85' : 'text-[#341D17]/50'
                  }`}
                >
                  {day.displayDate}
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
      </section>

      {/* Banner Pemberitahuan Kelas Selesai / Terlewat */}
      {!isLoading && missedSessions.length > 0 && !dismissedNotice && (
        <section
          role="status"
          className="rounded-2xl bg-[#FFFDF9] border border-[#802924]/30 px-4 py-3.5 sm:px-5 sm:py-4 flex items-start justify-between gap-3 text-[#5B1D19]"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#802924] text-xs font-extrabold text-[#FFFDF9]">
              <FaExclamation className="w-3 h-3" />
            </span>
            <div className="space-y-1 text-xs">
              <p className="font-extrabold text-[13px] text-[#4A1512]">
                Pemberitahuan Kelas Telah Selesai ({missedSessions.length} Sesi
                Terlewat)
              </p>
              <p className="leading-relaxed text-[#5B1D19]/90">
                Kelas{' '}
                <span className="font-bold">
                  {missedSessions.map((s) => s.title).join(', ')}
                </span>{' '}
                telah selesai dilaksanakan oleh instruktur sebelum kamu
                menyelesaikan sesi. Kamu tidak dapat lagi mengikuti kelas
                tersebut dan tidak mendapatkan EXP.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDismissedNotice(true)}
            aria-label="Tutup pemberitahuan"
            className="rounded-lg p-1.5 text-xs font-bold text-[#5B1D19]/70 hover:bg-[#802924]/10 hover:text-[#4A1512] transition cursor-pointer shrink-0"
          >
            <FaXmark className="w-3.5 h-3.5" />
          </button>
        </section>
      )}

      {/* Daftar Kelas & Sesi Praktek */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17]">
              Daftar Kelas &amp; Sesi Praktek
            </h2>
            <p className="text-xs text-[#341D17]/65">
              {filterMode === 'date'
                ? `Menampilkan jadwal sesi pada tanggal ${formatDateDisplay(selectedDate)}`
                : 'Menampilkan seluruh jadwal kelas dari kursus yang kamu ikuti'}
            </p>
          </div>

          <span className="rounded-full bg-[#FFFDF9] border border-[#802924]/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#802924]">
            {completedCount} DARI {sessions.length} TERDAFTAR
          </span>
        </div>

        {isLoading ? (
          <div className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 p-6 text-center text-xs text-[#341D17]/60">
            Memuat jadwal kelas terdaftar...
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 p-6 text-center space-y-3">
            <p className="text-sm font-bold text-[#341D17]">
              Belum ada jadwal kelas untuk kursus yang kamu ikuti
            </p>
            <p className="text-xs text-[#341D17]/65">
              Daftar kursus pada halaman Course Catalog terlebih dahulu agar jadwal sesi dari instruktur muncul di sini.
            </p>
            <div>
              <Link
                href="/dashboard/student/catalog"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#802924] hover:bg-[#661F1B] px-4 py-2 text-xs font-bold text-[#FFFDF9] transition"
              >
                <span>Buka Course Catalog</span>
              </Link>
            </div>
          </div>
        ) : visibleSessions.length === 0 ? (
          <div className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 p-6 text-center space-y-3">
            <p className="text-sm font-bold text-[#341D17]">
              Tidak ada sesi praktek pada tanggal {formatDateDisplay(selectedDate)}
            </p>
            <div>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#802924] hover:bg-[#661F1B] px-4 py-2 text-xs font-bold text-[#FFFDF9] transition cursor-pointer"
              >
                <span>Lihat Semua Jadwal Terdaftar ({sessions.length})</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleSessions.map((item) => {
              const isBusy = busySessionId === item.id;
              const isMissed = item.isTeacherDone && !item.isCompleted;

              return (
                <article
                  key={item.id}
                  className={`rounded-3xl bg-[#FFFDF9] border p-5 sm:p-6 shadow-2xs space-y-4 ${
                    item.isCompleted
                      ? 'border-[#82882B]/40'
                      : isMissed
                        ? 'border-[#802924]/25 opacity-95'
                        : 'border-[#341D17]/12'
                  }`}
                >
                  {/* Header Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    {item.isCompleted ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF5EE] border border-[#82882B]/30 px-3 py-0.5 text-[11px] font-extrabold text-[#2F5D2F]">
                        <FaCheck className="w-2.5 h-2.5 shrink-0" />
                        <span>
                          {item.isTeacherDone
                            ? 'Selesai Tepat Waktu & Terverifikasi Chef'
                            : 'Telah Ditandai Selesai (Tepat Waktu)'}
                        </span>
                      </span>
                    ) : isMissed ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDF2F2] border border-[#802924]/30 px-3 py-0.5 text-[11px] font-extrabold text-[#802924]">
                        <FaXmark className="w-2.5 h-2.5 shrink-0" />
                        <span>Kelas Telah Selesai &bull; Tidak Mengikuti</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F9DDBB]/85 px-2.5 py-0.5 text-[11px] font-bold text-[#802924]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#802924]" />
                        <span>Siap Dimulai</span>
                      </span>
                    )}

                    <span className="text-[11px] font-semibold text-[#341D17]/60">
                      {item.isCompleted
                        ? item.isXpClaimed
                          ? `+${item.xpEarned || SESSION_XP_REWARD} EXP Diklaim`
                          : `Berhak +${SESSION_XP_REWARD} EXP`
                        : isMissed
                          ? '0 EXP (Kelas Sudah Berakhir)'
                          : item.locationLabel}
                    </span>
                  </div>

                  {/* Pemberitahuan Khusus Jika Kelas Sudah Ditutup Guru */}
                  {isMissed && (
                    <div className="rounded-2xl bg-[#FDF2F2] border border-[#802924]/20 px-4 py-2.5 text-xs text-[#5B1D19] flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 flex-wrap">
                        <FaCircleInfo className="w-3.5 h-3.5 text-[#802924] shrink-0" />
                        <span className="font-bold">Pemberitahuan:</span>
                        <span>
                          Kelas telah diselesaikan oleh{' '}
                          <span className="font-bold">
                            Chef {item.instructorName}
                          </span>
                          . Kamu tidak dapat lagi mengikuti kelas ini dan tidak
                          mendapatkan EXP.
                        </span>
                      </span>
                      {item.teacherCompletedAt && (
                        <span className="text-[11px] font-semibold text-[#5B1D19]/75">
                          Selesai: {item.teacherCompletedAt} WITA
                        </span>
                      )}
                    </div>
                  )}

                  {item.isCompleted && item.isTeacherDone && (
                    <div className="rounded-2xl bg-[#EEF5EE]/85 border border-[#82882B]/25 px-4 py-2.5 text-xs text-[#264626] flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 flex-wrap">
                        <FaCircleInfo className="w-3.5 h-3.5 text-[#82882B] shrink-0" />
                        <span className="font-bold">Pemberitahuan:</span>
                        <span>
                          Kelas telah diselesaikan oleh{' '}
                          <span className="font-bold">
                            Chef {item.instructorName}
                          </span>
                          . Kamu menyelesaikan sesi tepat waktu sebelum kelas
                          ditutup.
                        </span>
                      </span>
                      {item.teacherCompletedAt && (
                        <span className="text-[11px] font-semibold text-[#264626]/75">
                          Selesai: {item.teacherCompletedAt} WITA
                        </span>
                      )}
                    </div>
                  )}

                  {/* Informasi Utama Sesi */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-[#F9DDBB] border border-[#341D17]/10 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.courseTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[11px] font-extrabold text-[#802924] text-center px-2">
                          {item.categoryName}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#802924]">
                        {item.courseTitle} &bull; SESI {item.sessionNumber}
                      </p>
                      <h3 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
                        {item.title}
                      </h3>
                      <p className="inline-flex items-center gap-1.5 text-xs text-[#341D17]/65">
                        <ChefHatIcon className="w-3.5 h-3.5 text-[#802924] shrink-0" />
                        <span>Chef {item.instructorName}</span>
                      </p>
                      {item.notes && (
                        <p className="text-xs text-[#341D17]/60 pt-0.5">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#341D17]/65 pt-1 border-t border-[#341D17]/8">
                    <span className="inline-flex items-center gap-1.5">
                      <FaCalendarDays className="w-3 h-3 text-[#802924] shrink-0" />
                      <span>{formatDateDisplay(item.sessionDate)}</span>
                      <span>&bull;</span>
                      <FaClock className="w-3 h-3 text-[#802924] shrink-0" />
                      <span>{item.sessionTime}</span>
                    </span>
                    <span className="font-semibold text-[#341D17]/70">
                      {item.locationLabel}
                    </span>
                  </div>

                  {/* Tombol Aksi Sesuai Kondisi */}
                  {item.isCompleted ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                      <Link
                        href="/dashboard/student/courses"
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#FAF6F0] hover:bg-[#F9DDBB]/65 border border-[#341D17]/15 px-4 py-2.5 text-xs font-bold text-[#341D17] transition"
                      >
                        {item.isTeacherDone && (
                          <FaPlay className="w-3 h-3 text-[#802924] shrink-0" />
                        )}
                        <span>
                          {item.isTeacherDone
                            ? 'Lihat Rekaman Ulang'
                            : 'Masuk Kelas Virtual'}
                        </span>
                      </Link>

                      {/* Tombol EXP muncul karena student menekan selesai sebelum teacher menutup kelas */}
                      {item.isXpClaimed ? (
                        <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#EEF5EE] border border-[#82882B]/35 px-4 py-2.5 text-xs font-extrabold text-[#2F5D2F] shrink-0">
                          <FaCheck className="w-3 h-3 shrink-0" />
                          <span>
                            +{item.xpEarned || SESSION_XP_REWARD} EXP Diklaim
                          </span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleClaimSessionXp(item)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#82882B] hover:bg-[#6D7322] px-4 py-2.5 text-xs font-extrabold text-[#FFFDF9] shadow-xs transition cursor-pointer disabled:opacity-60 shrink-0"
                        >
                          <FaWandSparkles className="w-3 h-3 shrink-0" />
                          <span>
                            {isBusy
                              ? 'Mengklaim EXP...'
                              : `Klaim +${SESSION_XP_REWARD} EXP`}
                          </span>
                        </button>
                      )}
                    </div>
                  ) : isMissed ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                      <button
                        type="button"
                        disabled
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#FAF6F0] border border-[#341D17]/12 px-4 py-2.5 text-xs font-bold text-[#341D17]/45 cursor-not-allowed"
                      >
                        <span>
                          Kelas Telah Selesai &bull; Tidak Dapat Diikuti
                        </span>
                      </button>

                      <span className="inline-flex items-center justify-center rounded-xl bg-[#FDF2F2] border border-[#802924]/20 px-4 py-2.5 text-xs font-bold text-[#802924]/75 shrink-0">
                        0 EXP
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                      <Link
                        href="/dashboard/student/courses"
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#802924] hover:bg-[#661F1B] px-4 py-2.5 text-xs font-bold text-[#FFFDF9] transition"
                      >
                        <span>Masuk Kelas Virtual</span>
                      </Link>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleMarkSessionDone(item)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FFFDF9] hover:bg-[#F9DDBB]/65 border border-[#341D17]/15 px-4 py-2.5 text-xs font-bold text-[#341D17] transition cursor-pointer disabled:opacity-60 shrink-0"
                      >
                        <FaCheck className="w-3 h-3 text-[#82882B] shrink-0" />
                        <span>
                          {isBusy ? 'Menyimpan...' : 'Tandai Selesai'}
                        </span>
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}