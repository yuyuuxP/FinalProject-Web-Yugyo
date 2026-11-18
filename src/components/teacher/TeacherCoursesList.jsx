'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TeacherCoursesList({ courses }) {
  const [showAll, setShowAll] = useState(false);

  // Batasi hanya 2 kursus di awal jika showAll bernilai false
  const displayedCourses = showAll ? courses : courses.slice(0, 2);

  if (courses.length === 0) {
    return (
      <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-8 text-center text-xs text-[#341D17]/60">
        Belum ada kursus yang terdaftar atas nama Anda di database. Buat kursus baru melalui menu Course Management.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* List Kursus */}
      <div className="space-y-4">
        {displayedCourses.map((course) => (
          <div key={course.id} className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 relative overflow-hidden transition">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#341D17]/10 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#802924]">
                  ATELIER MASTERCLASS
                </span>
                <h3 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17] mt-0.5">
                  {course.title}
                </h3>
                <p className="text-xs text-[#341D17]/70 mt-1 line-clamp-1">{course.description}</p>
              </div>
              <span className="bg-[#82882B]/15 text-[#82882B] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase self-start shrink-0">
                Aktif Diampu
              </span>
            </div>

            {/* Info Progres & Siswa */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#341D17]/70">👥 {course.enrolled_count || 0} Siswa Terdaftar</span>
                <span className="text-[#802924]">✓ 88% Selesai Kohor</span>
              </div>
              <div className="w-full bg-[#F9DDBB]/50 h-2 rounded-full overflow-hidden">
                <div className="bg-[#802924] h-full w-[88%]" />
              </div>
            </div>

            {/* Tombol Aksi Kursus */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={`/dashboard/teacher/courses`}
                className="bg-[#F9DDBB]/40 hover:bg-[#F9DDBB] text-[#341D17] font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
              >
                <span>📊</span>
                <span>Lihat Progres Siswa</span>
              </Link>
              <Link
                href={`/dashboard/teacher/contents`}
                className="bg-[#F9DDBB]/40 hover:bg-[#F9DDBB] text-[#341D17] font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
              >
                <span>📚</span>
                <span>Kelola Materi</span>
              </Link>
            </div>

          </div>
        ))}
      </div>

      {/* Tombol Toggle "Tampilkan Semua / Sembunyikan" (Hanya muncul jika kursus > 2) */}
      {courses.length > 2 && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="bg-[#FFFDF9] hover:bg-[#F9DDBB]/30 border border-[#341D17]/20 text-[#802924] font-bold text-xs py-3 px-6 rounded-2xl transition shadow-xs cursor-pointer inline-flex items-center gap-2"
          >
            <span>{showAll ? '▲ Sembunyikan Sebagian Kursus' : `▼ Tampilkan Semua Kursus (${courses.length})`}</span>
          </button>
        </div>
      )}
    </div>
  );
}