'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FaWandSparkles,
  FaAward,
  FaCheck,
  FaClock,
  FaGem,
  FaPlay,
  FaUserTie,
  FaArrowRight,
  FaArrowDown,
  FaCalendarDays,
  FaFileLines,
} from 'react-icons/fa6';
import {
  getActiveStudentIdentity,
  saveActiveStudentId,
} from '@/lib/studentSessionClient';

function normalizeCategory(rawCat) {
  const lower = String(rawCat || '').toLowerCase();
  if (
    lower.includes('bread') ||
    lower.includes('yeast') ||
    lower.includes('roti') ||
    lower.includes('sourdough') ||
    lower.includes('ciabatta') ||
    lower.includes('brioche')
  ) {
    return 'Bread & Yeast Goods';
  }
  if (
    lower.includes('cake') &&
    (lower.includes('decor') ||
      lower.includes('buttercream') ||
      lower.includes('glaze'))
  ) {
    return 'Cake Decorating';
  }
  if (
    lower.includes('cookie') ||
    lower.includes('small bite') ||
    lower.includes('macaron') ||
    lower.includes('nastar')
  ) {
    return 'Cookies & Small Bites';
  }
  if (
    lower.includes('french') ||
    lower.includes('patisserie') ||
    lower.includes('pastry') ||
    lower.includes('croissant') ||
    lower.includes('madeleine')
  ) {
    return 'French Patisserie & Pastry';
  }
  if (
    lower.includes('traditional') ||
    lower.includes('indonesian') ||
    lower.includes('nusantara') ||
    lower.includes('lapis') ||
    lower.includes('bika') ||
    lower.includes('onde') ||
    lower.includes('klepon')
  ) {
    return 'Traditional Indonesian Cakes';
  }
  return 'Bread & Yeast Goods';
}

function formatDateDisplay(isoStr) {
  const clean = String(isoStr || '').slice(0, 10);
  const [y, m, d] = clean.split('-');
  if (!y || !m || !d) return clean;
  return `${d}-${m}-${y}`;
}

function buildCourseDetailHref(course) {
  if (!course || !course.id) return '/dashboard/student/courses';
  const params = new URLSearchParams();
  params.set('courseId', String(course.id));
  if (course.category) {
    params.set('category', course.category);
  }
  return `/dashboard/student/courses?${params.toString()}`;
}

function normalizeCourse(row, idx = 0) {
  const idNum = Number(row?.id ?? row?.course_id ?? idx + 1);
  const totalModules = Math.max(0, Number(row?.total_modules ?? 0));
  const completedModules = Math.max(0, Number(row?.completed_modules ?? 0));
  const rawProgress = Number(row?.progress_percentage ?? row?.progress ?? 0);
  const computedProgress =
    totalModules > 0
      ? Math.min(100, Math.round((completedModules / totalModules) * 100))
      : Math.min(100, Math.max(0, rawProgress));

  return {
    id: idNum,
    title: String(row?.title ?? `Kursus #${idx + 1}`).trim(),
    description: String(
      row?.description ??
        'Praktik teknik pengolahan dan formula resep standar Yugyo Atelier.'
    ).trim(),
    thumbnailUrl: String(row?.thumbnail_url ?? row?.thumbnailUrl ?? '').trim(),
    category: normalizeCategory(row?.category ?? row?.category_name),
    instructor: String(
      row?.instructor ?? row?.instructor_name ?? 'Chef Yugyo'
    ).trim(),
    totalModules,
    completedModules,
    progressPercent: computedProgress,
  };
}

export default function StudentDashboardClient({
  student = null,
  initialAllCourses = [],
  initialEnrolledCourses = [],
  initialSessions = [],
  initialCompletedKeys = [],
  initialSessionXp = 0,
}) {
  const allCourses = useMemo(
    () =>
      Array.isArray(initialAllCourses)
        ? initialAllCourses.map((r, i) => normalizeCourse(r, i))
        : [],
    [initialAllCourses]
  );

  const [displayName, setDisplayName] = useState(() =>
    String(student?.full_name || 'Student').trim()
  );
  const [enrolledCourses, setEnrolledCourses] = useState(() =>
    Array.isArray(initialEnrolledCourses)
      ? initialEnrolledCourses.map((r, i) => normalizeCourse(r, i))
      : []
  );
  const [sessions, setSessions] = useState(() =>
    Array.isArray(initialSessions) ? initialSessions : []
  );
  const [completedKeys, setCompletedKeys] = useState(() =>
    Array.isArray(initialCompletedKeys) ? initialCompletedKeys : []
  );
  const [sessionXp, setSessionXp] = useState(() =>
    Number(initialSessionXp || 0)
  );
  const [selectedContinueId, setSelectedContinueId] = useState(null);

  useEffect(() => {
    let active = true;

    async function syncDashboardData() {
      try {
        const identity = await getActiveStudentIdentity();
        if (!active) return;

        const studentId = identity.studentId || student?.id || null;
        const studentName = identity.studentName || student?.full_name || '';

        if (studentName) {
          setDisplayName(studentName);
        }

        if (!studentId && !studentName) return;

        const params = new URLSearchParams();
        if (studentId) params.set('studentId', String(studentId));
        if (studentName) params.set('studentName', studentName);

        const [enrollRes, progressRes, scheduleRes, xpRes] = await Promise.all([
          fetch(`/api/student/enrollments?${params.toString()}`, {
            cache: 'no-store',
          }),
          fetch(`/api/student/module-progress?${params.toString()}`, {
            cache: 'no-store',
          }),
          fetch(`/api/student/schedule?${params.toString()}`, {
            cache: 'no-store',
          }),
          fetch(`/api/student/sessions/complete?${params.toString()}`, {
            cache: 'no-store',
          }),
        ]);

        if (!active) return;

        const enrollData = enrollRes.ok
          ? await enrollRes.json().catch(() => null)
          : null;
        const progressData = progressRes.ok
          ? await progressRes.json().catch(() => null)
          : null;
        const scheduleData = scheduleRes.ok
          ? await scheduleRes.json().catch(() => null)
          : null;
        const xpData = xpRes.ok ? await xpRes.json().catch(() => null) : null;

        if (!active) return;

        const resolvedId =
          enrollData?.studentId ||
          progressData?.studentId ||
          scheduleData?.studentId ||
          xpData?.studentId;
        if (resolvedId) {
          saveActiveStudentId(resolvedId, studentName);
        }

        if (xpData && typeof xpData.totalSessionXp === 'number') {
          setSessionXp(xpData.totalSessionXp);
        }

        const keysList = Array.isArray(progressData?.completedKeys)
          ? progressData.completedKeys
          : null;
        if (keysList) {
          setCompletedKeys(keysList);
        }

        const progressMap =
          progressData?.progressByCourse &&
          typeof progressData.progressByCourse === 'object'
            ? progressData.progressByCourse
            : {};

        if (enrollData && Array.isArray(enrollData.enrollments)) {
          const activeRows = enrollData.enrollments.filter(
            (row) =>
              String(row?.status || 'active').toLowerCase() !== 'dropped'
          );

          const mapped = activeRows
            .map((row, idx) => {
              const cId = Number(row?.course_id ?? row?.courseId);
              const baseCourse = allCourses.find((c) => c.id === cId);
              const doneInCourse = (keysList || []).filter((k) =>
                String(k).startsWith(`${cId}:`)
              ).length;
              const totalMods = baseCourse?.totalModules ?? 0;
              const pctFromMap = progressMap[String(cId)];
              const pctFromEnroll = Number(row?.progress_percentage ?? 0);
              const finalPercent =
                totalMods > 0
                  ? Math.min(100, Math.round((doneInCourse / totalMods) * 100))
                  : typeof pctFromMap === 'number'
                    ? pctFromMap
                    : pctFromEnroll;

              if (baseCourse) {
                return {
                  ...baseCourse,
                  completedModules: doneInCourse,
                  progressPercent: finalPercent,
                };
              }

              return normalizeCourse(
                {
                  id: cId,
                  title: row?.title || row?.course_title,
                  category: row?.category || row?.category_name,
                  instructor: row?.instructor || row?.instructor_name,
                  progress_percentage: finalPercent,
                },
                idx
              );
            })
            .filter((c) => Number.isInteger(c.id) && c.id > 0);

          setEnrolledCourses(mapped);
        }

        if (scheduleData && Array.isArray(scheduleData.sessions)) {
          setSessions(scheduleData.sessions);
        }
      } catch {
        // Abaikan jika gagal sinkronisasi jaringan sementara
      }
    }

    syncDashboardData();

    return () => {
      active = false;
    };
  }, [allCourses, student]);

  const firstName = useMemo(() => {
    const clean = String(displayName || 'Student').trim();
    return clean.split(/\s+/)[0] || 'Student';
  }, [displayName]);

  const totalXp = useMemo(
    () => sessionXp + completedKeys.length * 50,
    [sessionXp, completedKeys.length]
  );

  const levelInfo = useMemo(() => {
    if (totalXp >= 2000) {
      return {
        currentLabel: 'Level 3: Maître Sourdough & Pastry',
        prevLabel: 'Level 2: Artisan Viennoiserie (Lulus)',
        nextLabel: 'Tingkat Tertinggi Atelier',
        targetXp: 3000,
        percent: Math.min(100, Math.round(((totalXp - 2000) / 1000) * 100)),
      };
    }
    if (totalXp >= 500) {
      return {
        currentLabel: 'Level 2: Artisan Viennoiserie',
        prevLabel: 'Level 1: Pâte Sucrée (Lulus)',
        nextLabel: 'Tingkat Mulia: Sourdough Pastry',
        targetXp: 2000,
        percent: Math.min(100, Math.round((totalXp / 2000) * 100)),
      };
    }
    return {
      currentLabel: 'Level 1: Pâte Sucrée Apprentice',
      prevLabel: 'Orientasi Dapur Atelier (Lulus)',
      nextLabel: 'Level 2: Artisan Viennoiserie',
      targetXp: 500,
      percent: Math.min(100, Math.max(8, Math.round((totalXp / 500) * 100))),
    };
  }, [totalXp]);

  const activeLearningCourse = useMemo(() => {
    if (enrolledCourses.length === 0) return null;
    if (selectedContinueId !== null) {
      const picked = enrolledCourses.find(
        (c) => Number(c.id) === Number(selectedContinueId)
      );
      if (picked) return picked;
    }
    const inProgress = enrolledCourses.find(
      (c) => c.progressPercent > 0 && c.progressPercent < 100
    );
    return inProgress || enrolledCourses[0];
  }, [enrolledCourses, selectedContinueId]);

  const otherOngoingCourses = useMemo(() => {
    if (!activeLearningCourse) return [];
    return enrolledCourses.filter(
      (c) => Number(c.id) !== Number(activeLearningCourse.id)
    );
  }, [enrolledCourses, activeLearningCourse]);

  const continueCourseHref = useMemo(
    () => buildCourseDetailHref(activeLearningCourse),
    [activeLearningCourse]
  );

  const totalSessionsCount = sessions.length;
  const completedSessionsCount = useMemo(
    () =>
      sessions.filter((s) => Boolean(s?.is_completed ?? s?.isCompleted)).length,
    [sessions]
  );

  const sessionIndexPercent = useMemo(
    () =>
      totalSessionsCount > 0
        ? Math.round((completedSessionsCount / totalSessionsCount) * 100)
        : 0,
    [completedSessionsCount, totalSessionsCount]
  );

  const focusHoursNumber = useMemo(() => {
    const totalUnits = completedKeys.length + completedSessionsCount;
    return Number((totalUnits * 0.5).toFixed(1));
  }, [completedKeys.length, completedSessionsCount]);

  const certificatesCount = useMemo(
    () => enrolledCourses.filter((c) => c.progressPercent >= 100).length,
    [enrolledCourses]
  );

  const upcomingSessions = useMemo(() => {
    const pending = sessions.filter(
      (s) =>
        !Boolean(s?.is_completed ?? s?.isCompleted) &&
        !Boolean(s?.is_teacher_done ?? s?.isTeacherDone)
    );
    return (pending.length > 0 ? pending : sessions).slice(0, 3);
  }, [sessions]);

  return (
    <div className="space-y-6 text-[#341D17] pb-12">
      {/* 1. Sapaan & Level XP */}
      <section className="space-y-4">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFFDF9]/90 border border-[#802924]/15 px-3 py-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#802924]">
            <FaWandSparkles className="w-3 h-3 shrink-0" />
            <span>APPRENTICE BAKER &bull; VERIFIED STUDENT</span>
          </span>

          <h1 className="meddon-regular font-editorial text-2xl sm:text-4xl font-bold text-[#341D17]">
            Halo, <span className="font-extrabold text-[#802924]">{firstName}!</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#341D17]/75">
            Lanjutkan kreasi aroma butter dan laminasi adonan hari ini. Dapur siap menyambut sentuhan tanganmu.
          </p>
        </div>

        {/* Kartu Level & XP Bar */}
        <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 p-4 sm:p-5 shadow-2xs space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-extrabold text-[#341D17]">
              <FaAward className="w-3.5 h-3.5 text-[#802924] shrink-0" />
              <span>{levelInfo.currentLabel}</span>
            </span>
            <span className="font-extrabold text-[#802924]">
              {totalXp.toLocaleString('id-ID')} /{' '}
              {levelInfo.targetXp.toLocaleString('id-ID')} XP
            </span>
          </div>

          <div className="h-2.5 w-full rounded-full bg-[#F9DDBB]/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#802924] transition-all duration-300"
              style={{ width: `${levelInfo.percent}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="text-[#341D17]/55">{levelInfo.prevLabel}</span>
            <span className="font-bold text-[#802924]">
              {levelInfo.nextLabel}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Statistik 4 Kartu */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Kursus Berjalan */}
        <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#F9DDBB]/80 text-[#802924] flex items-center justify-center text-xs font-extrabold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#802924]" />
            </span>
            <span className="rounded-full bg-[#FAF6F0] border border-[#341D17]/12 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/75">
              AKTIF
            </span>
          </div>
          <div className="space-y-0.5">
            <p className="text-xl sm:text-2xl font-extrabold text-[#341D17]">
              {enrolledCourses.length}
            </p>
            <p className="text-xs font-semibold text-[#341D17]/60">
              Kursus Berjalan
            </p>
          </div>
        </div>

        {/* Card 2: Mark as Done */}
        <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#EEF5EE] text-[#82882B] flex items-center justify-center text-xs font-extrabold">
              <FaCheck className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-bold text-[#82882B]">
              {sessionIndexPercent}% Indeks
            </span>
          </div>
          <div className="space-y-0.5">
            <p className="text-xl sm:text-2xl font-extrabold text-[#341D17]">
              {completedSessionsCount}{' '}
              <span className="text-xs sm:text-sm font-semibold text-[#341D17]/45">
                / {totalSessionsCount} Sesi
              </span>
            </p>
            <p className="text-xs font-semibold text-[#341D17]/60">
              Mark as Done
            </p>
          </div>
        </div>

        {/* Card 3: Fokus Pekan Ini */}
        <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#F9DDBB]/65 text-[#802924] flex items-center justify-center text-xs font-extrabold">
              <FaClock className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-bold text-[#341D17]/55">
              +{focusHoursNumber.toFixed(1)} Jam
            </span>
          </div>
          <div className="space-y-0.5">
            <p className="text-xl sm:text-2xl font-extrabold text-[#341D17]">
              {focusHoursNumber.toFixed(1)}{' '}
              <span className="text-xs sm:text-sm font-semibold text-[#341D17]/50">
                Jam
              </span>
            </p>
            <p className="text-xs font-semibold text-[#341D17]/60">
              Fokus Pekan Ini
            </p>
          </div>
        </div>

        {/* Card 4: Unduh Sertifikat */}
        <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#802924] text-[#FFFDF9] flex items-center justify-center text-xs font-extrabold">
              <FaAward className="w-3.5 h-3.5" />
            </span>
            <span className="rounded-full bg-[#F9DDBB]/85 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
              SIAP
            </span>
          </div>
          <div className="space-y-0.5">
            <p className="text-xl sm:text-2xl font-extrabold text-[#341D17]">
              {certificatesCount}
            </p>
            <Link
              href={continueCourseHref}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#802924] hover:underline"
            >
              <span>Unduh Sertifikat</span>
              <FaArrowDown className="w-2.5 h-2.5 shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Lanjutkan Pembelajaran */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FaGem className="w-3.5 h-3.5 text-[#802924] shrink-0" />
            <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
              Lanjutkan Pembelajaran
            </h2>
          </div>

          <Link
            href={continueCourseHref}
            className="text-xs font-bold text-[#802924] hover:underline"
          >
            Lihat Silabus
          </Link>
        </div>

        {activeLearningCourse ? (
          <article className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="relative h-48 sm:h-64 w-full rounded-2xl overflow-hidden bg-[#F9DDBB] border border-[#341D17]/10">
              {activeLearningCourse.thumbnailUrl ? (
                <img
                  src={activeLearningCourse.thumbnailUrl}
                  alt={activeLearningCourse.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F9DDBB] to-[#EBC49A] text-[#802924] font-editorial text-xl font-bold px-4 text-center">
                  {activeLearningCourse.title}
                </div>
              )}

              <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#341D17]/85 px-3 py-1 text-[10px] font-bold text-[#FFFDF9]">
                  Modul Utama #01
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#802924]/90 px-3 py-1 text-[10px] font-bold text-[#FFFDF9]">
                  <FaPlay className="w-2.5 h-2.5 shrink-0" />
                  <span>Video HD</span>
                </span>
              </div>

              <span className="absolute bottom-3 right-3 rounded-lg bg-[#341D17]/85 px-2.5 py-1 text-[10px] font-bold text-[#FFFDF9]">
                {activeLearningCourse.completedModules}/
                {activeLearningCourse.totalModules || 1} Modul
              </span>
            </div>

            <div className="space-y-1">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#341D17]/70">
                <FaUserTie className="w-3 h-3 text-[#802924] shrink-0" />
                <span>
                  {activeLearningCourse.instructor} &bull;{' '}
                  {activeLearningCourse.category}
                </span>
              </p>
              <h3 className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17]">
                {activeLearningCourse.title}
              </h3>
              <p className="text-xs text-[#341D17]/65">
                Fokus Materi: {activeLearningCourse.description}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#341D17]/75">
                  Kemajuan Modul
                </span>
                <span className="font-extrabold text-[#341D17]">
                  {activeLearningCourse.progressPercent}% Selesai
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#F9DDBB]/75 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#802924] transition-all duration-300"
                  style={{ width: `${activeLearningCourse.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#341D17]/55">
              <span className="inline-flex items-center gap-1.5">
                <FaClock className="w-3 h-3 shrink-0" />
                <span>Siap dilanjutkan kapan saja</span>
              </span>
              <span>
                {activeLearningCourse.totalModules > 0
                  ? `${activeLearningCourse.totalModules} Modul Tersedia`
                  : 'Kurikulum Atelier'}
              </span>
            </div>

            <Link
              href={continueCourseHref}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#802924] hover:bg-[#661F1B] px-5 py-3 text-xs sm:text-sm font-bold text-[#FFFDF9] transition shadow-xs"
            >
              <span>Lanjutkan Belajar Sekarang</span>
              <FaArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Link>
          </article>
        ) : (
          <div className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 p-6 text-center space-y-3">
            <p className="text-sm font-bold text-[#341D17]">
              Kamu belum mengikuti kursus apa pun
            </p>
            <p className="text-xs text-[#341D17]/65">
              Pilih kursus pastry favoritmu di Course Catalog untuk mulai belajar.
            </p>
            <div>
              <Link
                href="/dashboard/student/catalog"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#802924] hover:bg-[#661F1B] px-4 py-2 text-xs font-bold text-[#FFFDF9] transition"
              >
                <span>Jelajahi Course Catalog</span>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 4. Jadwal Kelas Terdekat */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FaCalendarDays className="w-3.5 h-3.5 text-[#802924] shrink-0" />
            <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
              Jadwal Kelas Terdekat
            </h2>
          </div>

          <Link
            href="/dashboard/student/schedule"
            className="text-xs font-bold text-[#802924] hover:underline"
          >
            Kalender Penuh
          </Link>
        </div>

        {upcomingSessions.length === 0 ? (
          <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 p-5 text-xs text-[#341D17]/60">
            Belum ada jadwal kelas terdekat.
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingSessions.map((ses, idx) => (
              <Link
                key={ses.id ?? idx}
                href="/dashboard/student/schedule"
                className="block rounded-2xl bg-[#FFFDF9] hover:bg-[#FAF6F0] border border-[#341D17]/12 p-4 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                      {ses.course_title ?? ses.courseTitle} &bull; SESI{' '}
                      {ses.session_number ?? ses.sessionNumber ?? 1}
                    </p>
                    <p className="text-sm font-bold text-[#341D17] truncate">
                      {ses.title}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#341D17]/65 shrink-0">
                    {formatDateDisplay(ses.session_date ?? ses.sessionDate)}{' '}
                    &bull; {ses.session_time ?? ses.sessionTime}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 5. Catatan Atelier Hari Ini */}
      <section className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 p-5 sm:p-6 space-y-4">
        <div className="space-y-1.5">
          <p className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#802924]">
            <FaWandSparkles className="w-3 h-3 shrink-0" />
            <span>CATATAN ATELIER HARI INI</span>
          </p>
          <h3 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
            Tips Fermentasi Dingin (Cold Retardation)
          </h3>
          <p className="text-xs sm:text-sm text-[#341D17]/75 italic leading-relaxed">
            &ldquo;Pertahankan suhu chiller tepat di kisaran 4&deg;C agar aktivitas ragi beristirahat stabil, memberi ruang optimal bagi asam laktat membentuk aroma mentega khas Parisian Croissant.&rdquo;
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#802924] text-[#FFFDF9] font-extrabold text-xs flex items-center justify-center shrink-0">
              YA
            </div>
            <div>
              <p className="text-xs font-bold text-[#341D17]">Chef Ayu</p>
              <p className="text-[11px] text-[#341D17]/60">
                Head of Viennoiserie
              </p>
            </div>
          </div>

          <Link
            href={continueCourseHref}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FAF6F0] hover:bg-[#F9DDBB]/65 border border-[#341D17]/12 px-3.5 py-2 text-xs font-bold text-[#341D17] transition"
          >
            <FaFileLines className="w-3.5 h-3.5 text-[#802924] shrink-0" />
            <span>Lembar Formula</span>
          </Link>
        </div>
      </section>

      {/* 6. Materi Berlangsung Lainnya */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
            Materi Berlangsung Lainnya
          </h2>

          <Link
            href="/dashboard/student/catalog"
            className="text-xs font-bold text-[#802924] hover:underline"
          >
            Katalog Lengkap
          </Link>
        </div>

        {otherOngoingCourses.length === 0 ? (
          <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 p-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#341D17]/65">
              Belum ada materi berlangsung lainnya. Jelajahi kelas lain untuk menambah koleksi resepmu.
            </p>
            <Link
              href="/dashboard/student/catalog"
              className="rounded-xl bg-[#FAF6F0] hover:bg-[#F9DDBB]/70 border border-[#341D17]/15 px-3.5 py-2 text-xs font-bold text-[#341D17] transition shrink-0"
            >
              + Tambah Kursus
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherOngoingCourses.map((course) => (
              <div
                key={course.id}
                className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 p-4 shadow-2xs flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-16 h-16 rounded-xl bg-[#F9DDBB] border border-[#341D17]/10 overflow-hidden shrink-0 flex items-center justify-center">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-extrabold text-[#802924] text-center px-1.5">
                        {course.category}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#802924] truncate">
                      {course.category}
                    </p>
                    <h3 className="font-editorial text-base font-bold text-[#341D17] truncate">
                      {course.title}
                    </h3>
                    <p className="inline-flex items-center gap-1.5 text-[11px] text-[#341D17]/60 truncate">
                      <FaUserTie className="w-2.5 h-2.5 text-[#802924] shrink-0" />
                      <span>{course.instructor}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#341D17]/65 font-semibold">
                      Progres
                    </span>
                    <span className="font-bold text-[#341D17]">
                      {course.progressPercent}% ({course.completedModules}/
                      {course.totalModules || 1} Modul)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#F9DDBB]/75 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#802924]"
                      style={{ width: `${course.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={buildCourseDetailHref(course)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#802924] hover:bg-[#661F1B] px-3.5 py-2 text-xs font-bold text-[#FFFDF9] transition"
                  >
                    <span>Lanjut Belajar</span>
                    <FaArrowRight className="w-3 h-3 shrink-0" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setSelectedContinueId(course.id)}
                    className="rounded-xl border border-[#341D17]/15 bg-[#FAF6F0] hover:bg-[#F9DDBB]/65 px-3 py-2 text-xs font-bold text-[#341D17] transition cursor-pointer shrink-0"
                  >
                    Sorot
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}