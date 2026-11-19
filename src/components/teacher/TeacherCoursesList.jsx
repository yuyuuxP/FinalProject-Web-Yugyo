'use client';

import Link from 'next/link';

const FALLBACK_COURSE_IMAGES = [
  '/pictures/courses/french_patisserie/Madeleines.png',
  '/pictures/courses/french_patisserie/macaron.png',
  '/pictures/categories/french_patisserie.png',
  '/pictures/categories/cakes_decorating.png',
  '/pictures/categories/cookies.png',
  '/pictures/categories/bread&yeast_goods.png',
  '/pictures/categories/indonesian_cakes.png',
];

function getCourseImage(course, idx = 0) {
  const raw = course?.thumbnail_url || course?.image_url || '';
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw.trim();
  }

  const titleLower = (course?.title || '').toLowerCase();
  if (titleLower.includes('madeleine')) {
    return '/pictures/courses/french_patisserie/Madeleines.png';
  }
  if (titleLower.includes('macaron')) {
    return '/pictures/courses/french_patisserie/macaron.png';
  }

  return FALLBACK_COURSE_IMAGES[idx % FALLBACK_COURSE_IMAGES.length];
}

export default function TeacherCoursesList({ courses = [] }) {
  if (!Array.isArray(courses) || courses.length === 0) {
    return (
      <div className="rounded-3xl border border-[#341D17]/25 bg-[#FFFDF9] p-6 text-center text-xs text-[#341D17]/70 shadow-sm">
        Belum ada kursus yang diajarkan.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {courses.map((course, idx) => {
        const bgImage = getCourseImage(course, idx);
        const enrolledCount = Number(course?.enrolled_count ?? course?.student_count ?? 0);
        const progressPercent = Number(course?.progress_percent ?? course?.completion_rate ?? 80);

        return (
          <div
            key={course.id ?? idx}
            className="relative isolate overflow-hidden rounded-3xl border border-[#341D17]/25 bg-[#341D17] p-5 sm:p-6 shadow-md transition hover:border-[#802924]/50 hover:shadow-lg"
          >
            {/* LATAR BELAKANG GAMBAR: JELAS DI KIRI, SEMAKIN KE KANAN SEMAKIN BLUR BERNUANSA MERAH */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
            >
              <img
                src={bgImage}
                alt={course.title || 'Kursus'}
                className="h-full w-full object-cover object-left opacity-100 contrast-105 saturate-105"
              />

              {/* Blur bertahap ke kanan dengan tint merah #802924 */}
              <div
                style={{
                  WebkitMaskImage:
                    'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0.72) 74%, rgba(0,0,0,1) 100%)',
                  maskImage:
                    'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0.72) 74%, rgba(0,0,0,1) 100%)',
                }}
                className="absolute inset-0 backdrop-blur-xl bg-[#802924]/35"
              />

              {/* Gradasi warna merah lembut ke arah kanan */}
              <div
                style={{
                  background:
                    'linear-gradient(90deg, rgba(128,41,36,0) 0%, rgba(128,41,36,0.12) 48%, rgba(128,41,36,0.42) 82%, rgba(102,31,27,0.62) 100%)',
                }}
                className="absolute inset-0"
              />
            </div>

            {/* KONTEN UTAMA KARTU */}
            <div className="relative z-10 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="max-w-2xl space-y-1 rounded-2xl bg-[#FFFDF9]/90 px-3.5 py-2.5 backdrop-blur-xs shadow-xs">
                  <span className="block text-[10px] font-extrabold tracking-[0.16em] uppercase text-[#802924]">
                    ATELIER MASTERCLASS
                  </span>
                  <h3 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="line-clamp-1 text-xs font-medium text-[#341D17]/85">
                      {course.description}
                    </p>
                  )}
                </div>

                <span className="shrink-0 rounded-full border border-[#F9DDBB]/60 bg-[#802924] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#F9DDBB] shadow-xs">
                  AKTIF DIAMPu
                </span>
              </div>

              {/* Progres Siswa */}
              <div className="space-y-1.5 rounded-2xl bg-[#FFFDF9]/90 px-3.5 py-2.5 backdrop-blur-xs shadow-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#341D17]">
                  <span>{enrolledCount} Siswa Terdaftar</span>
                  <span className="text-[#802924]">{progressPercent}% Selesai Kelas</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#341D17]/15">
                  <div
                    style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                    className="h-full rounded-full bg-[#802924] transition-all"
                  />
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                <Link
                  href={`/dashboard/teacher/courses/${course.id}/students`}
                  className="rounded-xl border border-[#341D17]/20 bg-[#FFFDF9]/95 hover:bg-[#F9DDBB] px-3.5 py-2 text-xs font-bold text-[#341D17] shadow-xs transition"
                >
                  Lihat Progres Siswa
                </Link>

                <Link
                  href={`/dashboard/teacher/courses/${course.id}/modules`}
                  className="rounded-xl border border-[#341D17]/20 bg-[#FFFDF9]/95 hover:bg-[#F9DDBB] px-3.5 py-2 text-xs font-bold text-[#341D17] shadow-xs transition"
                >
                  Kelola Materi
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}