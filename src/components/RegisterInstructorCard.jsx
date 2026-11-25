'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FaChevronLeft,
  FaXmark,
  FaArrowLeft,
  FaArrowRight,
  FaHourglassHalf,
  FaAward,
  FaShieldHalved,
  FaBookOpen,
  FaIdCard,
  FaEnvelope,
  FaPhone,
  FaBreadSlice,
  FaCakeCandles,
  FaCookieBite,
  FaUtensils,
  FaCheck,
  FaLink,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaClipboardList,
  FaCircleCheck,
} from 'react-icons/fa6';

const CATEGORY_META = {
  'Bread & Yeast Goods': {
    subtitle: 'Sourdough, Shokupan, Focaccia',
    Icon: FaBreadSlice,
  },
  'Cake Decorating': {
    subtitle: 'Buttercream, Bento Cake, Fondant',
    Icon: FaCakeCandles,
  },
  'Cookies & Small Bites': {
    subtitle: 'Nastar, Cookies, Brownies',
    Icon: FaCookieBite,
  },
  'French Pâtisserie & Pastry': {
    subtitle: 'Croissant, Macarons, Choux, Opera',
    Icon: FaCakeCandles,
  },
  'Traditional Indonesian Cakes': {
    subtitle: 'Lapis Legit, Spiku, Klepon',
    Icon: FaUtensils,
  },
};

function toTitleCase(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function RegisterInstructorCard({ categories = [] }) {
  const specialtyOptions =
    categories.length > 0
      ? categories.map((cat) => ({
          id: String(cat.id),
          title: cat.name,
          subtitle:
            CATEGORY_META[cat.name]?.subtitle || 'Kurikulum YUGYO Atelier',
          Icon: CATEGORY_META[cat.name]?.Icon || FaUtensils,
        }))
      : Object.entries(CATEGORY_META).map(([title, meta], idx) => ({
          id: String(idx + 1),
          title,
          subtitle: meta.subtitle,
          Icon: meta.Icon,
        }));

  const defaultSpec =
    specialtyOptions.length > 0 ? [specialtyOptions[0].title] : [];

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState(defaultSpec);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleSpecialization = (title) => {
    setSelectedSpecs((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanFullName = toTitleCase(fullName);
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (cleanFullName.length < 2) {
      setErrorMsg('Nama lengkap minimal 2 karakter.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Format alamat email tidak valid.');
      return;
    }

    if (selectedSpecs.length === 0) {
      setErrorMsg('Pilih minimal 1 spesialisasi baking utama.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Kata sandi minimal harus 8 karakter.');
      return;
    }

    if (!agreed) {
      setErrorMsg(
        'Harap centang pernyataan keaslian resep dan standar pengajaran.'
      );
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: cleanFullName,
          username: String(username || '').trim(),
          email: cleanEmail,
          whatsapp: String(whatsapp || '').trim(),
          specialty: selectedSpecs.join(', '),
          portfolioUrl: String(portfolioUrl || '').trim(),
          password,
          role: 'teacher',
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
            `Pendaftaran pengajar gagal (kode status ${res.status}).`
        );
        setIsLoading(false);
        return;
      }

      setFullName('');
      setUsername('');
      setEmail('');
      setWhatsapp('');
      setSelectedSpecs(defaultSpec);
      setPortfolioUrl('');
      setPassword('');
      setAgreed(false);
      setShowPass(false);

      setSuccessMsg('Akun telah terdaftar!');
      setIsLoading(false);
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi ke server.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#341D17]/35 backdrop-blur-[2px] overflow-y-auto flex items-start justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-2xl bg-[#FFFDF9] rounded-3xl shadow-2xl border border-[#341D17]/20 overflow-hidden">
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
              <span>Kembali ke Halaman Masuk</span>
            </Link>

            <span className="inline-flex items-center gap-1.5 bg-[#341D17] text-[#F9DDBB] px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase">
              ATELIER PORTAL
            </span>
          </div>

          <div className="space-y-2.5">
            <span className="inline-flex items-center gap-1.5 bg-[#F9DDBB] text-[#802924] border border-[#802924]/25 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase">
              <FaHourglassHalf className="w-3 h-3 shrink-0" />
              <span>INSTRUCTOR (PENDING VERIFICATION)</span>
            </span>

            <h1 className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17] leading-tight">
              Daftar sebagai Pengajar / Chef Instructor
            </h1>
            <p className="text-xs text-[#341D17]/75 leading-relaxed">
              Bagikan kepiawaian seni viennoiserie, artisan sourdough, dan pâtisserie Anda kepada ribuan calon baker di seluruh nusantara.
            </p>

            <div className="relative h-28 sm:h-36 rounded-2xl overflow-hidden border border-[#341D17]/15 bg-[#341D17]">
              <img
                src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85"
                alt="Fakultas Master Patisserie YUGYO"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#341D17]/85 via-[#341D17]/20 to-transparent" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2 text-[#F9DDBB] text-xs font-bold">
                <FaAward className="w-3.5 h-3.5 shrink-0" />
                <span>Fakultas Master Pâtisserie YUGYO</span>
              </div>
            </div>
          </div>

          <div className="bg-[#F9DDBB]/45 border border-[#802924]/25 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#802924] text-[#F9DDBB] flex items-center justify-center shrink-0 mt-0.5">
              <FaShieldHalved className="w-3.5 h-3.5" />
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

          <div className="bg-white border border-[#341D17]/10 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2.5 text-xs text-[#341D17]/80">
              <span className="w-7 h-7 rounded-lg bg-[#82882B]/15 text-[#4E5317] flex items-center justify-center">
                <FaBookOpen className="w-3.5 h-3.5" />
              </span>
              <span>Hanya ingin belajar resep pastry?</span>
            </div>
            <Link
              href="/register/student"
              className="inline-flex items-center gap-1 text-xs font-extrabold text-[#802924] hover:underline"
            >
              <span>Daftar sebagai Siswa di sini</span>
              <FaArrowRight className="w-2.5 h-2.5 inline" />
            </Link>
          </div>

          <form
            onSubmit={handleRegister}
            noValidate
            className="bg-white border border-[#341D17]/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs"
          >
            {errorMsg && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-[#802924]/15 border border-[#802924] text-[#802924] text-xs font-bold text-center"
              >
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div
                role="status"
                className="p-3.5 rounded-xl bg-[#82882B]/15 border border-[#82882B] text-[#2F330D] text-xs font-bold flex items-center gap-2"
              >
                <FaCircleCheck className="w-4 h-4 text-[#82882B] shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="instructor-reg-fullname"
                  className="text-xs font-bold text-[#341D17]"
                >
                  Nama Lengkap &amp; Gelar
                </label>
                <span className="text-[10px] text-[#802924] font-semibold">
                  Contoh: Chef Pierre Hermé, Diplôme
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/45">
                  <FaIdCard className="w-3.5 h-3.5" />
                </span>
                <input
                  id="instructor-reg-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => setFullName((prev) => toTitleCase(prev))}
                  placeholder="Nama lengkap beserta titel chef (opsional)"
                  className="w-full bg-[#F9DDBB]/30 border border-[#341D17]/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="instructor-reg-username"
                  className="block text-xs font-bold text-[#341D17] mb-1"
                >
                  Username Pengajar
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/50 text-xs font-bold">
                    @
                  </span>
                  <input
                    id="instructor-reg-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="chef.bakery"
                    className="w-full bg-[#F9DDBB]/30 border border-[#341D17]/15 rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="instructor-reg-email"
                  className="block text-xs font-bold text-[#341D17] mb-1"
                >
                  Alamat Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/45">
                    <FaEnvelope className="w-3.5 h-3.5" />
                  </span>
                  <input
                    id="instructor-reg-email"
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

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="instructor-reg-whatsapp"
                  className="text-xs font-bold text-[#341D17]"
                >
                  Nomor WhatsApp Aktif
                </label>
                <span className="text-[10px] text-[#341D17]/50">
                  Untuk koordinasi kurikulum &amp; studio
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/45">
                  <FaPhone className="w-3.5 h-3.5" />
                </span>
                <input
                  id="instructor-reg-whatsapp"
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+62 812-3456-7890"
                  className="w-full bg-[#F9DDBB]/30 border border-[#341D17]/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#341D17]">
                  Spesialisasi Baking Utama
                </span>
                <span className="text-[10px] font-semibold text-[#802924]">
                  Pilih minimal 1 keahlian
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {specialtyOptions.map((spec) => {
                  const active = selectedSpecs.includes(spec.title);
                  const SpecIcon = spec.Icon;
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
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          active
                            ? 'bg-[#802924] text-[#F9DDBB]'
                            : 'bg-[#F9DDBB]/60 text-[#341D17]'
                        }`}
                      >
                        {active ? (
                          <FaCheck className="w-3 h-3" />
                        ) : (
                          <SpecIcon className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#341D17] leading-tight">
                          {spec.title}
                        </p>
                        <p className="text-[10px] text-[#341D17]/65 mt-0.5">
                          {spec.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="instructor-reg-portfolio"
                  className="text-xs font-bold text-[#341D17]"
                >
                  Portofolio / Tautan Sertifikasi
                </label>
                <span className="text-[10px] text-[#802924] font-semibold">
                  Instagram pastry / Drive PDF
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/45">
                  <FaLink className="w-3.5 h-3.5" />
                </span>
                <input
                  id="instructor-reg-portfolio"
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

            <div>
              <label
                htmlFor="instructor-reg-password"
                className="block text-xs font-bold text-[#341D17] mb-1"
              >
                Kata Sandi Akun
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-[#341D17]/45">
                  <FaLock className="w-3.5 h-3.5" />
                </span>
                <input
                  id="instructor-reg-password"
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
                  aria-label={
                    showPass ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'
                  }
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#802924] hover:bg-[#661F1B] disabled:opacity-60 text-[#F9DDBB] font-bold text-xs sm:text-sm py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FaClipboardList className="w-4 h-4 shrink-0" />
              <span>
                {isLoading
                  ? 'Mengajukan Pendaftaran...'
                  : 'Ajukan Pendaftaran Pengajar'}
              </span>
            </button>

            <p className="text-center text-[10px] text-[#341D17]/55 flex items-center justify-center gap-1.5">
              <FaLock className="w-3 h-3 shrink-0" />
              <span>
                Enkripsi data pribadi berstandar atelier kuliner profesional
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}