'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterStudentCard() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 8) {
      setErrorMsg('Kata sandi minimal harus 8 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (!agreed) {
      setErrorMsg('Harap setujui Syarat & Ketentuan serta Kebijakan Privasi.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          username,
          email,
          password,
          role: 'student',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Pendaftaran gagal.');
        setIsLoading(false);
        return;
      }

      router.push(data.redirectUrl);
      router.refresh();
    } catch (err) {
      setErrorMsg('Terjadi kesalahan koneksi ke server.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#341D17]/35 backdrop-blur-[2px] overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-[#FFFDF9] rounded-3xl shadow-2xl border border-[#341D17]/20 overflow-hidden my-auto">
        
        {/* 1. TOP BAR */}
        <div className="px-5 sm:px-7 py-3.5 bg-[#FFFDF9] border-b border-[#341D17]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              aria-label="Kembali ke Login"
              className="w-8 h-8 rounded-full hover:bg-[#F9DDBB]/60 flex items-center justify-center text-[#341D17] transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#341D17] text-[#F9DDBB] flex items-center justify-center font-editorial font-bold text-xs">
                Y
              </div>
              <div>
                <p className="text-[9px] font-extrabold tracking-[0.2em] uppercase text-[#802924] leading-none">
                  YUGYO
                </p>
                <p className="text-xs font-bold text-[#341D17] leading-tight">Create Account</p>
              </div>
            </div>
          </div>

          <Link
            href="/"
            title="Tutup"
            className="w-8 h-8 rounded-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] flex items-center justify-center shadow-xs text-xs font-bold transition"
          >
            ✕
          </Link>
        </div>

        {/* 2. BODY CONTENT */}
        <div className="p-5 sm:p-7 space-y-4">
          
          {/* Sub-header */}
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#802924] hover:underline transition"
            >
              <span>←</span>
              <span>Kembali ke Login</span>
            </Link>

            <span className="inline-flex items-center gap-1.5 bg-[#82882B]/15 text-[#82882B] px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#82882B]" />
              STUDENT ACCOUNT
            </span>
          </div>

          {/* Header Banner & 3 Foto Bakery Strip */}
          <div className="bg-[#F9DDBB]/35 border border-[#341D17]/10 rounded-2xl p-4 sm:p-5 space-y-3.5">
            <div>
              <p className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#802924] flex items-center gap-1.5 mb-1">
                <span>🏛️</span> ATELIER PENDAFTARAN
              </p>
              <h1 className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17] leading-tight">
                Daftar sebagai Siswa (Student)
              </h1>
              <p className="text-xs text-[#341D17]/75 mt-1">
                Mulai petualangan baking Anda bersama para master pastry chef YUGYO Atelier.
              </p>
            </div>

            {/* 3 Strip Foto Bakery */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="h-16 sm:h-20 rounded-xl overflow-hidden border border-[#341D17]/15">
                <img
                  src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=500&q=80"
                  alt="Artisan Croissants"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-16 sm:h-20 rounded-xl overflow-hidden border border-[#341D17]/15">
                <img
                  src="https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=500&q=80"
                  alt="Fruit Tartlets"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-16 sm:h-20 rounded-xl overflow-hidden border border-[#341D17]/15">
                <img
                  src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80"
                  alt="Country Sourdough"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Switch Banner ke Instructor */}
          <div className="bg-[#F9DDBB]/55 border border-[#341D17]/10 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#82882B] text-white flex items-center justify-center shrink-0 shadow-2xs text-sm">
              🎓
            </div>
            <div className="text-xs">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                INGIN MENGAJAR?
              </p>
              <p className="text-[#341D17]/80">
                Ingin berbagi keahlian baking Anda?{' '}
                <Link
                  href="/register/instructor"
                  className="font-bold text-[#802924] underline hover:text-[#661F1B]"
                >
                  Daftar sebagai Instructor/Guru di sini →
                </Link>
              </p>
            </div>
          </div>

          {/* Form Pendaftaran Student */}
          <form
            onSubmit={handleRegister}
            className="bg-white border border-[#341D17]/10 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs"
          >
            {errorMsg && (
              <div className="p-3 rounded-xl bg-[#802924]/15 border border-[#802924] text-[#802924] text-xs font-bold text-center">
                {errorMsg}
              </div>
            )}

            {/* Nama Lengkap */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#341D17]">Nama Lengkap</label>
                <span className="text-[10px] font-semibold text-[#802924]">*Wajib</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/45 text-xs">
                  🪪
                </span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="cth. Nurhayu Fiantika Gafar"
                  className="w-full bg-[#F9DDBB]/30 border border-[#341D17]/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#341D17]">Username</label>
                <span className="text-[10px] text-[#341D17]/50">Untuk profil &amp; karya</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/50 text-xs font-bold">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="cth. bakerayu"
                  className="w-full bg-[#F9DDBB]/30 border border-[#341D17]/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
                />
              </div>
            </div>

            {/* Email Utama */}
            <div>
              <label className="block text-xs font-bold text-[#341D17] mb-1">
                Email Utama
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/45 text-xs">
                  ✉️
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alamat@email.com"
                  className="w-full bg-[#F9DDBB]/30 border border-[#341D17]/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
                />
              </div>
            </div>

            {/* Kata Sandi */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#341D17]">Kata Sandi</label>
                <span className="text-[10px] text-[#341D17]/50">Min. 8 karakter</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/45 text-xs">
                  🔒
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F9DDBB]/30 border border-[#341D17]/15 rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-3.5 flex items-center text-[#341D17]/50 hover:text-[#341D17] text-xs cursor-pointer"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Konfirmasi Kata Sandi */}
            <div>
              <label className="block text-xs font-bold text-[#341D17] mb-1">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/45 text-xs">
                  🔄
                </span>
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F9DDBB]/30 border border-[#341D17]/15 rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute inset-y-0 right-3.5 flex items-center text-[#341D17]/50 hover:text-[#341D17] text-xs cursor-pointer"
                >
                  {showConfirmPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Checkbox Syarat & Ketentuan */}
            <label className="flex items-start gap-2.5 pt-1 cursor-pointer text-[11px] text-[#341D17]/80">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded accent-[#802924]"
              />
              <span>
                Saya menyetujui{' '}
                <span className="font-bold text-[#802924] underline">Syarat &amp; Ketentuan</span>{' '}
                serta{' '}
                <span className="font-bold text-[#802924] underline">Kebijakan Privasi</span>{' '}
                YUGYO Baking Atelier.
              </span>
            </label>

            {/* Tombol Daftar Akun Siswa */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#802924] hover:bg-[#661F1B] disabled:opacity-60 text-[#F9DDBB] font-bold text-xs sm:text-sm py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isLoading ? 'Mendaftarkan Akun...' : 'Daftar Akun Siswa'}</span>
              <span>🍪</span>
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}