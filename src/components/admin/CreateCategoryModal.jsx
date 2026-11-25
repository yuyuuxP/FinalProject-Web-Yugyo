'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaStar, FaXmark, FaPlus } from 'react-icons/fa6';

export default function CreateCategoryModal({
  teachers = [],
  onClose,
  onCreated,
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [iconFile, setIconFile] = useState(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const safeTeachers = (Array.isArray(teachers) ? teachers : []).filter(
    (t) => String(t?.status || '').toLowerCase() !== 'pending'
  );
  const availableTeachers = safeTeachers.filter((t) => !t?.is_assigned);

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
      return;
    }
    router.push('/dashboard/admin/categories');
  };

  const handleSelectTeacher = (teacher) => {
    if (!teacher || teacher.is_assigned || submitting) return;
    setErrorMsg('');
    setSelectedTeacherId(String(teacher.id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Nama kategori wajib diisi.');
      return;
    }

    if (!iconFile) {
      setErrorMsg('Foto profil atau ikon kategori wajib diunggah.');
      return;
    }

    if (!selectedTeacherId) {
      setErrorMsg(
        'Silakan pilih guru yang bertanggung jawab atas kategori ini terlebih dahulu.'
      );
      return;
    }

    const chosenTeacher = safeTeachers.find(
      (t) => String(t.id) === String(selectedTeacherId)
    );
    if (!chosenTeacher || chosenTeacher.is_assigned) {
      setErrorMsg(
        'Guru yang dipilih tidak tersedia atau sudah bertanggung jawab pada kategori lain.'
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('name', trimmedName);
      formData.append('instructor_id', String(selectedTeacherId));
      formData.append('description', description.trim());
      formData.append('icon', iconFile);

      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        setErrorMsg(data?.message || 'Gagal menyimpan kategori baru.');
        setSubmitting(false);
        return;
      }

      if (typeof onCreated === 'function') {
        onCreated(data.category);
      }

      router.push('/dashboard/admin/categories');
      router.refresh();
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan saat menyimpan kategori.');
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2A1712]/60 backdrop-blur-[1px] p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#FFFDF9] border border-[#341D17]/15 p-6 sm:p-7 text-[#341D17] shadow-2xl space-y-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
              <FaStar className="w-2.5 h-2.5 shrink-0" />
              <span>ATELIER TAXONOMY &bull; TAMBAH</span>
            </span>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17] mt-0.5">
              Buat Kategori Baru
            </h1>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup modal buat kategori"
            className="rounded-full bg-[#802924] hover:bg-[#661F1B] w-7 h-7 flex items-center justify-center text-sm font-bold text-[#FFFDF9] transition cursor-pointer"
          >
            <FaXmark className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/70">
              NAMA KATEGORI
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Contoh: French Viennoiserie"
              className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2.5 text-xs sm:text-sm text-[#341D17] placeholder:text-[#341D17]/35 focus:border-[#802924] focus:outline-none"
            />
          </div>

          {/* PILIHAN GURU BERTANGGUNG JAWAB (TANPA STATUS PENDING, GURU YANG SUDAH MEMEGANG KATEGORI ABU-ABU & DISABLED) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/70">
                GURU PENANGGUNG JAWAB KATEGORI (WAJIB)
              </label>
              <span className="text-[11px] font-semibold text-[#802924]">
                {availableTeachers.length} guru tersedia
              </span>
            </div>

            {safeTeachers.length === 0 ? (
              <div className="rounded-xl border border-[#341D17]/12 bg-[#FAF6F0] px-3.5 py-3 text-xs text-[#341D17]/60">
                Belum ada guru aktif terdaftar.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                {safeTeachers.map((teacher) => {
                  const isDisabled = Boolean(teacher?.is_assigned);
                  const isSelected =
                    !isDisabled &&
                    String(selectedTeacherId) === String(teacher.id);

                  return (
                    <button
                      key={teacher.id}
                      type="button"
                      disabled={isDisabled}
                      aria-disabled={isDisabled}
                      onClick={() => handleSelectTeacher(teacher)}
                      className={`w-full text-left rounded-xl border px-3.5 py-2.5 transition flex items-center justify-between gap-2 ${
                        isDisabled
                          ? 'border-[#341D17]/10 bg-[#ECEAE6] text-[#8E8984] cursor-not-allowed opacity-75 select-none pointer-events-none'
                          : isSelected
                          ? 'border-[#802924] bg-[#F9DDBB]/45 text-[#341D17] cursor-pointer ring-1 ring-[#802924]'
                          : 'border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#FAF6F0] text-[#341D17] cursor-pointer'
                      }`}
                    >
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold truncate ${
                            isDisabled ? 'text-[#8E8984]' : 'text-[#341D17]'
                          }`}
                        >
                          {teacher.full_name}
                        </p>
                        <p
                          className={`text-[10px] truncate ${
                            isDisabled
                              ? 'text-[#9E9994]'
                              : 'text-[#341D17]/60'
                          }`}
                        >
                          {isDisabled
                            ? `Sudah memegang: ${teacher.assigned_category_name}`
                            : teacher.specialty || 'Instruktur Atelier'}
                        </p>
                      </div>

                      {!isDisabled && (
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isSelected
                              ? 'bg-[#802924] text-[#FFFDF9]'
                              : 'bg-[#FAF6F0] text-[#341D17]/70 border border-[#341D17]/12'
                          }`}
                        >
                          {isSelected ? 'Dipilih' : 'Pilih'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/70">
              FOTO PROFIL / IKON KATEGORI (WAJIB)
            </label>
            <div className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3 py-2 flex items-center gap-3 text-xs">
              <label className="rounded-lg border border-[#341D17]/20 bg-[#F3F1ED] hover:bg-[#E7E4DE] px-3 py-1.5 font-semibold text-[#341D17] cursor-pointer shrink-0">
                Choose File
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  aria-required="true"
                  onChange={(e) => {
                    setIconFile(e.target.files?.[0] || null);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="hidden"
                />
              </label>
              <span className="text-[#341D17]/65 truncate">
                {iconFile ? iconFile.name : 'No file chosen'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/70">
              DESKRIPSI TAKSONOMI
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan penjelasan singkat mengenai taksonomi kategori ini..."
              className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] p-3 text-xs sm:text-sm text-[#341D17] placeholder:text-[#341D17]/35 focus:border-[#802924] focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-[#802924]/30 bg-[#802924]/10 px-3.5 py-2.5 text-xs font-bold text-[#802924]">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || availableTeachers.length === 0}
            className="w-full rounded-xl bg-[#802924] hover:bg-[#661F1B] py-3 px-4 text-xs sm:text-sm font-bold text-[#FFFDF9] transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              'Menyimpan...'
            ) : (
              <>
                <FaPlus className="w-3.5 h-3.5 shrink-0" />
                <span>Simpan Kategori Baru</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}