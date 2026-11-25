import fs from 'node:fs/promises';
import path from 'node:path';
import Link from 'next/link';
import {
  FaBreadSlice,
  FaUser,
  FaShieldHalved,
  FaWandMagicSparkles,
  FaArrowRight,
  FaAward,
  FaMagnifyingGlass,
  FaFilter,
  FaBorderAll,
  FaXmark,
  FaTrophy,
  FaFire,
  FaStar,
  FaInfinity,
  FaCalendarDays,
  FaUserTie,
  FaGraduationCap,
} from 'react-icons/fa6';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.gif',
  '.svg',
]);

const NOISE_WORDS = new Set([
  'foto',
  'gambar',
  'picture',
  'pic',
  'img',
  'image',
  'cover',
  'thumb',
  'thumbnail',
  'course',
  'kursus',
  'kelas',
  'modul',
  'masterclass',
  'classic',
  'klasik',
  'modern',
  'otentik',
  'authentic',
  'atelier',
  'premium',
  'special',
  'spesial',
  'anti',
  'gagal',
  'dasar',
  'lanjutan',
  'teknik',
  'resep',
  'dengan',
  'untuk',
  'dan',
  'yang',
  'the',
  'and',
  'for',
  'with',
  'of',
  'in',
  'a',
  'an',
]);

const FALLBACK_COVERS = [
  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1612203985729-70726954388c?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1400&q=85',
];

const BADGE_ITEMS = [
  { label: 'Terpopuler #1', Icon: FaTrophy },
  { label: 'Hot #2', Icon: FaFire },
  { label: '#3 Pilihan Mentor', Icon: FaWandMagicSparkles },
  { label: '#4 Kurasi Praktik', Icon: FaStar },
  { label: '#5 Kurasi Atelier', Icon: FaBreadSlice },
];

function stripImageExtension(fileName) {
  return String(fileName || '').replace(
    /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i,
    ''
  );
}

function normalizePhrase(text) {
  return stripImageExtension(text)
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractKeywords(text) {
  const words = normalizePhrase(text)
    .split(' ')
    .filter((w) => w.length >= 2);
  const filtered = words.filter((w) => !NOISE_WORDS.has(w));
  return filtered.length > 0 ? filtered : words;
}

function normalizeCategoryBucket(raw) {
  const lower = String(raw || '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ');
  if (!lower) return '';
  if (
    lower.includes('bread') ||
    lower.includes('yeast') ||
    lower.includes('roti')
  ) {
    return 'bread';
  }
  if (lower.includes('decor') || lower.includes('cake')) {
    return 'cakes_decor';
  }
  if (lower.includes('cookie') || lower.includes('bite')) {
    return 'cookies';
  }
  if (
    lower.includes('french') ||
    lower.includes('patisserie') ||
    lower.includes('pastry')
  ) {
    return 'french_pastry';
  }
  if (
    lower.includes('indo') ||
    lower.includes('traditional') ||
    lower.includes('nusantara')
  ) {
    return 'indo_cakes';
  }
  return '';
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

        const baseName = stripImageExtension(entry.name);
        const normPhrase = normalizePhrase(baseName);
        const keywords = extractKeywords(baseName);
        const folderCategory =
          relSegments.length > 0 ? normalizeCategoryBucket(relSegments[0]) : '';

        const encodedUrl =
          '/pictures/courses/' +
          nextSegments.map((seg) => encodeURIComponent(seg)).join('/');

        pictures.push({
          fileName: entry.name,
          normPhrase,
          keywords,
          folderCategory,
          url: encodedUrl,
        });
      }
    }
  }

  await walk(rootDir, []);
  return pictures;
}

function scorePictureMatch(courseTitle, courseCategory, pic) {
  const normTitle = normalizePhrase(courseTitle);
  if (!normTitle || !pic.normPhrase) return 0;

  const courseCatBucket = normalizeCategoryBucket(courseCategory);
  let score = 0;

  if (pic.normPhrase === normTitle) {
    score = 1000;
  } else if (
    pic.normPhrase.length >= 3 &&
    (normTitle.includes(pic.normPhrase) || pic.normPhrase.includes(normTitle))
  ) {
    score = 800 + Math.min(150, pic.normPhrase.length * 4);
  } else {
    const titleWords = normTitle.split(' ');
    const titleKeywords = extractKeywords(courseTitle);
    const fileKeywords = pic.keywords;

    if (fileKeywords.length === 0 || titleKeywords.length === 0) return 0;

    let matchedCount = 0;
    for (const fKw of fileKeywords) {
      const exactHit =
        titleWords.includes(fKw) || titleKeywords.includes(fKw);
      const partialHit =
        !exactHit &&
        fKw.length >= 4 &&
        titleKeywords.some(
          (tKw) =>
            tKw.length >= 4 && (tKw.includes(fKw) || fKw.includes(tKw))
        );

      if (exactHit) {
        matchedCount += 1;
      } else if (partialHit) {
        matchedCount += 0.85;
      }
    }

    if (matchedCount <= 0) return 0;

    const fileCoverage = matchedCount / fileKeywords.length;
    const titleCoverage = matchedCount / titleKeywords.length;

    if (fileCoverage >= 0.99) {
      score = 620 + Math.round(titleCoverage * 150);
    } else if (fileCoverage >= 0.5 || matchedCount >= 1) {
      score = Math.round(250 + fileCoverage * 220 + titleCoverage * 120);
    }
  }

  if (score > 0 && pic.folderCategory && courseCatBucket) {
    if (pic.folderCategory === courseCatBucket) {
      score += 45;
    } else if (pic.normPhrase !== normTitle) {
      score -= 80;
    }
  }

  return score;
}

function resolveCourseCover(course, pictures, fallbackIdx) {
  let bestPic = null;
  let bestScore = 0;

  for (const pic of pictures) {
    const sc = scorePictureMatch(course.title, course.category_name, pic);
    if (sc > bestScore) {
      bestScore = sc;
      bestPic = pic;
    }
  }

  if (bestScore >= 250 && bestPic) {
    return bestPic.url;
  }

  const dbThumb = String(course?.thumbnail_url || '').trim();
  if (dbThumb) {
    return dbThumb;
  }

  return FALLBACK_COVERS[fallbackIdx % FALLBACK_COVERS.length];
}

function ScheduleBadgeContent({ startVal, endVal }) {
  if (!startVal && !endVal) {
    return (
      <>
        <FaInfinity className="w-3 h-3 shrink-0" />
        <span>Lifetime Access</span>
      </>
    );
  }
  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '?';
  return (
    <>
      <FaCalendarDays className="w-3 h-3 shrink-0" />
      <span>
        {fmt(startVal)} – {fmt(endVal)}
      </span>
    </>
  );
}

export default async function GuestHomepageCatalog({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const selectedCategory = resolvedSearchParams?.category || 'all';
  const searchQuery = resolvedSearchParams?.q?.trim() || '';

  let categoriesList = [];
  let coursesList = [];
  let coursePictures = [];

  try {
    const [catRes, pictures] = await Promise.all([
      pool.query('SELECT id, name FROM categories ORDER BY name ASC;'),
      scanCoursePictures(),
    ]);
    categoriesList = catRes.rows;
    coursePictures = pictures;

    let query = `
      SELECT 
        c.id,
        c.title,
        c.description,
        c.thumbnail_url,
        c.start_date,
        c.end_date,
        cat.name AS category_name,
        u.full_name AS instructor_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE LOWER(c.status) = 'active'
    `;
    const params = [];

    if (selectedCategory !== 'all') {
      params.push(selectedCategory);
      query += ` AND cat.name = $${params.length}`;
    }

    if (searchQuery) {
      params.push(`%${searchQuery}%`);
      query += ` AND (LOWER(c.title) LIKE LOWER($${params.length}) OR LOWER(c.description) LIKE LOWER($${params.length}) OR LOWER(u.full_name) LIKE LOWER($${params.length}))`;
    }

    query += ` ORDER BY c.id DESC;`;

    const courseRes = await pool.query(query, params);
    coursesList = courseRes.rows;
  } catch (err) {
    console.error('Database Error on Guest Homepage:', err);
  }

  return (
    <div className="min-h-screen bg-[#F9DDBB] text-[#341D17] pb-24 selection:bg-[#802924] selection:text-[#F9DDBB]">
      {/* ================= TOP NAVBAR ================= */}
      <header className="sticky top-0 z-40 bg-[#F9DDBB]/95 backdrop-blur-md border-b border-[#341D17]/15">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-[#341D17] text-[#F9DDBB] flex items-center justify-center shadow-xs group-hover:bg-[#802924] transition-colors">
              <FaBreadSlice className="w-4 h-4" />
            </div>
            <div>
              <span className="font-editorial font-bold text-base sm:text-lg text-[#341D17] block leading-none">
                YUGYO
              </span>
              <span className="text-[9px] font-bold tracking-[0.22em] uppercase text-[#802924]">
                ATELIER BELAJAR
              </span>
            </div>
          </Link>

          <div className="flex items-center">
            <Link
              href="/login?from=courses"
              aria-label="Masuk Akun"
              className="w-9 h-9 rounded-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] flex items-center justify-center shadow-sm transition"
            >
              <FaUser className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {/* ================= BANNER MODE TAMU ================= */}
        <section className="bg-[#341D17] text-[#F9DDBB] rounded-2xl p-3.5 sm:px-5 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#82882B] text-white flex items-center justify-center shrink-0">
              <FaShieldHalved className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#F9DDBB]/80">
                MODE TAMU (GUEST)
              </p>
              <p className="text-xs text-[#F9DDBB] font-medium">
                Masuk untuk simpan progres belajar &amp; sertifikat atelier
              </p>
            </div>
          </div>

          <Link
            href="/register/student"
            className="bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition shrink-0"
          >
            Daftar
          </Link>
        </section>

        {/* ================= HERO PROMO CARD ================= */}
        <section className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="max-w-xl relative z-10">
            <span className="inline-flex items-center gap-1.5 bg-[#82882B] text-white px-3 py-1 rounded-full text-[11px] font-bold mb-4">
              <FaWandMagicSparkles className="w-3 h-3 shrink-0" />
              <span>Atelier Musim Gugur</span>
            </span>

            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#341D17] leading-snug mb-3">
              Seni Patisserie &amp; Boulangerie di Tangan Anda
            </h1>

            <p className="text-xs sm:text-sm text-[#341D17]/75 leading-relaxed mb-6">
              Belajar teknik laminasi otentik, ragi liar, dan glazing dari maestro pastry YUGYO berstandar internasional.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#katalog-kursus"
                className="inline-flex items-center gap-2 bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] px-5 py-3 rounded-xl text-xs font-bold shadow-md transition"
              >
                <span>Jelajahi Masterclass</span>
                <FaArrowRight className="w-3.5 h-3.5 shrink-0" />
              </a>

              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#82882B]">
                <FaAward className="w-3.5 h-3.5 shrink-0" />
                <span>Akreditasi CAP Paris</span>
              </span>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="hidden md:block absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-[#F9DDBB]/60 blur-2xl"
          />
        </section>

        {/* ================= SEARCH BAR & FILTER KATEGORI ================= */}
        <section id="katalog-kursus" className="space-y-3.5 scroll-mt-20">
          <form
            method="GET"
            action="/courses"
            className="flex items-center gap-2.5"
          >
            {selectedCategory !== 'all' && (
              <input type="hidden" name="category" value={selectedCategory} />
            )}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-4 flex items-center text-[#341D17]/50">
                <FaMagnifyingGlass className="w-4 h-4" />
              </span>
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="Cari teknik pastry, chef, croissant, sourdough..."
                className="w-full bg-[#FFFDF9] border border-[#341D17]/20 rounded-2xl pl-11 pr-4 py-3 text-xs text-[#341D17] placeholder:text-[#341D17]/45 focus:outline-none focus:ring-2 focus:ring-[#802924] transition"
              />
            </div>

            <button
              type="submit"
              aria-label="Cari Kursus"
              className="w-11 h-11 rounded-2xl bg-[#341D17] hover:bg-[#802924] text-[#F9DDBB] flex items-center justify-center shrink-0 transition cursor-pointer"
            >
              <FaFilter className="w-4 h-4" />
            </button>
          </form>

          {/* Horizontal Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <Link
              href={
                searchQuery
                  ? `/courses?q=${encodeURIComponent(searchQuery)}`
                  : '/courses'
              }
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition border ${
                selectedCategory === 'all'
                  ? 'bg-[#802924] text-[#F9DDBB] border-[#802924] shadow-xs'
                  : 'bg-[#FFFDF9] text-[#341D17] border-[#341D17]/15 hover:border-[#802924]'
              }`}
            >
              <FaBorderAll className="w-3.5 h-3.5 shrink-0" />
              <span>Semua Kategori</span>
            </Link>

            {categoriesList.map((cat) => {
              const isActive = selectedCategory === cat.name;
              const href = `/courses?category=${encodeURIComponent(cat.name)}${
                searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''
              }`;

              return (
                <Link
                  key={cat.id}
                  href={href}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                    isActive
                      ? 'bg-[#802924] text-[#F9DDBB] border-[#802924] shadow-xs'
                      : 'bg-[#FFFDF9] text-[#341D17] border-[#341D17]/15 hover:border-[#802924]'
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </section>

        {/* ================= SECTION DAFTAR KURSUS ================= */}
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#802924]">
                KURIKULUM UNGGULAN
              </p>
              <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#341D17]">
                {coursesList.length} Kursus Tersedia
              </h2>
            </div>

            {(selectedCategory !== 'all' || searchQuery) && (
              <Link
                href="/courses"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#802924] hover:underline"
              >
                <span>Reset Filter</span>
                <FaXmark className="w-3 h-3 shrink-0" />
              </Link>
            )}
          </div>

          {coursesList.length === 0 ? (
            <div className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl p-10 text-center">
              <p className="font-editorial text-lg font-bold text-[#341D17] mb-1">
                Belum ada kelas pada filter ini
              </p>
              <p className="text-xs text-[#341D17]/70 mb-4">
                Coba pilih kategori lain atau reset pencarian untuk melihat seluruh katalog baking YUGYO.
              </p>
              <Link
                href="/courses"
                className="inline-block bg-[#802924] text-[#F9DDBB] px-5 py-2.5 rounded-xl text-xs font-bold"
              >
                Tampilkan Semua Kelas
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {coursesList.map((course, idx) => {
                const coverImg = resolveCourseCover(course, coursePictures, idx);
                const badgeMeta = BADGE_ITEMS[idx % BADGE_ITEMS.length];
                const BadgeIcon = badgeMeta.Icon;

                return (
                  <article
                    key={course.id}
                    className="bg-[#FFFDF9] border border-[#341D17]/15 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition"
                  >
                    {/* Banner Gambar Kursus dari public/pictures/courses */}
                    <div className="relative h-48 sm:h-60 w-full bg-[#341D17]">
                      <img
                        src={coverImg}
                        alt={course.title}
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#341D17]/80 via-transparent to-[#341D17]/20" />

                      {/* Badge Kiri Atas */}
                      <span className="inline-flex items-center gap-1.5 absolute top-3.5 left-3.5 bg-[#F9DDBB] text-[#341D17] px-3 py-1 rounded-full text-[11px] font-extrabold shadow-sm">
                        <BadgeIcon className="w-3 h-3 text-[#802924] shrink-0" />
                        <span>{badgeMeta.label}</span>
                      </span>

                      {/* Badge Kategori Kanan Atas (Pistachio Olive #82882B) */}
                      <span className="absolute top-3.5 right-3.5 bg-[#82882B] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        {course.category_name || 'Baking'}
                      </span>

                      {/* Info Bawah Gambar */}
                      <div className="absolute bottom-3.5 inset-x-3.5 flex items-center justify-between text-[#F9DDBB] text-xs">
                        <span className="font-semibold inline-flex items-center gap-1.5">
                          <FaStar className="w-3.5 h-3.5 text-[#F9DDBB] shrink-0" />
                          <span>4.9</span>
                          <span className="opacity-85">
                            ({180 + idx * 45} Siswa)
                          </span>
                        </span>

                        <span className="inline-flex items-center gap-1.5 bg-[#341D17]/85 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-[#F9DDBB]">
                          <ScheduleBadgeContent
                            startVal={course.start_date}
                            endVal={course.end_date}
                          />
                        </span>
                      </div>
                    </div>

                    {/* Isi Kartu Kursus */}
                    <div className="p-5 sm:p-6">
                      <h3 className="font-editorial text-lg sm:text-xl font-bold text-[#341D17] mb-2">
                        {course.title}
                      </h3>

                      {course.description && (
                        <p className="text-xs text-[#341D17]/75 line-clamp-2 mb-3.5 leading-relaxed">
                          {course.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-[#341D17]/85 font-semibold mb-4">
                        <span className="w-6 h-6 rounded-full bg-[#F9DDBB] text-[#802924] flex items-center justify-center shrink-0">
                          <FaUserTie className="w-3 h-3" />
                        </span>
                        <span>
                          {course.instructor_name || 'Chef YUGYO Atelier'}
                        </span>
                      </div>

                      {/* Tombol Aksi Guest */}
                      <Link
                        href="/login?from=courses"
                        className="w-full bg-[#802924] hover:bg-[#661F1B] text-[#F9DDBB] font-bold text-xs py-3 px-4 rounded-xl text-center shadow-sm transition block"
                      >
                        Daftar Kursus
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ================= BOTTOM CTA BANNER (DAFTAR GRATIS) ================= */}
        <section className="bg-[#802924] text-[#F9DDBB] rounded-3xl p-6 sm:p-8 shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#341D17]/40 flex items-center justify-center mb-4">
            <FaGraduationCap className="w-5 h-5" />
          </div>

          <h2 className="font-editorial text-xl sm:text-2xl font-bold mb-2 text-[#F9DDBB]">
            Daftar Gratis untuk Sertifikat Atelier
          </h2>

          <p className="text-xs sm:text-sm text-[#F9DDBB]/85 max-w-lg leading-relaxed mb-5">
            Uji pemahaman dasar, kumpulkan lencana keahlian, dan dapatkan sertifikasi digital terverifikasi dari YUGYO Pastry Academy.
          </p>

          <Link
            href="/register/student"
            className="inline-flex items-center gap-2 bg-[#F9DDBB] hover:bg-white text-[#341D17] font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition"
          >
            <span>Mulai Akun Siswa</span>
            <FaArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </section>
      </main>
    </div>
  );
}