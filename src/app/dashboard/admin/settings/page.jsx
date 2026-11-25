'use client';

import { useState } from 'react';
import {
  FaBreadSlice,
  FaChevronRight,
  FaCheck,
  FaUsers,
  FaMinus,
  FaPlus,
  FaBullhorn,
  FaLock,
  FaShieldHalved,
  FaLaptop,
  FaMobileScreenButton,
  FaXmark,
  FaDownload,
  FaGlobe,
  FaClock,
} from 'react-icons/fa6';

export default function SettingsPage() {
  // State untuk mengontrol semua opsi pengaturan sistem
  const [autoApproval, setAutoApproval] = useState(false);
  const [studioCapacity, setStudioCapacity] = useState(20);
  const [deadline, setDeadline] = useState('14 Hari Kerja (Sourdough & Viennoiserie Lanjut)');
  const [waNotif, setWaNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [ovenReminder, setOvenReminder] = useState(true);
  const [language, setLanguage] = useState('id');
  const [timezone, setTimezone] = useState('WIB');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');

    try {
      // Simulasi penyimpanan data (bisa dihubungkan ke API /api/admin/settings)
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSuccessMsg('Konfigurasi sistem berhasil diperbarui dan disinkronkan ke atelier.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#341D17]/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-extrabold tracking-[0.2em] uppercase text-[#802924]">
            <span className="inline-flex items-center gap-1.5">
              <FaBreadSlice className="w-3 h-3 shrink-0" />
              <span>ATELIER OPERATIONS</span>
            </span>
            <FaChevronRight className="w-2.5 h-2.5 shrink-0" />
            <span>Konfigurasi</span>
          </div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17] mt-1">
            Pengaturan Sistem
          </h1>
          <p className="text-xs sm:text-sm text-[#341D17]/75 mt-1">
            Kelola konfigurasi platform, integrasi notifikasi verifikasi guru, dan preferensi server akademis YUGYO Atelier.
          </p>
        </div>

        {/* Status Sinkron Server */}
        <div className="bg-[#FFFDF9] border border-[#341D17]/15 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-2xs self-start sm:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-[#82882B] animate-pulse" />
          <div>
            <p className="text-xs font-bold text-[#341D17]">Sistem Sinkron</p>
            <p className="text-[10px] text-[#341D17]/60">Versi 4.2.1 &bull; Atelier Core Paris</p>
          </div>
          <span className="bg-[#F9DDBB]/50 text-[#802924] text-[10px] font-extrabold px-2.5 py-1 rounded-xl uppercase tracking-wider ml-2">
            Live Prod
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#82882B]/15 border border-[#82882B] text-[#82882B] text-xs font-bold flex items-center gap-2">
          <FaCheck className="w-3.5 h-3.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. KONFIGURASI PEMBELAJARAN */}
      <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-[#341D17]/10 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#F9DDBB]/50 flex items-center justify-center text-[#802924] shrink-0">
            <FaBreadSlice className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-editorial text-lg font-bold text-[#341D17]">Konfigurasi Pembelajaran</h2>
            <p className="text-xs text-[#341D17]/60">Standar &amp; Kurasi Resep Atelier</p>
          </div>
        </div>

        {/* Auto-Approval Kursus */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#F9DDBB]/20 border border-[#341D17]/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#341D17]">Auto-Approval Kursus</span>
              <span className="bg-[#802924]/15 text-[#802924] text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                Manual Diutamakan
              </span>
            </div>
            <p className="text-[11px] text-[#341D17]/70">
              Jika dinonaktifkan, setiap resep baru dan kurikulum pastry wajib melalui tinjauan panel Master Baker sebelum tayang ke siswa.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={autoApproval}
              onChange={(e) => setAutoApproval(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#341D17]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#802924]" />
          </label>
        </div>

        {/* Kapasitas Praktik Studio */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[#341D17]">
              Kapasitas Praktik Studio
            </label>
            <span className="text-[10px] font-bold text-[#82882B]">Ideal: 18–24</span>
          </div>
          <p className="text-[11px] text-[#341D17]/60">Batas maksimal murid per meja marmer &amp; stasiun oven</p>
          <div className="flex items-center gap-3 bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3">
            <FaUsers className="w-4 h-4 text-[#802924] shrink-0" />
            <span className="flex-1 text-xs font-bold text-[#341D17]">{studioCapacity} Peserta</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Kurangi Kapasitas Peserta"
                onClick={() => setStudioCapacity(Math.max(5, studioCapacity - 1))}
                className="w-8 h-8 rounded-xl bg-[#F9DDBB]/50 hover:bg-[#F9DDBB] text-[#341D17] font-bold text-xs flex items-center justify-center transition cursor-pointer"
              >
                <FaMinus className="w-3 h-3" />
              </button>
              <button
                type="button"
                aria-label="Tambah Kapasitas Peserta"
                onClick={() => setStudioCapacity(Math.min(40, studioCapacity + 1))}
                className="w-8 h-8 rounded-xl bg-[#F9DDBB]/50 hover:bg-[#F9DDBB] text-[#341D17] font-bold text-xs flex items-center justify-center transition cursor-pointer"
              >
                <FaPlus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Tenggang Penyerahan Hasil Uji Rasa */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#341D17]">
            Tenggang Penyerahan Hasil Uji Rasa
          </label>
          <p className="text-[11px] text-[#341D17]/60">
            Durasi fermentasi &amp; pengunggahan portofolio resep setelah modul materi selesai.
          </p>
          <select
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
          >
            <option value="7 Hari Kerja (Sourdough Dasar)">7 Hari Kerja (Sourdough Dasar)</option>
            <option value="14 Hari Kerja (Sourdough & Viennoiserie Lanjut)">14 Hari Kerja (Sourdough &amp; Viennoiserie Lanjut)</option>
            <option value="30 Hari Kerja (Masterclass Pâtisserie Penuh)">30 Hari Kerja (Masterclass Pâtisserie Penuh)</option>
          </select>
        </div>
      </div>

      {/* 2. PUSAT KOMUNIKASI & NOTIFIKASI */}
      <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-[#341D17]/10 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#F9DDBB]/50 flex items-center justify-center text-[#802924] shrink-0">
            <FaBullhorn className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-editorial text-lg font-bold text-[#341D17]">Pusat Komunikasi &amp; Notifikasi</h2>
            <p className="text-xs text-[#341D17]/60">Pengiriman Peringatan &amp; Log Atelier</p>
          </div>
        </div>

        {/* WhatsApp Verifikasi Chef */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#F9DDBB]/15 border border-[#341D17]/10">
          <div>
            <p className="text-xs font-bold text-[#341D17]">WhatsApp Verifikasi Chef Baru</p>
            <p className="text-[11px] text-[#341D17]/70">Kirim ringkasan dossier CV pengajar ke nomor darurat admin</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={waNotif}
              onChange={(e) => setWaNotif(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#341D17]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#802924]" />
          </label>
        </div>

        {/* Email Pengaduan Resep Gagal */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#F9DDBB]/15 border border-[#341D17]/10">
          <div>
            <p className="text-xs font-bold text-[#341D17]">Email Pengaduan Resep Gagal</p>
            <p className="text-[11px] text-[#341D17]/70">Pemberitahuan bila ada &gt;3 siswa melapor kendala gramatur ragi</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={emailNotif}
              onChange={(e) => setEmailNotif(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#341D17]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#802924]" />
          </label>
        </div>

        {/* Pengingat Jadwal Deck Oven Lab */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#F9DDBB]/15 border border-[#341D17]/10">
          <div>
            <p className="text-xs font-bold text-[#341D17]">Pengingat Jadwal Deck Oven Lab</p>
            <p className="text-[11px] text-[#341D17]/70">Alarm 45 menit sebelum pre-heating oven deck dimulai</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={ovenReminder}
              onChange={(e) => setOvenReminder(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#341D17]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#802924]" />
          </label>
        </div>
      </div>

      {/* 3. KEAMANAN & AKSES ADMIN */}
      <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-[#341D17]/10 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#802924]/15 flex items-center justify-center text-[#802924] shrink-0">
            <FaLock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-editorial text-lg font-bold text-[#341D17]">Keamanan &amp; Akses Admin</h2>
            <p className="text-xs text-[#341D17]/60">Sesi Aktif &amp; Kredensial Enkripsi</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F9DDBB]/20 border border-[#341D17]/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#82882B]/15 text-[#82882B] flex items-center justify-center shrink-0">
              <FaShieldHalved className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#341D17]">Otentikasi Dua Faktor (2FA)</p>
              <p className="text-[11px] text-[#341D17]/70">YubiKey / Google Authenticator Aktif</p>
            </div>
          </div>
          <span className="bg-[#82882B]/20 text-[#82882B] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
            Aktif
          </span>
        </div>

        {/* Sesi Terdaftar */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#341D17]">Sesi Terdaftar</span>
            <button type="button" className="text-xs font-bold text-[#802924] hover:underline cursor-pointer">
              Putuskan Sesi Lain
            </button>
          </div>

          <div className="bg-[#FFFDF9] border border-[#341D17]/10 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F9DDBB]/50 text-[#341D17] flex items-center justify-center shrink-0">
                <FaLaptop className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#341D17]">MacBook Pro 16&quot;</p>
                <p className="text-[10px] text-[#341D17]/60">Paris Atelier Lab &bull; IP 194.21.84.10</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#82882B] bg-[#82882B]/10 px-2.5 py-1 rounded-xl">
              Sesi Ini
            </span>
          </div>

          <div className="bg-[#FFFDF9] border border-[#341D17]/10 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F9DDBB]/50 text-[#341D17] flex items-center justify-center shrink-0">
                <FaMobileScreenButton className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#341D17]">Mobile App Atelier</p>
                <p className="text-[10px] text-[#341D17]/60">Jakarta Studio &bull; 2 Jam yang lalu</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Hapus Sesi Perangkat"
              className="w-7 h-7 rounded-full bg-[#802924]/10 hover:bg-[#802924] hover:text-[#F9DDBB] text-[#802924] flex items-center justify-center transition cursor-pointer"
            >
              <FaXmark className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Penyimpanan & Cadangan Resep */}
        <div className="pt-2">
          <div className="p-4 rounded-2xl bg-[#F9DDBB]/30 border border-[#341D17]/10 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-[#341D17]">Penyimpanan &amp; Cadangan Resep</p>
                <p className="text-[10px] text-[#341D17]/60">
                  Cadangan data mencakup 340 modul pastry, formula starter ragi, dan rekaman evaluasi master chef.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#802924] shrink-0">Encrypted Tar.gz</span>
            </div>
            <button
              type="button"
              className="w-full bg-[#FFFDF9] hover:bg-[#F9DDBB]/50 border border-[#341D17]/20 text-[#802924] font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FaDownload className="w-3.5 h-3.5 shrink-0" />
              <span>Unduh Cadangan Terakhir &bull; Kemarin 23:59</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. TAMPILAN & LOKALISASI */}
      <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-[#341D17]/10 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#F9DDBB]/50 flex items-center justify-center text-[#802924] shrink-0">
            <FaGlobe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-editorial text-lg font-bold text-[#341D17]">Tampilan &amp; Lokalisasi</h2>
            <p className="text-xs text-[#341D17]/60">Bahasa Instruksi &amp; Zona Waktu Dapur</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#341D17]">
            Bahasa Antarmuka Portal
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3 text-xs text-[#341D17] focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
          >
            <option value="id">Bahasa Indonesia (Standar Nusantara)</option>
            <option value="en">English (International Pâtisserie)</option>
            <option value="fr">Français (Traditional French)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#341D17]">
            Zona Waktu Jadwal Praktik Studio
          </label>
          <div className="flex items-center gap-3 bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl px-4 py-3">
            <FaClock className="w-4 h-4 text-[#802924] shrink-0" />
            <input
              type="text"
              readOnly
              value="WIT – Waktu Indonesia Tengah (GMT+9 • Makassar Atelier)"
              className="w-full bg-transparent text-xs font-bold text-[#341D17] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
        <button
          type="reset"
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#FFFDF9] hover:bg-[#F9DDBB]/50 border border-[#341D17]/20 text-[#341D17] font-bold text-xs transition cursor-pointer"
        >
          Batal / Reset
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-[#802924] hover:bg-[#661F1B] disabled:opacity-60 text-[#F9DDBB] font-bold text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <span>Menyimpan...</span>
          ) : (
            <>
              <FaCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Simpan Perubahan</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}