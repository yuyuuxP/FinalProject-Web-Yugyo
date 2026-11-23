'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

function cleanStr(val) {
  const s = String(val ?? '').trim();
  return !s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined'
    ? ''
    : s;
}

function isYouTubeUrl(url) {
  const s = cleanStr(url);
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(s);
}

function normalizeExternalUrl(url) {
  const s = cleanStr(url);
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

function isVideoPath(url) {
  const s = cleanStr(url);
  if (!s || isYouTubeUrl(s)) return false;
  return /\.(mp4|webm|mov|m4v|mkv)$/i.test(s) || s.startsWith('/videos/');
}

function toPlayableVideoSrc(url) {
  const s = cleanStr(url);
  if (!s) return '';
  return s
    .split('/')
    .map((seg, idx) =>
      idx === 0 ? seg : encodeURIComponent(decodeURIComponent(seg))
    )
    .join('/');
}

export default function AdminCourseDetailModal({
  course,
  contents: initialContents = [],
  courseId,
  onClose,
  onEdit,
  onDelete,
}) {
  const router = useRouter();
  const videoRef = useRef(null);
  const [fetchedModules, setFetchedModules] = useState([]);
  const [expandedUid, setExpandedUid] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const activeCourseId = course?.id ?? courseId;
  const hasPropContents =
    Array.isArray(initialContents) && initialContents.length > 0;

  useEffect(() => {
    if (hasPropContents || !activeCourseId) return;

    let cancelled = false;
    fetch(`/api/teacher/contents?courseId=${Number(activeCourseId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const rows = data.contents || data.data || [];
        if (Array.isArray(rows)) {
          setFetchedModules(rows);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [activeCourseId, hasPropContents]);

  const sortedModules = useMemo(() => {
    const sourceList = hasPropContents ? initialContents : fetchedModules;
    const list = Array.isArray(sourceList) ? sourceList : [];

    return [...list]
      .map((m, idx) => ({
        ...m,
        __uid: String(m?.id ?? `mod-${idx}`),
        title: m?.title || 'Modul Pembelajaran',
        description: String(m?.description ?? ''),
        video_url: cleanStr(m?.video_url) || null,
        order_index:
          Number(m?.order_index) > 0 ? Number(m.order_index) : idx + 1,
      }))
      .sort(
        (a, b) => (Number(a.order_index) || 999) - (Number(b.order_index) || 999)
      );
  }, [hasPropContents, initialContents, fetchedModules]);

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
      return;
    }
    router.push('/dashboard/admin/courses');
  };

  const handleEditClick = () => {
    if (typeof onEdit === 'function') {
      onEdit(course);
      return;
    }
    router.push(`/dashboard/admin/courses/${activeCourseId}/edit`);
  };

  const handleDeleteClick = async () => {
    if (!activeCourseId || deleting) return;
    if (typeof onDelete === 'function') {
      setDeleting(true);
      try {
        await onDelete(course);
      } finally {
        setDeleting(false);
      }
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/courses/${Number(activeCourseId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/dashboard/admin/courses');
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleModule = (mod) => {
    const uid = mod.__uid;
    const willOpen = expandedUid !== uid;
    setExpandedUid(willOpen ? uid : null);

    if (willOpen && isYouTubeUrl(mod.video_url)) {
      window.open(
        normalizeExternalUrl(mod.video_url),
        '_blank',
        'noopener,noreferrer'
      );
    } else if (willOpen && isVideoPath(mod.video_url)) {
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    }
  };

  const statusText = `AKTIF (${String(course?.status || 'PUBLISHED').toUpperCase()})`;

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2A1712]/60 backdrop-blur-[1px] p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#FFFDF9] border border-[#341D17]/15 p-5 sm:p-6 text-[#341D17] shadow-2xl space-y-5"
      >
        {/* BARIS ATAS: KODE KURSUS + TOMBOL EDIT, HAPUS, TUTUP */}
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-md bg-[#F9DDBB]/75 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
            #CRS-{String(activeCourseId || '000').padStart(3, '0')}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEditClick}
              className="inline-flex items-center gap-1 rounded-lg border border-[#341D17]/15 bg-[#FFFDF9] hover:bg-[#FAF6F0] px-2.5 py-1 text-[11px] font-bold text-[#341D17] transition cursor-pointer"
            >
              <span>&#9998;</span>
              <span>Edit</span>
            </button>

            <button
              type="button"
              disabled={deleting}
              onClick={handleDeleteClick}
              className="inline-flex items-center gap-1 rounded-lg border border-[#802924]/25 bg-[#FFFDF9] hover:bg-[#802924] hover:text-[#FFFDF9] px-2.5 py-1 text-[11px] font-bold text-[#802924] transition cursor-pointer disabled:opacity-60"
            >
              <span>&#128465;</span>
              <span>{deleting ? 'Menghapus...' : 'Hapus'}</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Tutup detail kursus"
              className="rounded-full bg-[#802924] hover:bg-[#661F1B] w-7 h-7 flex items-center justify-center text-sm font-bold text-[#FFFDF9] transition cursor-pointer"
            >
              &times;
            </button>
          </div>
        </div>

        {/* KATEGORI, JUDUL, INSTRUKTUR & STATUS KURASI KONTEN */}
        <div className="space-y-3">
          <span className="inline-block rounded-md bg-[#F9DDBB]/65 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
            {course?.category_name || 'FRENCH PATISSERIE & PASTRY'}
          </span>

          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17] leading-tight">
            {course?.title || 'Masterclass Classic Croissant'}
          </h1>

          <div className="rounded-2xl border border-[#341D17]/10 bg-[#FAF6F0]/80 p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#802924] text-[#FFFDF9] flex items-center justify-center text-xs font-extrabold shrink-0">
              {String(course?.instructor_name || 'A')
                .charAt(0)
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#341D17] truncate">
                {course?.instructor_name || 'Ayu'}
              </p>
              <p className="text-[11px] text-[#341D17]/65 truncate">
                {course?.instructor_specialty ||
                  'Master Baker & Atelier Instructor'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#341D17]/10 bg-[#FAF6F0]/55 px-4 py-3 flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]/65">
              &bull; STATUS KURASI KONTEN
            </span>
            <span className="rounded-full bg-[#4D7C0F] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
              {statusText}
            </span>
          </div>
        </div>

        {/* DAFTAR MODUL YANG DIMASUKKAN GURU DI CONTENT MANAGEMENT */}
        <div className="space-y-3 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-editorial text-lg font-bold text-[#341D17]">
              Modul Materi ({sortedModules.length})
            </h2>
            <span className="text-[11px] text-[#341D17]/55">
              Klik 1x buka deskripsi/video, klik lagi tutup
            </span>
          </div>

          {sortedModules.length === 0 ? (
            <div className="rounded-2xl border border-[#341D17]/10 bg-[#FAF6F0]/75 p-4 text-center text-xs text-[#341D17]/65">
              Belum ada modul yang ditambahkan oleh instruktur di Content Management untuk kursus ini.
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedModules.map((mod) => {
                const uid = mod.__uid;
                const vidUrl = cleanStr(mod.video_url);
                const descText = cleanStr(mod.description);
                const modIsYouTube = isYouTubeUrl(vidUrl);
                const modHasVideo = isVideoPath(vidUrl);
                const isExpanded = expandedUid === uid;

                return (
                  <div
                    key={uid}
                    onClick={() => handleToggleModule(mod)}
                    className={`rounded-2xl border p-3.5 space-y-2.5 transition cursor-pointer ${
                      isExpanded
                        ? 'border-[#802924] bg-[#F9DDBB]/35'
                        : 'border-[#341D17]/12 bg-[#FAF6F0]/75 hover:bg-[#F9DDBB]/25'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                        URUTAN #{String(mod.order_index).padStart(2, '0')} &bull;{' '}
                        {modIsYouTube ? 'YOUTUBE' : modHasVideo ? 'VIDEO' : 'TEKS'}
                      </p>
                      <p className="text-sm font-bold text-[#341D17]">
                        {mod.title}
                      </p>
                      {vidUrl && (
                        <p className="text-[11px] text-[#341D17]/60 truncate">
                          {vidUrl}
                        </p>
                      )}
                    </div>

                    {isExpanded && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="space-y-2.5 pt-1"
                      >
                        {modIsYouTube && (
                          <div className="rounded-xl border border-[#341D17]/12 bg-[#FFFDF9] p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-[#341D17]/80 truncate">
                              Tautan YouTube: {vidUrl}
                            </span>
                            <a
                              href={normalizeExternalUrl(vidUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg bg-[#802924] hover:bg-[#661F1B] px-3 py-1.5 text-[11px] font-bold text-[#FFFDF9] transition"
                            >
                              Buka di YouTube
                            </a>
                          </div>
                        )}

                        {modHasVideo && (
                          <div className="overflow-hidden rounded-2xl border border-[#341D17]/15 bg-black">
                            <video
                              ref={videoRef}
                              key={toPlayableVideoSrc(vidUrl)}
                              src={toPlayableVideoSrc(vidUrl)}
                              controls
                              autoPlay
                              playsInline
                              className="w-full max-h-72 object-contain"
                            />
                          </div>
                        )}

                        {descText && (
                          <div className="rounded-xl border border-[#341D17]/10 bg-[#FFFDF9] p-3 text-xs text-[#341D17]/85 whitespace-pre-line leading-relaxed">
                            {descText}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}