'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaCalendarDays,
  FaEnvelope,
  FaFloppyDisk,
  FaIdCard,
  FaShieldHalved,
  FaUserTie,
} from 'react-icons/fa6';

function getInitials(name) {
  return String(name || 'Admin')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function AdminProfileClient({ initialProfile }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [email, setEmail] = useState(initialProfile.email);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const handleSave = async (event) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setFeedback('');
    setError('');

    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menyimpan profil admin.');
      }

      setFullName(data.profile.full_name);
      setEmail(data.profile.email);
      setFeedback('Profil admin berhasil diperbarui.');
      router.refresh();
    } catch (requestError) {
      setError(requestError.message || 'Tidak dapat menghubungi server.');
    } finally {
      setSaving(false);
    }
  };

  const isActive = String(initialProfile.status).toLowerCase() === 'active';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#802924]">
          <FaShieldHalved className="h-3.5 w-3.5" />
          <span>Admin Atelier</span>
        </div>
        <h1 className="font-editorial text-2xl font-bold text-[#341D17] sm:text-3xl">
          Profil Admin
        </h1>
        <p className="text-sm text-[#341D17]/70">
          Kelola informasi akun administrator YUGYO Atelier Anda.
        </p>
      </header>

      {feedback && (
        <p
          role="status"
          className="rounded-2xl border border-[#82882B]/30 bg-[#82882B]/10 px-4 py-3 text-sm font-semibold text-[#341D17]"
        >
          {feedback}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-red-700/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-800"
        >
          {error}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)]">
        <form
          onSubmit={handleSave}
          className="space-y-5 rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 shadow-sm sm:p-7"
        >
          <div className="flex items-center gap-4 border-b border-[#341D17]/10 pb-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#802924] font-editorial text-xl font-bold text-[#F9DDBB]">
              {getInitials(fullName)}
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F9DDBB]/70 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                <FaUserTie className="h-3 w-3" />
                Administrator
              </span>
              <h2 className="mt-1 truncate font-editorial text-lg font-bold text-[#341D17]">
                {fullName || 'Admin'}
              </h2>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-full-name"
              className="block text-xs font-bold text-[#341D17]"
            >
              Nama Lengkap
            </label>
            <input
              id="admin-full-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              minLength={2}
              maxLength={100}
              autoComplete="name"
              required
              className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-3 text-sm text-[#341D17] outline-none transition focus:border-[#802924] focus:ring-2 focus:ring-[#802924]/15"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-email"
              className="block text-xs font-bold text-[#341D17]"
            >
              Alamat Email
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#341D17]/45" />
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={100}
                autoComplete="email"
                required
                className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] py-3 pl-10 pr-3.5 text-sm text-[#341D17] outline-none transition focus:border-[#802924] focus:ring-2 focus:ring-[#802924]/15"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#802924] px-5 py-3 text-sm font-bold text-[#F9DDBB] transition hover:bg-[#661F1B] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <FaFloppyDisk className="h-3.5 w-3.5" />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>

        <aside className="space-y-4 rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-2 border-b border-[#341D17]/10 pb-4">
            <FaIdCard className="h-4 w-4 text-[#802924]" />
            <h2 className="font-editorial text-lg font-bold text-[#341D17]">
              Informasi Akun
            </h2>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs text-[#341D17]/55">ID Akun</p>
              <p className="mt-1 font-semibold text-[#341D17]">
                #{initialProfile.id}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#341D17]/55">Peran</p>
              <p className="mt-1 font-semibold text-[#341D17]">Administrator</p>
            </div>
            <div>
              <p className="text-xs text-[#341D17]/55">Status Akun</p>
              <span
                className={`mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                  isActive
                    ? 'bg-[#82882B]/15 text-[#5C6727]'
                    : 'bg-amber-500/15 text-amber-800'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isActive ? 'bg-[#82882B]' : 'bg-amber-600'
                  }`}
                />
                {isActive ? 'Aktif' : initialProfile.status}
              </span>
            </div>
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs text-[#341D17]/55">
                <FaCalendarDays className="h-3 w-3" />
                Terdaftar sejak
              </p>
              <p className="mt-1 font-semibold text-[#341D17]">
                {initialProfile.createdAtLabel}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
