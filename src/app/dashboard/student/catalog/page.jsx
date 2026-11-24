import fs from 'fs';
import path from 'path';
import StudentCourseCatalogClient from '@/components/student/StudentCourseCatalogClient';

export const dynamic = 'force-dynamic';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const STOP_WORDS = new Set([
  'dan',
  'atau',
  'dengan',
  'untuk',
  'yang',
  'ala',
  'klasik',
  'modern',
  'spesial',
  'premium',
  'tradisional',
  'dasar',
  'masterclass',
  'teknik',
]);

function pickFirst(obj, keys, fallback = '') {
  for (const key of keys) {
    if (
      obj &&
      obj[key] !== undefined &&
      obj[key] !== null &&
      String(obj[key]).trim() !== '' &&
      String(obj[key]).trim().toLowerCase() !== 'null'
    ) {
      return obj[key];
    }
  }
  return fallback;
}

function normalizeImageSrc(rawVal) {
  const s = String(rawVal || '').trim();
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') {
    return '';
  }
  if (
    s.startsWith('http://') ||
    s.startsWith('https://') ||
    s.startsWith('data:image/') ||
    s.startsWith('/')
  ) {
    return s;
  }
  return `/${s.replace(/^\.?\//, '')}`;
}

function normalizeToken(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function scanLocalCourseImages() {
  const images = [];
  const publicDir = path.join(process.cwd(), 'public');
  const roots = [
    path.join(publicDir, 'pictures'),
    path.join(publicDir, 'images'),
    path.join(publicDir, 'img'),
  ];

  for (const baseDir of roots) {
    const relBase = path.relative(publicDir, baseDir);

    function walk(currentDir, relativeParts = []) {
      if (!fs.existsSync(currentDir)) return;
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          walk(path.join(currentDir, entry.name), [...relativeParts, entry.name]);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (!IMAGE_EXTENSIONS.has(ext)) continue;
          const baseName = entry.name.slice(0, -ext.length);
          const urlParts = [
            ...relBase.split(path.sep).filter(Boolean),
            ...relativeParts,
            entry.name,
          ].map(encodeURIComponent);

          images.push({
            url: `/${urlParts.join('/')}`,
            fileKey: normalizeToken(baseName),
            folderKey: normalizeToken(relativeParts.join(' ')),
          });
        }
      }
    }

    try {
      walk(baseDir);
    } catch {
      // Abaikan jika folder tidak ada
    }
  }

  return images;
}

function matchImageForCourse(courseTitle, courseCategory, images) {
  const titleNorm = normalizeToken(courseTitle);
  const catNorm = normalizeToken(courseCategory);
  if (!titleNorm || images.length === 0) return '';

  const titleKeywords = titleNorm
    .split(' ')
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

  let bestUrl = '';
  let bestScore = 0;

  for (const img of images) {
    if (!img.fileKey) continue;
    let score = 0;

    if (img.fileKey === titleNorm) {
      score += 100;
    } else if (
      img.fileKey.length >= 4 &&
      (titleNorm.includes(img.fileKey) || img.fileKey.includes(titleNorm))
    ) {
      score += 80;
    }

    const fileWords = new Set(img.fileKey.split(' ').filter(Boolean));
    for (const kw of titleKeywords) {
      if (fileWords.has(kw)) {
        score += 20;
      } else if (img.fileKey.includes(kw)) {
        score += 10;
      }
    }

    if (img.folderKey && catNorm) {
      for (const ft of img.folderKey.split(' ').filter((t) => t.length >= 3)) {
        if (catNorm.includes(ft)) score += 8;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestUrl = img.url;
    }
  }

  return bestScore >= 20 ? bestUrl : '';
}

async function getExistingPublicTables(pool) {
  const res = await pool
    .query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    )
    .catch(() => null);
  const set = new Set();
  if (Array.isArray(res?.rows)) {
    for (const r of res.rows) {
      if (r?.table_name) set.add(String(r.table_name).toLowerCase());
    }
  }
  return set;
}

async function fetchCatalogDataFromDb() {
  const localImages = scanLocalCourseImages();

  try {
    const dbModule = await import('@/lib/db').catch(() => null);
    const pool = dbModule?.default?.query
      ? dbModule.default
      : dbModule?.pool?.query
        ? dbModule.pool
        : null;

    if (!pool) return { courses: [], enrolledCourseIds: [] };

    const existingTables = await getExistingPublicTables(pool);
    if (!existingTables.has('courses')) {
      return { courses: [], enrolledCourseIds: [] };
    }

    const courseRes = await pool
      .query('SELECT * FROM courses ORDER BY id ASC')
      .catch(() => null);

    const courseRows = Array.isArray(courseRes?.rows) ? courseRes.rows : [];

    const categoryById = new Map();
    const catTable = existingTables.has('categories')
      ? 'categories'
      : existingTables.has('course_categories')
        ? 'course_categories'
        : '';

    if (catTable) {
      const catRes = await pool
        .query(`SELECT * FROM ${catTable}`)
        .catch(() => null);
      if (Array.isArray(catRes?.rows)) {
        for (const catRow of catRes.rows) {
          const catId = pickFirst(catRow, ['id', 'category_id']);
          const catName = pickFirst(catRow, [
            'name',
            'title',
            'category_name',
            'label',
          ]);
          if (catId !== '' && catName !== '') {
            categoryById.set(String(catId), String(catName).trim());
          }
        }
      }
    }

    const instructorById = new Map();
    const hasInstructorId = courseRows.some(
      (r) => pickFirst(r, ['instructor_id', 'teacher_id', 'user_id']) !== ''
    );
    if (hasInstructorId && existingTables.has('users')) {
      const userRes = await pool.query('SELECT * FROM users').catch(() => null);
      if (Array.isArray(userRes?.rows)) {
        for (const u of userRes.rows) {
          const uid = pickFirst(u, ['id', 'user_id']);
          const uname = pickFirst(u, [
            'full_name',
            'fullName',
            'name',
            'username',
          ]);
          if (uid !== '' && uname !== '') {
            instructorById.set(String(uid), String(uname).trim());
          }
        }
      }
    }

    const courses = courseRows.map((row, idx) => {
      const rawId = pickFirst(row, ['id', 'course_id'], idx + 1);
      const id = Number(rawId) || idx + 1;
      const title = String(
        pickFirst(
          row,
          ['title', 'course_title', 'name'],
          `Kursus #${idx + 1}`
        )
      ).trim();
      const description = String(
        pickFirst(
          row,
          ['description', 'summary', 'short_description'],
          'Kelas praktik baking & pastry bersama instruktur Yugyo Atelier.'
        )
      ).trim();

      const rawCatId = String(
        pickFirst(row, ['category_id', 'course_category_id'])
      );
      const category = String(
        pickFirst(
          row,
          ['category', 'category_name'],
          categoryById.get(rawCatId) || 'Bread & Yeast Goods'
        )
      ).trim();

      const rawInstId = String(
        pickFirst(row, ['instructor_id', 'teacher_id', 'user_id'])
      );
      const instructor = String(
        pickFirst(
          row,
          ['instructor', 'instructor_name', 'teacher_name'],
          instructorById.get(rawInstId) || 'Chef Yugyo'
        )
      ).trim();

      const rawThumb = pickFirst(row, [
        'thumbnail',
        'thumbnail_url',
        'image_url',
        'image',
        'gambar',
        'picture',
        'picture_url',
        'photo',
        'photo_url',
        'cover',
        'cover_url',
        'banner',
        'banner_url',
        'img_url',
        'image_path',
      ]);

      const thumbnail =
        normalizeImageSrc(rawThumb) ||
        matchImageForCourse(title, category, localImages);

      return {
        id,
        title,
        description,
        category,
        instructor,
        rating: String(pickFirst(row, ['rating'], '4.9')).trim(),
        studentsCount: String(
          pickFirst(row, ['students_count', 'enrolled_count'], '120')
        ).trim(),
        badge: String(pickFirst(row, ['badge', 'tag'], 'KELAS ATELIER')).trim(),
        thumbnail,
      };
    });

    let enrolledCourseIds = [];
    if (existingTables.has('student_enrollments')) {
      const studentRes = await pool
        .query(
          "SELECT id FROM users WHERE LOWER(COALESCE(role, '')) IN ('student', 'siswa') ORDER BY id ASC LIMIT 1"
        )
        .catch(() => null);
      const studentId = Number(studentRes?.rows?.[0]?.id) || null;

      const enrollRes = studentId
        ? await pool
            .query(
              'SELECT course_id FROM student_enrollments WHERE student_id = $1',
              [studentId]
            )
            .catch(() => null)
        : await pool
            .query('SELECT course_id FROM student_enrollments')
            .catch(() => null);

      if (Array.isArray(enrollRes?.rows)) {
        enrolledCourseIds = enrollRes.rows
          .map((r) => Number(r?.course_id))
          .filter((n) => Number.isInteger(n) && n > 0);
      }
    }

    return { courses, enrolledCourseIds };
  } catch {
    return { courses: [], enrolledCourseIds: [] };
  }
}

export default async function StudentCatalogPage() {
  const { courses, enrolledCourseIds } = await fetchCatalogDataFromDb();
  return (
    <StudentCourseCatalogClient
      initialCourses={courses}
      initialEnrolledCourseIds={enrolledCourseIds}
    />
  );
}