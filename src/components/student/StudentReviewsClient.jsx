'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const FEATURE_OPTIONS = [
  'Course & Video Player',
  'Schedule & Booking',
  'Chat Instructor',
  'Dashboard & Profil',
  'Lainnya',
];

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Rendah • Gangguan Ringan' },
  { value: 'medium', label: 'Sedang • Fitur Kurang Optimal' },
  { value: 'high', label: 'Tinggi • Fitur Tidak Berfungsi' },
  { value: 'critical', label: 'Kritis • Halaman Error / Terblokir' },
];

const DEFAULT_REPORT_HISTORY = [
  {
    id: 'rep-video-1',
    title: 'Video pemutaran sempat berhenti saat pindah resolusi',
    featureArea: 'Course & Video Player',
    severity: 'Sedang',
    reportedAt: '18 Nov 2026',
    status: 'Ditinjau',
    description:
      'Saat mengganti kualitas video di tengah modul praktik, pemutar sempat loading cukup lama sebelum kembali berjalan normal.',
    photoLabel: 'Screenshot Pemutar Video',
    photoCount: 1,
    photoUrl: '',
    adminReply: {
      name: 'Tim Teknis Yugyo',
      initials: 'YT',
      message:
        'Terima kasih atas laporannya. Buffering saat perpindahan stream video sedang kami optimalkan.',
    },
  },
  {
    id: 'rep-schedule-2',
    title: 'Konfirmasi jadwal kelas tampil dua kali setelah klik cepat',
    featureArea: 'Schedule & Booking',
    severity: 'Tinggi',
    reportedAt: '12 Nov 2026',
    status: 'Selesai',
    description:
      'Ketika tombol simpan jadwal ditekan berulang kali dengan cepat, notifikasi status muncul ganda pada tampilan jadwal.',
    photoLabel: 'Bukti Tampilan Jadwal',
    photoCount: 0,
    photoUrl: '',
    adminReply: null,
  },
];

function extractList(source, keys) {
  if (Array.isArray(source)) return source;
  if (source && typeof source === 'object') {
    for (const k of keys) {
      if (Array.isArray(source[k])) return source[k];
    }
  }
  return [];
}

export default function StudentReviewsClient(props = {}) {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const initialReports = useMemo(() => {
    const raw = extractList(props.reports ?? props.reviews ?? props, [
      'reports',
      'reviews',
      'history',
    ]);
    return raw.length > 0 ? raw : DEFAULT_REPORT_HISTORY;
  }, [props]);

  const [activeTab, setActiveTab] = useState('new');
  const [featureArea, setFeatureArea] = useState('Course & Video Player');
  const [severity, setSeverity] = useState('high');
  const [reportText, setReportText] = useState('');
  const [photos, setPhotos] = useState([]);
  const [reports, setReports] = useState(initialReports);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState('');

  const handleRemovePhoto = (photoId) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photos.length >= 3) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const cleanName =
        file.name.replace(/\.[^/.]+$/, '').slice(0, 24) || 'Bukti Error';
      setPhotos((prev) => {
        if (prev.length >= 3) return prev;
        return [
          ...prev,
          {
            id: `bug-photo-${Date.now()}`,
            caption: cleanName,
            url: reader.result,
          },
        ];
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const trimmed = reportText.trim();
    if (!trimmed) {
      setFeedbackBanner(
        'Tuliskan keluhan error atau bug yang Anda temukan terlebih dahulu.'
      );
      return;
    }

    setSubmitting(true);
    setFeedbackBanner('');

    const severityLabel =
      SEVERITY_OPTIONS.find((item) => item.value === severity)?.label.split(' • ')[0] ||
      'Sedang';

    const payload = {
      type: 'bug_report',
      featureArea,
      severity,
      description: trimmed,
      photos,
    };

    try {
      const res = await fetch('/api/student/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => null);

      const data = res && res.ok ? await res.json().catch(() => null) : null;
      const savedList = Array.isArray(data?.savedPhotos) ? data.savedPhotos : [];
      const resolvedPhotoUrl =
        savedList[0]?.url || data?.photoUrl || photos[0]?.url || '';
      const resolvedPhotoLabel =
        savedList[0]?.caption || photos[0]?.caption || 'Gambar Bukti Error';

      const newReportItem = {
        id: `rep-${Date.now()}`,
        title: `Keluhan pada ${featureArea}`,
        featureArea,
        severity: severityLabel,
        reportedAt: '23 Nov 2026',
        status: 'Baru Dikirim',
        description: trimmed,
        photoLabel: resolvedPhotoLabel,
        photoCount: savedList.length > 0 ? savedList.length : photos.length,
        photoUrl: resolvedPhotoUrl,
        adminReply: null,
      };

      setReports((prev) => [newReportItem, ...prev]);
      setReportText('');
      setPhotos([]);
      setFeedbackBanner(
        'Report error/bug berhasil dikirim dan foto disimpan ke folder public/pictures/reports.'
      );
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-[#341D17] pb-8">
      {/* HEADER HALAMAN REPORT */}
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F9DDBB]/75 border border-[#802924]/15 px-3 py-1 text-[11px] font-bold text-[#802924]">
          <span>&#9888;</span>
          <span>Atelier Bug &amp; Issue Report</span>
        </span>

        <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
          Report Error &amp; Keluhan Website
        </h1>
        <p className="text-xs sm:text-sm text-[#341D17]/65">
          Kirimkan laporan jika Anda menemukan error, bug tampilan, atau kendala saat menggunakan website Yugyo.
        </p>
      </div>

      {/* SWITCH MODE: BUAT REPORT BARU & RIWAYAT REPORT */}
      <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 p-1.5 grid grid-cols-2 gap-1.5 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('new')}
          className={`rounded-xl py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'new'
              ? 'bg-[#FAF6F0] text-[#341D17] border border-[#341D17]/12 shadow-2xs'
              : 'text-[#341D17]/65 hover:bg-[#FAF6F0]/60'
          }`}
        >
          <span>&#9998;</span>
          <span>Buat Report Baru</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`rounded-xl py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[#FAF6F0] text-[#341D17] border border-[#341D17]/12 shadow-2xs'
              : 'text-[#341D17]/65 hover:bg-[#FAF6F0]/60'
          }`}
        >
          <span>&#128337;</span>
          <span>Riwayat Report</span>
          <span className="rounded-full bg-[#341D17]/10 text-[#341D17]/75 text-[10px] font-extrabold px-2 py-0.5">
            {reports.length}
          </span>
        </button>
      </div>

      {feedbackBanner && (
        <div className="rounded-2xl bg-[#F9DDBB]/65 border border-[#802924]/25 px-4 py-3 text-xs sm:text-sm font-semibold text-[#802924] flex items-center justify-between gap-3">
          <span>{feedbackBanner}</span>
          <button
            type="button"
            onClick={() => setFeedbackBanner('')}
            className="text-xs font-bold underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* MODE 1: FORM REPORT ERROR / BUG */}
      {activeTab === 'new' && (
        <form
          onSubmit={handleSubmitReport}
          className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 p-5 sm:p-6 space-y-6 shadow-2xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F9DDBB]/80 border border-[#802924]/15 px-3 py-1 text-[11px] font-bold text-[#802924]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#802924] inline-block" />
              <span>Laporan Kendala Sistem</span>
            </span>

            <span className="text-[11px] font-semibold text-[#341D17]/55">
              Student Portal • Yugyo Atelier
            </span>
          </div>

          {/* PILIH BAGIAN / FITUR WEBSITE */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-bold text-[#341D17]">
                Bagian / Fitur yang Mengalami Error
              </span>
              <span className="text-[11px] text-[#341D17]/50">
                Pilih area terkait
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {FEATURE_OPTIONS.map((area) => {
                const active = featureArea === area;
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setFeatureArea(area)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      active
                        ? 'bg-[#802924] text-[#FFFDF9]'
                        : 'bg-[#FAF6F0] border border-[#341D17]/12 text-[#341D17]/75 hover:bg-[#F9DDBB]/45'
                    }`}
                  >
                    {area}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TINGKAT KEPARAHAN ERROR */}
          <div className="space-y-2">
            <label
              htmlFor="bug-severity-select"
              className="block text-xs sm:text-sm font-bold text-[#341D17]"
            >
              Tingkat Keluhan / Prioritas
            </label>
            <select
              id="bug-severity-select"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full rounded-xl border border-[#341D17]/15 bg-[#FAF6F0]/70 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#341D17] focus:border-[#802924] focus:outline-none"
            >
              {SEVERITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* DESKRIPSI KELUHAN ERROR / BUG */}
          <div className="space-y-2">
            <label
              htmlFor="student-bug-textarea"
              className="block text-xs sm:text-sm font-bold text-[#341D17]"
            >
              Keluhan Error atau Bug yang Ditemukan
            </label>

            <div className="rounded-2xl border border-[#802924]/25 bg-[#FAF6F0]/65 p-3.5 space-y-2 focus-within:border-[#802924]">
              <textarea
                id="student-bug-textarea"
                rows={4}
                maxLength={500}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Jelaskan error atau bug yang terjadi, halaman yang dibuka, dan apa yang muncul di layar..."
                className="w-full resize-none bg-transparent text-xs sm:text-sm text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none"
              />
              <div className="flex items-center justify-between gap-2 text-[11px] text-[#341D17]/50 pt-1 border-t border-[#341D17]/8">
                <span>Sertakan detail error agar mudah ditelusuri</span>
                <span>{reportText.length} / 500 Karakter</span>
              </div>
            </div>
          </div>

          {/* UPLOAD GAMBAR ERROR / BUG */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-bold text-[#341D17]">
                Upload Gambar Error / Bug
              </span>
              <span className="text-[11px] text-[#341D17]/50">
                {photos.length} / 3 Gambar Terunggah
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoFileChange}
              className="hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative rounded-2xl overflow-hidden border border-[#341D17]/12 bg-[#FAF6F0] aspect-4/3"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    aria-label={`Hapus gambar ${photo.caption}`}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#2A1712]/75 hover:bg-[#802924] text-white text-xs font-bold flex items-center justify-center transition cursor-pointer"
                  >
                    &times;
                  </button>
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-[#2A1712]/75 via-[#2A1712]/30 to-transparent px-3 py-2">
                    <p className="text-[11px] font-semibold text-white truncate">
                      {photo.caption}
                    </p>
                  </div>
                </div>
              ))}

              {photos.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border border-dashed border-[#341D17]/25 bg-[#FAF6F0]/70 hover:bg-[#F9DDBB]/45 aspect-4/3 flex flex-col items-center justify-center gap-1.5 text-[#341D17]/65 transition cursor-pointer"
                >
                  <span className="text-xl">&#128247;</span>
                  <span className="text-xs font-semibold">Upload Gambar Bug</span>
                </button>
              )}
            </div>
          </div>

          {/* TOMBOL KIRIM REPORT */}
          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#802924] hover:bg-[#661F1B] py-3 px-5 text-xs sm:text-sm font-bold text-[#FFFDF9] flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
            >
              <span>&#9888;</span>
              <span>{submitting ? 'Mengirim Report...' : 'Kirim Report Error'}</span>
            </button>
            <p className="text-center text-[11px] text-[#341D17]/50">
              Laporan beserta gambar bukti error akan disimpan ke folder public/pictures/reports.
            </p>
          </div>
        </form>
      )}

      {/* MODE 2: RIWAYAT REPORT SAYA */}
      {activeTab === 'history' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
                Riwayat Report Saya
              </h2>
              <span className="rounded-full bg-[#F9DDBB]/75 px-2.5 py-0.5 text-[11px] font-bold text-[#802924]">
                {reports.length} Laporan
              </span>
            </div>
          </div>

          <div className="space-y-3.5">
            {reports.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 p-5 space-y-3.5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <h3 className="text-sm sm:text-base font-bold text-[#341D17]">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#341D17]/55">
                      {item.featureArea} &bull; Prioritas {item.severity} &bull;{' '}
                      {item.reportedAt}
                    </p>
                  </div>

                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#F9DDBB]/80 border border-[#802924]/20 px-2.5 py-1 text-[11px] font-bold text-[#802924]">
                    <span>{item.status || 'Tercatat'}</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm leading-relaxed text-[#341D17]/80">
                  {item.description}
                </p>

                {item.photoUrl && (
                  <div className="rounded-2xl bg-[#FAF6F0] border border-[#341D17]/8 p-2.5 flex items-center gap-3">
                    <img
                      src={item.photoUrl}
                      alt={item.photoLabel || 'Bukti gambar error'}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#341D17]/10"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#341D17] truncate">
                        {item.photoLabel || 'Bukti Gambar Error'}
                      </p>
                      <p className="text-[11px] text-[#341D17]/55">
                        {item.photoCount || 1} Gambar error dilampirkan
                      </p>
                    </div>
                  </div>
                )}

                {item.adminReply && (
                  <div className="rounded-2xl bg-[#FAF6F0] border-l-2 border-[#802924] p-3.5 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#802924] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
                        {item.adminReply.initials || 'YT'}
                      </span>
                      <span className="text-xs font-bold text-[#341D17]">
                        {item.adminReply.name}
                      </span>
                      <span className="rounded bg-[#F9DDBB] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#802924]">
                        RESPON
                      </span>
                    </div>
                    <p className="text-xs text-[#341D17]/75 pl-8">
                      &ldquo;{item.adminReply.message}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}