'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

const FILTER_TABS = [
  { key: 'all', label: 'Semua Materi', icon: '✦' },
  { key: 'video', label: 'Video Tutorial HD', icon: '▶' },
  { key: 'formula', label: 'Buku Formula Resep', icon: '📘' },
  { key: 'unfinished', label: 'Belum Selesai', icon: '⏳' },
];

const FALLBACK_MODULES = [
  {
    id: 'mod-1',
    course_id: null,
    title: 'Pengenalan Tepung Terigu Protein Tinggi (W-Index > 320)',
    content_type: 'video',
    duration_label: '18 Menit',
    media_url: '',
    summary: 'Kuis Lulus (Score 100) • Catatan Tersimpan',
    sort_order: 1,
    course_title: 'French Croissant & Lamination Masterclass',
  },
  {
    id: 'mod-2',
    course_id: null,
    title: "Formula Baker's Percentage & Hidrasi Adonan Dingin",
    content_type: 'formula',
    duration_label: '16 Halaman',
    media_url: '',
    summary: 'Diverifikasi • Formula Tersinkronisasi',
    sort_order: 2,
    course_title: 'French Croissant & Lamination Masterclass',
  },
  {
    id: 'mod-3',
    course_id: null,
    title: 'Teknik Sheeting Mentega Tourage 84% & Arsitektur Laminasi',
    content_type: 'video',
    duration_label: '32 Menit',
    media_url: '',
    summary: 'Disertai Diagram Suhu Ideal (14°C - 16°C)',
    sort_order: 3,
    course_title: 'French Croissant & Lamination Masterclass',
  },
  {
    id: 'mod-4',
    course_id: null,
    title: 'Lipatan Single Turn & Double Turn: Membentuk 27 Lapisan Mentega',
    content_type: 'video',
    duration_label: '40 Menit',
    media_url: '/pictures/courses/french_pastry/croissant.png',
    summary: 'Resting Time: 30 Menit di Chiller • Posisi Terakhir: Menit 14:22',
    sort_order: 4,
    course_title: 'French Croissant & Lamination Masterclass',
  },
  {
    id: 'mod-5',
    course_id: null,
    title: 'Buku Catatan Studio: Panduan Suhu Proofer & Waktu Fermentasi',
    content_type: 'formula',
    duration_label: '8 Halaman',
    media_url: '',
    summary: 'Panduan suhu proofing & kelembapan adonan laminasi',
    sort_order: 5,
    course_title: 'French Croissant & Lamination Masterclass',
  },
  {
    id: 'mod-6',
    course_id: null,
    title: 'Baking Curve & Oven Steam Injection untuk Warna Keemasan Karamel',
    content_type: 'video',
    duration_label: '28 Menit',
    media_url: '',
    summary: 'Evaluasi pemanggangan deck oven & karamelisasi kulit luar',
    sort_order: 6,
    course_title: 'French Croissant & Lamination Masterclass',
  },
];

function normalizeMaterialKind(item) {
  const raw = `${item?.content_type || ''} ${item?.title || ''}`.toLowerCase();
  if (
    raw.includes('pdf') ||
    raw.includes('formula') ||
    raw.includes('buku') ||
    raw.includes('ebook') ||
    raw.includes('resep')
  ) {
    return 'formula';
  }
  return 'video';
}

export default function StudentCoursesClient({
  courses = [],
  contents = [],
}) {
  const [selectedCourseId, setSelectedCourseId] = useState(
    courses?.[0]?.id ?? null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortAsc, setSortAsc] = useState(true);
  const [completedIds, setCompletedIds] = useState(() => ['mod-1', 'mod-2', 'mod-3']);
  const [activePreviewId, setActivePreviewId] = useState(null);
  const [statusBanner, setStatusBanner] = useState('');

  const featuredCourse = useMemo(() => {
    if (courses.length === 0) return null;
    if (selectedCourseId != null) {
      return (
        courses.find((c) => Number(c.id) === Number(selectedCourseId)) || courses[0]
      );
    }
    return courses[0];
  }, [courses, selectedCourseId]);

  const baseModules = useMemo(() => {
    const source =
      Array.isArray(contents) && contents.length > 0 ? contents : FALLBACK_MODULES;

    if (!featuredCourse?.id) return source;
    const forCourse = source.filter(
      (m) => Number(m.course_id) === Number(featuredCourse.id)
    );
    return forCourse.length > 0 ? forCourse : source;
  }, [contents, featuredCourse]);

  const currentProgress = Number(featuredCourse?.progress_percentage ?? 75);
  const totalMaterialsCount = Math.max(baseModules.length, 12);
  const completedMaterialsCount = Math.min(
    totalMaterialsCount,
    Math.max(
      completedIds.length,
      Math.round((currentProgress / 100) * totalMaterialsCount)
    )
  );

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = baseModules.filter((mod, idx) => {
      const idKey = String(mod.id ?? idx);
      const isDone =
        completedIds.includes(idKey) ||
        (baseModules.length >= 3 && idx < 2 && activeFilter !== 'unfinished');
      const kind = normalizeMaterialKind(mod);

      if (activeFilter === 'video' && kind !== 'video') return false;
      if (activeFilter === 'formula' && kind !== 'formula') return false;
      if (activeFilter === 'unfinished' && isDone) return false;

      if (q) {
        const hay = `${mod.title || ''} ${mod.summary || ''} ${
          mod.course_title || ''
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      const orderA = Number(a.sort_order ?? a.id ?? 0);
      const orderB = Number(b.sort_order ?? b.id ?? 0);
      if (Number.isFinite(orderA) && Number.isFinite(orderB)) {
        return sortAsc ? orderA - orderB : orderB - orderA;
      }
      return 0;
    });
  }, [baseModules, searchQuery, activeFilter, sortAsc, completedIds]);

  const toggleModuleDone = (idKey, title) => {
    setCompletedIds((prev) => {
      const exists = prev.includes(idKey);
      const next = exists ? prev.filter((x) => x !== idKey) : [...prev, idKey];
      setStatusBanner(
        exists
          ? `Status "${title}" diubah menjadi sedang dipelajari.`
          : `Materi "${title}" ditandai selesai.`
      );
      return next;
    });
  };

  const handleDownloadWorksheets = () => {
    const contentText = [
      `YUGYO ATELIER - WORKSHEET KURIKULUM`,
      `Kelas: ${featuredCourse?.title || 'Masterclass Baking'}`,
      `Instruktur: Chef ${featuredCourse?.instructor_name || 'Atelier'}`,
      `----------------------------------------`,
      ...baseModules.map(
        (m, i) =>
          `#${String(i + 1).padStart(2, '0')} ${m.title} (${
            m.duration_label || 'Modul'
          })`
      ),
    ].join('\n');

    const blob = new Blob([contentText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Worksheet-${
      (featuredCourse?.title || 'Yugyo-Atelier')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
    }.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusBanner('Worksheet modul berhasil diunduh.');
  };

  return (
    <div className="space-y-6">
      {/* BADGE SEMESTER & JUDUL HALAMAN */}
      <section className="space-y-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#802924]/25 bg-[#F9DDBB]/55 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
          <span>🎓 Semester Aktif • Yugyo Atelier</span>
        </span>

        <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
          Materi Pembelajaran Saya
        </h1>

        <p className="text-xs sm:text-sm text-[#341D17]/75 max-w-2xl">
          Eksplorasi silabus pastry, video teknik, dan modul formula resep terdaftar dengan standar atelier profesional.
        </p>
      </section>

      {/* PEMILIH KELAS JIKA SISWA MEMILIKI LEBIH DARI 1 KURSUS */}
      {courses.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          {courses.map((c) => {
            const active =
              featuredCourse && Number(c.id) === Number(featuredCourse.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCourseId(c.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  active
                    ? 'bg-[#802924] text-[#FFFDF9] shadow-2xs'
                    : 'border border-[#341D17]/15 bg-[#FFFDF9] text-[#341D17] hover:bg-[#FAF6F0]'
                }`}
              >
                {c.title}
              </button>
            );
          })}
        </div>
      )}

      {/* KARTU KURSUS UTAMA TERDAFTAR */}
      {featuredCourse && (
        <section className="rounded-3xl border border-[#341D17]/12 bg-[#FFFDF9] p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#F9DDBB] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#802924]">
                KURSUS AKTIF
              </span>
              <span className="text-[#341D17]/65 font-medium">
                {featuredCourse.category_name || 'Modul Atelier'}
              </span>
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#341D17]/75">
              <span className="text-[#802924]">✓</span>
              <span>Terakreditasi Yugyo Atelier</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative h-24 w-full sm:w-32 shrink-0 overflow-hidden rounded-2xl border border-[#341D17]/10 bg-[#FAF6F0]">
              <img
                src={
                  featuredCourse.thumbnail_url ||
                  '/pictures/courses/french_pastry/croissant.png'
                }
                alt={featuredCourse.title}
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-1.5 left-1.5 rounded-md bg-[#341D17]/80 px-2 py-0.5 text-[9px] font-bold text-[#FFFDF9]">
                Masterclass
              </span>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17]">
                {featuredCourse.title}
              </h2>
              <p className="text-xs text-[#341D17]/70">
                &#128104;&#8205;&#127859; Chef {featuredCourse.instructor_name} &bull;{' '}
                {featuredCourse.instructor_specialty}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#341D17]">
                Progres Pembelajaran
              </span>
              <span className="font-bold text-[#341D17]">
                <strong className="text-[#802924]">{currentProgress}%</strong>{' '}
                Selesai &bull; {completedMaterialsCount}/{totalMaterialsCount} Materi
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-[#F9DDBB] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#802924] transition-all"
                style={{ width: `${Math.min(100, Math.max(0, currentProgress))}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-xs text-[#341D17]/65 inline-flex items-center gap-1.5">
              <span>&#128336;</span>
              <span>Sisa Waktu Akses: 180 Hari</span>
            </span>

            <Link
              href={`/dashboard/student/courses/${featuredCourse.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#802924] hover:bg-[#661F1B] px-5 py-2.5 text-xs font-bold text-[#FFFDF9] transition"
            >
              <span>Lanjutkan Belajar</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </section>
      )}

      {/* PENCARIAN & FILTER KATEGORI */}
      <section className="space-y-3">
        <div className="flex items-center gap-3 rounded-2xl border border-[#341D17]/12 bg-[#FFFDF9] px-4 py-2.5 shadow-2xs">
          <span className="text-sm text-[#341D17]/50">&#128269;</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari materi atau topik resep..."
            className="w-full bg-transparent text-xs sm:text-sm text-[#341D17] placeholder:text-[#341D17]/45 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-[#802924] cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FILTER_TABS.map((tab) => {
            const active = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  active
                    ? 'bg-[#802924] text-[#FFFDF9] shadow-2xs'
                    : 'border border-[#341D17]/12 bg-[#FFFDF9] text-[#341D17]/80 hover:bg-[#FAF6F0]'
                }`}
              >
                <span className="text-[11px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {statusBanner && (
        <div className="rounded-2xl border border-[#341D17]/15 bg-[#F9DDBB]/55 px-4 py-2.5 text-xs font-bold text-[#341D17]">
          {statusBanner}
        </div>
      )}

      {/* SILABUS KURIKULUM */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17]">
              Silabus Kurikulum
            </h2>
            <span className="rounded-full border border-[#341D17]/12 bg-[#FFFDF9] px-3 py-0.5 text-[11px] font-semibold text-[#341D17]/70">
              {filteredModules.length} Modul
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSortAsc((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#802924] hover:underline cursor-pointer"
          >
            <span>Sortir Modul</span>
            <span>{sortAsc ? '↑↓' : '↓↑'}</span>
          </button>
        </div>

        {filteredModules.length === 0 ? (
          <div className="rounded-3xl border border-[#341D17]/12 bg-[#FFFDF9] p-6 text-center text-xs text-[#341D17]/70">
            Tidak ada modul yang cocok dengan pencarian atau filter yang dipilih.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredModules.map((mod, idx) => {
              const idKey = String(mod.id ?? idx);
              const kind = normalizeMaterialKind(mod);
              const isDone =
                completedIds.includes(idKey) ||
                (baseModules.length >= 3 && idx < 2 && activeFilter !== 'unfinished');
              const isCurrentStudio = !isDone && idx === 3;
              const isPreviewOpen = activePreviewId === idKey;

              return (
                <div
                  key={idKey}
                  className={`rounded-3xl border p-4 sm:p-5 shadow-2xs transition space-y-3 ${
                    isCurrentStudio
                      ? 'border-[#802924]/35 bg-[#FFFDF9]'
                      : 'border-[#341D17]/12 bg-[#FFFDF9]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${
                          isCurrentStudio
                            ? 'bg-[#802924] text-[#FFFDF9]'
                            : 'bg-[#FAF6F0] text-[#341D17]/75 border border-[#341D17]/10'
                        }`}
                      >
                        #{String(mod.sort_order || idx + 1).padStart(2, '0')}
                      </span>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#341D17]/65">
                          <span className="text-[#802924]">
                            {kind === 'formula' ? '📘 FORMULA / PDF' : '▶ VIDEO HD'}
                          </span>
                          <span>&bull;</span>
                          <span>{mod.duration_label || '20 Menit'}</span>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-[#341D17]">
                          {mod.title}
                        </h3>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleModuleDone(idKey, mod.title)}
                      className={`rounded-full px-3 py-1 text-[11px] font-bold transition cursor-pointer shrink-0 ${
                        isDone
                          ? 'bg-[#ECFDF3] text-[#027A48] border border-[#027A48]/20'
                          : isCurrentStudio
                          ? 'bg-[#F9DDBB] text-[#802924]'
                          : 'bg-[#FAF6F0] text-[#341D17]/70 border border-[#341D17]/12'
                      }`}
                    >
                      {isDone
                        ? '✓ Selesai'
                        : isCurrentStudio
                        ? '↻ Sedang Belajar'
                        : 'Tandai Selesai'}
                    </button>
                  </div>

                  {/* PREVIEW MEDIA JIKA ADA ATAU DIBUKA */}
                  {(isCurrentStudio || isPreviewOpen) && (
                    <div className="space-y-3 pt-1">
                      {mod.media_url ? (
                        <div className="relative overflow-hidden rounded-2xl border border-[#341D17]/10 bg-[#FAF6F0]">
                          <img
                            src={mod.media_url}
                            alt={mod.title}
                            className="h-44 sm:h-52 w-full object-cover"
                          />
                          <span className="absolute bottom-2.5 left-2.5 rounded-lg bg-[#341D17]/85 px-2.5 py-1 text-[10px] font-bold text-[#FFFDF9]">
                            Modul Atelier &bull; {mod.duration_label || 'Video'}
                          </span>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-[#341D17]/10 bg-[#FAF6F0] p-3.5 text-xs text-[#341D17]/80">
                          {mod.summary ||
                            'Ringkasan teknik praktik dan panduan suhu adonan untuk modul ini.'}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#341D17]/8 text-xs">
                    <span className="text-[11px] text-[#341D17]/65 truncate">
                      {mod.summary ||
                        (kind === 'formula'
                          ? 'Lembar resep & takaran terverifikasi'
                          : 'Demonstrasi teknik langkah demi langkah')}
                    </span>

                    {isCurrentStudio ? (
                      <button
                        type="button"
                        onClick={() =>
                          setActivePreviewId((prev) =>
                            prev === idKey ? null : idKey
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#802924] hover:bg-[#661F1B] px-4 py-2 text-xs font-bold text-[#FFFDF9] transition cursor-pointer"
                      >
                        <span>Lanjutkan Belajar</span>
                        <span>&rarr;</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setActivePreviewId((prev) =>
                            prev === idKey ? null : idKey
                          )
                        }
                        className="inline-flex items-center gap-1 font-bold text-[#341D17]/80 hover:text-[#802924] transition cursor-pointer"
                      >
                        <span>
                          {kind === 'formula'
                            ? isPreviewOpen
                              ? 'Tutup Dokumen'
                              : 'Buka Dokumen'
                            : isPreviewOpen
                            ? 'Tutup Pratinjau'
                            : 'Putar Ulang'}
                        </span>
                        <span>{kind === 'formula' ? '↗' : '↻'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* TOMBOL AKSI WORKSHEET & SERTIFIKAT */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleDownloadWorksheets}
          className="flex items-center justify-center gap-2 rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#FAF6F0] py-3 px-4 text-xs font-bold text-[#341D17] shadow-2xs transition cursor-pointer"
        >
          <span>&#128196;</span>
          <span>Unduh Semua Worksheet</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setStatusBanner(
              `Sertifikat sementara untuk "${
                featuredCourse?.title || 'Kursus Atelier'
              }" siap diverifikasi setelah seluruh modul selesai.`
            )
          }
          className="flex items-center justify-center gap-2 rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#FAF6F0] py-3 px-4 text-xs font-bold text-[#341D17] shadow-2xs transition cursor-pointer"
        >
          <span>&#127942;</span>
          <span>Lihat Sertifikat Sementara</span>
        </button>
      </section>

      {/* KUTIPAN CATATAN INSTRUKTUR */}
      <section className="rounded-3xl border border-[#F3D2B3] bg-[#FAF6F0] p-5 sm:p-6 shadow-2xs space-y-2">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F9DDBB] text-xs font-extrabold text-[#802924]">
            &ldquo;&rdquo;
          </span>
          <div className="space-y-1.5">
            <p className="font-editorial italic text-sm sm:text-base text-[#341D17] leading-relaxed">
              &ldquo;Kesabaran dalam proses fermentasi dingin adalah kunci laminasi
              berongga sarang lebah yang sempurna.&rdquo;
            </p>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/60">
              CATATAN CHEF{' '}
              {(featuredCourse?.instructor_name || 'ATELIER').toUpperCase()} &bull;
              YUGYO ATELIER
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}