'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const WEEK_DAYS = [
  { key: 'SEN', label: 'SEN', dayNum: '21' },
  { key: 'SEL', label: 'SEL', dayNum: '22' },
  { key: 'RAB', label: 'RAB', dayNum: '23', hasDot: true },
  { key: 'KAM', label: 'KAM', dayNum: '24' },
  { key: 'JUM', label: 'JUM', dayNum: '25' },
  { key: 'SAB', label: 'SAB', dayNum: '26' },
];

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

export default function StudentScheduleClient({ sessions = [] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const sessionList = useMemo(
    () => (Array.isArray(sessions) && sessions.length > 0 ? sessions : FALLBACK_SESSIONS),
    [sessions]
  );

  const [selectedDayKey, setSelectedDayKey] = useState('RAB');
  const [completedIds, setCompletedIds] = useState(() =>
    sessionList.filter((s) => Boolean(s.is_completed)).map((s) => String(s.id))
  );
  const [markingId, setMarkingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const totalSlots = Math.max(sessionList.length, 18);
  const completedCount = completedIds.length;
  const pendingCount = Math.max(0, sessionList.length - completedCount);
  const activityIndex = Math.min(
    100,
    Math.max(55, Math.round((completedCount / Math.max(sessionList.length, 1)) * 100) || 78)
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
    <div className="space-y-6">
      {/* BADGE SEMESTER & JUDUL HALAMAN */}
      <section className="space-y-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#802924]/25 bg-[#F9DDBB]/55 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
          <span>&bull; SEMESTER AKTIF • YUGYO ATELIER</span>
        </span>

        <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
          Jadwal &amp; Keaktifan Kelas
        </h1>

        <p className="text-xs sm:text-sm text-[#341D17]/75">
          Pantau jadwal sesi bimbingan, tandai materi yang telah dipelajari, dan amati progres keaktifan belajar kamu.
        </p>
      </section>

      {/* METRIK PEMBELAJARAN */}
      <section className="rounded-3xl border border-[#341D17]/12 bg-[#FFFDF9] p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="block text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#341D17]/55">
              METRIK PEMBELAJARAN
            </span>
            <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
              Indeks Keaktifan Belajar
            </h2>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#802924]">
                {activityIndex}%
              </span>
              <span className="rounded-full bg-[#ECFDF3] px-2.5 py-0.5 text-[10px] font-extrabold text-[#027A48]">
                Sangat Aktif
              </span>
            </div>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-[#802924] bg-[#FAF6F0] text-sm font-extrabold text-[#802924]">
            🔥
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#341D17]/70">
            <span>
              <strong className="text-[#341D17]">{completedCount}</strong> dari{' '}
              {totalSlots} Sesi &amp; Kelas
            </span>
            <span>Terselesaikan</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#F9DDBB] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#802924] transition-all"
              style={{ width: `${activityIndex}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="rounded-2xl border border-[#341D17]/10 bg-[#FAF6F0]/70 p-3.5 text-center space-y-1">
            <span className="text-sm text-[#802924]">📋</span>
            <p className="font-editorial text-base sm:text-lg font-bold text-[#341D17]">
              {pendingCount} Sesi
            </p>
            <p className="text-[11px] text-[#341D17]/60">Menanti</p>
          </div>

          <div className="rounded-2xl border border-[#341D17]/10 bg-[#FAF6F0]/70 p-3.5 text-center space-y-1">
            <span className="text-sm text-[#027A48]">☑</span>
            <p className="font-editorial text-base sm:text-lg font-bold text-[#341D17]">
              {completedCount} Sesi
            </p>
            <p className="text-[11px] text-[#341D17]/60">Selesai</p>
          </div>

          <div className="rounded-2xl border border-[#341D17]/10 bg-[#FAF6F0]/70 p-3.5 text-center space-y-1">
            <span className="text-sm text-[#802924]">⏳</span>
            <p className="font-editorial text-base sm:text-lg font-bold text-[#341D17]">
              {weeklyHours} Jam
            </p>
            <p className="text-[11px] text-[#341D17]/60">Pekan Ini</p>
          </div>
        </div>
      </section>

      {/* STRIP KALENDER MINGGUAN */}
      <section className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <h2 className="font-bold text-[#341D17] inline-flex items-center gap-2">
            <span>📅</span>
            <span>Agenda Sesi Atelier</span>
          </h2>
          <span className="text-[11px] text-[#341D17]/60">Pekan Aktif</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {WEEK_DAYS.map((day) => {
            const active = selectedDayKey === day.key;
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => setSelectedDayKey(day.key)}
                className={`rounded-2xl border p-3 text-center transition cursor-pointer flex flex-col items-center gap-1 ${
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

      {/* DAFTAR KELAS & SESI PRAKTEK */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
            Daftar Kelas &amp; Sesi Praktek
          </h2>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/55">
            {sessionList.length} TERDAFTAR
          </span>
        </div>

        <div className="space-y-4">
          {sessionList.map((ses, idx) => {
            const idStr = String(ses.id);
            const isDone = completedIds.includes(idStr);
            const isUpcoming = !isDone && idx === sessionList.length - 1 && sessionList.length > 2;

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
                              ? `Pengingat jadwal "${ses.title}" aktif untuk hari ${selectedDayKey}.`
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