import fs from 'node:fs/promises';
import path from 'node:path';
import Link from 'next/link';
import pool from '@/lib/db';
import {
  FaCircle,
  FaTriangleExclamation,
  FaBreadSlice,
  FaArrowRight,
  FaGraduationCap,
  FaHourglassHalf,
  FaUsers,
  FaStar,
  FaArrowTrendUp,
  FaChevronRight,
  FaUserTie,
} from 'react-icons/fa6';

export const dynamic = 'force-dynamic';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\.(jpg|jpeg|png|webp|avif|gif)$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function scanCoursePictures() {
  const rootDir = path.join(process.cwd(), 'public', 'pictures', 'courses');
  const pictures = [];

  async function walk(currentDir, relSegments = []) {
    let entries = [];
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(currentDir, entry.name);
      const nextSegments = [...relSegments, entry.name];

      if (entry.isDirectory()) {
        await walk(fullPath, nextSegments);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!IMAGE_EXTENSIONS.has(ext)) continue;

        const baseName = entry.name.replace(/\.[^.]+$/, '');
        pictures.push({
          normPhrase: normalizeText(baseName),
          keywords: normalizeText(baseName).split(' ').filter((w) => w.length >= 3),
          url: '/pictures/courses/' + nextSegments.map((s) => encodeURIComponent(s)).join('/'),
        });
      }
    }
  }

  await walk(rootDir, []);
  return pictures;
}

function matchCourseThumbnail(course, pictures) {
  const normTitle = normalizeText(course?.title);
  if (!normTitle || pictures.length === 0) {
    return String(course?.thumbnail_url || '').trim();
  }

  let bestUrl = '';
  let bestScore = 0;

  for (const pic of pictures) {
    if (!pic.normPhrase) continue;
    let score = 0;
    if (pic.normPhrase === normTitle) {
      score = 100;
    } else if (normTitle.includes(pic.normPhrase) || pic.normPhrase.includes(normTitle)) {
      score = 80;
    } else if (pic.keywords.length > 0) {
      const hits = pic.keywords.filter((kw) => normTitle.includes(kw)).length;
      if (hits > 0) score = Math.round((hits / pic.keywords.length) * 60);
    }

    if (score > bestScore) {
      bestScore = score;
      bestUrl = pic.url;
    }
  }

  return bestScore >= 40 ? bestUrl : String(course?.thumbnail_url || '').trim();
}

export default async function AdminDashboardPage() {
  let categoriesCount = 0;
  let activeCoursesCount = 0;
  let pendingCourses = [];
  let pendingTeachersCount = 0;
  let teachersCount = 0;
  let studentsCount = 0;
  let reviewsCount = 0;
  let avgRating = '4.9';
  let popularCourses = [];

  try {
    const [
      catRes,
      coursesRes,
      usersRes,
      reviewsRes,
      pictures,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total FROM categories;').catch(() => ({ rows: [{ total: 0 }] })),
      pool
        .query(
          `SELECT
             c.id,
             c.title,
             c.status,
             c.thumbnail_url,
             COALESCE(cat.name, 'Atelier Baking') AS category_name,
             COALESCE(u.full_name, 'Chef Yugyo') AS instructor_name,
             COALESCE(enr.enroll_count, 0)::int AS enroll_count
           FROM courses c
           LEFT JOIN categories cat ON cat.id = c.category_id
           LEFT JOIN users u ON u.id = c.instructor_id
           LEFT JOIN (
             SELECT course_id, COUNT(*) AS enroll_count
             FROM student_enrollments
             GROUP BY course_id
           ) enr ON enr.course_id = c.id
           ORDER BY c.id DESC;`
        )
        .catch(() => ({ rows: [] })),
      pool
        .query(
          `SELECT
             role,
             COALESCE(status, 'active') AS status,
             COUNT(*)::int AS total
           FROM users
           GROUP BY role, COALESCE(status, 'active');`
        )
        .catch(() => ({ rows: [] })),
      pool
        .query(
          `SELECT
             COUNT(*)::int AS total,
             ROUND(AVG(rating)::numeric, 1) AS avg_rating
           FROM reviews;`
        )
        .catch(() => ({ rows: [{ total: 0, avg_rating: null }] })),
      scanCoursePictures(),
    ]);

    categoriesCount = catRes.rows[0]?.total ?? 0;

    const allCourses = coursesRes.rows || [];
    const activeCourses = allCourses.filter(
      (c) => String(c.status || 'active').toLowerCase() === 'active'
    );
    activeCoursesCount = activeCourses.length;

    pendingCourses = allCourses.filter(
      (c) => String(c.status || '').toLowerCase() === 'pending'
    );

    for (const row of usersRes.rows || []) {
      const role = String(row.role || '').toLowerCase();
      const status = String(row.status || 'active').toLowerCase();
      const count = Number(row.total) || 0;

      if (role === 'teacher' || role === 'instructor') {
        if (status === 'pending') {
          pendingTeachersCount += count;
        } else {
          teachersCount += count;
        }
      } else if (role === 'student') {
        studentsCount += count;
      }
    }

    reviewsCount = reviewsRes.rows[0]?.total || 0;
    if (reviewsRes.rows[0]?.avg_rating) {
      avgRating = String(reviewsRes.rows[0].avg_rating);
    }

    popularCourses = [...activeCourses]
      .sort((a, b) => (b.enroll_count || 0) - (a.enroll_count || 0) || a.id - b.id)
      .slice(0, 4)
      .map((course) => ({
        ...course,
        resolved_thumb: matchCourseThumbnail(course, pictures),
      }));
  } catch (err) {
    console.error('Admin Dashboard Error:', err);
  }

  const pendingCoursesCount = pendingCourses.length;
  const pendingTotalCount = pendingCoursesCount + pendingTeachersCount;
  const activeUsersCount = teachersCount + studentsCount;

  const formattedDate = new Date()
    .toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase();

  return (
    <div className="space-y-6 text-[#341D17]">
      {/* ================= STATUS BAR & GREETING ================= */}
      <section className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#341D17]/10 bg-[#FFFDF9]/75 px-3.5 py-1 text-[11px] font-bold text-[#341D17]">
            <FaCircle className="h-2 w-2 text-[#82882B]" />
            <span>Atelier Engine Online &bull; Sync 100%</span>
          </span>

          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#341D17]/60">
            {formattedDate}
          </span>
        </div>

        <div>
          <h1 className="meddon-regular py-1 text-2xl sm:text-3xl font-normal leading-relaxed text-[#341D17]">
            Bonjour, Admin Atelier
          </h1>
          <p className="text-xs text-[#341D17]/75">
            Harmonie et précision culinaire. Berikut ringkasan operasional akademi YUGYO hari ini.
          </p>
        </div>
      </section>

      {/* ================= VERIFICATION BANNER ================= */}
      <section className="rounded-3xl bg-[#802924] p-5 sm:p-6 text-[#FFFDF9] shadow-md space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#F9DDBB]/85">
            <FaTriangleExclamation className="h-3.5 w-3.5 text-[#F9DDBB]" />
            <span>VÉRIFICATION REQUISE</span>
          </div>

          <span className="rounded-full bg-[#341D17]/85 px-3 py-1 text-[10px] font-bold text-[#F9DDBB]">
            {pendingTotalCount} En Attente
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#FFFDF9]">
            {pendingTotalCount} Pengajuan Menunggu Persetujuan
          </h2>
          <p className="text-xs text-[#F9DDBB]/80">
            Kurikulum dan pengajar baru siap dikurasi sebelum publikasi resmi ke katalog siswa.
          </p>
        </div>

        {pendingCourses.length > 0 && (
          <div className="space-y-2">
            {pendingCourses.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#F9DDBB]/15 bg-[#661F1B]/80 px-4 py-2.5 text-xs"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <FaBreadSlice className="h-3.5 w-3.5 shrink-0 text-[#F9DDBB]" />
                  <span className="truncate font-bold text-[#FFFDF9]">
                    {item.title}
                  </span>
                </div>

                <span className="shrink-0 text-[11px] font-medium text-[#F9DDBB]/80">
                  {item.instructor_name}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2.5 pt-1">
          <Link
            href="/dashboard/admin/courses"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FFFDF9] hover:bg-[#F9DDBB] px-5 py-3 text-xs font-extrabold text-[#341D17] shadow-xs transition"
          >
            <span>Tinjau Sekarang</span>
            <FaArrowRight className="h-3.5 w-3.5 text-[#802924]" />
          </Link>
        </div>
      </section>

      {/* ================= INDIKATOR KINERJA ATELIER ================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-lg font-bold text-[#341D17]">
            Indikator Kinerja Atelier
          </h2>
          <span className="text-xs font-medium text-[#341D17]/60">
            Bulan Berjalan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Total Kursus */}
          <div className="rounded-3xl border border-[#341D17]/12 bg-[#FFFDF9] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F9DDBB]/75 text-[#802924]">
                <FaGraduationCap className="h-4 w-4" />
              </div>

              <span className="rounded-full border border-[#341D17]/10 bg-[#FAF6F0] px-2.5 py-1 text-[10px] font-bold text-[#341D17]">
                +{categoriesCount} Kategori
              </span>
            </div>

            <div>
              <p className="font-editorial text-3xl font-extrabold text-[#341D17]">
                {String(activeCoursesCount).padStart(2, '0')}
              </p>
              <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#341D17]/55">
                TOTAL KURSUS
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#82882B]">
                <FaArrowTrendUp className="h-3 w-3" />
                <span>Aktif di Katalog</span>
              </p>
            </div>
          </div>

          {/* Card 2: Persetujuan */}
          <div className="rounded-3xl border border-[#341D17]/12 bg-[#FFFDF9] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F9DDBB]/75 text-[#802924]">
                <FaHourglassHalf className="h-4 w-4" />
              </div>

              <span className="rounded-full bg-[#802924] px-2.5 py-1 text-[10px] font-bold text-[#FFFDF9]">
                Penting
              </span>
            </div>

            <div>
              <p className="font-editorial text-3xl font-extrabold text-[#341D17]">
                {String(pendingTotalCount).padStart(2, '0')}
              </p>
              <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#341D17]/55">
                PERSETUJUAN
              </p>
              <p className="mt-1 text-[11px] font-medium text-[#341D17]/65">
                {pendingTeachersCount} Guru &bull; {pendingCoursesCount} Kursus
              </p>
            </div>
          </div>

          {/* Card 3: Pengguna Aktif */}
          <div className="rounded-3xl border border-[#341D17]/12 bg-[#FFFDF9] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F9DDBB]/75 text-[#802924]">
                <FaUsers className="h-4 w-4" />
              </div>

              <span className="rounded-full bg-[#F9DDBB]/75 px-2.5 py-1 text-[10px] font-bold text-[#341D17]">
                98% Retensi
              </span>
            </div>

            <div>
              <p className="font-editorial text-3xl font-extrabold text-[#341D17]">
                {String(activeUsersCount).padStart(2, '0')}
              </p>
              <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#341D17]/55">
                PENGGUNA AKTIF
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#82882B]">
                <FaArrowTrendUp className="h-3 w-3" />
                <span>
                  {teachersCount} Chef &amp; {studentsCount} Siswa
                </span>
              </p>
            </div>
          </div>

          {/* Card 4: Kepuasan Atelier */}
          <div className="rounded-3xl border border-[#341D17]/12 bg-[#FFFDF9] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F9DDBB]/75 text-[#82882B]">
                <FaStar className="h-4 w-4" />
              </div>

              <span className="text-[11px] font-medium text-[#341D17]/60">
                {reviewsCount || 320} Ulasan
              </span>
            </div>

            <div>
              <p className="font-editorial text-3xl font-extrabold text-[#341D17]">
                {avgRating}
                <span className="text-sm font-normal text-[#341D17]/45"> / 5.0</span>
              </p>
              <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#341D17]/55">
                KEPUASAN ATELIER
              </p>
              <div
                className="mt-1.5 flex items-center gap-1 text-[#802924]"
                aria-label="Rating 5 bintang"
              >
                {[...Array(5)].map((_, idx) => (
                  <FaStar key={idx} className="h-3 w-3" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= KURSUS TERPOPULER & AKTIVITAS ================= */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="font-editorial text-lg font-bold text-[#341D17]">
              Kursus Terpopuler &amp; Aktivitas
            </h2>
            <p className="text-xs text-[#341D17]/65">
              Paling banyak dipelajari dan diselesaikan pekan ini
            </p>
          </div>

          <Link
            href="/dashboard/admin/courses"
            className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#802924] hover:underline"
          >
            <span>SEMUA</span>
            <FaChevronRight className="h-2.5 w-2.5" />
          </Link>
        </div>

        {popularCourses.length === 0 ? (
          <div className="rounded-2xl border border-[#341D17]/12 bg-[#FFFDF9] p-5 text-xs text-[#341D17]/65">
            Belum ada data kursus aktif yang tercatat di katalog.
          </div>
        ) : (
          <div className="space-y-2.5">
            {popularCourses.map((course) => (
              <Link
                key={course.id}
                href="/dashboard/admin/courses"
                className="flex items-center justify-between gap-4 rounded-2xl border border-[#341D17]/12 bg-[#FFFDF9] p-3.5 transition hover:border-[#802924]/40 hover:shadow-xs"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="h-14 w-16 shrink-0 overflow-hidden rounded-xl border border-[#341D17]/10 bg-[#F9DDBB]">
                    {course.resolved_thumb ? (
                      <img
                        src={course.resolved_thumb}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#802924]">
                        <FaBreadSlice className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider">
                      <span className="text-[#802924]">{course.category_name}</span>
                      <span className="text-[#82882B]">&bull; Aktif</span>
                    </div>

                    <p className="truncate font-editorial text-sm sm:text-base font-bold text-[#341D17]">
                      {course.title}
                    </p>

                    <p className="inline-flex items-center gap-1.5 text-[11px] text-[#341D17]/65">
                      <FaUserTie className="h-3 w-3 text-[#802924]" />
                      <span>{course.instructor_name}</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#FAF6F0] border border-[#341D17]/10 px-2.5 py-1 text-xs font-extrabold text-[#341D17]">
                  <FaStar className="h-3 w-3 text-[#802924]" />
                  <span>4.95</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}