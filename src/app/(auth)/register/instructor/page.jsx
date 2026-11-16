// =====================================================================
// YUGYO - Chef / Instructor Registration Page (Strict 4-Color Bakery Palette)
// File: src/app/(auth)/register/instructor/page.jsx
// Palette: #F9DDBB (Cream), #802924 (Cocoa Red), #341D17 (Dark Choc), #82882B (Pistachio)
// =====================================================================

import Link from 'next/link';
import pool from '@/lib/db';
import { redirect } from 'next/navigation';

async function registerInstructorAction(formData) {
  'use server';

  const fullName = formData.get('full_name')?.toString().trim();
  const email = formData.get('email')?.toString().trim().toLowerCase();
  const password = formData.get('password')?.toString();

  if (!fullName || !email || !password) return;

  try {
    await pool.query(
      `INSERT INTO users (full_name, email, password, role)
       VALUES ($1, $2, $3, 'teacher');`,
      [fullName, email, password]
    );
  } catch (err) {
    console.error('Error registering instructor:', err);
    redirect('/register/instructor?error=email_exists');
  }

  redirect('/login?registered=true');
}

export default async function RegisterInstructorPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const hasError = resolvedSearchParams?.error === 'email_exists';

  return (
    <div className="min-h-screen bg-[#F9DDBB] flex items-center justify-center p-4 md:p-6 text-[#341D17]">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border-2 border-[#341D17]/15">
        
        {/* ================= PANEL KIRI: DARK CHOCOLATE (#341D17) ================= */}
        <div className="bg-[#341D17] text-[#F9DDBB] p-8 md:p-10 flex flex-col justify-between">
          <div>
            <div className="mb-7 flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F9DDBB] bg-[#802924] hover:bg-[#661F1B] px-4 py-2 rounded-full transition"
              >
                <span>←</span> Kembali ke Login
              </Link>
            </div>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-full bg-[#82882B] text-white flex items-center justify-center font-editorial font-extrabold text-sm shadow">
                Y
              </div>
              <div>
                <span className="font-editorial font-bold text-base tracking-wider block leading-none text-[#F9DDBB]">
                  YUGYO
                </span>
                <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#F9DDBB]/75">
                  BAKING ATELIER
                </span>
              </div>
            </div>

            <span className="inline-block bg-[#82882B] text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              CHEF / INSTRUCTOR
            </span>

            <h1 className="font-editorial text-2xl md:text-3xl font-bold mb-2.5 leading-snug text-[#F9DDBB]">
              Bergabung sebagai Master Baker
            </h1>
            <p className="text-xs text-[#F9DDBB]/80 leading-relaxed">
              Bagikan keahlian sourdough, viennoiserie, dan cake decorating Anda kepada ribuan peserta di seluruh Indonesia.
            </p>
          </div>

          {/* Kartu Aksen Cream & Pistachio */}
          <div className="my-6 bg-[#F9DDBB] text-[#341D17] rounded-2xl p-4 shadow-md">
            <p className="text-xs font-extrabold">Ingin belajar sebagai peserta?</p>
            <Link
              href="/register/student"
              className="inline-block mt-1 text-[11px] font-bold text-[#82882B] hover:underline"
            >
              Pindah ke Pendaftaran Student →
            </Link>
          </div>

          <p className="text-[11px] text-[#F9DDBB]/75">
            Akun Instructor otomatis terintegrasi dengan manajemen kelas YUGYO.
          </p>
        </div>

        {/* ================= PANEL KANAN: FORM REGISTER INSTRUCTOR ================= */}
        <div className="p-8 md:p-10 flex flex-col justify-center bg-[#FFFDF9] text-[#341D17]">
          <div className="text-center mb-6">
            <span className="inline-block bg-[#82882B] text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-2">
              CREATE INSTRUCTOR ACCOUNT
            </span>
            <h2 className="font-editorial text-2xl font-bold text-[#341D17]">
              Daftar Akun Chef / Teacher
            </h2>
            <p className="text-xs text-[#341D17]/70 mt-1">
              Lengkapi kredensial pengajar Anda di bawah ini
            </p>
          </div>

          {hasError && (
            <div className="mb-4 p-3 rounded-xl bg-[#802924]/15 border border-[#802924] text-[#802924] text-xs font-semibold text-center">
              Email sudah terdaftar. Gunakan email lain atau langsung masuk.
            </div>
          )}

          <form action={registerInstructorAction} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold mb-1.5 text-[#341D17]">Nama Lengkap &amp; Gelar *</label>
              <input
                type="text"
                name="full_name"
                required
                placeholder="Contoh: Chef Claire Laurent"
                className="w-full bg-[#F9DDBB]/45 border border-[#341D17]/20 rounded-xl px-4 py-3 text-[#341D17] placeholder:text-[#341D17]/45 focus:outline-none focus:ring-2 focus:ring-[#82882B]"
              />
            </div>

            <div>
              <label className="block font-bold mb-1.5 text-[#341D17]">Email *</label>
              <input
                type="email"
                name="email"
                required
                placeholder="chef@yugyo.id"
                className="w-full bg-[#F9DDBB]/45 border border-[#341D17]/20 rounded-xl px-4 py-3 text-[#341D17] placeholder:text-[#341D17]/45 focus:outline-none focus:ring-2 focus:ring-[#82882B]"
              />
            </div>

            <div>
              <label className="block font-bold mb-1.5 text-[#341D17]">Password *</label>
              <input
                type="password"
                name="password"
                required
                placeholder="Buat password akun..."
                className="w-full bg-[#F9DDBB]/45 border border-[#341D17]/20 rounded-xl px-4 py-3 text-[#341D17] placeholder:text-[#341D17]/45 focus:outline-none focus:ring-2 focus:ring-[#82882B]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#82882B] hover:bg-[#6E7322] text-white font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>DAFTAR SEBAGAI INSTRUCTOR</span>
              <span>→</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#341D17]/15 text-center text-xs space-y-1.5">
            <p className="text-[#341D17]/80">
              Sudah memiliki akun?{' '}
              <Link href="/login" className="font-bold text-[#802924] hover:underline">
                Login di sini
              </Link>
            </p>
            <p className="text-[11px] text-[#341D17]/70">
              <Link href="/" className="font-semibold text-[#82882B] hover:underline">
                ← Kembali ke Beranda Utama
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}