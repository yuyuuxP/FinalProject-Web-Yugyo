import fs from 'fs';
import path from 'path';
import StudentCourseCatalogClient from '@/components/student/StudentCourseCatalogClient';

export const dynamic = 'force-dynamic';

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.avif',
]);

function pickFirst(obj, keys, fallback = '') {
  for (const key of keys) {
    if (
      obj &&
      obj[key] !== undefined &&
      obj[key] !== null &&
      String(obj[key]).trim() !== ''
    ) {
      return obj[key];
    }
  }
  return fallback;
}

function normalizeToken(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function scanCoursePictures() {
  const pictures = [];
  const baseDir = path.join(process.cwd(), 'public', 'pictures', 'courses');

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
        const relUrlPath = ['/pictures', 'courses', ...relativeParts, entry.name]
          .map(encodeURIComponent)
          .join('/');

        pictures.push({
          url: `/${relUrlPath.replace(/^\/+/, '')}`,
          fileKey: normalizeToken(baseName),
          folderKey: normalizeToken(relativeParts.join(' ')),
          fullKey: normalizeToken(`${relativeParts.join(' ')} ${baseName}`),
        });
      }
    }
  }

  try {
    walk(baseDir);
  } catch {
    return [];
  }

  return pictures;
}

function scorePictureMatch(pic, courseTitle, courseCategory) {
  const titleNorm = normalizeToken(courseTitle);
  const catNorm = normalizeToken(courseCategory);
  if (!titleNorm) return 0;

  let score = 0;

  if (pic.fileKey === titleNorm) {
    score += 100;
  } else if (
    pic.fileKey.length >= 3 &&
    (titleNorm.includes(pic.fileKey) || pic.fileKey.includes(titleNorm))
  ) {
    score += 60;
  }

  const titleWords = titleNorm.split(' ').filter((w) => w.length >= 3);
  const fileWords = new Set(pic.fileKey.split(' ').filter(Boolean));
  let matchedWords = 0;
  for (const w of titleWords) {
    if (fileWords.has(w)) {
      matchedWords += 1;
      score += 15;
    } else if (pic.fileKey.includes(w)) {
      matchedWords += 1;
      score += 8;
    }
  }

  if (matchedWords === 0 && score === 0) return 0;

  if (pic.folderKey && catNorm) {
    const folderTokens = pic.folderKey.split(' ').filter((t) => t.length >= 3);
    for (const ft of folderTokens) {
      if (catNorm.includes(ft)) {
        score += 10;
      }
    }
  }

  return score;
}

function resolveCourseImage(courseTitle, courseCategory, pictures, usedUrls) {
  let bestPic = null;
  let bestScore = 0;

  for (const pic of pictures) {
    const s = scorePictureMatch(pic, courseTitle, courseCategory);
    if (s > bestScore) {
      bestScore = s;
      bestPic = pic;
    }
  }

  if (bestPic && bestScore >= 15) {
    usedUrls.add(bestPic.url);
    return bestPic.url;
  }

  const catNorm = normalizeToken(courseCategory);
  const folderFallback = pictures.find((pic) => {
    if (usedUrls.has(pic.url)) return false;
    if (!pic.folderKey || !catNorm) return false;
    return pic.folderKey
      .split(' ')
      .some((t) => t.length >= 3 && catNorm.includes(t));
  });

  if (folderFallback) {
    usedUrls.add(folderFallback.url);
    return folderFallback.url;
  }

  return '';
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

async function fetchCoursesWithPictures() {
  const pictures = scanCoursePictures();
  const usedUrls = new Set();

  try {
    const dbModule = await import('@/lib/db').catch(() => null);
    const pool = dbModule?.default?.query
      ? dbModule.default
      : dbModule?.pool?.query
        ? dbModule.pool
        : null;

    if (!pool) return [];

    const existingTables = await getExistingPublicTables(pool);
    if (!existingTables.has('courses')) return [];

    const courseRes = await pool
      .query('SELECT * FROM courses ORDER BY id ASC')
      .catch(() => null);

    if (!Array.isArray(courseRes?.rows) || courseRes.rows.length === 0) {
      return [];
    }

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
    const hasInstructorId = courseRes.rows.some(
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

    return courseRes.rows.map((row, idx) => {
      const id = String(
        pickFirst(row, ['id', 'course_id', 'slug'], `course-${idx + 1}`)
      );
      const title = String(
        pickFirst(
          row,
          ['title', 'course_title', 'name'],
          `Kursus #${idx + 1}`
        )
      ).trim();

      const rawCatId = String(
        pickFirst(row, ['category_id', 'course_category_id'])
      );
      const category = String(
        pickFirst(
          row,
          ['category', 'category_name'],
          categoryById.get(rawCatId) || 'French Patisserie & Pastry'
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

      const rating = String(pickFirst(row, ['rating', 'avg_rating'], '4.9'));
      const studentsCount = Number(
        pickFirst(
          row,
          ['students_count', 'studentsCount', 'enrolled_count'],
          120
        )
      );
      const badge = String(
        pickFirst(row, ['badge', 'tag', 'level'], 'Kelas Atelier')
      ).trim();
      const accessLabel = String(
        pickFirst(
          row,
          ['access_label', 'accessLabel', 'access_type'],
          'Akses Terbuka'
        )
      ).trim();
      const summary = String(
        pickFirst(
          row,
          ['summary', 'description', 'short_description'],
          'Materi praktik kelas baking & pastry di Yugyo Atelier.'
        )
      ).trim();

      const dbImage = String(
        pickFirst(row, [
          'image_url',
          'thumbnail_url',
          'photo_url',
          'cover_url',
          'image',
        ])
      ).trim();

      const matchedImage =
        resolveCourseImage(title, category, pictures, usedUrls) || dbImage;

      return {
        id,
        title,
        category,
        instructor,
        rating,
        studentsCount: Number.isNaN(studentsCount) ? 0 : studentsCount,
        badge,
        accessLabel,
        summary,
        imageUrl: matchedImage,
      };
    });
  } catch {
    return [];
  }
}

export default async function StudentCatalogPage() {
  const initialCourses = await fetchCoursesWithPictures();
  return <StudentCourseCatalogClient initialCourses={initialCourses} />;
}