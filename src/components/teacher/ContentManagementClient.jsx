'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ContentManagementClient({ courses, currentCourse, contents }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Semua'); // 'Semua', 'Draft'
  
  const [newContent, setNewContent] = useState({
    course_id: currentCourse?.id || '',
    title: '',
    description: '',
    video_url: '',
    cover_image_url: '',
    status: 'published'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    router.push(`/dashboard/teacher/contents?courseId=${courseId}`);
  };

  const handleInputChange = (e) => {
    setNewContent({ ...newContent, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewContent({ ...newContent, cover_image_url: URL.createObjectURL(file) });
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewContent({ ...newContent, video_url: URL.createObjectURL(file) });
    }
  };

  const handleSave = async (statusType) => {
    const targetCourseId = newContent.course_id || currentCourse?.id;
    if (!targetCourseId) {
      alert('Silakan pilih kursus terlebih dahulu.');
      return;
    }
    if (!newContent.title) {
      alert('Judul modul / materi wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/teacher/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newContent,
          course_id: targetCourseId,
          status: statusType,
          order_index: contents.length + 1
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal menyimpan modul materi.');
      }

      window.location.reload();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDelete = async (contentId, contentTitle) => {
    const confirmed = window.confirm(`Hapus materi "${contentTitle}" dari silabus?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/teacher/contents/${contentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus materi.');
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const draftCount = contents.filter(c => c.status === 'draft').length;

  const filteredContents = contents.filter(item => {
    if (activeTab === 'Draft') return item.status === 'draft';
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* HEADER ATAS: PEMILIH KURSUS & SILABUS AKTIF */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-6 shadow-xs">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="bg-[#802924] text-[#F9DDBB] text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider">
              SILABUS KURSUS AKTIF
            </span>
            <span className="text-xs font-bold text-[#341D17]/60">
              ID: #{currentCourse?.id ? `CRS-0${currentCourse.id}` : 'CRS-000'}
            </span>
          </div>

          {courses.length > 0 ? (
            <select
              value={currentCourse?.id || ''}
              onChange={handleCourseChange}
              className="w-full max-w-xl font-editorial text-xl sm:text-2xl font-bold text-[#341D17] bg-[#F9DDBB]/20 border border-[#341D17]/20 rounded-2xl px-4 py-2.5 focus:outline-none focus:border-[#802924] cursor-pointer"
            >
              {courses.map((crs) => (
                <option key={crs.id} value={crs.id}>
                  {crs.title} ({crs.status === 'active' ? 'Aktif' : crs.status})
                </option>
              ))}
            </select>
          ) : (
            <h1 className="font-editorial text-2xl font-bold text-[#341D17]">
              Belum ada kursus yang diampu.
            </h1>
          )}
        </div>

        <div className="text-xs font-bold text-[#341D17] bg-[#F9DDBB]/30 px-4 py-3 rounded-2xl border border-[#341D17]/10 self-start md:self-auto">
          Author: {currentCourse?.instructor_name || 'Chef Pengajar'}
        </div>
      </div>

      {currentCourse && (
        <>
          {/* STATISTIK & TOMBOL TAMBAH MATERI */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('Semua')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'Semua' ? 'bg-[#802924] text-[#F9DDBB]' : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15'
                }`}
              >
                Total: {contents.length} Modul
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('Draft')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'Draft' ? 'bg-[#802924] text-[#F9DDBB]' : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15'
                }`}
              >
                {draftCount} Draft Baru
              </button>
            </div>

            <a
              href="#editor-materi"
              className="bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-xs px-5 py-3 rounded-2xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <span>+ Tambah Materi</span>
            </a>
          </div>

          {/* STRUKTUR & URUTAN MATERI */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-editorial text-xl font-bold text-[#341D17]">Struktur &amp; Urutan Materi</h2>
              <span className="text-xs font-bold text-[#341D17]/60">Tahan &amp; Geser untuk Reorder</span>
            </div>

            {filteredContents.length === 0 ? (
              <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-10 text-center text-xs text-[#341D17]/60">
                Belum ada modul materi untuk kursus &quot;{currentCourse.title}&quot;. Silakan tambahkan melalui editor di bawah.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredContents.map((item, index) => (
                  <div key={item.id || index} className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {item.cover_image_url && (
                        <img src={item.cover_image_url} alt="Cover" className="w-12 h-12 rounded-xl object-cover border border-[#341D17]/15" />
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-[#802924]/10 text-[#802924] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                            #{index + 1}
                          </span>
                          <span className="bg-[#82882B]/15 text-[#82882B] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                            Modul Manual Atelier
                          </span>
                        </div>
                        <h3 className="font-editorial font-bold text-sm sm:text-base text-[#341D17]">
                          {item.title}
                        </h3>
                        <p className="text-xs text-[#341D17]/70 line-clamp-1">
                          {item.description || 'Deskripsi materi pelatihan teknis atelier.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#341D17]/10">
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.title)}
                        className="bg-[#802924]/10 hover:bg-[#802924]/20 text-[#802924] font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* EDITOR MATERI AKTIF (DENGAN TOMBOL UPLOAD VIDEO DISAMPING INPUT TAUTAN) */}
          <div id="editor-materi" className="bg-[#FFFDF9] border border-[#341D17]/20 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#341D17]/10 pb-4">
              <div>
                <span className="text-[10px] font-extrabold tracking-widest uppercase text-[#802924]">
                  EDITOR MATERI AKTIF
                </span>
                <h2 className="font-editorial text-xl font-bold text-[#341D17] mt-0.5">
                  Modul Pembelajaran Baru
                </h2>
              </div>
              <span className="text-xs font-extrabold text-[#802924] bg-[#802924]/10 px-3 py-1.5 rounded-xl">
                Order Index # {contents.length + 1}
              </span>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-700 text-xs p-4 rounded-2xl">
                {error}
              </div>
            )}

            <div className="space-y-4">
              
              {/* Dropdown Kursus Tujuan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#341D17]/80">
                  Terbitkan ke Kursus
                </label>
                <select
                  name="course_id"
                  value={newContent.course_id || currentCourse.id}
                  onChange={handleInputChange}
                  className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] font-bold focus:outline-none focus:border-[#802924] cursor-pointer"
                >
                  {courses.map((crs) => (
                    <option key={crs.id} value={crs.id}>
                      {crs.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Judul Modul */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#341D17]/80">
                  Judul Modul / Materi
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="Contoh: Modul: Teknik Laminasi & Proofing"
                  value={newContent.title}
                  onChange={handleInputChange}
                  className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:border-[#802924]"
                />
              </div>

              {/* Cover Gambar & Tautan Video dengan Tombol Upload Video di Sampingnya */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Cover Gambar Materi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#341D17]/80">
                    Cover Gambar Materi (Dijadikan Sampul)
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition">
                      <span>Pilih Gambar</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-[#341D17]/60 truncate">
                      {newContent.cover_image_url ? 'Cover terpilih' : 'Belum ada'}
                    </span>
                  </div>
                </div>

                {/* Tautan Video & Tombol Upload Video di Sampingnya */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#341D17]/80">
                    Tautan Video (*URL) Atau Upload File
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      name="video_url"
                      placeholder="https://youtube.com/..."
                      value={newContent.video_url.startsWith('blob:') ? '[Video Lokal Terpilih]' : newContent.video_url}
                      onChange={handleInputChange}
                      className="flex-1 bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:border-[#802924]"
                    />
                    <label className="bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-xs py-3 px-4 rounded-2xl cursor-pointer transition whitespace-nowrap shadow-xs">
                      <span>Upload Video</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

              </div>

              {/* ATELIER RICH TEXT EDITOR */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#341D17]/80">
                    Atelier Rich Text Editor
                  </label>
                  <span className="text-[10px] font-extrabold text-[#82882B]">Baker&apos;s Formula Tools Ready</span>
                </div>

                <div className="flex flex-wrap items-center gap-1 bg-[#F9DDBB]/30 border border-[#341D17]/15 rounded-2xl p-2 text-xs font-bold text-[#341D17]">
                  <button type="button" className="px-3 py-1.5 hover:bg-[#FFFDF9] rounded-xl transition">B</button>
                  <button type="button" className="px-3 py-1.5 hover:bg-[#FFFDF9] rounded-xl transition italic">I</button>
                  <button type="button" className="px-3 py-1.5 hover:bg-[#FFFDF9] rounded-xl transition underline">U</button>
                  <span className="text-[#341D17]/20">|</span>
                  <button type="button" className="px-3 py-1.5 hover:bg-[#FFFDF9] rounded-xl transition">H1</button>
                  <button type="button" className="px-3 py-1.5 hover:bg-[#FFFDF9] rounded-xl transition">H2</button>
                  <span className="text-[#341D17]/20">|</span>
                  <button type="button" className="bg-[#FFFDF9] border border-[#341D17]/15 px-3 py-1.5 rounded-xl text-[10px] font-extrabold text-[#802924]">％ Sisipkan Baker&apos;s %</button>
                  <button type="button" className="bg-[#FFFDF9] border border-[#341D17]/15 px-3 py-1.5 rounded-xl text-[10px] font-extrabold">Foto Step</button>
                  <button type="button" className="bg-[#FFFDF9] border border-[#341D17]/15 px-3 py-1.5 rounded-xl text-[10px] font-extrabold">Embed Video</button>
                </div>

                <textarea
                  name="description"
                  rows={6}
                  placeholder="Tuliskan materi pembelajaran, catatan resep, atau panduan langkah-langkah di sini..."
                  value={newContent.description}
                  onChange={handleInputChange}
                  className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:border-[#802924]"
                />
              </div>

              {/* TOMBOL AKSI: SIMPAN DRAF & TERBITKAN MODUL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#341D17]/10">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSave('draft')}
                  className="bg-[#F9DDBB]/40 hover:bg-[#F9DDBB]/70 text-[#341D17] font-bold text-xs py-4 px-6 rounded-2xl transition cursor-pointer text-center"
                >
                  Simpan Draf
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSave('published')}
                  className="bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-xs py-4 px-6 rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{loading ? 'Menyimpan...' : 'Terbitkan Modul'}</span>
                </button>
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  );
}