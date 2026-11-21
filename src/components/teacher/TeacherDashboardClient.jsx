'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TeacherDashboardClient({
  teacher,
  stats,
  upcomingSession,
  courses = [],
  discussions = [],
}) {
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [showAllDiscussions, setShowAllDiscussions] = useState(false);

  const teacherName = teacher?.full_name || 'Chef Pengajar';
  const initials = String(teacherName)
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  const visibleCourses = showAllCourses ? courses : courses.slice(0, 2);
  const visibleDiscussions = showAllDiscussions
    ? discussions
    : discussions.slice(0, 2);

  return (
    <div className="mx-auto max-w-6xl space-y-5 text-[#341D17]">
      {/* GREETING CARD */}
      <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-4 sm:p-6 shadow-2xs flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F9DDBB] font-editorial text-lg font-extrabold text-[#802924]">
          {initials}
        </div>
        <div className="min-w-0 space-y-1">
          <span className="inline-block rounded-md bg-[#F9DDBB] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
            MASTER BAKER TERVERIFIKASI
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17] truncate">
            Bonjour, {teacherName}
          </h1>
          <p className="text-xs sm:text-sm text-[#341D17]/75">
            Siklus mentoring dan kurasi resep aktif untuk kelas Anda hari ini.
          </p>
        </div>
      </div>

      {/* 4 KARTU STATISTIK UTAMA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/60">
              TOTAL SISWA AKTIF
            </span>
            <span className="rounded-full bg-[#F9DDBB] px-2.5 py-0.5 text-[10px] font-extrabold text-[#802924]">
              KOHOR ANDA
            </span>
          </div>
          <p className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
            {stats?.totalStudents ?? 0} Siswa
          </p>
        </div>

        <div className="rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/60">
              KELAS MASTERCLASS
            </span>
            <span className="rounded-full bg-[#F9DDBB] px-2.5 py-0.5 text-[10px] font-extrabold text-[#802924]">
              DIAMPU
            </span>
          </div>
          <p className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
            {stats?.totalCourses ?? courses.length} Kelas
          </p>
        </div>

        <div className="rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/60">
              KEPUASAN SISWA
            </span>
            <span className="text-amber-500 text-sm">★</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
              {stats?.avgRating ?? '4.9'}
            </span>
            <span className="text-xs text-[#341D17]/50">/ 5.0</span>
          </div>
          <p className="text-[11px] text-[#341D17]/60">
            {stats?.totalReviews ?? 0} ulasan kursus
          </p>
        </div>

        <div className="rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/60">
              KARYA &amp; UJI RASA
            </span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800">
              URGENT
            </span>
          </div>
          <p className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
            {stats?.pendingWorks ?? 0} Karya
          </p>
          <p className="text-[11px] text-[#341D17]/60">Menunggu Evaluasi</p>
        </div>
      </div>

      {/* BANNER JADWAL LIVE SESI MENDATANG */}
      <div className="rounded-3xl bg-[#802924] text-[#FFFDF9] p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FFFDF9]/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#F9DDBB]">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>JADWAL LIVE SESI MENDATANG (DATABASE SYNC)</span>
          </span>
          <span className="text-xs font-bold text-[#F9DDBB]/90">
            {upcomingSession?.session_time
              ? `${upcomingSession.session_date} • ${upcomingSession.session_time}`
              : 'Hari Ini • 15:00 WIT'}
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#FFFDF9]">
            {upcomingSession?.title
              ? `Sesi Mentoring & Troubleshooting: ${upcomingSession.title}`
              : 'Sesi Mentoring & Troubleshooting: Madeleine Lemon Cake'}
          </h2>
          <p className="text-xs sm:text-sm text-[#FFFDF9]/85">
            {upcomingSession?.notes ||
              'Koreksi teknik dan evaluasi modul pastry bersama kohort siswa Anda hari ini.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <Link
            href="/dashboard/teacher/schedule"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#FFFDF9] hover:bg-[#F9DDBB] px-4 py-2 text-xs font-extrabold text-[#341D17] transition"
          >
            <span>▶ Mulai Sesi Live</span>
          </Link>
          <Link
            href="/dashboard/teacher/schedule"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#FFFDF9]/30 bg-[#FFFDF9]/10 hover:bg-[#FFFDF9]/20 px-4 py-2 text-xs font-bold text-[#FFFDF9] transition"
          >
            <span>📋 Cek Presensi Kohort</span>
          </Link>
        </div>
      </div>

      {/* KURSUS YANG DIAJARKAN (MAKSIMAL 2 DI AWAL + TOMBOL TAMPILKAN SEMUA KURSUS) */}
      <section className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17]">
              Kursus yang Diajarkan
            </h2>
            <p className="text-xs text-[#341D17]/70">
              Pantau kohort dan progres modul siswa di kelas Anda
            </p>
          </div>
          <span className="text-xs font-bold text-[#341D17]/75">
            {courses.length} Kursus Aktif
          </span>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-6 text-center text-xs sm:text-sm text-[#341D17]/70">
            Belum ada kursus yang diampu pada akun ini.
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {visibleCourses.map((course) => (
                <div
                  key={course.id}
                  className="relative overflow-hidden rounded-3xl border border-[#341D17]/15 bg-[#2B1510] text-[#FFFDF9] p-5 sm:p-6 shadow-sm"
                >
                  {course.thumbnail_url && (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="absolute inset-0 h-full w-full object-cover opacity-35"
                    />
                  )}
                  <div className="relative z-10 flex flex-col justify-between gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1 max-w-2xl">
                        <span className="inline-block rounded-md bg-[#FFFDF9]/90 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]">
                          {course.category_name || 'ATELIER MASTERCLASS'}
                        </span>
                        <h3 className="font-editorial text-xl sm:text-2xl font-bold text-[#FFFDF9]">
                          {course.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#FFFDF9]/85 line-clamp-2">
                          {course.description ||
                            'Sesi praktik dan bimbingan resep Yugyo Atelier.'}
                        </p>
                      </div>

                      <span className="rounded-full bg-[#FFFDF9]/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]">
                        {course.status === 'active'
                          ? 'AKTIF DIAMPU'
                          : course.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs font-bold text-[#FFFDF9]">
                        <span>{course.enrolled_students ?? 0} Siswa Terdaftar</span>
                        <span>{course.completion_percent ?? 80}% Selesai Kelas</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#FFFDF9]/25">
                        <div
                          className="h-full rounded-full bg-[#802924] transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(5, course.completion_percent ?? 80)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <Link
                        href={`/dashboard/teacher/courses/${course.id}/students`}
                        className="rounded-full bg-[#FFFDF9] hover:bg-[#F9DDBB] px-4 py-2 text-xs font-extrabold text-[#341D17] transition"
                      >
                        Lihat Progres Siswa
                      </Link>
                      <Link
                        href={`/dashboard/teacher/courses/${course.id}/contents`}
                        className="rounded-full bg-[#FFFDF9]/90 hover:bg-[#F9DDBB] px-4 py-2 text-xs font-extrabold text-[#341D17] transition"
                      >
                        Kelola Materi
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {courses.length > 2 && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowAllCourses((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#341D17]/20 bg-[#FFFDF9] hover:bg-[#F9DDBB]/55 px-5 py-2 text-xs font-extrabold text-[#341D17] shadow-2xs transition cursor-pointer"
                >
                  <span>
                    {showAllCourses
                      ? 'Sembunyikan Sebagian Kursus'
                      : `Tampilkan Semua Kursus (${courses.length})`}
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* DISKUSI & PERTANYAAN SISWA (MAKSIMAL 2 DI AWAL + TOMBOL TAMPILKAN SEMUA DISKUSI/PERTANYAAN) */}
      <section className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
              Diskusi &amp; Pertanyaan Siswa
            </h2>
            <p className="text-xs text-[#341D17]/65">
              Ulasan materi dan bimbingan teknis studio
            </p>
          </div>
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#802924] px-2.5 text-xs font-extrabold text-[#F9DDBB]">
            {discussions.length}
          </span>
        </div>

        {discussions.length === 0 ? (
          <div className="rounded-2xl bg-[#F9E8D6]/45 py-8 px-4 text-center text-xs sm:text-sm text-[#341D17]/70">
            Belum ada diskusi atau pertanyaan baru dari siswa atelier.
          </div>
        ) : (
          <>
            <div className="space-y-2.5">
              {visibleDiscussions.map((item) => (
                <Link
                  key={item.id}
                  href="/dashboard/teacher/chats"
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-[#341D17]/10 bg-[#F9E8D6]/35 hover:bg-[#F9DDBB]/50 p-3.5 transition"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs sm:text-sm font-extrabold text-[#341D17]">
                        {item.student_name}
                      </span>
                      <span className="text-[11px] text-[#341D17]/65">
                        • {item.course_title}
                      </span>
                    </div>
                    <p className="text-xs text-[#341D17]/85 line-clamp-1">
                      {item.question_text}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                        item.review_status === 'answered'
                          ? 'bg-[#341D17]/10 text-[#341D17]'
                          : 'bg-[#F9DDBB] text-[#802924]'
                      }`}
                    >
                      {item.review_status === 'answered'
                        ? '✓ Terjawab'
                        : '• Menunggu Review'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {discussions.length > 2 && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowAllDiscussions((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#341D17]/20 bg-[#FFFDF9] hover:bg-[#F9DDBB]/55 px-5 py-2 text-xs font-extrabold text-[#341D17] shadow-2xs transition cursor-pointer"
                >
                  <span>
                    {showAllDiscussions
                      ? 'Sembunyikan Sebagian Diskusi/Pertanyaan'
                      : `Tampilkan Semua Diskusi/Pertanyaan (${discussions.length})`}
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}