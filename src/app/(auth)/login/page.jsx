// =====================================================================
// YUGYO - Login Page dengan Pengecekan Username Admin
// File: src/app/(auth)/login/page.jsx
// =====================================================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Cek jika username yang dimasukkan adalah "admin"
    if (username.trim().toLowerCase() === 'admin') {
      // Langsung arahkan ke dashboard admin
      router.push('/dashboard/admin');
    } else {
      // Untuk sementara, jika bukan admin, tampilkan peringatan atau arahkan ke student
      // (Nanti bisa disesuaikan dengan logika database PostgreSQL & role student/instructor)
      setErrorMsg('Login berhasil, tapi rute untuk user ini belum diset. Ketik "admin" untuk masuk ke dashboard admin.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-light-silver)] flex items-center justify-center px-4 py-12">
      
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 border border-[var(--color-pastel-blue)]/40">
        
        {/* SISI KIRI: Ilustrasi & Branding */}
        <div className="md:col-span-6 bg-gradient-to-br from-[var(--color-pastel-blue)]/30 to-[var(--color-light-silver)] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[var(--color-pastel-blue)]/40 rounded-full blur-2xl pointer-events-none"></div>

          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-prussian)] flex items-center justify-center text-white font-bold text-sm shadow">
                Y
              </div>
              <span className="text-lg font-bold tracking-tight text-[var(--color-prussian)]">
                YUGYO
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--color-prussian)] leading-tight mb-2">
              Online Education
            </h2>
            <p className="text-xs md:text-sm text-[var(--color-teal-blue)] font-medium">
              Welcome to the website. Masuk untuk melanjutkan perjalanan belajarmu.
            </p>
          </div>

          <div className="my-8 flex flex-col items-center justify-center">
            <div className="w-full max-w-[220px] h-36 bg-white/80 backdrop-blur rounded-2xl shadow-inner border border-[var(--color-pastel-blue)] flex flex-col items-center justify-center p-4">
              <div className="w-12 h-16 bg-[var(--color-prussian)] rounded-md flex items-center justify-center text-white font-bold text-xs shadow mb-2 border-b-2 border-[var(--color-teal-blue)]">
                ABC
              </div>
              <div className="w-24 h-2 bg-[var(--color-mughal)] rounded-full mb-1"></div>
              <div className="w-20 h-2 bg-[var(--color-teal-blue)] rounded-full"></div>
            </div>
          </div>

          <div className="text-[11px] text-[var(--color-teal-blue)] font-medium">
            Tips: Ketik <span className="font-bold text-[var(--color-prussian)]">admin</span> pada kolom username untuk masuk ke Dashboard Admin.
          </div>
        </div>

        {/* SISI KANAN: Formulir Login */}
        <div className="md:col-span-6 p-8 md:p-12 flex flex-col justify-center bg-white">
          
          <div className="text-center mb-6">
            <h3 className="text-xl md:text-2xl font-bold tracking-wider text-[var(--color-prussian)] uppercase mb-1">
              USER LOGIN
            </h3>
            <p className="text-xs text-[var(--color-teal-blue)]">Masukkan kredensial akun Anda</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            <div>
              <label className="block text-xs font-semibold text-[var(--color-prussian)] mb-1.5">
                Username or Email
              </label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ketik 'admin' di sini..." 
                className="w-full bg-[var(--color-light-silver)]/50 border border-[var(--color-pastel-blue)] text-[var(--color-prussian)] text-sm rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-blue)] transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-prussian)] mb-1.5">
                Password
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-[var(--color-light-silver)]/50 border border-[var(--color-pastel-blue)] text-[var(--color-prussian)] text-sm rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-blue)] transition"
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-[var(--color-prussian)] font-medium">
                <input type="checkbox" className="rounded text-[var(--color-mughal)] focus:ring-[var(--color-teal-blue)]" />
                Remember
              </label>
              <a href="#" className="text-[var(--color-teal-blue)] hover:underline font-medium">
                Forgot password?
              </a>
            </div>

            {/* Tombol Login */}
            <button 
              type="submit"
              className="w-full bg-[var(--color-mughal)] hover:bg-[#2b5421] text-white font-semibold text-sm py-3 rounded-xl shadow-md transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              LOGIN →
            </button>

          </form>

          <div className="mt-6 text-center text-xs text-[var(--color-teal-blue)]">
            Belum punya akun?{' '}
            <Link href="/register/student" className="text-[var(--color-prussian)] font-bold hover:underline">
              Create Account
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}