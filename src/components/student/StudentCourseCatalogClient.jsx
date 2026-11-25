'use client';

import { useEffect, useMemo, useState } from 'react';
import { FaGem, FaStar, FaCheck, FaUserTie } from 'react-icons/fa6';
import {
  getActiveStudentIdentity,
  saveActiveStudentId,
} from '@/lib/studentSessionClient';

const CATEGORY_TABS = [
  'Semua Kategori',
  'Bread & Yeast Goods',
  'Cake Decorating',
  'Cookies & Small Bites',
  'French Patisserie & Pastry',
  'Traditional Indonesian Cakes',
];

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
  const numericId = Number(row?.id ?? row?.course_id);
  return {
    id: Number.isInteger(numericId) && numericId > 0 ? numericId : idx + 1,
    title: String(
      row?.title || row?.course_title || row?.name || `Kursus #${idx + 1}`
    ).trim(),
    description: String(
      row?.description ||
        row?.summary ||
        'Kelas praktik baking & pastry bersama instruktur Yugyo Atelier.'
    ).trim(),
    category: normalizeCategory(row?.category || row?.category_name),
    instructor: String(
      row?.instructor ||
        row?.instructor_name ||
        row?.teacher_name ||
        'Chef Yugyo'
    ).trim(),
    rating: String(row?.rating ?? '4.9').trim(),
    studentsCount: String(
      row?.studentsCount ?? row?.students_count ?? row?.enrolled_count ?? '120'
    ).trim(),
    badge: String(row?.badge || row?.tag || 'KELAS ATELIER').trim(),
    thumbnail: String(
      row?.thumbnail || row?.image_url || row?.cover_url || row?.image || ''
    ).trim(),
  };
}

export default function StudentCourseCatalogClient({
  initialCourses = [],
  initialEnrolledCourseIds = [],
}) {
  const courses = useMemo(
    () =>
      Array.isArray(initialCourses)
        ? initialCourses.map((row, idx) => mapCourseItem(row, idx))
        : [],
    [initialCourses]
  );

  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [searchQuery, setSearchQuery] = useState('');
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(() =>
    Array.isArray(initialEnrolledCourseIds) ? initialEnrolledCourseIds : []
  );
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  const [enrollFeedback, setEnrollFeedback] = useState('');
  const [activeIdentity, setActiveIdentity] = useState({
    studentId: null,
    studentName: '',
  });

  useEffect(() => {
    let active = true;

    async function syncCatalogEnrollments() {
      try {
        const identity = await getActiveStudentIdentity();
        if (!active) return;
        setActiveIdentity(identity);

        const params = new URLSearchParams();
        if (identity.studentId) {
          params.set('studentId', String(identity.studentId));
        }
        if (identity.studentName) {
          params.set('studentName', identity.studentName);
        }

        if (!identity.studentId && !identity.studentName) {
          setEnrolledCourseIds([]);
          return;
        }

        const res = await fetch(`/api/student/enrollments?${params.toString()}`, {
          cache: 'no-store',
        });
        if (!active) return;

        if (!res.ok) {
          setEnrolledCourseIds([]);
          return;
        }

        const data = await res.json().catch(() => null);
        if (!active || !data || !Array.isArray(data.enrollments)) {
          if (active) setEnrolledCourseIds([]);
          return;
        }

        if (data.studentId) {
          saveActiveStudentId(data.studentId, identity.studentName || '');
          setActiveIdentity((prev) => ({ ...prev, studentId: data.studentId }));
        }

        const ids = data.enrollments
          .map((row) => Number(row?.course_id ?? row?.courseId))
          .filter((id) => Number.isInteger(id) && id > 0);
        setEnrolledCourseIds(ids);
      } catch {
        if (active) setEnrolledCourseIds([]);
      }
    }

    syncCatalogEnrollments();
    const timer = setTimeout(syncCatalogEnrollments, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  async function handleFollowCourse(course) {
    const courseId = Number(course?.id ?? course?.course_id);
    if (!courseId || enrollingCourseId === courseId) return;

    setEnrollingCourseId(courseId);
    setEnrollFeedback('');

    try {
      const latestIdentity = await getActiveStudentIdentity();
      setActiveIdentity(latestIdentity);

      const res = await fetch('/api/student/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          studentId: latestIdentity.studentId,
          studentName: latestIdentity.studentName,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Gagal menyimpan pendaftaran kursus');
      }

      if (data?.studentId) {
        saveActiveStudentId(data.studentId, latestIdentity.studentName || '');
        setActiveIdentity((prev) => ({ ...prev, studentId: data.studentId }));
      }

      setEnrolledCourseIds((prev) =>
        prev.includes(courseId) ? prev : [...prev, courseId]
      );
      setEnrollFeedback(
        data?.alreadyEnrolled
          ? `Kamu sudah terdaftar pada "${course?.title || 'kursus ini'}".`
          : `Berhasil mengikuti "${course?.title || 'kursus ini'}" pada akun ${latestIdentity.studentName || 'student aktif'}.`
      );
    } catch (err) {
      setEnrollFeedback(
        err?.message || 'Terjadi kesalahan saat mendaftar kursus.'
      );
    } finally {
      setEnrollingCourseId(null);
    }
  }

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesCat =
        selectedCategory === 'Semua Kategori' ||
        normalizeCategory(course.category) === selectedCategory;
      const matchesSearch =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        course.instructor.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [courses, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 text-[#341D17] pb-12">
      <div className="space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFFDF9]/90 border border-[#802924]/15 px-3 py-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#802924]">
          <FaGem className="w-3 h-3 shrink-0" />
          <span>KATALOG KURSUS &bull; YUGYO ATELIER</span>
        </span>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
              Katalog Kursus Baking &amp; Pastry
            </h1>
            <p className="text-xs sm:text-sm text-[#341D17]/75">
              Pilih dan ikuti kelas sesuai minat kategori untuk mulai belajar di Yugyo Atelier.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {CATEGORY_TABS.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
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

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari judul kursus atau nama instruktur..."
          className="w-full rounded-xl border border-[#341D17]/15 bg-[#FFFDF9] px-4 py-2.5 text-xs sm:text-sm text-[#341D17] placeholder:text-[#341D17]/45 focus:border-[#802924] focus:outline-none"
        />

        {enrollFeedback && (
          <div className="rounded-2xl bg-[#FFFDF9] border border-[#802924]/20 px-4 py-3 text-xs font-semibold text-[#802924]">
            {enrollFeedback}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCourses.map((course) => {
          const courseId = Number(course?.id ?? course?.course_id);
          const isEnrolled = enrolledCourseIds.includes(courseId);
          const isLoading = enrollingCourseId === courseId;

          return (
            <article
              key={courseId}
              className="rounded-3xl bg-[#FFFDF9] border border-[#341D17]/12 overflow-hidden shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 w-full bg-[#F9DDBB]/65 border-b border-[#341D17]/10 overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-sm font-bold text-[#802924] px-4 text-center">
                      {course.title}
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="rounded-md bg-[#802924] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#FFFDF9]">
                      {course.badge}
                    </span>
                    <span className="rounded-md bg-[#FAF6F0]/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#341D17]">
                      {course.category}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[#341D17]/60">
                    <span className="inline-flex items-center gap-1">
                      <FaStar className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>
                        {course.rating} ({course.studentsCount} Siswa)
                      </span>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        isEnrolled ? 'text-[#82882B]' : 'text-[#802924]/80'
                      }`}
                    >
                      {isEnrolled && <FaCheck className="w-2.5 h-2.5 shrink-0" />}
                      <span>{isEnrolled ? 'Sudah Terdaftar' : 'Belum Diikuti'}</span>
                    </span>
                  </div>

                  <h2 className="font-editorial text-lg font-bold text-[#341D17]">
                    {course.title}
                  </h2>

                  <p className="text-xs text-[#341D17]/70 leading-relaxed">
                    {course.description}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-2 flex items-center justify-between gap-3 border-t border-[#341D17]/8">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#341D17]/70">
                  <FaUserTie className="w-3 h-3 text-[#802924] shrink-0" />
                  <span>{course.instructor}</span>
                </span>

                <button
                  type="button"
                  disabled={isEnrolled || isLoading}
                  onClick={() => handleFollowCourse(course)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 inline-flex items-center gap-1.5 ${
                    isEnrolled
                      ? 'bg-[#82882B] text-[#FFFDF9] cursor-default opacity-90'
                      : 'bg-[#802924] hover:bg-[#661F1B] text-[#FFFDF9] cursor-pointer disabled:opacity-65'
                  }`}
                >
                  {isEnrolled && <FaCheck className="w-3 h-3 shrink-0" />}
                  <span>
                    {isEnrolled
                      ? 'Terdaftar'
                      : isLoading
                        ? 'Menyimpan...'
                        : 'Ikuti Kursus'}
                  </span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}