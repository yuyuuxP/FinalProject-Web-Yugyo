import fs from 'node:fs/promises';
import path from 'node:path';
import pool from '@/lib/db';
import AdminCourseDetailModal from '@/components/admin/AdminCourseDetailModal';

export const dynamic = 'force-dynamic';

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.mkv']);
const CATEGORY_FOLDERS = [
  'bread',
  'cakes_decor',
  'cookies',
  'french_pastry',
  'indo_cakes',
];

const GENERIC_WORDS = new Set([
  'masterclass',
  'classic',
  'kelas',
  'kursus',
  'modul',
  'sesi',
  'dasar',
  'lanjutan',
  'otentik',
  'authentic',
  'klasik',
  'modern',
  'atelier',
  'anti',
  'gagal',
  'pain',
  'cake',
  'cakes',
  'bread',
  'cookie',
  'cookies',
  'pastry',
  'special',
  'spesial',
  'double',
  'with',
  'dan',
  'the',
]);

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\.(mp4|webm|mov|m4v|mkv)$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCoreKeywords(text) {
  const words = normalizeText(text)
    .split(' ')
    .filter((w) => w.length >= 2);
  const core = words.filter((w) => !GENERIC_WORDS.has(w));
  return core.length > 0 ? core : words;
}

function humanizeFileName(fileName) {
  return String(fileName || '')
    .replace(/\.(mp4|webm|mov|m4v|mkv)$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function isVideoRelevantToCourse(courseTitle, fileName) {
  const normCourse = normalizeText(courseTitle);
  const normFile = normalizeText(fileName);
  if (!normCourse || !normFile) return false;

  if (normFile.includes(normCourse) || normCourse.includes(normFile)) {
    return true;
  }

  const coreKeywords = getCoreKeywords(courseTitle);
  if (coreKeywords.length === 0) return false;
  return coreKeywords.every((kw) => normFile.includes(kw));
}

async function findMatchedVideosForCourse(courseTitle) {
  const videosRoot = path.join(process.cwd(), 'public', 'videos');
  const normCourse = normalizeText(courseTitle);
  if (!normCourse) return [];

  const matched = [];

  for (const folder of CATEGORY_FOLDERS) {
    const folderPath = path.join(videosRoot, folder);
    try {
      const entries = await fs.readdir(folderPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const ext = path.extname(entry.name).toLowerCase();
        if (!VIDEO_EXTENSIONS.has(ext)) continue;

        if (isVideoRelevantToCourse(courseTitle, entry.name)) {
          const normFile = normalizeText(entry.name);
          const isExact =
            normFile === normCourse ||
            normFile.includes(normCourse) ||
            normCourse.includes(normFile);

          matched.push({
            fileName: entry.name,
            title: humanizeFileName(entry.name),
            folder,
            mediaUrl: `/videos/${folder}/${entry.name}`,
            score: isExact ? 100 : 50,
          });
        }
      }
    } catch {
      // Lewati folder jika belum ada
    }
  }

  matched.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return matched;
}

export default async function AdminCourseDetailPage({ params }) {
  const { id } = await params;
  const courseId = Number(id);

  let course = null;
  let contents = [];

  if (Number.isInteger(courseId) && courseId > 0) {
    const courseRes = await pool.query(
      `SELECT
        c.id,
        c.title,
        c.description,
        c.thumbnail_url,
        c.status,
        c.instructor_id,
        COALESCE(cat.name, 'Atelier Baking') AS category_name,
        u.full_name AS instructor_name,
        u.specialty AS instructor_specialty
      FROM courses c
      LEFT JOIN categories cat ON cat.id = c.category_id
      LEFT JOIN users u ON u.id = c.instructor_id
      WHERE c.id = $1
      LIMIT 1;`,
      [courseId]
    );

    course = courseRes.rows[0] || null;

    const contentsRes = await pool.query(
      `SELECT
        id,
        course_id,
        title,
        description,
        video_url,
        order_index,
        status
      FROM course_contents
      WHERE course_id = $1
      ORDER BY order_index ASC NULLS LAST, id ASC;`,
      [courseId]
    );

    const dbRows = (contentsRes.rows || []).map((row, idx) => ({
      ...row,
      description: row.description ?? '',
      video_url: row.video_url ?? null,
      order_index: row.order_index ?? idx + 1,
      status: row.status ?? 'published',
    }));

    const matchedVideos = course?.title
      ? await findMatchedVideosForCourse(course.title)
      : [];

    const seenSig = new Set(
      dbRows.map(
        (r) =>
          `${String(r.title || '').trim().toLowerCase()}::${String(
            r.video_url || ''
          )
            .trim()
            .toLowerCase()}`
      )
    );

    const mergedList = [...dbRows];
    for (let j = 0; j < matchedVideos.length; j += 1) {
      const vid = matchedVideos[j];
      const sig = `${String(vid.title || '').trim().toLowerCase()}::${String(
        vid.mediaUrl || ''
      )
        .trim()
        .toLowerCase()}`;
      if (seenSig.has(sig)) continue;
      seenSig.add(sig);

      mergedList.push({
        id: `folder-${courseId}-${vid.fileName}-${j}`,
        course_id: courseId,
        title: vid.title,
        description: '',
        video_url: vid.mediaUrl,
        order_index: mergedList.length + 1,
        status: 'published',
      });
    }

    contents = mergedList;
  }

  return (
    <AdminCourseDetailModal
      course={course}
      contents={contents}
      courseId={courseId}
    />
  );
}