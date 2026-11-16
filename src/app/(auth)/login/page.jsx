// =====================================================================
// YUGYO - User Login Page (Strict 4-Color Bakery Palette)
// File: src/app/(auth)/login/page.jsx
// Palette: #F9DDBB (Cream), #802924 (Cocoa Red), #341D17 (Dark Choc), #82882B (Pistachio)
// =====================================================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    if (cleanUser === 'admin') {
      router.push('/dashboard/admin');
    } else if (cleanUser.includes('chef') || cleanUser.includes('teacher') || cleanUser.includes('instructor')) {
      router.push('/dashboard/teacher');
    } else {
      router.push('/dashboard/student');
    }
  };

  return (
    <div className="min-h-screen bg-[#F9DDBB] flex items-center justify-center p-4 md:p-6 text-[#341D17]">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border-2 border-[#341D17]/15">
        
        {/* ================= PANEL KIRI: DARK CHOCOLATE (#341D17) ================= */}
        <div className="bg-[#341D17] text-[#F9DDBB] p-8 md:p-10 flex flex-col justify-between">
          <div>
            {/* Tombol Kembali ke Landing Page */}
            <div className="mb-7">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F9DDBB] bg-[#802924] hover:bg-[#661F1B] px-4 py-2 rounded-full shadow-sm transition"
              >
                <span>←</span> Kembali ke Beranda
              </Link>
            </div>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-full bg-[#802924] text-[#F9DDBB] flex items-center justify-center font-editorial font-extrabold text-sm shadow">
                Y
              </div>
              <div>
                <span className="font-editorial font-bold text-base tracking-wider block leading-none text-[#F9DDBB]">
                  YUGYO
                </span>
                <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#F9DDBB]/70">
                  BAKING ATELIER
                </span>
              </div>
            </div>

            <h1 className="font-editorial text-2xl md:text-3xl font-bold mb-2.5 leading-snug text-[#F9DDBB]">
              Artisanal Baking &amp; Pâtisserie
            </h1>
            <p className="text-xs text-[#F9DDBB]/80 leading-relaxed">
              Masuk ke dapur digital YUGYO untuk melanjutkan kelas sourdough, viennoiserie, dan cake decorating Anda.
            </p>
          </div>

          {/* Kartu Aksen Pistachio (#82882B) & Cream (#F9DDBB) */}
          <div className="my-7 bg-[#F9DDBB] text-[#341D17] rounded-2xl p-5 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#82882B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                YUGYO
              </div>
              <div>
                <p className="text-xs font-extrabold text-[#341D17]">Kurikulum Baking Terpadu</p>
                <p className="text-[11px] text-[#341D17]/75">Akses modul resep &amp; panduan chef</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#F9DDBB]/75">
            Tips: Ketik <strong className="text-[#F9DDBB] underline">admin</strong> pada username untuk masuk ke Dashboard Admin.
          </p>
        </div>

        {/* ================= PANEL KANAN: FORM LOGIN ================= */}
        <div className="p-8 md:p-10 flex flex-col justify-center bg-[#FFFDF9] text-[#341D17]">
          <div className="text-center mb-6">
            <span className="inline-block bg-[#82882B] text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-2">
              USER LOGIN
            </span>
            <h2 className="font-editorial text-2xl font-bold text-[#341D17]">
              Masuk ke Akun
            </h2>
            <p className="text-xs text-[#341D17]/70 mt-1">
              Masukkan kredensial akun YUGYO Anda
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold mb-1.5 text-[#341D17]">Username or Email</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username atau email"
                className="w-full bg-[#F9DDBB]/45 border border-[#341D17]/20 rounded-xl px-4 py-3 text-[#341D17] placeholder:text-[#341D17]/45 focus:outline-none focus:ring-2 focus:ring-[#802924]"
              />
            </div>

            <div>
              <label className="block font-bold mb-1.5 text-[#341D17]">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F9DDBB]/45 border border-[#341D17]/20 rounded-xl px-4 py-3 text-[#341D17] placeholder:text-[#341D17]/45 focus:outline-none focus:ring-2 focus:ring-[#802924]"
              />
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                <input type="checkbox" className="rounded accent-[#802924]" />
                <span>Remember</span>
              </label>
              <Link href="/courses" className="text-[#802924] font-bold hover:underline">
                Jelajahi sebagai Guest
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>LOGIN</span>
              <span>→</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#341D17]/15 text-center text-xs space-y-1.5">
            <p className="text-[#341D17]/80">
              Belum punya akun?{' '}
              <Link href="/register/student" className="font-bold text-[#802924] hover:underline">
                Daftar sebagai Student
              </Link>
            </p>
            <p className="text-[11px] text-[#341D17]/70">
              Atau ingin mengajar?{' '}
              <Link href="/register/instructor" className="font-bold text-[#82882B] hover:underline">
                Daftar sebagai Instructor
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}