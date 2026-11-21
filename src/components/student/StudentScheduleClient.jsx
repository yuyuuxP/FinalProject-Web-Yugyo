'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const DAY_SHORT_LABELS = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
const MAX_CALENDAR_DATE = new Date(2027, 11, 31, 23, 59, 59); // 31 Desember 2027
const MIN_CALENDAR_DATE = new Date(2024, 0, 1);
const DEFAULT_ANCHOR_DATE = new Date(2026, 10, 22); // 22-11-2026 deterministik

const FALLBACK_SESSIONS = [
  {
    id: 'ses-1',
    course_id: null,
    title: 'Croissant Honeycomb Troubleshooting & Live Q&A',
    notes: 'Evaluasi sarang lebah adonan laminasi & diskusi live bersama instruktur',
    session_date: '2026-11-21',
    session_time: 'Hari Ini • 15:00 - 16:30 WITA',
    location_label: 'Lab Live Streaming',
    status: 'live',
    course_title: 'PASTRY CLASS • SESI 1',
    thumbnail_url: '/pictures/courses/french_pastry/croissant.png',
    instructor_name: 'Ayu',
    is_completed: false,
  },
  {
    id: 'ses-2',
    course_id: null,
    title: 'Laminasi Mentega Dingin & Fermentasi Suhu Ruang',
    notes: 'Kontrol suhu adonan & mentega saat lipatan tourage',
    session_date: '2026-11-20',
    session_time: 'Kemarin • 14:00 WITA',
    location_label: 'Terverifikasi Chef',
    status: 'completed',
    course_title: 'VIENNOISERIE MODULE • SESI 2',
    thumbnail_url: '/pictures/courses/french_pastry/Fruits_tartle.png',
    instructor_name: 'Ayu',
    is_completed: true,
  },
  {
    id: 'ses-3',
    course_id: null,
    title: 'Uji Rasa & Evaluasi Tekstur Kulit Brioche Feuilletée',
    notes: 'Penilaian warna karamelisasi dan kerenyahan lapisan luar',
    session_date: '2026-11-22',
    session_time: 'Besok • 10:00 - 11:30 WITA',
    location_label: 'Sensory Workshop',
    status: 'upcoming',
    course_title: 'SENSORY EVALUATION • SESI 3',
    thumbnail_url: '/pictures/courses/french_pastry/croissant.png',
    instructor_name: 'Atelier',
    is_completed: false,
  },
];

function startOfWeekMonday(dateObj) {
  const d = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function toIsoDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDayMonthYear(dateObj) {
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function StudentScheduleClient({ sessions = [] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const sessionList = useMemo(
    () =>
      Array.isArray(sessions) && sessions.length > 0
        ? sessions
        : FALLBACK_SESSIONS,
    [sessions]
  );

  const [weekStart, setWeekStart] = useState(() =>
    startOfWeekMonday(DEFAULT_ANCHOR_DATE)
  );
  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    toIsoDateKey(DEFAULT_ANCHOR_DATE)
  );
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [completedIds, setCompletedIds] = useState(() =>
    sessionList.filter((s) => Boolean(s.is_completed)).map((s) => String(s.id))
  );
  const [markingId, setMarkingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const displayedSessions = useMemo(() => {
    if (showAllSessions) return sessionList;
    return sessionList.slice(0, 4);
  }, [sessionList, showAllSessions]);

  const sessionDateSet = useMemo(() => {
    const set = new Set();
    for (const ses of sessionList) {
      if (!ses?.session_date) continue;
      const d = new Date(ses.session_date);
      if (!Number.isNaN(d.getTime())) {
        set.add(toIsoDateKey(d));
      }
    }
    return set;
  }, [sessionList]);

  const weekDays = useMemo(() => {
    const list = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(
        weekStart.getFullYear(),
        weekStart.getMonth(),
        weekStart.getDate() + i
      );
      if (d > MAX_CALENDAR_DATE) break;
      const isoKey = toIsoDateKey(d);
      list.push({
        isoKey,
        formattedDate: formatDayMonthYear(d),
        label: DAY_SHORT_LABELS[d.getDay()],
        dayNum: String(d.getDate()).padStart(2, '0'),
        hasDot: sessionDateSet.has(isoKey),
      });
    }
    return list;
  }, [weekStart, sessionDateSet]);

  const canGoPrevWeek = useMemo(() => {
    const prev = new Date(
      weekStart.getFullYear(),
      weekStart.getMonth(),
      weekStart.getDate() - 7
    );
    return prev >= MIN_CALENDAR_DATE;
  }, [weekStart]);

  const canGoNextWeek = useMemo(() => {
    const next = new Date(
      weekStart.getFullYear(),
      weekStart.getMonth(),
      weekStart.getDate() + 7
    );
    return next <= MAX_CALENDAR_DATE;
  }, [weekStart]);

  const handlePrevWeek = () => {
    if (!canGoPrevWeek) return;
    setWeekStart(
      (prev) =>
        new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7)
    );
  };

  const handleNextWeek = () => {
    if (!canGoNextWeek) return;
    setWeekStart(
      (prev) =>
        new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7)
    );
  };

  const totalSlots = Math.max(sessionList.length, 18);
  const completedCount = completedIds.length;
  const pendingCount = Math.max(0, sessionList.length - completedCount);
  const activityIndex = Math.min(
    100,
    Math.max(
      55,
      Math.round((completedCount / Math.max(sessionList.length, 1)) * 100) || 78
    )
  );
  const weeklyHours = Math.max(3, Number((completedCount * 1.5).toFixed(1)));

  const handleMarkDone = async (session) => {
    const idStr = String(session.id);
    if (completedIds.includes(idStr) || markingId === idStr) return;

    setMarkingId(idStr);
    setCompletedIds((prev) => [...prev, idStr]);
    setStatusMessage(
      `Sesi "${session.title}" ditandai selesai (+10 Poin Keaktifan).`
    );

    try {
      if (Number.isInteger(Number(session.id))) {
        await fetch('/api/student/sessions/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: Number(session.id) }),
        });
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (err) {
      console.warn('Mark session done sync warning:', err?.message);
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div suppressHydrationWarning className="space-y-5">
      {/* BADGE SEMESTER & JUDUL HALAMAN */}
      <section className="space-y-1">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#802924]/25 bg-[#F9DDBB]/55 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
          <span>&bull; SEMESTER AKTIF • YUGYO ATELIER</span>
        </span>

        <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
          Jadwal &amp; Keaktifan Kelas
        </h1>

        <p className="text-xs sm:text-sm text-[#341D17]/75">
          Pantau jadwal sesi bimbingan, tandai materi yang telah dipelajari, dan amati progres keaktifan belajar kamu.
        </p>
      </section>

      {/* METRIK PEMBELAJARAN RINGKAS */}
      <section className="rounded-2xl border border-[#341D17]/12 bg-[#FFFDF9] p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="block text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#341D17]/55">
              METRIK PEMBELAJARAN
            </span>
            <h2 className="font-editorial text-base sm:text-lg font-bold text-[#341D17] leading-tight">
              Indeks Keaktifan Belajar
            </h2>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="font-editorial text-xl sm:text-2xl font-bold text-[#802924] leading-none">
                {activityIndex}%
              </span>
              <span className="rounded-full bg-[#ECFDF3] px-2 py-0.5 text-[9px] font-extrabold text-[#027A48]">
                Sangat Aktif
              </span>
            </div>
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#802924] bg-[#FAF6F0] text-xs font-extrabold text-[#802924]">
            🔥
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[#341D17]/70">
            <span>
              <strong className="text-[#341D17]">{completedCount}</strong> dari{' '}
              {totalSlots} Sesi &amp; Kelas
            </span>
            <span>Terselesaikan</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#F9DDBB] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#802924] transition-all"
              style={{ width: `${activityIndex}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-[#341D17]/10 bg-[#FAF6F0]/70 px-2.5 py-2 text-center space-y-0.5">
            <p className="font-editorial text-sm sm:text-base font-bold text-[#341D17] leading-tight">
              {pendingCount} Sesi
            </p>
            <p className="text-[10px] text-[#341D17]/60">Menanti</p>
          </div>

          <div className="rounded-xl border border-[#341D17]/10 bg-[#FAF6F0]/70 px-2.5 py-2 text-center space-y-0.5">
            <p className="font-editorial text-sm sm:text-base font-bold text-[#341D17] leading-tight">
              {completedCount} Sesi
            </p>
            <p className="text-[10px] text-[#341D17]/60">Selesai</p>
          </div>

          <div className="rounded-xl border border-[#341D17]/10 bg-[#FAF6F0]/70 px-2.5 py-2 text-center space-y-0.5">
            <p className="font-editorial text-sm sm:text-base font-bold text-[#341D17] leading-tight">
              {weeklyHours} Jam
            </p>
            <p className="text-[10px] text-[#341D17]/60">Pekan Ini</p>
          </div>
        </div>
      </section>

      {/* STRIP KALENDER FORMAT TGL-BULAN-TAHUN HINGGA DESEMBER 2027 */}
      <section className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <h2 className="font-bold text-[#341D17] inline-flex items-center gap-2">
            <span>📅</span>
            <span>Agenda Sesi Atelier</span>
          </h2>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={!canGoPrevWeek}
              onClick={handlePrevWeek}
              aria-label="Pekan sebelumnya"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#FAF6F0] text-xs font-bold text-[#341D17] transition cursor-pointer disabled:opacity-40"
            >
              &lsaquo;
            </button>
            <button
              type="button"
              disabled={!canGoNextWeek}
              onClick={handleNextWeek}
              aria-label="Pekan berikutnya"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#FAF6F0] text-xs font-bold text-[#341D17] transition cursor-pointer disabled:opacity-40"
            >
              &rsaquo;
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const active = selectedDateKey === day.isoKey;
            return (
              <button
                key={day.isoKey}
                type="button"
                onClick={() => setSelectedDateKey(day.isoKey)}
                className={`rounded-2xl border p-2.5 text-center transition cursor-pointer flex flex-col items-center gap-0.5 ${
                  active
                    ? 'border-[#802924] bg-[#802924] text-[#FFFDF9] shadow-2xs'
                    : 'border-[#341D17]/12 bg-[#FFFDF9] text-[#341D17] hover:bg-[#FAF6F0]'
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase ${
                    active ? 'text-[#F9DDBB]' : 'text-[#341D17]/55'
                  }`}
                >
                  {day.label}
                </span>
                <span className="font-editorial text-base font-bold leading-tight">
                  {day.dayNum}
                </span>
                <span
                  className={`text-[9px] font-semibold ${
                    active ? 'text-[#F9DDBB]/90' : 'text-[#341D17]/55'
                  }`}
                >
                  {day.formattedDate}
                </span>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    day.hasDot
                      ? active
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

      {statusMessage && (
        <div className="rounded-2xl border border-[#341D17]/15 bg-[#F9DDBB]/55 px-4 py-2.5 text-xs font-bold text-[#341D17]">
          {statusMessage}
        </div>
      )}

      {/* DAFTAR KELAS & SESI PRAKTEK (MAKSIMAL 4 AWAL + TOMBOL TAMPILKAN SEMUA KELAS) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
            Daftar Kelas &amp; Sesi Praktek
          </h2>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/55">
            {displayedSessions.length} DARI {sessionList.length} TERDAFTAR
          </span>
        </div>

        <div className="space-y-4">
          {displayedSessions.map((ses, idx) => {
            const idStr = String(ses.id);
            const isDone = completedIds.includes(idStr);
            const isUpcoming =
              !isDone && idx === displayedSessions.length - 1 && displayedSessions.length > 2;

            return (
              <div
                key={idStr}
                className="rounded-3xl border border-[#341D17]/12 bg-[#FFFDF9] p-4 sm:p-5 shadow-2xs space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  {isDone ? (
                    <span className="rounded-full bg-[#ECFDF3] px-3 py-1 text-[10px] font-extrabold text-[#027A48]">
                      ✓ Telah Ditandai Selesai (Marked as Done ✓)
                    </span>
                  ) : isUpcoming ? (
                    <span className="rounded-full bg-[#FAF6F0] border border-[#341D17]/12 px-3 py-1 text-[10px] font-extrabold text-[#341D17]/75">
                      &bull; Mendatang
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#F9DDBB]/75 px-3 py-1 text-[10px] font-extrabold text-[#802924]">
                      &bull; Siap Dimulai
                    </span>
                  )}

                  <span className="text-[11px] font-semibold text-[#341D17]/65">
                    {isDone
                      ? '+10 Poin Keaktifan'
                      : ses.location_label || 'Lab Live Streaming'}
                  </span>
                </div>

                <div className="flex items-start gap-3.5">
                  <img
                    src={
                      ses.thumbnail_url ||
                      '/pictures/courses/french_pastry/croissant.png'
                    }
                    alt={ses.title}
                    className="h-14 w-16 shrink-0 rounded-xl object-cover border border-[#341D17]/10 bg-[#FAF6F0]"
                  />

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                      {ses.course_title || 'ATELIER SESSION'} &bull; SESI {idx + 1}
                    </span>
                    <h3 className="font-editorial text-base sm:text-lg font-bold text-[#341D17]">
                      {ses.title}
                    </h3>
                    <p className="text-xs text-[#341D17]/70">
                      &#128104;&#8205;&#127859; Chef {ses.instructor_name}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#FAF6F0] px-3.5 py-2 text-xs text-[#341D17]/75">
                  <span>
                    &#128336;{' '}
                    {ses.session_time || 'Jadwal Sesi Praktik Atelier'}
                  </span>
                  {isDone && (
                    <span className="text-[11px] font-semibold text-[#341D17]/60">
                      Terverifikasi Chef
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-0.5">
                  {isDone ? (
                    <>
                      <Link
                        href="/dashboard/student/courses"
                        className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-[#341D17]/12 bg-[#FAF6F0] hover:bg-[#F9DDBB]/45 py-2.5 px-4 text-xs sm:text-sm font-bold text-[#341D17] transition"
                      >
                        <span>&#9654;</span>
                        <span>Lihat Rekaman Ulang</span>
                      </Link>
                      <Link
                        href="/dashboard/student/reviews"
                        className="flex items-center justify-center gap-2 rounded-2xl border border-[#341D17]/12 bg-[#FFFDF9] hover:bg-[#FAF6F0] py-2.5 px-4 text-xs sm:text-sm font-bold text-[#341D17] transition"
                      >
                        <span>&#9733;</span>
                        <span>Beri Ulasan</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setStatusMessage(
                            isUpcoming
                              ? `Pengingat jadwal "${ses.title}" aktif untuk tanggal ${selectedDateKey}.`
                              : `Ruang kelas virtual untuk "${ses.title}" siap diakses.`
                          )
                        }
                        className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-2.5 px-4 text-xs sm:text-sm font-bold transition cursor-pointer ${
                          isUpcoming
                            ? 'border border-[#341D17]/12 bg-[#FAF6F0] hover:bg-[#F9DDBB]/45 text-[#341D17]'
                            : 'bg-[#802924] hover:bg-[#661F1B] text-[#FFFDF9]'
                        }`}
                      >
                        <span>{isUpcoming ? '🔔' : '🎥'}</span>
                        <span>
                          {isUpcoming
                            ? 'Pasang Pengingat Kalender'
                            : 'Masuk Kelas Virtual'}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={markingId === idStr}
                        onClick={() => handleMarkDone(ses)}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#FAF6F0] py-2.5 px-4 text-xs sm:text-sm font-bold text-[#341D17] transition cursor-pointer disabled:opacity-60"
                      >
                        <span>&#10003;</span>
                        <span>Tandai Selesai</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {sessionList.length > 4 && (
          <div className="pt-1 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAllSessions((prev) => !prev)}
              className="rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#F9DDBB]/45 px-5 py-2.5 text-xs font-bold text-[#802924] shadow-2xs transition cursor-pointer"
            >
              {showAllSessions
                ? 'Tampilkan 4 Kelas'
                : `Tampilkan Semua Kelas (${sessionList.length})`}
            </button>
          </div>
        )}
      </section>

      {/* BANNER APRESIASI & STANDAR SERTIFIKASI */}
      <section className="rounded-3xl border border-[#F3D2B3] bg-[#F9DDBB]/45 p-4 sm:p-5 shadow-2xs flex items-start gap-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F9DDBB] text-base text-[#802924]">
          🏅
        </span>
        <div className="space-y-0.5 text-xs">
          <h3 className="font-bold text-[#341D17]">
            Apresiasi &amp; Standar Sertifikasi Atelier
          </h3>
          <p className="text-[#341D17]/75 leading-relaxed">
            Tombol <strong className="font-bold text-[#341D17]">Tandai Selesai</strong>{' '}
            menambah poin keaktifan kamu dan membuka akses sertifikat kelulusan
            100% dari tim instruktur Yugyo Atelier.
          </p>
        </div>
      </section>
    </div>
  );
}