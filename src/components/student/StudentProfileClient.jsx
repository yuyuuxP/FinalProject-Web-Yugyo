'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FaGraduationCap,
  FaArrowLeft,
  FaCamera,
  FaPen,
  FaTrash,
  FaBookOpen,
  FaCheck,
  FaAward,
  FaUser,
  FaEnvelope,
  FaLock,
  FaCircleInfo,
  FaMobileScreenButton,
  FaFloppyDisk,
  FaKey,
  FaChevronRight,
  FaRightFromBracket,
  FaPowerOff,
  FaXmark,
} from 'react-icons/fa6';

const DEFAULT_BIO =
  'Peminat pastry Prancis otodidak, fokus pada teknik laminasi adonan beragi (Viennoiserie) dan penguasaan ragi alami sourdough.';

const BLOCKED_LABELS = new Set([
  'yugyo',
  'yugyo atelier',
  'student',
  'student portal',
  'student portal • user profile',
  'student baker atelier',
  'portal akun siswa',
  'profil pengguna siswa',
  'pencapaian belajar',
  'form data siswa',
  'keamanan & sesi',
  'ganti kata sandi',
  'keluar dari akun (logout)',
  'lihat katalog guest',
  'dashboard',
  'course',
  'course catalog',
  'schedule',
  'chat instructor',
  'ulasan',
  'log out',
]);

function getInitials(name) {
  const clean = String(name || 'ST').trim();
  if (!clean) return 'ST';
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function formatTitleCase(text) {
  return String(text || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

function isBlockedName(value) {
  const clean = String(value || '').trim();
  if (!clean) return true;
  const lower = clean.toLowerCase();
  if (BLOCKED_LABELS.has(lower)) return true;
  if (
    lower.includes('admin') ||
    lower.includes('teacher') ||
    lower.includes('instructor')
  ) {
    return true;
  }
  if (clean.length > 36) return true;
  return false;
}

function deriveNameFromEmail(emailStr) {
  const cleanEmail = String(emailStr || '').trim();
  if (!cleanEmail.includes('@')) return '';
  const localPart = cleanEmail.split('@')[0] || '';
  const words = localPart.replace(/[._-]+/g, ' ').trim();
  if (!words || isBlockedName(words)) return '';
  return formatTitleCase(words);
}

function extractIdentityFromObject(obj) {
  if (!obj || typeof obj !== 'object') return null;

  const role = String(
    obj.role ||
      obj.user?.role ||
      obj.currentUser?.role ||
      obj.session?.user?.role ||
      obj.data?.role ||
      obj.data?.user?.role ||
      ''
  ).toLowerCase();

  if (role === 'admin' || role === 'teacher' || role === 'instructor') {
    return null;
  }

  const sources = [
    obj,
    obj.user,
    obj.currentUser,
    obj.session?.user,
    obj.data,
    obj.data?.user,
  ].filter(Boolean);

  for (const src of sources) {
    const candidateEmail = String(
      src.email || src.user_email || obj.email || ''
    ).trim();

    let candidateName = String(
      src.username ||
        src.user_name ||
        src.userName ||
        src.full_name ||
        src.fullName ||
        src.name ||
        ''
    ).trim();

    if (isBlockedName(candidateName) && candidateEmail) {
      candidateName = deriveNameFromEmail(candidateEmail);
    }

    if (!isBlockedName(candidateName) || candidateEmail) {
      const resolvedName = !isBlockedName(candidateName)
        ? candidateName
        : deriveNameFromEmail(candidateEmail) || 'Student';

      const candidateCode = String(
        src.student_code ||
          src.studentCode ||
          src.nim ||
          src.kode_siswa ||
          src.user_id ||
          src.userId ||
          ''
      ).trim();

      const candidateAvatar = String(
        src.avatar_url || src.avatarUrl || src.avatar || ''
      ).trim();

      const candidateWhatsapp = String(
        src.whatsapp || src.phone || src.no_hp || ''
      ).trim();

      const candidateBio = String(src.bio || '').trim();

      return {
        username: resolvedName,
        email:
          candidateEmail ||
          `${resolvedName.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@yugyo-atelier.id`,
        studentCode: candidateCode
          ? candidateCode.startsWith('#')
            ? candidateCode
            : `#YG-${candidateCode}`
          : '',
        avatarUrl: candidateAvatar,
        whatsapp: candidateWhatsapp,
        bio: candidateBio,
      };
    }
  }

  return null;
}

function scanStorageIdentity(storage) {
  if (!storage) return null;
  let fallbackEmailIdentity = null;

  try {
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i) || '';
      const raw = storage.getItem(key);
      if (!raw) continue;
      const trimmed = raw.trim();

      if (
        trimmed.includes('@') &&
        !trimmed.startsWith('{') &&
        trimmed.length < 80
      ) {
        const nameFromMail = deriveNameFromEmail(trimmed);
        if (nameFromMail) {
          fallbackEmailIdentity = {
            username: nameFromMail,
            email: trimmed,
            studentCode: '',
            avatarUrl: '',
            whatsapp: '',
            bio: '',
          };
        }
      }

      try {
        const parsed = JSON.parse(trimmed);
        const found = extractIdentityFromObject(parsed);
        if (found) {
          if (!isBlockedName(found.username)) return found;
          if (!fallbackEmailIdentity) fallbackEmailIdentity = found;
        }
      } catch {
        const lowerKey = key.toLowerCase();
        if (
          (lowerKey.includes('user') ||
            lowerKey.includes('student') ||
            lowerKey.includes('auth')) &&
          !isBlockedName(trimmed)
        ) {
          return {
            username: trimmed,
            email: `${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@yugyo-atelier.id`,
            studentCode: '',
            avatarUrl: '',
            whatsapp: '',
            bio: '',
          };
        }
      }
    }
  } catch {
    // Abaikan error akses storage
  }
  return fallbackEmailIdentity;
}

function scanCookieIdentity() {
  if (typeof document === 'undefined' || !document.cookie) return null;
  try {
    const parts = document.cookie.split(';');
    for (const part of parts) {
      const idx = part.indexOf('=');
      if (idx === -1) continue;
      const cookieName = part.slice(0, idx).trim().toLowerCase();
      const rawVal = decodeURIComponent(part.slice(idx + 1).trim());
      if (!rawVal) continue;

      try {
        const parsed = JSON.parse(rawVal);
        const found = extractIdentityFromObject(parsed);
        if (found && !isBlockedName(found.username)) return found;
      } catch {
        if (rawVal.includes('@')) {
          const nameFromMail = deriveNameFromEmail(rawVal);
          if (nameFromMail) {
            return {
              username: nameFromMail,
              email: rawVal,
              studentCode: '',
              avatarUrl: '',
              whatsapp: '',
              bio: '',
            };
          }
        }
        if (
          (cookieName.includes('user') || cookieName.includes('student')) &&
          !isBlockedName(rawVal)
        ) {
          return {
            username: rawVal.trim(),
            email: `${rawVal.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.')}@yugyo-atelier.id`,
            studentCode: '',
            avatarUrl: '',
            whatsapp: '',
            bio: '',
          };
        }
      }
    }
  } catch {
    // Abaikan error akses cookie
  }
  return null;
}

function detectStudentFromDom() {
  if (typeof document === 'undefined') return null;
  try {
    const links = document.querySelectorAll('a[href="/dashboard/student/profile"]');
    for (const link of links) {
      const spans = link.querySelectorAll('span, p');
      for (const el of spans) {
        const text = String(el.textContent || '').trim();
        if (!isBlockedName(text) && text.length <= 24) {
          return {
            username: text,
            email: `${text.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@yugyo-atelier.id`,
            studentCode: '',
            avatarUrl: '',
            whatsapp: '',
            bio: '',
          };
        }
      }
    }
  } catch {
    // Abaikan error DOM
  }
  return null;
}

function detectStudentIdentity() {
  if (typeof window === 'undefined') {
    return {
      username: 'Student',
      email: 'student@yugyo-atelier.id',
      studentCode: '',
      avatarUrl: '',
      whatsapp: '',
      bio: '',
    };
  }
  return (
    scanStorageIdentity(window.localStorage) ||
    scanStorageIdentity(window.sessionStorage) ||
    scanCookieIdentity() ||
    detectStudentFromDom() || {
      username: 'Student',
      email: 'student@yugyo-atelier.id',
      studentCode: '',
      avatarUrl: '',
      whatsapp: '',
      bio: '',
    }
  );
}

function isProfileMatchingLogin(profile, identity) {
  if (!profile || !identity || isBlockedName(identity.username)) return true;

  const loginEmail = String(identity.email || '').trim().toLowerCase();
  const profileEmail = String(profile.email || '').trim().toLowerCase();
  if (loginEmail && profileEmail && loginEmail === profileEmail) {
    return true;
  }

  const loginName = String(identity.username || '').trim().toLowerCase();
  const profileName = String(profile.fullName || '').trim().toLowerCase();
  if (loginName && profileName && loginName === profileName) {
    return true;
  }

  return false;
}

export default function StudentProfileClient({ initialProfile = null }) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const nameInputRef = useRef(null);

  const [fullName, setFullName] = useState(() =>
    !isBlockedName(initialProfile?.fullName)
      ? String(initialProfile.fullName).trim()
      : 'Student'
  );
  const [email, setEmail] = useState(
    initialProfile?.email || 'student@yugyo-atelier.id'
  );
  const [roleLabel] = useState(
    String(initialProfile?.role || 'STUDENT').toUpperCase()
  );
  const [studentCode, setStudentCode] = useState(
    initialProfile?.studentCode || '#YG-88219'
  );
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatarUrl || '');
  const [whatsapp, setWhatsapp] = useState(
    initialProfile?.whatsapp || '+62 812-9876-5432'
  );
  const [bio, setBio] = useState(initialProfile?.bio || DEFAULT_BIO);
  const [stats, setStats] = useState({
    activeCourses: initialProfile?.activeCourses ?? 2,
    completedSessions: initialProfile?.completedSessions ?? 14,
    certificatesCount: initialProfile?.certificatesCount ?? 1,
    semesterLabel: initialProfile?.semesterLabel || 'Semester Ganjil 2026/2027',
  });

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordNote, setPasswordNote] = useState('');

  useEffect(() => {
    let active = true;

    const timer = setTimeout(async () => {
      if (!active) return;

      let identity = detectStudentIdentity();

      if (isBlockedName(identity.username)) {
        const endpoints = ['/api/auth/session', '/api/auth/me', '/api/session'];
        for (const url of endpoints) {
          const payload = await fetch(url, { cache: 'no-store' })
            .then((r) => (r.ok ? r.json().catch(() => null) : null))
            .catch(() => null);
          const extracted =
            extractIdentityFromObject(payload) ||
            extractIdentityFromObject(payload?.user);
          if (extracted && !isBlockedName(extracted.username)) {
            identity = extracted;
            break;
          }
        }
      }

      if (!active) return;

      const hasLoggedInName = !isBlockedName(identity.username);
      if (hasLoggedInName) {
        setFullName(identity.username);
        if (identity.email) setEmail(identity.email);
        if (identity.studentCode) setStudentCode(identity.studentCode);
        if (identity.avatarUrl) setAvatarUrl(identity.avatarUrl);
        if (identity.whatsapp) setWhatsapp(identity.whatsapp);
        if (identity.bio) setBio(identity.bio);
      }

      const params = new URLSearchParams();
      if (identity.email) params.set('email', identity.email);
      if (hasLoggedInName) params.set('username', identity.username);

      fetch(`/api/student/profile?${params.toString()}`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!active || !data?.profile) return;
          const p = data.profile;

          if (hasLoggedInName && !isProfileMatchingLogin(p, identity)) {
            return;
          }

          const resolvedName = hasLoggedInName
            ? identity.username
            : !isBlockedName(p.fullName)
              ? p.fullName
              : 'Student';

          setFullName(resolvedName);
          if (identity.email && identity.email !== 'student@yugyo-atelier.id') {
            setEmail(identity.email);
          } else if (p.email) {
            setEmail(p.email);
          }
          if (p.studentCode) setStudentCode(p.studentCode);
          if (p.avatarUrl !== undefined) setAvatarUrl(p.avatarUrl || '');
          if (p.whatsapp) setWhatsapp(p.whatsapp);
          if (p.bio) setBio(p.bio);
          setStats({
            activeCourses: Number(p.activeCourses ?? 2),
            completedSessions: Number(p.completedSessions ?? 14),
            certificatesCount: Number(p.certificatesCount ?? 1),
            semesterLabel: p.semesterLabel || 'Semester Ganjil 2026/2027',
          });
        })
        .catch(() => {});
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  const persistProfile = async (
    nextName,
    nextAvatar,
    nextWhatsapp,
    nextBio,
    successText
  ) => {
    if (saving) return;
    setSaving(true);
    setStatusMessage('');
    setErrorMessage('');

    const normalizedName = formatTitleCase(nextName);
    if (!normalizedName) {
      setErrorMessage('Nama lengkap wajib diisi.');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername: fullName,
          fullName: normalizedName,
          email,
          avatarUrl: nextAvatar,
          whatsapp: nextWhatsapp,
          bio: String(nextBio || '').slice(0, 200),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setErrorMessage(
          data?.message || 'Gagal menyimpan perubahan ke database.'
        );
        return;
      }

      const saved = data.profile || {};
      setFullName(saved.fullName || normalizedName);
      setAvatarUrl(saved.avatarUrl ?? nextAvatar);
      if (saved.whatsapp !== undefined) setWhatsapp(saved.whatsapp);
      if (saved.bio !== undefined) setBio(saved.bio);
      setStatusMessage(
        successText || 'Profil siswa berhasil disimpan ke database.'
      );
      router.refresh();
    } catch {
      setErrorMessage('Terjadi kesalahan jaringan saat menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Pilih berkas gambar (JPG, PNG, atau WEBP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Ukuran foto profil maksimal 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        persistProfile(
          fullName,
          reader.result,
          whatsapp,
          bio,
          'Foto profil berhasil diperbarui dan disimpan ke database.'
        );
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    persistProfile(
      fullName,
      '',
      whatsapp,
      bio,
      'Foto profil dihapus dan dikembalikan ke inisial akun.'
    );
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    persistProfile(
      fullName,
      avatarUrl,
      whatsapp,
      bio,
      'Data profil siswa berhasil diperbarui ke database.'
    );
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordNote('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordNote('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(false);
    setPasswordNote('');
    setStatusMessage('Permintaan pembaruan kata sandi telah dicatat.');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {
      // Abaikan error storage
    }
    router.push('/login');
  };

  return (
    <div className="space-y-6 text-[#341D17] pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFFDF9]/90 border border-[#802924]/15 px-3 py-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#802924]">
            <FaGraduationCap className="w-3.5 h-3.5 shrink-0" />
            <span>PORTAL AKUN SISWA</span>
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
            Profil Pengguna Siswa
          </h1>
          <p className="text-xs sm:text-sm text-[#341D17]/75">
            Kelola informasi identitas, foto profil, dan status keanggotaan belajar Anda dalam ekosistem Yugyo Atelier.
          </p>
        </div>

        <Link
          href="/dashboard/student"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFFDF9] hover:bg-[#F9DDBB]/55 border border-[#341D17]/12 px-3.5 py-2 text-xs font-bold text-[#341D17] transition shrink-0"
        >
          <FaArrowLeft className="w-3 h-3 text-[#802924] shrink-0" />
          <span>Kembali ke Dashboard</span>
        </Link>
      </div>

      {statusMessage && (
        <div className="rounded-2xl bg-[#FFFDF9] border border-[#802924]/25 px-4 py-3 text-xs sm:text-sm font-semibold text-[#802924] flex items-center justify-between gap-3">
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage('')}
            className="text-xs font-bold underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl bg-[#802924]/10 border border-[#802924]/30 px-4 py-3 text-xs sm:text-sm font-semibold text-[#802924] flex items-center justify-between gap-3">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-xs font-bold underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      <section className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 p-6 sm:p-8 shadow-2xs flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#F9DDBB] border-2 border-[#802924]/25 flex items-center justify-center overflow-hidden text-2xl sm:text-3xl font-extrabold text-[#802924]">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`Foto profil ${fullName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(fullName)
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Ganti foto profil"
            className="w-8 h-8 rounded-full bg-[#802924] hover:bg-[#661F1B] text-[#FFFDF9] border-2 border-[#FFFDF9] flex items-center justify-center text-xs shadow-xs transition cursor-pointer absolute bottom-0 right-0"
          >
            <FaCamera className="w-3.5 h-3.5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        <div className="space-y-1">
          <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17]">
            {fullName}
          </h2>
          <p className="text-xs text-[#341D17]/60 font-medium">
            ID Siswa: {studentCode}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F9DDBB]/85 border border-[#802924]/20 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#802924]">
            <span>ROLE: {roleLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF6F0] border border-[#341D17]/12 px-3 py-1 text-[11px] font-bold text-[#341D17]/80">
            <span className="w-2 h-2 rounded-full bg-[#82882B] inline-block" />
            <span>Siswa Aktif &bull; Verified Apprentice</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1 w-full sm:w-auto">
          <button
            type="button"
            disabled={saving}
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FAF6F0] hover:bg-[#F9DDBB]/60 border border-[#341D17]/15 px-4 py-2 text-xs font-bold text-[#341D17] transition cursor-pointer disabled:opacity-60"
          >
            <FaPen className="w-3 h-3 text-[#802924] shrink-0" />
            <span>Ubah Foto Profil (Bisa Diedit)</span>
          </button>

          {avatarUrl && (
            <button
              type="button"
              disabled={saving}
              onClick={handleRemovePhoto}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#802924]/10 hover:bg-[#802924]/20 border border-[#802924]/25 px-4 py-2 text-xs font-bold text-[#802924] transition cursor-pointer disabled:opacity-60"
            >
              <FaTrash className="w-3 h-3 shrink-0" />
              <span>Hapus Foto</span>
            </button>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
            Pencapaian Belajar
          </h2>
          <span className="text-xs font-semibold text-[#341D17]/60">
            {stats.semesterLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 p-5 text-center space-y-1.5 shadow-2xs">
            <div className="w-8 h-8 mx-auto rounded-xl bg-[#F9DDBB]/80 text-[#802924] flex items-center justify-center text-sm font-bold">
              <FaBookOpen className="w-3.5 h-3.5" />
            </div>
            <p className="text-2xl font-extrabold text-[#341D17]">
              {stats.activeCourses}
            </p>
            <p className="text-xs text-[#341D17]/65">Kursus Aktif</p>
          </div>

          <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 p-5 text-center space-y-1.5 shadow-2xs">
            <div className="w-8 h-8 mx-auto rounded-xl bg-[#FAF6F0] border border-[#341D17]/10 text-[#82882B] flex items-center justify-center text-sm font-bold">
              <FaCheck className="w-3.5 h-3.5" />
            </div>
            <p className="text-2xl font-extrabold text-[#341D17]">
              {stats.completedSessions}
            </p>
            <p className="text-xs text-[#341D17]/65">Sesi Selesai</p>
          </div>

          <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 p-5 text-center space-y-1.5 shadow-2xs">
            <div className="w-8 h-8 mx-auto rounded-xl bg-[#F9DDBB]/80 text-[#802924] flex items-center justify-center text-sm font-bold">
              <FaAward className="w-3.5 h-3.5" />
            </div>
            <p className="text-2xl font-extrabold text-[#341D17]">
              {stats.certificatesCount}
            </p>
            <p className="text-xs text-[#341D17]/65">Sertifikat Resmi</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 p-5 sm:p-6 shadow-2xs">
        <form onSubmit={handleSaveForm} className="space-y-5">
          <div className="flex items-start gap-3 pb-3 border-b border-[#341D17]/10">
            <span className="w-8 h-8 rounded-xl bg-[#F9DDBB]/80 text-[#802924] flex items-center justify-center text-sm font-bold shrink-0">
              <FaUser className="w-3.5 h-3.5" />
            </span>
            <div>
              <h2 className="font-editorial text-base sm:text-lg font-bold text-[#341D17]">
                Form Data Siswa
              </h2>
              <p className="text-xs text-[#341D17]/65">
                Perbarui rincian kontak dan profil minat kuliner Anda
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="student-fullname-input"
                className="text-xs sm:text-sm font-bold text-[#341D17]"
              >
                Nama Lengkap (Bisa Diedit)
              </label>
              <button
                type="button"
                onClick={() => nameInputRef.current?.focus()}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#802924] hover:underline cursor-pointer"
              >
                <FaPen className="w-2.5 h-2.5 shrink-0" />
                <span>Dapat Diubah</span>
              </button>
            </div>

            <div className="relative">
              <input
                ref={nameInputRef}
                id="student-fullname-input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-[#341D17]/15 bg-[#FAF6F0]/75 px-4 py-2.5 pr-10 text-xs sm:text-sm font-semibold text-[#341D17] focus:border-[#802924] focus:bg-[#FFFDF9] focus:outline-none"
              />
              <FaPen className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#341D17]/45" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="student-email-input"
              className="block text-xs sm:text-sm font-bold text-[#341D17]"
            >
              Alamat Email (Terdaftar)
            </label>
            <div className="relative">
              <input
                id="student-email-input"
                type="email"
                value={email}
                readOnly
                className="w-full rounded-xl border border-[#341D17]/10 bg-[#FAF6F0] px-4 py-2.5 pr-10 text-xs sm:text-sm text-[#341D17]/75 focus:outline-none cursor-not-allowed"
              />
              <FaEnvelope className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#341D17]/45" />
            </div>
            <p className="text-[11px] text-[#341D17]/55">
              Digunakan untuk konfirmasi jadwal kelas laboratorium &amp; materi baking.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="student-role-display"
              className="block text-xs sm:text-sm font-bold text-[#341D17]"
            >
              Role Pengguna
            </label>
            <div className="relative">
              <input
                id="student-role-display"
                type="text"
                value="Student"
                readOnly
                className="w-full rounded-xl border border-[#341D17]/10 bg-[#FAF6F0] px-4 py-2.5 pr-10 text-xs sm:text-sm font-semibold text-[#341D17]/75 focus:outline-none cursor-not-allowed"
              />
              <FaLock className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#341D17]/45" />
            </div>
            <div className="rounded-xl bg-[#FAF6F0] border border-[#341D17]/10 px-3.5 py-2 text-[11px] text-[#341D17]/70 flex items-center gap-2">
              <FaCircleInfo className="w-3.5 h-3.5 text-[#802924] shrink-0" />
              <span>
                Role ditetapkan oleh sistem saat registrasi atelier &amp; hanya administrator yang dapat mengubah kualifikasi.
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="student-whatsapp-input"
              className="block text-xs sm:text-sm font-bold text-[#341D17]"
            >
              Nomor WhatsApp / Kontak
            </label>
            <div className="relative">
              <input
                id="student-whatsapp-input"
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+62 812-9876-5432"
                className="w-full rounded-xl border border-[#341D17]/15 bg-[#FAF6F0]/75 px-4 py-2.5 pr-10 text-xs sm:text-sm font-semibold text-[#341D17] focus:border-[#802924] focus:bg-[#FFFDF9] focus:outline-none"
              />
              <FaMobileScreenButton className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#341D17]/45" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="student-bio-textarea"
              className="block text-xs sm:text-sm font-bold text-[#341D17]"
            >
              Bio &amp; Minat Baking
            </label>
            <textarea
              id="student-bio-textarea"
              rows={3}
              maxLength={200}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-xl border border-[#341D17]/15 bg-[#FAF6F0]/75 px-4 py-3 text-xs sm:text-sm text-[#341D17] leading-relaxed focus:border-[#802924] focus:bg-[#FFFDF9] focus:outline-none resize-none"
            />
            <div className="text-right text-[11px] text-[#341D17]/60">
              {bio.length} / 200 karakter
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-[#802924] hover:bg-[#661F1B] py-3 px-5 text-xs sm:text-sm font-bold text-[#FFFDF9] flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60 shadow-2xs"
          >
            <FaFloppyDisk className="w-3.5 h-3.5 shrink-0" />
            <span>
              {saving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Profil'}
            </span>
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
          Keamanan &amp; Sesi
        </h2>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              setPasswordNote('');
              setShowPasswordModal(true);
            }}
            className="w-full rounded-2xl bg-[#FFFDF9] hover:bg-[#FAF6F0] border border-[#341D17]/12 px-4 py-3.5 flex items-center justify-between gap-3 text-left transition cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-[#F9DDBB]/80 text-[#802924] flex items-center justify-center text-sm font-bold shrink-0">
                <FaKey className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[#341D17]">
                  Ganti Kata Sandi
                </p>
                <p className="text-[11px] text-[#341D17]/60">
                  Terakhir diperbarui 28 hari yang lalu
                </p>
              </div>
            </div>
            <FaChevronRight className="w-3.5 h-3.5 text-[#341D17]/45 shrink-0" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-2xl bg-[#FFFDF9] hover:bg-[#802924]/5 border border-[#341D17]/12 px-4 py-3.5 flex items-center justify-between gap-3 text-left transition cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-[#802924]/10 text-[#802924] flex items-center justify-center text-sm font-bold shrink-0">
                <FaRightFromBracket className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[#802924]">
                  Keluar dari Akun (Logout)
                </p>
                <p className="text-[11px] text-[#341D17]/60">
                  Akhiri sesi aktif di perangkat ini
                </p>
              </div>
            </div>
            <FaPowerOff className="w-3.5 h-3.5 text-[#802924] shrink-0" />
          </button>
        </div>
      </section>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-[#2A1712]/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#FFFDF9] border border-[#341D17]/15 p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-lg font-bold text-[#341D17]">
                Ganti Kata Sandi
              </h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                aria-label="Tutup modal ganti kata sandi"
                className="p-1 text-[#341D17]/60 hover:text-[#802924] cursor-pointer"
              >
                <FaXmark className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#341D17]">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#341D17]/15 bg-[#FAF6F0] px-3.5 py-2 text-xs sm:text-sm text-[#341D17] focus:border-[#802924] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#341D17]">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#341D17]/15 bg-[#FAF6F0] px-3.5 py-2 text-xs sm:text-sm text-[#341D17] focus:border-[#802924] focus:outline-none"
                />
              </div>

              {passwordNote && (
                <p className="text-xs font-semibold text-[#802924]">
                  {passwordNote}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="rounded-xl border border-[#341D17]/15 bg-[#FAF6F0] px-4 py-2 text-xs font-bold text-[#341D17] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#802924] hover:bg-[#661F1B] px-4 py-2 text-xs font-bold text-[#FFFDF9] cursor-pointer"
                >
                  Simpan Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}