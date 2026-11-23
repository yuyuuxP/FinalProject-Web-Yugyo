'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const DEFAULT_KELUHAN_ITEMS = [
  {
    id: 'adm-keluhan-1003',
    username: 'Antasari',
    code: '#STU-1003',
    title: 'Tautan Live Session Hilang',
    reportedAt: 'Baru saja',
    status: 'BELUM DIBACA',
    description:
      'Saya belum menerima link zoom live session untuk sesi tanya jawab starter ragi liar besok pagi jam 08:30 WIT.',
    photoUrl: '',
    photoLabel: '',
    adminReply: null,
    isSeed: true,
  },
  {
    id: 'adm-keluhan-1001',
    username: 'Tania',
    code: '#STU-1001',
    title: 'Permintaan Ubah Jadwal Sesi Sourdough',
    reportedAt: 'Baru saja',
    status: 'SELESAI',
    description:
      'Halo Chef, apakah saya bisa memindahkan jadwal pembuktian adonan ke akhir pekan karena ada kendala mendadak?',
    photoUrl: '',
    photoLabel: '',
    adminReply: null,
    isSeed: true,
  },
  {
    id: 'adm-keluhan-1002',
    username: 'Dimas',
    code: '#STU-1002',
    title: 'Konsultasi Rasio Tepung Protein Tinggi',
    reportedAt: 'Baru saja',
    status: 'SELESAI',
    description:
      'Terima kasih atas tanggapan cepatnya kemarin, rasio air pada adonan viennoiserie saya sekarang sudah jauh lebih stabil.',
    photoUrl: '',
    photoLabel: '',
    adminReply: null,
    isSeed: true,
  },
];

function getInitials(name) {
  const clean = String(name || 'S').trim();
  if (!clean) return 'ST';
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function extractReportsFromStorage() {
  if (typeof window === 'undefined') return [];
  const collected = [];
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i) || '';
      const lower = k.toLowerCase();
      if (!lower.includes('report') && !lower.includes('keluhan')) continue;
      const raw = window.localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        collected.push(...parsed);
      } else if (parsed && Array.isArray(parsed.reports)) {
        collected.push(...parsed.reports);
      }
    }
  } catch {
    // Abaikan error parse storage
  }
  return collected;
}

async function fetchFreshStudentReports() {
  try {
    const res = await fetch('/api/student/reports', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const apiList = Array.isArray(data?.reports)
        ? data.reports
        : Array.isArray(data)
          ? data
          : [];

      const freshOnly = apiList.filter((r) => {
        if (!r) return false;
        const idStr = String(r.id || '');
        if (['rep-video-1', 'rep-schedule-2'].includes(idStr)) return false;
        return true;
      });

      if (freshOnly.length > 0) {
        return freshOnly;
      }
    }
  } catch {
    // Fallback ke localStorage bila API belum merespons
  }

  return extractReportsFromStorage();
}

export default function AdminReportsClient(props = {}) {
  const router = useRouter();

  const seedReports = useMemo(() => {
    const raw = props.initialReports ?? props.reports ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [props]);

  const [studentSubmittedReports, setStudentSubmittedReports] =
    useState(seedReports);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingId, setReplyingId] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [customReplies, setCustomReplies] = useState({});
  const [customStatuses, setCustomStatuses] = useState({});
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let active = true;

    const syncFromSource = () => {
      fetchFreshStudentReports().then((items) => {
        if (!active) return;
        if (Array.isArray(items) && items.length > 0) {
          setStudentSubmittedReports(items);
        }
      });
    };

    const initialTimer = setTimeout(syncFromSource, 0);
    const interval = setInterval(syncFromSource, 3000);

    const onFocus = () => syncFromSource();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncFromSource();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      clearTimeout(initialTimer);
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const allKeluhan = useMemo(() => {
    const seenIds = new Set();
    const mappedFresh = [];

    studentSubmittedReports.forEach((item, idx) => {
      if (!item) return;
      const id = String(item.id || `fresh-rep-${idx}`);
      if (seenIds.has(id)) return;
      seenIds.add(id);

      const resolvedUsername =
        item.username ||
        item.studentUsername ||
        item.student_name ||
        item.studentName ||
        item.full_name ||
        'Salwa';

      const rawStatus = String(
        customStatuses[id] || item.status || 'BELUM DIBACA'
      ).toUpperCase();

      const normalizedStatus =
        rawStatus === 'BARU DIKIRIM' ? 'BELUM DIBACA' : rawStatus;

      mappedFresh.push({
        id,
        username: resolvedUsername,
        code: item.code || `#STU-${2001 + idx}`,
        title:
          item.title ||
          `Keluhan pada ${item.featureArea || item.category || 'Website'}`,
        featureArea: item.featureArea || item.category || 'Lainnya',
        severity: item.severity || 'Sedang',
        reportedAt: item.reportedAt || 'Baru saja',
        status: normalizedStatus,
        description: item.description || item.content || '',
        photoUrl: item.photoUrl || item.image_proof || '',
        photoLabel: item.photoLabel || 'Bukti Gambar Error',
        adminReply: customReplies[id] || item.adminReply || null,
        isSeed: false,
      });
    });

    const mappedSeed = DEFAULT_KELUHAN_ITEMS.map((item) => ({
      ...item,
      status: String(customStatuses[item.id] || item.status).toUpperCase(),
      adminReply: customReplies[item.id] || item.adminReply || null,
    }));

    return [...mappedFresh, ...mappedSeed];
  }, [studentSubmittedReports, customStatuses, customReplies]);

  const newStudentReportCount = useMemo(
    () => allKeluhan.filter((k) => !k.isSeed).length,
    [allKeluhan]
  );

  const openKeluhanCount = useMemo(
    () =>
      allKeluhan.filter(
        (k) => String(k.status || '').toUpperCase() === 'BELUM DIBACA'
      ).length,
    [allKeluhan]
  );

  const completionRate = useMemo(() => {
    if (allKeluhan.length === 0) return '0.0%';
    const doneCount = allKeluhan.filter(
      (k) => String(k.status || '').toUpperCase() === 'SELESAI'
    ).length;
    return `${((doneCount / allKeluhan.length) * 100).toFixed(1)}%`;
  }, [allKeluhan]);

  const filteredKeluhan = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allKeluhan;

    return allKeluhan.filter((item) =>
      [
        item.username || '',
        item.code || '',
        item.title || '',
        item.featureArea || '',
        item.description || '',
        item.status || '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [allKeluhan, searchQuery]);

  const handleSaveReply = async (itemId, senderRole = 'Admin Yugyo') => {
    const cleanText = replyDraft.trim();
    if (!cleanText || savingId) return;
    setSavingId(itemId);

    try {
      await fetch(`/api/admin/reports/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replyMessage: cleanText,
          status: 'SELESAI',
        }),
      }).catch(() => null);

      setCustomReplies((prev) => ({
        ...prev,
        [itemId]: { name: senderRole, message: cleanText },
      }));
      setCustomStatuses((prev) => ({
        ...prev,
        [itemId]: 'SELESAI',
      }));
      setReplyingId(null);
      setReplyDraft('');
      router.refresh();
    } finally {
      setSavingId(null);
    }
  };

  const handleEscalateTech = async (itemId) => {
    if (savingId) return;
    setSavingId(itemId);
    try {
      await fetch(`/api/admin/reports/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'TIM TEKNIS' }),
      }).catch(() => null);

      setCustomStatuses((prev) => ({
        ...prev,
        [itemId]: 'TIM TEKNIS',
      }));
      router.refresh();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-5 text-[#341D17] pb-8">
      {/* HEADER ATELIER QUALITY ASSURANCE */}
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
          <span>&#9888;</span>
          <span>ATELIER ISSUE &amp; BUG REPORTS</span>
        </span>
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
          Laporan &amp; Keluhan
        </h1>
        <p className="text-xs sm:text-sm text-[#341D17]/65">
          Pantau keluhan dan laporan error yang dikirim siswa beserta nama/username pengirim.
        </p>
      </div>

      {/* 4 KARTU STATISTIK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/10 p-4 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/55">
              TOTAL REPORT SISWA
            </span>
            <span className="text-[#802924] text-xs font-bold">&#128203;</span>
          </div>
          <p className="text-2xl font-extrabold text-[#341D17]">
            {allKeluhan.length}{' '}
            <span className="text-xs font-normal text-[#341D17]/55">Laporan</span>
          </p>
          <div className="h-1.5 w-full rounded-full bg-[#341D17]/8 overflow-hidden">
            <div className="h-full w-[85%] rounded-full bg-[#EA8C1E]" />
          </div>
          <p className="text-[11px] text-[#341D17]/50">Tercatat di sistem</p>
        </div>

        <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/10 p-4 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/55">
              KELUHAN TERBUKA
            </span>
            <span className="rounded bg-[#802924] px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-[#FFFDF9]">
              URGENT
            </span>
          </div>
          <p className="text-2xl font-extrabold text-[#341D17]">
            {openKeluhanCount}{' '}
            <span className="text-xs font-normal text-[#341D17]/55">Tiket</span>
          </p>
          <div className="h-1.5 w-full rounded-full bg-[#341D17]/8 overflow-hidden">
            <div className="h-full w-[45%] rounded-full bg-[#802924]" />
          </div>
          <p className="text-[11px] text-[#802924] font-semibold">
            Investigasi segera &bull; Respons &lt; 2 jam
          </p>
        </div>

        <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/10 p-4 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/55">
              PENYELESAIAN
            </span>
            <span className="text-[#4E7A4E] text-xs font-bold">&#10003;</span>
          </div>
          <p className="text-2xl font-extrabold text-[#341D17]">
            {completionRate}
          </p>
          <div className="h-1.5 w-full rounded-full bg-[#341D17]/8 overflow-hidden">
            <div className="h-full w-[80%] rounded-full bg-[#6B8E23]" />
          </div>
          <p className="text-[11px] text-[#341D17]/50">Masalah tuntas</p>
        </div>

        <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/10 p-4 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/55">
              REPORT BARU
            </span>
            <span className="text-[#802924] text-xs font-bold">&#8599;</span>
          </div>
          <p className="text-2xl font-extrabold text-[#341D17]">
            +{newStudentReportCount}
          </p>
          <p className="text-[11px] text-[#341D17]/50">Dari siswa</p>
          <p className="text-[11px] text-[#802924] font-semibold">
            &#10024; Sinkron dengan student portal
          </p>
        </div>
      </div>

      {/* PENCARIAN */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari keluhan siswa, username, kendala, atau tiket..."
          className="w-full rounded-2xl border border-[#341D17]/12 bg-[#FFFDF9] px-4 py-2.5 text-xs sm:text-sm text-[#341D17] placeholder:text-[#341D17]/40 focus:border-[#802924] focus:outline-none shadow-2xs"
        />
      </div>

      {/* TINDAKAN MENDESAK (KELUHAN SISWA) */}
      <div className="space-y-3.5 pt-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-editorial text-lg font-bold text-[#341D17]">
            Tindakan Mendesak (Keluhan Siswa)
          </h2>
          <span className="text-xs font-semibold text-[#802924]">
            {openKeluhanCount} Menunggu Tanggapan
          </span>
        </div>

        <div className="space-y-3.5">
          {filteredKeluhan.map((item) => {
            const senderUsername = item.username || 'Salwa';
            const isUnread =
              String(item.status || '').toUpperCase() === 'BELUM DIBACA';

            return (
              <div
                key={item.id}
                className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/10 p-5 sm:p-6 space-y-4 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#802924] text-[#FFFDF9] text-xs font-extrabold flex items-center justify-center shrink-0">
                      {getInitials(senderUsername)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-bold text-[#341D17]">
                          {senderUsername}
                        </span>
                        {item.code && (
                          <span className="text-[11px] text-[#341D17]/45">
                            {item.code}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-[#341D17]/90">
                        {item.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                        isUnread
                          ? 'bg-[#F9DDBB]/85 text-[#802924]'
                          : 'bg-[#FAF6F0] text-[#4E7A4E]'
                      }`}
                    >
                      {String(item.status || 'BELUM DIBACA').toUpperCase()}
                    </span>
                    <span className="text-[11px] text-[#341D17]/45">
                      {item.reportedAt || 'Baru saja'}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#FAF6F0]/80 border border-[#341D17]/8 px-4 py-3 text-xs sm:text-sm italic text-[#341D17]/80">
                  &ldquo;{item.description}&rdquo;
                </div>

                {item.photoUrl && (
                  <div className="rounded-2xl bg-[#FAF6F0] border border-[#341D17]/10 p-3 flex items-center gap-3">
                    <img
                      src={item.photoUrl}
                      alt={item.photoLabel || 'Bukti gambar error'}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#341D17] truncate">
                        {item.photoLabel || 'Bukti Gambar Error'}
                      </p>
                      <p className="text-[11px] text-[#341D17]/55 truncate">
                        {item.photoUrl}
                      </p>
                    </div>
                  </div>
                )}

                {item.adminReply && (
                  <div className="rounded-2xl bg-[#FAF6F0] border-l-2 border-[#802924] px-4 py-2.5 text-xs text-[#341D17]/80">
                    <strong>{item.adminReply.name}:</strong> &ldquo;
                    {item.adminReply.message}&rdquo;
                  </div>
                )}

                {replyingId === item.id && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      placeholder={`Tulis tanggapan untuk ${senderUsername}...`}
                      className="flex-1 rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3 py-2 text-xs text-[#341D17] focus:border-[#802924] focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={savingId === item.id}
                      onClick={() => handleSaveReply(item.id, 'Admin Yugyo')}
                      className="rounded-xl bg-[#802924] hover:bg-[#661F1B] px-3.5 py-2 text-xs font-bold text-[#FFFDF9] cursor-pointer disabled:opacity-60"
                    >
                      Kirim
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingId(replyingId === item.id ? null : item.id);
                      setReplyDraft('');
                    }}
                    className="rounded-xl bg-[#802924] hover:bg-[#661F1B] py-2.5 px-4 text-xs sm:text-sm font-bold text-[#FFFDF9] flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>&#128172;</span>
                    <span>Tanggapi Siswa</span>
                  </button>

                  <button
                    type="button"
                    disabled={savingId === item.id}
                    onClick={() => handleEscalateTech(item.id)}
                    className="rounded-xl bg-[#F9DDBB]/65 hover:bg-[#F9DDBB] py-2.5 px-4 text-xs sm:text-sm font-bold text-[#802924] flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
                  >
                    <span>&#128736;</span>
                    <span>Tim Teknis</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}