'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import TeacherDeleteConfirmModal from '@/components/teacher/TeacherDeleteConfirmModal';
import {
  FaShieldHalved,
  FaCheck,
  FaHourglassHalf,
  FaCamera,
  FaEnvelope,
  FaCloudArrowUp,
  FaTrash,
  FaIdCard,
  FaLock,
  FaGear,
  FaGraduationCap,
  FaPlus,
  FaXmark,
  FaBreadSlice,
  FaFloppyDisk,
  FaRightFromBracket,
} from 'react-icons/fa6';

export default function InstructorProfileClient({
  user,
  initialProfile,
}) {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const baseName = user?.full_name || 'Chef Pengajar';
  const baseEmail = user?.email || '';

  // Status mutlak dari database users.status (hanya bisa diubah Admin di User Management)
  const accountStatus =
    String(user?.status || initialProfile?.account_status || 'ACTIVE').toUpperCase() ===
    'PENDING'
      ? 'PENDING'
      : 'ACTIVE';
  const isActiveStatus = accountStatus === 'ACTIVE';

  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url || '');
  const [displayNameTitle, setDisplayNameTitle] = useState(
    initialProfile?.display_name_title || `${baseName}, Master Baker Atelier`
  );
  const [whatsappNumber, setWhatsappNumber] = useState(
    initialProfile?.whatsapp_number || '+62 812-4567-8910'
  );
  const [specialties, setSpecialties] = useState(
    Array.isArray(initialProfile?.specialties) && initialProfile.specialties.length > 0
      ? initialProfile.specialties
      : ['Viennoiserie', 'Laminated Dough', 'Artisan Sourdough']
  );
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryDraft, setNewCategoryDraft] = useState('');
  const [credentialsText, setCredentialsText] = useState(
    initialProfile?.credentials_text ||
      'Sertifikasi Profesional Viennoiserie & Patisserie, Yugyo Atelier'
  );
  const [bioText, setBioText] = useState(
    initialProfile?.bio_text ||
      'Membimbing teknik pembuatan adonan, fermentasi, dan evaluasi praktik peserta di Yugyo Atelier.'
  );

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const initials = String(baseName)
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Pilih file gambar (JPG, PNG, atau WEBP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Ukuran foto profil maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(String(reader.result || ''));
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    if (!avatarUrl || saving) return;
    setDeleteConfirm({ type: 'photo' });
  };

  const handleRemoveCategory = (target) => {
    if (saving) return;
    setDeleteConfirm({ type: 'specialty', value: target });
  };

  const confirmProfileDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'photo') {
      setAvatarUrl('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else if (deleteConfirm.type === 'specialty') {
      setSpecialties((prev) => prev.filter((item) => item !== deleteConfirm.value));
    }

    setDeleteConfirm(null);
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    const cleaned = newCategoryDraft.trim();
    if (!cleaned) return;
    if (!specialties.some((s) => s.toLowerCase() === cleaned.toLowerCase())) {
      setSpecialties((prev) => [...prev, cleaned]);
    }
    setNewCategoryDraft('');
    setAddingCategory(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFeedback('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/teacher/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name_title: displayNameTitle,
          whatsapp_number: whatsappNumber,
          avatar_url: avatarUrl || null,
          specialties,
          credentials_text: credentialsText,
          bio_text: bioText,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Gagal menyimpan perubahan profil.');
      }
      setFeedback('Perubahan profil pengajar berhasil disimpan ke database.');
      router.refresh();
    } catch (err) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // lanjut ke login
    }
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#F9E8D6] text-[#341D17] py-6 sm:py-8 px-3 sm:px-6 lg:px-8">
      <form
        onSubmit={handleSaveProfile}
        className="mx-auto max-w-4xl space-y-4 sm:space-y-5"
      >
        {/* HEADER ATAS + BADGE STATUS MUTLAK (READ-ONLY) */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#802924]">
              <FaShieldHalved className="w-3.5 h-3.5 shrink-0" />
              <span>ATELIER STAFF CREDENTIALS</span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold italic text-[#341D17]">
              Profil Pengajar
            </h1>
            <p className="text-xs sm:text-sm text-[#341D17]/75">
              Kelola identitas kuliner, kredensial sertifikasi, dan kontak studio Yugyo Atelier Anda.
            </p>
          </div>

          <div
            title="Status akun diatur oleh Admin melalui User Management"
            className="inline-flex items-center self-start rounded-full border border-[#341D17]/15 bg-[#FFFDF9] p-1 shadow-2xs shrink-0 select-none"
          >
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-extrabold ${
                isActiveStatus
                  ? 'bg-[#802924] text-[#F9DDBB]'
                  : 'bg-[#F9DDBB] text-[#802924]'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isActiveStatus ? 'bg-[#82882B]' : 'bg-amber-500'
                }`}
              />
              <span>{accountStatus}</span>
            </span>
          </div>
        </div>

        {/* BANNER STATUS VERIFIKASI */}
        <div
          className={`rounded-2xl border px-4 py-3.5 flex items-start gap-3 ${
            isActiveStatus
              ? 'border-[#802924]/20 bg-[#F9DDBB]/55'
              : 'border-amber-700/25 bg-[#F9DDBB]/80'
          }`}
        >
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#802924] text-xs font-bold text-[#F9DDBB]">
            {isActiveStatus ? (
              <FaCheck className="w-3.5 h-3.5" />
            ) : (
              <FaHourglassHalf className="w-3.5 h-3.5" />
            )}
          </span>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#802924] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#F9DDBB]">
                STATUS: {accountStatus}
              </span>
              <span className="text-xs font-extrabold text-[#341D17]">
                {initialProfile?.badge_role_label || 'Atelier Master Instructor'}
              </span>
            </div>
            <p className="text-xs text-[#341D17]/80">
              {isActiveStatus
                ? `Terverifikasi resmi oleh Admin. Portofolio & jadwal kelas ${baseName} tampil di portal Yugyo Atelier.`
                : `Status akun ${baseName} masih PENDING. Perubahan status menjadi ACTIVE dilakukan oleh Admin di User Management.`}
            </p>
          </div>
        </div>

        {feedback && (
          <div className="rounded-2xl border border-[#802924]/30 bg-[#F9DDBB] px-4 py-3 text-xs font-bold text-[#341D17] flex items-center gap-2">
            <FaCheck className="w-3.5 h-3.5 text-[#82882B] shrink-0" />
            <span>{feedback}</span>
          </div>
        )}
        {errorMsg && (
          <div className="rounded-2xl border border-red-700/30 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-800">
            {errorMsg}
          </div>
        )}

        {/* KARTU AVATAR */}
        <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative self-start sm:self-center shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={baseName}
                  className="h-20 w-20 rounded-full object-cover border-2 border-[#802924]/25"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#802924] font-editorial text-2xl font-bold text-[#F9DDBB]">
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#802924] text-xs text-[#F9DDBB] shadow-sm hover:bg-[#661F1B] transition cursor-pointer"
                aria-label="Ganti foto profil"
              >
                <FaCamera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="min-w-0 space-y-1">
              <span className="inline-block rounded-md bg-[#F9DDBB] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                TEACHER / INSTRUCTOR
              </span>
              <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17] truncate">
                {baseName}
              </h2>
              <p className="text-xs sm:text-sm text-[#341D17]/75 truncate inline-flex items-center gap-1.5">
                <FaEnvelope className="w-3.5 h-3.5 text-[#341D17]/60 shrink-0" />
                <span>{baseEmail}</span>
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />

          <div className="flex items-center justify-between gap-3 border-t border-[#341D17]/10 pt-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#802924] hover:underline cursor-pointer"
            >
              <FaCloudArrowUp className="w-3.5 h-3.5 shrink-0" />
              <span>Ubah Foto Profil</span>
            </button>

            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={!avatarUrl}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:underline cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FaTrash className="w-3 h-3 shrink-0" />
              <span>Hapus</span>
            </button>
          </div>
        </div>

        {/* KARTU DATA UTAMA PENGAJAR */}
        <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FaIdCard className="w-4 h-4 text-[#802924] shrink-0" />
              <h2 className="text-sm font-extrabold text-[#341D17]">
                Data Utama Pengajar
              </h2>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/50">
              EDITABLE FIELDS
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#341D17]">
              Nama Lengkap &amp; Gelar Kuliner <span className="text-[#802924]">*</span>
            </label>
            <input
              type="text"
              data-allow-punctuation="title"
              value={displayNameTitle}
              onChange={(e) => setDisplayNameTitle(e.target.value)}
              className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2.5 text-xs sm:text-sm text-[#341D17] focus:border-[#802924] focus:outline-none"
            />
            <p className="text-[11px] text-[#341D17]/60">
              Gelar ini ditampilkan pada sertifikat kelulusan murid dan profil silabus.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-bold text-[#341D17]">
                Alamat Email Akademik
              </label>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/50">
                TERVALIDASI SSO
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[#341D17]/10 bg-[#F9E8D6]/55 px-3.5 py-2.5 text-xs sm:text-sm text-[#341D17]/75">
              <span className="truncate">{baseEmail}</span>
              <FaLock className="w-3.5 h-3.5 text-[#341D17]/55 shrink-0" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#341D17]">
              Nomor Whatsapp Studio Atelier <span className="text-[#802924]">*</span>
            </label>
            <input
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2.5 text-xs sm:text-sm text-[#341D17] focus:border-[#802924] focus:outline-none"
            />
            <p className="text-[11px] text-[#341D17]/60">
              Digunakan untuk koordinasi hands-on workshop dan asistensi lab murid.
            </p>
          </div>
        </div>

        {/* KARTU SPESIALISASI & SERTIFIKASI */}
        <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FaGear className="w-4 h-4 text-[#802924] shrink-0" />
              <h2 className="text-sm font-extrabold text-[#341D17]">
                Spesialisasi &amp; Sertifikasi
              </h2>
            </div>
            <FaGraduationCap className="w-4 h-4 text-[#341D17]/55 shrink-0" />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#341D17]">
              Spesialisasi Utama Pengajaran
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {specialties.map((spec) => (
                <span
                  key={spec}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#802924]/20 bg-[#F9DDBB]/65 px-3.5 py-1.5 text-xs font-bold text-[#341D17]"
                >
                  <span>{spec}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(spec)}
                    className="text-[#802924] hover:text-red-700 cursor-pointer"
                    aria-label={`Hapus ${spec}`}
                  >
                    <FaXmark className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}

              {!addingCategory ? (
                <button
                  type="button"
                  onClick={() => setAddingCategory(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#341D17]/30 bg-[#FFFDF9] hover:bg-[#F9DDBB]/40 px-3.5 py-1.5 text-xs font-bold text-[#341D17] transition cursor-pointer"
                >
                  <FaPlus className="w-2.5 h-2.5 shrink-0" />
                  <span>Tambah Kategori</span>
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    type="text"
                    value={newCategoryDraft}
                    onChange={(e) => setNewCategoryDraft(e.target.value)}
                    placeholder="Nama spesialisasi..."
                    className="rounded-full border border-[#341D17]/25 bg-[#FFFDF9] px-3 py-1 text-xs text-[#341D17] focus:border-[#802924] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="rounded-full bg-[#802924] px-3 py-1 text-xs font-bold text-[#F9DDBB] cursor-pointer"
                  >
                    Tambah
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingCategory(false);
                      setNewCategoryDraft('');
                    }}
                    className="rounded-full border border-[#341D17]/20 px-2.5 py-1 text-xs font-bold text-[#341D17] cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-bold text-[#341D17]">
                Kredensial &amp; Sertifikasi Lisensi
              </label>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#802924]">
                <FaCheck className="w-2.5 h-2.5 shrink-0" />
                <span>Terverifikasi Atelier</span>
              </span>
            </div>
            <input
              type="text"
              value={credentialsText}
              onChange={(e) => setCredentialsText(e.target.value)}
              className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2.5 text-xs sm:text-sm text-[#341D17] focus:border-[#802924] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#341D17]">
              Bio Singkat &amp; Pengalaman Mengajar
            </label>
            <textarea
              rows={4}
              maxLength={600}
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed text-[#341D17] focus:border-[#802924] focus:outline-none"
            />
            <div className="flex items-center justify-between text-[11px] text-[#341D17]/60">
              <span>Tampil di katalog instruktur Yugyo Atelier.</span>
              <span>{bioText.length} / 600 karakter</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-[#341D17]/15" />
          <FaBreadSlice className="w-3.5 h-3.5 text-[#802924]/70 shrink-0" />
          <div className="h-px flex-1 bg-[#341D17]/15" />
        </div>

        <div className="space-y-3">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-[#802924] hover:bg-[#661F1B] py-3.5 px-5 text-xs sm:text-sm font-extrabold text-[#F9DDBB] shadow-sm transition cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            <FaFloppyDisk className="w-4 h-4 shrink-0" />
            <span>{saving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Profil'}</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#F9DDBB]/50 py-3 px-5 text-xs sm:text-sm font-bold text-red-700 transition cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <FaRightFromBracket className="w-4 h-4 shrink-0" />
            <span>Keluar dari Akun (Logout)</span>
          </button>
        </div>
      </form>
      <TeacherDeleteConfirmModal
        open={Boolean(deleteConfirm)}
        title={deleteConfirm?.type === 'photo' ? 'Hapus Foto Profil?' : 'Hapus Spesialisasi?'}
        message={
          deleteConfirm?.type === 'photo'
            ? 'Foto profil akan dihapus dari perubahan saat ini. Perubahan diterapkan setelah profil disimpan.'
            : `Spesialisasi "${deleteConfirm?.value || ''}" akan dihapus dari perubahan saat ini. Perubahan diterapkan setelah profil disimpan.`
        }
        confirmLabel="Ya, Hapus"
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={confirmProfileDelete}
      />
    </div>
  );
}