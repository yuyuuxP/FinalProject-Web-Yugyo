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
    if (username.trim().toLowerCase() === 'admin') {
      router.push('/dashboard/admin');
    } else {
      router.push('/dashboard/student');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-light-silver)] flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-[var(--color-pastel-blue)]/40">
        
        {/* ================= PANEL KIRI ================= */}
        <div className="bg-gradient-to-br from-[#e3edea] to-[#d2e2de] p-8 md:p-10 flex flex-col justify-between text-[var(--color-prussian)]">
          <div>
            {/* TOMBOL KEMBALI KE LANDING PAGE */}
            <div className="mb-6">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-teal-blue)] hover:text-[var(--color-prussian)] bg-white/80 hover:bg-white px-3.5 py-2 rounded-full shadow-sm border border-[var(--color-pastel-blue)]/40 transition"
              >
                <span>←</span> Kembali ke Beranda
              </Link>
            </div>

            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-full bg-[var(--color-prussian)] text-white flex items-center justify-center font-extrabold text-xs">
                Y
              </div>
              <span className="font-extrabold text-sm tracking-wider">YUGYO</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold mb-2">
              Online Education
            </h1>
            <p className="text-xs text-[var(--color-teal-blue)] leading-relaxed">
              Welcome to the website. Masuk untuk melanjutkan perjalanan belajarmu.
            </p>
          </div>

          <div className="my-8 bg-white/80 rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm border border-white">
            <div className="w-12 h-14 bg-[var(--color-prussian)] rounded-lg flex items-center justify-center text-white font-bold text-xs mb-3 shadow">
              ABC
            </div>
            <div className="w-24 h-1.5 bg-[var(--color-mughal)] rounded-full mb-1.5"></div>
            <div className="w-16 h-1.5 bg-[var(--color-teal-blue)]/40 rounded-full"></div>
          </div>
        </div>

        {/* ================= PANEL KANAN (FORM LOGIN) ================= */}
        <div className="p-8 md:p-10 flex flex-col justify-center bg-white text-[var(--color-prussian)]">
          <div className="text-center mb-6">
            <h2 className="text-xl font-extrabold tracking-wide">USER LOGIN</h2>
            <p className="text-xs text-[var(--color-teal-blue)] mt-1">
              Masukkan kredensial akun Anda
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold mb-1.5">Username or Email</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username atau email"
                className="w-full bg-[var(--color-light-silver)]/60 border border-[var(--color-pastel-blue)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-blue)]"
              />
            </div>

            <div>
              <label className="block font-bold mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--color-light-silver)]/60 border border-[var(--color-pastel-blue)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-blue)]"
              />
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span>Remember</span>
              </label>
              <Link href="#" className="text-[var(--color-teal-blue)] font-semibold hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-[var(--color-mughal)] hover:bg-[#2b5421] text-white font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              LOGIN <span>→</span>
            </button>
          </form>

          <div className="text-center text-xs text-[var(--color-teal-blue)] mt-6 space-y-1.5">
            <p>
              Belum punya akun?{' '}
              <Link href="/register/student" className="font-bold text-[var(--color-prussian)] hover:underline">
                Daftar sebagai Student
              </Link>
            </p>
            <p className="text-[11px]">
              Atau ingin mengajar?{' '}
              <Link href="/register/instructor" className="font-bold text-[var(--color-mughal)] hover:underline">
                Daftar sebagai Instructor
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}