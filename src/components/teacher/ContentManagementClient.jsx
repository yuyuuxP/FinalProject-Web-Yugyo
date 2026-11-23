'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const GENERIC_WORDS = new Set([
  'masterclass',
  'classic',
  'kelas',
  'kursus',
  'modul',
  'sesi',
  'dasar',
  'lanjutan',
  'otentik',
  'authentic',
  'klasik',
  'modern',
  'atelier',
  'anti',
  'gagal',
  'pain',
  'cake',
  'cakes',
  'bread',
  'cookie',
  'cookies',
  'pastry',
  'special',
  'spesial',
  'double',
  'with',
  'dan',
  'the',
]);

function normalizeStr(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\.(mp4|webm|mov|m4v|mkv)$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCoreKeywords(text) {
  const words = normalizeStr(text)
    .split(' ')
    .filter((w) => w.length >= 2);
  const core = words.filter((w) => !GENERIC_WORDS.has(w));
  return core.length > 0 ? core : words;
}

function matchesCourseStrict(courseTitle, candidateText) {
  const normCourse = normalizeStr(courseTitle);
  const normCand = normalizeStr(candidateText);
  if (!normCourse) return true;
  if (!normCand) return false;

  if (normCand.includes(normCourse) || normCourse.includes(normCand)) {
    return true;
  }

  const coreKeywords = getCoreKeywords(courseTitle);
  if (coreKeywords.length === 0) return false;
  return coreKeywords.every((kw) => normCand.includes(kw));
}

export default function ContentManagementClient({
  teacher,
  courses = [],
  selectedCourse,
  initialContents = [],
  matchedVideos = [],
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const safeCourses = useMemo(
    () => (Array.isArray(courses) ? courses : []),
    [courses]
  );
  const safeMatchedVideos = useMemo(
    () => (Array.isArray(matchedVideos) ? matchedVideos : []),
    [matchedVideos]
  );

  const defaultCourseId = selectedCourse?.id ?? safeCourses[0]?.id ?? '';
  const [selectedCourseOverride, setSelectedCourseOverride] = useState(null);
  const activeCourseId = selectedCourseOverride ?? defaultCourseId;

  const derivedContents = useMemo(() => {
    const dbItems = Array.isArray(initialContents) ? initialContents : [];

    const filteredDbItems = dbItems.filter((item) =>
      matchesCourseStrict(
        selectedCourse?.title,
        `${item?.title || ''} ${item?.media_url || ''}`
      )
    );

    if (filteredDbItems.length > 0) {
      return filteredDbItems;
    }

    if (safeMatchedVideos.length > 0) {
      return safeMatchedVideos.map((vid, index) => ({
        id: `folder-${selectedCourse?.id ?? 'crs'}-${vid.fileName}-${index}`,
        course_id: selectedCourse?.id,
        title: vid.title,
        content_type: 'video',
        duration_label: 'Video Materi',
        status: 'published',
        media_url: vid.mediaUrl,
        summary: `Terhubung dari folder videos/${vid.folder}/${vid.fileName}`,
        sort_order: index + 1,
        fromFolder: true,
      }));
    }

    return [];
  }, [selectedCourse, initialContents, safeMatchedVideos]);

  const [addedContentsForCourse, setAddedContentsForCourse] = useState({});
  const courseKey = String(selectedCourse?.id ?? activeCourseId ?? 'none');
  const safeContents = useMemo(() => {
    const extra = addedContentsForCourse[courseKey] || [];
    return [...derivedContents, ...extra];
  }, [derivedContents, addedContentsForCourse, courseKey]);

  const defaultVideoUrl =
    safeContents[0]?.media_url || safeMatchedVideos[0]?.mediaUrl || '';
  const [moduleTitle, setModuleTitle] = useState('');
  const [videoUrlOverride, setVideoUrlOverride] = useState(null);
  const videoUrl = videoUrlOverride ?? defaultVideoUrl;

  const [coverUrl, setCoverUrl] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const draftCount = safeContents.filter((c) => c?.status === 'draft').length;

  const handleCourseDropdownChange = (e) => {
    const nextId = e.target.value;
    setSelectedCourseOverride(nextId);
    setVideoUrlOverride(null);
    setFeedback('');
    router.push(`/dashboard/teacher/contents?courseId=${nextId}`);
  };

  const handleSaveModule = async (isDraft = false) => {
    if (!activeCourseId || saving) return;
    const finalTitle =
      moduleTitle.trim() ||
      safeMatchedVideos[0]?.title ||
      `Modul ${selectedCourse?.title || 'Pembelajaran'}`;
    const finalVideoUrl = videoUrl.trim() || safeMatchedVideos[0]?.mediaUrl || '';

    setSaving(true);
    setFeedback('');

    try {
      const res = await fetch('/api/teacher/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: Number(activeCourseId),
          title: finalTitle,
          content_type: 'video',
          duration_label: isDraft ? 'Draft' : '20 Menit',
          status: isDraft ? 'draft' : 'published',
          media_url: finalVideoUrl,
          summary: bodyText.trim() || coverUrl.trim() || '',
          sort_order: safeContents.length + 1,
        }),
      });

      const data = await res.json();
      if (data?.success && data?.content) {
        setAddedContentsForCourse((prev) => ({
          ...prev,
          [courseKey]: [...(prev[courseKey] || []), data.content],
        }));
        setModuleTitle('');
        setBodyText('');
        setFeedback(
          isDraft ? 'Draft modul berhasil disimpan.' : 'Modul berhasil diterbitkan.'
        );
        startTransition(() => {
          router.refresh();
        });
      } else {
        setFeedback(data?.error || 'Gagal menyimpan modul.');
      }
    } catch {
      setFeedback('Terjadi kesalahan saat menyimpan modul.');
    } finally {
      setSaving(false);
    }
  };

  const currentCourse =
    safeCourses.find((c) => String(c.id) === String(activeCourseId)) ||
    selectedCourse;

  return (
    <div className="min-h-screen bg-[#F3D8BE]/60 text-[#341D17] p-4 sm:p-6 space-y-5">
      {/* KARTU ATAS: DROPDOWN SILABUS KURSUS AKTIF & STRUKTUR URUTAN MATERI */}
      <section className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/10 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#802924] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#FFFDF9]">
              SILABUS KURSUS AKTIF
            </span>
            {currentCourse && (
              <span className="text-[11px] font-bold text-[#341D17]/60">
                ID: #CRS-{String(currentCourse.id).padStart(3, '0')}
              </span>
            )}
          </div>

          <span className="rounded-xl border border-[#341D17]/12 bg-[#FFFDF9] px-3 py-1.5 text-xs font-bold text-[#341D17]">
            Author: {teacher?.full_name || 'Ayu'}
          </span>
        </div>

        <div>
          <select
            value={activeCourseId}
            onChange={handleCourseDropdownChange}
            aria-label="Pilih Kursus Aktif"
            className="w-full rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] px-4 py-3 text-base sm:text-lg font-bold text-[#341D17] focus:border-[#802924] focus:outline-none"
          >
            {safeCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.status === 'active' || !c.status ? 'Aktif' : c.status})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-xl bg-[#802924] px-3 py-1.5 font-bold text-[#FFFDF9]">
              Total: {safeContents.length} Modul
            </span>
            <span className="rounded-xl border border-[#341D17]/12 bg-[#FAF6F0] px-3 py-1.5 font-semibold text-[#341D17]/75">
              {draftCount} Draft Baru
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (safeMatchedVideos[0]) {
                setModuleTitle(safeMatchedVideos[0].title);
                setVideoUrlOverride(safeMatchedVideos[0].mediaUrl);
              }
            }}
            className="rounded-xl bg-[#802924] hover:bg-[#661F1B] px-4 py-2 text-xs font-bold text-[#FFFDF9] transition cursor-pointer"
          >
            + Tambah Materi
          </button>
        </div>

        {/* STRUKTUR & URUTAN MATERI */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-editorial text-lg font-bold text-[#341D17]">
              Struktur &amp; Urutan Materi
            </h2>
            <span className="text-[11px] text-[#341D17]/55">
              Tahan &amp; Geser untuk Reorder
            </span>
          </div>

          {safeContents.length === 0 ? (
            <div className="rounded-2xl border border-[#341D17]/10 bg-[#FAF6F0]/70 px-4 py-6 text-center text-xs text-[#341D17]/65">
              Belum ada video materi yang cocok untuk kursus &ldquo;
              {currentCourse?.title || 'ini'}&rdquo;. Silakan tambahkan melalui editor di bawah.
            </div>
          ) : (
            <div className="space-y-2.5">
              {safeContents.map((item, idx) => (
                <div
                  key={item.id || idx}
                  onClick={() => {
                    if (item.media_url) setVideoUrlOverride(item.media_url);
                    if (item.title) setModuleTitle(item.title);
                  }}
                  className="rounded-2xl border border-[#341D17]/12 bg-[#FAF6F0]/75 hover:bg-[#F9DDBB]/35 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition cursor-pointer"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                      MODUL #{String(item.sort_order || idx + 1).padStart(2, '0')} &bull;{' '}
                      {item.content_type || 'video'}
                    </p>
                    <p className="text-sm font-bold text-[#341D17] truncate">
                      {item.title}
                    </p>
                    {item.media_url && (
                      <p className="text-[11px] text-[#341D17]/65 truncate">
                        {item.media_url}
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 rounded-xl border border-[#341D17]/12 bg-[#FFFDF9] px-3 py-1 text-[11px] font-bold text-[#802924]">
                    Pilih Video
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {feedback && (
        <div className="rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] px-4 py-2.5 text-xs font-bold text-[#802924]">
          {feedback}
        </div>
      )}

      {/* KARTU BAWAH: EDITOR MATERI AKTIF */}
      <section className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/10 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
              EDITOR MATERI AKTIF
            </span>
            <h2 className="font-editorial text-xl font-bold text-[#341D17]">
              Modul Pembelajaran Baru
            </h2>
          </div>

          <span className="rounded-xl border border-[#341D17]/12 bg-[#FAF6F0] px-3 py-1 text-[11px] font-bold text-[#341D17]/75">
            Order Index: {safeContents.length + 1}
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/65">
            TERBITKAN KE KURSUS
          </label>
          <select
            value={activeCourseId}
            onChange={handleCourseDropdownChange}
            className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#341D17]"
          >
            {safeCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/65">
            JUDUL MODUL / MATERI
          </label>
          <input
            type="text"
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
            placeholder="Contoh: Modul Teknik Laminasi & Proofing"
            className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3.5 py-2.5 text-xs sm:text-sm text-[#341D17] placeholder:text-[#341D17]/40 focus:border-[#802924] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/65">
              COVER GAMBAR MATERI (DIJADIKAN SAMPUL)
            </label>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() =>
                  setCoverUrl('/pictures/courses/french_pastry/croissant.png')
                }
                className="rounded-xl bg-[#802924] hover:bg-[#661F1B] px-3.5 py-2 text-xs font-bold text-[#FFFDF9] cursor-pointer"
              >
                Pilih Gambar
              </button>
              <span className="text-xs text-[#341D17]/55 truncate">
                {coverUrl || 'Belum ada'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/65">
              TAUTAN VIDEO (URL ATAU UPLOAD FILE)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="/videos/..."
                className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-3 py-2 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:border-[#802924] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (safeMatchedVideos[0]) {
                    setVideoUrlOverride(safeMatchedVideos[0].mediaUrl);
                    if (!moduleTitle) setModuleTitle(safeMatchedVideos[0].title);
                  }
                }}
                className="shrink-0 rounded-xl border border-[#341D17]/15 bg-[#FAF6F0] hover:bg-[#F9DDBB]/50 px-3 py-2 text-xs font-bold text-[#341D17] cursor-pointer"
              >
                Pilih Video
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/65">
            <span>ATELIER RICH TEXT EDITOR</span>
            <span className="text-[#802924]">Baker&apos;s Formula Tools Ready</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {['B', 'I', 'U', 'H1', 'H2', 'H3', "% Baker's %", 'Time Step', 'Embed Video'].map(
              (tool) => (
                <button
                  key={tool}
                  type="button"
                  onClick={() =>
                    setBodyText((prev) =>
                      prev ? `${prev}\n[${tool}] ` : `[${tool}] `
                    )
                  }
                  className="rounded-lg border border-[#341D17]/12 bg-[#FAF6F0] hover:bg-[#F9DDBB]/50 px-2.5 py-1 text-[11px] font-bold text-[#341D17] cursor-pointer"
                >
                  {tool}
                </button>
              )
            )}
          </div>

          <textarea
            rows={4}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder="Tuliskan narasi pembelajaran, catatan resep, atau panduan langkah demi langkah di sini..."
            className="w-full rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] p-3.5 text-xs sm:text-sm text-[#341D17] placeholder:text-[#341D17]/40 focus:border-[#802924] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveModule(true)}
            className="rounded-2xl border border-[#341D17]/15 bg-[#FAF6F0] hover:bg-[#F9DDBB]/45 py-2.5 px-4 text-xs sm:text-sm font-bold text-[#341D17] transition cursor-pointer disabled:opacity-60"
          >
            Simpan Draf
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveModule(false)}
            className="rounded-2xl bg-[#802924] hover:bg-[#661F1B] py-2.5 px-4 text-xs sm:text-sm font-bold text-[#FFFDF9] transition cursor-pointer disabled:opacity-60"
          >
            Terbitkan Modul
          </button>
        </div>
      </section>
    </div>
  );
}