'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CreateCourseClient({ teacher, assignedCategory }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: assignedCategory?.id || '',
    start_date: '',
    end_date: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0] || null;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setPreviewUrl('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Foto thumbnail kursus wajib diunggah sebelum menyimpan.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('description', formData.description);
      payload.append('category_id', formData.category_id || assignedCategory?.id || '');
      payload.append('start_date', formData.start_date);
      payload.append('end_date', formData.end_date);
      payload.append('image_file', selectedFile);

      const res = await fetch('/api/teacher/courses', {
        method: 'POST',
        body: payload,
      });

      const rawText = await res.text();
      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        const specificMsg =
          data?.message ||
          data?.error ||
          data?.detail ||
          rawText?.slice(0, 200) ||
          `Permintaan ditolak server dengan status ${res.status}.`;
        throw new Error(`${specificMsg} (Status ${res.status})`);
      }

      router.push('/dashboard/teacher/courses');
      router.refresh();
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat menyimpan kursus.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-[#341D17]/10 pb-4">
          <div>
            <span className="text-[10px] font-extrabold tracking-[0.2em] uppercase text-[#802924]">
              ATELIER OPERATIONS • {teacher?.full_name || 'Chef'}
            </span>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17] mt-0.5">
              Buat Kursus Baru
            </h1>
          </div>
          <Link
            href="/dashboard/teacher/courses"
            className="w-9 h-9 rounded-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] flex items-center justify-center transition shadow-sm cursor-pointer font-bold text-sm"
            title="Tutup"
          >
            ✕
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-800 text-xs font-medium p-4 rounded-2xl break-words">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/75">
              JUDUL KURSUS / MODUL
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="Contoh: Classic French Croissant & Lamination"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:border-[#802924]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/75">
              KATEGORI ATELIER (TERKUNCI SESUAI SPESIALISASI)
            </label>
            <input
              type="text"
              disabled
              value={assignedCategory?.name || 'French Patisserie & Pastry'}
              className="w-full bg-[#341D17]/5 border border-[#341D17]/15 rounded-2xl px-4 py-3 text-xs font-bold text-[#341D17]/80 cursor-not-allowed"
            />
            <input type="hidden" name="category_id" value={assignedCategory?.id || ''} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/75">
                TANGGAL MULAI
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:border-[#802924]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/75">
                TANGGAL SELESAI
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:border-[#802924]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/75">
              FOTO THUMBNAIL KURSUS (WAJIB)
            </label>
            <div className="flex items-center gap-3">
              <label className="bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition">
                <span>Pilih File Gambar</span>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-[#341D17]/60 truncate">
                {selectedFile ? selectedFile.name : 'Belum ada file dipilih'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#341D17]/75">
              DESKRIPSI &amp; SILABUS MODUL
            </label>
            <textarea
              name="description"
              rows={3}
              required
              placeholder="Tuliskan ringkasan materi, teknik khusus, atau silabus kursus di sini..."
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:border-[#802924]"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-xs py-4 px-6 rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Menyimpan & Mengajukan...' : 'Simpan & Ajukan Kursus (Draft / Review)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}