import { cookies } from 'next/headers';
import fs from 'node:fs/promises';
import path from 'node:path';
import pool from '@/lib/db';
import ContentManagementClient from '@/components/teacher/ContentManagementClient';

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
      // Lewati folder jika belum ada di disk
    }
  }

  matched.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return matched;
}

async function getAuthenticatedTeacher() {
  const cookieStore = await cookies();
  const rawId = cookieStore.get('yugyo_user_id')?.value;

  if (rawId && Number.isInteger(Number(rawId)) && Number(rawId) > 0) {
    const res = await pool.query(
      "SELECT id, full_name, email, role, status, specialty FROM users WHERE id = $1 AND role IN ('instructor', 'teacher') LIMIT 1;",
      [Number(rawId)]
    );
    if (res.rows.length > 0) return res.rows[0];
  }

  const fallback = await pool.query(
    "SELECT id, full_name, email, role, status, specialty FROM users WHERE role IN ('instructor', 'teacher') AND COALESCE(status, 'active') = 'active' ORDER BY id ASC LIMIT 1;"
  );
  return fallback.rows[0] || null;
}

export default async function TeacherContentsPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const requestedCourseId = Number(resolvedParams?.courseId);

  const teacher = await getAuthenticatedTeacher();

  let courses = [];
  let selectedCourse = null;
  let courseContents = [];
  let matchedVideos = [];

  if (teacher?.id) {
    const coursesRes = await pool.query(
      `SELECT
        c.id,
        c.title,
        c.description,
        c.thumbnail_url,
        c.status,
        COALESCE(cat.name, 'Atelier Baking') AS category_name
      FROM courses c
      LEFT JOIN categories cat ON cat.id = c.category_id
      WHERE c.instructor_id = $1
      ORDER BY c.id ASC;`,
      [teacher.id]
    );

    courses = coursesRes.rows || [];

    if (courses.length > 0) {
      selectedCourse =
        courses.find((c) => Number(c.id) === requestedCourseId) || courses[0];

      const contentsRes = await pool.query(
        `SELECT *
         FROM course_contents
         WHERE course_id = $1
         ORDER BY order_index ASC NULLS LAST, id ASC;`,
        [selectedCourse.id]
      );

      courseContents = (contentsRes.rows || []).map((row, idx) => ({
        ...row,
        description: row.description ?? row.summary ?? '',
        summary: row.description ?? row.summary ?? '',
        video_url: row.video_url ?? row.media_url ?? null,
        media_url: row.video_url ?? row.media_url ?? null,
        order_index: row.order_index ?? row.sort_order ?? idx + 1,
        sort_order: row.order_index ?? row.sort_order ?? idx + 1,
        status: row.status ?? 'published',
      }));

      matchedVideos = await findMatchedVideosForCourse(selectedCourse.title);
    }
  }

  return (
    <ContentManagementClient
      teacher={teacher}
      courses={courses}
      selectedCourse={selectedCourse}
      initialContents={courseContents}
      matchedVideos={matchedVideos}
    />
  );
}