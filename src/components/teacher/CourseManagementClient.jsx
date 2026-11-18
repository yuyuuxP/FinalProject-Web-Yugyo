'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CourseManagementClient({ courses }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Semua'); // 'Semua', 'Sedang Tayang', 'Draft', 'Pending'

  const totalCourses = courses.length;
  const activeCount = courses.filter(c => c.status === 'active').length;
  const draftCount = courses.filter(c => c.status === 'draft').length;
  const pendingCount = courses.filter(c => c.status === 'pending').length;

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeTab === 'Sedang Tayang') {
      return matchesSearch && course.status === 'active';
    }
    if (activeTab === 'Draft') {
      return matchesSearch && course.status === 'draft';
    }
    if (activeTab === 'Pending') {
      return matchesSearch && course.status === 'pending';
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* HEADER ATAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#802924]">
            STUDIO ATELIER CHEF
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17] mt-0.5">
            Kelola Kelas Saya
          </h1>
        </div>
        <Link
          href="/dashboard/teacher/courses/create"
          className="bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-xs px-5 py-3 rounded-2xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer self-start"
        >
          <span>+ Buat Kursus</span>
        </Link>
      </div>

      {/* BANNER PROSES KURASI AKADEMIK */}
      <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-xs flex items-start gap-3">
        <span className="text-xl text-[#82882B]">🛡️</span>
        <div>
          <h2 className="font-editorial font-bold text-sm text-[#341D17]">Proses Kurasi Akademik</h2>
          <p className="text-xs text-[#341D17]/70 mt-0.5">
            Pemberitahuan: Setiap kursus baru yang diajukan akan ditinjau oleh Admin Atelier Yugyo sebelum dipublikasikan ke siswa. Kursus yang berstatus pending tidak dapat diedit kembali.
          </p>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
        
        {/* TABS FILTER */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('Semua')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'Semua'
                ? 'bg-[#802924] text-[#F9DDBB]'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/30'
            }`}
          >
            Semua ({totalCourses})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('Sedang Tayang')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'Sedang Tayang'
                ? 'bg-[#802924] text-[#F9DDBB]'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/30'
            }`}
          >
            Sedang Tayang ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('Draft')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'Draft'
                ? 'bg-[#802924] text-[#F9DDBB]'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/30'
            }`}
          >
            Draft ({draftCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('Pending')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'Pending'
                ? 'bg-[#802924] text-[#F9DDBB]'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/30'
            }`}
          >
            Pending ({pendingCount})
          </button>
        </div>

        {/* SEARCH INPUT */}
        <div className="w-full lg:w-72">
          <input
            type="text"
            placeholder="Cari judul kursus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-2 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:border-[#802924]"
          />
        </div>

      </div>

      {/* DAFTAR KURSUS */}
      {filteredCourses.length === 0 ? (
        <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-12 text-center text-xs text-[#341D17]/60">
          Tidak ada kursus yang ditemukan dengan filter atau kata kunci tersebut.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredCourses.map((course) => {
            const isDraft = course.status === 'draft';
            const isPending = course.status === 'pending';
            const isActive = course.status === 'active';

            const statusLabel = isActive ? 'Aktif Tayang' : isPending ? 'Menunggu Review' : 'Draft';
            const statusBadgeColor = isActive 
              ? 'bg-[#82882B]/15 text-[#82882B]' 
              : 'bg-amber-500/15 text-amber-700';

            return (
              <div key={course.id} className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl overflow-hidden shadow-xs space-y-4">
                
                <div className="relative h-44 sm:h-52 bg-[#341D17]/10 flex items-end p-4">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#341D17]/80 via-[#341D17]/20 to-transparent" />
                  
                  <div className="absolute top-4 left-4">
                    <span className="bg-[#FFFDF9]/90 text-[#802924] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                      {course.category_name || 'ATELIER MASTERCLASS'}
                    </span>
                  </div>
                  
                  <div className="absolute top-4 right-4">
                    <span className={`${statusBadgeColor} text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs backdrop-blur-md`}>
                      ● {statusLabel}
                    </span>
                  </div>

                  <div className="relative z-10 flex items-center justify-between w-full text-[#FFFDF9] text-xs font-bold">
                    <span>∞ Akses Lifetime</span>
                    <span>👥 {course.enrolled_count || 0} Siswa</span>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  <div>
                    <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17]">
                      {course.title}
                    </h2>
                    <p className="text-xs text-[#341D17]/70 mt-1 line-clamp-2">
                      {course.description || 'Deskripsi kursus belum ditambahkan.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between bg-[#F9DDBB]/30 border border-[#341D17]/10 rounded-2xl px-4 py-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#802924] text-[#F9DDBB] flex items-center justify-center font-bold text-[10px]">
                        AD
                      </span>
                      <span className="font-bold text-[#341D17]">Chef {course.instructor_name || 'Pengajar'}</span>
                    </div>
                    <span className="font-extrabold text-[#802924] uppercase text-[10px] tracking-wider">
                      Milik Anda
                    </span>
                  </div>

                  {/* KONDISI TOMBOL AKSI BERDASARKAN STATUS */}
                  {isDraft ? (
                    // 1. Status DRAFT: Muncul tombol Lanjutkan Pengeditan
                    <div className="pt-2">
                      <Link
                        href={`/dashboard/teacher/courses/${course.id}/edit`}
                        className="w-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-xs py-3 px-6 rounded-2xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>✏️ Lanjutkan Pengeditan</span>
                      </Link>
                    </div>
                  ) : isPending ? (
                    // 2. Status PENDING / DIAJUKAN: Dikunci (Tidak bisa diedit, tampil info peninjauan)
                    <div className="pt-2">
                      <div className="w-full bg-[#341D17]/5 border border-[#341D17]/15 text-[#341D17]/70 font-bold text-xs py-3 px-6 rounded-2xl text-center flex items-center justify-center gap-2 select-none">
                        <span>🔒 Sedang Ditinjau Admin (Tidak dapat diedit)</span>
                      </div>
                    </div>
                  ) : (
                    // 3. Status ACTIVE / SEDANG TAYANG: Tombol Materi, Edit, dan Hapus
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <Link
                        href={`/dashboard/teacher/contents`}
                        className="w-full sm:flex-1 bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-xs py-3 px-6 rounded-2xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>📚 Materi</span>
                      </Link>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link
                          href={`/dashboard/teacher/courses/${course.id}/edit`}
                          className="flex-1 sm:flex-initial bg-[#FFFDF9] hover:bg-[#F9DDBB]/50 border border-[#341D17]/20 text-[#341D17] font-bold text-xs py-3 px-5 rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>✏️</span>
                          <span>Edit</span>
                        </Link>
                        
                        <button
                          type="button"
                          onClick={() => alert(`Fitur hapus untuk kursus: ${course.title}`)}
                          className="bg-[#802924]/10 hover:bg-[#802924]/20 text-[#802924] p-3 rounded-2xl transition cursor-pointer"
                          title="Hapus Kursus"
                        >
                          <span>🗑️</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}