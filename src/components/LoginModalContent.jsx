// =====================================================================
// YUGYO - Centered Login Modal Card Component (Connected to PostgreSQL)
// File: src/components/LoginModalContent.jsx
// =====================================================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginModalContent({ backHref = '/' }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal masuk. Periksa kembali akun Anda.');
        setIsLoading(false);
        return;
      }

      // Arahkan langsung sesuai role dari database (admin -> /dashboard/admin)
      router.push(data.redirectUrl);
      router.refresh();
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#341D17]/35 backdrop-blur-[2px] overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-[#FFFDF9] rounded-3xl shadow-2xl border border-[#341D17]/20 overflow-hidden my-auto">
        
        {/* 1. TOP BAR DI DALAM CARD */}
        <div className="px-5 sm:px-7 py-3.5 bg-[#FFFDF9] border-b border-[#341D17]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={backHref}
              aria-label="Kembali"
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
                <p className="text-xs font-bold text-[#341D17] leading-tight">Sign In</p>
              </div>
            </div>
          </div>

          <Link
            href={backHref}
            title="Tutup Modal Login"
            className="w-8 h-8 rounded-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] flex items-center justify-center shadow-xs text-xs font-bold transition"
          >
            ✕
          </Link>
        </div>

        {/* 2. BODY CONTENT DI DALAM CARD */}
        <div className="p-5 sm:p-7 space-y-5">
          
          {/* Sub-header */}
          <div className="flex items-center justify-between gap-2">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#341D17] hover:text-[#802924] transition"
            >
              <span>←</span>
              <span>{backHref === '/courses' ? 'Kembali ke Katalog Guest' : 'Kembali ke Beranda'}</span>
            </Link>

            <span className="inline-flex items-center gap-1.5 bg-[#82882B]/15 text-[#82882B] px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#82882B]" />
              ACADEMY PORTAL
            </span>
          </div>

          {/* Welcome Box */}
          <div className="bg-[#F9DDBB]/40 border border-[#341D17]/10 rounded-2xl p-4 sm:p-5">
            <div className="flex items-start gap-3.5 mb-2.5">
              <div className="w-11 h-11 rounded-2xl bg-[#FFFDF9] border border-[#341D17]/15 flex items-center justify-center font-editorial font-extrabold text-xs text-[#341D17] shrink-0 shadow-2xs">
                YUGYO
              </div>
              <div>
                <p className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#802924] mb-0.5">
                  ATELIER PÂTISSERIE &amp; BOULANGERIE
                </p>
                <h1 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17] leading-snug">
                  Selamat Datang Kembali di YUGYO Atelier
                </h1>
              </div>
            </div>
            <p className="text-xs text-[#341D17]/75 leading-relaxed">
              Akses materi kelas master, resep teruji chef profesional, serta jadwal pembuktian adonan Anda hari ini.
            </p>
          </div>

          {/* Form Box */}
          <form
            onSubmit={handleLogin}
            className="bg-white border border-[#341D17]/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs"
          >
            {errorMsg && (
              <div className="p-3 rounded-xl bg-[#802924]/15 border border-[#802924] text-[#802924] text-xs font-bold text-center">
                {errorMsg}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#341D17]">
                  Email atau Username
                </label>
                <span className="text-[11px] text-[#341D17]/45">contoh@yugyo.com</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/45">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="nama@email.com atau username"
                  className="w-full bg-[#F9DDBB]/30 border border-[#341D17]/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#341D17] mb-1.5">
                Kata Sandi Atelier
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/45">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi akun Anda"
                  className="w-full bg-[#F9DDBB]/30 border border-[#341D17]/15 rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Tampilkan atau sembunyikan kata sandi"
                  className="absolute inset-y-0 right-3.5 flex items-center text-[#341D17]/50 hover:text-[#341D17] cursor-pointer"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-[#341D17]/85">
                <input type="checkbox" className="rounded accent-[#802924]" />
                <span>Ingat Saya</span>
              </label>
              <Link href="#" className="font-bold text-[#802924] hover:underline">
                Lupa Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#802924] hover:bg-[#661F1B] disabled:opacity-60 text-[#F9DDBB] font-bold text-xs sm:text-sm py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isLoading ? 'Memverifikasi Akun...' : 'Masuk ke Dapur Belajar'}</span>
              <span>🍴</span>
            </button>

            <div className="bg-[#F9DDBB]/35 border border-[#341D17]/10 rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-[11px] text-[#341D17]/80">
              <span className="text-[#82882B] shrink-0">🛡️</span>
              <span>Akses aman terenkripsi untuk masterclass sourdough, viennoiserie, dan cokelat.</span>
            </div>
          </form>

          {/* Guest Mode Card */}
          <div className="bg-[#F9DDBB]/45 border border-[#341D17]/10 rounded-2xl p-4 text-center space-y-1">
            <p className="text-[11px] text-[#341D17]/70">Belum ingin mendaftar kursus?</p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#802924] hover:underline"
            >
              <span>Masuk sebagai Tamu (Guest Mode)</span>
              <span>→</span>
            </Link>
            <p className="text-[10px] text-[#341D17]/60">
              Lihat katalog kursus &amp; resep cuplikan tanpa login
            </p>
          </div>

          {/* Footer Register Links */}
          <div className="text-center space-y-2 pt-1">
            <p className="text-xs text-[#341D17]/80">
              Belum punya akun?{' '}
              <Link
                href="/register/student"
                className="font-bold text-[#802924] underline hover:text-[#661F1B]"
              >
                Daftar sebagai Siswa
              </Link>{' '}
              atau{' '}
              <Link
                href="/register/instructor"
                className="font-bold text-[#82882B] underline hover:opacity-80"
              >
                Pengajar
              </Link>
            </p>

            <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-[#341D17]/60">
              <span className="inline-flex items-center gap-1">
                <span>🏅</span> Sertifikasi Atelier
              </span>
              <span className="inline-flex items-center gap-1">
                <span>⏱️</span> Akses Resep 24 Jam
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}