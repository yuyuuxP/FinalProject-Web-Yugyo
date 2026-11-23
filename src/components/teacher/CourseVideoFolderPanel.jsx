'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function CourseVideoFolderPanel({
  courseId,
  courseTitle,
  categoryName = '',
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!courseTitle) return;
    let cancelled = false;

    async function loadMatchedVideos() {
      setLoading(true);
      setFeedback('');
      try {
        const params = new URLSearchParams({
          courseTitle,
          category: categoryName || '',
        });
        const res = await fetch(`/api/teacher/videos?${params.toString()}`);
        const data = await res.json();
        if (!cancelled && data?.success) {
          const list = Array.isArray(data.matchedVideos) ? data.matchedVideos : [];
          setVideos(list);
          setActiveVideoUrl(list[0]?.encodedUrl || '');
        }
      } catch {
        if (!cancelled) setVideos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMatchedVideos();
    return () => {
      cancelled = true;
    };
  }, [courseId, courseTitle, categoryName]);

  const handleSyncToSyllabus = async () => {
    if (!courseId || !courseTitle || syncing) return;
    setSyncing(true);
    setFeedback('');

    try {
      const res = await fetch('/api/teacher/contents/sync-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          course_title: courseTitle,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setFeedback(
          data.insertedCount > 0
            ? `${data.insertedCount} video berhasil ditambahkan ke silabus "${courseTitle}".`
            : `Semua video yang cocok (${data.matchedCount}) sudah terhubung di silabus "${courseTitle}".`
        );
        startTransition(() => {
          router.refresh();
        });
      } else {
        setFeedback(data?.error || 'Gagal menghubungkan video.');
      }
    } catch {
      setFeedback('Terjadi kesalahan saat menghubungkan video ke database.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#341D17]/12 bg-[#FFFDF9] p-4 sm:p-5 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
            FOLDER VIDEO PEMBELAJARAN • PUBLIC/VIDEOS
          </span>
          <h3 className="font-editorial text-base sm:text-lg font-bold text-[#341D17]">
            Video Terkait: {courseTitle}
          </h3>
        </div>

        <button
          type="button"
          disabled={syncing || videos.length === 0}
          onClick={handleSyncToSyllabus}
          className="rounded-xl bg-[#802924] hover:bg-[#661F1B] px-4 py-2 text-xs font-bold text-[#FFFDF9] transition cursor-pointer disabled:opacity-50"
        >
          {syncing ? 'Menyimpan...' : 'Hubungkan ke Materi Kursus'}
        </button>
      </div>

      {feedback && (
        <div className="rounded-2xl border border-[#341D17]/15 bg-[#F9DDBB]/55 px-3.5 py-2 text-xs font-bold text-[#341D17]">
          {feedback}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-[#341D17]/65 py-2">
          Mencocokkan file video dari folder kategori...
        </p>
      ) : videos.length === 0 ? (
        <p className="text-xs text-[#341D17]/65 py-2">
          Belum ada file video di folder kategori yang cocok dengan judul kursus ini.
        </p>
      ) : (
        <div className="space-y-3">
          {activeVideoUrl && (
            <div className="overflow-hidden rounded-2xl border border-[#341D17]/12 bg-[#FAF6F0]">
              <video
                key={activeVideoUrl}
                src={activeVideoUrl}
                controls
                className="w-full max-h-64 bg-black"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {videos.map((vid) => {
              const isSelected = activeVideoUrl === vid.encodedUrl;
              return (
                <button
                  key={vid.mediaUrl}
                  type="button"
                  onClick={() => setActiveVideoUrl(vid.encodedUrl)}
                  className={`flex items-center justify-between gap-2 rounded-2xl border p-3 text-left text-xs transition cursor-pointer ${
                    isSelected
                      ? 'border-[#802924] bg-[#F9DDBB]/45 text-[#341D17]'
                      : 'border-[#341D17]/12 bg-[#FAF6F0]/60 text-[#341D17] hover:bg-[#FAF6F0]'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-bold truncate">{vid.title}</p>
                    <p className="text-[10px] text-[#341D17]/60 truncate">
                      {vid.folder} &bull; {vid.fileName}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-[#802924] px-2.5 py-1 text-[10px] font-bold text-[#FFFDF9]">
                    {isSelected ? 'Diputar' : 'Putar'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}