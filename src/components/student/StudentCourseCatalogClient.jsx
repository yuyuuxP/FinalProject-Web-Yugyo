'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

const CATEGORIES = [
  'Semua Kategori',
  'Bread & Yeast Goods',
  'Cake Decorating',
  'Cookies & Small Bites',
  'French Patisserie & Pastry',
  'Traditional Indonesian Cakes',
];

const ENROLLED_STORAGE_KEY = 'yugyo_student_enrolled_courses';

function normalizeCategory(rawCat) {
  const lower = String(rawCat || '').toLowerCase();
  if (
    lower.includes('bread') ||
    lower.includes('yeast') ||
    lower.includes('roti') ||
    lower.includes('sourdough')
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
  return String(rawCat || 'French Patisserie & Pastry').trim();
}

function mapCourseRow(item, idx = 0) {
  const title = String(
    item?.title || item?.course_title || item?.name || `Kursus #${idx + 1}`
  ).trim();
  const id = String(
    item?.id ||
      item?.course_id ||
      item?.slug ||
      title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  ).trim();

  const imageUrl = String(
    item?.imageUrl ||
      item?.image_url ||
      item?.thumbnail_url ||
      item?.thumbnailUrl ||
      item?.photo_url ||
      item?.photoUrl ||
      item?.cover_url ||
      item?.coverUrl ||
      item?.image ||
      ''
  ).trim();

  return {
    id,
    title,
    category: normalizeCategory(
      item?.category || item?.category_name || 'French Patisserie & Pastry'
    ),
    instructor: String(
      item?.instructor ||
        item?.instructor_name ||
        item?.teacher_name ||
        'Chef Yugyo'
    ).trim(),
    rating: String(item?.rating ?? '4.9'),
    studentsCount: Number(
      item?.studentsCount ?? item?.students_count ?? item?.enrolled_count ?? 120
    ),
    badge: String(item?.badge || item?.tag || 'Kelas Atelier').trim(),
    accessLabel: String(
      item?.accessLabel || item?.access_label || 'Akses Terbuka'
    ).trim(),
    summary: String(
      item?.summary ||
        item?.description ||
        'Materi praktik kelas baking & pastry di Yugyo Atelier.'
    ).trim(),
    imageUrl,
  };
}

function readEnrolledIds() {
  if (typeof window === 'undefined') return [];
  try {
    const raw =
      window.sessionStorage.getItem(ENROLLED_STORAGE_KEY) ||
      window.localStorage.getItem(ENROLLED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function saveEnrolledIds(ids) {
  if (typeof window === 'undefined') return;
  try {
    const unique = Array.from(new Set(ids.map(String)));
    const serialized = JSON.stringify(unique);
    window.sessionStorage.setItem(ENROLLED_STORAGE_KEY, serialized);
    window.localStorage.setItem(ENROLLED_STORAGE_KEY, serialized);
  } catch {
    // Abaikan jika storage tidak tersedia
  }
}

export default function StudentCourseCatalogClient({ initialCourses = [] }) {
  const imageMapRef = useRef(new Map());

  const [courses, setCourses] = useState(() =>
    Array.isArray(initialCourses)
      ? initialCourses.map((row, idx) => mapCourseRow(row, idx))
      : []
  );
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [searchQuery, setSearchQuery] = useState('');
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [enrollingId, setEnrollingId] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    const nextMap = new Map();
    if (Array.isArray(initialCourses)) {
      initialCourses.forEach((row, idx) => {
        const mapped = mapCourseRow(row, idx);
        if (mapped.imageUrl) {
          nextMap.set(mapped.title.toLowerCase(), mapped.imageUrl);
          nextMap.set(String(mapped.id), mapped.imageUrl);
        }
      });
    }
    imageMapRef.current = nextMap;
  }, [initialCourses]);

  useEffect(() => {
    const stored = readEnrolledIds();
    const timer = window.setTimeout(() => {
      if (stored.length > 0) {
        setEnrolledIds(stored);
      }
    }, 0);

    fetch('/api/courses', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.courses)
            ? data.courses
            : Array.isArray(data?.data)
              ? data.data
              : null;
        if (Array.isArray(list) && list.length > 0) {
          const map = imageMapRef.current;
          setCourses(
            list.map((row, idx) => {
              const mapped = mapCourseRow(row, idx);
              const matchedPic =
                mapped.imageUrl ||
                map.get(mapped.title.toLowerCase()) ||
                map.get(String(mapped.id)) ||
                '';
              return { ...mapped, imageUrl: matchedPic };
            })
          );
        }
      })
      .catch(() => {});

    return () => window.clearTimeout(timer);
  }, []);

  const visibleCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesCategory =
        selectedCategory === 'Semua Kategori' ||
        normalizeCategory(course.category) === selectedCategory;
      const matchesQuery =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.category.toLowerCase().includes(q) ||
        course.instructor.toLowerCase().includes(q) ||
        course.summary.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [courses, selectedCategory, searchQuery]);

  const handleFollowCourse = async (course) => {
    const courseId = String(course.id);
    if (enrolledIds.includes(courseId) || enrollingId) return;

    setEnrollingId(courseId);
    setFeedbackMsg('');

    try {
      await fetch('/api/student/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          courseTitle: course.title,
          category: course.category,
        }),
      }).catch(() => null);

      const nextIds = Array.from(new Set([...enrolledIds, courseId]));
      setEnrolledIds(nextIds);
      saveEnrolledIds(nextIds);
      setFeedbackMsg(
        `Berhasil mengikuti kursus "${course.title}". Kursus sudah ditambahkan ke menu Course.`
      );
    } finally {
      setEnrollingId('');
    }
  };

  return (
    <div className="space-y-6 text-[#341D17] pb-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F9DDBB]/85 border border-[#802924]/15 px-3 py-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#802924]">
            <span>&#127856;</span>
            <span>YUGYO ATELIER CATALOG</span>
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
            Course Catalog
          </h1>
          <p className="text-xs sm:text-sm text-[#341D17]/65">
            Jelajahi seluruh kategori kelas baking dan pastry yang tersedia di Yugyo Atelier.
          </p>
        </div>

        <Link
          href="/dashboard/student/courses"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#802924] hover:bg-[#661F1B] text-[#FFFDF9] px-4 py-2.5 text-xs font-bold transition shrink-0 shadow-2xs"
        >
          <span>Kursus Saya</span>
          <span>&rarr;</span>
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((category) => {
            const isActive = selectedCategory === category;
            const count =
              category === 'Semua Kategori'
                ? courses.length
                : courses.filter(
                    (c) => normalizeCategory(c.category) === category
                  ).length;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer border ${
                  isActive
                    ? 'bg-[#802924] text-[#FFFDF9] border-[#802924]'
                    : 'bg-[#FFFDF9] text-[#341D17]/80 hover:bg-[#F9DDBB]/55 border-[#341D17]/15'
                }`}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul kursus, kategori, atau pengajar..."
              className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-4 py-2 text-xs sm:text-sm text-[#341D17] placeholder:text-[#341D17]/45 focus:border-[#802924] focus:outline-none"
            />
          </div>

          <p className="text-xs font-semibold text-[#341D17]/60">
            Menampilkan {visibleCourses.length} kursus
          </p>
        </div>
      </div>

      {feedbackMsg && (
        <div className="rounded-2xl bg-[#F9DDBB]/75 border border-[#802924]/25 px-4 py-3 text-xs sm:text-sm font-semibold text-[#802924] flex flex-wrap items-center justify-between gap-3">
          <span>{feedbackMsg}</span>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/student/courses"
              className="text-xs font-extrabold underline"
            >
              Lihat di Course &rarr;
            </Link>
            <button
              type="button"
              onClick={() => setFeedbackMsg('')}
              className="text-xs font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {visibleCourses.length === 0 ? (
        <div className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 p-6 text-center space-y-2">
          <p className="text-sm font-bold text-[#341D17]">
            Belum ada kursus yang cocok dengan filter atau pencarian ini.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('Semua Kategori');
              setSearchQuery('');
            }}
            className="inline-flex items-center rounded-xl bg-[#FAF6F0] hover:bg-[#F9DDBB]/65 border border-[#341D17]/15 px-3.5 py-1.5 text-xs font-bold text-[#341D17] cursor-pointer"
          >
            Tampilkan Semua Kursus
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleCourses.map((course) => {
            const isEnrolled = enrolledIds.includes(String(course.id));
            const isSubmitting = enrollingId === String(course.id);

            return (
              <article
                key={course.id}
                className="rounded-2xl bg-[#FFFDF9] border border-[#341D17]/12 overflow-hidden shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-[#F9DDBB]/40 border-b border-[#341D17]/10">
                    {course.imageUrl ? (
                      <img
                        src={course.imageUrl}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-[#FAF6F0] text-xs font-bold text-[#802924]/70">
                        Belum ada foto kursus
                      </div>
                    )}

                    <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 z-10">
                      <span className="inline-flex items-center rounded-full bg-[#FFFDF9]/95 border border-[#341D17]/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                        {course.badge}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-[#341D17]/90 text-[#FFFDF9] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        {course.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[#341D17]/65">
                      <span>
                        &#9733; {course.rating} ({course.studentsCount} Siswa)
                      </span>
                      <span>{course.accessLabel}</span>
                    </div>

                    <h2 className="font-editorial text-lg font-bold text-[#341D17] leading-snug">
                      {course.title}
                    </h2>

                    <p className="text-xs text-[#341D17]/70 leading-relaxed">
                      {course.summary}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3.5 border-t border-[#341D17]/10 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-[#341D17]/75 truncate">
                    &#128104;&#8205;&#127859; {course.instructor}
                  </span>

                  {isEnrolled ? (
                    <Link
                      href="/dashboard/student/courses"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#F9DDBB] border border-[#802924]/25 px-4 py-2 text-xs font-extrabold text-[#802924] transition shrink-0"
                    >
                      <span>&#10003; Diikuti</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleFollowCourse(course)}
                      className="inline-flex items-center justify-center rounded-xl bg-[#802924] hover:bg-[#661F1B] disabled:opacity-60 px-4 py-2 text-xs font-bold text-[#FFFDF9] transition cursor-pointer shrink-0"
                    >
                      <span>
                        {isSubmitting ? 'Mendaftar...' : 'Ikuti Kursus'}
                      </span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}