'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FaGem,
  FaPlus,
  FaCheck,
  FaClock,
  FaArrowRight,
  FaChevronUp,
  FaChevronDown,
} from 'react-icons/fa6';
import {
  getActiveStudentIdentity,
  saveActiveStudentId,
} from '@/lib/studentSessionClient';

function ChefHatIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.5 6a4.5 4.5 0 0 0-8.66-1.73A3.5 3.5 0 0 0 4.5 7.5c0 1.48.92 2.75 2.22 3.26L7.5 16.5h9l.78-5.74A3.5 3.5 0 0 0 19.5 7.5 1.5 1.5 0 0 0 17.5 6ZM8 18h8v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2Z" />
    </svg>
  );
}

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
  const lower = String(rawCat || '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ');
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
    lower.includes('decor') ||
    lower.includes('buttercream') ||
    lower.includes('glaze') ||
    lower.includes('fondant')
  ) {
    return 'Cake Decorating';
  }
  if (
    lower.includes('cookie') ||
    lower.includes('small bite') ||
    lower.includes('macaron') ||
    lower.includes('nastar') ||
    lower.includes('kastengel') ||
    lower.includes('putri salju')
  ) {
    return 'Cookies & Small Bites';
  }
  if (
    lower.includes('french') ||
    lower.includes('patisserie') ||
    lower.includes('pastry') ||
    lower.includes('croissant') ||
    lower.includes('madeleine') ||
    lower.includes('eclair') ||
    lower.includes('choux') ||
    lower.includes('opera') ||
    lower.includes('mille')
  ) {
    return 'French Patisserie & Pastry';
  }
  if (
    lower.includes('traditional') ||
    lower.includes('indonesian') ||
    lower.includes('indo') ||
    lower.includes('nusantara') ||
    lower.includes('lapis') ||
    lower.includes('bika') ||
    lower.includes('onde') ||
    lower.includes('klepon') ||
    lower.includes('serabi') ||
    lower.includes('putu')
  ) {
    return 'Traditional Indonesian Cakes';
  }
  return 'Bread & Yeast Goods';
}

function isYouTubeUrl(url) {
  const s = cleanUrl(url);
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(s);
}

function toYoutubeEmbedUrl(url) {
  try {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const parsed = new URL(normalized);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '').trim();
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (parsed.pathname.startsWith('/embed/')) return normalized;
    }
  } catch {
    return '';
  }
  return '';
}

function toPlayableVideoSrc(url) {
  const clean = cleanUrl(url);
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean)) return clean;
  const withSlash = clean.startsWith('/') ? clean : `/${clean}`;
  return withSlash
    .split('/')
    .map((seg, idx) => {
      if (idx === 0) return seg;
      try {
        return encodeURIComponent(decodeURIComponent(seg));
      } catch {
        return encodeURIComponent(seg);
      }
    })
    .join('/');
}

function matchesCourseId(rawCourseId, activeCourse) {
  if (!activeCourse) return false;
  const cleanRaw = String(rawCourseId ?? '').trim();
  if (!cleanRaw) return false;

  if (
    cleanRaw.toLowerCase() === String(activeCourse.id).toLowerCase() ||
    cleanRaw.toLowerCase() === String(activeCourse.numericId).toLowerCase()
  ) {
    return true;
  }

  const extractedDigits = cleanRaw.replace(/\D+/g, '');
  if (
    extractedDigits &&
    Number(extractedDigits) === Number(activeCourse.numericId)
  ) {
    return true;
  }

  return false;
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
    progress: Number(row?.progress ?? row?.progress_percentage ?? 0),
    remainingDays: Number(row?.remainingDays ?? row?.remaining_days ?? 180),
    badge: String(row?.badge || row?.tag || 'Kelas Atelier').trim(),
  };
}

function mapContentItem(row, idx = 0) {
  const title = String(
    row?.title || row?.content_title || row?.module_title || `Materi #${idx + 1}`
  ).trim();

  const rawMediaUrl = cleanUrl(
    row?.video_url || row?.media_url || row?.mediaUrl || ''
  );

  const textContent = String(
    row?.description ?? row?.summary ?? row?.content_text ?? row?.textContent ?? ''
  ).trim();

  const itemIsYouTube = isYouTubeUrl(rawMediaUrl);
  const isVideo = Boolean(rawMediaUrl);

  const rawId = row?.id ?? `content-${idx + 1}`;
  const orderIndex = Number(
    row?.order_index ?? row?.sort_order ?? row?.orderIndex ?? idx + 1
  );

  return {
    id: String(rawId),
    orderIndex: Number.isFinite(orderIndex) ? orderIndex : idx + 1,
    courseId: String(row?.course_id ?? row?.courseId ?? '').trim(),
    courseTitle: String(row?.course_title ?? row?.courseTitle ?? '').trim(),
    title,
    textContent,
    isYouTube: itemIsYouTube,
    type: itemIsYouTube ? 'YOUTUBE' : isVideo ? 'VIDEO' : 'TEKS',
    rawMediaUrl,
    mediaUrl: isVideo ? toPlayableVideoSrc(rawMediaUrl) : '',
  };
}

function deduplicateModules(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const sig = `${item.courseId}|${item.title.toLowerCase()}|${item.rawMediaUrl.toLowerCase()}`;
    if (!seen.has(sig)) {
      seen.add(sig);
      result.push(item);
    }
  }
  return result;
}

export default function StudentCoursesClient({
  initialCourses = [],
  initialContents = [],
  initialCourseId = '',
  initialCategory = '',
}) {
  const searchParams = useSearchParams();
  const queryCourseId =
    searchParams?.get('courseId') ||
    searchParams?.get('course') ||
    initialCourseId ||
    '';
  const queryCategory = searchParams?.get('category') || initialCategory || '';

  const allCourses = useMemo(
    () =>
      Array.isArray(initialCourses)
        ? initialCourses.map((row, idx) => mapCourseItem(row, idx))
        : [],
    [initialCourses]
  );

  const [enrolledIds, setEnrolledIds] = useState([]);
  const [completedKeys, setCompletedKeys] = useState([]);
  const [progressByCourse, setProgressByCourse] = useState({});
  const [togglingKey, setTogglingKey] = useState('');
  const [liveContents, setLiveContents] = useState([]);

  const serverContents = useMemo(
    () =>
      Array.isArray(initialContents)
        ? initialContents.map((row, idx) => mapContentItem(row, idx))
        : [],
    [initialContents]
  );

  useEffect(() => {
    let active = true;

    async function syncEnrollmentsAndProgress() {
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
          setCompletedKeys([]);
          setProgressByCourse({});
          return;
        }

        const [enrollRes, progressRes] = await Promise.all([
          fetch(`/api/student/enrollments?${params.toString()}`, {
            cache: 'no-store',
          }),
          fetch(`/api/student/module-progress?${params.toString()}`, {
            cache: 'no-store',
          }),
        ]);

        if (!active) return;

        const enrollData = enrollRes.ok
          ? await enrollRes.json().catch(() => null)
          : null;
        const progressData = progressRes.ok
          ? await progressRes.json().catch(() => null)
          : null;

        if (!active) return;

        const resolvedId = enrollData?.studentId || progressData?.studentId;
        if (resolvedId) {
          saveActiveStudentId(resolvedId, identity.studentName || '');
        }

        if (enrollData && Array.isArray(enrollData.enrollments)) {
          const ids = enrollData.enrollments
            .filter(
              (row) =>
                String(row?.status || 'active').toLowerCase() !== 'dropped'
            )
            .map((row) => Number(row?.course_id ?? row?.courseId))
            .filter((id) => Number.isInteger(id) && id > 0);
          setEnrolledIds(ids);

          const initialMap = {};
          for (const row of enrollData.enrollments) {
            const cId = String(row?.course_id ?? row?.courseId ?? '');
            if (cId) {
              initialMap[cId] = Number(row?.progress_percentage ?? 0);
            }
          }
          setProgressByCourse((prev) => ({ ...initialMap, ...prev }));
        } else {
          setEnrolledIds([]);
        }

        if (progressData && Array.isArray(progressData.completedKeys)) {
          setCompletedKeys(progressData.completedKeys);
        } else {
          setCompletedKeys([]);
        }

        if (
          progressData?.progressByCourse &&
          typeof progressData.progressByCourse === 'object'
        ) {
          setProgressByCourse((prev) => ({
            ...prev,
            ...progressData.progressByCourse,
          }));
        }
      } catch {
        if (active) {
          setEnrolledIds([]);
          setCompletedKeys([]);
        }
      }
    }

    syncEnrollmentsAndProgress();
    const timer = setTimeout(syncEnrollmentsAndProgress, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function refreshContents() {
      try {
        const res = await fetch('/api/student/course-contents', {
          cache: 'no-store',
        });
        if (!active || !res.ok) return;
        const data = await res.json().catch(() => null);
        if (active && Array.isArray(data?.contents)) {
          setLiveContents(
            data.contents.map((row, idx) => mapContentItem(row, idx))
          );
        }
      } catch {
        // Gunakan serverContents
      }
    }

    refreshContents();

    return () => {
      active = false;
    };
  }, []);

  const enrolledCourses = useMemo(() => {
    const enrolledSet = new Set(enrolledIds.map(Number));
    return allCourses.filter((c) => enrolledSet.has(Number(c.numericId)));
  }, [allCourses, enrolledIds]);

  const targetCourseFromQuery = useMemo(() => {
    const clean = String(queryCourseId || '').trim().toLowerCase();
    if (!clean) return null;
    return (
      allCourses.find(
        (c) =>
          String(c.id).toLowerCase() === clean ||
          String(c.numericId).toLowerCase() === clean ||
          c.title.toLowerCase() === clean
      ) || null
    );
  }, [allCourses, queryCourseId]);

  const [manualCategory, setManualCategory] = useState(null);
  const [manualCourseId, setManualCourseId] = useState(null);
  const [openItemId, setOpenItemId] = useState('');
  const [isCourseListOpen, setIsCourseListOpen] = useState(false);
  const [searchMaterial, setSearchMaterial] = useState('');
  const videoRef = useRef(null);

  const selectedCategory = useMemo(() => {
    if (manualCategory) return manualCategory;
    if (targetCourseFromQuery) {
      return normalizeCategory(targetCourseFromQuery.category);
    }
    if (queryCategory) {
      return normalizeCategory(queryCategory);
    }
    if (enrolledCourses.length > 0) {
      return normalizeCategory(enrolledCourses[0].category);
    }
    return 'Bread & Yeast Goods';
  }, [manualCategory, targetCourseFromQuery, queryCategory, enrolledCourses]);

  const selectedCourseId = useMemo(() => {
    if (manualCourseId !== null) return manualCourseId;
    if (targetCourseFromQuery) return String(targetCourseFromQuery.id);
    return '';
  }, [manualCourseId, targetCourseFromQuery]);

  useEffect(() => {
    if (!queryCourseId) return;
    const timer = window.setTimeout(() => {
      const targetEl = document.getElementById('silabus-kurikulum');
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [queryCourseId]);

  const filteredCourses = useMemo(() => {
    return enrolledCourses.filter(
      (c) => normalizeCategory(c.category) === selectedCategory
    );
  }, [enrolledCourses, selectedCategory]);

  const activeCourse =
    filteredCourses.find(
      (c) =>
        String(c.id) === String(selectedCourseId) ||
        String(c.numericId) === String(selectedCourseId)
    ) ||
    filteredCourses[0] ||
    null;

  const handleSelectCategory = (cat) => {
    setManualCategory(cat);
    const matching = enrolledCourses.filter(
      (c) => normalizeCategory(c.category) === cat
    );
    setManualCourseId(matching.length > 0 ? String(matching[0].id) : '');
    setOpenItemId('');
    setIsCourseListOpen(false);
  };

  const handleSelectCourse = (course) => {
    setManualCategory(normalizeCategory(course.category));
    setManualCourseId(String(course.id));
    setOpenItemId('');
    setIsCourseListOpen(false);
  };

  const courseContents = useMemo(() => {
    if (!activeCourse) return [];
    const activeTitle = String(activeCourse.title).toLowerCase();

    const sourceList = liveContents.length > 0 ? liveContents : serverContents;
    const matched = sourceList.filter((item) => {
      const itemCourseTitle = String(item.courseTitle || '').toLowerCase();
      return (
        matchesCourseId(item.courseId, activeCourse) ||
        (itemCourseTitle && itemCourseTitle === activeTitle)
      );
    });

    return deduplicateModules(
      [...matched].sort((a, b) => a.orderIndex - b.orderIndex)
    );
  }, [activeCourse, liveContents, serverContents]);

  const completedKeySet = useMemo(
    () => new Set(completedKeys.map(String)),
    [completedKeys]
  );

  const completedModulesCount = useMemo(() => {
    if (!activeCourse || courseContents.length === 0) return 0;
    return courseContents.filter((mod) =>
      completedKeySet.has(`${activeCourse.numericId}:${mod.id}`)
    ).length;
  }, [activeCourse, courseContents, completedKeySet]);

  const activeProgressPercent = useMemo(() => {
    if (!activeCourse) return 0;
    if (courseContents.length > 0) {
      return Math.min(
        100,
        Math.round((completedModulesCount / courseContents.length) * 100)
      );
    }
    return Number(progressByCourse[String(activeCourse.numericId)] ?? 0);
  }, [
    activeCourse,
    courseContents.length,
    completedModulesCount,
    progressByCourse,
  ]);

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
    const isVideo = mod.type === 'VIDEO' || mod.type === 'YOUTUBE';
    const hasText = Boolean(mod.textContent);
    if (!isVideo && !hasText) return;

    setOpenItemId((prev) => {
      const nextId = String(prev) === String(mod.id) ? '' : String(mod.id);
      if (nextId && mod.type === 'VIDEO' && mod.mediaUrl?.startsWith('/')) {
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

  const handleToggleModuleDone = async (mod) => {
    if (!activeCourse) return;
    const courseId = Number(activeCourse.numericId);
    const contentKey = String(mod.id);
    const compositeKey = `${courseId}:${contentKey}`;

    if (togglingKey === compositeKey) return;

    const nextDone = !completedKeySet.has(compositeKey);
    setTogglingKey(compositeKey);

    setCompletedKeys((prev) => {
      if (nextDone) {
        return prev.includes(compositeKey) ? prev : [...prev, compositeKey];
      }
      return prev.filter((item) => item !== compositeKey);
    });

    try {
      const identity = await getActiveStudentIdentity();
      const res = await fetch('/api/student/module-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: identity.studentId,
          studentName: identity.studentName,
          courseId,
          contentKey,
          totalModules: courseContents.length,
          completed: nextDone,
        }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        if (data.studentId) {
          saveActiveStudentId(data.studentId, identity.studentName || '');
        }
        if (Array.isArray(data.completedKeys)) {
          setCompletedKeys(data.completedKeys);
        }
        if (typeof data.progressPercentage === 'number') {
          setProgressByCourse((prev) => ({
            ...prev,
            [String(courseId)]: data.progressPercentage,
          }));
        }
      }
    } catch {
      // Abaikan jika gagal sinkronisasi jaringan
    } finally {
      setTogglingKey('');
    }
  };

  return (
    <div className="space-y-6 text-[#341D17] pb-12">
      <div className="space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFFDF9]/90 border border-[#802924]/15 px-3 py-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#802924]">
          <FaGem className="w-3 h-3 shrink-0" />
          <span>SEMESTER AKTIF &bull; YUGYO ATELIER</span>
        </span>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
              Materi Pembelajaran Saya
            </h1>
            <p className="text-xs sm:text-sm text-[#341D17]/75">
              Eksplorasi silabus pastry, video teknik, dan modul formula resep terdaftar dengan standar atelier profesional.
            </p>
          </div>

          <Link
            href="/dashboard/student/catalog"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFFDF9] hover:bg-[#F9DDBB]/70 border border-[#341D17]/15 px-3.5 py-2 text-xs font-bold text-[#341D17] transition shrink-0"
          >
            <FaPlus className="w-3 h-3 text-[#802924] shrink-0" />
            <span>Tambah Kursus</span>
          </Link>
        </div>

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
            <span className="inline-flex items-center gap-1 text-[#82882B] font-semibold">
              <FaCheck className="w-3 h-3 shrink-0" />
              <span>Terakreditasi Yugyo Atelier</span>
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
                <p className="inline-flex items-center gap-1.5 text-xs text-[#341D17]/65">
                  <ChefHatIcon className="w-3.5 h-3.5 text-[#802924] shrink-0" />
                  <span>
                    {activeCourse.instructor} &bull; {activeCourse.category}
                  </span>
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
                {activeProgressPercent}% Selesai &bull; {completedModulesCount}/
                {courseContents.length} Modul
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#F9DDBB]/70 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#802924] transition-all duration-300"
                style={{ width: `${activeProgressPercent}%` }}
              />
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-[#341D17]/60">
              <FaClock className="w-3 h-3 shrink-0" />
              <span>Sisa Waktu Akses: {activeCourse.remainingDays} Hari</span>
            </span>
            <a
              href="#silabus-kurikulum"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#802924] hover:bg-[#661F1B] px-4 py-2 text-xs font-bold text-[#FFFDF9] transition"
            >
              <span>Lanjutkan Belajar</span>
              <FaArrowRight className="w-3 h-3 shrink-0" />
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
            {isCourseListOpen ? (
              <FaChevronUp className="w-3 h-3 text-[#802924] shrink-0" />
            ) : (
              <FaChevronDown className="w-3 h-3 text-[#802924] shrink-0" />
            )}
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

      <section id="silabus-kurikulum" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-lg font-bold text-[#341D17]">
            Silabus Kurikulum{' '}
            <span className="ml-1.5 rounded-full bg-[#FFFDF9] border border-[#341D17]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#802924]">
              {visibleModules.length} Konten
            </span>
          </h2>
        </div>

        {visibleModules.length === 0 ? (
          <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 p-5 text-xs text-[#341D17]/65">
            {activeCourse
              ? `Belum ada modul yang ditambahkan instruktur pada Content Management untuk kursus "${activeCourse.title}".`
              : 'Pilih atau ikuti kursus terlebih dahulu untuk melihat silabus kurikulum.'}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleModules.map((mod, index) => {
              const isVideo = mod.type === 'VIDEO' || mod.type === 'YOUTUBE';
              const hasText = Boolean(mod.textContent);
              const isInteractive = isVideo || hasText;
              const isOpen = String(openItemId) === String(mod.id);
              const orderLabel = String(
                mod.orderIndex || index + 1
              ).padStart(2, '0');
              const typeLabel = mod.type;

              const compositeKey = activeCourse
                ? `${activeCourse.numericId}:${mod.id}`
                : String(mod.id);
              const isDone = completedKeySet.has(compositeKey);
              const isSavingDone = togglingKey === compositeKey;

              const actionLabel = isVideo
                ? isOpen
                  ? 'Tutup Video'
                  : 'Putar Video'
                : isOpen
                  ? 'Tutup Teks'
                  : 'Baca Teks';

              const youtubeEmbed = mod.isYouTube
                ? toYoutubeEmbedUrl(mod.rawMediaUrl)
                : '';

              return (
                <div
                  key={mod.id}
                  className={`rounded-2xl bg-[#FFFDF9] border transition overflow-hidden ${
                    isDone ? 'border-[#82882B]/45' : 'border-[#341D17]/12'
                  }`}
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
                    className={`px-5 py-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 ${
                      isInteractive ? 'cursor-pointer hover:bg-[#FAF6F0]/80' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                        URUTAN #{orderLabel} &bull; {typeLabel}
                      </p>
                      <p className="text-sm font-bold text-[#341D17] truncate">
                        {mod.title}
                      </p>
                      {isVideo ? (
                        <p className="text-xs text-[#341D17]/55 truncate">
                          {mod.rawMediaUrl}
                        </p>
                      ) : (
                        <p className="text-xs text-[#341D17]/55 truncate">
                          {isOpen
                            ? 'Klik untuk menutup teks modul'
                            : 'Klik untuk membaca isi teks modul'}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isSavingDone}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleModuleDone(mod);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold border transition cursor-pointer disabled:opacity-60 ${
                          isDone
                            ? 'bg-[#82882B] text-[#FFFDF9] border-[#82882B]'
                            : 'bg-[#FFFDF9] hover:bg-[#F9DDBB]/55 text-[#341D17] border-[#341D17]/15'
                        }`}
                      >
                        {isDone && <FaCheck className="w-2.5 h-2.5 shrink-0" />}
                        <span>{isDone ? 'Selesai' : 'Mark as Done'}</span>
                      </button>

                      {isInteractive && (
                        <span className="rounded-xl border border-[#341D17]/12 bg-[#FAF6F0] px-3 py-1.5 text-[11px] font-bold text-[#802924]">
                          {actionLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {isOpen && isVideo && (
                    <div className="px-5 pb-5 pt-1 space-y-3">
                      {youtubeEmbed ? (
                        <div className="overflow-hidden rounded-xl border border-[#341D17]/12 bg-[#0B0B0C] aspect-video">
                          <iframe
                            src={youtubeEmbed}
                            title={mod.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                          />
                        </div>
                      ) : mod.mediaUrl ? (
                        <div className="overflow-hidden rounded-xl border border-[#341D17]/12 bg-[#0B0B0C]">
                          <video
                            ref={videoRef}
                            key={mod.mediaUrl}
                            src={mod.mediaUrl}
                            controls
                            playsInline
                            preload="metadata"
                            className="w-full max-h-[420px] object-contain bg-[#0B0B0C]"
                          >
                            Browser Anda tidak mendukung pemutar video HTML5.
                          </video>
                        </div>
                      ) : null}

                      {hasText && (
                        <div className="rounded-xl border border-[#341D17]/12 bg-[#FAF6F0] p-4 text-xs sm:text-sm text-[#341D17]/85 whitespace-pre-line leading-relaxed">
                          {mod.textContent}
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={isSavingDone}
                          onClick={() => handleToggleModuleDone(mod)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold border transition cursor-pointer ${
                            isDone
                              ? 'bg-[#82882B] text-[#FFFDF9] border-[#82882B]'
                              : 'bg-[#802924] hover:bg-[#661F1B] text-[#FFFDF9] border-[#802924]'
                          }`}
                        >
                          {isDone && <FaCheck className="w-3 h-3 shrink-0" />}
                          <span>
                            {isDone
                              ? 'Modul Sudah Selesai'
                              : 'Tandai Modul Selesai (Mark as Done)'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {isOpen && !isVideo && hasText && (
                    <div className="px-5 pb-5 pt-1 space-y-3">
                      <div className="rounded-xl border border-[#341D17]/12 bg-[#FAF6F0] p-4 text-xs sm:text-sm text-[#341D17]/85 whitespace-pre-line leading-relaxed">
                        {mod.textContent}
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={isSavingDone}
                          onClick={() => handleToggleModuleDone(mod)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold border transition cursor-pointer ${
                            isDone
                              ? 'bg-[#82882B] text-[#FFFDF9] border-[#82882B]'
                              : 'bg-[#802924] hover:bg-[#661F1B] text-[#FFFDF9] border-[#802924]'
                          }`}
                        >
                          {isDone && <FaCheck className="w-3 h-3 shrink-0" />}
                          <span>
                            {isDone
                              ? 'Modul Sudah Selesai'
                              : 'Tandai Modul Selesai (Mark as Done)'}
                          </span>
                        </button>
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