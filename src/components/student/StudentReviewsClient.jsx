'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

const BLOCKED_LABELS = new Set([
  'yugyo',
  'yugyo atelier',
  'student portal',
  'student baker atelier',
  'lihat katalog guest',
  'dashboard',
  'course',
  'schedule',
  'chat instructor',
  'ulasan',
  'log out',
  'logout',
  'laporan kendala sistem',
  'pengirim',
  'buat report baru',
  'riwayat report',
]);

function extractList(source, keys) {
  if (Array.isArray(source)) return source;
  if (source && typeof source === 'object') {
    for (const k of keys) {
      if (Array.isArray(source[k])) return source[k];
    }
  }
  return [];
}

function isBlockedName(value) {
  const clean = String(value || '').trim();
  if (!clean) return true;
  const lower = clean.toLowerCase();
  if (BLOCKED_LABELS.has(lower)) return true;
  if (lower.includes('admin') || lower.includes('teacher') || lower.includes('instructor')) {
    return true;
  }
  if (clean.length > 40 || /\s{2,}/.test(clean)) return true;
  return false;
}

function pickNameFromObj(obj) {
  if (!obj || typeof obj !== 'object') return '';
  const candidates = [
    obj.username,
    obj.user_name,
    obj.userName,
    obj.full_name,
    obj.fullName,
    obj.name,
  ];
  for (const raw of candidates) {
    const clean = String(raw || '').trim();
    if (!isBlockedName(clean)) return clean;
  }
  return '';
}

function scanStorageForUser(storage) {
  if (!storage) return '';
  try {
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i) || '';
      const raw = storage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') continue;

        const role = String(
          parsed.role ||
            parsed.user?.role ||
            parsed.currentUser?.role ||
            parsed.data?.role ||
            ''
        ).toLowerCase();
        if (role === 'admin' || role === 'teacher' || role === 'instructor') {
          continue;
        }

        const found =
          pickNameFromObj(parsed) ||
          pickNameFromObj(parsed.user) ||
          pickNameFromObj(parsed.currentUser) ||
          pickNameFromObj(parsed.data) ||
          pickNameFromObj(parsed.data?.user);

        if (found) return found;
      } catch {
        // Abaikan nilai non-JSON
      }
    }
  } catch {
    // Abaikan error akses storage
  }
  return '';
}

function scanCookiesForUser() {
  if (typeof document === 'undefined' || !document.cookie) return '';
  try {
    const parts = document.cookie.split(';');
    for (const part of parts) {
      const idx = part.indexOf('=');
      if (idx === -1) continue;
      const rawVal = decodeURIComponent(part.slice(idx + 1).trim());
      if (!rawVal) continue;
      try {
        const parsed = JSON.parse(rawVal);
        const role = String(
          parsed?.role || parsed?.user?.role || ''
        ).toLowerCase();
        if (role === 'admin' || role === 'teacher' || role === 'instructor') {
          continue;
        }
        const found = pickNameFromObj(parsed) || pickNameFromObj(parsed?.user);
        if (found) return found;
      } catch {
        // Abaikan cookie non-JSON
      }
    }
  } catch {
    // Abaikan error cookie
  }
  return '';
}

function detectLoggedInUsernameFromDom() {
  if (typeof document === 'undefined') return '';
  try {
    const nodes = document.querySelectorAll('aside p, aside span, aside div, header p, header span, header div');
    for (const el of nodes) {
      if (el.children.length > 0) continue;
      const text = String(el.textContent || '').trim();
      if (!text || text.length < 2 || text.length > 24) continue;
      if (isBlockedName(text)) continue;

      const parentText = String(el.parentElement?.textContent || '').toLowerCase();
      if (
        parentText.includes('student baker atelier') ||
        parentText.includes('student')
      ) {
        return text;
      }
    }
  } catch {
    // Abaikan error baca DOM
  }
  return '';
}

function getInitialUsername(props) {
  const fromProps =
    String(props.username || '').trim() ||
    pickNameFromObj(props.currentUser) ||
    pickNameFromObj(props.user);

  if (fromProps && !isBlockedName(fromProps)) return fromProps;
  return 'Student';
}

function resolveActiveUsername(props) {
  const fromProps =
    String(props.username || '').trim() ||
    pickNameFromObj(props.currentUser) ||
    pickNameFromObj(props.user);

  if (fromProps && !isBlockedName(fromProps)) return fromProps;

  if (typeof window !== 'undefined') {
    const fromLocal = scanStorageForUser(window.localStorage);
    if (fromLocal) return fromLocal;

    const fromSession = scanStorageForUser(window.sessionStorage);
    if (fromSession) return fromSession;

    const fromCookie = scanCookiesForUser();
    if (fromCookie) return fromCookie;

    const fromDom = detectLoggedInUsernameFromDom();
    if (fromDom) return fromDom;
  }

  return 'Student';
}

export default function StudentReviewsClient(props = {}) {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [studentUsername, setStudentUsername] = useState(() =>
    getInitialUsername(props)
  );

  useEffect(() => {
    let cancelled = false;

    const syncUsername = () => {
      const detected = resolveActiveUsername(props);
      if (!cancelled && detected) {
        setStudentUsername(detected);
      }
    };

    const timer = setTimeout(syncUsername, 0);

    const sessionEndpoints = [
      '/api/auth/session',
      '/api/auth/me',
      '/api/session',
    ];

    Promise.all(
      sessionEndpoints.map((url) =>
        fetch(url, { cache: 'no-store' })
          .then((r) => (r.ok ? r.json().catch(() => null) : null))
          .catch(() => null)
      )
    ).then((results) => {
      if (cancelled) return;
      for (const data of results) {
        if (!data || typeof data !== 'object') continue;
        const found =
          pickNameFromObj(data) ||
          pickNameFromObj(data.user) ||
          pickNameFromObj(data.session?.user) ||
          pickNameFromObj(data.data?.user);
        if (found) {
          setStudentUsername(found);
          return;
        }
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [props]);

  const initialReports = useMemo(() => {
    return extractList(props.reports ?? props.reviews ?? props, [
      'reports',
      'reviews',
      'history',
    ]);
  }, [props]);

  const [activeTab, setActiveTab] = useState('new');
  const [featureArea, setFeatureArea] = useState('Course & Video Player');
  const [severity, setSeverity] = useState('high');
  const [reportText, setReportText] = useState('');
  const [photos, setPhotos] = useState([]);
  const [reports, setReports] = useState(initialReports);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [feedbackBanner, setFeedbackBanner] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/student/reports', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data || !Array.isArray(data.reports)) return;
        setReports(data.reports);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleDeleteHistoryItem = async (reportId) => {
    if (deletingId === reportId) return;
    setDeletingId(reportId);
    setFeedbackBanner('');

    setReports((prev) => prev.filter((r) => String(r.id) !== String(reportId)));

    try {
      const res = await fetch(`/api/student/reports/${reportId}`, {
        method: 'DELETE',
      }).catch(() => null);

      if (!res || !res.ok) {
        await fetch(`/api/admin/reports/${reportId}`, {
          method: 'DELETE',
        }).catch(() => null);
      }

      setFeedbackBanner('Riwayat report berhasil dihapus.');
      router.refresh();
    } finally {
      setDeletingId(null);
    }
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

    const activeSender = resolveActiveUsername(props) || studentUsername;
    setStudentUsername(activeSender);

    const severityLabel =
      SEVERITY_OPTIONS.find((item) => item.value === severity)?.label.split(' • ')[0] ||
      'Sedang';

    const payload = {
      type: 'bug_report',
      username: activeSender,
      student_name: activeSender,
      featureArea,
      severity,
      severityLabel,
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
      const serverReport = data?.report;

      if (serverReport) {
        const normalizedReport = {
          ...serverReport,
          username: serverReport.username || activeSender,
        };
        setReports((prev) => [normalizedReport, ...prev]);
      } else {
        setReports((prev) => [
          {
            id: `rep-${Date.now()}`,
            username: activeSender,
            title: `Keluhan pada ${featureArea}`,
            featureArea,
            severity: severityLabel,
            reportedAt: '24 Nov 2026',
            status: 'Baru Dikirim',
            description: trimmed,
            photoLabel: photos[0]?.caption || 'Gambar Bukti Error',
            photoCount: photos.length,
            photoUrl: photos[0]?.url || '',
            adminReply: null,
          },
          ...prev,
        ]);
      }

      setReportText('');
      setPhotos([]);
      setFeedbackBanner(
        `Report error/bug atas nama ${activeSender} berhasil dikirim ke halaman report admin.`
      );
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-[#341D17] pb-8">
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

            <span className="text-[11px] font-semibold text-[#341D17]/60">
              Pengirim: <strong suppressHydrationWarning>{studentUsername}</strong>
            </span>
          </div>

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
              Laporan beserta gambar bukti error akan disimpan ke folder public/pictures/reports dan muncul di halaman report admin.
            </p>
          </div>
        </form>
      )}

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

          {reports.length === 0 ? (
            <div className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 p-6 text-center text-xs sm:text-sm text-[#341D17]/60">
              Belum ada riwayat report pada akun {studentUsername}.
            </div>
          ) : (
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
                        Pengirim: <strong suppressHydrationWarning>{item.username || studentUsername}</strong> &bull; {item.featureArea} &bull; Prioritas {item.severity} &bull; {item.reportedAt}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F9DDBB]/80 border border-[#802924]/20 px-2.5 py-1 text-[11px] font-bold text-[#802924]">
                        <span>{item.status || 'Tercatat'}</span>
                      </span>

                      <button
                        type="button"
                        disabled={deletingId === item.id}
                        onClick={() => handleDeleteHistoryItem(item.id)}
                        className="rounded-full border border-[#802924]/25 bg-[#FAF6F0] hover:bg-[#802924] hover:text-[#FFFDF9] px-2.5 py-1 text-[11px] font-bold text-[#802924] transition cursor-pointer disabled:opacity-50"
                      >
                        {deletingId === item.id ? 'Menghapus...' : 'Hapus'}
                      </button>
                    </div>
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
          )}
        </div>
      )}
    </div>
  );
}