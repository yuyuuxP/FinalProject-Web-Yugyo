'use client';

import Link from 'next/link';

export default function AdminCourseDetailModal({ course }) {
  if (!course) return null;

  const statusVal = (course.status || 'active').toLowerCase();
  const statusLabel =
    statusVal === 'active'
      ? 'AKTIF (PUBLISHED)'
      : statusVal === 'pending'
      ? 'MENUNGGU APPROVAL'
      : 'DRAFT';

  const statusColor =
    statusVal === 'active'
      ? 'bg-[#82882B] text-white'
      : statusVal === 'pending'
      ? 'bg-[#802924] text-[#F9DDBB]'
      : 'bg-[#341D17]/20 text-[#341D17]';

  return (
    <div className="fixed inset-0 z-50 bg-[#341D17]/45 backdrop-blur-xs overflow-y-auto flex items-start justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-4xl bg-[#FFFDF9] rounded-3xl shadow-2xl border border-[#341D17]/20 overflow-hidden my-auto">
        
        {/* TOP BAR / HEADER MODAL (Tanpa teks 'Kembali ke Manajemen Kursus') */}
        <div className="px-6 py-4 bg-[#FFFDF9] border-b border-[#341D17]/10 flex items-center justify-end">
          <div className="flex items-center gap-2">
            <span className="bg-[#F9DDBB] text-[#802924] px-3 py-1 rounded-full text-[10px] font-extrabold">
              #CRS-{String(course.id).padStart(3, '0')}
            </span>
            <Link
              href="/dashboard/admin/courses"
              aria-label="Tutup"
              className="w-8 h-8 rounded-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] flex items-center justify-center text-xs font-bold transition shadow-xs"
            >
              ✕
            </Link>
          </div>
        </div>

        {/* BODY KONTEN DETAIL KURSUS */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[82vh] overflow-y-auto">
          
          {/* Top Meta & Title */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase">
              <span className="bg-[#F9DDBB] text-[#802924] px-3 py-1 rounded-full">
                {course.category_name || 'FRENCH VIENNOISERIE & PÂTISSERIE'}
              </span>
              <span className="bg-[#FFFDF9] border border-[#341D17]/15 text-[#341D17]/75 px-3 py-1 rounded-full">
                Laminated Dough
              </span>
              <span className="bg-[#FFFDF9] border border-[#341D17]/15 text-[#341D17]/75 px-3 py-1 rounded-full">
                Fermentasi Dingin
              </span>
            </div>

            <h1 className="font-editorial text-xl sm:text-2xl md:text-3xl font-bold text-[#341D17] leading-snug">
              {course.title}
            </h1>

            <p className="text-xs text-[#341D17]/75">
              Kursus Induk: <strong className="text-[#341D17]">{course.title}</strong>
            </p>
          </div>

          {/* Profil Instruktur */}
          <div className="bg-[#F9DDBB]/35 border border-[#341D17]/10 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#802924] text-[#F9DDBB] font-bold flex items-center justify-center shrink-0">
                👨‍🍳
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-[#341D17]">
                    {course.instructor_name || 'Chef Antoine Dupont'}
                  </p>
                  <span className="bg-[#82882B]/20 text-[#82882B] px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase">
                    CAP Boulangerie
                  </span>
                </div>
                <p className="text-[11px] text-[#341D17]/65 mt-0.5">
                  Maître Boulanger • Ferrandi Paris Alum
                </p>
              </div>
            </div>

            <span className="w-9 h-9 rounded-xl bg-[#FFFDF9] border border-[#341D17]/15 flex items-center justify-center text-xs text-[#341D17]">
              ✉️
            </span>
          </div>

          {/* Status Kurasi Konten */}
          <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-2xs">
            <span className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#802924] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#802924]" /> STATUS KURASI KONTEN
            </span>
            <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase shadow-2xs ${statusColor}`}>
              {statusLabel}
            </span>
          </div>

          {/* Video Pembelajaran HD Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-sm sm:text-base font-bold text-[#341D17] flex items-center gap-2">
                <span>▶</span> Video Pembelajaran HD
              </h3>
              <span className="text-[11px] font-semibold text-[#341D17]/60">1080p • 32 Menit</span>
            </div>

            <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden border border-[#341D17]/15 bg-[#341D17]">
              <img
                src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85"
                alt="Video Preview"
                className="w-full h-full object-cover object-center opacity-85"
              />
              <div className="absolute inset-0 bg-[#341D17]/30 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-[#802924] text-[#F9DDBB] flex items-center justify-center shadow-xl text-xl pl-1 cursor-pointer hover:scale-105 transition">
                  ▶
                </div>
              </div>
            </div>
          </div>

          {/* Deskripsi Materi */}
          <div className="bg-[#F9DDBB]/25 border border-[#341D17]/10 rounded-2xl p-5 space-y-2">
            <h4 className="font-editorial text-sm font-bold text-[#341D17]">Tentang Modul Ini</h4>
            <p className="text-xs text-[#341D17]/80 leading-relaxed">
              {course.description || 'Mempelajari secara mendalam teknik pelapisan mentega Tourage 84% dengan metode pembekuan bertahap untuk menghasilkan rongga sarang lebah yang renyah dan sempurna.'}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}