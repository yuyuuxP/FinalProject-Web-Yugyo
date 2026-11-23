'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateUserModal({
  categories = [],
  onClose,
  onCreated,
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('teacher');
  const [status, setStatus] = useState('active');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const safeCategories = Array.isArray(categories) ? categories : [];

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
      return;
    }
    router.push('/dashboard/admin/users');
  };

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    const chosen = safeCategories.find((c) => String(c.id) === String(val));
    if (chosen?.has_teacher) {
      setErrorMsg(
        `Kategori "${chosen.name}" sudah memiliki guru yang bertanggung jawab dan tidak dapat dipilih.`
      );
      setSelectedCategoryId('');
      return;
    }
    setErrorMsg('');
    setSelectedCategoryId(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const chosen = safeCategories.find(
      (c) => String(c.id) === String(selectedCategoryId)
    );

    if (chosen?.has_teacher) {
      setErrorMsg(
        `Kategori "${chosen.name}" sudah memiliki guru yang bertanggung jawab.`
      );
      return;
    }

    if (!email.trim() || !password) {
      setErrorMsg('Alamat email dan kata sandi wajib diisi.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          role,
          status,
          category_id:
            role === 'teacher' && selectedCategoryId
              ? Number(selectedCategoryId)
              : '',
          specialty: role === 'teacher' ? chosen?.name || '' : '',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        setErrorMsg(data?.message || 'Gagal mendaftarkan pengguna baru.');
        setSubmitting(false);
        return;
      }

      if (typeof onCreated === 'function') {
        onCreated(data.user);
      }

      router.push('/dashboard/admin/users');
      router.refresh();
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan saat mendaftarkan pengguna.');
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
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
              &#10022; DIREKTORI ATELIER &bull; TAMBAH PENGGUNA
            </span>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17] mt-0.5">
              Daftarkan Pengguna Baru
            </h1>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup modal daftarkan pengguna"
            className="rounded-full bg-[#802924] hover:bg-[#661F1B] w-7 h-7 flex items-center justify-center text-sm font-bold text-[#FFFDF9] transition cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/70">
              NAMA LENGKAP &amp; GELAR (OPSIONAL)
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Chef Pierre L'Homme"
              className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2.5 text-xs sm:text-sm text-[#341D17] placeholder:text-[#341D17]/35 focus:border-[#802924] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/70">
              ALAMAT EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Contoh: pierre@yugyo.com"
              className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2.5 text-xs sm:text-sm text-[#341D17] placeholder:text-[#341D17]/35 focus:border-[#802924] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/70">
              KATA SANDI (PASSWORD)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Masukkan kata sandi"
              className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2.5 text-xs sm:text-sm text-[#341D17] placeholder:text-[#341D17]/35 focus:border-[#802924] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/70">
                PERAN (ROLE)
              </label>
              <select
                value={role}
                onChange={(e) => {
                  const nextRole = e.target.value;
                  setRole(nextRole);
                  if (nextRole !== 'teacher') {
                    setSelectedCategoryId('');
                  }
                  if (errorMsg) setErrorMsg('');
                }}
                aria-label="Pilih Peran Pengguna"
                className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2.5 text-xs sm:text-sm text-[#341D17] focus:border-[#802924] focus:outline-none"
              >
                <option value="student">student</option>
                <option value="teacher">teacher</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/70">
                STATUS AKUN
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                aria-label="Pilih Status Akun"
                className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2.5 text-xs sm:text-sm text-[#341D17] focus:border-[#802924] focus:outline-none"
              >
                <option value="active">active</option>
                <option value="pending">pending</option>
              </select>
            </div>
          </div>

          {role === 'teacher' && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/70">
                KATEGORI KEAHLIAN
              </label>
              <select
                value={selectedCategoryId}
                onChange={handleCategoryChange}
                aria-label="Pilih Kategori Keahlian"
                className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2.5 text-xs sm:text-sm text-[#341D17] focus:border-[#802924] focus:outline-none"
              >
                <option value="">Pilih Kategori Keahlian...</option>
                {safeCategories.map((cat) => {
                  const isTaken = Boolean(cat?.has_teacher);
                  return (
                    <option
                      key={cat.id}
                      value={cat.id}
                      disabled={isTaken}
                      className={
                        isTaken ? 'text-[#9E9994] bg-[#ECEAE6]' : ''
                      }
                    >
                      {cat.name}
                      {isTaken ? ' (Sudah ada guru penanggung jawab)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-[#802924]/30 bg-[#802924]/10 px-3.5 py-2.5 text-xs font-bold text-[#802924]">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#802924] hover:bg-[#661F1B] py-3 px-4 text-xs sm:text-sm font-bold text-[#FFFDF9] transition cursor-pointer disabled:opacity-60"
          >
            {submitting ? 'Mendaftarkan...' : '+ Daftarkan Pengguna Baru'}
          </button>
        </form>
      </div>
    </div>
  );
}