'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddContentModal({ courses, currentCourse, contentsCount, onClose }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    course_id: currentCourse?.id || courses[0]?.id || '',
    title: '',
    description: '',
    video_url: '',
    cover_image_url: '',
    status: 'published'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Menggunakan object URL lokal untuk preview/simpan cover materi
      setFormData({ ...formData, cover_image_url: URL.createObjectURL(file) });
    }
  };

  const handleSave = async (statusType) => {
    if (!formData.course_id || !formData.title) {
      setError('Kursus tujuan dan judul modul wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/teacher/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: statusType,
          order_index: contentsCount + 1
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal menyimpan modul materi.');
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      
      {/* Modal Card Utama */}
      <div className="w-full max-w-3xl bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* HEADER MODAL */}
        <div className="flex items-start justify-between border-b border-[#341D17]/10 pb-4">
          <div>
            <span className="text-[10px] font-extrabold tracking-[0.2em] uppercase text-[#802924]">
              ATELIER OPERATIONS • TAMBAH MODUL
            </span>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17] mt-0.5">
              Modul Pembelajaran Baru
            </h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] flex items-center justify-center transition shadow-sm cursor-pointer font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-700 text-xs p-4 rounded-2xl">
            {error}
          </div>
        )}

        <div className="space-y-4">
          
          {/* Pilih Kursus Tujuan */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/75">
              TERBITKAN KE KURSUS
            </label>
            <select
              name="course_id"
              value={formData.course_id}
              onChange={handleChange}
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
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/75">
              JUDUL MODUL / MATERI
            </label>
            <input
              type="text"
              name="title"
              placeholder="Contoh: Modul: Teknik Laminasi & Proofing"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:border-[#802924]"
            />
          </div>

          {/* Upload Cover Gambar Materi & Tautan Video */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Upload Cover Gambar */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/75">
                COVER GAMBAR MATERI
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
                  {formData.cover_image_url ? 'Cover terpilih' : 'Belum ada'}
                </span>
              </div>
            </div>

            {/* Input Tautan Video */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/75">
                TAUTAN VIDEO (*URL YOUTUBE)
              </label>
              <input
                type="url"
                name="video_url"
                placeholder="https://youtube.com/watch?v=..."
                value={formData.video_url}
                onChange={handleChange}
                className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:border-[#802924]"
              />
            </div>

          </div>

          {/* Rich Text Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/75">
                ATELIER RICH TEXT EDITOR
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
              rows={5}
              placeholder="Tuliskan materi pembelajaran, catatan resep, atau panduan langkah-langkah di sini..."
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:border-[#802924]"
            />
          </div>

          {/* Tombol Simpan Draf & Terbitkan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
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
    </div>
  );
}