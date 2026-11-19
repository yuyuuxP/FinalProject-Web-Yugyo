'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const FALLBACK_IMAGES = [
  '/pictures/courses/french_patisserie/Madeleines.png',
  '/pictures/courses/french_patisserie/macaron.png',
  '/pictures/categories/french_patisserie.png',
  '/pictures/categories/cakes_decorating.png',
  '/pictures/categories/cookies.png',
  '/pictures/categories/bread&yeast_goods.png',
  '/pictures/categories/indonesian_cakes.png',
];

function resolveCourseBanner(course, idx = 0) {
  const raw = course?.thumbnail_url || course?.image_url || course?.banner_url || '';
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw.trim();
  }

  const titleLower = (course?.title || '').toLowerCase();
  if (titleLower.includes('madeleine')) {
    return '/pictures/courses/french_patisserie/Madeleines.png';
  }
  if (titleLower.includes('macaron')) {
    return '/pictures/courses/french_patisserie/macaron.png';
  }

  const catLower = (course?.category_name || '').toLowerCase();
  if (catLower.includes('french') || catLower.includes('patisserie') || catLower.includes('pastry')) {
    return '/pictures/categories/french_patisserie.png';
  }
  if (catLower.includes('cake') || catLower.includes('decor')) {
    return '/pictures/categories/cakes_decorating.png';
  }
  if (catLower.includes('cookie')) {
    return '/pictures/categories/cookies.png';
  }
  if (catLower.includes('bread') || catLower.includes('yeast')) {
    return '/pictures/categories/bread&yeast_goods.png';
  }
  if (catLower.includes('indonesian')) {
    return '/pictures/categories/indonesian_cakes.png';
  }

  return FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
}

function getStatusBadge(status) {
  const s = String(status || 'active').toLowerCase();
  if (s === 'pending') {
    return {
      label: 'PENDING',
      className: 'bg-[#F9DDBB] text-[#802924]',
    };
  }
  if (s === 'draft') {
    return {
      label: 'DRAFT',
      className: 'bg-[#FFFDF9]/90 text-[#341D17]',
    };
  }
  return {
    label: 'AKTIF TAYANG',
    className: 'bg-[#F9DDBB] text-[#341D17]',
  };
}

export default function CourseManagementClient({ courses = [], teacherName = 'Chef Ayu' }) {
  const router = useRouter();
  const initialCourses = Array.isArray(courses) ? courses : [];
  const [courseList, setCourseList] = useState(initialCourses);
  const [prevCoursesRef, setPrevCoursesRef] = useState(courses);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState('');

  if (courses !== prevCoursesRef) {
    setPrevCoursesRef(courses);
    setCourseList(Array.isArray(courses) ? courses : []);
  }

  const handleDeleteCourse = async (course) => {
    if (!course?.id || deletingId) return;

    const confirmed = window.confirm(
      `Yakin ingin menghapus kursus "${course.title || 'ini'}"? File gambar dan data kursus akan dihapus.`
    );
    if (!confirmed) return;

    setDeletingId(course.id);
    setActionError('');

    try {
      const res = await fetch(`/api/teacher/courses/${course.id}`, {
        method: 'DELETE',
      });

      const rawText = await res.text();
      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        const msg =
          data?.message ||
          data?.error ||
          data?.detail ||
          `Gagal menghapus kursus (Status ${res.status}).`;
        throw new Error(msg);
      }

      setCourseList((prev) => prev.filter((item) => item.id !== course.id));
      router.refresh();
    } catch (err) {
      setActionError(err?.message || 'Gagal menghapus kursus.');
    } finally {
      setDeletingId(null);
    }
  };

  const counts = useMemo(() => {
    const active = courseList.filter((c) =>
      ['active', 'published'].includes(String(c?.status || 'active').toLowerCase())
    ).length;
    const draft = courseList.filter((c) => String(c?.status || '').toLowerCase() === 'draft').length;
    const pending = courseList.filter(
      (c) => String(c?.status || '').toLowerCase() === 'pending'
    ).length;
    return {
      all: courseList.length,
      active,
      draft,
      pending,
    };
  }, [courseList]);

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return courseList.filter((course) => {
      const st = String(course?.status || 'active').toLowerCase();
      const matchTab =
        activeTab === 'all' ||
        (activeTab === 'active' && ['active', 'published'].includes(st)) ||
        (activeTab === 'draft' && st === 'draft') ||
        (activeTab === 'pending' && st === 'pending');

      if (!matchTab) return false;
      if (!q) return true;

      const titleMatch = String(course?.title || '').toLowerCase().includes(q);
      const descMatch = String(course?.description || '').toLowerCase().includes(q);
      const catMatch = String(course?.category_name || '').toLowerCase().includes(q);
      return titleMatch || descMatch || catMatch;
    });
  }, [courseList, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="block text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#802924]">
            STUDIO ATELIER CHEF
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17]">
            Kelola Kelas Saya
          </h1>
        </div>

        <Link
          href="/dashboard/teacher/courses/create"
          className="self-start sm:self-auto rounded-2xl bg-[#802924] hover:bg-[#661F1B] px-5 py-3 text-xs sm:text-sm font-bold text-[#F9DDBB] shadow-md transition inline-flex items-center gap-2"
        >
          <span>+</span>
          <span>Buat Kursus</span>
        </Link>
      </div>

      {/* BANNER PEMBERITAHUAN KURASI */}
      <div className="rounded-3xl border border-[#341D17]/15 bg-[#FFFDF9] p-4 sm:p-5 shadow-2xs space-y-1">
        <p className="text-xs sm:text-sm font-bold text-[#341D17]">
          Proses Kurasi Akademik
        </p>
        <p className="text-[11px] sm:text-xs text-[#341D17]/75">
          Pemberitahuan: Setiap kursus baru yang diajukan akan ditinjau oleh Admin Atelier Yugyo sebelum dipublikasikan ke siswa. Kursus yang berstatus pending tidak dapat diedit kembali.
        </p>
      </div>

      {actionError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-800">
          {actionError}
        </div>
      )}

      {/* FILTER TAB & PENCARIAN */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/50'
            }`}
          >
            Semua ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTab === 'active'
                ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/50'
            }`}
          >
            Sedang Tayang ({counts.active})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('draft')}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTab === 'draft'
                ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/50'
            }`}
          >
            Draft ({counts.draft})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-[#802924] text-[#F9DDBB] shadow-xs'
                : 'bg-[#FFFDF9] text-[#341D17] border border-[#341D17]/15 hover:bg-[#F9DDBB]/50'
            }`}
          >
            Pending ({counts.pending})
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari judul kursus..."
          className="w-full md:w-64 rounded-2xl border border-[#341D17]/15 bg-[#FFFDF9] px-4 py-2 text-xs text-[#341D17] placeholder:text-[#341D17]/40 focus:outline-none focus:ring-2 focus:ring-[#802924]"
        />
      </div>

      {/* DAFTAR KARTU KURSUS */}
      {filteredCourses.length === 0 ? (
        <div className="rounded-3xl border border-[#341D17]/20 bg-[#FFFDF9] p-8 text-center text-xs text-[#341D17]/70">
          Tidak ada kursus yang sesuai dengan filter atau pencarian.
        </div>
      ) : (
        <div className="space-y-5">
          {filteredCourses.map((course, idx) => {
            const bannerSrc = resolveCourseBanner(course, idx);
            const badge = getStatusBadge(course?.status);
            const enrolledCount = Number(course?.enrolled_count ?? course?.student_count ?? 0);
            const isOwner = course?.is_owner !== false;
            const isDeleting = deletingId === course.id;

            return (
              <div
                key={course.id ?? idx}
                className="overflow-hidden rounded-3xl border border-[#341D17]/20 bg-[#FFFDF9] shadow-sm transition hover:shadow-md"
              >
                {/* BANNER GAMBAR KURSUS */}
                <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-[#341D17]">
                  <img
                    src={bannerSrc}
                    alt={course.title || 'Kursus'}
                    className="h-full w-full object-cover object-center"
                  />

                  <div
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(25,14,11,0.35) 0%, rgba(25,14,11,0.08) 45%, rgba(25,14,11,0.68) 100%)',
                    }}
                    className="pointer-events-none absolute inset-0"
                  />

                  <div className="relative z-10 flex items-center justify-between gap-2 p-4">
                    <span className="rounded-full bg-[#341D17]/75 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#F9DDBB] backdrop-blur-xs">
                      {course?.category_name || 'FRENCH PATISSERIE & PASTRY'}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-2xs ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-between px-4 py-2.5 text-[11px] font-semibold text-[#F9DDBB]">
                    <span>Akses Lifetime</span>
                    <span>{enrolledCount} Siswa</span>
                  </div>
                </div>

                {/* BAGIAN KONTEN BAWAH KARTU */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17]">
                      {course.title}
                    </h3>
                    {course.description && (
                      <p className="text-xs sm:text-sm text-[#341D17]/75 line-clamp-2">
                        {course.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#341D17]/10 pt-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#802924] text-[10px] font-extrabold text-[#F9DDBB]">
                        {String(course?.instructor_initials || 'AY').slice(0, 2).toUpperCase()}
                      </span>
                      <span className="text-xs font-semibold text-[#341D17]">
                        {course?.instructor_name || teacherName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOwner && (
                        <span className="rounded-full bg-[#F9DDBB]/70 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#802924]">
                          MILIK ANDA
                        </span>
                      )}

                      <Link
                        href={`/dashboard/teacher/courses/${course.id}/edit`}
                        className="rounded-xl border border-[#341D17]/20 bg-[#FFFDF9] hover:bg-[#F9DDBB]/60 px-3 py-1.5 text-xs font-bold text-[#341D17] transition"
                      >
                        Ubah
                      </Link>

                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDeleteCourse(course)}
                        className="rounded-xl border border-[#802924]/30 bg-[#802924]/10 hover:bg-[#802924] hover:text-[#F9DDBB] px-3 py-1.5 text-xs font-bold text-[#802924] transition cursor-pointer disabled:opacity-50"
                      >
                        {isDeleting ? 'Menghapus...' : 'Hapus'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}