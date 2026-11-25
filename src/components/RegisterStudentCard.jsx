'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FaChevronLeft,
  FaXmark,
  FaArrowLeft,
  FaLandmark,
  FaGraduationCap,
  FaArrowRight,
  FaIdCard,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaRotate,
  FaCookieBite,
} from 'react-icons/fa6';
import RegistrationSuccessModal from '@/components/RegistrationSuccessModal';

function toTitleCase(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function normalizeUsername(rawUsername, rawFullName, rawEmail) {
  const source =
    String(rawUsername || '').trim() ||
    String(rawFullName || '').trim() ||
    String(rawEmail || '').split('@')[0] ||
    '';

  return source
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 24);
}

export default function RegisterStudentCard() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanFullName = toTitleCase(fullName);
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanUsername = normalizeUsername(username, cleanFullName, cleanEmail);

    if (cleanFullName.length < 2) {
      setErrorMsg('Nama lengkap minimal 2 karakter.');
      return;
    }

    if (cleanUsername.length < 3) {
      setErrorMsg('Username minimal 3 karakter (huruf, angka, atau underscore).');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Format email utama tidak valid.');
      return;
    }

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
          fullName: cleanFullName,
          username: cleanUsername,
          email: cleanEmail,
          password,
          role: 'student',
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await res.json().catch(() => ({}))
        : {};

      if (!res.ok) {
        setErrorMsg(
          data.error ||
            data.message ||
            `Pendaftaran gagal (kode status ${res.status}).`
        );
        setIsLoading(false);
        return;
      }

      setFullName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAgreed(false);
      setShowPass(false);
      setShowConfirmPass(false);
      setSuccessMsg(
        'Akun berhasil didaftarkan! Tunggu persetujuan admin sebelum login.'
      );
      setIsLoading(false);
    } catch {
      setErrorMsg('Tidak dapat terhubung ke server. Periksa status server Next.js.');
      setIsLoading(false);
    }
  };

  return (
    <>
    <div className="fixed inset-0 z-50 bg-[#F9DDBB] overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-[#FFFDF9] rounded-3xl shadow-2xl border border-[#341D17]/20 overflow-hidden my-auto">
        <div className="px-5 sm:px-7 py-3.5 bg-[#FFFDF9] border-b border-[#341D17]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              aria-label="Kembali ke Login"
              className="w-8 h-8 rounded-full hover:bg-[#F9DDBB]/60 flex items-center justify-center text-[#341D17] transition"
            >
              <FaChevronLeft className="w-3.5 h-3.5" />
            </Link>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-[#341D17] border border-[#341D17]/15 shrink-0">
                <img
                  src="/yugyo.png"
                  alt="Maskot Chef YUGYO"
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div>
                <p className="text-[9px] font-extrabold tracking-[0.2em] uppercase text-[#802924] leading-none">
                  YUGYO
                </p>
                <p className="text-xs font-bold text-[#341D17] leading-tight">
                  Create Account
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/"
            aria-label="Tutup"
            title="Tutup"
            className="w-8 h-8 rounded-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] flex items-center justify-center shadow-xs transition"
          >
            <FaXmark className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-5 sm:p-7 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#802924] hover:underline transition"
            >
              <FaArrowLeft className="w-3 h-3 shrink-0" />
              <span>Kembali ke Login</span>
            </Link>

            <span className="inline-flex items-center gap-1.5 bg-[#82882B]/15 text-[#4E5317] px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#82882B]" />
              STUDENT ACCOUNT
            </span>
          </div>

          <div className="bg-[#F9DDBB]/35 border border-[#341D17]/10 rounded-2xl p-4 sm:p-5 space-y-3.5">
            <div>
              <p className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#802924] flex items-center gap-1.5 mb-1">
                <FaLandmark className="w-3 h-3 shrink-0" />
                <span>ATELIER PENDAFTARAN</span>
              </p>
              <h1 className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17] leading-tight">
                Daftar sebagai Siswa (Student)
              </h1>
              <p className="text-xs text-[#341D17]/75 mt-1">
                Mulai petualangan baking Anda bersama para master pastry chef YUGYO Atelier.
              </p>
            </div>

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

          <div className="bg-[#F9DDBB]/55 border border-[#341D17]/10 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#82882B] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <FaGraduationCap className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                INGIN MENGAJAR?
              </p>
              <p className="text-[#341D17]/80">
                Ingin berbagi keahlian baking Anda?{' '}
                <Link
                  href="/register/instructor"
                  className="inline-flex items-center gap-1 font-bold text-[#802924] underline hover:text-[#661F1B]"
                >
                  <span>Daftar sebagai Instructor/Guru di sini</span>
                  <FaArrowRight className="w-2.5 h-2.5 inline" />
                </Link>
              </p>
            </div>
          </div>

          <form
            onSubmit={handleRegister}
            noValidate
            className="bg-white border border-[#341D17]/10 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs"
          >
            {errorMsg && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-[#802924]/15 border border-[#802924] text-[#802924] text-xs font-bold text-center"
              >
                {errorMsg}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="student-reg-fullname"
                  className="text-xs font-bold text-[#341D17]"
                >
                  Nama Lengkap
                </label>
                <span className="text-[10px] font-semibold text-[#802924]">
                  *Wajib
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/45">
                  <FaIdCard className="w-3.5 h-3.5" />
                </span>
                <input
                  id="student-reg-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => setFullName((prev) => toTitleCase(prev))}
                  placeholder="cth. Nurhayu Fiantika Gafar"
                  className="w-full bg-[#F9DDBB]/30 border border-[#341D17]/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="student-reg-username"
                  className="text-xs font-bold text-[#341D17]"
                >
                  Username
                </label>
                <span className="text-[10px] text-[#341D17]/50">
                  Untuk profil &amp; karya
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/50 text-xs font-bold">
                  @
                </span>
                <input
                  id="student-reg-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="cth. bakerayu"
                  className="w-full bg-[#F9DDBB]/30 border border-[#341D17]/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="student-reg-email"
                className="block text-xs font-bold text-[#341D17] mb-1"
              >
                Email Utama
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/45">
                  <FaEnvelope className="w-3.5 h-3.5" />
                </span>
                <input
                  id="student-reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alamat@email.com"
                  className="w-full bg-[#F9DDBB]/30 border border-[#341D17]/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="student-reg-password"
                  className="text-xs font-bold text-[#341D17]"
                >
                  Kata Sandi
                </label>
                <span className="text-[10px] text-[#341D17]/50">
                  Min. 8 karakter
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/45">
                  <FaLock className="w-3.5 h-3.5" />
                </span>
                <input
                  id="student-reg-password"
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
                  aria-label={showPass ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  className="absolute inset-y-0 right-3.5 flex items-center text-[#341D17]/50 hover:text-[#341D17] cursor-pointer"
                >
                  {showPass ? (
                    <FaEyeSlash className="w-3.5 h-3.5" />
                  ) : (
                    <FaEye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="student-reg-confirm-password"
                className="block text-xs font-bold text-[#341D17] mb-1"
              >
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/45">
                  <FaRotate className="w-3.5 h-3.5" />
                </span>
                <input
                  id="student-reg-confirm-password"
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
                  aria-label={
                    showConfirmPass
                      ? 'Sembunyikan konfirmasi kata sandi'
                      : 'Lihat konfirmasi kata sandi'
                  }
                  className="absolute inset-y-0 right-3.5 flex items-center text-[#341D17]/50 hover:text-[#341D17] cursor-pointer"
                >
                  {showConfirmPass ? (
                    <FaEyeSlash className="w-3.5 h-3.5" />
                  ) : (
                    <FaEye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2.5 pt-1 cursor-pointer text-[11px] text-[#341D17]/80">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded accent-[#802924]"
              />
              <span>
                Saya menyetujui{' '}
                <span className="font-bold text-[#802924] underline">
                  Syarat &amp; Ketentuan
                </span>{' '}
                serta{' '}
                <span className="font-bold text-[#802924] underline">
                  Kebijakan Privasi
                </span>{' '}
                YUGYO Baking Atelier.
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#802924] hover:bg-[#661F1B] disabled:opacity-60 text-[#F9DDBB] font-bold text-xs sm:text-sm py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {isLoading ? 'Mendaftarkan Akun...' : 'Daftar Akun Siswa'}
              </span>
              <FaCookieBite className="w-4 h-4 shrink-0" />
            </button>
          </form>
        </div>
      </div>
    </div>
    {successMsg && <RegistrationSuccessModal message={successMsg} />}
    </>
  );
}