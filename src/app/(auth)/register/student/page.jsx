// =====================================================================
// YUGYO - Student Registration Page (Strict 4-Color Bakery Palette)
// File: src/app/(auth)/register/student/page.jsx
// Palette: #F9DDBB (Cream), #802924 (Cocoa Red), #341D17 (Dark Choc), #82882B (Pistachio)
// =====================================================================

import Link from 'next/link';
import pool from '@/lib/db';
import { redirect } from 'next/navigation';

async function registerStudentAction(formData) {
  'use server';

  const fullName = formData.get('full_name')?.toString().trim();
  const email = formData.get('email')?.toString().trim().toLowerCase();
  const password = formData.get('password')?.toString();

  if (!fullName || !email || !password) return;

  try {
    await pool.query(
      `INSERT INTO users (full_name, email, password, role)
       VALUES ($1, $2, $3, 'student');`,
      [fullName, email, password]
    );
  } catch (err) {
    console.error('Error registering student:', err);
    redirect('/register/student?error=email_exists');
  }

  redirect('/login?registered=true');
}

export default async function RegisterStudentPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const hasError = resolvedSearchParams?.error === 'email_exists';

  return (
    <div className="min-h-screen bg-[#F9DDBB] flex items-center justify-center p-4 md:p-6 text-[#341D17]">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border-2 border-[#341D17]/15">
        
        {/* ================= PANEL KIRI: COCOA RED (#802924) ================= */}
        <div className="bg-[#802924] text-[#F9DDBB] p-8 md:p-10 flex flex-col justify-between">
          <div>
            <div className="mb-7 flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F9DDBB] bg-[#341D17]/40 hover:bg-[#341D17]/70 px-4 py-2 rounded-full transition"
              >
                <span>←</span> Kembali ke Login
              </Link>
            </div>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-full bg-[#341D17] text-[#F9DDBB] flex items-center justify-center font-editorial font-extrabold text-sm shadow">
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
              STUDENT ACCOUNT
            </span>

            <h1 className="font-editorial text-2xl md:text-3xl font-bold mb-2.5 leading-snug text-[#F9DDBB]">
              Mulai Perjalanan Baking Anda
            </h1>
            <p className="text-xs text-[#F9DDBB]/85 leading-relaxed">
              Daftarkan akun siswa untuk menyimpan progres belajar, mengikuti kelas terjadwal maupun lifetime, dan meraih sertifikat atelier.
            </p>
          </div>

          {/* Kartu Aksen Cream & Dark Choc */}
          <div className="my-6 bg-[#F9DDBB] text-[#341D17] rounded-2xl p-4 shadow-md">
            <p className="text-xs font-extrabold">Ingin mengajar sebagai Chef?</p>
            <Link
              href="/register/instructor"
              className="inline-block mt-1 text-[11px] font-bold text-[#802924] hover:underline"
            >
              Pindah ke Pendaftaran Instructor →
            </Link>
          </div>

          <p className="text-[11px] text-[#F9DDBB]/75">
            YUGYO Baking Atelier • Kurikulum Sourdough, Viennoiserie &amp; Pâtisserie
          </p>
        </div>

        {/* ================= PANEL KANAN: FORM REGISTER STUDENT ================= */}
        <div className="p-8 md:p-10 flex flex-col justify-center bg-[#FFFDF9] text-[#341D17]">
          <div className="text-center mb-6">
            <span className="inline-block bg-[#341D17] text-[#F9DDBB] text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-2">
              CREATE STUDENT ACCOUNT
            </span>
            <h2 className="font-editorial text-2xl font-bold text-[#341D17]">
              Daftar Akun Siswa
            </h2>
            <p className="text-xs text-[#341D17]/70 mt-1">
              Lengkapi data diri Anda di bawah ini
            </p>
          </div>

          {hasError && (
            <div className="mb-4 p-3 rounded-xl bg-[#802924]/15 border border-[#802924] text-[#802924] text-xs font-semibold text-center">
              Email sudah terdaftar. Silakan gunakan email lain atau langsung masuk.
            </div>
          )}

          <form action={registerStudentAction} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold mb-1.5 text-[#341D17]">Nama Lengkap *</label>
              <input
                type="text"
                name="full_name"
                required
                placeholder="Contoh: Nurhayu Fiantika Gafar"
                className="w-full bg-[#F9DDBB]/45 border border-[#341D17]/20 rounded-xl px-4 py-3 text-[#341D17] placeholder:text-[#341D17]/45 focus:outline-none focus:ring-2 focus:ring-[#802924]"
              />
            </div>

            <div>
              <label className="block font-bold mb-1.5 text-[#341D17]">Email *</label>
              <input
                type="email"
                name="email"
                required
                placeholder="nama@email.com"
                className="w-full bg-[#F9DDBB]/45 border border-[#341D17]/20 rounded-xl px-4 py-3 text-[#341D17] placeholder:text-[#341D17]/45 focus:outline-none focus:ring-2 focus:ring-[#802924]"
              />
            </div>

            <div>
              <label className="block font-bold mb-1.5 text-[#341D17]">Password *</label>
              <input
                type="password"
                name="password"
                required
                placeholder="Buat password akun..."
                className="w-full bg-[#F9DDBB]/45 border border-[#341D17]/20 rounded-xl px-4 py-3 text-[#341D17] placeholder:text-[#341D17]/45 focus:outline-none focus:ring-2 focus:ring-[#802924]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>DAFTAR SEBAGAI STUDENT</span>
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