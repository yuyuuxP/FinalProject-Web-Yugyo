'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  getActiveStudentIdentity,
  saveActiveStudentId,
} from '@/lib/studentSessionClient';

const CATEGORY_TABS = [
  'Bread & Yeast Goods',
  'Cake Decorating',
  'Cookies & Small Bites',
  'French Patisserie & Pastry',
  'Traditional Indonesian Cakes',
];

function cleanUrl(val) {
  const s = String(val || '').trim();
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') {
    return '';
  }
  return s;
}

function normalizeCategory(rawCat) {
  const lower = String(rawCat || '').toLowerCase();
  if (
    lower.includes('bread') ||
    lower.includes('yeast') ||
    lower.includes('roti') ||
    lower.includes('sourdough') ||
    lower.includes('ciabatta') ||
    lower.includes('brioche')
  ) {
    return 'Bread & Yeast Goods';
  }
  if (
    lower.includes('cake') &&
    (lower.includes('decor') ||
      lower.includes('buttercream') ||
      lower.includes('glaze'))
  ) {
    return 'Cake Decorating';
  }
  if (
    lower.includes('cookie') ||
    lower.includes('small bite') ||
    lower.includes('macaron') ||
    lower.includes('nastar')
  ) {
    return 'Cookies & Small Bites';
  }
  if (
    lower.includes('french') ||
    lower.includes('patisserie') ||
    lower.includes('pastry') ||
    lower.includes('croissant') ||
    lower.includes('madeleine')
  ) {
    return 'French Patisserie & Pastry';
  }
  if (
    lower.includes('traditional') ||
    lower.includes('indonesian') ||
    lower.includes('nusantara') ||
    lower.includes('lapis') ||
    lower.includes('bika')
  ) {
    return 'Traditional Indonesian Cakes';
  }
  return 'Bread & Yeast Goods';
}

function mapCourseItem(row, idx = 0) {
  const rawNum = Number(row?.numericId ?? row?.id ?? row?.course_id);
  const numericId =
    Number.isInteger(rawNum) && rawNum > 0 ? rawNum : idx + 1;
  const title = String(
    row?.title || row?.course_title || row?.name || `Kursus #${idx + 1}`
  ).trim();

  return {
    id: String(row?.id ?? numericId),
    numericId,
    title,
    category: normalizeCategory(row?.category || row?.category_name),
    instructor: String(
      row?.instructor ||
        row?.instructor_name ||
        row?.teacher_name ||
        'Chef Yugyo'
    ).trim(),
    progress: Number(row?.progress ?? 40),
    completedLessons: Number(
      row?.completedLessons ?? row?.completed_lessons ?? 4
    ),
    totalLessons: Number(row?.totalLessons ?? row?.total_lessons ?? 10),
    remainingDays: Number(row?.remainingDays ?? row?.remaining_days ?? 180),
    badge: String(row?.badge || row?.tag || 'Kelas Atelier').trim(),
    videoUrl: cleanUrl(
      row?.videoUrl || row?.video_url || row?.media_url || row?.file_url || ''
    ),
    videoTitle: String(row?.videoTitle || title).trim(),
  };
}

function mapContentItem(row, idx = 0) {
  const title = String(
    row?.title ||
      row?.content_title ||
      row?.module_title ||
      row?.lesson_title ||
      row?.name ||
      `Materi #${idx + 1}`
  ).trim();

  const mediaUrl = cleanUrl(
    row?.mediaUrl || row?.video_url || row?.file_url || row?.url || ''
  );

  const textContent = String(
    row?.textContent ||
      row?.content_text ||
      row?.body ||
      row?.text ||
      row?.description ||
      row?.summary ||
      row?.notes ||
      ''
  ).trim();

  const rawType = String(row?.type || row?.content_type || '')
    .trim()
    .toUpperCase();

  const isVideo =
    Boolean(mediaUrl) ||
    rawType.includes('VIDEO') ||
    rawType.includes('MP4') ||
    rawType.includes('WEBM');

  return {
    id: String(row?.id || row?.content_id || `content-${idx + 1}`),
    courseId: String(
      row?.courseId || row?.course_id || row?.parent_course_id || ''
    ).trim(),
    courseTitle: String(
      row?.courseTitle || row?.course_title || row?.course_name || ''
    ).trim(),
    title,
    textContent:
      textContent ||
      (!isVideo
        ? `Catatan modul untuk ${title}. Silakan lengkapi isi teks modul pada content management.`
        : ''),
    type: isVideo ? 'VIDEO' : 'TEKS',
    mediaUrl: isVideo ? mediaUrl : '',
  };
}

export default function StudentCoursesClient({
  initialCourses = [],
  initialContents = [],
}) {
  const allCourses = useMemo(
    () =>
      Array.isArray(initialCourses)
        ? initialCourses.map((row, idx) => mapCourseItem(row, idx))
        : [],
    [initialCourses]
  );

  const [enrolledIds, setEnrolledIds] = useState([]);

  const contents = useMemo(
    () =>
      Array.isArray(initialContents)
        ? initialContents.map((row, idx) => mapContentItem(row, idx))
        : [],
    [initialContents]
  );

  useEffect(() => {
    let active = true;

    async function syncEnrollmentsForActiveStudent() {
      try {
        const identity = await getActiveStudentIdentity();
        if (!active) return;

        const params = new URLSearchParams();
        if (identity.studentId) {
          params.set('studentId', String(identity.studentId));
        }
        if (identity.studentName) {
          params.set('studentName', identity.studentName);
        }

        if (!identity.studentId && !identity.studentName) {
          setEnrolledIds([]);
          return;
        }

        const res = await fetch(`/api/student/enrollments?${params.toString()}`, {
          cache: 'no-store',
        });
        if (!active) return;

        if (!res.ok) {
          setEnrolledIds([]);
          return;
        }

        const data = await res.json().catch(() => null);
        if (!active) return;

        if (!data || !Array.isArray(data.enrollments)) {
          setEnrolledIds([]);
          return;
        }

        if (data.studentId) {
          saveActiveStudentId(data.studentId, identity.studentName || '');
        }

        const ids = data.enrollments
          .filter(
            (row) =>
              String(row?.status || 'active').toLowerCase() !== 'dropped'
          )
          .map((row) => Number(row?.course_id ?? row?.courseId))
          .filter((id) => Number.isInteger(id) && id > 0);

        setEnrolledIds(ids);
      } catch {
        if (active) setEnrolledIds([]);
      }
    }

    syncEnrollmentsForActiveStudent();
    const timer = setTimeout(syncEnrollmentsForActiveStudent, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  const enrolledCourses = useMemo(() => {
    const enrolledSet = new Set(enrolledIds.map(Number));
    return allCourses.filter((c) => enrolledSet.has(Number(c.numericId)));
  }, [allCourses, enrolledIds]);

  const [selectedCategory, setSelectedCategory] = useState('Bread & Yeast Goods');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [openItemId, setOpenItemId] = useState('');
  const [isCourseListOpen, setIsCourseListOpen] = useState(false);
  const [searchMaterial, setSearchMaterial] = useState('');
  const videoRef = useRef(null);

  const filteredCourses = useMemo(() => {
    return enrolledCourses.filter(
      (c) => normalizeCategory(c.category) === selectedCategory
    );
  }, [enrolledCourses, selectedCategory]);

  const activeCourse =
    filteredCourses.find((c) => String(c.id) === String(selectedCourseId)) ||
    filteredCourses[0] ||
    null;

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    const matching = enrolledCourses.filter(
      (c) => normalizeCategory(c.category) === cat
    );
    setSelectedCourseId(matching.length > 0 ? String(matching[0].id) : '');
    setOpenItemId('');
    setIsCourseListOpen(false);
  };

  const handleSelectCourse = (course) => {
    setSelectedCourseId(String(course.id));
    setOpenItemId('');
    setIsCourseListOpen(false);
  };

  const courseContents = useMemo(() => {
    if (!activeCourse) return [];
    const activeId = String(activeCourse.id).toLowerCase();
    const activeNumId = String(activeCourse.numericId).toLowerCase();
    const activeTitle = String(activeCourse.title).toLowerCase();

    const matched = contents.filter((item) => {
      const itemCourseId = String(item.courseId || '').toLowerCase();
      const itemCourseTitle = String(item.courseTitle || '').toLowerCase();
      return (
        (itemCourseId &&
          (itemCourseId === activeId || itemCourseId === activeNumId)) ||
        (itemCourseTitle && itemCourseTitle === activeTitle)
      );
    });

    if (matched.length === 0 && activeCourse.videoUrl) {
      return [
        {
          id: `course-video-${activeCourse.id}`,
          courseId: activeCourse.id,
          courseTitle: activeCourse.title,
          title: activeCourse.videoTitle || activeCourse.title,
          textContent: '',
          type: 'VIDEO',
          mediaUrl: activeCourse.videoUrl,
        },
      ];
    }

    return matched;
  }, [contents, activeCourse]);

  const visibleModules = useMemo(() => {
    const q = searchMaterial.trim().toLowerCase();
    return courseContents.filter(
      (m) =>
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.textContent.toLowerCase().includes(q)
    );
  }, [courseContents, searchMaterial]);

  const handleToggleItem = (mod) => {
    const isVideo = mod.type === 'VIDEO' && Boolean(mod.mediaUrl);
    const hasText = Boolean(mod.textContent);
    if (!isVideo && !hasText) return;

    setOpenItemId((prev) => {
      const nextId = String(prev) === String(mod.id) ? '' : String(mod.id);
      if (nextId && isVideo) {
        window.requestAnimationFrame(() => {
          const playPromise = videoRef.current?.play?.();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
          }
        });
      }
      return nextId;
    });
  };

  return (
    <div className="space-y-6 text-[#341D17] pb-12">
      <div className="space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F9DDBB]/85 border border-[#802924]/15 px-3 py-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#802924]">
          <span>&#9670;</span>
          <span>SEMESTER AKTIF &bull; YUGYO ATELIER</span>
        </span>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
              Materi Pembelajaran Saya
            </h1>
            <p className="text-xs sm:text-sm text-[#341D17]/65">
              Eksplorasi silabus pastry, video teknik, dan modul formula resep terdaftar dengan standar atelier profesional.
            </p>
          </div>

          <Link
            href="/dashboard/student/catalog"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FAF6F0] hover:bg-[#F9DDBB]/70 border border-[#341D17]/15 px-3.5 py-2 text-xs font-bold text-[#341D17] transition shrink-0"
          >
            <span>+ Tambah Kursus</span>
          </Link>
        </div>

        {/* Filter 5 Kategori Utama */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {CATEGORY_TABS.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer border ${
                  isActive
                    ? 'bg-[#802924] text-[#FFFDF9] border-[#802924]'
                    : 'bg-[#FFFDF9] text-[#341D17]/80 hover:bg-[#F9DDBB]/55 border-[#341D17]/15'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Kartu Kursus Aktif */}
      {activeCourse ? (
        <section className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="font-extrabold uppercase tracking-wider text-[#802924]">
                KURSUS AKTIF
              </span>
              <span className="font-semibold text-[#341D17]/75">
                {activeCourse.category}
              </span>
            </div>
            <span className="text-[#4E7A4E] font-semibold">
              &#10003; Terakreditasi Yugyo Atelier
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-24 h-20 rounded-2xl bg-[#F9DDBB] border border-[#341D17]/10 flex items-center justify-center text-xs font-bold text-[#802924] shrink-0 text-center px-2">
                {activeCourse.badge}
              </div>
              <div className="space-y-1">
                <h2 className="font-editorial text-xl font-bold text-[#341D17]">
                  {activeCourse.title}
                </h2>
                <p className="text-xs text-[#341D17]/65">
                  &#128104;&#8205;&#127859; {activeCourse.instructor} &bull;{' '}
                  {activeCourse.category}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#341D17]/75">
                Progres Pembelajaran
              </span>
              <span className="font-bold text-[#341D17]">
                {activeCourse.progress}% Selesai &bull;{' '}
                {visibleModules.length} Konten
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#F9DDBB]/70 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#802924] transition-all"
                style={{ width: `${activeCourse.progress}%` }}
              />
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#341D17]/60">
              &#9200; Sisa Waktu Akses: {activeCourse.remainingDays} Hari
            </span>
            <a
              href="#silabus-kurikulum"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#802924] hover:bg-[#661F1B] px-4 py-2 text-xs font-bold text-[#FFFDF9] transition"
            >
              <span>Lanjutkan Belajar</span>
              <span>&rarr;</span>
            </a>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 p-6 text-center space-y-3">
          <p className="text-sm font-bold text-[#341D17]">
            Belum ada kursus yang diikuti pada kategori {selectedCategory}
          </p>
          <p className="text-xs text-[#341D17]/65">
            Tekan tombol &ldquo;Ikuti Kursus&rdquo; pada halaman Course Catalog agar kursus muncul di sini.
          </p>
          <div>
            <Link
              href="/dashboard/student/catalog"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#802924] hover:bg-[#661F1B] px-4 py-2 text-xs font-bold text-[#FFFDF9] transition"
            >
              <span>Buka Course Catalog</span>
            </Link>
          </div>
        </section>
      )}

      {/* Pencarian Materi & Dropdown Kursus Terdaftar */}
      <div className="space-y-3">
        <input
          type="text"
          value={searchMaterial}
          onChange={(e) => setSearchMaterial(e.target.value)}
          placeholder="Cari materi atau topik resep..."
          className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-4 py-2.5 text-xs sm:text-sm text-[#341D17] placeholder:text-[#341D17]/45 focus:border-[#802924] focus:outline-none"
        />

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setIsCourseListOpen((prev) => !prev)}
            className="w-full sm:w-auto inline-flex items-center justify-between gap-3 rounded-xl bg-[#FFFDF9] hover:bg-[#F9DDBB]/45 border border-[#341D17]/15 px-4 py-2.5 text-xs font-bold text-[#341D17] transition cursor-pointer"
          >
            <span>
              {activeCourse?.title ||
                `Belum Ada Kursus Diikuti (${selectedCategory})`}
            </span>
            <span className="text-[#802924]">
              {isCourseListOpen ? '▲' : '▼'}
            </span>
          </button>

          {isCourseListOpen && (
            <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 p-2 space-y-1.5 max-w-xl">
              {filteredCourses.length === 0 ? (
                <p className="px-3 py-2 text-xs text-[#341D17]/60">
                  Belum ada kursus yang diikuti pada kategori {selectedCategory}.
                </p>
              ) : (
                filteredCourses.map((course) => {
                  const isSelected =
                    String(activeCourse?.id) === String(course.id);
                  return (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => handleSelectCourse(course)}
                      className={`w-full text-left rounded-xl px-3.5 py-2.5 text-xs transition cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#F9DDBB] text-[#802924] font-extrabold'
                          : 'hover:bg-[#FAF6F0] text-[#341D17] font-semibold'
                      }`}
                    >
                      <span className="truncate">{course.title}</span>
                      <span className="text-[11px] opacity-70 shrink-0">
                        {course.instructor}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Silabus Kurikulum */}
      <section id="silabus-kurikulum" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-lg font-bold text-[#341D17]">
            Silabus Kurikulum{' '}
            <span className="ml-1.5 rounded-full bg-[#F9DDBB]/75 px-2.5 py-0.5 text-[11px] font-bold text-[#802924]">
              {visibleModules.length} Konten
            </span>
          </h2>
        </div>

        {visibleModules.length === 0 ? (
          <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 p-5 text-xs text-[#341D17]/65">
            {activeCourse
              ? `Belum ada konten atau file video di folder public/videos untuk kursus "${activeCourse.title}".`
              : 'Pilih atau ikuti kursus terlebih dahulu untuk melihat silabus kurikulum.'}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleModules.map((mod, index) => {
              const isVideo = mod.type === 'VIDEO' && Boolean(mod.mediaUrl);
              const hasText = Boolean(mod.textContent);
              const isInteractive = isVideo || hasText;
              const isOpen = String(openItemId) === String(mod.id);
              const orderLabel = String(index + 1).padStart(2, '0');
              const typeLabel = isVideo ? 'VIDEO' : 'TEKS';

              const actionLabel = isVideo
                ? isOpen
                  ? 'Tutup Video'
                  : 'Putar Video'
                : isOpen
                  ? 'Tutup Teks'
                  : 'Baca Teks';

              return (
                <div
                  key={mod.id}
                  className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 transition overflow-hidden"
                >
                  <div
                    role={isInteractive ? 'button' : undefined}
                    tabIndex={isInteractive ? 0 : undefined}
                    onClick={() => handleToggleItem(mod)}
                    onKeyDown={(e) => {
                      if (
                        isInteractive &&
                        (e.key === 'Enter' || e.key === ' ')
                      ) {
                        e.preventDefault();
                        handleToggleItem(mod);
                      }
                    }}
                    className={`px-5 py-4 flex items-center justify-between gap-4 ${
                      isInteractive ? 'cursor-pointer hover:bg-[#FAF6F0]/80' : ''
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                        URUTAN #{orderLabel} &bull; {typeLabel}
                      </p>
                      <p className="text-sm font-bold text-[#341D17] truncate">
                        {mod.title}
                      </p>
                      {isVideo ? (
                        <p className="text-xs text-[#341D17]/55 truncate">
                          {decodeURIComponent(mod.mediaUrl)}
                        </p>
                      ) : (
                        <p className="text-xs text-[#341D17]/55 truncate">
                          {isOpen
                            ? 'Klik untuk menutup teks modul'
                            : 'Klik untuk membaca isi teks modul'}
                        </p>
                      )}
                    </div>

                    {isInteractive && (
                      <span className="rounded-xl border border-[#341D17]/12 bg-[#FAF6F0] px-3 py-1.5 text-[11px] font-bold text-[#802924] shrink-0">
                        {actionLabel}
                      </span>
                    )}
                  </div>

                  {isOpen && isVideo && (
                    <div className="px-5 pb-5 pt-1">
                      <div className="overflow-hidden rounded-xl border border-[#341D17]/12 bg-[#0B0B0C]">
                        <video
                          ref={videoRef}
                          key={mod.mediaUrl}
                          src={mod.mediaUrl}
                          controls
                          preload="metadata"
                          className="w-full max-h-[420px] object-contain bg-[#0B0B0C]"
                        >
                          Browser Anda tidak mendukung pemutar video HTML5.
                        </video>
                      </div>
                    </div>
                  )}

                  {isOpen && !isVideo && hasText && (
                    <div className="px-5 pb-5 pt-1">
                      <div className="rounded-xl border border-[#341D17]/12 bg-[#FAF6F0] p-4 text-xs sm:text-sm text-[#341D17]/85 whitespace-pre-line leading-relaxed">
                        {mod.textContent}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}