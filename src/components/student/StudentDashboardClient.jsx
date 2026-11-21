'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function formatDayBadge(dateVal) {
  if (!dateVal) return { label: 'HARI INI', day: '15' };
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return { label: 'SESI', day: '15' };
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  return {
    label: isToday
      ? 'HARI INI'
      : d.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase(),
    day: String(d.getDate()).padStart(2, '0'),
  };
}

export default function StudentDashboardClient({
  student,
  stats,
  enrollments = [],
  sessions = [],
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [completedSessionIds, setCompletedSessionIds] = useState(() =>
    sessions.filter((s) => Boolean(s.is_completed)).map((s) => Number(s.id))
  );
  const [markingId, setMarkingId] = useState(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  const featuredCourse = enrollments[0] || null;
  const otherCourses = useMemo(
    () => (enrollments.length > 1 ? enrollments.slice(1) : enrollments),
    [enrollments]
  );
  const upcomingSession = sessions[0] || null;

  const xpPercent = Math.min(
    100,
    Math.max(
      8,
      Math.round(
        ((stats?.xpCurrent ?? 1450) / (stats?.xpTarget ?? 2000)) * 100
      )
    )
  );

  const completedCount = useMemo(() => {
    if (sessions.length === 0) return stats?.completedSessions ?? 14;
    return sessions.filter(
      (s) =>
        Boolean(s.is_completed) || completedSessionIds.includes(Number(s.id))
    ).length;
  }, [sessions, completedSessionIds, stats]);

  const handleMarkSessionDone = async (sessionId) => {
    if (!sessionId || markingId) return;
    setMarkingId(sessionId);

    setCompletedSessionIds((prev) =>
      prev.includes(Number(sessionId)) ? prev : [...prev, Number(sessionId)]
    );

    try {
      await fetch('/api/student/sessions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.warn('Session completion sync warning:', err?.message);
    } finally {
      setMarkingId(null);
    }
  };

  const badgeInfo = formatDayBadge(upcomingSession?.session_date);
  const isUpcomingDone = upcomingSession
    ? Boolean(upcomingSession.is_completed) ||
      completedSessionIds.includes(Number(upcomingSession.id))
    : false;

  return (
    <div className="space-y-5">
      {/* HEADER & XP LEVEL BAR */}
      <section className="space-y-3.5">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#802924]/25 bg-[#F9DDBB]/55 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
            <span>🏅 APPRENTICE BAKER • VERIFIED STUDENT</span>
          </span>

          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17] flex items-center gap-2">
            <span>Halo, {student?.full_name || 'Siswa Atelier'}!</span>
            <span aria-hidden="true">👩‍🍳</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#341D17]/75">
            Lanjutkan kreasi aroma butter dan laminasi adonan hari ini. Dapur siap menyambut sentuhan tanganmu.
          </p>
        </div>

        <div className="rounded-2xl border border-[#341D17]/12 bg-[#FAF6F0] px-4 py-3.5 shadow-2xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-[#341D17]">
              <span>🥐</span>
              <span>Level 2: Artisan Viennoiserie</span>
            </div>
            <span className="font-extrabold text-[#802924]">
              {(stats?.xpCurrent ?? 1450).toLocaleString('id-ID')} /{' '}
              {(stats?.xpTarget ?? 2000).toLocaleString('id-ID')} XP
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-[#F9DDBB] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#802924] transition-all"
              style={{ width: `${xpPercent}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#341D17]/65">
            <span>Level 1: Pâte Sablée (Lulus)</span>
            <Link
              href="/dashboard/student/courses"
              className="font-bold text-[#802924] hover:underline"
            >
              Tingkat Master: Sourdough Pastry &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* GRID 4 KARTU METRIK KECIL & RINGKAS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-[#341D17]/12 bg-[#FFFDF9] p-3.5 shadow-2xs flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F9DDBB]/70 text-xs text-[#802924]">
              ☕
            </span>
            <span className="rounded-full bg-[#F9DDBB]/70 px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#802924]">
              AKTIF
            </span>
          </div>
          <div>
            <p className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17] leading-tight">
              {stats?.activeCourses ?? 0}
            </p>
            <p className="text-[11px] text-[#341D17]/70 mt-0.5 truncate">
              Kursus Berjalan
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#341D17]/12 bg-[#FFFDF9] p-3.5 shadow-2xs flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ECFDF3] text-xs text-[#027A48]">
              ✓
            </span>
            <span className="text-[10px] font-bold text-[#027A48]">
              {stats?.indexPercent ?? 78}% Indeks
            </span>
          </div>
          <div>
            <p className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17] leading-tight">
              {completedCount}{' '}
              <span className="text-xs font-normal text-[#341D17]/60">
                / {stats?.totalSessions ?? 18} Sesi
              </span>
            </p>
            <p className="text-[11px] text-[#341D17]/70 mt-0.5 truncate">
              Mark as Done
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#341D17]/12 bg-[#FFFDF9] p-3.5 shadow-2xs flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FAF6F0] border border-[#341D17]/10 text-xs text-[#341D17]">
              ⏱
            </span>
            <span className="text-[10px] font-bold text-[#802924]">
              +1.2 Jam
            </span>
          </div>
          <div>
            <p className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17] leading-tight">
              {stats?.focusHours ?? 3.5}{' '}
              <span className="text-xs font-normal text-[#341D17]/60">Jam</span>
            </p>
            <p className="text-[11px] text-[#341D17]/70 mt-0.5 truncate">
              Fokus Pekan Ini
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#F3D2B3] bg-[#F9DDBB]/55 p-3.5 shadow-2xs flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#802924] text-xs text-[#FFFDF9]">
              🏅
            </span>
            <span className="rounded-full bg-[#FFFDF9] px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#341D17]">
              SIAP
            </span>
          </div>
          <div>
            <p className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17] leading-tight">
              {stats?.readyCertificates ?? 1}
            </p>
            <p className="text-[11px] text-[#341D17]/80 mt-0.5 truncate">
              Unduh Sertifikat &darr;
            </p>
          </div>
        </div>
      </section>

      {/* LANJUTKAN PEMBELAJARAN */}
      {featuredCourse && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17] inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#802924]" />
              <span>Lanjutkan Pembelajaran</span>
            </h2>
            <Link
              href="/dashboard/student/courses"
              className="text-xs font-bold text-[#802924] hover:underline"
            >
              Lihat Silabus
            </Link>
          </div>

          <div className="rounded-3xl border border-[#341D17]/12 bg-[#FFFDF9] p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-[#341D17]/10 bg-[#FAF6F0]">
              <img
                src={
                  featuredCourse.thumbnail_url ||
                  '/pictures/courses/french_pastry/croissant.png'
                }
                alt={featuredCourse.title}
                className="h-52 sm:h-64 w-full object-cover"
              />
              <div className="absolute left-3 top-3 flex items-center gap-2">
                <span className="rounded-full bg-[#341D17]/85 px-3 py-1 text-[10px] font-bold text-[#FFFDF9]">
                  Modul Utama #04
                </span>
                <span className="rounded-full bg-[#F9DDBB] px-3 py-1 text-[10px] font-extrabold text-[#802924]">
                  &#9654; Video HD
                </span>
              </div>
              <span className="absolute bottom-3 right-3 rounded-lg bg-[#341D17]/85 px-2.5 py-1 text-[10px] font-bold text-[#FFFDF9]">
                Menit 14:22 / 28:50
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#802924]">
                &#128104;&#8205;&#127859; Chef {featuredCourse.instructor_name}{' '}
                &bull; {featuredCourse.instructor_specialty}
              </p>
              <h3 className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17]">
                {featuredCourse.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#341D17]/75">
                Fokus Materi:{' '}
                <strong className="font-semibold text-[#341D17]">
                  {featuredCourse.description ||
                    'Teknik Lipatan Single Turn & Double Turn (Tourage)'}
                </strong>
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#341D17]">Kemajuan Modul</span>
                <span className="text-[#802924]">
                  {featuredCourse.progress_percentage ?? 75}% Selesai
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#F9DDBB] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#802924]"
                  style={{
                    width: `${featuredCourse.progress_percentage ?? 75}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#341D17]/60">
                <span>&#128336; Terakhir dibuka 2 jam lalu</span>
                <span>Tersisa 14 Menit</span>
              </div>
            </div>

            <Link
              href={`/dashboard/student/courses/${featuredCourse.course_id}`}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#802924] hover:bg-[#661F1B] py-3 px-5 text-xs sm:text-sm font-bold text-[#FFFDF9] transition"
            >
              <span>Lanjutkan Belajar Sekarang</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </section>
      )}

      {/* JADWAL KELAS TERDEKAT */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17] inline-flex items-center gap-2">
            <span>&#128197;</span>
            <span>Jadwal Kelas Terdekat</span>
          </h2>
          <Link
            href="/dashboard/student/schedule"
            className="text-xs font-bold text-[#802924] hover:underline"
          >
            Kalender Penuh
          </Link>
        </div>

        {upcomingSession ? (
          <div className="rounded-3xl border border-[#341D17]/12 bg-[#FFFDF9] p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#802924] text-[#FFFDF9]">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#F9DDBB]">
                  {badgeInfo.label}
                </span>
                <span className="font-editorial text-lg font-bold leading-tight">
                  {badgeInfo.day}
                </span>
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-full bg-[#F9DDBB]/75 px-2.5 py-0.5 font-bold text-[#802924]">
                    {upcomingSession.location_label || 'Live Atelier'}
                  </span>
                  <span className="text-[#341D17]/65">
                    {upcomingSession.session_time || '15:00 - 16:30 WITA'}
                  </span>
                </div>

                <h3 className="font-editorial text-base sm:text-lg font-bold text-[#341D17]">
                  {upcomingSession.title}
                </h3>

                <p className="text-xs text-[#341D17]/70 truncate">
                  Bersama Chef {upcomingSession.instructor_name} &bull;{' '}
                  {upcomingSession.course_title}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <Link
                href="/dashboard/student/schedule"
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#802924] hover:bg-[#661F1B] py-2.5 px-4 text-xs sm:text-sm font-bold text-[#FFFDF9] transition"
              >
                <span>&#127909;</span>
                <span>Masuk Kelas Virtual</span>
              </Link>

              <button
                type="button"
                disabled={isUpcomingDone || markingId === upcomingSession.id}
                onClick={() => handleMarkSessionDone(upcomingSession.id)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-[#341D17]/15 bg-[#FAF6F0] hover:bg-[#F9DDBB]/50 py-2.5 px-4 text-xs sm:text-sm font-bold text-[#341D17] transition cursor-pointer disabled:opacity-60"
              >
                <span>&#10003;</span>
                <span>{isUpcomingDone ? 'Selesai' : 'Tandai Selesai'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-[#341D17]/12 bg-[#FFFDF9] p-5 text-xs text-[#341D17]/70">
            Belum ada jadwal kelas terdekat.
          </div>
        )}
      </section>

      {/* CATATAN ATELIER HARI INI */}
      <section className="rounded-3xl border border-[#F3D2B3] bg-[#FAF6F0] p-5 sm:p-6 shadow-2xs space-y-4">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
          <span>&#128205; CATATAN ATELIER HARI INI</span>
        </span>

        <div className="space-y-1.5">
          <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
            Tips Fermentasi Dingin (Cold Retardation)
          </h2>
          <p className="text-xs sm:text-sm text-[#341D17]/80 leading-relaxed">
            &ldquo;Pertahankan suhu chiller tepat di kisaran{' '}
            <strong className="text-[#802924]">4&deg;C</strong> agar aktivitas ragi
            beristirahat stabil, memberi ruang optimal bagi asam laktat membentuk aroma
            mentega khas Parisian Croissant.&rdquo;
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#802924] text-xs font-extrabold text-[#FFFDF9]">
              YA
            </span>
            <div>
              <p className="text-xs font-bold text-[#341D17]">
                Chef {featuredCourse?.instructor_name || 'Ayu'}
              </p>
              <p className="text-[11px] text-[#341D17]/65">
                {featuredCourse?.instructor_specialty || 'Head of Viennoiserie'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowFormulaModal((prev) => !prev)}
            className="rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#F9DDBB]/50 px-3.5 py-2 text-xs font-bold text-[#341D17] transition cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>&#128196;</span>
            <span>Lembar Formula</span>
          </button>
        </div>

        {showFormulaModal && (
          <div className="rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] p-4 text-xs text-[#341D17]/85 space-y-1">
            <p className="font-bold text-[#802924]">
              Acuan Suhu &amp; Fermentasi Atelier
            </p>
            <p>
              Suhu mentega laminasi 14–16&deg;C, suhu adonan 10–12&deg;C, dan cold
              retardation di chiller 4&deg;C selama 8–12 jam sebelum dipanggang.
            </p>
          </div>
        )}
      </section>

      {/* MATERI BERLANGSUNG LAINNYA */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
            Materi Berlangsung Lainnya
          </h2>
          <Link
            href="/dashboard/student/courses"
            className="text-xs font-bold text-[#802924] hover:underline"
          >
            Katalog Lengkap
          </Link>
        </div>

        <div className="space-y-3">
          {otherCourses.map((course) => {
            const pct = Math.min(
              100,
              Math.max(10, Number(course.progress_percentage || 40))
            );
            return (
              <Link
                key={course.course_id}
                href={`/dashboard/student/courses/${course.course_id}`}
                className="block rounded-3xl border border-[#341D17]/12 bg-[#FFFDF9] hover:bg-[#FAF6F0] p-4 sm:p-5 shadow-2xs transition space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl border border-[#341D17]/10 bg-[#FAF6F0]">
                      <img
                        src={
                          course.thumbnail_url ||
                          '/pictures/courses/french_pastry/Fruits_tartle.png'
                        }
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        12 Sesi
                      </span>
                    </div>

                    <div className="min-w-0">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                        {course.category_name || 'PASTRY ATELIER'}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-[#341D17] truncate">
                        {course.title}
                      </h3>
                      <p className="text-xs text-[#341D17]/65 truncate">
                        Instruktur: Chef {course.instructor_name}
                      </p>
                    </div>
                  </div>

                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#341D17]/12 bg-[#FAF6F0] text-sm text-[#341D17]">
                    &rsaquo;
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 rounded-full bg-[#F9DDBB] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#802924]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-[#341D17]/75 shrink-0">
                    {pct}%
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}