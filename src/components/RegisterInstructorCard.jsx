'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CATEGORY_META = {
  'Bread & Yeast Goods': {
    subtitle: 'Sourdough, Shokupan, Focaccia',
    icon: '🍞',
  },
  'Cake Decorating': {
    subtitle: 'Buttercream, Bento Cake, Fondant',
    icon: '🎂',
  },
  'Cookies & Small Bites': {
    subtitle: 'Nastar, Cookies, Brownies',
    icon: '🍪',
  },
  'French Pâtisserie & Pastry': {
    subtitle: 'Croissant, Macarons, Choux, Opera',
    icon: '🥐',
  },
  'Traditional Indonesian Cakes': {
    subtitle: 'Lapis Legit, Spiku, Klepon',
    icon: '🥮',
  },
};

export default function RegisterInstructorCard({ categories = [] }) {
  const router = useRouter();

  const specialtyOptions =
    categories.length > 0
      ? categories.map((cat) => ({
          id: String(cat.id),
          title: cat.name,
          subtitle: CATEGORY_META[cat.name]?.subtitle || 'Kurikulum YUGYO Atelier',
          icon: CATEGORY_META[cat.name]?.icon || '👨‍🍳',
        }))
      : Object.entries(CATEGORY_META).map(([title, meta], idx) => ({
          id: String(idx + 1),
          title,
          subtitle: meta.subtitle,
          icon: meta.icon,
        }));

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState(
    specialtyOptions.length > 0 ? [specialtyOptions[0].title] : []
  );
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleSpecialization = (title) => {
    setSelectedSpecs((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (selectedSpecs.length === 0) {
      setErrorMsg('Pilih minimal 1 spesialisasi baking utama.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Kata sandi minimal harus 8 karakter.');
      return;
    }

    if (!agreed) {
      setErrorMsg('Harap centang pernyataan keaslian resep dan standar pengajaran.');
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
          role: 'teacher',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Pendaftaran pengajar gagal.');
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
    <div className="fixed inset-0 z-50 bg-[#341D17]/35 backdrop-blur-[2px] overflow-y-auto flex items-start justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-2xl bg-[#FFFDF9] rounded-3xl shadow-2xl border border-[#341D17]/20 overflow-hidden">
        
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
              <span>Kembali ke Halaman Masuk</span>
            </Link>

            <span className="inline-flex items-center gap-1.5 bg-[#341D17] text-[#F9DDBB] px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase">
              ATELIER PORTAL
            </span>
          </div>

          {/* Header & Banner Foto Fakultas Master Patisserie */}
          <div className="space-y-2.5">
            <span className="inline-flex items-center gap-1.5 bg-[#F9DDBB] text-[#802924] border border-[#802924]/25 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase">
              <span>⏳</span> INSTRUCTOR (PENDING VERIFICATION)
            </span>

            <h1 className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17] leading-tight">
              Daftar sebagai Pengajar / Chef Instructor
            </h1>
            <p className="text-xs text-[#341D17]/75 leading-relaxed">
              Bagikan kepiawaian seni viennoiserie, artisan sourdough, dan pâtisserie Anda kepada ribuan calon baker di seluruh nusantara.
            </p>

            {/* Panoramic Banner */}
            <div className="relative h-28 sm:h-36 rounded-2xl overflow-hidden border border-[#341D17]/15 bg-[#341D17]">
              <img
                src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85"
                alt="Fakultas Master Patisserie YUGYO"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#341D17]/85 via-[#341D17]/20 to-transparent" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2 text-[#F9DDBB] text-xs font-bold">
                <span>🏅</span>
                <span>Fakultas Master Pâtisserie YUGYO</span>
              </div>
            </div>
          </div>

          {/* Notice Verifikasi Kurikulum */}
          <div className="bg-[#F9DDBB]/45 border border-[#802924]/25 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#802924] text-[#F9DDBB] flex items-center justify-center shrink-0 text-xs mt-0.5">
              🛡️
            </div>
            <div className="text-[11px] leading-relaxed text-[#341D17]/85">
              <p className="font-extrabold text-[#802924] text-xs mb-0.5">
                Pemberitahuan Verifikasi Kurikulum
              </p>
              <p>
                <strong>Catatan:</strong> Akun Pengajar yang baru mendaftar akan berstatus <em>Pending</em> dan memerlukan persetujuan (approval) Admin sebelum dapat menerbitkan kursus. Selama menunggu, Anda tetap dapat mengakses platform sebagai Student.
              </p>
            </div>
          </div>

          {/* Switch Banner ke Student */}
          <div className="bg-white border border-[#341D17]/10 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2.5 text-xs text-[#341D17]/80">
              <span className="w-7 h-7 rounded-lg bg-[#82882B]/15 text-[#82882B] flex items-center justify-center text-xs">
                📖
              </span>
              <span>Hanya ingin belajar resep pastry?</span>
            </div>
            <Link
              href="/register/student"
              className="text-xs font-extrabold text-[#802924] hover:underline"
            >
              Daftar sebagai Siswa di sini →
            </Link>
          </div>

          {/* Form Pengajar */}
          <form
            onSubmit={handleRegister}
            className="bg-white border border-[#341D17]/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs"
          >
            {errorMsg && (
              <div className="p-3 rounded-xl bg-[#802924]/15 border border-[#802924] text-[#802924] text-xs font-bold text-center">
                {errorMsg}
              </div>
            )}

            {/* Nama Lengkap & Gelar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#341D17]">Nama Lengkap &amp; Gelar</label>
                <span className="text-[10px] text-[#802924] font-semibold">
                  Contoh: Chef Pierre Hermé, Diplôme
                </span>
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
                  placeholder="Nama lengkap beserta titel chef (opsional)"
                  className="w-full bg-[#F9DDBB]/30 border border-[#341D17]/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
                />
              </div>
            </div>

            {/* Username Pengajar & Alamat Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#341D17] mb-1">
                  Username Pengajar
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/50 text-xs font-bold">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="chef.bakery"
                    className="w-full bg-[#F9DDBB]/30 border border-[#341D17]/15 rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#341D17] mb-1">
                  Alamat Email
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
                    placeholder="instructor@yugyo.com"
                    className="w-full bg-[#F9DDBB]/30 border border-[#341D17]/15 rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
                  />
                </div>
              </div>
            </div>

            {/* Nomor WhatsApp Aktif */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#341D17]">Nomor WhatsApp Aktif</label>
                <span className="text-[10px] text-[#341D17]/50">Untuk koordinasi kurikulum &amp; studio</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/45 text-xs">
                  📞
                </span>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+62 812-3456-7890"
                  className="w-full bg-[#F9DDBB]/30 border border-[#341D17]/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
                />
              </div>
            </div>

            {/* Spesialisasi Baking Utama (Sinkron dengan Tabel categories Database) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#341D17]">Spesialisasi Baking Utama</label>
                <span className="text-[10px] font-semibold text-[#802924]">Pilih minimal 1 keahlian</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {specialtyOptions.map((spec) => {
                  const active = selectedSpecs.includes(spec.title);
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => toggleSpecialization(spec.title)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                        active
                          ? 'bg-[#F9DDBB]/55 border-[#802924] shadow-2xs'
                          : 'bg-[#FFFDF9] border-[#341D17]/15 hover:border-[#802924]/50'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                          active
                            ? 'bg-[#802924] text-[#F9DDBB]'
                            : 'bg-[#F9DDBB]/60 text-[#341D17]'
                        }`}
                      >
                        {active ? '✓' : spec.icon}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#341D17] leading-tight">{spec.title}</p>
                        <p className="text-[10px] text-[#341D17]/65 mt-0.5">{spec.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Portofolio / Tautan Sertifikasi */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#341D17]">Portofolio / Tautan Sertifikasi</label>
                <span className="text-[10px] text-[#802924] font-semibold">Instagram pastry / Drive PDF</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/45 text-xs">
                  🔗
                </span>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://instagram.com/chef_bakes atau tautan portfolio"
                  className="w-full bg-[#F9DDBB]/30 border border-[#341D17]/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
                />
              </div>
              <p className="text-[10px] text-[#341D17]/60 mt-1">
                Admin kurikulum YUGYO akan memvalidasi portofolio atau sertifikat institusi kuliner Anda dalam 1×24 jam kerja.
              </p>
            </div>

            {/* Kata Sandi Akun */}
            <div>
              <label className="block text-xs font-bold text-[#341D17] mb-1">
                Kata Sandi Akun
              </label>
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
                  placeholder="Minimal 8 karakter kombinasi huruf & angka"
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

            {/* Checkbox Pernyataan */}
            <label className="flex items-start gap-2.5 pt-1 cursor-pointer text-[11px] text-[#341D17]/80">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded accent-[#802924]"
              />
              <span>
                Saya menyatakan keaslian resep, teknik, dan kredensial yang diajukan serta menyetujui standar pengajaran etis{' '}
                <strong className="text-[#341D17]">YUGYO Baking Atelier</strong>.
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#802924] hover:bg-[#661F1B] disabled:opacity-60 text-[#F9DDBB] font-bold text-xs sm:text-sm py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>📋</span>
              <span>{isLoading ? 'Mengajukan Pendaftaran...' : 'Ajukan Pendaftaran Pengajar'}</span>
            </button>

            <p className="text-center text-[10px] text-[#341D17]/55 flex items-center justify-center gap-1.5">
              <span>🔒</span>
              <span>Enkripsi data pribadi berstandar atelier kuliner profesional</span>
            </p>
          </form>

        </div>
      </div>
    </div>
  );
}