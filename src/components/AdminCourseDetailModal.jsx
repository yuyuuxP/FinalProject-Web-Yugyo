'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminCourseDetailModal({ course }) {
  const router = useRouter();

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

  const handleDelete = async () => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus kursus "${course.title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/courses?id=${course.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/dashboard/admin/courses');
        router.refresh();
      } else {
        alert('Gagal menghapus kursus.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Terjadi kesalahan koneksi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#341D17]/45 backdrop-blur-xs overflow-y-auto flex items-start justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-4xl bg-[#FFFDF9] rounded-3xl shadow-2xl border border-[#341D17]/20 overflow-hidden my-auto">
        
        {/* TOP BAR / HEADER MODAL (Tombol Edit, Hapus, & Tutup) */}
        <div className="px-6 py-4 bg-[#FFFDF9] border-b border-[#341D17]/10 flex items-center justify-between">
          <span className="bg-[#F9DDBB] text-[#802924] px-3 py-1 rounded-full text-[10px] font-extrabold">
            #CRS-{String(course.id).padStart(3, '0')}
          </span>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/admin/courses/${course.id}/edit`}
              className="px-3 py-1.5 rounded-xl bg-[#F9DDBB]/50 hover:bg-[#F9DDBB] text-[#341D17] text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <span>✏️</span> Edit
            </Link>

            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-xl bg-[#802924]/10 hover:bg-[#802924] text-[#802924] hover:text-[#F9DDBB] text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>🗑️</span> Hapus
            </button>

            <Link
              href="/dashboard/admin/courses"
              aria-label="Tutup"
              className="w-8 h-8 rounded-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] flex items-center justify-center text-xs font-bold transition shadow-xs ml-2"
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
                {course.category_name || 'TRADITIONAL INDONESIAN CAKES'}
              </span>
            </div>

            <h1 className="font-editorial text-xl sm:text-2xl md:text-3xl font-bold text-[#341D17] leading-snug">
              {course.title}
            </h1>
          </div>

          {/* Profil Instruktur */}
          <div className="bg-[#F9DDBB]/35 border border-[#341D17]/10 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#802924] text-[#F9DDBB] font-bold flex items-center justify-center shrink-0">
                👨‍🍳
              </div>
              <div>
                <p className="text-xs font-bold text-[#341D17]">
                  {course.instructor_name || 'Chef Yuyu'}
                </p>
                <p className="text-[11px] text-[#341D17]/65 mt-0.5">
                  Master Baker • Atelier Instructor
                </p>
              </div>
            </div>
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

          {/* Video Pembelajaran HD (Dikembalikan) */}
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
              {course.description || 'Teknik membuat bolu kukus mekar sempurna menggunakan bantuan air soda atau teknik pengukusan suhu tinggi tanpa bahan pengembang buatan berlebih.'}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}